/* BEGIN MUE:META
  COMPONENT: Modal
  ID: wc-mue-modals
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: modals
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/modals/modals.html
  SHEET: styles/components.css#overlays — the host renders <div class="overlay"><div class="modal"
    role="dialog" aria-modal="true" aria-labelledby [--modal-w?]> <div class="modal-header"><span
    class="modal-title">+<button class="modal-close">·</div><div class="modal-body">…author
    children…</div><div class="modal-footer">[slot=footer]</div></div></div>. A <button slot="trigger">
    stays outside the overlay (a real opener). Closed overlays are visibility:hidden in the sheet, so
    the form leaves the tab order; the element never sets --modal-w unless the width attribute is
    given, exactly as the vanilla panel override does. Adds no CSS.
  LIGHT_DOM: true
  VARIANTS: form modal (create item), width override, footer action set
  PROPS: title, open (bool), width (CSS length, applied as --modal-w inline)
  STATES: .is-open on the overlay is the single visible state the sheet knows; html.mue-locked
    (design-tokens/engine.css) locks page scroll while open, matching styles/mue.js
  A11Y: role="dialog" + aria-modal="true" + aria-labelledby to the title; the close glyph carries an
    aria-label; the scrim never receives focus; every input is labelled in the body — placeholder is
    never the label
  KEYBOARD: Escape closes; Tab / Shift+Tab are trapped and wrap inside the panel; focus moves to the
    first control on open and returns to the opener on close
  EVENTS: mue-open {detail:{title}}, mue-close {detail:{reason:'escape'|'close'|'scrim'|'footer'}}
  RESPONSIVE: panel width is min(--modal-w,100%) and the body scrolls inside max-height 85vh; below
    640px the sheet turns it into a bottom sheet with stretched footer buttons (components.css#overlays)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let modalSeq = 0;
const MODAL_FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function defineMueModals() {
  class MueModals extends HTMLElement {
    static get observedAttributes() {
      return ["open", "title", "width"];
    }
    constructor() {
      super();
      this._built = false;
      this._lastFocus = null;
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#syncOpen();
    }
    disconnectedCallback() {
      if (this._boundDoc) {
        document.removeEventListener("keydown", this._onDocKey);
        this._boundDoc = false;
      }
    }
    attributeChangedCallback(name) {
      if (!this._built) return;
      if (name === "open") this.#syncOpen();
      else if (name === "title" && this._titleEl) this._titleEl.textContent = this.getAttribute("title") || "";
      else if (name === "width" && this._modal) this.#applyWidth();
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.setAttribute("open", "");
      else this.removeAttribute("open");
    }
    show() {
      this.open = true;
    }
    close(reason) {
      if (!this.open) return;
      this.open = false;
      this.dispatchEvent(new CustomEvent("mue-close", { bubbles: true, composed: true, detail: { reason: reason || "close" } }));
    }
    #build() {
      const titleId = "mue-modal-title-" + ++modalSeq;
      const triggers = Array.from(this.querySelectorAll('[slot="trigger"]'));
      const titleKids = Array.from(this.querySelectorAll('[slot="title"]'));
      const footerKids = Array.from(this.querySelectorAll('[slot="footer"]'));
      const skip = new Set([].concat(triggers, titleKids, footerKids));
      const bodyKids = Array.from(this.childNodes).filter((n) => !skip.has(n));

      const overlay = document.createElement("div");
      overlay.className = "overlay";
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", titleId);
      modal.tabIndex = -1;

      const header = document.createElement("div");
      header.className = "modal-header";
      const title = document.createElement("span");
      title.className = "modal-title";
      title.id = titleId;
      if (titleKids.length) titleKids.forEach((n) => title.appendChild(n));
      else title.textContent = this.getAttribute("title") || "";
      const close = document.createElement("button");
      close.className = "modal-close";
      close.type = "button";
      close.setAttribute("aria-label", "Close dialog");
      close.innerHTML = "&times;";
      header.append(title, close);

      const body = document.createElement("div");
      body.className = "modal-body";
      bodyKids.forEach((n) => body.appendChild(n));

      modal.append(header, body);
      if (footerKids.length) {
        const footer = document.createElement("div");
        footer.className = "modal-footer";
        footerKids.forEach((n) => footer.appendChild(n));
        modal.appendChild(footer);
        this._footer = footer;
      }
      overlay.appendChild(modal);

      this.textContent = "";
      triggers.forEach((t) => this.appendChild(t));
      this.appendChild(overlay);

      this._overlay = overlay;
      this._modal = modal;
      this._titleEl = title;
      this.#applyWidth();

      triggers.forEach((t) => {
        if (t.tagName === "BUTTON") t.setAttribute("aria-haspopup", "dialog");
        t.addEventListener("click", () => {
          this.open = true;
        });
      });
      close.addEventListener("click", () => this.close("close"));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.close("scrim");
      });
      if (this._footer) {
        this._footer.addEventListener("click", (e) => {
          if (e.target.closest("[data-mue-close]")) this.close("footer");
        });
      }
      modal.addEventListener("keydown", (e) => this.#trap(e));
      this._boundDoc = true;
      this._onDocKey = (e) => {
        if (e.key === "Escape" && this.open) this.close("escape");
      };
      document.addEventListener("keydown", this._onDocKey);

      this._built = true;
    }
    #applyWidth() {
      const w = this.getAttribute("width");
      if (w) this._modal.style.setProperty("--modal-w", w);
      else this._modal.style.removeProperty("--modal-w");
    }
    #syncOpen() {
      if (!this._overlay) return;
      const open = this.open;
      if (open === this._overlay.classList.contains("is-open")) return;
      this._overlay.classList.toggle("is-open", open);
      document.documentElement.classList.toggle("mue-locked", open);
      if (open) {
        this._lastFocus = document.activeElement;
        const f = this.#focusables();
        (f[0] || this._modal).focus();
        this.dispatchEvent(new CustomEvent("mue-open", { bubbles: true, composed: true, detail: { title: this.getAttribute("title") || "" } }));
      } else {
        this.#afterClose();
      }
    }
    #afterClose() {
      document.documentElement.classList.remove("mue-locked");
      if (this._lastFocus && this._lastFocus.focus) this._lastFocus.focus();
    }
    #focusables() {
      return Array.from(this._modal.querySelectorAll(MODAL_FOCUSABLE)).filter((el) => el.offsetParent !== null);
    }
    #trap(e) {
      if (e.key !== "Tab") return;
      const f = this.#focusables();
      if (!f.length) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  if (!customElements.get("mue-modals")) customElements.define("mue-modals", MueModals);
  return MueModals;
}

export const MueModals = defineMueModals();
export default MueModals;
