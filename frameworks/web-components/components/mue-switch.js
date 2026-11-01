/* BEGIN MUE:META
  COMPONENT: Switch
  ID: wc-mue-switch
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#choice — <label class="switch"><input type=checkbox role=switch>
    <span class="track" aria-hidden></span><span class="switch-label>label</span></label>. The track
    and knob are painted from the input's :checked state; the focus ring lands via input:focus-visible
    + .track.
  LIGHT_DOM: true
  VARIANTS: checked/on (bool), disabled (bool)
  PROPS: label, name, value, checked, disabled
  EVENTS: mue-change {detail:{checked,value,name}}
  A11Y: native checkbox given role="switch" + aria-checked so state is announced; the visible track
    is aria-hidden; the whole row is the label so it is clickable
  KEYBOARD: Space toggles (native checkbox)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueSwitch() {
  class MueSwitch extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "checked", "disabled"];
    }
    connectedCallback() {
      this.#render();
    }
    attributeChangedCallback(name) {
      if (!this._rendered) return;
      const input = this.querySelector("input");
      if (!input) return;
      if (name === "checked") {
        input.checked = this.hasAttribute("checked");
        input.setAttribute("aria-checked", String(input.checked));
      } else if (name === "disabled") {
        input.disabled = this.hasAttribute("disabled");
      } else {
        this.#render();
      }
    }
    get checked() {
      const input = this.querySelector("input");
      return input ? input.checked : this.hasAttribute("checked");
    }
    set checked(v) {
      if (v) this.setAttribute("checked", "");
      else this.removeAttribute("checked");
    }
    #render() {
      const label = document.createElement("label");
      label.className = "switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.checked = this.hasAttribute("checked");
      input.setAttribute("aria-checked", String(input.checked));
      if (this.hasAttribute("name")) input.name = this.getAttribute("name");
      input.value = this.getAttribute("value") || "on";
      input.disabled = this.hasAttribute("disabled");
      const track = document.createElement("span");
      track.className = "track";
      track.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.className = "switch-label";
      text.textContent = this.getAttribute("label") || "";
      label.append(input, track, text);
      this.textContent = "";
      this.appendChild(label);
      input.addEventListener("change", () => {
        input.setAttribute("aria-checked", String(input.checked));
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
      this._rendered = true;
    }
  }
  if (!customElements.get("mue-switch")) customElements.define("mue-switch", MueSwitch);
  return MueSwitch;
}

export const MueSwitch = defineMueSwitch();
export default MueSwitch;
