<!-- BEGIN MUE:META
  COMPONENT: Table
  ID: vue-ui-table
  GROUP: Frameworks / Vue 3
  CATEGORY: tables
  FRAMEWORK: vue 3 (<script setup> SFC, slot-based cells)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#tables only — this SFC ships no CSS of its own
  SHEET: styles/components.css#tables — table-wrap, table, table-striped, table-compact, [data-sort] caret; cells stay plain th/td
  VARIANTS: striped, compact; columns = [{key, label, sortable?}]; per-cell markup via #cell-<key> scoped slots
  A11Y: caption or aria-label describes the table; th scope="col"; sorting publishes aria-sort and swaps data-sort asc|desc|none;
        striping is decoration — status text carries meaning
  KEYBOARD: sortable headers are tabindex="0" and sort on Enter/Space as well as click (ported from components/tables/tables.html page script)
  PORTED FROM: components/tables/tables.html
  VERIFIED: compiles in build.mjs; sort-by-click exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  /** [{ key, label, sortable? }] */
  columns: { type: Array, required: true },
  /** Row objects keyed by column.key. */
  rows: { type: Array, default: () => [] },
  caption: { type: String, default: null },
  ariaLabel: { type: String, default: null },
  striped: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(["sort"]);

const sort = ref({ key: null, dir: "none" });

function sortBy(key) {
  const dir = sort.value.key === key && sort.value.dir === "asc" ? "desc" : "asc";
  sort.value = { key, dir };
  emit("sort", { key, dir });
}

const sortedRows = computed(() => {
  const { key, dir } = sort.value;
  if (!key || (dir !== "asc" && dir !== "desc")) return props.rows;
  const cell = (row) => String(row[key] ?? "").trim();
  return [...props.rows].sort((a, b) => {
    const A = cell(a);
    const B = cell(b);
    const nA = parseFloat(A.replace(/[^0-9.-]/g, ""));
    const nB = parseFloat(B.replace(/[^0-9.-]/g, ""));
    const diff = Number.isFinite(nA) && Number.isFinite(nB) ? nA - nB : A.localeCompare(B);
    return dir === "asc" ? diff : -diff;
  });
});

function onHeaderKeydown(e, col) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    sortBy(col.key);
  }
}
</script>

<template>
  <div class="table-wrap">
    <table
      class="table"
      :class="{ 'table-striped': striped, 'table-compact': compact }"
      :aria-label="ariaLabel || undefined"
    >
      <caption v-if="caption">{{ caption }}</caption>
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            :data-sort="col.sortable ? (sort.key === col.key ? sort.dir : 'none') : undefined"
            :aria-sort="sort.key === col.key && (sort.dir === 'asc' || sort.dir === 'desc')
              ? (sort.dir === 'asc' ? 'ascending' : 'descending')
              : undefined"
            :tabindex="col.sortable ? 0 : undefined"
            :title="col.sortable ? `Sort by ${col.label}` : undefined"
            @click="col.sortable && sortBy(col.key)"
            @keydown="col.sortable && onHeaderKeydown($event, col)"
          >{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, r) in sortedRows" :key="r">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
