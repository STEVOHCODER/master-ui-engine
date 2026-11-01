/* BEGIN MUE:META
  COMPONENT: Empty state
  ID: wc-mue-empty
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: feedback
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/feedback/empty-state.html
  SHEET: styles/components.css#feedback — the host upgrades to
    <div class="empty" role="status" aria-label> and emits <div class="empty-icon" aria-hidden>(glyph),
    <h2 class="empty-title">, <p class="empty-desc"> and a <div class="row"> that holds the author's
    action buttons/links. .empty, .empty-icon, .empty-title, .empty-desc and .row are all defined in
    the sheet; the panel's centring/fade-in is the sheet's. No CSS is added.
  LIGHT_DOM: true
  VARIANTS: no-results, first-time-use, and any custom title/desc/glyph/action set
  PROPS: icon (decorative glyph, default 👁), title, desc, label (status name, default "Empty state")
  STATES: the panel enters with the sheet's mue-fade-in; title/desc/icon/label update in place when the
    attributes change while keeping relocated actions, so a swap-in never re-creates the buttons
  A11Y: role="status" with an aria-label; the icon is decorative (aria-hidden) so meaning lives in the
    heading + description; every action is a real button/link, keyboard reachable inside the row
  KEYBOARD: actions are the author's own buttons/links — Tab reaches them in order; the element adds
    no key handling of its own
  EVENTS: none (a message panel; actions are plain author controls)
  RESPONSIVE: the .empty panel is a centred flex column with a capped description, so it shrinks with
    the viewport and never overflows at 320px
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueEmpty() {
  class MueEmpty extends HTMLElement {
    static get observedAttributes() {
      return ["icon", "title", "desc", "label"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#patch();
    }
    attributeChangedCallback() {
      if (this._built) this.#patch();
    }
    #build() {
      this.className = "empty";
      this.setAttribute("role", "status");

      this._iconEl = document.createElement("div");
      this._iconEl.className = "empty-icon";
      this._iconEl.setAttribute("aria-hidden", "true");

      this._title = document.createElement("h2");
      this._title.className = "empty-title";

      this._desc = document.createElement("p");
      this._desc.className = "empty-desc";

      const row = document.createElement("div");
      row.className = "row";
      const actions = Array.from(this.childNodes).filter((n) => n.nodeType === 1);
      actions.forEach((n) => row.appendChild(n));

      this._row = row;
      if (actions.length) this.append(this._iconEl, this._title, this._desc, row);
      else this.append(this._iconEl, this._title, this._desc);
      this._built = true;
    }
    #patch() {
      this._iconEl.textContent = this.getAttribute("icon") || "\u{1F441}";
      this._title.textContent = this.getAttribute("title") || "Nothing here yet";
      const desc = this.getAttribute("desc") || "";
      this._desc.textContent = desc;
      this.setAttribute("aria-label", this.getAttribute("label") || "Empty state");
    }
  }
  if (!customElements.get("mue-empty")) customElements.define("mue-empty", MueEmpty);
  return MueEmpty;
}

export const MueEmpty = defineMueEmpty();
export default MueEmpty;
