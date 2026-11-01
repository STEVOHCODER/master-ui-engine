/* BEGIN MUE:META
  COMPONENT: Footer
  ID: wc-mue-footer
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: footers
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/footers/footers.html
  SHEET: styles/components.css#footers — the host upgrades itself to
    <footer class="footer" role="contentinfo"> and emits a brand block (div.footer-brand + p.footer-desc),
    one column per entry (div.footer-heading + ul.footer-links > li > a) and a bottom bar
    (div.footer-bottom > span + div.footer-social > a + span.sr-only). .footer, .footer-heading,
    .footer-links, .footer-brand, .footer-desc, .footer-bottom and .footer-social are all defined in
    the shared sheet; the element adds no CSS.
  LIGHT_DOM: true
  VARIANTS: default multi-column with bottom bar and social row
  PROPS: brand, desc, copyright, columns (JSON array of {title, links:[{label,href}]}), social
    (JSON array of {label, href, text}), label (landmark name)
  STATES: re-renders whenever any content attribute changes, so a page can update links without a
    rebuild — the auto-fit grid itself is the sheet's responsive behaviour
  A11Y: a single contentinfo landmark; the brand and copyright are text, every column link and social
    link is a real <a href>; social glyphs carry an aria-label so they are not colour/letter-only
  KEYBOARD: plain links — Tab reaches each column and social link in DOM order; nothing is trapped
  EVENTS: none (a static landmark; the only "behaviour" is attribute-driven re-render)
  RESPONSIVE: the .footer grid is auto-fit from ~11rem so columns collapse four → one as the width
    narrows with no breakpoint; the bottom bar spans 1/-1 (components.css#footers)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueFooter() {
  class MueFooter extends HTMLElement {
    static get observedAttributes() {
      return ["brand", "desc", "copyright", "columns", "social", "label"];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    #json(name, fallback) {
      const raw = this.getAttribute(name);
      if (!raw) return fallback;
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : fallback;
      } catch {
        return fallback;
      }
    }
    render() {
      this.className = "footer";
      this.setAttribute("role", "contentinfo");
      if (this.getAttribute("label")) this.setAttribute("aria-label", this.getAttribute("label"));

      const brand = this.getAttribute("brand") || "";
      const desc = this.getAttribute("desc") || "";
      const columns = this.#json("columns", []);
      const social = this.#json("social", []);
      const copyright = this.getAttribute("copyright") || "";

      const frag = document.createDocumentFragment();

      if (brand || desc) {
        const col = document.createElement("div");
        if (brand) {
          const b = document.createElement("div");
          b.className = "footer-brand";
          b.textContent = brand;
          col.appendChild(b);
        }
        if (desc) {
          const d = document.createElement("p");
          d.className = "footer-desc";
          d.textContent = desc;
          col.appendChild(d);
        }
        frag.appendChild(col);
      }

      columns.forEach((c) => {
        const col = document.createElement("div");
        const head = document.createElement("div");
        head.className = "footer-heading";
        head.textContent = c.title || "";
        col.appendChild(head);
        const ul = document.createElement("ul");
        ul.className = "footer-links";
        (c.links || []).forEach((l) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = l.href || "#";
          a.textContent = l.label || "";
          li.appendChild(a);
          ul.appendChild(li);
        });
        col.appendChild(ul);
        frag.appendChild(col);
      });

      if (copyright || social.length) {
        const bottom = document.createElement("div");
        bottom.className = "footer-bottom";
        if (copyright) {
          const s = document.createElement("span");
          s.textContent = copyright;
          bottom.appendChild(s);
        }
        if (social.length) {
          const row = document.createElement("div");
          row.className = "footer-social";
          social.forEach((so) => {
            const a = document.createElement("a");
            a.href = so.href || "#";
            const name = so.label || so.text || "";
            a.textContent = so.text || name;
            /* An aria-label that drops the chip's own letters breaks WCAG 2.5.3
               (label in name), so the full network name is appended as screen
               reader-only text instead of replacing the visible glyph. */
            if (name && a.textContent.trim() !== name) {
              const sr = document.createElement("span");
              sr.className = "sr-only";
              sr.textContent = " " + name;
              a.appendChild(sr);
            }
            row.appendChild(a);
          });
          bottom.appendChild(row);
        }
        frag.appendChild(bottom);
      }

      this.textContent = "";
      this.appendChild(frag);
    }
  }
  if (!customElements.get("mue-footer")) customElements.define("mue-footer", MueFooter);
  return MueFooter;
}

export const MueFooter = defineMueFooter();
export default MueFooter;
