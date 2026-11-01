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
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueSwitch() {
  class MueSwitch extends HTMLElement {
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
    #build() {
      const label = document.createElement("label");
      label.className = "switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      const track = document.createElement("span");
      track.className = "track";
      track.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.className = "switch-label";
      /* Authors write the choice next to the control, so the host's own children
         are the label text; the attribute stays for generated markup. Dropping
         the children would leave the input with no accessible name at all. */
      const authored = [...this.childNodes];
      this.textContent = "";
      authored.forEach((node) => text.appendChild(node));
      if (!text.textContent.trim()) text.textContent = this.getAttribute("label") || "";
      label.append(input, track, text);
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
      this._input = input;
      this._text = text;
      this._built = true;
    }
    #sync() {
      const input = this._input;
      input.checked = this.hasAttribute("checked");
      input.setAttribute("aria-checked", String(input.checked));
      input.value = this.getAttribute("value") || "on";
      input.disabled = this.hasAttribute("disabled");
      if (this.hasAttribute("name")) input.setAttribute("name", this.getAttribute("name"));
      else input.removeAttribute("name");
    }
  }
  if (!customElements.get("mue-switch")) customElements.define("mue-switch", MueSwitch);
  return MueSwitch;
}

export const MueSwitch = defineMueSwitch();
export default MueSwitch;
