<!-- BEGIN MUE:META
  COMPONENT: Card
  ID: vue-ui-card
  GROUP: Frameworks / Vue 3
  CATEGORY: cards
  FRAMEWORK: vue 3 (<script setup> SFC, slot-based)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#cards only — this SFC ships no CSS of its own
  SHEET: styles/components.css#cards — card, card-elevated, card-outlined, card-featured, card-interactive, card-media, card-body, card-tag, card-title, card-desc, card-actions + .spread (utilities)
  VARIANTS: variant prop = space-separated list of elevated|outlined|featured|interactive (the card-* classes in the sheet)
  A11Y: <article> landmark per the preview; media slot should hold aria-hidden decorative svg; links/buttons inside actions stay real elements
  KEYBOARD: none of its own — interactive cards get the sheet :focus-visible ring on their real controls
  PORTED FROM: components/cards/cards.html
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  /** "elevated featured" etc. — each word maps to a card-<word> class from the sheet. */
  variant: { type: String, default: null },
  tag: { type: String, default: null },
  title: { type: String, default: null },
  desc: { type: String, default: null },
});
</script>

<template>
  <article
    class="card"
    :class="variant ? variant.split(' ').map((v) => `card-${v}`) : null"
  >
    <div v-if="$slots.media" class="card-media"><slot name="media" /></div>
    <div class="card-body">
      <span v-if="tag" class="card-tag">{{ tag }}</span>
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <p v-if="desc" class="card-desc">{{ desc }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="card-actions spread"><slot name="actions" /></div>
  </article>
</template>
