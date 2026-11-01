/* BEGIN MUE:META
  COMPONENT: Badge
  ID: wc-mue-badge
  GROUP: Frameworks > Web Components
  CATEGORY: badges
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#badges — the HOST element is given class "badge" plus a variant
    modifier (badge-primary / badge-success / badge-warning / badge-danger|badge-error / badge-info)
    and optional badge-solid; an optional leading <span class="dot"> is injected as the first child.
  LIGHT_DOM: true
  VARIANTS: variant=(default)|primary|success|warning|danger|error|info, solid (bool), dot (bool)
  PROPS: variant, solid, dot
  EVENTS: none
  A11Y: a badge conveys state through text, not colour alone; the decorative dot is aria-hidden
  KEYBOARD: none (static label)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const BADGE_VARIANTS = ["primary", "success", "warning", "danger", "error", "info"];

function defineMueBadge() {
  class MueBadge extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "solid", "dot"];
    }
    connectedCallback() {
      this.#apply();
    }
    attributeChangedCallback() {
      this.#apply();
    }
    get variant() {
      return this.getAttribute("variant") || "";
    }
    set variant(v) {
      this.setAttribute("variant", v);
    }
    #apply() {
      const cls = ["badge"];
      const v = this.variant;
      if (BADGE_VARIANTS.includes(v)) cls.push("badge-" + v);
      if (this.hasAttribute("solid")) cls.push("badge-solid");
      this.className = cls.join(" ");
      let dot = this.querySelector(":scope > .dot");
      if (this.hasAttribute("dot")) {
        if (!dot) {
          dot = document.createElement("span");
          dot.className = "dot";
          dot.setAttribute("aria-hidden", "true");
          this.insertBefore(dot, this.firstChild);
        }
      } else if (dot) {
        dot.remove();
      }
    }
  }
  if (!customElements.get("mue-badge")) customElements.define("mue-badge", MueBadge);
  return MueBadge;
}

export const MueBadge = defineMueBadge();
export default MueBadge;
