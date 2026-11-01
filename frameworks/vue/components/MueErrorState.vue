<!-- BEGIN MUE:META
  COMPONENT: Error state
  ID: vue-fb-error
  GROUP: Frameworks / Vue 3
  CATEGORY: feedback
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback (+ #buttons, #utilities for the action row) — this SFC ships no CSS of its own
  SHEET: styles/components.css#feedback — error-state, error-inline, error-icon, error-body; empty-title/empty-desc reused for the text
  VARIANTS: centered page error (default) and left-aligned inline card (inline prop = true, icon + body + actions)
  A11Y: role="alert" so the failure is announced; the icon is aria-hidden and colour never carries the message alone — the title + description say it; actions are real buttons/links
  KEYBOARD: none added — retry / contact-support actions are native controls, keyboard reachable
  PORTED FROM: components/feedback/error-state.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery in both variants (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  title: { type: String, required: true },
  desc: { type: String, default: null },
  /** Left-aligned card layout (icon + body + actions) instead of the centred panel. */
  inline: { type: Boolean, default: false },
});
</script>

<template>
  <div class="error-state" :class="{ 'error-inline': inline }" role="alert">
    <div class="error-icon" aria-hidden="true">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7.5v5.5"></path>
          <path d="M12 16.6h.01"></path>
        </svg>
      </slot>
    </div>
    <div class="error-body">
      <h2 class="empty-title">{{ title }}</h2>
      <p v-if="desc" class="empty-desc">{{ desc }}</p>
    </div>
    <div v-if="$slots.actions" class="row">
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>
