<!-- BEGIN MUE:META
  COMPONENT: Empty state
  ID: vue-fb-empty
  GROUP: Frameworks / Vue 3
  CATEGORY: feedback
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback (+ #buttons, #utilities for the action row) — this SFC ships no CSS of its own
  SHEET: styles/components.css#feedback — empty, empty-icon, empty-title, empty-desc
  VARIANTS: no-results and first-time-use; the icon is an emoji glyph or a slotted SVG; actions are slotted buttons
  A11Y: role="status" with an aria-label; the decorative icon is aria-hidden so meaning lives in the title + description; actions are real buttons in the default slot
  KEYBOARD: none added — every escape-route is a native button, so it is reachable by Tab
  PORTED FROM: components/feedback/empty-state.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: null },
  /** Decorative emoji used when no #icon slot is provided. */
  icon: { type: String, default: null },
  ariaLabel: { type: String, default: "Empty state" },
});
</script>

<template>
  <div class="empty" role="status" :aria-label="ariaLabel">
    <div v-if="icon || $slots.icon" class="empty-icon" aria-hidden="true">
      <slot name="icon">{{ icon }}</slot>
    </div>
    <h2 class="empty-title">{{ title }}</h2>
    <p v-if="desc" class="empty-desc">{{ desc }}</p>
    <div v-if="$slots.actions" class="row">
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>
