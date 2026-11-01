<!-- BEGIN MUE:META
  COMPONENT: Pagination
  ID: vue-nav-pagination
  GROUP: Frameworks / Vue 3
  CATEGORY: navigation
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel number, 1-based)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation only — this SFC ships no CSS of its own
  SHEET: styles/components.css#navigation — pagination, its button cells, the active (aria-current) and disabled states, plus the ellipsis cell
  VARIANTS: full number run when the window fits; otherwise first + a sibling window + last with .ellipsis gaps
  A11Y: <nav aria-label="Pagination"> landmark; the current page carries aria-current="true"; prev/next use the native disabled attribute so they leave the tab order; ellipsis is aria-hidden
  KEYBOARD: every cell is a real button; ArrowLeft / ArrowRight move to the previous / next page while any cell has focus (added on top of the static preview)
  PORTED FROM: components/navigation/pagination.html
  VERIFIED: compiles in build.mjs; clicking a page cell and Arrow keys exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed } from "vue";

const page = defineModel({ type: Number, default: 1 });

const props = defineProps({
  pages: { type: Number, required: true },
  /** Number of page cells kept on each side of the current page. */
  sibling: { type: Number, default: 1 },
  ariaLabel: { type: String, default: "Pagination" },
});

const cells = computed(() => {
  const total = Math.max(1, props.pages);
  const cur = Math.min(Math.max(1, page.value), total);
  const out = [];
  if (total <= 7) {
    for (let p = 1; p <= total; p++) out.push({ kind: "page", value: p });
    return out;
  }
  const window = new Set([1, total]);
  for (let d = -props.sibling; d <= props.sibling; d++) {
    const p = cur + d;
    if (p >= 1 && p <= total) window.add(p);
  }
  const sorted = [...window].sort((a, b) => a - b);
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push({ kind: "ellipsis", value: `gap-${p}` });
    out.push({ kind: "page", value: p });
    prev = p;
  }
  return out;
});

function go(p) {
  const total = Math.max(1, props.pages);
  page.value = Math.min(Math.max(1, p), total);
}

function onKeydown(e) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    go(page.value + 1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    go(page.value - 1);
  }
}
</script>

<template>
  <nav class="pagination" :aria-label="ariaLabel" @keydown="onKeydown">
    <button
      type="button"
      aria-label="Previous"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >&#8592;</button>
    <template v-for="cell in cells" :key="cell.value">
      <span v-if="cell.kind === 'ellipsis'" class="ellipsis" aria-hidden="true">&#8230;</span>
      <button
        v-else
        type="button"
        :aria-current="cell.value === page ? 'true' : undefined"
        @click="go(cell.value)"
      >{{ cell.value }}</button>
    </template>
    <button
      type="button"
      aria-label="Next"
      :disabled="page >= pages"
      @click="go(page + 1)"
    >&#8594;</button>
  </nav>
</template>
