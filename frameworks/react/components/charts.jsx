/* BEGIN MUE:META
  COMPONENT: Charts
  ID: react-ui-charts
  GROUP: Frameworks > React > Components
  CATEGORY: charts
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#charts + design-tokens/engine.css (both linked by the host page); no other module in this package — no chart library, no CDN, the artwork is plain SVG
  SHEET: styles/components.css#charts — .chart (fluid frame), .chart svg { width:100%; height:auto }, .chart-title, .axis / .chart text, .chart .bar + .bar-primary/.bar-success/.bar-warning (fill + grow-in), .chart .line (draw-in), .chart .point, .chart .prior, .chart .area, .chart .grid-line, .legend, .legend-item, .legend-dot
  PORTS: components/charts/charts.html (Bar chart run with its six bars and axis labels, Line chart run, Responsive-behaviour note, and the .legend from its Markup block)
  PROPS: MueBarChart — title (also the <title> and .chart-title), desc (<desc> text), data (array of {label, value, tone}), height (viewBox height, default 180), width (viewBox width, default 700), gridLines (number of .grid-line rules, default 0), valueFormat (fn(value) -> string appended to the <title> for readers), caption (node after the svg), legend (array of {label, tone} rendered through MueChartLegend), className, id. MueLineChart — same minus gridLines, plus prior (array of numbers drawn as the dashed .prior comparison series), area (default true, the .area wash under the line), pointRadius (default 3). MueChartLegend — items (array of {label, tone}), className. Both charts scale the data into the viewBox themselves, so the numbers are data, not coordinates
  STATES: static artwork only — nothing hovers, selects or tooltips here; the bar growth and line draw are the sheet's own keyframes, so they run once per mount and collapse under prefers-reduced-motion
  VARIANTS: bar chart with per-bar tone (the preview mixes primary with one success and one warning bar), line chart with points, optional prior series and area wash, plus a legend
  A11Y: <figure class="chart"> + <figcaption class="chart-title">, and the SVG is role="img" with aria-labelledby pointing at generated <title> and <desc> ids exactly as the preview does; each chart appends the value series to the description when valueFormat is passed so the numbers are readable without the picture; the legend is text plus a coloured mark, so colour is never the only carrier
  KEYBOARD: none — a chart is not focusable and the preview makes it none either; a host that needs a data table should render one (this package ships MueTable for that)
  EVENTS: none
  RESPONSIVE: the artwork is viewBox-scaled and .chart svg is width:100%;height:auto, so it keeps its ratio at any column width — two charts in a .grid-auto stack once a column no longer fits; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the DOM was read back — six <rect class="bar bar-*"> with viewBox geometry, six .axis labels, one polyline.line + circles.point + path.area for the trend, and three .legend-item entries; no new CSS is asserted and no colour is set from script
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The three fills the sheet defines inside .chart. An unknown tone writes no
   tone class, so the bar keeps .bar and stays visible. */
const TONES = new Set(["primary", "success", "warning"]);

const PLOT = { left: 40, right: 40, top: 10, baseline: 170 };

function scale(values) {
  const max = Math.max(...values, 0);
  return max > 0 ? (v) => ((v / max) * (PLOT.baseline - PLOT.top)) : () => 0;
}

function slotX(index, count, width) {
  const span = width - PLOT.left - PLOT.right;
  const slot = span / Math.max(count, 1);
  return { slot, centre: PLOT.left + slot * index + slot / 2 };
}

export function MueChartLegend({ items = [], className, ...rest }) {
  return (
    <div className={cx("legend", className)} {...rest}>
      {items.map((item, i) => (
        <span key={`${item?.label ?? i}`} className="legend-item">
          <svg className="legend-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
            <rect
              width="10"
              height="10"
              className={cx(
                TONES.has(item?.tone) ? `bar-${item.tone}` : "bar-primary"
              )}
            />
          </svg>
          {item?.label ?? item}
        </span>
      ))}
    </div>
  );
}

export function MueBarChart({
  title,
  desc,
  data = [],
  width = 700,
  height = 180,
  gridLines = 0,
  valueFormat,
  caption,
  legend,
  className,
  id,
  ...rest
}) {
  const auto = useId();
  const svgId = id ?? `chart-${auto}`;
  const values = data.map((d) => Number(d?.value) || 0);
  const yFor = scale(values);

  return (
    <figure className={cx("chart", className)} {...rest}>
      <figcaption className="chart-title">{title}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${svgId}-title ${svgId}-desc`}
        focusable="false"
      >
        <title id={`${svgId}-title`}>
          {valueFormat && values.length
            ? `${title}: ${values.map(valueFormat).join(", ")}`
            : title}
        </title>
        <desc id={`${svgId}-desc`}>{desc}</desc>
        {Array.from({ length: Math.max(0, gridLines) }, (_, i) => {
          const y = PLOT.baseline - ((PLOT.baseline - PLOT.top) * (i + 1)) / (gridLines + 1);
          return (
            <line
              key={`grid-${i}`}
              className="grid-line"
              x1={PLOT.left}
              x2={width - PLOT.right}
              y1={y}
              y2={y}
            />
          );
        })}
        {data.map((d, i) => {
          const v = Number(d?.value) || 0;
          const h = yFor(v);
          const { slot, centre } = slotX(i, data.length, width);
          return (
            <g key={`${d?.label ?? i}`}>
              <rect
                className={cx("bar", TONES.has(d?.tone) ? `bar-${d.tone}` : "bar-primary")}
                x={centre - slot * 0.35}
                width={slot * 0.7}
                y={PLOT.baseline - h}
                height={h}
              />
              <text className="axis" x={centre} y={height - 5} textAnchor="middle">
                {d?.label ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
      {caption}
      {legend ? <MueChartLegend items={legend} /> : null}
    </figure>
  );
}

export function MueLineChart({
  title,
  desc,
  data = [],
  prior,
  area = true,
  width = 700,
  height = 180,
  pointRadius = 3,
  valueFormat,
  caption,
  legend,
  className,
  id,
  ...rest
}) {
  const auto = useId();
  const svgId = id ?? `chart-${auto}`;
  const values = data.map((d) => Number(d?.value) || 0);
  const all = prior?.length ? [...values, ...prior.map((v) => Number(v) || 0)] : values;
  const yFor = scale(all);

  const points = data.map((d, i) => {
    const { centre } = slotX(i, data.length, width);
    return { x: centre, y: PLOT.baseline - yFor(Number(d?.value) || 0), label: d?.label ?? "" };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const priorPoints = (prior ?? []).map((v, i) => {
    const { centre } = slotX(i, prior.length, width);
    return `${centre},${PLOT.baseline - yFor(Number(v) || 0)}`;
  });

  return (
    <figure className={cx("chart", className)} {...rest}>
      <figcaption className="chart-title">{title}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${svgId}-title ${svgId}-desc`}
        focusable="false"
      >
        <title id={`${svgId}-title`}>
          {valueFormat && values.length
            ? `${title}: ${values.map(valueFormat).join(", ")}`
            : title}
        </title>
        <desc id={`${svgId}-desc`}>{desc}</desc>
        {area && points.length > 1 ? (
          <polygon
            className="area"
            points={`${line} ${points[points.length - 1].x},${PLOT.baseline} ${points[0].x},${PLOT.baseline}`}
          />
        ) : null}
        {priorPoints.length > 1 ? (
          <polyline className="prior" points={priorPoints.join(" ")} />
        ) : null}
        {/* .chart .line owns the draw-in animation and never paints a stroke, so
            the stroke is an SVG presentation attribute on the element — the same
            mechanism the previews use for every glyph (stroke="currentColor"). */}
        {points.length > 1 ? (
          <polyline
            className="line"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={line}
          />
        ) : null}
        {points.map((p, i) => (
          <circle
            key={`${p.label}-${i}`}
            className="point"
            cx={p.x}
            cy={p.y}
            r={pointRadius}
          />
        ))}
        {points.map((p, i) =>
          p.label ? (
            <text key={`label-${i}`} className="axis" x={p.x} y={height - 5} textAnchor="middle">
              {p.label}
            </text>
          ) : null
        )}
      </svg>
      {caption}
      {legend ? <MueChartLegend items={legend} /> : null}
    </figure>
  );
}

export default MueBarChart;
