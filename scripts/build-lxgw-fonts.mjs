import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "static", "fonts", "lxgw-wenkai");

let packageRoot;
try {
  packageRoot = path.dirname(require.resolve("lxgw-wenkai-webfont/package.json"));
} catch {
  console.error("Run npm install before building the local LXGW WenKai subset.");
  process.exit(1);
}

const sourceFiles = [
  path.join(packageRoot, "lxgwwenkai-regular.css"),
  path.join(packageRoot, "lxgwwenkai-bold.css"),
];

for (const sourceFile of sourceFiles) {
  if (!fs.existsSync(sourceFile)) throw new Error(`Missing font CSS: ${sourceFile}`);
}

const textRoots = ["archetypes", "assets", "config", "content", "data", "layouts", "static"];
const textExtensions = new Set([".css", ".html", ".js", ".md", ".yaml", ".yml"]);
const characters = new Set();

function collectText(directory) {
  if (!fs.existsSync(directory)) return;
  if (path.resolve(directory) === outputRoot) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectText(entryPath);
      continue;
    }

    if (!textExtensions.has(path.extname(entry.name))) continue;
    const source = fs.readFileSync(entryPath, "utf8");
    for (const character of source.replace(/\{\{[\s\S]*?\}\}/g, "")) {
      characters.add(character.codePointAt(0));
    }
  }
}

for (const textRoot of textRoots) collectText(path.join(projectRoot, textRoot));

function parseUnicodeRange(value) {
  const ranges = [];

  for (const token of value.split(",").map((item) => item.trim())) {
    const match = token.match(/^u\+([0-9a-f]+)(?:-([0-9a-f]+)|(\?+))?$/i);
    if (!match) continue;

    if (match[3]) {
      const wildcardCount = match[3].length;
      const base = match[1].slice(0, match[1].length - wildcardCount);
      const start = Number.parseInt(`${base}${"0".repeat(wildcardCount)}`, 16);
      const end = Number.parseInt(`${base}${"f".repeat(wildcardCount)}`, 16);
      ranges.push([start, end]);
    } else {
      ranges.push([
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2] || match[1], 16),
      ]);
    }
  }

  return ranges;
}

function blockCoversUsedCharacters(block) {
  const rangeMatch = block.match(/unicode-range:\s*([^;}]+)/i);
  if (!rangeMatch) return false;

  return parseUnicodeRange(rangeMatch[1]).some(([start, end]) => {
    for (const character of characters) {
      if (character >= start && character <= end) return true;
    }
    return false;
  });
}

function transformBlock(block) {
  return block
    .replace(/font-family:\s*(['"])LXGW WenKai\1/i, "font-family: $1LXGW WenKai Local$1")
    .replace(/url\('\.\/files\/([^']+)'\)/g, "url('files/$1')");
}

const outputBlocks = [];
const outputFonts = new Set();

for (const sourceFile of sourceFiles) {
  const source = fs.readFileSync(sourceFile, "utf8");
  const blocks = source.match(/@font-face\s*\{[^}]+\}/g) || [];

  for (const block of blocks) {
    if (!blockCoversUsedCharacters(block)) continue;

    const srcMatch = block.match(/src:\s*url\('\.\/files\/([^']+)'\)/);
    if (!srcMatch) continue;

    outputBlocks.push(transformBlock(block));
    outputFonts.add(srcMatch[1]);
  }
}

if (!outputBlocks.length) throw new Error("No LXGW WenKai subsets matched project text.");

const resolvedOutputRoot = path.resolve(outputRoot);
if (!resolvedOutputRoot.startsWith(path.resolve(projectRoot, "static") + path.sep)) {
  throw new Error("Refusing to write outside static/fonts/lxgw-wenkai.");
}

fs.rmSync(resolvedOutputRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(resolvedOutputRoot, "files"), { recursive: true });

for (const fontFile of outputFonts) {
  fs.copyFileSync(path.join(packageRoot, "files", fontFile), path.join(resolvedOutputRoot, "files", fontFile));
}

for (const licenseFile of ["OFL.txt", "LICENSE", "VERSION"]) {
  const source = path.join(packageRoot, licenseFile);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(resolvedOutputRoot, licenseFile));
}

const packageVersion = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")).version;
const generatedCss = `/* Generated from lxgw-wenkai-webfont ${packageVersion}. Run npm run build:fonts after content changes. */\n${outputBlocks.join("\n\n")}\n`;
fs.writeFileSync(path.join(resolvedOutputRoot, "local.css"), generatedCss, "utf8");

const fontCount = outputFonts.size;
const fontBytes = [...outputFonts].reduce((total, fontFile) => {
  return total + fs.statSync(path.join(resolvedOutputRoot, "files", fontFile)).size;
}, 0);

console.log(`Generated ${fontCount} LXGW WenKai chunks (${(fontBytes / 1024).toFixed(1)} KiB).`);
