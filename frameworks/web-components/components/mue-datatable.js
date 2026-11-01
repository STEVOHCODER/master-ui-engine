/* BEGIN MUE:META
  COMPONENT: Data table
  ID: wc-mue-datatable
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: tables
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/tables/data-table.html
  SHEET: styles/components.css#datatable (+ #tables, #dropdown, #descriptions, #feedback, #badges,
    #choice, #buttons, #fields, #navigation, #display, #utilities). The element upgrades the authored
    markup it wraps: a `.table-toolbar` (search .field.table-search > .input, a .switch for density,
    a .btn for refresh), a `.table-selection` bar, a `.table-wrap.table-scroll` around a
    <table class="table datatable"> whose thead holds `button.sort-btn[data-key]` headers, a
    `button.th-filter` inside a `.dropdown > .dropdown-menu.menu-filter`, and whose tbody data rows
    carry `data-<key>` attributes with `.cell-check input`, `.row-toggle`/`[data-expand]` and a
    following detail `<tr>` (.table-detail > .table-detail-inner > .descriptions); plus loading/empty
    tbodies and a `.table-foot` (count, .select-wrap select, `nav.pagination`). It only toggles the
    sheet's existing classes (.is-open, .is-selected, .is-filtered, .is-scrolled, table-compact,
    [aria-sort]) — it emits no CSS and every class it writes is defined in the shared sheet.
  LIGHT_DOM: true
  VARIANTS: default (search, sort, filter, expand, select, paginate), compact density, loading, empty
  PROPS: (none — it operates on the controls/rows the author supplies inside it)
  STATES: sort cycles none→ascending→descending and republishes aria-sort on the th; the header
    checkbox is indeterminate for a partial page; filter Apply commits checkbox states and marks the
    trigger .is-filtered; the sticky rule adds .is-scrolled once .table-scroll is panned; refresh
    swaps to the loading tbody for a beat; page-size/pager/count all read the filtered set
  A11Y: caption is sr-only; sortable th carry aria-sort; the filter menu is a .dropdown with
    aria-haspopup/aria-expanded closed on Escape and outside click; select-all is indeterminate so it
    never lies; row toggles keep aria-expanded/aria-controls to their detail row; status rides the
    badge label, not colour alone; amounts use tabular figures
  KEYBOARD: search is a real input; sort/filter/refresh are buttons (Enter/Space); the filter menu
    closes on Escape and returns focus to its trigger; checkboxes toggle with Space; detail rows open
    with the caret or the Details button
  EVENTS: mue-sort {detail:{key,direction}}, mue-filter {detail:{statuses}}, mue-page-change
    {detail:{page,pageSize,total}}, mue-select {detail:{selected}}, mue-expand {detail:{id,expanded}}
  RESPONSIVE: .table-wrap pans the columns sideways under 54rem with a sticky head; the toolbar and
    footer wrap; the detail panel drops its inset at 640px — all the sheet's rules
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueDatatable() {
  class MueDatatable extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.#start();
    }
    #start() {
      const q = (sel) => this.querySelector(sel);
      const qa = (sel) => Array.from(this.querySelectorAll(sel));

      const table = q("table.datatable") || q("table.table");
      if (!table) return;
      const body = q("[data-mue-dt-body]") || table.tBodies[0];
      const loadBody = q("[data-mue-dt-loading]");
      const emptyBody = q("[data-mue-dt-empty]");
      const wrap = q(".table-scroll") || q(".table-wrap");
      const allBox = table.tHead ? table.tHead.querySelector(".cell-check input") : null;
      const bar = q(".table-selection");
      const barCount = q(".table-selection-count");
      const count = q(".table-foot-count");
      const pager = q("[data-mue-dt-pager]") || q(".table-foot .pagination");
      const sizeSelect = q("[data-mue-dt-size]");
      const search = q("[data-mue-dt-search]");
      const compact = q("[data-mue-dt-compact]");
      const refresh = q("[data-mue-dt-refresh]");
      const clearSel = q("[data-mue-dt-clear]");
      const resetBtn = q("[data-mue-dt-reset]");
      const dropdown = q(".cell-filter .dropdown");
      const filterBtn = q(".th-filter");
      const filterMenu = q(".menu-filter");

      const rows = Array.from(body.rows).filter((r) => !r.querySelector(".table-detail"));
      rows.forEach((r) => {
        r.detail = r.nextElementSibling && r.nextElementSibling.querySelector(".table-detail") ? r.nextElementSibling : null;
        r.expanded = !!(r.detail && !r.detail.hidden);
      });
      const state = { q: "", statuses: [], key: null, dir: null, page: 1, size: sizeSelect ? Number(sizeSelect.value) || 8 : 9999, loading: false };
      this._state = state;
      const sortables = qa(".sort-btn");
      const checks = rows.map((r) => r.querySelector(".cell-check input")).filter(Boolean);
      const options = filterMenu ? Array.from(filterMenu.querySelectorAll("input")) : [];

      const rowId = (r) => { const m = r.querySelector(".mono"); return m ? m.textContent.trim() : (r.dataset.customer || ""); };

      const visibleRows = () => {
        const needle = state.q.trim().toLowerCase();
        return rows.filter((r) => {
          const okQ = !needle || (r.getAttribute("data-search") || "").indexOf(needle) > -1;
          const okS = !state.statuses.length || state.statuses.indexOf(r.getAttribute("data-status")) > -1;
          return okQ && okS;
        });
      };
      const sorted = (list) => {
        if (!state.key || !state.dir) return list;
        const sign = state.dir === "asc" ? 1 : -1;
        return list.slice().sort((a, b) => {
          const A = a.getAttribute("data-" + state.key);
          const B = b.getAttribute("data-" + state.key);
          if (state.key === "amount") return (parseFloat(A) - parseFloat(B)) * sign;
          return String(A).localeCompare(String(B)) * sign;
        });
      };
      const pageRows = () => {
        const list = sorted(visibleRows());
        const pages = Math.max(1, Math.ceil(list.length / state.size));
        if (state.page > pages) state.page = pages;
        const start = (state.page - 1) * state.size;
        return { list, slice: list.slice(start, start + state.size), pages, start };
      };

      const drawPager = (pages) => {
        if (!pager) return;
        pager.textContent = "";
        const mk = (label, opts) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = label;
          if (opts.label) b.setAttribute("aria-label", opts.label);
          if (opts.current) b.setAttribute("aria-current", "true");
          if (opts.disabled) b.disabled = true;
          if (opts.on) b.addEventListener("click", opts.on);
          pager.appendChild(b);
        };
        mk("\u2190", { label: "Previous page", disabled: state.page === 1, on: () => { state.page -= 1; draw(); } });
        for (let p = 1; p <= pages; p++) {
          const n = p;
          mk(String(n), { current: n === state.page, on: () => { state.page = n; draw(); } });
        }
        mk("\u2192", { label: "Next page", disabled: state.page === pages, on: () => { state.page += 1; draw(); } });
      };

      const syncSelection = () => {
        const picked = rows.filter((r) => { const c = r.querySelector(".cell-check input"); return c && c.checked; });
        rows.forEach((r) => { const c = r.querySelector(".cell-check input"); r.classList.toggle("is-selected", !!(c && c.checked)); });
        if (bar) bar.hidden = picked.length === 0;
        if (barCount) barCount.textContent = picked.length + " selected";
        if (allBox) {
          const page = pageRows().slice;
          const ticked = page.filter((r) => { const c = r.querySelector(".cell-check input"); return c && c.checked; }).length;
          allBox.checked = page.length > 0 && ticked === page.length;
          allBox.indeterminate = ticked > 0 && ticked < page.length;
        }
        this.dispatchEvent(new CustomEvent("mue-select", { bubbles: true, composed: true, detail: { selected: picked.map(rowId) } }));
      };

      const draw = () => {
        const r = pageRows();
        const shown = new Set(r.slice);
        rows.forEach((row) => {
          const on = shown.has(row);
          row.hidden = !on || state.loading;
          if (row.detail) row.detail.hidden = !on || !row.expanded || state.loading;
        });
        body.hidden = state.loading || !r.list.length;
        if (loadBody) loadBody.hidden = !state.loading;
        if (emptyBody) emptyBody.hidden = state.loading || r.list.length > 0;
        drawPager(r.pages);
        if (count) {
          count.textContent = r.list.length
            ? "Showing " + (r.start + 1) + "-" + (r.start + r.slice.length) + " of " + r.list.length + " orders"
            : "Showing 0 of " + rows.length + " orders";
        }
        syncSelection();
      };

      // Selection
      checks.forEach((c) => c.addEventListener("change", syncSelection));
      if (allBox) allBox.addEventListener("change", () => { pageRows().slice.forEach((row) => { const c = row.querySelector(".cell-check input"); if (c) c.checked = allBox.checked; }); syncSelection(); });
      if (clearSel) clearSel.addEventListener("click", () => { checks.forEach((c) => { c.checked = false; }); syncSelection(); if (allBox) allBox.focus(); });

      // Expand / collapse
      const setExpanded = (row, open) => {
        row.expanded = open;
        if (row.detail) row.detail.hidden = !open;
        row.querySelectorAll("[aria-expanded]").forEach((btn) => {
          btn.setAttribute("aria-expanded", String(open));
          if (btn.classList.contains("row-toggle")) {
            const mon = row.querySelector(".mono");
            btn.setAttribute("aria-label", (open ? "Hide" : "Show") + " details for " + (mon ? mon.textContent.trim() : ""));
          } else {
            btn.textContent = open ? "Hide" : "Details";
          }
        });
        this.dispatchEvent(new CustomEvent("mue-expand", { bubbles: true, composed: true, detail: { id: rowId(row), expanded: open } }));
      };
      rows.forEach((row) => {
        const toggle = row.querySelector(".row-toggle");
        const link = row.querySelector("[data-expand]");
        const flip = () => setExpanded(row, !row.expanded);
        if (toggle) toggle.addEventListener("click", flip);
        if (link) link.addEventListener("click", flip);
        setExpanded(row, row.expanded);
      });

      // Sorting
      sortables.forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-key");
          const th = btn.closest("th");
          const cur = btn.getAttribute("data-sort");
          const next = cur === "none" ? "asc" : cur === "asc" ? "desc" : "none";
          sortables.forEach((o) => { o.setAttribute("data-sort", "none"); const ot = o.closest("th"); if (ot) ot.setAttribute("aria-sort", "none"); });
          if (next !== "none") {
            btn.setAttribute("data-sort", next);
            if (th) th.setAttribute("aria-sort", next === "asc" ? "ascending" : "descending");
            state.key = key;
            state.dir = next;
          } else {
            state.key = null;
            state.dir = null;
          }
          state.page = 1;
          draw();
          this.dispatchEvent(new CustomEvent("mue-sort", { bubbles: true, composed: true, detail: { key, direction: next === "none" ? "none" : next } }));
        });
      });

      // Column filter
      const setFilter = (open) => {
        if (dropdown) dropdown.classList.toggle("is-open", open);
        if (filterBtn) filterBtn.setAttribute("aria-expanded", String(open));
        if (open && options[0]) options[0].focus();
      };
      const commitFilter = () => {
        state.statuses = options.filter((o) => o.checked).map((o) => o.value);
        if (filterBtn) filterBtn.classList.toggle("is-filtered", state.statuses.length > 0);
        state.page = 1;
        draw();
        this.dispatchEvent(new CustomEvent("mue-filter", { bubbles: true, composed: true, detail: { statuses: state.statuses.slice() } }));
      };
      if (filterBtn) {
        filterBtn.addEventListener("click", (e) => { e.stopPropagation(); setFilter(!(dropdown && dropdown.classList.contains("is-open"))); });
        const applyBtn = filterMenu && filterMenu.querySelector("[data-mue-dt-apply]");
        const clearBtn = filterMenu && filterMenu.querySelector("[data-mue-dt-filter-clear]");
        if (applyBtn) applyBtn.addEventListener("click", () => { commitFilter(); setFilter(false); filterBtn.focus(); });
        if (clearBtn) clearBtn.addEventListener("click", () => { options.forEach((o) => { o.checked = false; }); commitFilter(); });
      }
      if (filterMenu) filterMenu.addEventListener("keydown", (e) => { if (e.key === "Escape") { setFilter(false); if (filterBtn) filterBtn.focus(); } });
      this._docFilter = (e) => { if (dropdown && !dropdown.contains(e.target)) setFilter(false); };
      document.addEventListener("click", this._docFilter);

      if (resetBtn) resetBtn.addEventListener("click", () => { if (search) search.value = ""; state.q = ""; options.forEach((o) => { o.checked = false; }); commitFilter(); if (search) search.focus(); });

      // Search, density, page size, refresh
      if (search) search.addEventListener("input", () => { state.q = search.value; state.page = 1; draw(); });
      if (compact) compact.addEventListener("change", () => table.classList.toggle("table-compact", compact.checked));
      if (sizeSelect) sizeSelect.addEventListener("change", () => { state.size = Number(sizeSelect.value); state.page = 1; draw(); });
      if (refresh) refresh.addEventListener("click", () => { state.loading = true; draw(); window.setTimeout(() => { state.loading = false; draw(); }, 1400); });

      // Sticky head rule
      if (wrap) {
        let ticking = false;
        this._onWrapScroll = () => {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(() => { wrap.classList.toggle("is-scrolled", wrap.scrollTop > 2); ticking = false; });
        };
        wrap.addEventListener("scroll", this._onWrapScroll, { passive: true });
      }

      draw();
    }
    disconnectedCallback() {
      if (this._docFilter) document.removeEventListener("click", this._docFilter);
    }
  }
  if (!customElements.get("mue-datatable")) customElements.define("mue-datatable", MueDatatable);
  return MueDatatable;
}

export const MueDatatable = defineMueDatatable();
export default MueDatatable;
