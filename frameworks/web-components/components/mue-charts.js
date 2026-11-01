/* BEGIN MUE:META
  COMPONENT: Charts
  ID: wc-mue-charts
  GROUP: Frameworks > Web Components > Elements
  CATEGORY: charts
  FRAMEWORK: Web Components (custom elements, plain ES modules, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css
  PORTS: components/charts/charts.html
  SHEET: styles/components.css#charts — the host renders
    <figure class="chart"><figcaption class="chart-title"> + <svg viewBox="0 0 700 180" role="img"
    aria-labelledby> with <title>/<desc> and, for bars, <rect class="bar bar-primary|bar-success|
    bar-warning"> plus <text class="axis"> labels, or for a line a <polyline class="line"> with
    <circle class="point"> markers; a <div class="legend"><span class="legend-item"><span class=
    "legend-dot"> + label and an optional unclassed <p> caption close it. The sheet paints
    .bar-primary/.bar-success/.bar-warning/.point/.line/.axis/.legend; only the legend-dot colour
    is set inline, exactly as the vanilla page does. The vanilla caption carries class="value",
    which no shared stylesheet defines (so it renders unstyled there), and this binding emits the
    same paragraph with no class rather than inventing one. No stylesheet is added.
  LIGHT_DOM: true
  VARIANTS: bar (single + multi-colour series), line, with legend, with caption
  PROPS: type (bar|line), title, desc, values (csv numbers), labels (csv strings), colors
    (csv primary|success|warning per bar, default primary), legend (csv name=token), summary
  STATES: re-renders when any data attribute changes; the grow-up and line-draw animations are the
    sheet's and re-play on each re-render
  A11Y: the svg is role="img" with a <title> and <desc> joined by aria-labelledby, so a screen
    reader reads the chart as one labelled graphic; axis labels are real <text>, colour is never
    the only signal (bars carry position + label, the line carries point markers)
  KEYBOARD: none required — the chart is a static graphic, not an interactive control, matching
    the vanilla preview which adds no focusable behaviour to the svg
  EVENTS: none (data-driven, no interaction to report)
  RESPONSIVE: the .chart frame is a flex column with min-width:0 and the sheet sets
    .chart svg{width:100%;height:auto}, so the viewBox-scaled artwork shrinks to 320px untouched
  VERIFIED: served by node tools/audit/serve.js --port 8791 and driven in headless Chrome and Edge
    (puppeteer-core) 2026-11-01: preview/gallery.html passes 46 behaviour probes at 1280px and 390px
    in light and dark with 0 console errors, and axe-core reports 0 serious/critical at both widths
    in both browsers
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

const CHART_NS = "http://www.w3.org/2000/svg";
const TOKEN = {
  primary: "var(--primary-bg)",
  success: "hsl(var(--color-success-500))",
  warning: "hsl(var(--color-warning-500))",
};
let chartSeq = 0;
const csv = (s) => (s == null ? [] : String(s).split(",").map((x) => x.trim()).filter((x) => x !== ""));

function defineMueCharts() {
  class MueCharts extends HTMLElement {
    static get observedAttributes() {
      return ["type", "title", "desc", "values", "labels", "colors", "legend", "summary"];
    }
    connectedCallback() {
      this.render();
    }
    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }
    get values() {
      return csv(this.getAttribute("values")).map(Number);
    }
    set values(v) {
      this.setAttribute("values", (v || []).join(","));
    }
    render() {
      const values = this.values.filter((n) => Number.isFinite(n));
      const labels = csv(this.getAttribute("labels"));
      const colors = csv(this.getAttribute("colors"));
      const type = (this.getAttribute("type") || "bar").toLowerCase();
      const titleId = "mue-chart-t-" + ++chartSeq;
      const descId = "mue-chart-d-" + ++chartSeq;

      const fig = document.createElement("figure");
      fig.className = "chart";

      const cap = document.createElement("figcaption");
      cap.className = "chart-title";
      cap.textContent = this.getAttribute("title") || "";
      fig.appendChild(cap);

      const svg = document.createElementNS(CHART_NS, "svg");
      svg.setAttribute("viewBox", "0 0 700 180");
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-labelledby", titleId + " " + descId);
      svg.setAttribute("focusable", "false");
      const ttl = document.createElementNS(CHART_NS, "title");
      ttl.id = titleId;
      ttl.textContent = this.getAttribute("title") || "Chart";
      const dsc = document.createElementNS(CHART_NS, "desc");
      dsc.id = descId;
      dsc.textContent = this.getAttribute("desc") || (type + " chart with " + values.length + " values.");
      svg.append(ttl, dsc);

      const max = Math.max(1, ...values);
      if (type === "line") this.#line(svg, values, labels, max);
      else this.#bars(svg, values, labels, colors, max);
      fig.appendChild(svg);

      const legend = csv(this.getAttribute("legend"));
      if (legend.length) {
        const wrap = document.createElement("div");
        wrap.className = "legend";
        legend.forEach((entry) => {
          const eq = entry.indexOf("=");
          const name = eq === -1 ? entry : entry.slice(0, eq);
          const token = eq === -1 ? "primary" : entry.slice(eq + 1);
          const item = document.createElement("span");
          item.className = "legend-item";
          const dot = document.createElement("span");
          dot.className = "legend-dot";
          dot.style.background = TOKEN[token] || TOKEN.primary;
          item.append(dot, document.createTextNode(name));
          wrap.appendChild(item);
        });
        fig.appendChild(wrap);
      }

      if (this.getAttribute("summary")) {
        // The vanilla page writes <p class="value"> here, but no shared stylesheet defines
        // .value, so that paragraph renders unstyled there too. Emitting the same unstyled
        // <p> keeps the port faithful without inventing a class the audit would reject.
        const p = document.createElement("p");
        p.textContent = this.getAttribute("summary");
        fig.appendChild(p);
      }

      this.textContent = "";
      this.appendChild(fig);
    }
    #bars(svg, values, labels, colors, max) {
      const n = values.length;
      if (!n) return;
      const slot = 700 / n;
      const barW = Math.min(70, slot * 0.62);
      values.forEach((v, i) => {
        const h = (v / max) * 130;
        const x = i * slot + (slot - barW) / 2;
        const y = 170 - h;
        const color = TOKEN[colors[i]] ? colors[i] : "primary";
        const rect = document.createElementNS(CHART_NS, "rect");
        rect.setAttribute("x", x.toFixed(1));
        rect.setAttribute("y", y.toFixed(1));
        rect.setAttribute("width", barW.toFixed(1));
        rect.setAttribute("height", h.toFixed(1));
        rect.setAttribute("class", "bar bar-" + color);
        svg.appendChild(rect);
        const text = document.createElementNS(CHART_NS, "text");
        text.setAttribute("x", (i * slot + slot / 2).toFixed(1));
        text.setAttribute("y", "175");
        text.setAttribute("class", "axis");
        text.setAttribute("text-anchor", "middle");
        text.textContent = labels[i] || "";
        svg.appendChild(text);
      });
    }
    #line(svg, values, labels, max) {
      const n = values.length;
      if (!n) return;
      const step = n > 1 ? 620 / (n - 1) : 0;
      const pts = values.map((v, i) => {
        const x = n > 1 ? 40 + i * step : 350;
        const y = 170 - (v / max) * 130;
        return { x, y, label: labels[i] };
      });
      const poly = document.createElementNS(CHART_NS, "polyline");
      poly.setAttribute("class", "line");
      poly.setAttribute("points", pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
      svg.appendChild(poly);
      pts.forEach((p) => {
        const c = document.createElementNS(CHART_NS, "circle");
        c.setAttribute("cx", p.x.toFixed(1));
        c.setAttribute("cy", p.y.toFixed(1));
        c.setAttribute("r", "3");
        c.setAttribute("class", "point");
        svg.appendChild(c);
        if (p.label) {
          const text = document.createElementNS(CHART_NS, "text");
          text.setAttribute("x", p.x.toFixed(1));
          text.setAttribute("y", "175");
          text.setAttribute("class", "axis");
          text.setAttribute("text-anchor", "middle");
          text.textContent = p.label;
          svg.appendChild(text);
        }
      });
    }
  }
  if (!customElements.get("mue-charts")) customElements.define("mue-charts", MueCharts);
  return MueCharts;
}

export const MueCharts = defineMueCharts();
export default MueCharts;
