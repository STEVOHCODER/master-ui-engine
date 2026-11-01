/* BEGIN MUE:META
  COMPONENT: Radio Group
  ID: wc-mue-radio-group
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, components/mue-radio.js
  SHEET: styles/components.css#choice — <fieldset class="radiogroup"><legend>label</legend> + the
    author <mue-radio> children, all sharing one name so the browser keeps them mutually exclusive.
  LIGHT_DOM: true
  VARIANTS: disabled (bool)
  PROPS: label, name, value, disabled
  EVENTS: mue-change {detail:{value}} fired when the selection changes
  A11Y: <fieldset> + <legend> name the question; a shared name makes options exclusive and gives
    arrow-key roving for free; value reflects which option is checked
  KEYBOARD: Arrow keys move the selection within the shared-name group (native radio behaviour)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueRadioGroup() {
  class MueRadioGroup extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "disabled"];
    }
    connectedCallback() {
      if (!this._id) this._id = uid("mue-radiogroup");
      this.#render();
      this._boundChange = (e) => {
        if (e.target && e.target.tagName === "MUE-RADIO") {
          const v = e.detail && e.detail.value;
          if (v !== this.getAttribute("value")) {
            this.#applyValue(v, false);
            this.dispatchEvent(
              new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: v } })
            );
          }
        }
      };
      this.addEventListener("mue-change", this._boundChange);
    }
    disconnectedCallback() {
      if (this._boundChange) this.removeEventListener("mue-change", this._boundChange);
    }
    attributeChangedCallback(name) {
      if (!this._id) return;
      if (name === "value") this.#applyValue(this.getAttribute("value"), false);
      else if (name === "disabled") this.#applyDisabled();
      else this.#render();
    }
    get value() {
      const checked = this.querySelector("mue-radio[checked]");
      return checked ? checked.value : "";
    }
    set value(v) {
      this.setAttribute("value", v);
    }
    #radios() {
      return Array.from(this.querySelectorAll("mue-radio"));
    }
    #render() {
      const name = this.getAttribute("name") || this._id;
      const fieldset = document.createElement("fieldset");
      fieldset.className = "radiogroup";
      const legend = document.createElement("legend");
      legend.textContent = this.getAttribute("label") || "";
      fieldset.appendChild(legend);
      const radios = this.#radios();
      radios.forEach((r) => {
        r.setAttribute("name", name);
        fieldset.appendChild(r);
      });
      this.textContent = "";
      this.appendChild(fieldset);
      this.#applyDisabled();
      const initial = this.getAttribute("value");
      if (initial) this.#applyValue(initial, false);
      else {
        const pre = radios.find((r) => r.hasAttribute("checked"));
        if (pre) this.setAttribute("value", pre.value);
      }
    }
    #applyValue(v, notify) {
      this.#radios().forEach((r) => {
        const on = r.value === v;
        if (on) r.setAttribute("checked", "");
        else r.removeAttribute("checked");
      });
      if (this.getAttribute("value") !== v) this.setAttribute("value", v);
      if (notify)
        this.dispatchEvent(new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: v } }));
    }
    #applyDisabled() {
      const dis = this.hasAttribute("disabled");
      this.#radios().forEach((r) => {
        if (dis) r.setAttribute("disabled", "");
        else r.removeAttribute("disabled");
      });
    }
  }
  if (!customElements.get("mue-radio-group")) customElements.define("mue-radio-group", MueRadioGroup);
  return MueRadioGroup;
}

export const MueRadioGroup = defineMueRadioGroup();
export default MueRadioGroup;
