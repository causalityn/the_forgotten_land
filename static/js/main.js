(function () {
  const root = document.documentElement;
  const storage = window.localStorage;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function parseUnicodeRange(value) {
    const ranges = [];

    for (const token of value.split(",").map((item) => item.trim())) {
      const match = token.match(/^u\+([0-9a-f]+)(?:-([0-9a-f]+)|(\?+))?$/i);
      if (!match) continue;

      if (match[3]) {
        const wildcardCount = match[3].length;
        const base = match[1].slice(0, match[1].length - wildcardCount);
        ranges.push([
          Number.parseInt(`${base}${"0".repeat(wildcardCount)}`, 16),
          Number.parseInt(`${base}${"f".repeat(wildcardCount)}`, 16),
        ]);
      } else {
        ranges.push([
          Number.parseInt(match[1], 16),
          Number.parseInt(match[2] || match[1], 16),
        ]);
      }
    }

    return ranges;
  }

  function loadWenKaiFallback() {
    const localRanges = Array.from(document.fonts)
      .filter((font) => font.family === "LXGW WenKai Local")
      .flatMap((font) => parseUnicodeRange(font.unicodeRange || ""));
    const needsFallback = Array.from(document.body.textContent || "").some((character) => {
      const codePoint = character.codePointAt(0);
      if (codePoint <= 0x20 || codePoint === 0x7f) return false;
      return !localRanges.some(([start, end]) => codePoint >= start && codePoint <= end);
    });

    if (!needsFallback) return;

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://cdn.jsdelivr.net";
    preconnect.crossOrigin = "anonymous";
    document.head.appendChild(preconnect);

    const stylesheets = [
      {
        href: "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css",
        integrity: "sha384-usAwS4GuP3EymPRjfL7yc7ZFZZl45NeR7Lbl/krLMVINoRHVKYgQG/6WTGXNyNOH",
      },
      {
        href: "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css",
        integrity: "sha384-wvyC9BCHtJEZ8WmLkhXV9p66P71K/TY9GjKAotcuTWdws6Bxynnh1tNPyc5+N9yA",
      },
    ];

    for (const stylesheet of stylesheets) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = stylesheet.href;
      link.integrity = stylesheet.integrity;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    }
  }

  loadWenKaiFallback();

  function readStorage(key) {
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      storage.setItem(key, value);
    } catch (error) {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }

  function resolveTheme(mode) {
    if (mode === "dark" || mode === "light") return mode;
    return darkQuery.matches ? "dark" : "light";
  }

  function applyTheme(mode) {
    const resolved = resolveTheme(mode);
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.theme = mode;

    document.querySelectorAll("[data-theme-label]").forEach((node) => {
      node.textContent = resolved === "dark" ? "切换到浅色模式" : "切换到深色模式";
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", resolved === "dark" ? "#121212" : "#f8f8f6");
  }

  function getStoredTheme() {
    return readStorage("theme") || "system";
  }

  applyTheme(getStoredTheme());

  darkQuery.addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.classList.contains("dark") ? "light" : "dark";
      writeStorage("theme", next);
      applyTheme(next);
    });
  });

  const navGroups = Array.from(document.querySelectorAll(".nav-group"));

  function setNavOpen(group, open) {
    const trigger = group.querySelector(".nav-trigger");
    if (!trigger) return;

    group.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  navGroups.forEach((group) => {
    const trigger = group.querySelector(".nav-trigger");

    if (trigger) {
      trigger.addEventListener("click", () => {
        setNavOpen(group, !group.classList.contains("is-open"));
      });
    }

    group.addEventListener("focusout", (event) => {
      if (!group.contains(event.relatedTarget)) setNavOpen(group, false);
    });
  });

  document.addEventListener("click", (event) => {
    navGroups.forEach((group) => {
      if (!group.contains(event.target)) setNavOpen(group, false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    let closedByKeyboard = false;
    navGroups.forEach((group) => {
      if (!group.classList.contains("is-open")) return;

      setNavOpen(group, false);
      closedByKeyboard = true;
    });

    if (closedByKeyboard) {
      const firstTrigger = navGroups[0] && navGroups[0].querySelector(".nav-trigger");
      if (firstTrigger) firstTrigger.focus();
    }
  });

  const tocPanel = document.querySelector("[data-toc-panel]");
  const tocToggle = document.querySelector("[data-toc-toggle]");
  const desktopQuery = window.matchMedia("(min-width: 1101px)");

  function defaultTocState() {
    return desktopQuery.matches ? "visible" : "hidden";
  }

  function applyTocState(state) {
    root.dataset.toc = state;
    if (tocToggle) {
      tocToggle.setAttribute("aria-pressed", state === "visible" ? "true" : "false");
      tocToggle.title = state === "visible" ? "隐藏目录" : "显示目录";
    }
  }

  function readTocFromAddress() {
    const value = new URLSearchParams(window.location.search).get("toc");
    return value === "visible" || value === "hidden" ? value : null;
  }

  function writeTocToAddress(state) {
    const url = new URL(window.location.href);
    url.searchParams.set("toc", state);
    window.history.replaceState(null, "", url);
  }

  if (tocPanel && tocToggle) {
    const addressToc = readTocFromAddress();
    let addressControlsToc = addressToc !== null;
    const storedToc = readStorage("toc");
    const normalizedStoredToc =
      storedToc === "visible" || storedToc === "hidden" ? storedToc : null;

    applyTocState(addressToc || normalizedStoredToc || defaultTocState());
    if (addressToc) writeStorage("toc", addressToc);

    tocToggle.hidden = false;
    tocToggle.addEventListener("click", () => {
      const next = root.dataset.toc === "visible" ? "hidden" : "visible";
      writeStorage("toc", next);
      applyTocState(next);
      addressControlsToc = true;
      writeTocToAddress(next);
    });

    desktopQuery.addEventListener("change", () => {
      if (addressControlsToc) {
        const next = defaultTocState();
        applyTocState(next);
        writeTocToAddress(next);
      } else if (!normalizedStoredToc) {
        applyTocState(defaultTocState());
      }
    });
  } else if (tocToggle) {
    tocToggle.hidden = true;
  }

  document.querySelectorAll("[data-back-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotionQuery.matches ? "auto" : "smooth",
      });
    });
  });

  const headings = Array.from(document.querySelectorAll(".prose-content h2[id], .prose-content h3[id]"));
  const tocLinks = new Map(
    Array.from(document.querySelectorAll(".toc a[href^='#']")).map((link) => [
      decodeURIComponent(link.getAttribute("href").slice(1)),
      link,
    ])
  );

  if (headings.length && tocLinks.size) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (!visible) return;

        tocLinks.forEach((link) => link.classList.remove("is-active"));
        const active = tocLinks.get(visible.target.id);
        if (active) active.classList.add("is-active");
      },
      { rootMargin: "-18% 0px -72% 0px", threshold: 0.01 }
    );

    headings.forEach((heading) => observer.observe(heading));
  }
})();
