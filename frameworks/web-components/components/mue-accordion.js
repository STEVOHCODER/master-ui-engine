/* BEGIN MUE:META
  COMPONENT: Accordion
  ID: wc-mue-accordion
  GROUP: Frameworks > Web Components
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, components/mue-accordion-item.js
  SHEET: styles/components.css#accordion — the host is class "accordion" (a grid of items) and owns
    its <mue-accordion-item> children. With single-open (the default) it closes the others when one
    opens; add the "multiple" attribute to let several stay open.
  LIGHT_DOM: true
  VARIANTS: multiple (bool) — otherwise one panel open at a time
  PROPS: multiple
  EVENTS: re-emits the bubbling mue-change {detail:{open,label}} from its items as mue-change
  A11Y: delegates roles/aria-expanded to each <mue-accordion-item> trigger + panel
  KEYBOARD: Enter/Space on each trigger (native buttons)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { MueAccordionItem } from "./mue-accordion-item.js";

function defineMueAccordion() {
  class MueAccordion extends HTMLElement {
    connectedCallback() {
      this.classList.add("accordion");
      if (this._bound) return;
      this._bound = (e) => {
        if (this.hasAttribute("multiple")) return;
        if (e.detail && e.detail.open) {
          this.querySelectorAll("mue-accordion-item").forEach((item) => {
            if (item !== e.target && item.hasAttribute("open")) item.removeAttribute("open");
          });
        }
      };
      this.addEventListener("mue-change", this._bound);
    }
    disconnectedCallback() {
      if (this._bound) this.removeEventListener("mue-change", this._bound);
      this._bound = null;
    }
  }
  if (!customElements.get("mue-accordion")) customElements.define("mue-accordion", MueAccordion);
  return MueAccordion;
}

export const MueAccordion = defineMueAccordion();
export { MueAccordionItem };
export default MueAccordion;
