/* BEGIN MUE:META
  COMPONENT: Skeleton
  ID: wc-mue-skeleton
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: feedback
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/feedback/skeleton.html
  SHEET: styles/components.css#feedback — atomic shapes set the host to class="skeleton skeleton-text|
    skeleton-title|skeleton-avatar|skeleton-img|skeleton-btn"; variant=row renders
    <div class="row skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="stack">title
    + text + 40% text</div></div>; variant=card renders <div class="card"><div class="skeleton
    skeleton-img"></div><div class="skeleton-body">title + text + 40% text</div></div>. The shimmer
    (.skeleton::after), each shape size, .skeleton-row, .stack, .row and .card are all in the sheet;
    only an optional width override is inline, mirroring the vanilla's width:40% blocks. No CSS added.
  LIGHT_DOM: true
  VARIANTS: text, title, avatar, img, btn, row (list item), card
  PROPS: variant (default text), width (optional CSS length, inline width override)
  STATES: a purely static placeholder — swaps shapes when the variant attribute changes; the shimmer
    run/stop is the sheet's (and pauses under prefers-reduced-motion)
  A11Y: the placeholders are decorative (aria-hidden="true"), so a reader hears the loading message
    or the real content, not a pile of empty boxes; the vanilla page lists aria-live as guidance for
    the container that swaps them in, which is not implemented by this element
  KEYBOARD: none — a non-interactive placeholder
  EVENTS: none
  RESPONSIVE: shapes use fluid/percent widths inside a flexible row, so they never overflow at 320px
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueSkeleton() {
  class MueSkeleton extends HTMLElement {
    static get observedAttributes() {
      return ["variant", "width"];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    #shape(variant, width) {
      const d = document.createElement("div");
      d.className = "skeleton skeleton-" + variant;
      if (width) d.style.width = width;
      return d;
    }
    render() {
      const variant = this.getAttribute("variant") || "text";
      const width = this.getAttribute("width") || "";

      if (["text", "title", "avatar", "img", "btn"].includes(variant)) {
        this.className = "skeleton skeleton-" + variant;
        this.setAttribute("aria-hidden", "true");
        this.textContent = "";
        if (width) this.style.width = width;
        return;
      }

      this.className = "";
      this.removeAttribute("aria-hidden");
      this.style.width = "";
      const frag = document.createDocumentFragment();
      if (variant === "row") {
        const row = document.createElement("div");
        row.className = "row skeleton-row";
        row.setAttribute("aria-hidden", "true");
        const stack = document.createElement("div");
        stack.className = "stack";
        stack.append(this.#shape("title", "70%"), this.#shape("text", ""), this.#shape("text", "40%"));
        row.append(this.#shape("avatar", ""), stack);
        frag.appendChild(row);
      } else if (variant === "card") {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("aria-hidden", "true");
        const body = document.createElement("div");
        body.className = "skeleton-body";
        body.append(this.#shape("title", ""), this.#shape("text", ""), this.#shape("text", "40%"));
        card.append(this.#shape("img", ""), body);
        frag.appendChild(card);
      } else {
        // Unknown variant: degrade to a single text line rather than nothing.
        frag.appendChild(this.#shape("text", width));
      }
      this.textContent = "";
      this.appendChild(frag);
    }
  }
  if (!customElements.get("mue-skeleton")) customElements.define("mue-skeleton", MueSkeleton);
  return MueSkeleton;
}

export const MueSkeleton = defineMueSkeleton();
export default MueSkeleton;
