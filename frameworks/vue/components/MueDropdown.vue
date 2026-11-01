<!-- BEGIN MUE:META
  COMPONENT: Dropdown
  ID: vue-ui-dropdown
  GROUP: Frameworks / Vue 3
  CATEGORY: dropdowns
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#dropdown (+ #buttons for the trigger) — this SFC ships no CSS of its own
  SHEET: styles/components.css#dropdown — dropdown.is-open, dropdown-menu, menu-item, menu-item.danger, menu-divider
  VARIANTS: items = [{label, danger?, divider?}] or strings; trigger row is a btn-outline (variant via prop)
  A11Y: aria-haspopup="true" on the trigger; aria-expanded kept in sync; menu aria-hidden mirrored;
        rows are real buttons so focus + 44px row + tint arrive together; icons stay aria-hidden (put them in the label slot)
  KEYBOARD: Enter/Space opens (native button); opening focuses the first row; ArrowUp/Down walk rows and wrap;
            Escape closes and returns focus to the trigger; a click outside closes (ported from styles/mue.js initDropdowns)
  PORTED FROM: components/dropdowns/dropdowns.html + styles/mue.js#dropdowns
  VERIFIED: compiles in build.mjs; arrows + Escape exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";

const props = defineProps({
  /** Strings or { label, value?, danger?, divider? } objects. */
  items: { type: Array, default: () => [] },
  label: { type: String, default: "Actions" },
  /** Trigger button variant (btn-* class), default outline like the preview. */
  variant: { type: String, default: "outline" },
});

const emit = defineEmits(["select"]);

const root = ref(null);
const trigger = ref(null);
const menu = ref(null);
const open = ref(false);

const rows = computed(() =>
  props.items.map((i) => (typeof i === "string" ? { label: i } : i))
);

function setOpen(v) {
  open.value = v;
}

function onTriggerClick(e) {
  e.stopPropagation();
  setOpen(!open.value);
}

function onDocClick() {
  setOpen(false);
}

function itemEls() {
  return menu.value ? Array.from(menu.value.querySelectorAll(".menu-item")) : [];
}

function pick(i) {
  const item = rows.value[i];
  emit("select", item.value !== undefined ? item.value : item.label);
  setOpen(false);
  trigger.value?.focus();
}

function onMenuKeydown(e) {
  const els = itemEls();
  if (!els.length) return;
  const i = els.indexOf(document.activeElement);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const next = (i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length;
    els[next].focus();
  } else if (e.key === "Escape") {
    setOpen(false);
    trigger.value?.focus();
  }
}

watch(open, (v) => {
  if (v) {
    nextTick(() => itemEls()[0]?.focus());
    document.addEventListener("click", onDocClick);
  } else {
    document.removeEventListener("click", onDocClick);
  }
});

onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <div ref="root" class="dropdown" :class="{ 'is-open': open }">
    <button
      ref="trigger"
      class="btn"
      :class="variant ? `btn-${variant}` : null"
      type="button"
      aria-haspopup="true"
      :aria-expanded="String(open)"
      @click="onTriggerClick"
    >
      <slot name="trigger">{{ label }}</slot>
      <svg width="1rem" height="1rem" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    </button>
    <ul ref="menu" class="dropdown-menu" :aria-hidden="String(!open)" @keydown="onMenuKeydown">
      <li v-for="(item, i) in rows" :key="i">
        <div v-if="item.divider" class="menu-divider"></div>
        <button v-else class="menu-item" :class="{ danger: item.danger }" type="button" @click="pick(i)">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
