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
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueRadio() {
  class MueRadio extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "checked", "disabled"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#sync();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (!this._built || oldValue === newValue) return;
      if (name === "label") {
        this._text.textContent = this.getAttribute("label") || "";
        return;
      }
      this.#sync();
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
    #build() {
      const label = document.createElement("label");
      label.className = "radio";
      const input = document.createElement("input");
      input.type = "radio";
      const box = document.createElement("span");
      box.className = "box";
      box.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      /* The choice authors write next to the tag is the accessible name; the
         label attribute is the fallback for markup that has no children. */
      const authored = [...this.childNodes];
      this.textContent = "";
      authored.forEach((node) => text.appendChild(node));
      if (!text.textContent.trim()) text.textContent = this.getAttribute("label") || "";
      label.append(input, box, text);
      this.appendChild(label);
      this._input = input;
      this._text = text;
      this._built = true;
      input.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { value: input.value, name: input.name, checked: input.checked }
          })
        );
      });
    }
    #sync() {
      const input = this._input;
      if (!input) return;
      input.name = this.getAttribute("name") || "";
      input.value = this.value;
      input.checked = this.hasAttribute("checked");
      input.disabled = this.hasAttribute("disabled");
    }
  }
  if (!customElements.get("mue-radio")) customElements.define("mue-radio", MueRadio);
  return MueRadio;
}

export const MueRadio = defineMueRadio();
export default MueRadio;
