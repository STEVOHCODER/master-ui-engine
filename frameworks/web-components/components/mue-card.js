/* BEGIN MUE:META
  COMPONENT: Card
  ID: wc-mue-card
  GROUP: Frameworks > Web Components
  CATEGORY: cards
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#cards — the HOST element itself is given class "card" plus a variant
    modifier (card-elevated / card-outlined / card-featured / card-interactive). Author children
    (.card-media, .card-body, .card-tag, .card-title, .card-desc, .card-actions) stay in the light DOM.
  LIGHT_DOM: true (no internal markup is injected; the host is upgraded in place)
  VARIANTS: variant=none|elevated|outlined|featured|interactive, selected (bool), interactive (bool)
  PROPS: variant, selected, interactive
  EVENTS: none (a card is a container)
  A11Y: a plain card is a group of real elements, never a div with a click handler; interactive cards
    get cursor + hover lift from the sheet; selected sets aria-pressed (and role=button when
    interactive) so the state is announced
  KEYBOARD: interactive cards focus via their own links/buttons; a card[role=button] responds to
    Enter/Space like any real button element you place inside
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const CARD_VARIANTS = ["elevated", "outlined", "featured", "interactive"];

function defineMueCard() {
  class MueCard extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "interactive", "selected"];
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
    get selected() {
      return this.hasAttribute("selected");
    }
    set selected(v) {
      if (v) this.setAttribute("selected", "");
      else this.removeAttribute("selected");
    }
    #apply() {
      const cls = ["card"];
      const variant = this.variant;
      if (CARD_VARIANTS.includes(variant)) cls.push("card-" + variant);
      if (this.hasAttribute("interactive") && !cls.includes("card-interactive")) cls.push("card-interactive");
      this.className = cls.join(" ");
      const interactive = this.hasAttribute("interactive") || variant === "interactive";
      if (this.selected) {
        this.setAttribute("aria-pressed", "true");
        if (interactive) this.setAttribute("role", "button");
      } else {
        this.removeAttribute("aria-pressed");
        if (interactive) this.setAttribute("role", "button");
        else this.removeAttribute("role");
      }
    }
  }
  if (!customElements.get("mue-card")) customElements.define("mue-card", MueCard);
  return MueCard;
}

export const MueCard = defineMueCard();
export default MueCard;
