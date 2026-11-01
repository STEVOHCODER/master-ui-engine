/* BEGIN MUE:META
  COMPONENT: Date Picker
  ID: wc-mue-date-picker
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/forms/date-picker/date-picker.html
  SHEET: styles/components.css#fields — the host renders <div class="field [is-error] [is-success]">
    <label class="field-label" for> <input type="date"> <p class="field-helper"> |
    <p class="field-msg">. The calendar surface itself is the platform's, exactly as in the vanilla
    preview: this element adds no popover markup and no CSS for the picker glyph.
  LIGHT_DOM: true
  VARIANTS: state=(none)|error|success, disabled, required, constrained (min/max)
  PROPS: label, type (date|datetime-local|month|week|time), name, value, min, max, step, placeholder,
    helper, message, state, disabled, required
  STATES: state=error adds .is-error + aria-invalid="true" + aria-describedby on the message;
    state=success adds .is-success; the native constraint-validity UI (out-of-range days greyed)
    comes from min/max, which the element forwards untouched
  EVENTS: mue-change {detail:{value,name,state}} when the native input fires change
  A11Y: label joined by for/id; required adds required + aria-required; min/max are forwarded so the
    platform picker enforces the range and announces it; the message is referenced by
    aria-describedby; disabled drops the input from the tab order
  KEYBOARD: the full date path is native — the picker opens from the field or its glyph, day/segment
    movement is Up/Down, month movement is PageUp/PageDown, Escape closes the platform popover;
    nothing here reimplements that, so nothing can drift from it
  RESPONSIVE: the field is full width and shrinks with its container; the sheet's
    @media (hover: none) rule grows the control to --control-h-lg on touch
  VERIFIED: headless Chrome (puppeteer-core) served over http by tools/audit/serve.js on port 8794:
    tag defined, 0 shadow roots, label/for-id joined, min+max forwarded to the native input,
    state=error wrote .is-error + aria-invalid="true" + aria-describedby, typing a date fired
    mue-change with the new value, and setting the value attribute repainted the input
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const DATE_TYPES = ["date", "datetime-local", "month", "week", "time"];
let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueDatePicker() {
  class MueDatePicker extends HTMLElement {
    static get observedAttributes() {
      return [
        "label", "type", "name", "value", "min", "max", "step", "placeholder",
        "helper", "message", "state", "disabled", "required"
      ];
    }
    connectedCallback() {
      if (!this._id) this._id = uid("mue-date-picker");
      this.#render();
    }
    attributeChangedCallback(name) {
      if (!this._id) return;
      if (name === "value" && this._input && this._input.value !== this.getAttribute("value")) {
        this.#setValue();
        return;
      }
      this.#render();
    }
    get value() {
      return this._input ? this._input.value : this.getAttribute("value") || "";
    }
    set value(v) {
      this.setAttribute("value", v);
    }
    #setValue() {
      const v = this.getAttribute("value") || "";
      if (this._input) this._input.value = v;
    }
    #render() {
      const state = this.getAttribute("state") || "";
      const id = this._id;
      const msgId = id + "-msg";
      const helperId = id + "-helper";

      const field = document.createElement("div");
      field.className = "field";
      if (state === "error") field.classList.add("is-error");
      if (state === "success") field.classList.add("is-success");

      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.setAttribute("for", id);
      lab.textContent = this.getAttribute("label") || "Date";
      field.appendChild(lab);

      const input = document.createElement("input");
      input.id = id;
      const type = this.getAttribute("type");
      input.type = DATE_TYPES.includes(type) ? type : "date";
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      input.placeholder = this.getAttribute("placeholder") || "";
      ["min", "max", "step"].forEach((a) => {
        if (this.hasAttribute(a)) input.setAttribute(a, this.getAttribute(a));
      });
      if (this._rendered) input.value = this.value;
      else input.value = this.getAttribute("value") || "";
      if (this.hasAttribute("disabled")) input.disabled = true;
      if (this.hasAttribute("required")) {
        input.required = true;
        input.setAttribute("aria-required", "true");
      }
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
        this.setAttribute("value", input.value);
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { value: input.value, name: input.name, state }
          })
        );
      });
      this._input = input;
      this._rendered = true;
    }
  }
  if (!customElements.get("mue-date-picker")) customElements.define("mue-date-picker", MueDatePicker);
  return MueDatePicker;
}

export const MueDatePicker = defineMueDatePicker();
export default MueDatePicker;
