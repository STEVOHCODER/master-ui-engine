<!-- BEGIN MUE:META
  COMPONENT: Input
  ID: vue-frm-input
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields only — this SFC ships no CSS of its own
  SHEET: styles/components.css#fields — field, field-label, field-helper, field-msg, field.is-error, field.is-success
  VARIANTS: type = any native input type; is-error via error prop; is-success via success prop; disabled
  A11Y: label joined by for/id (useId fallback); aria-invalid="true" + aria-describedby -> field-msg when error; aria-describedby kept on success
  KEYBOARD: native input; disabled drops out of the tab order
  PORTED FROM: components/forms/input-fields.html
  VERIFIED: compiles in build.mjs; rendered + validation demo wired in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ default: "" });

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  id: { type: String, default: null },
  name: { type: String, default: null },
  placeholder: { type: String, default: null },
  autocomplete: { type: String, default: null },
  helper: { type: String, default: null },
  /** Error message; when set the field takes .is-error and aria-invalid. */
  error: { type: String, default: null },
  /** Success message; when set the field takes .is-success. */
  success: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const inputId = computed(() => props.id || `mue-input${uid}`);
const msgId = computed(() => `${inputId.value}-msg`);
</script>

<template>
  <div class="field" :class="{ 'is-error': !!error, 'is-success': !!success && !error }">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :name="name || undefined"
      :placeholder="placeholder || undefined"
      :autocomplete="autocomplete || undefined"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : success ? 'false' : undefined"
      :aria-describedby="error || success ? msgId : undefined"
    />
    <p v-if="error || success" class="field-msg" :id="msgId">{{ error || success }}</p>
    <p v-else-if="helper" class="field-helper">{{ helper }}</p>
  </div>
</template>
