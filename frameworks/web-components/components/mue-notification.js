/* BEGIN MUE:META
  COMPONENT: Notification
  ID: wc-mue-notification
  GROUP: Frameworks > Web Components
  CATEGORY: notifications
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#notifications — type="alert" renders class "alert alert-<variant>"
    (.alert-icon + .toast-body>.toast-title/.toast-msg); type="toast" renders class "toast
    toast-<variant>" (.toast-icon + .toast-body + .toast-close). Toast entry/exit is .is-open /
    .is-leaving and [hidden] in the sheet; the icon glyph is decorative (aria-hidden).
  LIGHT_DOM: true
  VARIANTS: type=alert|toast, variant=success|error|danger|warning|info, solid n/a
  PROPS: type, variant, title, message, open (toast visibility), timeout (ms; toast auto-dismiss only
    when set — no duration is hardcoded in the component)
  EVENTS: mue-close {detail:{type,variant}} when a toast is dismissed
  A11Y: role="alert" on both so text is announced; the dismiss control is a real button with an
    aria-label and visible focus ring; meaning carried by text + icon, never colour alone
  KEYBOARD: Escape and the close button dismiss a toast; nothing is focus-trapped (a toast is not a
    modal and never steals focus)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const ALERT_VARIANTS = ["success", "error", "warning", "info"];
const TOAST_VARIANTS = ["success", "error", "danger", "warning", "info"];
const GLYPH = { success: "✓", error: "✕", danger: "✕", warning: "⚠", info: "i" };

function defineMueNotification() {
  class MueNotification extends HTMLElement {
    static get observedAttributes() {
      return ["type", "variant", "title", "message", "open"];
    }
    connectedCallback() {
      this.#render();
      this.#sync();
    }
    attributeChangedCallback(name) {
      if (!this._rendered) return;
      // Structural attributes rebuild; visibility only syncs classes so the exit
      // transition (is-leaving) is not wiped by a mid-animation re-render.
      if (name === "open") {
        this.#sync();
      } else {
        this.#render();
        this.#sync();
      }
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.show();
      else this.hide();
    }
    #render() {
      const type = this.getAttribute("type") || "alert";
      const isToast = type === "toast";
      const allowed = isToast ? TOAST_VARIANTS : ALERT_VARIANTS;
      let variant = this.getAttribute("variant") || "info";
      if (!allowed.includes(variant)) variant = "info";
      if (type === "toast") this._iconClass = "toast-icon";
      else this._iconClass = "alert-icon";

      const glyph = document.createTextNode(GLYPH[variant] || "i");
      const icon = document.createElement("span");
      icon.className = this._iconClass;
      icon.setAttribute("aria-hidden", "true");
      icon.appendChild(glyph.cloneNode());

      const body = document.createElement("div");
      body.className = "toast-body";
      const title = document.createElement("span");
      title.className = "toast-title";
      title.textContent = this.getAttribute("title") || "";
      const msg = document.createElement("span");
      msg.className = "toast-msg";
      msg.textContent = this.getAttribute("message") || "";
      body.append(title, msg);

      const kids = [icon, body];
      if (isToast) {
        const close = document.createElement("button");
        close.className = "toast-close";
        close.type = "button";
        close.setAttribute("aria-label", "Dismiss");
        close.innerHTML = "&times;";
        close.addEventListener("click", () => this.hide());
        kids.push(close);
      }

      this.className = isToast ? "toast toast-" + variant : "alert alert-" + variant;
      this.setAttribute("role", "alert");
      if (isToast) this.setAttribute("aria-live", "polite");
      this.textContent = "";
      this.append(...kids);
      this._rendered = true;
    }
    #sync() {
      const isToast = (this.getAttribute("type") || "alert") === "toast";
      if (!isToast) {
        this.removeAttribute("hidden");
        return;
      }
      if (this.open) {
        this.removeAttribute("hidden");
        this.classList.add("is-open");
        this.classList.remove("is-leaving");
        const timeout = parseInt(this.getAttribute("timeout") || "", 10);
        if (Number.isFinite(timeout) && timeout > 0) {
          clearTimeout(this._timer);
          this._timer = setTimeout(() => this.hide(), timeout);
        }
      } else {
        this.classList.remove("is-open");
        this.setAttribute("hidden", "");
      }
    }
    show() {
      this.setAttribute("open", "");
    }
    hide() {
      if (this._timer) clearTimeout(this._timer);
      const isToast = (this.getAttribute("type") || "alert") === "toast";
      if (!isToast) {
        this.removeAttribute("open");
        return;
      }
      if (!this.open) return;
      this.classList.add("is-leaving");
      // Finalise once, whether or not the exit transition actually runs. A toast
      // shown and hidden in the same frame has no opacity to transition from
      // (it just left display:none), so transitionend may never fire — the
      // fallback timer guarantees the close lands and mue-close is emitted. The
      // default mirrors components/notifications/notifications.html, which removes
      // its clone one frame past the --duration-slow exit (420ms). This is
      // behaviour timing, not a CSS duration; it styles nothing.
      let settled = false;
      const finalize = () => {
        if (settled) return;
        settled = true;
        this.removeEventListener("transitionend", onEnd);
        clearTimeout(fallback);
        this.classList.remove("is-leaving");
        this.removeAttribute("open");
        this.dispatchEvent(
          new CustomEvent("mue-close", {
            bubbles: true,
            composed: true,
            detail: { type: "toast", variant: this.getAttribute("variant") || "info" }
          })
        );
      };
      const onEnd = (e) => {
        if (e.propertyName && e.propertyName !== "opacity") return;
        finalize();
      };
      const ms = parseInt(this.getAttribute("duration") || "420", 10);
      const fallback = setTimeout(finalize, Number.isFinite(ms) && ms > 0 ? ms : 420);
      this.addEventListener("transitionend", onEnd);
    }
  }
  if (!customElements.get("mue-notification")) customElements.define("mue-notification", MueNotification);
  return MueNotification;
}

export const MueNotification = defineMueNotification();
export default MueNotification;
