/* BEGIN MUE:META
  COMPONENT: Dialog
  ID: wc-mue-dialog
  GROUP: Frameworks > Web Components
  CATEGORY: modals
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#overlays — the host renders <div class="overlay"><div class="dialog"
    role="dialog" aria-modal="true"><div class="dialog-header"><span class="dialog-title">+
    <button class="dialog-close">&middot;</div><div class="dialog-body">…author children…</div>
    [<div class="dialog-footer">slot=footer children</div>]</div></div>. Visibility is driven purely
    by the .is-open class on the overlay (the sheet hides a closed overlay via visibility:hidden).
  LIGHT_DOM: true
  VARIANTS: open (bool)
  PROPS: title, open, labelledBy (optional id override)
  EVENTS: mue-open {detail:{title}}, mue-close {detail:{reason:'escape'|'close'|'scrim'}}
  A11Y: role="dialog" + aria-modal="true" + aria-labelledby to the title; Escape closes; Tab is
    trapped and wraps inside the panel; focus moves to the first control on open and returns to the
    previously focused element on close; the scrim never receives focus; body scroll is locked while open
  KEYBOARD: Escape closes; Tab / Shift+Tab cycle within the dialog
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let seq = 0;
const uid = (p) => p + "-" + ++seq;
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function defineMueDialog() {
  class MueDialog extends HTMLElement {
    static get observedAttributes() {
      return ["open", "title"];
    }
    constructor() {
      super();
      this._lastFocus = null;
      this._built = false;
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#syncOpen();
    }
    attributeChangedCallback(name) {
      if (name === "open") this.#syncOpen();
      else if (name === "title" && this._titleEl) {
        this._titleEl.textContent = this.getAttribute("title") || "";
      }
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.setAttribute("open", "");
      else this.removeAttribute("open");
    }
    #build() {
      const titleId = uid("mue-dialog-title");
      const overlay = document.createElement("div");
      overlay.className = "overlay";
      const dialog = document.createElement("div");
      dialog.className = "dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", titleId);
      dialog.tabIndex = -1;

      const header = document.createElement("div");
      header.className = "dialog-header";
      const title = document.createElement("span");
      title.className = "dialog-title";
      title.id = titleId;
      title.textContent = this.getAttribute("title") || "";
      const close = document.createElement("button");
      close.className = "dialog-close";
      close.type = "button";
      close.setAttribute("aria-label", "Close dialog");
      close.innerHTML = "&times;";
      header.append(title, close);

      // Partition author children: [slot=footer] -> footer, rest -> body.
      const footerChildren = Array.from(this.querySelectorAll('[slot="footer"]'));
      const bodyChildren = Array.from(this.childNodes).filter(
        (n) => !footerChildren.includes(n)
      );

      const body = document.createElement("div");
      body.className = "dialog-body";
      bodyChildren.forEach((n) => body.appendChild(n));

      dialog.appendChild(header);
      dialog.appendChild(body);
      if (footerChildren.length) {
        const footer = document.createElement("div");
        footer.className = "dialog-footer";
        footerChildren.forEach((n) => footer.appendChild(n));
        dialog.appendChild(footer);
      }

      overlay.appendChild(dialog);
      this.appendChild(overlay);

      this._overlay = overlay;
      this._dialog = dialog;
      this._titleEl = title;

      close.addEventListener("click", () => this.#close("close"));
      this._onOverlayClick = (e) => {
        if (e.target === overlay) this.#close("scrim");
      };
      overlay.addEventListener("click", this._onOverlayClick);
      this._onKeydown = (e) => this.#onKey(e);
      dialog.addEventListener("keydown", this._onKeydown);

      this._built = true;
    }
    #syncOpen() {
      if (!this._overlay) return;
      const open = this.open;
      this._overlay.classList.toggle("is-open", open);
      if (open) {
        this._lastFocus = document.activeElement;
        document.body.style.overflow = "hidden";
        const f = this.#focusables();
        (f[0] || this._dialog).focus();
        this.dispatchEvent(new CustomEvent("mue-open", { bubbles: true, composed: true, detail: { title: this.getAttribute("title") || "" } }));
      } else {
        document.body.style.overflow = "";
      }
    }
    #focusables() {
      return Array.from(this._dialog.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    }
    #onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.#close("escape");
        return;
      }
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
    #close(reason) {
      if (!this.open) return;
      this.removeAttribute("open");
      document.body.style.overflow = "";
      if (this._lastFocus && this._lastFocus.focus) this._lastFocus.focus();
      this.dispatchEvent(new CustomEvent("mue-close", { bubbles: true, composed: true, detail: { reason } }));
    }
    show() {
      this.open = true;
    }
    close() {
      this.#close("close");
    }
  }
  if (!customElements.get("mue-dialog")) customElements.define("mue-dialog", MueDialog);
  return MueDialog;
}

export const MueDialog = defineMueDialog();
export default MueDialog;
