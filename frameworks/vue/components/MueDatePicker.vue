<!-- BEGIN MUE:META
  COMPONENT: Date Picker
  ID: vue-frm-date-picker
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel string)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields only — this SFC ships no CSS of its own
  SHEET: styles/components.css#fields — field, field-label, field-helper, field-msg, field.is-error, field.is-success
  VARIANTS: default, constrained (min/max), required (with an error message); disabled
  A11Y: label joined by for/id (useId fallback); aria-required mirrors the required prop; aria-invalid="true" +
        aria-describedby -> field-msg when error, kept on success; the native picker carries its own accessible segments
  KEYBOARD: native <input type="date"> — digits and arrows edit one segment at a time and the platform calendar popover
            is keyboard/touch operable. The vanilla preview implements no custom calendar, so no Escape/arrow-day path is added here.
  PORTED FROM: components/forms/date-picker/date-picker.html
  VERIFIED: compiles in build.mjs; typing a value into the field updates the v-model in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ type: String, default: "" });

const props = defineProps({
  label: { type: String, required: true },
  id: { type: String, default: null },
  name: { type: String, default: null },
  /** Earliest selectable day, e.g. "2026-01-01" — enforced by the platform picker. */
  min: { type: String, default: null },
  /** Latest selectable day, e.g. "2026-12-31" — enforced by the platform picker. */
  max: { type: String, default: null },
  required: { type: Boolean, default: false },
  helper: { type: String, default: null },
  /** Error message; when set the field takes .is-error and aria-invalid. */
  error: { type: String, default: null },
  /** Success message; when set the field takes .is-success. */
  success: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const inputId = computed(() => props.id || `mue-date${uid}`);
const msgId = computed(() => `${inputId.value}-msg`);
</script>

<template>
  <div class="field" :class="{ 'is-error': !!error, 'is-success': !!success && !error }">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      v-model="model"
      type="date"
      :name="name || undefined"
      :min="min || undefined"
      :max="max || undefined"
      :required="required"
      :aria-required="required ? 'true' : undefined"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : success ? 'false' : undefined"
      :aria-describedby="error || success ? msgId : undefined"
    />
    <p v-if="error || success" class="field-msg" :id="msgId">{{ error || success }}</p>
    <p v-else-if="helper" class="field-helper">{{ helper }}</p>
  </div>
</template>
