<!-- BEGIN MUE:META
  COMPONENT: Tabs
  ID: vue-nav-tabs
  GROUP: Frameworks / Vue 3
  CATEGORY: navigation
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel number)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#tabs only — this SFC ships no CSS of its own
  SHEET: styles/components.css#tabs — tabs, tab-list[role=tablist], tab[aria-selected] + ink bar, tab-panel
  VARIANTS: items = [{label, content?}] or strings; active index via v-model; panel content via #panel-<index> slots
  A11Y: role tablist/tab/tabpanel with aria-controls / aria-labelledby / aria-selected; inactive panels carry the hidden attribute
  KEYBOARD: roving tabindex (only the active tab is in the tab order); ArrowLeft/ArrowRight move focus and activate, wrapping
            (ported from styles/mue.js initTabs); Enter/Space activate natively
  PORTED FROM: components/navigation/tabs.html + styles/mue.js#tabs
  VERIFIED: compiles in build.mjs; arrow-key roving exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, useId } from "vue";

const model = defineModel({ type: Number, default: 0 });

const props = defineProps({
  /** Strings or { label, content? } objects. */
  items: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: "Views" },
});

const list = ref(null);
const uid = useId();
const tabId = (i) => `mue-tab${uid}-${i}`;
const panelId = (i) => `mue-panel${uid}-${i}`;

const rows = computed(() =>
  props.items.map((t) => (typeof t === "string" ? { label: t } : t))
);

function onKeydown(e) {
  const n = rows.value.length;
  if (!n) return;
  const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (!dir) return;
  e.preventDefault();
  const next = (model.value + dir + n) % n;
  model.value = next;
  list.value?.querySelectorAll("[role=tab]")[next]?.focus();
}
</script>

<template>
  <div class="tabs">
    <div ref="list" class="tab-list" role="tablist" :aria-label="ariaLabel" @keydown="onKeydown">
      <button
        v-for="(item, i) in rows"
        :key="i"
        class="tab"
        role="tab"
        type="button"
        :id="tabId(i)"
        :aria-controls="panelId(i)"
        :aria-selected="String(model === i)"
        :tabindex="model === i ? 0 : -1"
        @click="model = i"
      >{{ item.label }}</button>
    </div>
    <div
      v-for="(item, i) in rows"
      :key="i"
      class="tab-panel"
      role="tabpanel"
      :id="panelId(i)"
      :aria-labelledby="tabId(i)"
      tabindex="0"
      :hidden="model !== i"
    >
      <slot :name="`panel-${i}`" :item="item">
        <h3>{{ item.label }}</h3>
        <p v-if="item.content">{{ item.content }}</p>
      </slot>
    </div>
  </div>
</template>
