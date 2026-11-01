<!-- BEGIN MUE:META
  COMPONENT: Modal
  ID: vue-ui-modal
  GROUP: Frameworks / Vue 3
  CATEGORY: modals
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel boolean, Teleport)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#overlays (overlay/modal/header/title/body/footer/close) + #buttons, #fields — this SFC ships no CSS of its own
  SHEET: styles/components.css#overlays — overlay.is-open, modal, modal-header, modal-title, modal-body, modal-footer, modal-close
  VARIANTS: one panel; width belongs to the sheet's --modal-w default (the preview passes 35rem via the modalWidth prop, a value not a class)
  A11Y: role="dialog", aria-modal="true", aria-labelledby -> modal-title; a closed overlay is visibility:hidden by the sheet so its inputs leave the tab order; scrim click dismisses; close button has aria-label
  KEYBOARD: Escape closes; Tab cycles the panel wrapping at both ends; focus lands on the first control when opened and returns to the previously focused element when closed (ported from styles/mue.js initDialogs)
  PORTED FROM: components/modals/modals.html + styles/mue.js#dialogs
  VERIFIED: compiles in build.mjs; Escape + focus return + Create button exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, watch, nextTick, useId } from "vue";

const open = defineModel({ type: Boolean, default: false });

const props = defineProps({
  title: { type: String, required: true },
  /** Panel width value handed to the sheet's --modal-w; a value, not a class. */
  modalWidth: { type: String, default: null },
});

const panel = ref(null);
const uid = useId();
const titleId = computed(() => `mue-modal-title${uid}`);

const FOCUSABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

let lastFocus = null;

function focusables() {
  if (!panel.value) return [];
  return Array.from(panel.value.querySelectorAll(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null
  );
}

function onKeydown(e) {
  if (e.key === "Escape") {
    open.value = false;
    return;
  }
  if (e.key !== "Tab") return;
  const f = focusables();
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

watch(open, (v) => {
  if (v) {
    lastFocus = document.activeElement;
    document.documentElement.classList.add("mue-locked");
    nextTick(() => {
      const f = focusables();
      (f[0] || panel.value)?.focus();
    });
  } else {
    document.documentElement.classList.remove("mue-locked");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <div class="overlay" :class="{ 'is-open': open }" @click.self="open = false">
      <div
        ref="panel"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :style="modalWidth ? { '--modal-w': modalWidth } : undefined"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <div class="modal-header">
          <span class="modal-title" :id="titleId">{{ title }}</span>
          <button class="modal-close" type="button" aria-label="Close dialog" @click="open = false">
            &times;
          </button>
        </div>
        <div class="modal-body"><slot /></div>
        <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
