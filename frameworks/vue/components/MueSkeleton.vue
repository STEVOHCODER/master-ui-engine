<!-- BEGIN MUE:META
  COMPONENT: Skeleton
  ID: vue-fb-skeleton
  GROUP: Frameworks / Vue 3
  CATEGORY: feedback
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback (+ #cards, #utilities for the card/list frames) — this SFC ships no CSS of its own
  SHEET: styles/components.css#feedback — skeleton, skeleton-img, skeleton-body, skeleton-title, skeleton-text, skeleton-avatar, skeleton-btn, skeleton-row
  VARIANTS: card (image + body lines), list (avatar + two-line stack), button, and a bare text/title line via lines count
  A11Y: root carries role="status" and an aria-label ("Loading"), the placeholder shapes are aria-hidden so a reader hears one announcement, not a list of bars
  KEYBOARD: none — a skeleton is inert. Swap it for real content when data arrives, keeping the same layout to avoid shift
  PORTED FROM: components/feedback/skeleton.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery at 1280 and 390 (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  /** "card" | "list" | "button" | "text" | "title" | "avatar". */
  variant: { type: String, default: "card" },
  /** Accessible announcement for the placeholder region. */
  label: { type: String, default: "Loading" },
});
</script>

<template>
  <div v-if="variant === 'card'" class="card" role="status" :aria-label="label">
    <div class="skeleton skeleton-img" aria-hidden="true"></div>
    <div class="skeleton-body" aria-hidden="true">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 40%"></div>
    </div>
  </div>

  <div v-else-if="variant === 'list'" class="row skeleton-row" role="status" :aria-label="label">
    <div class="skeleton skeleton-avatar" aria-hidden="true"></div>
    <div class="stack" style="flex: 1; min-width: 0" aria-hidden="true">
      <div class="skeleton skeleton-title" style="width: 70%"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 40%"></div>
    </div>
  </div>

  <div v-else-if="variant === 'button'" role="status" :aria-label="label">
    <div class="skeleton skeleton-btn" aria-hidden="true"></div>
  </div>

  <div v-else-if="variant === 'title'" role="status" :aria-label="label">
    <div class="skeleton skeleton-title" aria-hidden="true"></div>
  </div>

  <div v-else-if="variant === 'avatar'" role="status" :aria-label="label">
    <div class="skeleton skeleton-avatar" aria-hidden="true"></div>
  </div>

  <div v-else role="status" :aria-label="label">
    <div class="skeleton skeleton-text" aria-hidden="true"></div>
  </div>
</template>
