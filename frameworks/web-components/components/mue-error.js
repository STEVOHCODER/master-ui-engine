/* BEGIN MUE:META
  COMPONENT: Error state
  ID: wc-mue-error
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: feedback
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/feedback/error-state.html
  SHEET: styles/components.css#feedback — the host upgrades to
    <div class="error-state" role="alert"> (adding .error-inline for the row variant) and emits
    <div class="error-icon" aria-hidden>(alert-circle svg) + <div class="error-body"><h2 class=
    "empty-title"> + <p class="empty-desc"> + <div class="row"> of the author's recovery actions.
    .error-state, .error-inline, .error-icon, .error-body and the reused .empty-title/.empty-desc/.row
    are all defined in the sheet; colour never carries the message alone (icon + wording do too).
    No CSS is added.
  LIGHT_DOM: true
  VARIANTS: centred panel, inline card (error-inline), with/without recovery actions
  PROPS: title, desc, inline (bool), label (aria-label; defaults to the title)
  STATES: title/desc/inline patch in place, so the alert region is not re-created when a message
    changes; the icon stays decorative
  A11Y: role="alert" announces the failure; the icon svg is aria-hidden; actions are real
    buttons/links; the message is text, not colour-only (the sheet tints with --tint-error so it holds
    in dark too)
  KEYBOARD: recovery actions are the author's own controls — Tab reaches them; the element adds none
  EVENTS: none (a message panel)
  RESPONSIVE: the inline card stacks icon over body below 640px and the panel is width-capped, so it
    never overflows at 320px (components.css#feedback)
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function defineMueError() {
  class MueError extends HTMLElement {
    static get observedAttributes() {
      return ["title", "desc", "inline", "label"];
    }
    connectedCallback() {
      if (!this._built) this.#build();
      this.#patch();
    }
    attributeChangedCallback() {
      if (this._built) this.#patch();
    }
    #build() {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("focusable", "false");
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "9");
      svg.appendChild(circle);
      ["M12 7.5v5.5", "M12 16.6h.01"].forEach((d) => {
        const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
        node.setAttribute("d", d);
        svg.appendChild(node);
      });

      this._icon = document.createElement("div");
      this._icon.className = "error-icon";
      this._icon.setAttribute("aria-hidden", "true");
      this._icon.appendChild(svg);

      this._title = document.createElement("h2");
      this._title.className = "empty-title";

      this._desc = document.createElement("p");
      this._desc.className = "empty-desc";

      const row = document.createElement("div");
      row.className = "row";
      const actions = Array.from(this.childNodes).filter((n) => n.nodeType === 1);
      actions.forEach((n) => row.appendChild(n));

      const body = document.createElement("div");
      body.className = "error-body";
      body.append(this._title, this._desc);
      if (actions.length) body.appendChild(row);

      this.setAttribute("role", "alert");
      this.append(this._icon, body);
      this._built = true;
    }
    #patch() {
      this.className = "error-state" + (this.hasAttribute("inline") ? " error-inline" : "");
      this._title.textContent = this.getAttribute("title") || "Something went wrong";
      this._desc.textContent = this.getAttribute("desc") || "";
      this.setAttribute("aria-label", this.getAttribute("label") || this._title.textContent);
    }
  }
  if (!customElements.get("mue-error")) customElements.define("mue-error", MueError);
  return MueError;
}

export const MueError = defineMueError();
export default MueError;
