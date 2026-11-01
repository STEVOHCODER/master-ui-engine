/* BEGIN MUE:META
  COMPONENT: Stepper
  ID: wc-mue-stepper
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: feedback
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/feedback/stepper.html
  SHEET: styles/components.css#stepper — the author supplies an <ol class="stepper"> of <li> steps
    (each a <span class="stepper-label"> with <span class="stepper-name"> and optional <span
    class="stepper-text">). The element wraps the list, adds a leading <span class="stepper-dot"
    aria-hidden> per step and sets the one state class per step the sheet already knows — .is-done
    (check glyph), .is-current (number, plus aria-current="step") or .is-upcoming (number). .stepper,
    .stepper-item, .stepper-dot, .stepper-label, .stepper-name, .stepper-text and the three state
    classes are all defined in the sheet; the rail is drawn there. No CSS is added.
  LIGHT_DOM: true
  VARIANTS: mid-flow (done → current → upcoming), completed (last is current)
  PROPS: current (1-based index of the active step, default 1; clamped to the number of steps)
  STATES: setting current moves .is-done / .is-current / .is-upcoming and the aria-current="step"
    marker across the steps and re-fills each dot (check for done, its number otherwise)
  A11Y: a real <ol> keeps reading order = step order; the active step carries aria-current="step";
    dot numbers and the check glyph are aria-hidden so the step name in the label is the accessible
    name and nothing is announced twice; done/current/upcoming differ by shape (filled-ring-number),
    not colour alone
  KEYBOARD: none — a status rail, not an interactive control (the surrounding wizard owns Back/Next)
  EVENTS: mue-step {detail:{current, total}} when the current step changes
  RESPONSIVE: vertical rail with the label beside the dot under 640px, dots in a row above it; one
    media query in the sheet (components.css#stepper)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueStepper() {
  class MueStepper extends HTMLElement {
    static get observedAttributes() {
      return ["current"];
    }
    connectedCallback() {
      this.#enhance();
    }
    attributeChangedCallback() {
      if (this.isConnected) {
        const prev = this._current;
        this.#enhance();
        if (prev != null && prev !== this._current) this.#emit();
      }
    }
    get current() {
      return this._current || 1;
    }
    set current(v) {
      this.setAttribute("current", String(v));
    }
    #check() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "3");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("focusable", "false");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "m5 13 4 4 10-10");
      svg.appendChild(path);
      return svg;
    }
    #enhance() {
      let ol = this.querySelector("ol.stepper");
      if (!ol) {
        ol = document.createElement("ol");
        ol.className = "stepper";
        const items = Array.from(this.childNodes).filter((n) => n.nodeName === "LI");
        items.forEach((li) => ol.appendChild(li));
        if (!items.length) {
          const wrapped = Array.from(this.children);
          wrapped.forEach((n) => ol.appendChild(n));
        }
        this.textContent = "";
        this.appendChild(ol);
      }
      const steps = Array.from(ol.querySelectorAll(":scope > li"));
      const total = steps.length;
      const raw = Number(this.getAttribute("current")) || 1;
      const current = Math.min(Math.max(1, raw), Math.max(1, total));
      this._current = current;
      this._total = total;

      steps.forEach((li, i) => {
        const step = i + 1;
        const state = step < current ? "is-done" : step === current ? "is-current" : "is-upcoming";
        li.classList.remove("is-done", "is-current", "is-upcoming");
        li.classList.add("stepper-item", state);
        if (state === "is-current") li.setAttribute("aria-current", "step");
        else li.removeAttribute("aria-current");

        let dot = li.querySelector(":scope > .stepper-dot");
        if (!dot) {
          dot = document.createElement("span");
          dot.className = "stepper-dot";
          dot.setAttribute("aria-hidden", "true");
          li.insertBefore(dot, li.firstChild);
        }
        dot.textContent = "";
        if (state === "is-done") dot.appendChild(this.#check());
        else dot.textContent = String(step);
      });
    }
    #emit() {
      this.dispatchEvent(
        new CustomEvent("mue-step", { bubbles: true, composed: true, detail: { current: this._current, total: this._total } })
      );
    }
  }
  if (!customElements.get("mue-stepper")) customElements.define("mue-stepper", MueStepper);
  return MueStepper;
}

export const MueStepper = defineMueStepper();
export default MueStepper;
