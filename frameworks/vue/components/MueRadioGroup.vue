<!-- BEGIN MUE:META
  COMPONENT: Radio Group
  ID: vue-frm-radio-group
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice only — this SFC ships no CSS of its own
  SHEET: styles/components.css#choice — radiogroup, radio label, visually-hidden input, box + dot, focus-visible ring
  VARIANTS: options = [{label, value, disabled?}] (or strings); selected value via v-model
  A11Y: <fieldset> + <legend> name the question; shared name attribute makes the group exclusive;
        real radio inputs so checked state and arrow-key navigation come free
  KEYBOARD: native radios — arrows cycle the group, Space selects; disabled options drop out of the ring
  PORTED FROM: components/forms/radio-buttons/radio-buttons.html
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ default: null });

const props = defineProps({
  legend: { type: String, required: true },
  /** Strings or { label, value, disabled? } objects. */
  options: { type: Array, default: () => [] },
  name: { type: String, default: null },
});

const uid = useId();
const groupName = computed(() => props.name || `mue-radio${uid}`);
const items = computed(() =>
  props.options.map((o) =>
    o && typeof o === "object" ? { disabled: false, ...o } : { label: String(o), value: o, disabled: false }
  )
);
</script>

<template>
  <fieldset class="radiogroup">
    <legend>{{ legend }}</legend>
    <label v-for="item in items" :key="String(item.value)" class="radio">
      <input
        type="radio"
        :name="groupName"
        :value="item.value"
        :checked="model === item.value"
        :disabled="item.disabled"
        @change="model = item.value"
      />
      <span class="box" aria-hidden="true"></span>
      <span>{{ item.label }}</span>
    </label>
  </fieldset>
</template>
