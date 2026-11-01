/* BEGIN MUE:META
  COMPONENT: Input
  ID: wc-mue-input
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#fields — the host renders .field > .field-label + <input> +
    (.field-helper | .field-msg); state=error adds .is-error, state=success adds .is-success.
  LIGHT_DOM: true
  VARIANTS: type=text|email|password|search|tel|url|number, state=(none)|error|success, disabled
  PROPS: label, type, name, value, placeholder, helper, message, state, disabled, required, rows
  EVENTS: mue-change {detail:{value,name}} fired when the input's native change event fires
  A11Y: label associated by for/id; error state sets aria-invalid="true" and aria-describedby to
    the .field-msg; helper text sits under the control; disabled drops the input from the tab order
  KEYBOARD: native text-input behaviour
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueInput() {
  class MueInput extends HTMLElement {
    static get observedAttributes() {
      return ["label", "type", "name", "value", "placeholder", "helper", "message", "state", "disabled", "required"];
    }

    connectedCallback() {
      if (!this._id) this._id = uid("mue-input");
      this.#render();
    }
    attributeChangedCallback() {
      if (this._id) this.#render();
    }

    get value() {
      const i = this.querySelector("input");
      return i ? i.value : this.getAttribute("value") || "";
    }
    set value(v) {
      const i = this.querySelector("input");
      if (i) i.value = v;
      this.setAttribute("value", v);
    }

    #render() {
      const label = this.getAttribute("label") || "";
      const state = this.getAttribute("state") || "";
      const id = this._id;
      const msgId = id + "-msg";
      const helperId = id + "-helper";

      const field = document.createElement("div");
      field.className = "field" + (state === "error" ? " is-error" : state === "success" ? " is-success" : "");

      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.setAttribute("for", id);
      lab.textContent = label;
      field.appendChild(lab);

      const input = document.createElement("input");
      input.id = id;
      input.type = this.getAttribute("type") || "text";
      input.placeholder = this.getAttribute("placeholder") || "";
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      if (this._rendered) input.value = this.value;
      else input.value = this.getAttribute("value") || "";
      if (this.hasAttribute("disabled")) input.disabled = true;
      if (this.hasAttribute("required")) input.required = true;
      if (state === "error") {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", msgId);
      } else if (state === "success") {
        input.setAttribute("aria-invalid", "false");
        input.setAttribute("aria-describedby", msgId);
      }
      field.appendChild(input);

      if (state === "error" || state === "success") {
        const msg = document.createElement("p");
        msg.className = "field-msg";
        msg.id = msgId;
        msg.textContent = this.getAttribute("message") || "";
        field.appendChild(msg);
      } else if (this.getAttribute("helper")) {
        const h = document.createElement("p");
        h.className = "field-helper";
        h.id = helperId;
        h.textContent = this.getAttribute("helper");
        field.appendChild(h);
      }

      this.textContent = "";
      this.appendChild(field);

      input.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { value: input.value, name: input.name }
          })
        );
      });
      this._rendered = true;
    }
  }

  if (!customElements.get("mue-input")) customElements.define("mue-input", MueInput);
  return MueInput;
}

export const MueInput = defineMueInput();
export default MueInput;
