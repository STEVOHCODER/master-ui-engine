<!-- BEGIN MUE:META
  COMPONENT: Notification (alert + toast)
  ID: vue-ui-notification
  GROUP: Frameworks / Vue 3
  CATEGORY: notifications
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#notifications only — this SFC ships no CSS of its own
  SHEET: styles/components.css#notifications — alert, alert-success|error|warning|info, toast, toast-success|error|warning|info|danger,
         toast.is-open / is-leaving, toast-icon, toast-body, toast-title, toast-msg, toast-close, toast-region, toast-stack
  VARIANTS: mode = alert (static, inline) | toast (animated, dismisses); variant = success|error|warning|info (toast also supports danger)
  A11Y: role="alert" so the text is announced; icon is decorative (aria-hidden) with a text title beside it;
        the dismiss control is a real button with aria-label; a toast never steals focus
  KEYBOARD: only the dismiss button is focusable; Enter/Space dismiss natively
  BEHAVIOUR: on mount a toast gets .is-open (sheet animates it in); after duration ms (0 disables the timer) or a dismiss
        click it gets .is-leaving and emits "dismiss" after the exit transition — 420ms, the exact timing styles/mue.js uses
  PORTED FROM: components/notifications/notifications.html + styles/mue.js#toasts
  VERIFIED: compiles in build.mjs; spawned + auto-dismissed in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  mode: { type: String, default: "alert" }, // "alert" | "toast"
  variant: { type: String, default: "info" }, // success | error | warning | info (+ danger for toasts)
  title: { type: String, required: true },
  msg: { type: String, default: null },
  /** Toast only: auto-dismiss after this many ms; 0 keeps it until dismissed. */
  duration: { type: Number, default: 4000 },
  /** Toast only: render the close button. */
  dismissible: { type: Boolean, default: true },
});

const emit = defineEmits(["dismiss"]);

const el = ref(null);
const leaving = ref(false);
let openTimer = null;
let leaveTimer = null;

const glyphs = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "i",
  danger: "✗",
};
const glyph = computed(() => glyphs[props.variant] || "i");

const toastClasses = computed(() => [
  "toast",
  `toast-${props.variant}`,
  leaving.value ? "is-leaving" : null,
]);

function leave() {
  if (leaving.value) return;
  leaving.value = true;
  // Same rule as styles/mue.js: wait one frame past the sheet's exit transition,
  // instantly when the visitor asked to reduce motion.
  const reduce =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  leaveTimer = setTimeout(() => emit("dismiss"), reduce ? 0 : 420);
}

onMounted(() => {
  if (props.mode !== "toast") return;
  // Mirror mue.js: the node enters with .is-open one tick after it exists.
  openTimer = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.value?.classList.add("is-open");
      openTimer = null;
    });
  });
  if (props.duration > 0) {
    leaveTimer = setTimeout(leave, props.duration);
  }
});

onBeforeUnmount(() => {
  if (openTimer) cancelAnimationFrame(openTimer);
  if (leaveTimer) clearTimeout(leaveTimer);
});
</script>

<template>
  <div
    v-if="mode === 'toast'"
    ref="el"
    :class="toastClasses"
    role="alert"
  >
    <span class="toast-icon" aria-hidden="true">{{ glyph }}</span>
    <div class="toast-body">
      <span class="toast-title">{{ title }}</span>
      <span class="toast-msg"><slot>{{ msg }}</slot></span>
    </div>
    <button v-if="dismissible" class="toast-close" type="button" aria-label="Dismiss" @click="leave">
      &times;
    </button>
  </div>
  <div v-else class="alert" :class="`alert-${variant}`" role="alert">
    <span class="toast-icon" aria-hidden="true">{{ glyph }}</span>
    <div class="toast-body">
      <span class="toast-title">{{ title }}</span>
      <span class="toast-msg"><slot>{{ msg }}</slot></span>
    </div>
  </div>
</template>
