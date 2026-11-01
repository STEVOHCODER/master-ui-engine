<!-- BEGIN MUE:META
  COMPONENT: Button
  ID: vue-btn-button
  GROUP: Frameworks / Vue 3
  CATEGORY: buttons
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#buttons only — this SFC ships no CSS of its own
  SHEET: styles/components.css#buttons — btn, btn-primary|secondary|outline|ghost|danger|success|link, btn-sm, btn-lg, btn-block, btn-icon, .loading > .bar
  VARIANTS: variant prop = primary|secondary|outline|ghost|danger|success|link; size = sm|lg; block; iconOnly; loading; disabled
  A11Y: real <button>; aria-busy while loading; icon-only rows require an aria-label (fallthrough attr); decorative SVG stays aria-hidden
  KEYBOARD: native button Enter/Space; focus ring from the sheet (--ring-focus)
  PORTED FROM: components/buttons/buttons.html
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  /** One of primary|secondary|outline|ghost|danger|success|link (the btn-* classes in the sheet). */
  variant: { type: String, default: "primary" },
  /** sm or lg; null keeps the base size. */
  size: { type: String, default: null },
  block: { type: Boolean, default: false },
  /** Square icon-only button; pass aria-label on the component. */
  iconOnly: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: "button" },
});

const classes = computed(() => [
  "btn",
  props.variant ? `btn-${props.variant}` : null,
  props.size ? `btn-${props.size}` : null,
  props.block ? "btn-block" : null,
  props.iconOnly ? "btn-icon" : null,
  props.loading ? "loading" : null,
]);
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="bar" aria-hidden="true"></span>
    <slot />
  </button>
</template>
