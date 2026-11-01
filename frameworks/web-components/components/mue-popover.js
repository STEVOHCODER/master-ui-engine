/* BEGIN MUE:META
  COMPONENT: Popover
  ID: wc-mue-popover
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: dialogs
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/dialogs/popover.html
  SHEET: styles/components.css#popover — the host renders <span class="popover-wrap">
    <button class="popover-trigger" type="button" aria-describedby> + <span class="popover" role=
    "note"> (+ .popover-below/.popover-start/.popover-end from the placement attribute); author
    children move into the surface, so .popover-title/.popover-body/.popover-list markup the author
    writes is preserved. Reveal is pure CSS: :hover, :focus-within and .is-open all open the same
    surface; the element only toggles .is-open for tap/scripted use. Adds no CSS.
  LIGHT_DOM: true
  VARIANTS: default (opens above), below, start-anchored, end-anchored, pinned open (.is-open),
    titled note, checklist surface (author supplies .popover-list children)
  PROPS: trigger (button text), placement (csv of below|start|end), icon (info|region|check), open (bool)
  STATES: .is-open on the wrap is the one class the sheet already turns into a visible surface;
    toggled by click, cleared by Escape or click-outside
  A11Y: the trigger is a real <button> that points at the surface via aria-describedby so the note is
    announced with the control; the closed surface is visibility:hidden so its links leave the tab
    order until it opens; the surface keeps role="note"
  KEYBOARD: Tab to the trigger opens it through the sheet's :focus-within; Escape closes a
    click-opened surface and returns focus to the trigger
  EVENTS: mue-open {detail:{trigger}}, mue-close {detail:{reason:'toggle'|'escape'|'outside'}}
  RESPONSIVE: surface max-width is min(20rem,80vw) and .popover-start/.popover-end keep a panel on a
    near-edge trigger inside the viewport (styles/components.css#popover)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let popSeq = 0;
const PLACEMENT = { below: "popover-below", start: "popover-start", end: "popover-end" };
const POPOVER_ICONS = {
  info: ["M12 16v-4", "M12 8h.01", "M12 12a9 9 0 1 0 0 .01"],
  region: ["M4 4h16v16H4z", "M4 9h16"],
  check: ["m5 13 4 4 10-10"],
};

function defineMuePopover() {
  class MuePopover extends HTMLElement {
    static get observedAttributes() {
      return ["trigger", "placement", "icon", "open"];
    }
    constructor() {
      super();
      this._built = false;
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#syncOpen();
    }
    attributeChangedCallback(name) {
      if (!this._built) return;
      if (name === "open") this.#syncOpen();
      else if (name === "trigger" && this._trigger) this.#setLabel();
      else if (name === "placement") this.#setPlacement();
    }
    get open() {
      return this.hasAttribute("open");
    }
    set open(v) {
      if (v) this.setAttribute("open", "");
      else this.removeAttribute("open");
    }
    show() {
      this.open = true;
    }
    hide(reason) {
      if (!this.open) return;
      this.open = false;
      this.dispatchEvent(new CustomEvent("mue-close", { bubbles: true, composed: true, detail: { reason: reason || "toggle" } }));
    }
    #build() {
      const id = "mue-popover-" + ++popSeq;
      const wrap = document.createElement("span");
      wrap.className = "popover-wrap";

      const trigger = document.createElement("button");
      trigger.className = "popover-trigger";
      trigger.type = "button";
      trigger.setAttribute("aria-describedby", id);
      const icon = this.getAttribute("icon");
      const label = document.createElement("span");
      trigger.appendChild(label);
      if (icon && POPOVER_ICONS[icon]) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        POPOVER_ICONS[icon].forEach((d) => {
          const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
          p.setAttribute("d", d);
          svg.appendChild(p);
        });
        trigger.appendChild(svg);
      }

      const surface = document.createElement("span");
      surface.className = "popover";
      surface.id = id;
      surface.setAttribute("role", "note");
      const kids = Array.from(this.childNodes);
      kids.forEach((n) => surface.appendChild(n));

      wrap.append(trigger, surface);
      this.appendChild(wrap);

      this._wrap = wrap;
      this._trigger = trigger;
      this._label = label;
      this._surface = surface;
      this.#setLabel();
      this.#setPlacement();

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this.open) this.hide("toggle");
        else {
          this.open = true;
          this.dispatchEvent(new CustomEvent("mue-open", { bubbles: true, composed: true, detail: { trigger: this.getAttribute("trigger") || "" } }));
        }
      });
      this._onDocClick = (e) => {
        if (this.open && !this.contains(e.target)) this.hide("outside");
      };
      this._onDocKey = (e) => {
        if (e.key === "Escape" && this.open) {
          this.hide("escape");
          if (this._trigger) this._trigger.focus();
        }
      };
      document.addEventListener("click", this._onDocClick);
      document.addEventListener("keydown", this._onDocKey);

      this._built = true;
    }
    #setLabel() {
      this._label.textContent = this.getAttribute("trigger") || "";
    }
    #setPlacement() {
      Object.values(PLACEMENT).forEach((c) => this._surface.classList.remove(c));
      const tokens = (this.getAttribute("placement") || "").split(/[,\s]+/);
      tokens.forEach((t) => {
        if (PLACEMENT[t]) this._surface.classList.add(PLACEMENT[t]);
      });
    }
    #syncOpen() {
      if (!this._wrap) return;
      this._wrap.classList.toggle("is-open", this.open);
    }
    disconnectedCallback() {
      if (this._onDocClick) document.removeEventListener("click", this._onDocClick);
      if (this._onDocKey) document.removeEventListener("keydown", this._onDocKey);
    }
  }
  if (!customElements.get("mue-popover")) customElements.define("mue-popover", MuePopover);
  return MuePopover;
}

export const MuePopover = defineMuePopover();
export default MuePopover;
