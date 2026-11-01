/* BEGIN MUE:META
  COMPONENT: Checkbox
  ID: wc-mue-checkbox
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#choice — the host renders <label class="checkbox"><input type=checkbox>
    <span class="box" aria-hidden><svg tick></span><span>label</span></label>. The box, tick and
    focus ring are painted from the real input's :checked / :focus-visible state.
  LIGHT_DOM: true
  VARIANTS: checked (bool), disabled (bool)
  PROPS: label, name, value, checked, disabled, indeterminate
  EVENTS: mue-change {detail:{checked,value,name}}
  A11Y: native checkbox wrapped in its own <label> (whole row clickable), visually hidden but not
    display:none, so checked state is announced; focus ring lands on the box via input:focus-visible
    + .box; the tick svg is aria-hidden
  KEYBOARD: Space toggles (native checkbox)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const TICK = "M5 13l4 4L19 7";
let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueCheckbox() {
  class MueCheckbox extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "checked", "disabled"];
    }
    connectedCallback() {
      if (!this._id) this._id = uid("mue-checkbox");
      this.#render();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._id) return;
      if (name === "checked" || name === "disabled") {
        const input = this.querySelector("input");
        if (input) {
          if (name === "checked") input.checked = this.hasAttribute("checked");
          if (name === "disabled") input.disabled = this.hasAttribute("disabled");
        }
        return;
      }
      this.#render();
    }
    get checked() {
      const input = this.querySelector("input");
      return input ? input.checked : this.hasAttribute("checked");
    }
    set checked(v) {
      if (v) this.setAttribute("checked", "");
      else this.removeAttribute("checked");
    }
    get value() {
      return this.getAttribute("value") || "on";
    }
    set value(v) {
      this.setAttribute("value", v);
    }
    #render() {
      const id = this._id;
      const label = document.createElement("label");
      label.className = "checkbox";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      input.value = this.value;
      input.checked = this.hasAttribute("checked");
      input.disabled = this.hasAttribute("disabled");

      const box = document.createElement("span");
      box.className = "box";
      box.setAttribute("aria-hidden", "true");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", TICK);
      svg.appendChild(path);
      box.appendChild(svg);

      const text = document.createElement("span");
      text.textContent = this.getAttribute("label") || "";

      label.append(input, box, text);
      this.textContent = "";
      this.appendChild(label);

      input.addEventListener("change", () => {
        if (input.checked) this.setAttribute("checked", "");
        else this.removeAttribute("checked");
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { checked: input.checked, value: input.value, name: input.name }
          })
        );
      });
    }
  }
  if (!customElements.get("mue-checkbox")) customElements.define("mue-checkbox", MueCheckbox);
  return MueCheckbox;
}

export const MueCheckbox = defineMueCheckbox();
export default MueCheckbox;
