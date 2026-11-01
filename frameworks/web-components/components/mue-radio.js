/* BEGIN MUE:META
  COMPONENT: Radio
  ID: wc-mue-radio
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#choice — <label class="radio"><input type=radio><span class="box"
    aria-hidden></span><span>label</span></label>. The dot is a pseudo-element on .box painted from
    the real input's :checked state.
  LIGHT_DOM: true
  VARIANTS: checked (bool), disabled (bool)
  PROPS: label, name, value, checked, disabled
  EVENTS: mue-change {detail:{value,name,checked}}
  A11Y: native radio input wrapped in its own label; exclusivity and arrow-key navigation come from
    a shared name attribute (set by <mue-radio-group>); checked state is announced because the input
    is real, only visually hidden
  KEYBOARD: Arrow keys move within the shared-name group (native); Space selects
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueRadio() {
  class MueRadio extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "checked", "disabled"];
    }
    connectedCallback() {
      this.#render();
    }
    attributeChangedCallback(name, oldV, newV) {
      if (!this._rendered) return;
      if (name === "checked" || name === "disabled" || name === "name") {
        const input = this.querySelector("input");
        if (input) {
          if (name === "checked") input.checked = this.hasAttribute("checked");
          if (name === "disabled") input.disabled = this.hasAttribute("disabled");
          if (name === "name") input.name = this.getAttribute("name") || "";
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
      return this.getAttribute("value") || this.getAttribute("label") || "";
    }
    set value(v) {
      this.setAttribute("value", v);
    }
    #render() {
      const label = document.createElement("label");
      label.className = "radio";
      const input = document.createElement("input");
      input.type = "radio";
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      input.value = this.value;
      input.checked = this.hasAttribute("checked");
      input.disabled = this.hasAttribute("disabled");
      const box = document.createElement("span");
      box.className = "box";
      box.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = this.getAttribute("label") || "";
      label.append(input, box, text);
      this.textContent = "";
      this.appendChild(label);
      input.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { value: input.value, name: input.name, checked: input.checked }
          })
        );
      });
      this._rendered = true;
    }
  }
  if (!customElements.get("mue-radio")) customElements.define("mue-radio", MueRadio);
  return MueRadio;
}

export const MueRadio = defineMueRadio();
export default MueRadio;
