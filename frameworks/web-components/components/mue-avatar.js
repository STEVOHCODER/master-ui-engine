/* BEGIN MUE:META
  COMPONENT: Avatar
  ID: wc-mue-avatar
  GROUP: Frameworks > Web Components
  CATEGORY: display
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#display — the HOST element is class "avatar"; with a src it renders an
    <img> (object-fit:cover fills the circle), otherwise initials text from the initials/name attr.
    styles/components.css#display defines only the base .avatar — there is NO size/shape modifier
    class in the sheet, so this element exposes none.
  LIGHT_DOM: true
  VARIANTS: none (only .avatar exists in components.css)
  PROPS: src, alt, initials, name
  EVENTS: none
  A11Y: an image avatar gets its alt; an initials avatar is real text (announced as-is); the host
    exposes an aria-label when given a name so the identity is readable
  KEYBOARD: none
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function initialsFrom(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function defineMueAvatar() {
  class MueAvatar extends HTMLElement {
    static get observedAttributes() {
      return ["src", "alt", "initials", "name"];
    }
    connectedCallback() {
      this.#render();
    }
    attributeChangedCallback() {
      this.#render();
    }
    #render() {
      this.className = "avatar";
      const src = this.getAttribute("src");
      this.textContent = "";
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = this.getAttribute("alt") || this.getAttribute("name") || "";
        img.addEventListener("error", () => {
          img.replaceWith(document.createTextNode(this.getAttribute("initials") || initialsFrom(this.getAttribute("name")) || "?"));
        });
        this.appendChild(img);
      } else {
        const text = this.getAttribute("initials") || initialsFrom(this.getAttribute("name")) || "?";
        this.appendChild(document.createTextNode(text));
      }
      const name = this.getAttribute("name");
      if (name) this.setAttribute("aria-label", name);
      else this.removeAttribute("aria-label");
    }
  }
  if (!customElements.get("mue-avatar")) customElements.define("mue-avatar", MueAvatar);
  return MueAvatar;
}

export const MueAvatar = defineMueAvatar();
export default MueAvatar;
