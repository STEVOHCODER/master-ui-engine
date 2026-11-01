/* BEGIN MUE:META
  COMPONENT: Select
  ID: wc-mue-select
  GROUP: Frameworks > Web Components
  CATEGORY: forms
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#fields — .field > .field-label + .select-wrap(> select + chevron svg)
    + (.field-helper | .field-msg); state=error/success add .is-error/.is-success. Author <option>
    children are upgraded into the native <select>.
  LIGHT_DOM: true
  VARIANTS: state=(none)|error|success, disabled
  PROPS: label, name, value, helper, message, state, disabled, required
  EVENTS: mue-change {detail:{value,name}}
  A11Y: native <select> keeps OS/keyboard/screen-reader behaviour; label by for/id; error sets
    aria-invalid="true" + aria-describedby; the chevron svg is aria-hidden and ignores pointer events
  KEYBOARD: native select (type-ahead, arrows, Enter)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const CHEVRON = "M19 9l-7 7-7-7";
let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueSelect() {
  class MueSelect extends HTMLElement {
    static get observedAttributes() {
      return ["label", "name", "value", "helper", "message", "state", "disabled", "required"];
    }
    constructor() {
      super();
      this._opts = null;
    }
    connectedCallback() {
      if (!this._id) this._id = uid("mue-select");
      if (this._opts === null) {
        const frag = document.createDocumentFragment();
        this.querySelectorAll("option,optgroup").forEach((o) => frag.appendChild(o));
        this._opts = frag.children.length ? frag.cloneNode(true) : null;
      }
      this.#render();
    }
    attributeChangedCallback() {
      if (this._id) this.#render();
    }
    get value() {
      const s = this.querySelector("select");
      return s ? s.value : this.getAttribute("value") || "";
    }
    set value(v) {
      const s = this.querySelector("select");
      if (s) s.value = v;
      this.setAttribute("value", v);
    }
    #render() {
      const state = this.getAttribute("state") || "";
      const id = this._id;
      const msgId = id + "-msg";
      const prevValue = this._rendered ? this.value : this.getAttribute("value") || "";

      const field = document.createElement("div");
      field.className = "field" + (state === "error" ? " is-error" : state === "success" ? " is-success" : "");

      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.setAttribute("for", id);
      lab.textContent = this.getAttribute("label") || "";
      field.appendChild(lab);

      const wrap = document.createElement("div");
      wrap.className = "select-wrap";
      const select = document.createElement("select");
      select.id = id;
      if (this.hasAttribute("name")) select.name = this.getAttribute("name");
      if (this.hasAttribute("disabled")) select.disabled = true;
      if (this.hasAttribute("required")) select.required = true;
      if (state === "error" || state === "success") {
        select.setAttribute("aria-invalid", state === "error" ? "true" : "false");
        select.setAttribute("aria-describedby", msgId);
      }
      if (this._opts) select.appendChild(this._opts.cloneNode(true));
      else {
        ["A", "B", "C"].forEach((t) => {
          const o = document.createElement("option");
          o.textContent = t;
          select.appendChild(o);
        });
      }
      const chev = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      chev.setAttribute("viewBox", "0 0 24 24");
      chev.setAttribute("fill", "none");
      chev.setAttribute("stroke", "currentColor");
      chev.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", CHEVRON);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-width", "2");
      chev.appendChild(path);
      wrap.appendChild(select);
      wrap.appendChild(chev);
      field.appendChild(wrap);

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
      if (prevValue) select.value = prevValue;
      select.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: select.value, name: select.name } })
        );
      });
      this._rendered = true;
    }
  }
  if (!customElements.get("mue-select")) customElements.define("mue-select", MueSelect);
  return MueSelect;
}

export const MueSelect = defineMueSelect();
export default MueSelect;
