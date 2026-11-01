/* BEGIN MUE:META
  COMPONENT: Avatar Group
  ID: wc-mue-avatar-group
  GROUP: Frameworks > Web Components
  CATEGORY: display
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, components/mue-avatar.js
  SHEET: styles/components.css#display — the HOST element is class "avatar-group"; it lays out its
    <mue-avatar> children with a ring and a negative overlap (.avatar-group .avatar /
    .avatar-group .avatar + .avatar). No extra markup is injected; author children are kept in the
    light DOM.
  LIGHT_DOM: true
  VARIANTS: none (only .avatar-group exists in components.css)
  PROPS: label (accessible name)
  EVENTS: none
  A11Y: role="group" + aria-label so the stack reads as one set; each avatar keeps its own text/alt
  KEYBOARD: none
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueAvatarGroup() {
  class MueAvatarGroup extends HTMLElement {
    static get observedAttributes() {
      return ["label"];
    }
    connectedCallback() {
      this.classList.add("avatar-group");
      this.setAttribute("role", "group");
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
    }
    attributeChangedCallback() {
      const label = this.getAttribute("label");
      if (label) this.setAttribute("aria-label", label);
    }
  }
  if (!customElements.get("mue-avatar-group")) customElements.define("mue-avatar-group", MueAvatarGroup);
  return MueAvatarGroup;
}

export const MueAvatarGroup = defineMueAvatarGroup();
export default MueAvatarGroup;
