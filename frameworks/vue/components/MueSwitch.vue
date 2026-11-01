<!-- BEGIN MUE:META
  COMPONENT: Switch
  ID: vue-frm-switch
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel boolean)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice only — this SFC ships no CSS of its own
  SHEET: styles/components.css#choice — switch label, transparent full-row input, track, knob, switch-label
  VARIANTS: on/off via v-model; disabled
  A11Y: native <input type="checkbox"> wrapped in its <label>; track is aria-hidden; checked = on, announced automatically
  KEYBOARD: native checkbox — Space toggles, Tab reaches it; disabled drops out of the tab order
  PORTED FROM: components/forms/switches.html
  VERIFIED: compiles in build.mjs; rendered + Space-toggled in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ type: Boolean, default: false });

const props = defineProps({
  id: { type: String, default: null },
  name: { type: String, default: null },
  label: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const inputId = computed(() => props.id || `mue-switch${uid}`);
</script>

<template>
  <label class="switch" :for="inputId">
    <input
      :id="inputId"
      type="checkbox"
      v-model="model"
      :name="name || undefined"
      :disabled="disabled"
    />
    <span class="track" aria-hidden="true"></span>
    <span class="switch-label"><slot>{{ label }}</slot></span>
  </label>
</template>
