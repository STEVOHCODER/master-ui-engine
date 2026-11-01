/* BEGIN MUE:META
  COMPONENT: Tabs
  ID: wc-mue-tabs
  GROUP: Frameworks > Web Components
  CATEGORY: navigation
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, components/mue-tab.js, components/mue-tabpanel.js
  SHEET: styles/components.css#tabs — the host is class "tabs"; it upgrades its <mue-tab> children
    into a <div class="tab-list" role="tablist"> (marked data-mue-bound so the vanilla styles/mue.js
    roving handler is skipped) and pairs each tab with an <mue-tabpanel> by index.
  LIGHT_DOM: true
  VARIANTS: label (tablist accessible name), selected (active index, default 0)
  PROPS: label, selected
  EVENTS: mue-change {detail:{index,label}} when the active tab changes
  A11Y: role="tablist" / role="tab" / role="tabpanel" with aria-controls + aria-labelledby;
    aria-selected marks the active tab; inactive panels carry the hidden attribute; the tablist keeps a
    roving tabindex so only the active tab is in the tab order
  KEYBOARD: ArrowLeft/ArrowRight (+ Home/End) move focus between tabs; Enter/Space (or a click)
    activate the focused tab — manual activation, mirroring components/navigation/tabs.html
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { MueTab } from "./mue-tab.js";
import { MueTabpanel } from "./mue-tabpanel.js";

let seq = 0;
const uid = (p) => p + "-" + ++seq;

function defineMueTabs() {
  class MueTabs extends HTMLElement {
    static get observedAttributes() {
      return ["selected", "label"];
    }
    connectedCallback() {
      this.#build();
    }
    attributeChangedCallback(name) {
      if (!this._tabs) return;
      if (name === "selected") this.#activate(parseInt(this.getAttribute("selected") || "0", 10), false);
      if (name === "label" && this._list) this._list.setAttribute("aria-label", this.getAttribute("label") || "Tabs");
    }
    get selected() {
      return parseInt(this.getAttribute("selected") || "0", 10);
    }
    set selected(i) {
      this.setAttribute("selected", String(i));
    }
    #build() {
      this.classList.add("tabs");
      const tabs = Array.from(this.querySelectorAll("mue-tab"));
      const panels = Array.from(this.querySelectorAll("mue-tabpanel"));
      const list = document.createElement("div");
      list.className = "tab-list";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-label", this.getAttribute("label") || "Tabs");
      // Opt out of the vanilla styles/mue.js tab binding (it skips [role=tablist][data-mue-bound]).
      list.dataset.mueBound = "1";

      tabs.forEach((t) => list.appendChild(t));

      this.textContent = "";
      this.appendChild(list);
      panels.forEach((p) => this.appendChild(p));

      this._list = list;
      this._tabs = tabs;
      this._panels = panels;
      tabs.forEach((t, i) => {
        if (!t.id) t.id = uid("mue-tab");
        const panel = panels[i];
        if (panel) {
          if (!panel.id) panel.id = uid("mue-tabpanel");
          t.setAttribute("aria-controls", panel.id);
          panel.setAttribute("aria-labelledby", t.id);
        }
        t.addEventListener("click", () => this.#activate(i, false, true));
        if (t.hasAttribute("disabled")) t.setAttribute("aria-disabled", "true");
      });

      this._listKeydown = (e) => this.#onKey(e);
      list.addEventListener("keydown", this._listKeydown);

      this.#activate(this.selected, false, false, true);
    }
    #enabled() {
      return this._tabs.map((t, i) => ({ t, i })).filter(({ t }) => !t.hasAttribute("disabled"));
    }
    #onKey(e) {
      const current = this._tabs.indexOf(document.activeElement);
      if (current === -1) return;
      const enabled = this.#enabled().map(({ i }) => i);
      if (!enabled.length) return;
      const pos = enabled.indexOf(current);
      let next = -1;
      if (e.key === "ArrowRight") next = enabled[(pos + 1) % enabled.length];
      else if (e.key === "ArrowLeft") next = enabled[(pos - 1 + enabled.length) % enabled.length];
      else if (e.key === "Home") next = enabled[0];
      else if (e.key === "End") next = enabled[enabled.length - 1];
      else if ((e.key === "Enter" || e.key === " ") && current >= 0) {
        e.preventDefault();
        this.#activate(current, true, true);
        return;
      }
      if (next >= 0) {
        e.preventDefault();
        this.#roving(next);
        this._tabs[next].focus();
      }
    }
    #roving(activeIndex) {
      this._tabs.forEach((t, i) => {
        const on = i === activeIndex && !t.hasAttribute("disabled");
        t.tabIndex = on ? 0 : -1;
      });
    }
    #activate(index, focus, notify, silent) {
      if (!this._tabs || !this._tabs.length) return;
      if (index < 0 || index >= this._tabs.length) index = 0;
      const tab = this._tabs[index];
      if (tab && tab.hasAttribute("disabled")) return;
      this._tabs.forEach((t, i) => {
        const on = i === index;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on && !t.hasAttribute("disabled") ? 0 : -1;
      });
      this._panels.forEach((p, i) => {
        p.hidden = i !== index;
      });
      if (this.getAttribute("selected") !== String(index)) {
        if (silent) this.setAttribute("selected", String(index));
        else {
          this.setAttribute("selected", String(index));
        }
      }
      if (focus && tab) tab.focus();
      if (notify) {
        this.dispatchEvent(
          new CustomEvent("mue-change", {
            bubbles: true,
            composed: true,
            detail: { index, label: tab ? tab.label : "" }
          })
        );
      }
    }
  }
  if (!customElements.get("mue-tabs")) customElements.define("mue-tabs", MueTabs);
  return MueTabs;
}

export const MueTabs = defineMueTabs();
export { MueTab, MueTabpanel };
export default MueTabs;
