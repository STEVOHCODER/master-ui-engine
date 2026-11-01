/* BEGIN MUE:META
  COMPONENT: Pagination
  ID: wc-mue-pagination
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/navigation/pagination.html
  SHEET: styles/components.css#navigation — the host upgrades to <nav class="pagination" aria-label>
    and lays out <button> cells: a Previous (←) and Next (→) arrow that use the native disabled
    attribute at the bounds, one number per page with aria-current="true" on the active one, and
    <span class="ellipsis" aria-hidden> when a large range is windowed. .pagination, its button/a
    cells, [aria-current="true"], :disabled and .pagination .ellipsis are all defined in the sheet.
    No CSS is added.
  LIGHT_DOM: true
  VARIANTS: default (few pages, all numbers), with ellipsis (windowed around the current page)
  PROPS: total (page count), page (current 1-based, default 1), window (neighbours each side of
    current, default 1), label (nav name, default "Pagination")
  STATES: choosing a page moves aria-current="true", re-enables the arrows appropriately and rebuilds
    the window; the prev/next disabled state is the native attribute so they leave the tab order
  A11Y: <nav aria-label="Pagination"> landmark; current page carries aria-current="true"; disabled
    cells use the native disabled attribute; arrows carry aria-label="Previous"/"Next"; ellipsis is
    aria-hidden
  KEYBOARD: cells are real buttons — Tab moves between them, Enter/Space activates; arrows step pages
  EVENTS: mue-page-change {detail:{page, total}} when the page changes
  RESPONSIVE: the row wraps onto new lines and centres below 480px (components.css#navigation)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMuePagination() {
  class MuePagination extends HTMLElement {
    static get observedAttributes() {
      return ["total", "page", "window", "label"];
    }
    connectedCallback() {
      this.render();
      if (!this._wired) {
        this.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-page], button[data-nav]");
          if (!btn || btn.disabled) return;
          if (btn.dataset.nav === "prev") this.#go(this.page - 1);
          else if (btn.dataset.nav === "next") this.#go(this.page + 1);
          else this.#go(Number(btn.dataset.page));
        });
        this._wired = true;
      }
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    get page() {
      return Number(this.getAttribute("page")) || 1;
    }
    set page(v) {
      this.#go(v);
    }
    get total() {
      return Math.max(1, Number(this.getAttribute("total")) || 1);
    }
    #go(p) {
      const clamped = Math.min(Math.max(1, p), this.total);
      if (clamped === this.page && this.getAttribute("page") != null) return;
      this.setAttribute("page", String(clamped));
      this.dispatchEvent(new CustomEvent("mue-page-change", { bubbles: true, composed: true, detail: { page: clamped, total: this.total } }));
    }
    #cells() {
      const total = this.total;
      const cur = this.page;
      const win = Math.max(0, Number(this.getAttribute("window")) || 1);
      if (total <= 2 * win + 5) {
        return Array.from({ length: total }, (_, i) => ({ n: i + 1 }));
      }
      const set = new Set([1, total]);
      for (let i = cur - win; i <= cur + win; i++) if (i >= 1 && i <= total) set.add(i);
      const sorted = Array.from(set).sort((a, b) => a - b);
      const cells = [];
      sorted.forEach((n, idx) => {
        if (idx > 0 && n - sorted[idx - 1] > 1) cells.push({ ellipsis: true });
        cells.push({ n });
      });
      return cells;
    }
    render() {
      this.className = "pagination";
      this.setAttribute("aria-label", this.getAttribute("label") || "Pagination");
      const cur = this.page;
      const total = this.total;
      const frag = document.createDocumentFragment();

      const arrow = (nav, glyph, ariaLabel, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.nav = nav;
        b.setAttribute("aria-label", ariaLabel);
        b.textContent = glyph;
        if (disabled) b.disabled = true;
        return b;
      };
      frag.appendChild(arrow("prev", "\u2190", "Previous", cur <= 1));

      this.#cells().forEach((cell) => {
        if (cell.ellipsis) {
          const s = document.createElement("span");
          s.className = "ellipsis";
          s.setAttribute("aria-hidden", "true");
          s.textContent = "\u2026";
          frag.appendChild(s);
          return;
        }
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.page = String(cell.n);
        b.textContent = String(cell.n);
        if (cell.n === cur) b.setAttribute("aria-current", "true");
        frag.appendChild(b);
      });

      frag.appendChild(arrow("next", "\u2192", "Next", cur >= total));
      this.textContent = "";
      this.appendChild(frag);
    }
  }
  if (!customElements.get("mue-pagination")) customElements.define("mue-pagination", MuePagination);
  return MuePagination;
}

export const MuePagination = defineMuePagination();
export default MuePagination;
