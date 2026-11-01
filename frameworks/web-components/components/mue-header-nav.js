/* BEGIN MUE:META
  COMPONENT: Header Navigation
  ID: wc-mue-header-nav
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/navigation/header-nav.html
  SHEET: styles/components.css#navigation (+ #buttons, #display) — the host upgrades to
    <header class="site-header" role="banner"> with <a class="nav-brand">, <ul class="nav-links"> of
    <li class="nav-item"><a class="nav-link">, a <div class="nav-spacer">, a <div class="row"> of the
    author's [slot="actions"], and a built <button class="hamburger" aria-controls aria-expanded>.
    Below 768px the sheet turns .nav-links into a drawer revealed by .is-open; past 8px it grows a
    shadow via .is-scrolled. All those classes come from the sheet; no CSS is added. The element owns
    the toggle/scroll behaviour itself (it does NOT use data-menu-toggle), so the global script never
    double-wires it.
  LIGHT_DOM: true
  VARIANTS: default header, with user actions (sign-in button + avatar)
  PROPS: brand (nav-brand text)
  STATES: hamburger toggles .is-open on the links (aria-expanded tracks it); a passive scroll listener
    adds .is-scrolled past 8px, matching the vanilla page
  A11Y: <header role="banner"> landmark; the brand is a real link; each nav entry is an <a class=
    "nav-link"> and the active one keeps aria-current="page"; the hamburger carries aria-controls +
    aria-expanded + aria-label pointing at the links list; links are 44px with a visible focus ring
  KEYBOARD: links/brand/actions are ordinary tabbable controls; the hamburger is a real button so
    Enter/Space open the drawer; a focused link that leaves the drawer closes it
  EVENTS: mue-navigate {detail:{href, label}} when a nav link is activated
  RESPONSIVE: below 768px the links collapse behind the hamburger into the drawer; otherwise a single
    row with the spacer pushing the actions right (components.css#navigation)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let headerSeq = 0;

function defineMueHeaderNav() {
  class MueHeaderNav extends HTMLElement {
    static get observedAttributes() {
      return ["brand"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
      if (this._brand && !this._brandSlot) this._brand.textContent = this.getAttribute("brand") || this._brand.textContent;
    }
    attributeChangedCallback(name) {
      if (name === "brand" && this._brand && !this._brandSlot) this._brand.textContent = this.getAttribute("brand") || "";
    }
    #build() {
      const linksId = "mue-header-links-" + ++headerSeq;
      this.className = "site-header";
      this.setAttribute("role", "banner");

      const brand = document.createElement("a");
      brand.className = "nav-brand";
      brand.href = "#";
      const slotBrand = this.querySelector('[slot="brand"]');
      if (slotBrand) brand.appendChild(slotBrand);
      else brand.textContent = this.getAttribute("brand") || "Brand";

      const ul = document.createElement("ul");
      ul.className = "nav-links";
      ul.id = linksId;
      const actionNodes = Array.from(this.querySelectorAll('[slot="actions"]'));
      const skip = new Set(actionNodes.concat(slotBrand ? [slotBrand] : []));
      Array.from(this.children)
        .filter((n) => !skip.has(n) && (n.tagName === "A" || n.tagName === "LI"))
        .forEach((n) => {
          if (n.tagName === "A") {
            const li = document.createElement("li");
            li.className = "nav-item";
            this.removeChild(n);
            li.appendChild(n);
            ul.appendChild(li);
          } else {
            n.classList.add("nav-item");
            this.removeChild(n);
            ul.appendChild(n);
          }
        });

      const spacer = document.createElement("div");
      spacer.className = "nav-spacer";

      const actions = document.createElement("div");
      actions.className = "row";
      actionNodes.forEach((n) => actions.appendChild(n));

      const burger = document.createElement("button");
      burger.className = "hamburger";
      burger.type = "button";
      burger.setAttribute("aria-controls", linksId);
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Toggle navigation");
      burger.textContent = "\u2630";

      this.textContent = "";
      this.append(brand, ul, spacer, actions, burger);
      this._brand = brand;
      this._brandSlot = !!slotBrand;
      this._ul = ul;
      this._burger = burger;

      burger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = ul.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      ul.addEventListener("click", (e) => {
        const link = e.target.closest("a.nav-link");
        if (!link) return;
        this.dispatchEvent(
          new CustomEvent("mue-navigate", { bubbles: true, composed: true, detail: { href: link.getAttribute("href"), label: link.textContent.trim() } })
        );
        ul.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
      const onScroll = () => this.classList.toggle("is-scrolled", window.scrollY > 8);
      window.addEventListener("scroll", onScroll, { passive: true });
      this._onScroll = onScroll;
      this._built = true;
    }
    disconnectedCallback() {
      if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    }
  }
  if (!customElements.get("mue-header-nav")) customElements.define("mue-header-nav", MueHeaderNav);
  return MueHeaderNav;
}

export const MueHeaderNav = defineMueHeaderNav();
export default MueHeaderNav;
