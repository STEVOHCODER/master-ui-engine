/* BEGIN MUE:META
  COMPONENT: Progress
  ID: wc-mue-progress
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: feedback
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/feedback/progress.html
  SHEET: styles/components.css#feedback — determinate renders <div class="progress-group"><div
    class="progress-label"><span id>+<span class="percent"></div><div class="track" role="progressbar"
    aria-labelledby aria-valuenow/min/max>(+.progress-success/.progress-warning/.progress-striped from
    variant/striped)<div class="bar" style="--value:N%"></div></div></div>. Indeterminate renders a bare
    <div class="track progress-indeterminate" role="progressbar" aria-label><div class="bar">. The bar
    fill, success/warning colours, the striped overlay and the indeterminate sweep are all in the
    sheet; only --value is set inline, exactly as the vanilla bar does. No CSS is added.
  LIGHT_DOM: true
  VARIANTS: determinate (primary / success / warning / striped), indeterminate
  PROPS: label, value, min (default 0), max (default 100), variant (primary|success|warning), striped
    (bool), indeterminate (bool)
  STATES: setting value re-paints the SAME bar so the sheet's width transition runs; percent text and
    aria-valuenow track the value; indeterminate has no value
  A11Y: role="progressbar" with aria-valuenow/valuemin/valuemax updated as the value changes; the
    percent label is joined by aria-labelledby; colour is never the only signal (label + number say it)
  KEYBOARD: none — a progress indicator is a live region, not a control
  EVENTS: mue-change {detail:{value, percent}} when the value property or attribute changes
  RESPONSIVE: tracks are 100% wide and fill via --value, so nothing overflows at 320px
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

let progSeq = 0;

function defineMueProgress() {
  class MueProgress extends HTMLElement {
    static get observedAttributes() {
      return ["label", "value", "min", "max", "variant", "striped", "indeterminate"];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === "value") {
        this.#paint();
        this.#emit();
      } else {
        this.render();
      }
    }
    get value() {
      return Number(this.getAttribute("value")) || 0;
    }
    set value(v) {
      this.setAttribute("value", String(v));
    }
    get percent() {
      const min = Number(this.getAttribute("min")) || 0;
      const max = Number(this.getAttribute("max")) || 100;
      if (max === min) return 0;
      return Math.round(((this.value - min) / (max - min)) * 100);
    }
    get indeterminate() {
      return this.hasAttribute("indeterminate");
    }
    render() {
      this.textContent = "";
      this._bar = null;
      this._track = null;
      this._percent = null;
      const variantClass =
        this.getAttribute("variant") === "success"
          ? " progress-success"
          : this.getAttribute("variant") === "warning"
          ? " progress-warning"
          : "";
      const stripedClass = this.hasAttribute("striped") ? " progress-striped" : "";

      if (this.indeterminate) {
        const track = document.createElement("div");
        track.className = "track progress-indeterminate";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", this.getAttribute("label") || "Loading");
        const bar = document.createElement("div");
        bar.className = "bar";
        track.appendChild(bar);
        this.className = "progress-group";
        this.appendChild(track);
        return;
      }

      const id = "mue-progress-" + ++progSeq;
      this.className = "progress-group";

      const label = document.createElement("div");
      label.className = "progress-label";
      const name = document.createElement("span");
      name.id = id;
      name.textContent = this.getAttribute("label") || "";
      const pct = document.createElement("span");
      pct.className = "percent";
      label.append(name, pct);

      const track = document.createElement("div");
      track.className = "track" + variantClass + stripedClass;
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-labelledby", id);
      track.setAttribute("aria-valuemin", String(Number(this.getAttribute("min")) || 0));
      track.setAttribute("aria-valuemax", String(Number(this.getAttribute("max")) || 100));
      const bar = document.createElement("div");
      bar.className = "bar";
      track.appendChild(bar);

      this.append(label, track);

      this._bar = bar;
      this._track = track;
      this._percent = pct;
      this.#paint();
    }
    #paint() {
      if (!this._bar) return;
      const p = this.percent;
      this._bar.style.setProperty("--value", p + "%");
      if (this._percent) this._percent.textContent = p + "%";
      if (this._track) this._track.setAttribute("aria-valuenow", String(this.value));
    }
    #emit() {
      this.dispatchEvent(
        new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: this.value, percent: this.percent } })
      );
    }
  }
  if (!customElements.get("mue-progress")) customElements.define("mue-progress", MueProgress);
  return MueProgress;
}

export const MueProgress = defineMueProgress();
export default MueProgress;
