<!-- BEGIN MUE:META
  COMPONENT: Chart (bar + line)
  ID: vue-ui-charts
  GROUP: Frameworks / Vue 3
  CATEGORY: charts
  FRAMEWORK: vue 3 (<script setup> SFC, data-driven SVG)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#charts only — this SFC ships no CSS of its own
  SHEET: styles/components.css#charts — chart, chart-title, bar, bar-primary|bar-success|bar-warning, axis, line, point, legend, legend-item, legend-dot
  VARIANTS: type = bar (with an optional legend) | line (with points + a trend note); bar tones primary|success|warning
  A11Y: <svg role="img"> with <title> and <desc> joined by aria-labelledby; the axis labels, bar positions and the trend note carry the
        data so colour is never the only signal; the legend dot is aria-hidden decoration beside a text label
  KEYBOARD: none — a chart is not interactive; it is a labelled image
  BEHAVIOUR: geometry is computed from the data (values, max, point count) into the shared 700x180 viewBox, so the artwork scales with .chart svg.
        The bar growth and line-draw animations and the bar/point fills come from the sheet; the legend dot colour and the line's stroke are decorative
        inline tokens because #charts defines no per-series background class for an HTML dot and paints no stroke on .line (the vanilla preview keeps both
        in its own page-local <style>, which a binding may not add) — so both are handed the --primary-bg token inline, exactly as the sheet's own .point does.

  PORTED FROM: components/charts/charts.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const props = defineProps({
  /** "bar" | "line". */
  type: { type: String, default: "bar" },
  title: { type: String, required: true },
  desc: { type: String, default: null },
  /** Bar data: [{ label, value, tone? }]. tone = primary|success|warning. */
  bars: { type: Array, default: () => [] },
  /** Line data: a list of numbers. */
  values: { type: Array, default: () => [] },
  /** X-axis labels for the line variant. */
  labels: { type: Array, default: () => [] },
  /** Top of the bar scale; defaults to the tallest bar. */
  max: { type: Number, default: 0 },
  /** Legend entries for the bar variant: [{ label, tone }]. */
  legend: { type: Array, default: () => [] },
  /** One-line trend note shown under the line variant. */
  note: { type: String, default: null },
});

const uid = useId();
const titleId = computed(() => `mue-chart-title${uid}`);
const descId = computed(() => `mue-chart-desc${uid}`);

// Geometry lives in the shared 700x180 viewBox the sheet draws against.
const W = 700;
const BASE = 150; // bar baseline / label row sits below this
const TOP = 20; // headroom

const barScale = computed(() => props.max || Math.max(1, ...props.bars.map((b) => Number(b.value) || 0)));

const barGeo = computed(() => {
  const n = props.bars.length || 1;
  const slot = (W - 80) / n;
  const width = slot * 0.6;
  const range = BASE - TOP;
  return props.bars.map((b, i) => {
    const value = Number(b.value) || 0;
    const h = (value / barScale.value) * range;
    const x = 40 + i * slot + (slot - width) / 2;
    return { x, y: BASE - h, width, height: h, label: b.label, tone: b.tone || "primary" };
  });
});

const lineGeo = computed(() => {
  const n = props.values.length || 1;
  const maxV = Math.max(1, ...props.values.map((v) => Number(v) || 0));
  const minV = Math.min(0, ...props.values.map((v) => Number(v) || 0));
  const span = maxV - minV || 1;
  const step = (W - 120) / Math.max(1, n - 1);
  return props.values.map((v, i) => {
    const x = 60 + i * step;
    const y = BASE - ((Number(v) || 0) - minV) / span * (BASE - TOP);
    return { x, y, label: props.labels[i] };
  });
});

const pointsAttr = computed(() => lineGeo.value.map((p) => `${p.x},${p.y}`).join(" "));

// Decorative dot colour — #charts paints the SVG bars with fill classes but has no
// background class for an HTML legend dot, so the token the bar already uses is reused here.
const TONE_BG = {
  primary: "var(--primary-bg)",
  success: "hsl(var(--color-success-500))",
  warning: "hsl(var(--color-warning-500))",
};
const dotStyle = (tone) => ({ background: TONE_BG[tone] || TONE_BG.primary });
</script>

<template>
  <figure class="chart">
    <figcaption class="chart-title">{{ title }}</figcaption>

    <svg
      v-if="type === 'bar'"
      :viewBox="`0 0 ${W} 180`"
      role="img"
      :aria-labelledby="`${titleId} ${descId}`"
      focusable="false"
    >
      <title :id="titleId">{{ title }}</title>
      <desc :id="descId">{{ desc || title }}</desc>
      <rect
        v-for="(b, i) in barGeo"
        :key="`b-${i}`"
        :x="b.x"
        :y="b.y"
        :width="b.width"
        :height="b.height"
        :class="['bar', `bar-${b.tone}`]"
      />
      <text
        v-for="(b, i) in barGeo"
        :key="`l-${i}`"
        :x="b.x + b.width / 2"
        :y="175"
        class="axis"
        text-anchor="middle"
      >{{ b.label }}</text>
    </svg>

    <svg
      v-else
      :viewBox="`0 0 ${W} 180`"
      role="img"
      :aria-labelledby="`${titleId} ${descId}`"
      focusable="false"
    >
      <title :id="titleId">{{ title }}</title>
      <desc :id="descId">{{ desc || title }}</desc>
      <polyline :points="pointsAttr" class="line" style="fill: none; stroke: var(--primary-bg); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round" />
      <circle v-for="(p, i) in lineGeo" :key="`p-${i}`" :cx="p.x" :cy="p.y" r="3" class="point" />
      <text
        v-for="(p, i) in lineGeo"
        :key="`pl-${i}`"
        :x="p.x"
        :y="175"
        class="axis"
        text-anchor="middle"
      >{{ p.label }}</text>
    </svg>

    <div v-if="type === 'bar' && legend.length" class="legend">
      <span v-for="(item, i) in legend" :key="`lg-${i}`" class="legend-item">
        <span class="legend-dot" :style="dotStyle(item.tone)" aria-hidden="true"></span>{{ item.label }}
      </span>
    </div>

    <p v-else-if="type === 'line' && note" class="card-desc">{{ note }}</p>
  </figure>
</template>
