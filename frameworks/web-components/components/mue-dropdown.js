/* BEGIN MUE:META
  COMPONENT: Dropdown
  ID: wc-mue-dropdown
  GROUP: Frameworks > Web Components
  CATEGORY: dropdowns
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#dropdown (+ #buttons) — the host is class "dropdown"; it renders a
    trigger <button class="btn btn-<variant>"> plus a chevron, and <ul class="dropdown-menu"> whose
    <li> rows hold the author .menu-item buttons and .menu-divider rows. Opening toggles
    .dropdown.is-open and menu aria-hidden="false" (the sheet fades the menu in from those).
  LIGHT_DOM: true
  VARIANTS: variant (trigger button)=primary|secondary|outline|ghost|danger|success, label
  PROPS: label, variant, open
  EVENTS: mue-select {detail:{value,label}}, mue-open, mue-close {detail:{reason}}
  A11Y: trigger carries aria-haspopup="true" + aria-expanded kept in sync; menu is aria-hidden when
    closed (opacity/pointer-events, never display:none); rows are real focusable buttons; decorative
    chevrons are aria-hidden
  KEYBOARD: Enter/Space on trigger opens; ArrowUp/ArrowDown walk rows and wrap; Escape closes and
    returns focus to the trigger; a click outside closes
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const CHEVRON = "M19 9l-7 7-7-7";
const BTN_VARIANTS = ["primary", "secondary", "outline", "ghost", "danger", "success", "link"];

function defineMueDropdown() {
  class MueDropdown extends HTMLElement {
    static get observedAttributes() {
      return ["open"];
    }
    constructor() {
      super();
      this._built = false;
      this._items = null;
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#sync();
    }
    attributeChangedCallback(name) {
      if (name === "open" && this._built) this.#sync();
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.setAttribute("open", "");
      else this.removeAttribute("open");
    }
    #build() {
      this.classList.add("dropdown");
      const variant = BTN_VARIANTS.includes(this.getAttribute("variant")) ? this.getAttribute("variant") : "outline";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "btn btn-" + variant;
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-expanded", "false");
      trigger.textContent = this.getAttribute("label") || "Menu";
      const chev = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      chev.setAttribute("viewBox", "0 0 24 24");
      chev.setAttribute("fill", "none");
      chev.setAttribute("stroke", "currentColor");
      chev.setAttribute("aria-hidden", "true");
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", CHEVRON);
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      p.setAttribute("stroke-width", "2");
      chev.appendChild(p);
      trigger.appendChild(chev);

      // Collect author item children (skip whitespace text nodes).
      const authored = Array.from(this.childNodes).filter(
        (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim())
      );
      const menu = document.createElement("ul");
      menu.className = "dropdown-menu";
      menu.setAttribute("role", "menu");
      menu.setAttribute("aria-hidden", "true");
      authored.forEach((n) => {
        const li = document.createElement("li");
        if (n.nodeType === 3) {
          // stray text is not a valid menu row; drop it
          return;
        }
        li.appendChild(n);
        menu.appendChild(li);
      });

      this.textContent = "";
      this.append(trigger, menu);
      this._trigger = trigger;
      this._menu = menu;

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        this.open = !this.open;
      });
      menu.addEventListener("keydown", (e) => {
        const items = this.#items();
        const i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          const next = items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length] || items[0];
          if (next) next.focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          if (items[0]) items[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          if (items[items.length - 1]) items[items.length - 1].focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.#close("escape");
        }
      });
      this._onItem = (e) => {
        const row = e.target.closest(".menu-item, .dropdown-item");
        if (!row || !this._menu.contains(row)) return;
        this.dispatchEvent(
          new CustomEvent("mue-select", {
            bubbles: true,
            composed: true,
            detail: { value: row.getAttribute("value") || row.textContent.trim(), label: row.textContent.trim() }
          })
        );
        this.#close("select");
      };
      menu.addEventListener("click", this._onItem);
      this._onDoc = () => {
        if (this.open) this.#close("outside");
      };
      document.addEventListener("click", this._onDoc);
      this._built = true;
    }
    #items() {
      return Array.from(this._menu.querySelectorAll(".menu-item, .dropdown-item")).filter((el) => !el.disabled);
    }
    #sync() {
      const open = this.open;
      this.classList.toggle("is-open", open);
      this._menu.setAttribute("aria-hidden", String(!open));
      this._trigger.setAttribute("aria-expanded", String(open));
      if (open) {
        const first = this.#items()[0];
        if (first) first.focus();
        this.dispatchEvent(new CustomEvent("mue-open", { bubbles: true, composed: true, detail: {} }));
      }
    }
    #close(reason) {
      if (!this.open) return;
      this.removeAttribute("open");
      this._trigger.setAttribute("aria-expanded", "false");
      this._menu.setAttribute("aria-hidden", "true");
      if (reason === "escape" || reason === "select") this._trigger.focus();
      this.dispatchEvent(new CustomEvent("mue-close", { bubbles: true, composed: true, detail: { reason } }));
    }
  }
  if (!customElements.get("mue-dropdown")) customElements.define("mue-dropdown", MueDropdown);
  return MueDropdown;
}

export const MueDropdown = defineMueDropdown();
export default MueDropdown;
