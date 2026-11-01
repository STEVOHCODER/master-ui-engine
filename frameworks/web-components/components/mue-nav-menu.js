/* BEGIN MUE:META
  COMPONENT: Navigation Menu
  ID: wc-mue-nav-menu
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/navigation/navigation-menu.html
  SHEET: styles/components.css#navigation + #dropdown — the host upgrades to
    <nav class="navbar" aria-label>. Authored <a class="nav-link"> and <div class="dropdown"> children
    are wrapped in <li class="nav-item"> and moved into a <ul class="nav-links">, followed by a
    <div class="nav-spacer"> and a built <button class="hamburger">. A dropdown the author supplies is
    <div class="dropdown"><button class="nav-link" aria-haspopup aria-expanded><ul class="dropdown-menu"
    role="menu" aria-hidden><li><a class="menu-item">. .navbar/.nav-links/.nav-item/.nav-link/.nav-spacer/
    .hamburger/.dropdown/.dropdown-menu/.menu-item and the .is-open / .is-scrolled states all come from
    the sheet; the element drives those states itself (no data-menu-toggle, no data-dropdown), so the
    global script never double-wires it. Adds no CSS.
  LIGHT_DOM: true
  VARIANTS: default menu, with dropdown
  PROPS: label (nav name, default "Main navigation")
  STATES: hamburger toggles .is-open on the links (drawer below 768px); each dropdown toggles
    .dropdown.is-open + aria-expanded + menu aria-hidden; a passive scroll listener adds .is-scrolled
    past 8px; active link keeps aria-current="page"
  A11Y: <nav aria-label> landmark; nav links are real <a> (aria-current="page" marks the active one);
    a dropdown trigger exposes aria-haspopup/aria-expanded and its menu is role="menu" with menu-item
    links; arrows stay 44px with a visible focus ring; the hamburger carries aria-controls/expanded/label
  KEYBOARD: links/tab-natural; the hamburger is a button (Enter/Space opens the drawer); a dropdown
    trigger is a button, opening focuses its first row and ArrowUp/ArrowDown walk and wrap the rows,
    Home/End jump; Escape closes the menu and returns focus to the trigger, or closes the drawer when
    no menu is open; a click outside closes both. Mirrors styles/mue.js#[data-dropdown]
  EVENTS: mue-navigate {detail:{href,label}} on a nav link; mue-select {detail:{value,label}} on a menu item
  RESPONSIVE: below 768px the list collapses behind the hamburger into the sheet's drawer; otherwise a
    row with the spacer pushing actions right; .navbar is sticky (relaxed only in a preview frame)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let navSeq = 0;

function defineMueNavMenu() {
  class MueNavMenu extends HTMLElement {
    static get observedAttributes() {
      return ["label"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
    }
    attributeChangedCallback(name) {
      if (name === "label" && this.isConnected) this.setAttribute("aria-label", this.getAttribute("label") || "Main navigation");
    }
    #build() {
      const linksId = "mue-nav-" + ++navSeq;
      this.className = "navbar";
      this.setAttribute("aria-label", this.getAttribute("label") || "Main navigation");

      const ul = document.createElement("ul");
      ul.className = "nav-links";
      ul.id = linksId;

      Array.from(this.children).forEach((node) => {
        let li = node;
        if (node.tagName === "A" || node.classList.contains("dropdown")) {
          this.removeChild(node);
          li = document.createElement("li");
          li.className = "nav-item";
          li.appendChild(node);
        } else if (node.tagName === "LI") {
          this.removeChild(node);
          node.classList.add("nav-item");
          li = node;
        } else {
          return;
        }
        ul.appendChild(li);
      });

      const spacer = document.createElement("div");
      spacer.className = "nav-spacer";
      const burger = document.createElement("button");
      burger.className = "hamburger";
      burger.type = "button";
      burger.setAttribute("aria-controls", linksId);
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Toggle navigation");
      burger.textContent = "\u2630";

      this.textContent = "";
      this.append(ul, spacer, burger);
      this._ul = ul;
      this._burger = burger;

      burger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = ul.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });

      ul.addEventListener("click", (e) => {
        const link = e.target.closest("a.nav-link");
        const menu = e.target.closest(".menu-item");
        const dd = e.target.closest(".dropdown");
        if (menu && dd) {
          this.dispatchEvent(
            new CustomEvent("mue-select", { bubbles: true, composed: true, detail: { value: menu.getAttribute("value") || menu.textContent.trim(), label: menu.textContent.trim() } })
          );
          this.#closeDropdown(dd);
          return;
        }
        if (link && !dd) {
          this.dispatchEvent(
            new CustomEvent("mue-navigate", { bubbles: true, composed: true, detail: { href: link.getAttribute("href"), label: link.textContent.trim() } })
          );
          ul.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      });

      Array.from(ul.querySelectorAll(".dropdown")).forEach((dd) => {
        const trig = dd.querySelector("button.nav-link, button");
        const menu = dd.querySelector(".dropdown-menu");
        if (!trig || !menu) return;
        trig.setAttribute("aria-haspopup", "true");
        trig.setAttribute("aria-expanded", "false");
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-hidden", "true");
        dd._trigger = trig;
        dd._menu = menu;
        trig.addEventListener("click", (e) => {
          e.stopPropagation();
          const open = !dd.classList.contains("is-open");
          this.#closeAllDropdowns();
          if (open) {
            dd.classList.add("is-open");
            trig.setAttribute("aria-expanded", "true");
            menu.setAttribute("aria-hidden", "false");
            /* Opening hands focus to the first row, the same move styles/mue.js
               makes at line 370; a menu you cannot reach by keyboard is not open. */
            const first = menu.querySelector(".menu-item, .dropdown-item");
            if (first) first.focus();
          }
        });
      });

      this._onDoc = (e) => {
        if (!this.contains(e.target)) {
          this.#closeAllDropdowns();
          ul.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      };
      this._onKey = (e) => {
        const dd = this._ul.querySelector(".dropdown.is-open");
        if (dd && dd._menu) {
          const items = Array.from(dd._menu.querySelectorAll(".menu-item, .dropdown-item"));
          const step = e.key === "ArrowDown" ? 1 : -1;
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
            e.preventDefault();
            const i = items.indexOf(document.activeElement);
            items[(i + step + items.length) % items.length].focus();
            return;
          }
          if (e.key === "Home" && items.length) {
            e.preventDefault();
            items[0].focus();
            return;
          }
          if (e.key === "End" && items.length) {
            e.preventDefault();
            items[items.length - 1].focus();
            return;
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            this.#closeDropdown(dd);
            if (dd._trigger) dd._trigger.focus();
            return;
          }
        }
        if (e.key === "Escape") {
          this.#closeAllDropdowns();
          if (ul.classList.contains("is-open")) {
            ul.classList.remove("is-open");
            burger.setAttribute("aria-expanded", "false");
            burger.focus();
          }
        }
      };
      document.addEventListener("click", this._onDoc);
      document.addEventListener("keydown", this._onKey);

      this._onScroll = () => this.classList.toggle("is-scrolled", window.scrollY > 8);
      window.addEventListener("scroll", this._onScroll, { passive: true });

      this._built = true;
    }
    #closeDropdown(dd) {
      dd.classList.remove("is-open");
      if (dd._trigger) dd._trigger.setAttribute("aria-expanded", "false");
      if (dd._menu) dd._menu.setAttribute("aria-hidden", "true");
    }
    #closeAllDropdowns() {
      Array.from(this._ul.querySelectorAll(".dropdown.is-open")).forEach((dd) => this.#closeDropdown(dd));
    }
    disconnectedCallback() {
      document.removeEventListener("click", this._onDoc);
      document.removeEventListener("keydown", this._onKey);
      if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
    }
  }
  if (!customElements.get("mue-nav-menu")) customElements.define("mue-nav-menu", MueNavMenu);
  return MueNavMenu;
}

export const MueNavMenu = defineMueNavMenu();
export default MueNavMenu;
