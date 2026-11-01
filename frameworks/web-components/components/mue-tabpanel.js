/* BEGIN MUE:META
  COMPONENT: Tab Panel
  ID: wc-mue-tabpanel
  GROUP: Frameworks > Web Components
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#tabs — the HOST element is class "tab-panel", role="tabpanel",
    aria-labelledby set by <mue-tabs>; hidden inactive panels are removed by .tab-panel[hidden].
  LIGHT_DOM: true
  VARIANTS: none
  PROPS: name (optional id hint)
  EVENTS: none (its visibility is owned by <mue-tabs>)
  A11Y: role="tabpanel" + aria-labelledby back to its tab; the panel is tabindex="0" so it can be
    focused and scrolled by keyboard
  KEYBOARD: none of its own
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueTabpanel() {
  class MueTabpanel extends HTMLElement {
    connectedCallback() {
      if (!this.getAttribute("role")) this.setAttribute("role", "tabpanel");
      if (!this.classList.contains("tab-panel")) this.classList.add("tab-panel");
      if (this.tabIndex < 0) this.tabIndex = 0;
    }
  }
  if (!customElements.get("mue-tabpanel")) customElements.define("mue-tabpanel", MueTabpanel);
  return MueTabpanel;
}

export const MueTabpanel = defineMueTabpanel();
export default MueTabpanel;
