<!-- BEGIN MUE:META
  COMPONENT: Textarea
  ID: vue-frm-textarea
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields only — this SFC ships no CSS of its own
  SHEET: styles/components.css#fields — field, field-label, field-helper, field-msg; the sheet styles .field textarea
  VARIANTS: rows prop; is-error via error prop; is-success via success prop; disabled
  A11Y: label joined by for/id (useId fallback); aria-invalid="true" + aria-describedby -> field-msg when error
  KEYBOARD: native textarea
  PORTED FROM: components/forms/input-fields.html (Bio example)
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, useId } from "vue";

const model = defineModel({ default: "" });

const props = defineProps({
  label: { type: String, required: true },
  id: { type: String, default: null },
  name: { type: String, default: null },
  rows: { type: [String, Number], default: 3 },
  placeholder: { type: String, default: null },
  helper: { type: String, default: null },
  error: { type: String, default: null },
  success: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const uid = useId();
const inputId = computed(() => props.id || `mue-textarea${uid}`);
const msgId = computed(() => `${inputId.value}-msg`);
</script>

<template>
  <div class="field" :class="{ 'is-error': !!error, 'is-success': !!success && !error }">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <textarea
      :id="inputId"
      v-model="model"
      :name="name || undefined"
      :rows="rows"
      :placeholder="placeholder || undefined"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : success ? 'false' : undefined"
      :aria-describedby="error || success ? msgId : undefined"
    ></textarea>
    <p v-if="error || success" class="field-msg" :id="msgId">{{ error || success }}</p>
    <p v-else-if="helper" class="field-helper">{{ helper }}</p>
  </div>
</template>
