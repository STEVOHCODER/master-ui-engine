<!-- BEGIN MUE:META
  COMPONENT: Select
  ID: vue-frm-select
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields only — this SFC ships no CSS of its own
  SHEET: styles/components.css#fields — field, field-label, field-msg, select-wrap + its chevron svg, is-error, is-success
  VARIANTS: options prop (strings or {label,value}); is-error via error prop; disabled
  A11Y: native <select> keeps OS keyboard/AT behaviour; label joined by for/id (useId fallback);
        aria-invalid="true" + aria-describedby -> field-msg when error; chevron is aria-hidden and pointer-events:none in the sheet
  KEYBOARD: native select (type-ahead, arrows) — nothing is intercepted
  PORTED FROM: components/forms/select-menus.html
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ default: null });

const props = defineProps({
  label: { type: String, required: true },
  /** Strings or { label, value } objects. */
  options: { type: Array, default: () => [] },
  id: { type: String, default: null },
  name: { type: String, default: null },
  helper: { type: String, default: null },
  error: { type: String, default: null },
  success: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const selectId = computed(() => props.id || `mue-select${uid}`);
const msgId = computed(() => `${selectId.value}-msg`);
const items = computed(() =>
  props.options.map((o) => (o && typeof o === "object" ? o : { label: String(o), value: o }))
);
</script>

<template>
  <div class="field" :class="{ 'is-error': !!error, 'is-success': !!success && !error }">
    <label class="field-label" :for="selectId">{{ label }}</label>
    <div class="select-wrap">
      <select
        :id="selectId"
        v-model="model"
        :name="name || undefined"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : success ? 'false' : undefined"
        :aria-describedby="error || success ? msgId : undefined"
      >
        <option v-for="item in items" :key="String(item.value)" :value="item.value">{{ item.label }}</option>
      </select>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </div>
    <p v-if="error || success" class="field-msg" :id="msgId">{{ error || success }}</p>
    <p v-else-if="helper" class="field-helper">{{ helper }}</p>
  </div>
</template>
