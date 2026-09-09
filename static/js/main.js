(function () {
  const root = document.documentElement;
  const storage = window.localStorage;
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

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
  }

  function getStoredTheme() {
    return storage.getItem("theme") || "system";
  }

  applyTheme(getStoredTheme());

  darkQuery.addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.classList.contains("dark") ? "light" : "dark";
      storage.setItem("theme", next);
      applyTheme(next);
    });
  });

  const tocPanel = document.querySelector("[data-toc-panel]");
  const tocToggle = document.querySelector("[data-toc-toggle]");
  const desktopQuery = window.matchMedia("(min-width: 981px)");

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

  if (tocPanel && tocToggle) {
    const storedToc = storage.getItem("toc");
    applyTocState(storedToc || defaultTocState());

    tocToggle.hidden = false;
    tocToggle.addEventListener("click", () => {
      const next = root.dataset.toc === "visible" ? "hidden" : "visible";
      storage.setItem("toc", next);
      applyTocState(next);
    });

    desktopQuery.addEventListener("change", () => {
      if (!storage.getItem("toc")) applyTocState(defaultTocState());
    });
  } else if (tocToggle) {
    tocToggle.hidden = true;
  }

  document.querySelectorAll("[data-back-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
