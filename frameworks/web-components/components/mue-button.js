/* BEGIN MUE:META
  COMPONENT: Button
  ID: wc-mue-button
  GROUP: Frameworks > Web Components
  CATEGORY: buttons
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css (linked by the host page)
  SHEET: styles/components.css#buttons — the inner <button> carries btn-primary / btn-secondary /
    btn-outline / btn-ghost / btn-danger / btn-success / btn-link plus btn-sm, btn-lg, btn-icon,
    btn-block and the .loading/.bar sweep. No shadow root: the classes live in the document sheet.
  LIGHT_DOM: true
  VARIANTS: variant=primary|secondary|outline|ghost|danger|success|link, size=sm|lg, icon (bool),
    block (bool), state=loading, disabled (bool)
  PROPS: variant, size, state, type, disabled, block, icon
  EVENTS: native click only; no synthetic event (a button is a button)
  A11Y: renders a real <button> so Enter/Space activate for free; disabled maps to the button's
    disabled attribute; icon-only requires aria-label (mirrored from host to button); loading sets
    aria-busy and injects the .bar sweep; decorative SVGs stay aria-hidden
  KEYBOARD: inherits native button activation (Enter / Space)
  VERIFIED: not-verified (headless-Chrome gallery run required before this is claimed to work)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger", "success", "link"];

function defineMueButton() {
  class MueButton extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "size", "state", "type", "disabled", "block", "icon", "aria-label"];
    }

    constructor() {
      super();
      this._label = null; // text nodes moved off the host on first render
      this._rendered = false;
    }

    connectedCallback() {
      this.#render();
    }

    attributeChangedCallback() {
      if (this._rendered) this.#render();
    }

    get variant() {
      return this.getAttribute("variant") || "primary";
    }
    set variant(v) {
      this.setAttribute("variant", v);
    }

    get size() {
      return this.getAttribute("size") || "";
    }
    set size(v) {
      if (v) this.setAttribute("size", v);
      else this.removeAttribute("size");
    }

    get state() {
      return this.getAttribute("state") || "";
    }
    set state(v) {
      if (v) this.setAttribute("state", v);
      else this.removeAttribute("state");
    }

    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(v) {
      if (v) this.setAttribute("disabled", "");
      else this.removeAttribute("disabled");
    }

    get type() {
      return this.getAttribute("type") || "button";
    }
    set type(v) {
      this.setAttribute("type", v);
    }

    #render() {
      // Capture author label markup once, then rebuild the inner <button>.
      if (!this._rendered) {
        const frag = document.createDocumentFragment();
        while (this.firstChild) frag.appendChild(this.firstChild);
        this._label = frag;
      }

      const variant = VARIANTS.includes(this.variant) ? this.variant : "primary";
      const cls = ["btn-" + variant];
      if (this.size === "sm" || this.size === "lg") cls.push("btn-" + this.size);
      if (this.hasAttribute("icon")) cls.push("btn-icon");
      if (this.hasAttribute("block")) cls.push("btn-block");
      if (this.state === "loading") cls.push("loading");

      const btn = document.createElement("button");
      btn.type = this.type;
      btn.className = cls.join(" ");
      if (this.disabled) btn.disabled = true;
      const al = this.getAttribute("aria-label");
      if (al) btn.setAttribute("aria-label", al);
      if (this.state === "loading") {
        btn.setAttribute("aria-busy", "true");
        const bar = document.createElement("span");
        bar.className = "bar";
        bar.setAttribute("aria-hidden", "true");
        btn.appendChild(bar);
      }
      btn.appendChild(this._label.cloneNode(true));

      this.textContent = "";
      this.appendChild(btn);
      // Reflect resolved state onto the host so CSS attribute selectors and users can read it.
      this.setAttribute("variant", variant);
      this._rendered = true;
    }
  }

  if (!customElements.get("mue-button")) {
    customElements.define("mue-button", MueButton);
  }
  return MueButton;
}

export const MueButton = defineMueButton();
export default MueButton;
