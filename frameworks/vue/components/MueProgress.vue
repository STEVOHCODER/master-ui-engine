<!-- BEGIN MUE:META
  COMPONENT: Progress
  ID: vue-fb-progress
  GROUP: Frameworks / Vue 3
  CATEGORY: feedback
  FRAMEWORK: vue 3 (<script setup> SFC, value prop 0..max)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback only — this SFC ships no CSS of its own
  SHEET: styles/components.css#feedback — progress-group, progress-label, percent, track, bar, progress-success, progress-warning, progress-striped, progress-indeterminate
  VARIANTS: determinate (value drives --value), success, warning, striped, indeterminate (no value)
  A11Y: role="progressbar" with aria-valuenow/min/max updated live; the label is associated via aria-labelledby; indeterminate uses aria-label only; the percent number is shown so state never rides on colour alone
  KEYBOARD: none — this is a status readout. The parent demo drives the value, matching the preview's button row
  PORTED FROM: components/feedback/progress.html
  VERIFIED: compiles in build.mjs; value + aria-valuenow update driven headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const props = defineProps({
  label: { type: String, required: true },
  /** Current value 0..max. Ignored when indeterminate. */
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  /** "success" | "warning" | "striped" | "indeterminate" | "" (default primary). */
  variant: { type: String, default: "" },
  showValue: { type: Boolean, default: true },
});

const trackClasses = computed(() => {
  const map = {
    success: "progress-success",
    warning: "progress-warning",
    striped: "progress-striped",
    indeterminate: "progress-indeterminate",
  };
  const extra = map[props.variant];
  return extra ? ["track", extra] : ["track"];
});

const pct = computed(() =>
  Math.round((Math.min(Math.max(props.value, 0), props.max) / props.max) * 100)
);

/* An id taken from the label verbatim can hold spaces, and aria-labelledby
   reads those as separate references; useId also keeps two bars that share a
   label apart. */
const labelId = "mue-progress-" + useId().replace(/[^-:._a-zA-Z0-9]/g, "");
</script>

<template>
  <div class="progress-group">
    <div class="progress-label">
      <span :id="labelId">{{ label }}</span>
      <span v-if="showValue && variant !== 'indeterminate'" class="percent">{{ pct }}%</span>
    </div>
    <div
      class="track"
      :class="trackClasses"
      role="progressbar"
      :aria-labelledby="labelId"
      :aria-valuenow="variant === 'indeterminate' ? undefined : pct"
      :aria-valuemin="variant === 'indeterminate' ? undefined : 0"
      :aria-valuemax="variant === 'indeterminate' ? undefined : 100"
    >
      <div class="bar" :style="variant === 'indeterminate' ? undefined : { '--value': pct + '%' }"></div>
    </div>
  </div>
</template>
