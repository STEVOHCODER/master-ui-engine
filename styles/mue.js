/* ==========================================================================
   MASTER-UI-ENGINE — Behaviours
   One script for every preview. It is progressive: a page with none of the
   hooks below does nothing, and a page that already wires its own control is
   left alone (each handler checks for an opt-out or an existing binding).

     <script src="../styles/mue.js" defer></script>

   Hooks
     .theme-toggle / [data-theme-toggle]     light/dark, persisted, synced
     .code-wrap                              injects Copy markup + Copy + CSS
     [data-section]                          restricts the CSS slice to regions
     .reveal / [data-count]                  scroll-in and count-up
     [role=tablist] .tab                     roving tab index + arrow keys
     [data-dropdown]                         menu open/close, Esc, outside click
     [data-open] / [data-close] / [data-dialog]  focus trap, scroll lock
     [data-toast]                            timed dismiss
     [data-menu-toggle] + .nav-links         mobile navigation
     .navbar                                 .is-scrolled past 8px
     [data-disclosure]                       accordion, one panel open at a time
   ========================================================================== */
(() => {
  "use strict";

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => $$(sel, root)[0] || null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const THEME_KEY = "mui-theme";
  const PRESET_KEY = "mue-theme-name";
  const PRESETS = ["default", "editorial", "evergreen", "violet", "mono"];

  /* ---- theme --------------------------------------------------------------
     Persisted in localStorage and mirrored across frames, so a preview inside
     the lab iframe follows the lab and vice versa. */
  const rootEl = document.documentElement;

  function applyTheme(dark) {
    rootEl.classList.toggle("dark", dark);
    $$("[data-theme-state]").forEach((el) => {
      el.textContent = dark ? "Light mode" : "Dark mode";
    });
    $$(".theme-toggle").forEach((btn) => btn.setAttribute("aria-pressed", String(dark)));
  }

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null; // file:// or blocked storage: run without persistence
    }
  }

  function toggleTheme() {
    const dark = !rootEl.classList.contains("dark");
    applyTheme(dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {}
  }

  function initTheme() {
    const saved = storedTheme();
    if (saved === "dark") applyTheme(true);
    else if (saved === null && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      applyTheme(true);
    }
    const triggers = $$("[data-theme-toggle], .theme-toggle");
    triggers.forEach((btn) => {
      if (btn.dataset.mueBound || btn.closest("script")) return;
      btn.dataset.mueBound = "1";
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-pressed", String(rootEl.classList.contains("dark")));
      btn.addEventListener("click", toggleTheme);
    });
    addEventListener("storage", (e) => {
      if (e.key === THEME_KEY) applyTheme(e.newValue === "dark");
    });
  }

  function applyPreset(name) {
    const preset = PRESETS.includes(name) ? name : "default";
    if (preset === "default") rootEl.removeAttribute("data-mue-theme");
    else rootEl.setAttribute("data-mue-theme", preset);
    $$("[data-mue-theme-select]").forEach((select) => { select.value = preset; });
  }

  function initPreset() {
    let saved = null;
    try { saved = localStorage.getItem(PRESET_KEY); } catch {}
    applyPreset(saved || "default");
    $$("[data-mue-theme-select]").forEach((select) => {
      if (select.dataset.mueBound) return;
      select.dataset.mueBound = "1";
      select.addEventListener("change", () => {
        applyPreset(select.value);
        try { localStorage.setItem(PRESET_KEY, select.value); } catch {}
      });
    });
    addEventListener("storage", (e) => {
      if (e.key === PRESET_KEY) applyPreset(e.newValue || "default");
    });
  }

  /* ---- clipboard ----------------------------------------------------------
     navigator.clipboard needs user activation and a secure context; a page
     opened over file:// is neither, so the textarea path is a real branch. */
  async function writeClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;left:0;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function liveRegion() {
    let lr = document.getElementById("mue-live");
    if (!lr) {
      lr = document.createElement("div");
      lr.id = "mue-live";
      lr.className = "sr-only";
      lr.setAttribute("role", "status");
      lr.setAttribute("aria-live", "polite");
      document.body.appendChild(lr);
    }
    return lr;
  }

  /* ---- the CSS slice ------------------------------------------------------
     "Copy + CSS" answers the question copy-paste always raises: which rules
     does this snippet need? Class names in the snippet are matched against the
     #region blocks of components.css, so the payload carries only those. */
  let sheetPromise = null;

  function sheetHref() {
    const link = $$('link[rel="stylesheet"]').find((l) =>
      /components\.css([?#]|$)/.test(l.getAttribute("href") || "")
    );
    return link ? link.href : null;
  }

  function loadSheet() {
    const href = sheetHref();
    if (!href) return Promise.resolve("");
    if (!sheetPromise) {
      sheetPromise = fetch(href)
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""); // file:// refuses the fetch; markup copy still works
    }
    return sheetPromise;
  }

  function regions(css) {
    const found = [];
    const re = /\/\* #region ([\w-]+) \*\/[\s\S]*?\/\* #endregion \1 \*\//g;
    let m;
    while ((m = re.exec(css))) {
      found.push({
        name: m[1],
        clean: m[0]
          .replace(/^\/\* #region [\w-]+ \*\//, "")
          .replace(/\/\* #endregion [\w-]+ \*\/$/, "")
          .trim()
      });
    }
    return found;
  }

  function classesIn(markup) {
    const set = new Set();
    for (const m of markup.matchAll(/class\s*=\s*["']([^"']+)["']/g)) {
      m[1].split(/\s+/).forEach((c) => c && set.add(c));
    }
    return set;
  }

  function cssFor(markup, css, wanted) {
    const all = regions(css);
    if (!all.length) return "";
    const picked = wanted.length
      ? all.filter((r) => wanted.includes(r.name))
      : (() => {
          const names = classesIn(markup);
          return all.filter((r) =>
            ["tokens", "utilities", "chrome"].includes(r.name)
              ? false
              : [...names].some((n) => new RegExp("\\." + n + "\\b").test(r.clean))
          );
        })();
    if (!picked.length) return "";
    const lines = [
      "<link rel=\"stylesheet\" href=\"design-tokens/engine.css\">",
      "<link rel=\"stylesheet\" href=\"styles/components.css\">"
    ].join("\n");
    return (
      "These classes are already defined by styles/components.css, so linking it\n" +
      "is the shortest path:\n\n" +
      lines +
      "\n\n/* --- the rules themselves, for when you would rather inline them --- */\n\n" +
      picked.map((r) => "/* " + r.name + " */\n" + r.clean).join("\n\n")
    );
  }

  function initCopy() {
    $$(".code-wrap").forEach((wrap) => {
      const pre = $("pre", wrap);
      if (!pre || $(".copy-btn", wrap)) return; // nothing to copy, or page wired its own
      const bar = $(".code-bar", wrap) || wrap;
      const markup = pre.textContent.trim();
      const wanted = (wrap.getAttribute("data-section") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const group = document.createElement("div");
      group.className = "copy-group";
      group.style.cssText = "display:flex;gap:.375rem;flex:none";

      const make = (label, mode) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "copy-btn";
        b.dataset.copy = mode;
        b.dataset.label = label;
        b.textContent = label;
        group.appendChild(b);
        return b;
      };
      make("Copy markup", "markup");
      const both = make("Copy + CSS", "css");
      both.hidden = !sheetHref();
      bar.appendChild(group);

      group.addEventListener("click", async (e) => {
        const btn = e.target.closest(".copy-btn");
        if (!btn) return;
        let text = markup;
        if (btn.dataset.copy === "css") {
          const extra = cssFor(markup, await loadSheet(), wanted);
          text = extra || "/* link styles/components.css */";
        }
        const ok = await writeClipboard(text);
        btn.dataset.state = ok ? "done" : "error";
        btn.textContent = ok ? (btn.dataset.copy === "css" ? "Copied both" : "Copied") : "Select + Ctrl+C";
        liveRegion().textContent = btn.textContent;
        setTimeout(() => {
          btn.textContent = btn.dataset.label;
          delete btn.dataset.state;
        }, 1800);
      });
    });
  }

  /* ---- count-up ------------------------------------------------------------ */
  function formatCount(value, raw) {
    const decimals = (String(raw).split(".")[1] || "").length;
    const fixed = value.toFixed(decimals);
    return decimals || Math.abs(value) < 10000
      ? fixed
      : Number(fixed).toLocaleString("en-US");
  }

  function countUp(el) {
    const raw = el.dataset.count;
    const target = Number(raw);
    if (!Number.isFinite(target)) return;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reduceMotion.matches) {
      el.textContent = prefix + formatCount(target, raw) + suffix;
      return;
    }
    const start = performance.now();
    const run = 1200;
    const step = (now) => {
      const p = Math.min(1, (now - start) / run);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatCount(target * eased, raw) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initObservers() {
    const revealTargets = $$(".reveal");
    const countTargets = $$("[data-count]");
    if (!revealTargets.length && !countTargets.length) return;
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((el) => el.classList.add("in"));
      countTargets.forEach(countUp);
      return;
    }
    const revealIO = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach((el) => revealIO.observe(el));
    const countIO = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    countTargets.forEach((el) => countIO.observe(el));
  }

  /* ---- tabs --------------------------------------------------------------- */
  function initTabs() {
    $$("[role=tablist]").forEach((list) => {
      if (list.dataset.mueBound) return;
      list.dataset.mueBound = "1";
      const tabs = $$(".tab, [role=tab]", list);
      if (!tabs.length) return;
      const activate = (tab, focus) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const id = t.getAttribute("aria-controls");
          const panel = id && document.getElementById(id);
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => activate(tab));
        tab.addEventListener("keydown", (e) => {
          const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!dir) return;
          e.preventDefault();
          activate(tabs[(i + dir + tabs.length) % tabs.length], true);
        });
      });
      activate(tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0]);
    });
  }

  /* ---- dropdowns ----------------------------------------------------------- */
  function initDropdowns() {
    $$("[data-dropdown]").forEach((trigger) => {
      if (trigger.dataset.mueBound) return;
      trigger.dataset.mueBound = "1";
      const wrap = trigger.closest(".dropdown") || trigger.parentElement;
      const menu = $(".dropdown-menu, .menu", wrap);
      if (!menu) return;
      trigger.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      const setOpen = (open) => {
        wrap.classList.toggle("is-open", open);
        menu.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", String(open));
        menu.setAttribute("aria-hidden", String(!open));
        if (open) $(".menu-item, .dropdown-item", menu)?.focus();
      };
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        setOpen(!wrap.classList.contains("is-open"));
      });
      menu.addEventListener("keydown", (e) => {
        const items = $$(".menu-item, .dropdown-item", menu);
        const i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
        } else if (e.key === "Escape") {
          setOpen(false);
          trigger.focus();
        }
      });
      document.addEventListener("click", () => setOpen(false));
    });
  }

  /* ---- dialogs ------------------------------------------------------------ */
  let lastFocus = null;

  function initDialogs() {
    const dialogs = $$("[data-dialog]");
    if (!dialogs.length && !$$("[data-open]").length) return;
    const overlayOf = (dialog) => dialog.closest(".overlay, .backdrop") || dialog;

    const close = (dialog) => {
      overlayOf(dialog).classList.remove("is-open");
      document.documentElement.classList.remove("mue-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    const open = (dialog) => {
      lastFocus = document.activeElement;
      overlayOf(dialog).classList.add("is-open");
      document.documentElement.classList.add("mue-locked");
      const focusable = $$(
        "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])",
        dialog
      ).filter((el) => el.offsetParent !== null);
      (focusable[0] || dialog).focus();
      dialog.addEventListener("keydown", (e) => {
        if (e.key !== "Tab" || !focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    };

    $$("[data-open]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const dialog = document.getElementById(btn.dataset.open.replace(/^#/, ""));
        if (dialog) open(dialog);
      })
    );
    $$("[data-close]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const dialog = btn.closest("[data-dialog]") || $(".dialog, .modal");
        if (dialog) close(dialog);
      })
    );
    dialogs.forEach((dialog) =>
      overlayOf(dialog).addEventListener("click", (e) => {
        if (e.target === overlayOf(dialog)) close(dialog);
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const live = dialogs.find((d) => overlayOf(d).classList.contains("is-open"));
      if (live) close(live);
    });
  }

  /* ---- toasts -------------------------------------------------------------- */
  function dismiss(toast) {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), reduceMotion.matches ? 0 : 420);
  }

  function initToasts() {
    $$("[data-toast]").forEach((btn) => {
      if (btn.dataset.mueBound) return;
      btn.dataset.mueBound = "1";
      btn.addEventListener("click", () => {
        const node = document.getElementById(btn.dataset.toast.replace(/^#/, ""));
        if (!node) return;
        const stack = node.parentElement;
        const clone = node.cloneNode(true);
        clone.removeAttribute("id");
        clone.hidden = false;
        clone.classList.add("is-open");
        stack.appendChild(clone);
        setTimeout(() => dismiss(clone), Number(node.dataset.dismiss || 4200));
      });
    });
    /* Delegation, not per-button binding: clones created above carry a
       .toast-close that did not exist when boot ran. */
    document.addEventListener("click", (e) => {
      const x = e.target.closest(".toast .toast-close");
      if (x) dismiss(x.closest(".toast"));
    });
  }

  /* ---- navigation ---------------------------------------------------------- */
  function initNav() {
    $$("[data-menu-toggle]").forEach((btn) => {
      const links = document.getElementById(btn.dataset.menuToggle.replace(/^#/, ""));
      if (!links) return;
      btn.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
    const bar = $(".navbar, .site-header");
    if (!bar || !("requestAnimationFrame" in window)) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        bar.classList.toggle("is-scrolled", scrollY > 8);
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- accordion ----------------------------------------------------------
     One panel open per .accordion, which is what a FAQ wants. Set
     data-exclusive="off" on the container to let several stay open. */
  function initDisclosure() {
    $$("[data-disclosure]").forEach((btn) => {
      if (btn.dataset.mueBound) return;
      btn.dataset.mueBound = "1";
      const panel = document.getElementById((btn.getAttribute("aria-controls") || "").replace(/^#/, ""));
      if (!panel) return;
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") !== "true";
        const group = btn.closest(".accordion");
        if (group && group.dataset.exclusive !== "off") {
          $$("[data-disclosure]", group).forEach((other) => {
            if (other === btn) return;
            other.setAttribute("aria-expanded", "false");
            const p = document.getElementById((other.getAttribute("aria-controls") || "").replace(/^#/, ""));
            if (p) p.classList.remove("is-open");
          });
        }
        btn.setAttribute("aria-expanded", String(open));
        panel.classList.toggle("is-open", open);
      });
    });
  }

  function boot() {
    rootEl.classList.add("mue-js");
    initTheme();
    initPreset();
    initCopy();
    initTabs();
    initDropdowns();
    initDialogs();
    initToasts();
    initNav();
    initDisclosure();
    initObservers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.MUE = { toggleTheme, applyTheme, applyPreset, writeClipboard };
})();
