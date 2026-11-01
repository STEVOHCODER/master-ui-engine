<!-- BEGIN MUE:META
  COMPONENT: Accordion
  ID: vue-ui-accordion
  GROUP: Frameworks / Vue 3
  CATEGORY: disclosure
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#accordion only — this SFC ships no CSS of its own
  SHEET: styles/components.css — accordion, accordion-item, accordion-trigger (plus icon rotates on aria-expanded), accordion-panel.is-open
  VARIANTS: items = [{title, content}] or strings; exclusive prop (default true, one panel open — same rule as styles/mue.js initDisclosure)
  A11Y: trigger is a real button with aria-expanded kept in sync and aria-controls -> panel id; the plus icon is aria-hidden
  KEYBOARD: Enter/Space toggle natively (buttons); no arrow roving in the vanilla source, so none is invented here
  PORTED FROM: components/marketing/sections.html (FAQ band) + styles/mue.js#disclosure
  VERIFIED: compiles in build.mjs; opened/closed in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, useId } from "vue";

const props = defineProps({
  /** Strings or { title, content } objects. */
  items: { type: Array, default: () => [] },
  exclusive: { type: Boolean, default: true },
});

const openIndexes = ref(new Set());
const uid = useId();
const triggerId = (i) => `mue-accordion-trigger${uid}-${i}`;
const panelId = (i) => `mue-accordion-panel${uid}-${i}`;

const rows = computed(() =>
  props.items.map((it) =>
    typeof it === "string" ? { title: it, content: "" } : { content: "", ...it }
  )
);

const isOpen = (i) => openIndexes.value.has(i);

function toggle(i) {
  const next = new Set(openIndexes.value);
  if (next.has(i)) {
    next.delete(i);
  } else {
    if (props.exclusive) next.clear();
    next.add(i);
  }
  openIndexes.value = next;
}
</script>

<template>
  <div class="accordion">
    <div v-for="(item, i) in rows" :key="i" class="accordion-item">
      <button
        class="accordion-trigger"
        type="button"
        :id="triggerId(i)"
        :aria-expanded="String(isOpen(i))"
        :aria-controls="panelId(i)"
        @click="toggle(i)"
      >
        {{ item.title }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"></path></svg>
      </button>
      <div
        class="accordion-panel"
        :id="panelId(i)"
        :class="{ 'is-open': isOpen(i) }"
        role="region"
        :aria-labelledby="triggerId(i)"
      >
        <div>
          <slot :name="`item-${i}`"><p>{{ item.content }}</p></slot>
        </div>
      </div>
    </div>
  </div>
</template>
