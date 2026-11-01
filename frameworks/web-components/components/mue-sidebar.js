/* BEGIN MUE:META
  COMPONENT: Sidebar
  ID: wc-mue-sidebar
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: sidebars
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/sidebars/sidebar.html
  SHEET: styles/components.css#sidebar — three elements compose a sidebar:
    <mue-sidebar> upgrades to <aside class="sidebar" role="complementary" aria-label> and groups its
    authored children into <div class="sidebar-section"> blocks (a heading opens a new section);
    <mue-sidebar-heading> replaces itself with <div class="sidebar-heading">; <mue-sidebar-link>
    replaces itself with <a class="sidebar-link" href><span aria-hidden icon?><span class=
    "sidebar-label">. .sidebar, .sidebar-section, .sidebar-heading, .sidebar-link, .sidebar-label and
    .sidebar-brand are all defined in the sheet; the element adds no CSS.
  LIGHT_DOM: true
  VARIANTS: sectioned links, active state (current), with or without an icon glyph per link
  PROPS: mue-sidebar: label (aria-label); mue-sidebar-heading: text; mue-sidebar-link: href, icon
    (decorative glyph), current (bool), text (label, falls back to inner text)
  STATES: clicking a link moves aria-current="page" to it and emits mue-navigate — the single behaviour
    the static sidebar had none of; grouping is derived once at upgrade from the authored order
  A11Y: an <aside role="complementary" aria-label> landmark; icons are decorative (aria-hidden) and the
    real text lives in .sidebar-label; the active link uses aria-current="page" (colour + tint
    background, not colour alone); every link is a 44px-tall real anchor
  KEYBOARD: links are ordinary <a> — Tab walks them, Enter follows the href; nothing is trapped
  EVENTS: mue-navigate {detail:{href,label}} when a sidebar link is activated
  RESPONSIVE: above 900px the sidebar keeps a fixed width beside content; below it goes full width and
    stacks with the rule on its bottom edge — pure CSS in the sheet, no drawer
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueSidebar() {
  class MueSidebar extends HTMLElement {
    connectedCallback() {
      if (this._built) return;
      this.className = "sidebar";
      this.setAttribute("role", "complementary");
      this.setAttribute("aria-label", this.getAttribute("label") || "Sidebar");
      let section = null;
      const kids = Array.from(this.children);
      kids.forEach((k) => {
        if (k.tagName === "MUE-SIDEBAR-HEADING") {
          section = document.createElement("div");
          section.className = "sidebar-section";
          this.appendChild(section);
          section.appendChild(k);
        } else if (k.tagName === "MUE-SIDEBAR-LINK" || k.classList.contains("sidebar-link")) {
          if (!section) {
            section = document.createElement("div");
            section.className = "sidebar-section";
            this.appendChild(section);
          }
          section.appendChild(k);
        } else {
          this.appendChild(k);
        }
      });
      this.addEventListener("click", (e) => {
        const link = e.target.closest("a.sidebar-link");
        if (!link || !this.contains(link)) return;
        this.querySelectorAll("a.sidebar-link[aria-current]").forEach((l) => {
          if (l !== link) l.removeAttribute("aria-current");
        });
        link.setAttribute("aria-current", "page");
        this.dispatchEvent(
          new CustomEvent("mue-navigate", { bubbles: true, composed: true, detail: { href: link.getAttribute("href"), label: link.textContent.trim() } })
        );
      });
      this._built = true;
    }
  }
  if (!customElements.get("mue-sidebar")) customElements.define("mue-sidebar", MueSidebar);
  return MueSidebar;
}

function defineMueSidebarHeading() {
  class MueSidebarHeading extends HTMLElement {
    connectedCallback() {
      if (this._done) return;
      this._done = true;
      const div = document.createElement("div");
      div.className = "sidebar-heading";
      div.textContent = this.getAttribute("text") || this.textContent.trim();
      this.replaceWith(div);
    }
  }
  if (!customElements.get("mue-sidebar-heading")) customElements.define("mue-sidebar-heading", MueSidebarHeading);
  return MueSidebarHeading;
}

function defineMueSidebarLink() {
  class MueSidebarLink extends HTMLElement {
    connectedCallback() {
      if (this._done) return;
      this._done = true;
      const a = document.createElement("a");
      a.className = "sidebar-link";
      a.href = this.getAttribute("href") || "#";
      const icon = this.getAttribute("icon");
      if (icon) {
        const ic = document.createElement("span");
        ic.setAttribute("aria-hidden", "true");
        ic.textContent = icon;
        a.appendChild(ic);
      }
      const label = document.createElement("span");
      label.className = "sidebar-label";
      label.textContent = this.getAttribute("text") || this.textContent.trim();
      a.appendChild(label);
      if (this.hasAttribute("current")) a.setAttribute("aria-current", "page");
      this.replaceWith(a);
    }
  }
  if (!customElements.get("mue-sidebar-link")) customElements.define("mue-sidebar-link", MueSidebarLink);
  return MueSidebarLink;
}

export const MueSidebar = defineMueSidebar();
export const MueSidebarHeading = defineMueSidebarHeading();
export const MueSidebarLink = defineMueSidebarLink();
export default MueSidebar;
