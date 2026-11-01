/* BEGIN MUE:META
  COMPONENT: Breadcrumbs
  ID: wc-mue-breadcrumbs
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/navigation/breadcrumbs.html
  SHEET: styles/components.css#navigation — the host element itself carries class="breadcrumbs"
    and an aria-label (it stays a <mue-breadcrumbs>, the sheet selector is the bare class), and lays
    out the trail as <a href> links separated by <span class="separator" aria-hidden>, with
    the last entry rendered as <span aria-current="page">. .breadcrumbs, its <a> and [aria-current]
    rules and .separator are all defined in the sheet. No CSS is added.
  LIGHT_DOM: true
  VARIANTS: default trail, compact trail (author sizes it), from an items attribute or from authored
    <a>/<span> children
  PROPS: items (comma list; each "Label" or "Label::href" — last entry is the current page), separator
    (glyph, default ‹ ›-style "›"), label (nav name, default "Breadcrumb")
  STATES: changing items/separator re-renders the trail and re-marks the final crumb as the current
    page; links are real anchors so they stay focusable
  A11Y: the host carries aria-label="Breadcrumb" (no <nav> element is created, so this is not a
    landmark); the current page carries aria-current="page";
    separators are aria-hidden so a reader hears the locations, not the glyphs
  KEYBOARD: plain links — Tab walks the crumbs, Enter follows the href; the element adds none
  EVENTS: none (links navigate on their own)
  RESPONSIVE: a fluid flex row that wraps as the trail grows; no breakpoint needed (components.css#navigation)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueBreadcrumbs() {
  class MueBreadcrumbs extends HTMLElement {
    static get observedAttributes() {
      return ["items", "separator", "label"];
    }
    connectedCallback() {
      if (!this._authored) this.#capture();
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    #capture() {
      this._authored = Array.from(this.children)
        .filter((n) => n.tagName === "A" || n.tagName === "SPAN")
        .map((n) => ({ text: n.textContent.trim(), href: n.getAttribute("href") }));
    }
    #fromAttr() {
      return (this.getAttribute("items") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((tok) => {
          const i = tok.indexOf("::");
          return i === -1 ? { text: tok, href: "#" } : { text: tok.slice(0, i), href: tok.slice(i + 2) };
        });
    }
    render() {
      const items = this.hasAttribute("items") ? this.#fromAttr() : this._authored || [];
      const sep = this.getAttribute("separator") || "\u203A";
      this.className = "breadcrumbs";
      this.setAttribute("aria-label", this.getAttribute("label") || "Breadcrumb");

      const frag = document.createDocumentFragment();
      items.forEach((it, i) => {
        if (i > 0) {
          const s = document.createElement("span");
          s.className = "separator";
          s.setAttribute("aria-hidden", "true");
          s.textContent = sep;
          frag.appendChild(s);
        }
        const last = i === items.length - 1;
        if (last) {
          const span = document.createElement("span");
          span.setAttribute("aria-current", "page");
          span.textContent = it.text;
          frag.appendChild(span);
        } else {
          const a = document.createElement("a");
          a.href = it.href || "#";
          a.textContent = it.text;
          frag.appendChild(a);
        }
      });
      this.textContent = "";
      this.appendChild(frag);
    }
  }
  if (!customElements.get("mue-breadcrumbs")) customElements.define("mue-breadcrumbs", MueBreadcrumbs);
  return MueBreadcrumbs;
}

export const MueBreadcrumbs = defineMueBreadcrumbs();
export default MueBreadcrumbs;
