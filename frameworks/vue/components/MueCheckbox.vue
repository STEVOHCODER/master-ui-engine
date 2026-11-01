<!-- BEGIN MUE:META
  COMPONENT: Checkbox
  ID: vue-frm-checkbox
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel boolean)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice only — this SFC ships no CSS of its own
  SHEET: styles/components.css#choice — checkbox label, visually-hidden input, box + tick svg, focus-visible ring on the box
  VARIANTS: checked / unchecked via v-model; disabled
  A11Y: native <input type="checkbox"> wrapped in its own <label> (whole row clickable); tick svg is aria-hidden;
        checked state announced by the real input. Note: the vanilla preview's .choice-desc line is preview-local CSS,
        so the description slot renders as plain unclassed text here.
  KEYBOARD: native checkbox (Space toggles); disabled drops out of the tab order
  PORTED FROM: components/forms/checkboxes.html
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ type: Boolean, default: false });

const props = defineProps({
  id: { type: String, default: null },
  name: { type: String, default: null },
  description: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const inputId = computed(() => props.id || `mue-checkbox${uid}`);
</script>

<template>
  <label class="checkbox" :for="inputId">
    <input
      :id="inputId"
      type="checkbox"
      v-model="model"
      :name="name || undefined"
      :disabled="disabled"
    />
    <span class="box" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>
    </span>
    <span><slot />
      <span v-if="description">{{ description }}</span>
    </span>
  </label>
</template>
