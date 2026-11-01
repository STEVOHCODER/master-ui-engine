<!-- BEGIN MUE:META
  COMPONENT: File Upload (dropzone)
  ID: vue-frm-dropzone
  GROUP: Frameworks / Vue 3
  CATEGORY: forms
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel file array)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#dropzone (+ #fields, #buttons, #badges, #utilities) — this SFC ships no CSS of its own
  SHEET: styles/components.css#dropzone — field, sr-only, dropzone, dropzone.is-dragging, dropzone-input, dropzone-icon,
        dropzone-title, dropzone-link, dropzone-hint, dropzone-list, file-row, file-icon, file-name, file-size, file-remove, spread, badge
  VARIANTS: multiple (with a populated list) or single (accept="image/*"); the drag-over state .is-dragging is toggled by this component
  A11Y: the control is a real <input type="file"> stretched across the target; it is labelled by a .sr-only <label>, not by the
        decoration inside the box; :focus-within rings the whole target; each remove button carries a .sr-only name that includes the file it removes
  KEYBOARD: Tab reaches the input (Enter opens the OS picker) and each remove button (Enter/Space removes that row)
  PORTED FROM: components/forms/file-upload.html
  VERIFIED: compiles in build.mjs; a synthetic drop + a remove-button click change the file list in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, ref, useId } from "vue";

/** Model value: [{ name, size }] where size is a display string. */
const files = defineModel({ type: Array, default: () => [] });

const props = defineProps({
  label: { type: String, required: true },
  title: { type: String, default: null },
  hint: { type: String, default: null },
  accept: { type: String, default: null },
  multiple: { type: Boolean, default: false },
  /** Cap on how many files may be queued; 0 means no limit. */
  maxFiles: { type: Number, default: 0 },
});

const emit = defineEmits(["add", "remove"]);

const uid = useId();
const inputId = computed(() => `mue-drop${uid}`);
const input = ref(null);
const dragging = ref(false);

function humanSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function addFiles(list) {
  const incoming = Array.from(list).map((f) => ({ name: f.name, size: humanSize(f.size) }));
  if (!incoming.length) return;
  const next = [...files.value, ...incoming];
  files.value = props.maxFiles > 0 ? next.slice(0, props.maxFiles) : next;
  emit("add", incoming);
}

function onDrop(e) {
  e.preventDefault();
  dragging.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
}

function onChange() {
  if (input.value?.files) addFiles(input.value.files);
  input.value.value = "";
}

function remove(i) {
  const next = files.value.slice();
  const [gone] = next.splice(i, 1);
  files.value = next;
  emit("remove", gone);
}
</script>

<template>
  <div class="field">
    <label class="sr-only" :for="inputId">{{ label }}</label>
    <div
      class="dropzone"
      :class="{ 'is-dragging': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop="onDrop"
    >
      <input
        ref="input"
        class="dropzone-input"
        type="file"
        :id="inputId"
        :accept="accept || undefined"
        :multiple="multiple"
        @change="onChange"
      />
      <span class="dropzone-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
      </span>
      <span class="dropzone-title">{{ title || label }}<template v-if="multiple"> or <span class="dropzone-link">browse files</span></template></span>
      <span class="dropzone-hint">{{ hint }}</span>
    </div>
    <ul v-if="files.length" class="dropzone-list">
      <li v-for="(f, i) in files" :key="`${f.name}-${i}`" class="file-row">
        <span class="file-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M14 3v5h5" /><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /></svg>
        </span>
        <span class="file-name">{{ f.name }}</span>
        <span class="file-size">{{ f.size }}</span>
        <button class="file-remove" type="button" @click="remove(i)">
          <span class="sr-only">Remove {{ f.name }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </li>
    </ul>
    <div v-if="$slots.footer && files.length" class="spread">
      <slot name="footer" :count="files.length" />
    </div>
  </div>
</template>
