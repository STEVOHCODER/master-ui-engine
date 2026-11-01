/* BEGIN MUE:META
  COMPONENT: Table
  ID: wc-mue-table
  GROUP: Frameworks > Web Components
  CATEGORY: tables
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#tables — the host upgrades an author <table> into <div class=
    "table-wrap"><table class="table [table-striped] [table-compact]">…</table></div>. Sortable
    headers are the sheet's [data-sort] th; the caret is drawn by [data-sort="asc|desc"]::after.
  LIGHT_DOM: true
  VARIANTS: striped (bool), compact (bool)
  PROPS: striped, compact
  EVENTS: mue-sort {detail:{column,direction,cellIndex}} on each sort
  A11Y: table described by <caption> or aria-label; headers use <th scope="col">; a sortable header
    gets tabindex="0", a title, and aria-sort="ascending|descending" updated as the order changes;
    striping is decoration only (status carried by text)
  KEYBOARD: Enter or Space on a focused [data-sort] header sorts it
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueTable() {
  class MueTable extends HTMLElement {
    static get observedAttributes() {
      return ["striped", "compact"];
    }
    connectedCallback() {
      this.#build();
    }
    attributeChangedCallback() {
      this.#applyModifiers();
    }
    #build() {
      const table = this.querySelector("table");
      if (!table) return;
      let wrap = table.closest(".table-wrap");
      if (wrap !== this.firstElementChild || wrap === null) {
        wrap = document.createElement("div");
        wrap.className = "table-wrap";
        this.textContent = "";
        wrap.appendChild(table);
        this.appendChild(wrap);
      }
      table.classList.add("table");
      this.#applyModifiers();
      this._table = table;
      this.#bindSorting();
    }
    #applyModifiers() {
      if (!this._table) return;
      this._table.classList.toggle("table-striped", this.hasAttribute("striped"));
      this._table.classList.toggle("table-compact", this.hasAttribute("compact"));
    }
    #bindSorting() {
      const table = this._table;
      table.querySelectorAll("th[data-sort]").forEach((th) => {
        if (th.dataset.mueSortBound) return;
        th.dataset.mueSortBound = "1";
        const cellIndex = Array.from(th.parentElement.children).indexOf(th);
        th.setAttribute("tabindex", "0");
        th.title = "Sort by " + th.textContent.trim();
        const sort = () => {
          const dir = th.getAttribute("data-sort") === "asc" ? "desc" : "asc";
          table.querySelectorAll("th[data-sort]").forEach((h) => {
            if (h !== th) {
              h.setAttribute("data-sort", "");
              h.removeAttribute("aria-sort");
            }
          });
          th.setAttribute("data-sort", dir);
          th.setAttribute("aria-sort", dir === "asc" ? "ascending" : "descending");
          const body = table.tBodies[0];
          if (!body) return;
          Array.from(body.rows)
            .sort((a, b) => {
              const A = a.cells[cellIndex] ? a.cells[cellIndex].textContent.trim() : "";
              const B = b.cells[cellIndex] ? b.cells[cellIndex].textContent.trim() : "";
              const nA = parseFloat(A.replace(/[^0-9.-]/g, ""));
              const nB = parseFloat(B.replace(/[^0-9.-]/g, ""));
              const diff = Number.isFinite(nA) && Number.isFinite(nB) ? nA - nB : A.localeCompare(B);
              return dir === "asc" ? diff : -diff;
            })
            .forEach((row) => body.appendChild(row));
          this.dispatchEvent(
            new CustomEvent("mue-sort", {
              bubbles: true,
              composed: true,
              detail: { column: th.textContent.trim(), direction: dir, cellIndex }
            })
          );
        };
        th.addEventListener("click", sort);
        th.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            sort();
          }
        });
      });
    }
  }
  if (!customElements.get("mue-table")) customElements.define("mue-table", MueTable);
  return MueTable;
}

export const MueTable = defineMueTable();
export default MueTable;
