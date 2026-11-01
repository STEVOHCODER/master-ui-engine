<!-- BEGIN MUE:META
  COMPONENT: Popover
  ID: vue-ui-popover
  GROUP: Frameworks / Vue 3
  CATEGORY: dialogs
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#popover only — this SFC ships no CSS of its own
  SHEET: styles/components.css#popover — popover-wrap, popover-wrap.is-open, popover-trigger, popover, popover-below,
         popover-start, popover-end, popover-title, popover-body, popover-list
  VARIANTS: placement via props.placement = space-separated start|end|below; content is text or an optional checklist (items)
  A11Y: the trigger is a real <button> that points at the surface with aria-describedby (the note is announced with the control);
        the surface is role="note"; a closed surface is visibility:hidden by the sheet, so its links leave the tab order
  KEYBOARD: hover/Tab-open is pure CSS (:hover, :focus-within). This binding adds the tap/pin path the sheet exposes via .is-open:
            Enter/Space on the trigger toggles it, Escape closes and returns focus to the trigger, and an outside click dismisses
  PORTED FROM: components/dialogs/popover.html
  VERIFIED: compiles in build.mjs; click-to-pin, Escape and outside-click exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, ref, watch, onBeforeUnmount, useId } from "vue";

const props = defineProps({
  title: { type: String, default: null },
  /** Body text; use the default slot instead for richer content. */
  text: { type: String, default: null },
  /** Optional checklist rendered as .popover-list items. */
  items: { type: Array, default: () => [] },
  /** Space-separated modifiers: "start", "end", "below". */
  placement: { type: String, default: "start" },
  /** Start pinned open (e.g. the static screenshot sample). */
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["update:open"]);

const uid = useId();
const surfaceId = computed(() => `mue-pop${uid}`);
const root = ref(null);
const trigger = ref(null);
const pinned = ref(props.open);
watch(
  () => props.open,
  (v) => (pinned.value = v)
);
watch(pinned, (v) => emit("update:open", v));

const placementClasses = computed(() =>
  props.placement ? props.placement.split(/\s+/).filter(Boolean).map((p) => `popover-${p}`) : []
);

function toggle() {
  pinned.value = !pinned.value;
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) pinned.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape" && pinned.value) {
    pinned.value = false;
    trigger.value?.focus();
  }
}

watch(pinned, (v) => {
  if (v) document.addEventListener("click", onDocClick);
  else document.removeEventListener("click", onDocClick);
});

onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <span ref="root" class="popover-wrap" :class="{ 'is-open': pinned }" @keydown="onKeydown">
    <button
      ref="trigger"
      class="popover-trigger"
      type="button"
      :aria-describedby="surfaceId"
      @click="toggle"
    >
      <slot name="trigger">{{ title || "Details" }}</slot>
    </button>
    <span class="popover" :class="placementClasses" :id="surfaceId" role="note">
      <span v-if="title" class="popover-title">{{ title }}</span>
      <span class="popover-body"><slot>{{ text }}</slot></span>
      <ul v-if="items.length" class="popover-list">
        <li v-for="(item, i) in items" :key="i">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m5 13 4 4 10-10" /></svg>
          <span>{{ item }}</span>
        </li>
      </ul>
    </span>
  </span>
</template>
