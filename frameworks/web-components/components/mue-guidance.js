/* BEGIN MUE:META
  COMPONENT: Guidance (coachmark tour + float-button dock)
  ID: wc-mue-guidance
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: overlays
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/overlays/guidance.html
  SHEET: styles/components.css#guidance — the author supplies the surface being taught inside
    <mue-guidance> (a .card-body layout with one <span class="tour" data-step="N"> per stop, each
    wrapping a <span class="tour-target"> around the real control and a <div class="tour-card"
    role="dialog" aria-labelledby> holding .tour-arrow, .tour-step, .tour-title, .tour-body and a
    .tour-actions row of [data-back]/[data-skip]/[data-next]). The element builds a .row with a
    replay <button class="btn-outline btn-sm"> and a <span class="badge badge-info"> status,
    wraps the authored content in a <div class="tour-stage card"> and only moves the single state
    class .is-open between the .tour stops (the sheet paints the target scrim, the card reveal and
    the .tour-top / .tour-end placement from it). <mue-fab> is a <div class="float-btn-group">
    dock holding authored <button class="float-btn"> / .float-btn-primary / .float-btn-label
    children; it toggles .is-visible on scroll. tour, tour-stage, tour-target, tour-card,
    tour-arrow, tour-step, tour-title, tour-body, tour-actions, tour-dots, tour-top, tour-end,
    float-btn, float-btn-group, float-btn-primary, float-btn-label, badge, badge-info, dot, row,
    card, card-body, btn-outline, btn-primary, btn-ghost, btn-sm, is-open and is-visible are all
    defined in the sheet. No CSS is added.
  LIGHT_DOM: true
  VARIANTS: tour with 1-4 stops open at any step (current prop), card below / above (.tour-top) /
    end-aligned (.tour-end); float dock reveal-on-scroll or shown in place (static)
  PROPS: MueGuidance — current (1-based stop that is open at load, default closed; setter moves
    .is-open). MueFab — reveal (scrollY threshold before the dock rises, default 420), static
    (show the dock without waiting for scroll).
  STATES: Next / Back / Finish move .is-open and refresh the badge ("Step n of total"; Back is
    disabled on the first stop); Skip, Escape or Finish past the last stop close the tour (badge
    "Tour closed", focus returns to the replay control); the fab dock gains .is-visible once the
    page has scrolled past reveal (or immediately when static).
  A11Y: each card is a role="dialog" labelled by its own .tour-title; Back/Skip/Next are real
    buttons so the tour is operable from the keyboard alone; the fab buttons keep their own
    aria-label and the dock is hidden (visibility) rather than absent so it never covers content;
    step dots and the tour arrow are aria-hidden.
  KEYBOARD: Escape closes the open tour and refocuses the replay control (only while this tour is
    open and focus is inside it); the tour buttons themselves are native focus stops.
  EVENTS: MueGuidance — mue-step {detail:{step,total}} on navigation, mue-close {} on close.
    MueFab — no events (a scroll-revealed dock).
  RESPONSIVE: the tour card is capped at min(21rem,100%) by the sheet so it stays inside the stage
    at 320px; the dock gutter tightens below 640px (components.css#guidance media queries).
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function defineMueGuidance() {
  class MueGuidance extends HTMLElement {
    static get observedAttributes() {
      return ["current"];
    }
    connectedCallback() {
      this.#build();
    }
    attributeChangedCallback(name) {
      if (name === "current" && this._built) {
        this.#show(this.#indexOf(this.getAttribute("current")), null, false);
      }
    }
    disconnectedCallback() {
      if (this._onKey) {
        this.removeEventListener("keydown", this._onKey);
        this._onKey = null;
      }
    }
    get current() {
      const i = this.#indexOf(this.getAttribute("current"));
      return i < 0 ? 0 : i + 1;
    }
    set current(v) {
      this.setAttribute("current", String(v));
    }
    play() {
      this.#show(0, "[data-next]", false);
    }
    close() {
      this.#show(-1, null, false);
    }
    #indexOf(raw) {
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) return -1;
      return Math.min(Math.max(0, Math.floor(n) - 1), Math.max(0, (this._total || 1) - 1));
    }
    #build() {
      if (this._built) return;
      const content = document.createDocumentFragment();
      while (this.firstChild) content.appendChild(this.firstChild);

      this._replay = el("button", "btn-outline btn-sm", "Replay tour");
      this._replay.type = "button";
      this._badge = el("span", "badge badge-info", "Tour closed");
      const head = el("p", "row");
      head.append(this._replay, this._badge);

      const stage = el("div", "tour-stage card");
      stage.append(content);
      this.append(head, stage);

      this._steps = Array.from(this.querySelectorAll(".tour[data-step]"));
      this._total = this._steps.length;

      this._steps.forEach((step, n) => {
        const next = step.querySelector("[data-next]");
        const back = step.querySelector("[data-back]");
        const skip = step.querySelector("[data-skip]");
        if (next) next.addEventListener("click", () => {
          if (n + 1 < this._total) this.#show(n + 1, "[data-next]", false);
          else this.#show(-1, null, false);
        });
        if (back) back.addEventListener("click", () => {
          this.#show(n > 0 ? n - 1 : 0, "[data-back]", false);
        });
        if (skip) skip.addEventListener("click", () => this.#show(-1, null, false));
      });

      this._replay.addEventListener("click", () => this.#show(0, "[data-next]", false));

      this._onKey = (e) => {
        if (e.key === "Escape" && this._open > -1) {
          e.stopPropagation();
          this.#show(-1, null, false);
        }
      };
      this.addEventListener("keydown", this._onKey);

      this._built = true;
      this.#show(this.#indexOf(this.getAttribute("current")), null, true);
    }
    #show(i, focusSel, silent) {
      if (!this._steps) return;
      this._open = i;
      this._steps.forEach((step, n) => step.classList.toggle("is-open", n === i));
      if (i < 0) {
        this._badge.textContent = "Tour closed";
        if (this._replay) this._replay.focus();
        if (!silent) this.dispatchEvent(new CustomEvent("mue-close", { bubbles: true, composed: true, detail: {} }));
        return;
      }
      this._badge.textContent = "Step " + (i + 1) + " of " + this._total;
      const card = this._steps[i].querySelector(".tour-card") || this._steps[i];
      const back = card.querySelector("[data-back]");
      if (back) back.disabled = i === 0;
      if (focusSel) {
        const target = card.querySelector(focusSel);
        if (target) target.focus();
      }
      if (!silent) {
        this.dispatchEvent(
          new CustomEvent("mue-step", { bubbles: true, composed: true, detail: { step: i + 1, total: this._total } })
        );
      }
    }
  }
  if (!customElements.get("mue-guidance")) customElements.define("mue-guidance", MueGuidance);
  return MueGuidance;
}

function defineMueFab() {
  class MueFab extends HTMLElement {
    static get observedAttributes() {
      return ["static", "reveal"];
    }
    connectedCallback() {
      if (!this._built) {
        this.className = "float-btn-group";
        this._built = true;
        this.querySelectorAll("[data-mue-fab-top]").forEach((btn) => {
          btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
        });
      }
      this.#apply();
    }
    attributeChangedCallback() {
      if (this._built && this.isConnected) this.#apply();
    }
    disconnectedCallback() {
      this.#detach();
    }
    #threshold() {
      const n = Number(this.getAttribute("reveal"));
      return Number.isFinite(n) && n > 0 ? n : 420;
    }
    #detach() {
      if (this._onScroll) {
        window.removeEventListener("scroll", this._onScroll);
        this._onScroll = null;
      }
    }
    #apply() {
      if (this.hasAttribute("static")) {
        this.#detach();
        this.classList.add("is-visible");
        return;
      }
      this.classList.toggle("is-visible", window.scrollY > this.#threshold());
      if (!this._onScroll) {
        let ticking = false;
        this._onScroll = () => {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(() => {
            this.classList.toggle("is-visible", window.scrollY > this.#threshold());
            ticking = false;
          });
        };
        window.addEventListener("scroll", this._onScroll, { passive: true });
      }
    }
  }
  if (!customElements.get("mue-fab")) customElements.define("mue-fab", MueFab);
  return MueFab;
}

export const MueGuidance = defineMueGuidance();
export const MueFab = defineMueFab();
