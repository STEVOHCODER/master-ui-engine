<!-- BEGIN MUE:META
  COMPONENT: Rating (read-only)
  ID: vue-ui-rating
  GROUP: Frameworks / Vue 3
  CATEGORY: display
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#rating only — this SFC ships no CSS of its own
  SHEET: styles/components.css#rating — rating, rating-stars, star, star.is-filled, star.is-half, rating-value
  VARIANTS: whole stars, a half star (is-half), score + trailing caption (e.g. "312 reviews"); score may be omitted
  A11Y: the <p> carries role="img" and an aria-label such as "3.5 out of 5 stars"; the star glyphs inside are aria-hidden,
        so a reader states the score once rather than counting glyphs; half steps are always shown beside the numeric score
  KEYBOARD: none — a read-only rating is a labelled graphic, not a control
  PORTED FROM: components/display/rating.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed } from "vue";

const props = defineProps({
  /** Score, 0..max. Fractions render a half star. */
  value: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  /** Trailing caption beside the score, e.g. "312 reviews". */
  caption: { type: String, default: null },
  /** Show the numeric score; on by default. */
  showValue: { type: Boolean, default: true },
  /** Accessible label; defaults to "<value> out of <max> stars". */
  ariaLabel: { type: String, default: null },
});

const stars = computed(() =>
  Array.from({ length: props.max }, (_, i) => {
    const n = i + 1;
    const filled = props.value >= n;
    const half = !filled && props.value >= n - 0.5;
    return { filled, half };
  })
);
</script>

<template>
  <p class="rating" role="img" :aria-label="ariaLabel || `${value} out of ${max} stars`">
    <span class="rating-stars" aria-hidden="true">
      <span
        v-for="(s, i) in stars"
        :key="i"
        class="star"
        :class="{ 'is-filled': s.filled, 'is-half': s.half && !s.filled }"
        >&#9733;</span
      >
    </span>
    <span v-if="showValue" class="rating-value">{{ value.toFixed(1) }}</span>
    <span v-if="caption">{{ caption }}</span>
  </p>
</template>
