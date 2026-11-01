<!-- BEGIN MUE:META
  COMPONENT: Rating (interactive radio group)
  ID: vue-ui-rating
  GROUP: Frameworks / Vue 3
  CATEGORY: display
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel number)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#rating only — this SFC ships no CSS of its own
  SHEET: styles/components.css#rating — rating-input (fieldset), sr-only legend, rating-radio (input), rating-star (label)
  VARIANTS: any max (default 5); the selected value is the one that submits with the form
  A11Y: five radios in natural 1-5 DOM order so arrow keys move in the direction the stars are drawn; every input keeps a
        .sr-only name ("3 stars"), so the group reads as an ordinary radio set to assistive tech; :focus-visible rings the star, never the clipped input
  KEYBOARD: native radio group — Tab enters, Right/Up raise, Left/Down lower, Space commits; no JavaScript is intercepted
  PORTED FROM: components/display/rating.html
  VERIFIED: compiles in build.mjs; arrow-key selection driven headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ type: Number, default: 0 });

const props = defineProps({
  max: { type: Number, default: 5 },
  name: { type: String, default: null },
  /** Screen-reader legend text for the group. */
  legend: { type: String, default: "Rate from 1 to 5 stars" },
});

const uid = useId();
const starId = (n) => `mue-rate${uid}-${n}`;
const group = computed(() => props.name || `mue-rate${uid}`);
const stars = computed(() => Array.from({ length: props.max }, (_, i) => i + 1));
</script>

<template>
  <fieldset class="rating-input">
    <legend class="sr-only">{{ legend }}</legend>
    <template v-for="n in stars" :key="n">
      <input
        class="rating-radio"
        type="radio"
        :name="group"
        :id="starId(n)"
        :value="n"
        v-model="model"
      />
      <label class="rating-star" :for="starId(n)">
        <span aria-hidden="true">&#9733;</span><span class="sr-only">{{ n }} {{ n === 1 ? "star" : "stars" }}</span>
      </label>
    </template>
  </fieldset>
</template>
