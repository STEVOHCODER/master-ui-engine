/* ==========================================================================
   MASTER-UI-ENGINE — Visual lab behaviour
   Drives showcase/index.html. Progressive and file://-safe: it reads the
   catalog global (showcase/data/catalog.js), never fetches, and owns no
   component styling. Two jobs:
     1. browse the 46 previews (sidebar, iframe stage, gallery thumbs)
     2. the ⌘K / Ctrl+K command palette — the fastest route to any preview,
        ranked exactly the way `node tools/mue.js search` ranks it, plus the
        commands that are not previews (Token studio, dark mode, gallery).
   ========================================================================== */
(() => {
  "use strict";

  const ITEMS = (window.MUE_CATALOG && window.MUE_CATALOG.items) || [];
  const ROOT = new URL("../", location.href);
  const THEME_KEY = "mui-theme"; // same key styles/mue.js persists in the previews
  const PRESET_KEY = "mue-theme-name";
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const SHORTCUT = isMac ? "⌘K" : "Ctrl K";

  /* Which shared-sheet regions each preview cites in its own MUE:META header.
     The lab is opened over file:// too, so it cannot read the previews' heads
     at runtime; this snapshot was taken from the files themselves with
     `node tools/mue.js head <path>` on 2026-11-01. If the catalog ever carries
     the field, the catalog wins (see regionsOf). */
  const REGION_MAP = {
    "components/buttons/buttons.html": ["buttons"],
    "components/forms/input-fields.html": ["fields"],
    "components/forms/select-menus.html": ["fields"],
    "components/forms/checkboxes.html": ["choice"],
    "components/forms/switches.html": ["choice"],
    "components/forms/radio-buttons/radio-buttons.html": ["choice"],
    "components/forms/date-picker/date-picker.html": ["fields"],
    "components/cards/cards.html": ["cards", "badges", "buttons", "utilities"],
    "components/tables/tables.html": ["tables", "badges", "buttons"],
    "components/charts/charts.html": ["charts"],
    "components/dialogs/dialogs.html": ["overlays", "buttons"],
    "components/modals/modals.html": ["overlays", "buttons", "fields"],
    "components/dropdowns/dropdowns.html": ["dropdown", "buttons"],
    "components/notifications/notifications.html": ["notifications", "buttons"],
    "components/footers/footers.html": ["footers"],
    "components/feedback/progress.html": ["feedback"],
    "components/feedback/skeleton.html": ["feedback"],
    "components/feedback/empty-state.html": ["feedback"],
    "components/feedback/error-state.html": ["feedback", "fields", "buttons"],
    "components/navigation/breadcrumbs.html": ["navigation"],
    "components/navigation/header-nav.html": ["navigation", "buttons", "display"],
    "components/navigation/navigation-menu.html": ["navigation", "dropdown"],
    "components/navigation/pagination.html": ["navigation"],
    "components/navigation/tabs.html": ["tabs"],
    "components/sidebars/sidebar.html": ["sidebar"],
    "examples/ecommerce/ecommerce-homepage.html": ["navigation", "chrome", "buttons", "cards", "badges", "display", "footers", "utilities"],
    "examples/ecommerce/product-details.html": ["navigation", "chrome", "buttons", "badges", "fields", "cards", "tabs", "tables", "notifications", "display", "utilities"],
    "templates/saas/saas-starter.html": ["shell", "chrome", "sidebar", "navigation", "fields", "buttons", "cards", "badges", "tables", "tabs", "display", "dropdown", "overlays", "notifications", "utilities"],
    "templates/dashboards/admin-starter.html": ["shell", "sidebar", "navigation", "fields", "buttons", "chrome", "badges", "cards", "tables", "display", "utilities", "notifications"],
    "templates/dashboards/analytics-starter.html": ["shell", "sidebar", "navigation", "buttons", "chrome", "cards", "tables", "display", "charts", "badges", "utilities", "notifications"],
    "templates/ecommerce/ecommerce-starter.html": ["chrome", "navigation", "fields", "buttons", "cards", "badges", "notifications", "overlays", "footers", "utilities"],
    "templates/marketplaces/marketplace-starter.html": ["navigation", "chrome", "fields", "buttons", "badges", "cards", "notifications", "utilities"],
    "templates/web-applications/ai-starter.html": ["shell", "chat", "chrome", "sidebar", "navigation", "buttons", "fields", "cards", "badges", "display", "notifications", "utilities"],
  };

  const els = {
    nav: document.getElementById("nav"),
    stage: document.getElementById("stage"),
    frameWrap: document.querySelector(".frame-wrap"),
    status: document.getElementById("status"),
    open: document.getElementById("open-tab"),
    filter: document.getElementById("search"),
    trigger: document.getElementById("palette-trigger"),
    theme: document.getElementById("theme-btn"),
    preset: document.getElementById("theme-preset"),
  };

  let view = "lab";
  let width = "100%";
  let selected = ITEMS[0];

  /* ---------------------------------------------------------------- helpers */

  const src = (item) => new URL(item.path, ROOT).href;
  const regionsOf = (item) => item.regions || item.sheet || REGION_MAP[item.path] || [];

  function filtered() {
    const q = (els.filter.value || "").trim().toLowerCase();
    return ITEMS.filter((i) => !q || `${i.group} ${i.category} ${i.name} ${i.path}`.toLowerCase().includes(q));
  }

  /* ------------------------------------------------------------ sidebar/stage */

  function renderNav() {
    const list = filtered();
    els.nav.innerHTML = "";

    const studio = document.createElement("a");
    studio.className = "studio-link";
    studio.href = "studio.html";
    studio.innerHTML = '<span class="dot" aria-hidden="true"></span><span><strong>Token studio</strong><small>Live tokens: hue, radius, density, contrast</small></span>';
    els.nav.appendChild(studio);

    [...new Set(list.map((i) => i.group))].forEach((g) => {
      const wrap = document.createElement("div");
      wrap.className = "group";
      const h = document.createElement("h2");
      h.textContent = g;
      wrap.appendChild(h);
      list
        .filter((i) => i.group === g)
        .forEach((item) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "item" + (selected && selected.path === item.path ? " active" : "");
          b.innerHTML = `${esc(item.name)}<small>${esc(item.category)}</small>`;
          b.addEventListener("click", () => select(item));
          wrap.appendChild(b);
        });
      els.nav.appendChild(wrap);
    });

    if (!list.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "No design matches that filter.";
      els.nav.appendChild(p);
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function sizeThumbs() {
    // Measure synchronously: requestAnimationFrame never fires in a background tab.
    document.querySelectorAll(".thumb-frame").forEach((f) => {
      const w = f.clientWidth || 320;
      f.style.setProperty("--s", Math.max(0.08, w / 1280).toFixed(4));
    });
  }

  function select(item) {
    if (!item) return;
    selected = item;
    location.hash = item.path;
    renderNav();
    if (view === "gallery") setView("lab");
    else renderStage();
  }

  function setView(next) {
    view = next;
    document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === next));
    renderStage();
  }

  function renderStage() {
    els.frameWrap.style.setProperty("--preview-w", width === "100%" ? "100%" : width + "px");

    if (view === "gallery") {
      els.stage.classList.add("gallery");
      const list = filtered();
      els.status.innerHTML = `<strong>${list.length} designs</strong> — click a card to inspect it`;
      els.open.href = selected ? src(selected) : "#";
      els.stage.innerHTML = list
        .map(
          (item) => `
        <article class="thumb" data-path="${esc(item.path)}">
          <header>${esc(item.group)} / ${esc(item.name)}</header>
          <div class="thumb-frame">
            <iframe title="${esc(item.name)}" src="${src(item)}" loading="lazy" tabindex="-1"></iframe>
          </div>
        </article>`
        )
        .join("");
      sizeThumbs();
      els.stage.querySelectorAll(".thumb").forEach((el) => {
        el.addEventListener("click", () => select(ITEMS.find((i) => i.path === el.dataset.path)));
      });
      return;
    }

    els.stage.classList.remove("gallery");
    if (!selected) {
      els.stage.innerHTML = '<p class="empty">No match</p>';
      return;
    }
    els.status.innerHTML = `<strong>${esc(selected.name)}</strong> · ${esc(selected.group)} / ${esc(selected.category)} · ${esc(selected.path)}`;
    els.open.href = src(selected);
    els.stage.innerHTML = `<iframe title="${esc(selected.name)}" src="${src(selected)}"></iframe>`;
    relayKeys(els.stage.querySelector("iframe"));
  }

  /* A preview takes focus when it is clicked, and keydown does not bubble out of
     an iframe document. The shortcuts are the lab's, so re-dispatch them on the
     parent document and cancel the browser default when the lab handled them. */

  function relayKeys(frame) {
    if (!frame) return;
    const hooked = new WeakSet();
    const attach = () => {
      let doc;
      try {
        doc = frame.contentDocument;
      } catch {
        return false; // cross-origin preview: nothing to relay, and nothing to fix.
      }
      if (!doc || doc.location.href === "about:blank" || hooked.has(doc)) return false;
      hooked.add(doc);
      doc.addEventListener("keydown", (event) => {
        const editable = event.target.matches("input, textarea, select, [contenteditable]");
        const combo = event.metaKey || event.ctrlKey;
        if (!combo && editable) return;
        const synthetic = new KeyboardEvent("keydown", {
          key: event.key,
          code: event.code,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          bubbles: true,
          cancelable: true,
        });
        // document has no matches(), and the lab's handler reads event.target.
        document.body.dispatchEvent(synthetic);
        if (synthetic.defaultPrevented) event.preventDefault();
      });
      return true;
    };
    // contentDocument exists before the src document does, so about:blank means "wait".
    if (attach()) return;
    frame.addEventListener("load", attach);
  }

  /* -------------------------------------------------------------------- theme
     The previews read `mui-theme` from localStorage when they boot (styles/mue.js),
     so flipping it here and re-rendering the stage moves every preview with the lab. */

  function themeIsDark() {
    return document.documentElement.classList.contains("dark");
  }

  function applyThemeLabel() {
    const dark = themeIsDark();
    els.theme.setAttribute("aria-pressed", String(dark));
    els.theme.textContent = dark ? "Dark" : "Light";
    els.theme.title = dark
      ? "Previews are dark — click for light (mui-theme, shared with every preview)"
      : "Previews are light — click for dark (mui-theme, shared with every preview)";
  }

  function toggleTheme() {
    const dark = !themeIsDark();
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      /* file:// with blocked storage: the lab still flips, the previews keep their own setting. */
    }
    applyThemeLabel();
    renderStage();
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {}
    if (saved === null && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) saved = "dark";
    document.documentElement.classList.toggle("dark", saved === "dark");
    applyThemeLabel();
  }

  function initPreset() {
    let saved = "default";
    try { saved = localStorage.getItem(PRESET_KEY) || "default"; } catch {}
    if (![...els.preset.options].some((option) => option.value === saved)) saved = "default";
    els.preset.value = saved;
    els.preset.addEventListener("change", () => {
      try { localStorage.setItem(PRESET_KEY, els.preset.value); } catch {}
      renderStage();
    });
  }

  /* ----------------------------------------------------------- palette ranking
     Mirrors cmdSearch() in tools/mue.js: each term takes the weight of the
     first field that contains it, and a full-phrase name hit is worth +8 on
     top. Field order is load-bearing — it is what makes a name beat a variant. */

  const WEIGHT = { name: 6, variants: 4, category: 3, group: 3, id: 3, prose: 2 };

  function rankPreview(item, q, terms) {
    const hay = {
      name: (item.name || "").toLowerCase(),
      id: (item.id || "").toLowerCase(),
      category: (item.category || "").toLowerCase(),
      group: (item.group || "").toLowerCase(),
      variants: (item.variants || []).join(" ").toLowerCase(),
      prose: [item.path, item.kind, item.theming, regionsOf(item).join(" ")].join(" ").toLowerCase(),
    };
    let score = 0;
    for (const t of terms) {
      const key = Object.keys(hay).find((k) => hay[k].includes(t));
      if (key) score += WEIGHT[key];
    }
    if (q && hay.name.includes(q)) score += 8;
    return score;
  }

  const COMMANDS = [
    {
      id: "studio",
      label: "Open Token studio",
      keys: "token studio theme variables contrast",
      hint: "studio.html",
      run: () => {
        location.href = "studio.html";
      },
    },
    {
      id: "dark",
      label: "Toggle dark mode",
      keys: "dark light theme mode preview",
      hint: () => (themeIsDark() ? "now dark" : "now light"),
      run: toggleTheme,
    },
    {
      id: "gallery",
      label: "Show all designs",
      keys: "gallery grid all designs every overview",
      hint: "gallery view",
      run: () => setView("gallery"),
    },
    {
      id: "single",
      label: "Show one at a time",
      keys: "single lab one design frame stage",
      hint: "stage view",
      run: () => setView("lab"),
    },
    {
      id: "isolated",
      label: "Open current preview in a new tab",
      keys: "isolated new tab current open external",
      hint: () => (selected ? "new tab" : "nothing selected"),
      run: () => {
        if (selected) window.open(src(selected), "_blank", "noopener");
      },
    },
  ];

  function rankCommand(cmd, q, terms) {
    const hay = {
      name: cmd.label.toLowerCase(),
      variants: (typeof cmd.keys === "function" ? "" : cmd.keys).toLowerCase(),
      category: "",
      group: "command",
      id: cmd.id,
      prose: "",
    };
    let score = 0;
    for (const t of terms) {
      const key = Object.keys(hay).find((k) => hay[k].includes(t));
      if (key) score += WEIGHT[key];
    }
    if (q && hay.name.includes(q)) score += 8;
    return score;
  }

  /* ------------------------------------------------------------- palette DOM */

  const pal = { open: false, rows: [], active: 0, lastFocus: null, overlay: null, input: null, list: null, count: null };

  function buildPalette() {
    const overlay = document.createElement("div");
    overlay.className = "palette-overlay";
    overlay.id = "palette-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="palette" role="dialog" id="palette" aria-modal="true" aria-labelledby="palette-title">
        <h2 id="palette-title" class="sr-only">Search previews and run commands</h2>
        <div class="palette-input">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.6-3.6"></path></svg>
          <input type="text" id="palette-input" role="combobox" autocomplete="off" spellcheck="false"
                 aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
                 placeholder="Search previews, groups, variants… or type a command"></input>
          <kbd>esc</kbd>
        </div>
        <div class="palette-list" id="palette-list" role="listbox" aria-label="Results"></div>
        <div class="palette-foot">
          <span>↑↓ move</span><span>⏎ open</span><span>esc close</span>
          <span id="palette-live" role="status" aria-live="polite" style="margin-left:auto"></span>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    pal.overlay = overlay;
    pal.input = overlay.querySelector("#palette-input");
    pal.list = overlay.querySelector("#palette-list");
    pal.live = overlay.querySelector("#palette-live");

    overlay.addEventListener("mousedown", (e) => {
      if (e.target === overlay) closePalette();
    });
    pal.input.addEventListener("input", renderPalette);
    pal.input.addEventListener("keydown", onPaletteKey);
    pal.list.addEventListener("mousemove", (e) => {
      const row = e.target.closest(".p-row");
      if (!row) return;
      const i = pal.rows.findIndex((r) => r.el === row);
      if (i > -1 && i !== pal.active) setActive(i);
    });
    pal.list.addEventListener("click", (e) => {
      const row = e.target.closest(".p-row");
      if (!row) return;
      const i = pal.rows.findIndex((r) => r.el === row);
      if (i > -1) runRow(i);
    });
  }

  function buildRows(q) {
    const terms = q.split(/[\s,]+/).filter(Boolean);
    // Empty query = browse mode: everything, in catalog order (Components
    // first), exactly like `mue.js list`. A query re-ranks by the weights.
    const previews = ITEMS.map((item) => ({ item, score: q ? rankPreview(item, q, terms) : 1 }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((r) => ({ type: "preview", item: r.item, score: r.score }));

    const cmds = COMMANDS.map((cmd) => ({ cmd, score: q ? rankCommand(cmd, q, terms) : 1 }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => ({ type: "command", cmd: r.cmd, score: r.score }));

    return { previews, cmds };
  }

  function renderPalette() {
    const q = pal.input.value.trim().toLowerCase();
    const { previews, cmds } = buildRows(q);
    pal.list.innerHTML = "";
    pal.rows = [];

    const addSection = (label) => {
      const h = document.createElement("div");
      h.className = "palette-sec";
      h.setAttribute("role", "presentation");
      h.textContent = label;
      pal.list.appendChild(h);
    };

    if (previews.length) {
      addSection(`Previews · ${previews.length}`);
      previews.forEach((row) => {
        const item = row.item;
        const regions = regionsOf(item);
        const el = document.createElement("button");
        el.type = "button";
        el.tabIndex = -1;
        el.className = "p-row";
        el.setAttribute("role", "option");
        el.setAttribute("aria-selected", "false");
        el.innerHTML =
          `<span class="p-name">${esc(item.name)}</span>` +
          `<span class="p-meta">${esc(item.group)} / ${esc(item.category)} · ${esc(item.id)}` +
          (item.variants && item.variants.length
            ? ` · ${esc(item.variants.slice(0, 3).join(", "))}${item.variants.length > 3 ? " +" + (item.variants.length - 3) : ""}`
            : "") +
          `</span>` +
          `<span class="p-tags">` +
          (regions.length
            ? regions.slice(0, 2).map((r) => `<span class="p-tag">#${esc(r)}</span>`).join("") + (regions.length > 2 ? `<span class="p-tag">+${regions.length - 2}</span>` : "")
            : `<span class="p-tag">self-contained</span>`) +
          `</span>`;
        pal.list.appendChild(el);
        pal.rows.push({ ...row, el });
      });
    }

    if (cmds.length) {
      addSection(`Commands · ${cmds.length}`);
      cmds.forEach((row) => {
        const cmd = row.cmd;
        const el = document.createElement("button");
        el.type = "button";
        el.tabIndex = -1;
        el.className = "p-row";
        el.setAttribute("role", "option");
        el.setAttribute("aria-selected", "false");
        el.innerHTML =
          `<span class="p-name">${esc(cmd.label)}</span>` +
          `<span class="p-meta">Command · runs immediately</span>` +
          `<span class="p-tags"><span class="p-key">${esc(typeof cmd.hint === "function" ? cmd.hint() : cmd.hint)}</span></span>`;
        pal.list.appendChild(el);
        pal.rows.push({ ...row, el });
      });
    }

    if (!pal.rows.length) {
      const p = document.createElement("p");
      p.className = "palette-empty";
      p.textContent = `Nothing matches “${pal.input.value}”. Try a category (buttons, forms, charts) or “studio”.`;
      pal.list.appendChild(p);
    }

    pal.active = -1;
    if (pal.rows.length) setActive(0);
    pal.live.textContent = `${pal.rows.length} result(s)`;
  }

  function setActive(i) {
    pal.rows.forEach((r, n) => r.el.setAttribute("aria-selected", String(n === i)));
    pal.active = i;
    const row = pal.rows[i];
    if (!row) {
      pal.input.removeAttribute("aria-activedescendant");
      return;
    }
    if (!row.el.id) row.el.id = "palette-opt-" + i;
    pal.input.setAttribute("aria-activedescendant", row.el.id);
    row.el.scrollIntoView({ block: "nearest" });
  }

  function runRow(i) {
    const row = pal.rows[i];
    if (!row) return;
    if (row.type === "preview") {
      closePalette();
      select(row.item);
    } else {
      closePalette();
      row.cmd.run();
    }
  }

  function onPaletteKey(e) {
    if (e.key === "ArrowDown" || (e.key === "j" && e.ctrlKey)) {
      e.preventDefault();
      if (pal.rows.length) setActive((pal.active + 1) % pal.rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (pal.rows.length) setActive((pal.active - 1 + pal.rows.length) % pal.rows.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(pal.rows.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      runRow(pal.active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closePalette();
    } else if (e.key === "Tab") {
      // The rows are aria-activedescendant options, never tab stops: keeping
      // focus in the input is what traps it inside the dialog.
      e.preventDefault();
    }
  }

  function openPalette() {
    if (pal.open) return;
    pal.lastFocus = document.activeElement;
    pal.open = true;
    pal.overlay.hidden = false;
    document.body.classList.add("palette-locked");
    els.trigger.setAttribute("aria-expanded", "true");
    pal.input.value = (els.filter.value || "").trim();
    renderPalette();
    pal.input.focus();
    pal.input.select();
  }

  function closePalette() {
    if (!pal.open) return;
    pal.open = false;
    pal.overlay.hidden = true;
    document.body.classList.remove("palette-locked");
    els.trigger.setAttribute("aria-expanded", "false");
    const back = pal.lastFocus && pal.lastFocus.focus ? pal.lastFocus : els.trigger;
    back.focus();
  }

  /* ------------------------------------------------------------------- wiring */

  if (!ITEMS.length) {
    els.stage.innerHTML = '<p class="empty">showcase/data/catalog.js is missing. Run showcase/data/build-catalog.ps1.</p>';
  }

  els.filter.addEventListener("input", () => {
    renderNav();
    if (view === "gallery") renderStage();
  });
  document.querySelectorAll("[data-view]").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
  document.querySelectorAll("[data-width]").forEach((btn) =>
    btn.addEventListener("click", () => {
      width = btn.dataset.width;
      document.querySelectorAll("[data-width]").forEach((b) => b.classList.toggle("active", b === btn));
      renderStage();
    })
  );
  els.theme.addEventListener("click", toggleTheme);
  els.trigger.addEventListener("click", openPalette);

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.code === "KeyK" || e.key.toLowerCase() === "k")) {
      e.preventDefault();
      if (pal.open) closePalette();
      else openPalette();
      return;
    }
    if (pal.open || e.target.matches("input, textarea, select") || !selected) return;
    const list = filtered();
    const i = list.findIndex((x) => x.path === selected.path);
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      select(list[Math.min(list.length - 1, i + 1)]);
    }
    if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      select(list[Math.max(0, i - 1)]);
    }
  });

  let resizeTimer;
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (view === "gallery") sizeThumbs();
    }, 150);
  });

  // The shortcut is platform-aware: ⌘K on Apple, Ctrl K everywhere else.
  document.querySelectorAll("#palette-trigger kbd, #shortcut-hint").forEach((el) => {
    el.textContent = SHORTCUT;
  });

  initTheme();
  initPreset();
  buildPalette();
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  selected = ITEMS.find((i) => i.path === hash) || ITEMS[0];
  renderNav();
  renderStage();

  // Screenshot / automation hook: ?palette=1 opens the palette on load,
  // ?palette=buttons opens it pre-filtered. No production path depends on it.
  const params = new URLSearchParams(location.search);
  if (params.has("palette")) {
    openPalette();
    const seed = params.get("palette");
    pal.input.value = seed && seed !== "1" ? seed : "";
    renderPalette();
  }

  window.MUE_LAB = { ITEMS, select, setView, openPalette, closePalette, toggleTheme, regionsOf };
})();
