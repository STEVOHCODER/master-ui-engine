/* BEGIN MUE:META
  COMPONENT: Accordion Item
  ID: wc-mue-accordion-item
  GROUP: Frameworks > Web Components
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  SHEET: styles/components.css#accordion — the host is class "accordion-item"; it renders a
    <button class="accordion-trigger" aria-expanded aria-controls> with a plus icon (rotated 45deg
    when open) and a <div class="accordion-panel"><div>…author content…</div></div>. Opening adds
    .is-open to the panel and sets aria-expanded="true" on the trigger; the panel animates height via
    grid-template-rows in the sheet.
  LIGHT_DOM: true
  VARIANTS: open (bool)
  PROPS: label, open
  EVENTS: mue-change {detail:{open,label}} (bubbles so <mue-accordion> can enforce single-open)
  A11Y: trigger is a real <button> with aria-expanded and aria-controls to the panel id; the panel is
    a labelled region; collapsed content stays in the flow (never display:none) so focus is not lost
  KEYBOARD: Enter/Space toggle (native button)
  VERIFIED: not-verified (headless-Chrome gallery run required)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const PLUS = "M12 4v16m8-8H4";
let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueAccordionItem() {
  class MueAccordionItem extends HTMLElement {
    static get observedAttributes() {
      return ["open", "label"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#sync();
    }
    attributeChangedCallback(name) {
      if (name === "open") this.#sync();
      else if (name === "label" && this._trigger) this._trigger.childNodes[0].textContent = this.getAttribute("label") || "";
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.setAttribute("open", "");
      else this.removeAttribute("open");
    }
    #build() {
      this.classList.add("accordion-item");
      const panelId = uid("mue-accordion-panel");
      const triggerId = uid("mue-accordion-trigger");

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.id = triggerId;
      trigger.className = "accordion-trigger";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", panelId);
      const labelSpan = document.createElement("span");
      labelSpan.textContent = this.getAttribute("label") || "";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", PLUS);
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-width", "2");
      svg.appendChild(path);
      trigger.append(labelSpan, svg);

      const panel = document.createElement("div");
      panel.className = "accordion-panel";
      panel.id = panelId;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", triggerId);
      const inner = document.createElement("div");
      // Move author body content into the panel.
      const authored = Array.from(this.childNodes);
      authored.forEach((n) => inner.appendChild(n));
      panel.appendChild(inner);

      this.append(trigger, panel);
      this._trigger = trigger;
      this._panel = panel;

      trigger.addEventListener("click", () => {
        this.open = !this.open;
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { open: this.open, label: this.getAttribute("label") || "" }
          })
        );
      });
      this._built = true;
    }
    #sync() {
      if (!this._trigger) return;
      const open = this.open;
      this._trigger.setAttribute("aria-expanded", String(open));
      this._panel.classList.toggle("is-open", open);
    }
  }
  if (!customElements.get("mue-accordion-item")) customElements.define("mue-accordion-item", MueAccordionItem);
  return MueAccordionItem;
}

export const MueAccordionItem = defineMueAccordionItem();
export default MueAccordionItem;
