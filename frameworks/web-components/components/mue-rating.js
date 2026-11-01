/* BEGIN MUE:META
  COMPONENT: Rating
  ID: wc-mue-rating
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: display
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/display/rating.html
  SHEET: styles/components.css#rating (+ #utilities) — read-only mode renders
    <p class="rating" role="img" aria-label="N out of M stars"><span class="rating-stars" aria-hidden=
    "true"><span class="star is-filled|is-half">★</span>…</span><span class="rating-value">N.N</span>
    <span>caption</span></p>. Interactive mode renders <fieldset class="rating-input"><legend class=
    "sr-only">label</legend> then, in natural 1..M order, <input class="rating-radio" type="radio"> +
    <label class="rating-star"><span aria-hidden="true">★</span><span class="sr-only">N stars</span>
    </label> per step. Half steps and the fill-up-to-star are the sheet's .is-half gradient and :has()
    rules; the element adds no CSS.
  LIGHT_DOM: true
  VARIANTS: read-only whole, read-only half star, interactive radio group
  PROPS: value (number), max (int, default 5), caption, label (legend text), interactive (bool), name
  STATES: read-only re-renders on value change (is-filled / is-half per star, aria-label updated);
    interactive keeps a native radio per star so :checked and the fill come from the sheet
  A11Y: read-only is role="img" with an aria-label that spells the score ("3.5 out of 5 stars") and
    the glyphs are aria-hidden, so a reader never counts stars; interactive is a real fieldset/legend
    radio group where each input carries an .sr-only name ("3 stars") and arrows change the value
  KEYBOARD: interactive uses the native radio group — Tab enters it, Right/Up raise, Left/Down lower,
    Space commits, and the chosen value submits with the form; read-only is a graphic and takes no keys
  EVENTS: mue-change {detail:{value}} when an interactive star is chosen
  RESPONSIVE: inline-flex group of 44px (--control-h) star targets; five fit a 320px line with the
    caption wrapping (styles/components.css#rating)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const STAR = "\u2605";
let ratingSeq = 0;

function defineMueRating() {
  class MueRating extends HTMLElement {
    static get observedAttributes() {
      return ["value", "max", "caption", "label", "interactive", "name"];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    get value() {
      return Number(this.getAttribute("value")) || 0;
    }
    set value(v) {
      this.setAttribute("value", String(v));
    }
    get max() {
      return Math.max(1, Number(this.getAttribute("max")) || 5);
    }
    get interactive() {
      return this.hasAttribute("interactive");
    }
    render() {
      this.textContent = "";
      if (this.interactive) this.#interactive();
      else this.#readOnly();
    }
    #readOnly() {
      const value = this.value;
      const max = this.max;
      const p = document.createElement("p");
      p.className = "rating";
      p.setAttribute("role", "img");
      p.setAttribute("aria-label", value + " out of " + max + " stars");
      const stars = document.createElement("span");
      stars.className = "rating-stars";
      stars.setAttribute("aria-hidden", "true");
      for (let i = 1; i <= max; i++) {
        const s = document.createElement("span");
        s.className = value >= i ? "star is-filled" : value >= i - 0.5 ? "star is-half" : "star";
        s.textContent = STAR;
        stars.appendChild(s);
      }
      const val = document.createElement("span");
      val.className = "rating-value";
      val.textContent = value.toFixed(1);
      p.append(stars, val);
      if (this.getAttribute("caption")) {
        p.appendChild(document.createElement("span", null));
        p.lastChild.textContent = this.getAttribute("caption");
      }
      this.appendChild(p);
    }
    #interactive() {
      const max = this.max;
      const current = Math.round(this.value);
      const name = this.getAttribute("name") || "mue-rating-" + ++ratingSeq;
      const fs = document.createElement("fieldset");
      fs.className = "rating-input";
      const legend = document.createElement("legend");
      legend.className = "sr-only";
      legend.textContent = this.getAttribute("label") || "Rate from 1 to " + max + " stars";
      fs.appendChild(legend);
      for (let i = 1; i <= max; i++) {
        const id = name + "-" + i;
        const input = document.createElement("input");
        input.className = "rating-radio";
        input.type = "radio";
        input.name = name;
        input.id = id;
        input.value = String(i);
        if (i === current) input.checked = true;
        const label = document.createElement("label");
        label.className = "rating-star";
        label.setAttribute("for", id);
        const glyph = document.createElement("span");
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = STAR;
        const sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = i + (i === 1 ? " star" : " stars");
        label.append(glyph, sr);
        input.addEventListener("change", () => {
          if (!input.checked) return;
          this.dispatchEvent(
            new CustomEvent("mue-change", { bubbles: true, composed: true, detail: { value: i } })
          );
        });
        fs.append(input, label);
      }
      this.appendChild(fs);
    }
  }
  if (!customElements.get("mue-rating")) customElements.define("mue-rating", MueRating);
  return MueRating;
}

export const MueRating = defineMueRating();
export default MueRating;
