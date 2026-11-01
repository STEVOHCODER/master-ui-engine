<!-- BEGIN MUE:META
  COMPONENT: Badge
  ID: vue-ui-badge
  GROUP: Frameworks / Vue 3
  CATEGORY: display
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#badges only — this SFC ships no CSS of its own
  SHEET: styles/components.css#badges — badge, badge-primary|success|warning|error|danger|info, badge-solid, dot
  VARIANTS: variant prop = primary|success|warning|error|danger|info (null keeps the neutral badge); solid; dot
  A11Y: text carries the meaning, colour never stands alone; the dot is aria-hidden decoration
  KEYBOARD: none — a badge is not interactive
  PORTED FROM: grep of styles/components.css (badge region), used in cards + tables previews
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  variant: { type: String, default: null },
  solid: { type: Boolean, default: false },
  dot: { type: Boolean, default: false },
});
</script>

<template>
  <span
    class="badge"
    :class="[props.variant ? `badge-${props.variant}` : null, props.solid ? 'badge-solid' : null]"
  >
    <span v-if="dot" class="dot" aria-hidden="true"></span>
    <slot />
  </span>
</template>
