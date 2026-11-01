/* BEGIN MUE:META
  COMPONENT: Textarea
  ID: wc-mue-textarea
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#fields — .field > .field-label + <textarea> + (.field-helper | .field-msg)
  LIGHT_DOM: true
  VARIANTS: state=(none)|error|success, disabled
  PROPS: label, name, value, placeholder, helper, message, state, disabled, required, rows
  EVENTS: mue-change {detail:{value,name}}
  A11Y: label by for/id; error sets aria-invalid="true" + aria-describedby to the message
  KEYBOARD: native multi-line text editing
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueTextarea() {
  class MueTextarea extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "placeholder", "helper", "message", "state", "disabled", "required", "rows"];
    }
    connectedCallback() {
      if (!this._id) this._id = uid("mue-textarea");
      this.#render();
    }
    attributeChangedCallback() {
      if (this._id) this.#render();
    }
    get value() {
      const t = this.querySelector("textarea");
      return t ? t.value : this.getAttribute("value") || "";
    }
    set value(v) {
      const t = this.querySelector("textarea");
      if (t) t.value = v;
      this.setAttribute("value", v);
    }
    #render() {
      const state = this.getAttribute("state") || "";
      const id = this._id;
      const msgId = id + "-msg";
      const field = document.createElement("div");
      field.className = "field" + (state === "error" ? " is-error" : state === "success" ? " is-success" : "");

      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.setAttribute("for", id);
      lab.textContent = this.getAttribute("label") || "";
      field.appendChild(lab);

      const ta = document.createElement("textarea");
      ta.id = id;
      ta.placeholder = this.getAttribute("placeholder") || "";
      ta.rows = parseInt(this.getAttribute("rows") || "3", 10);
      if (this.hasAttribute("name")) ta.name = this.getAttribute("name");
      ta.value = this._rendered ? this.value : this.getAttribute("value") || "";
      if (this.hasAttribute("disabled")) ta.disabled = true;
      if (this.hasAttribute("required")) ta.required = true;
      if (state === "error" || state === "success") {
        ta.setAttribute("aria-invalid", state === "error" ? "true" : "false");
        ta.setAttribute("aria-describedby", msgId);
      }
      field.appendChild(ta);

      if (state) {
        const msg = document.createElement("p");
        msg.className = "field-msg";
        msg.id = msgId;
        msg.textContent = this.getAttribute("message") || "";
        field.appendChild(msg);
      } else if (this.getAttribute("helper")) {
        const h = document.createElement("p");
        h.className = "field-helper";
        h.textContent = this.getAttribute("helper");
        field.appendChild(h);
      }

      this.textContent = "";
      this.appendChild(field);
      ta.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: ta.value, name: ta.name } })
        );
      });
      this._rendered = true;
    }
  }
  if (!customElements.get("mue-textarea")) customElements.define("mue-textarea", MueTextarea);
  return MueTextarea;
}

export const MueTextarea = defineMueTextarea();
export default MueTextarea;
