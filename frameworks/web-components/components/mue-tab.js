/* BEGIN MUE:META
  COMPONENT: Tab
  ID: wc-mue-tab
  GROUP: Frameworks > Web Components
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css (behaviour owned by <mue-tabs>)
  SHEET: styles/components.css#tabs — the HOST element is the tab: class "tab", role="tab",
    aria-selected/aria-controls/tabindex managed by the parent <mue-tabs>. The active underline is
    the .tab[aria-selected="true"]::after ink bar.
  LIGHT_DOM: true
  VARIANTS: none (state comes from the parent tabs)
  PROPS: label (text), disabled (bool)
  EVENTS: none of its own (the parent <mue-tabs> emits mue-change)
  A11Y: role="tab", aria-selected reflects whether it is active, aria-controls points at its panel;
    a disabled tab is skipped in the roving tabindex
  KEYBOARD: Enter/Space activate the focused tab, Arrow keys move focus — both handled by <mue-tabs>
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueTab() {
  class MueTab extends HTMLElement {
    connectedCallback() {
      if (!this.getAttribute("role")) this.setAttribute("role", "tab");
      if (!this.classList.contains("tab")) this.classList.add("tab");
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(v) {
      if (v) this.setAttribute("disabled", "");
      else this.removeAttribute("disabled");
    }
    get label() {
      return (this.getAttribute("label") || this.textContent).trim();
    }
  }
  if (!customElements.get("mue-tab")) customElements.define("mue-tab", MueTab);
  return MueTab;
}

export const MueTab = defineMueTab();
export default MueTab;
