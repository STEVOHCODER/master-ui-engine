<!-- BEGIN MUE:META
  COMPONENT: Data Table
  ID: vue-ui-datatable
  GROUP: Frameworks / Vue 3
  CATEGORY: tables
  FRAMEWORK: vue 3 (<script setup> SFC, scoped cell/detail slots)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#datatable (+ #tables, #dropdown, #descriptions, #feedback, #badges, #choice, #buttons, #fields, #navigation, #display, #utilities) — this SFC ships no CSS of its own
  SHEET: styles/components.css#datatable — table-toolbar, table-search, table-selection(-count), table-wrap, table-scroll.is-scrolled, table.datatable(.table-compact), cell-toggle, cell-check, sort-btn, th-filter.is-filtered, dropdown/menu-filter*, col-num, table-detail(-inner), table-empty, empty, table-foot(-count), select-wrap, pagination; #choice — checkbox/box; #fields — field/switch/track/input; #navigation — pagination; #descriptions — descriptions
  VARIANTS: selectable + expandable + filterable + sortable columns, compact density, loading (skeleton rows) and empty states
  A11Y: caption/aria-label; th scope="col" publishing aria-sort (and the sort-btn carrying data-sort); the header checkbox is indeterminate when a page is partly picked; each row checkbox is named by its own row (Select <first column>, or <selectKey>), matching the vanilla preview; the filter is a labelled group with Apply/Clear; the expand caret and Details button share aria-controls/aria-expanded; search has an sr-only label
  PROPS: columns, rows, caption, ariaLabel, selectable, expandable, loading, emptyTitle, emptyDesc, pageSizes, selectKey
  KEYBOARD: sort buttons cycle on Enter/Space (native); the filter closes on Escape/outside click and keeps focus in the menu; the table header picks up its rule on scroll; rows are native checkboxes/buttons
  PORTED FROM: components/tables/data-table.html (page script ported into component state)
  VERIFIED: compiles in build.mjs; select/sort/filter/expand/search/paginate/density/refresh exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, watch, onBeforeUnmount, useId } from "vue";

const props = defineProps({
  /** [{ key, label, sortable?, numeric?, filterOptions? }] */
  columns: { type: Array, required: true },
  /** row objects; each may carry `id`, `search` (haystack) and `detail` [{label, value}]. */
  rows: { type: Array, default: () => [] },
  caption: { type: String, default: null },
  ariaLabel: { type: String, default: null },
  selectable: { type: Boolean, default: false },
  expandable: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  emptyTitle: { type: String, default: "No results" },
  emptyDesc: { type: String, default: "Try widening your search or clearing the filters." },
  pageSizes: { type: Array, default: () => [5, 10, 20] },
  /** column key read aloud as a row's name; defaults to the first column. */
  selectKey: { type: String, default: "" },
});

const uid = useId();
const searchId = computed(() => `mue-dt-q${uid}`);
const filterId = computed(() => `mue-dt-filter${uid}`);

const q = ref("");
const statuses = ref([]);
const sort = ref({ key: null, dir: "none" });
const page = ref(1);
const size = ref(props.pageSizes[0]);
const compact = ref(false);
const expanded = ref(new Set());
const selected = ref(new Set());

const keyOf = (row, i) => row.id ?? i;

/* A row checkbox has no text of its own, and every one of them named "Select"
   tells a screen reader nothing, so the name carries the row's identity. */
const rowName = (row, i) => {
  const key = props.selectKey || props.columns[0]?.key;
  const value = key ? row[key] : undefined;
  return value === undefined || value === null || value === "" ? `row ${i + 1}` : String(value);
};

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase();
  return props.rows.filter((row) => {
    const hay = (row.search ?? JSON.stringify(row)).toString().toLowerCase();
    const okQ = !needle || hay.indexOf(needle) > -1;
    const okS = !statuses.value.length || statuses.value.includes(row.status);
    return okQ && okS;
  });
});

const sorted = computed(() => {
  const { key, dir } = sort.value;
  if (!key || (dir !== "asc" && dir !== "desc")) return filtered.value;
  const sign = dir === "asc" ? 1 : -1;
  return [...filtered.value].sort((a, b) => {
    const A = a[key];
    const B = b[key];
    const col = props.columns.find((c) => c.key === key);
    if (col?.numeric) return (parseFloat(A) - parseFloat(B)) * sign;
    return String(A).localeCompare(String(B)) * sign;
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / size.value)));
const pageRows = computed(() => {
  const start = (page.value - 1) * size.value;
  return sorted.value.slice(start, start + size.value);
});
watch([q, statuses, sort, size], () => {
  page.value = 1;
});
watch(pageCount, (n) => {
  if (page.value > n) page.value = n;
});

const footCount = computed(() => {
  const total = sorted.value.length;
  if (!total) return `Showing 0 of ${props.rows.length}`;
  const start = (page.value - 1) * size.value;
  return `Showing ${start + 1}-${start + pageRows.value.length} of ${total}`;
});

/* selection */
function toggleSelect(row, i) {
  const k = keyOf(row, i);
  const next = new Set(selected.value);
  if (next.has(k)) next.delete(k);
  else next.add(k);
  selected.value = next;
}
const pageKeys = computed(() => pageRows.value.map(keyOf));
const allChecked = computed(
  () => pageKeys.value.length > 0 && pageKeys.value.every((k) => selected.value.has(k))
);
const allIndeterminate = computed(() => {
  const ticked = pageKeys.value.filter((k) => selected.value.has(k)).length;
  return ticked > 0 && ticked < pageKeys.value.length;
});
const allRef = ref(null);
watch([allIndeterminate], () => {
  if (allRef.value) allRef.value.indeterminate = allIndeterminate.value;
});
function toggleAll() {
  const next = new Set(selected.value);
  const keys = pageKeys.value;
  if (allChecked.value) keys.forEach((k) => next.delete(k));
  else keys.forEach((k) => next.add(k));
  selected.value = next;
}
function clearSelection() {
  selected.value = new Set();
}
watch([pageRows, () => props.rows.length], () => {
  if (allRef.value) allRef.value.indeterminate = allIndeterminate.value;
});

/* sort */
function sortBy(col) {
  if (!col.sortable) return;
  const dir =
    sort.value.key === col.key && sort.value.dir === "asc"
      ? "desc"
      : sort.value.key === col.key && sort.value.dir === "desc"
        ? "none"
        : "asc";
  sort.value = { key: col.key, dir };
}
function ariaSort(col) {
  if (sort.value.key !== col.key) return "none";
  return sort.value.dir === "asc" ? "ascending" : sort.value.dir === "desc" ? "descending" : "none";
}

/* expand */
function toggleExpand(i) {
  const k = keyOf(pageRows.value[i], sorted.value.indexOf(pageRows.value[i]));
  const next = new Set(expanded.value);
  if (next.has(k)) next.delete(k);
  else next.add(k);
  expanded.value = next;
}
const isExpanded = (row) => expanded.value.has(keyOf(row, props.rows.indexOf(row)));

/* filter dropdown */
const filterOpen = ref(false);
/* A template ref bound inside a v-for resolves to an array, not the element, so
   the one filter cell keeps its nodes in plain closures instead. */
let filterBtn = null;
let filterMenu = null;
const pending = ref(new Set());
function setFilter(open) {
  filterOpen.value = open;
  if (open) {
    pending.value = new Set(statuses.value);
    nextTickFocus();
  }
}
function nextTickFocus() {
  queueMicrotask(() => filterMenu?.querySelector("input")?.focus());
}
function toggleFilter(e) {
  e.stopPropagation();
  setFilter(!filterOpen.value);
}
function toggleOption(val) {
  const next = new Set(pending.value);
  if (next.has(val)) next.delete(val);
  else next.add(val);
  pending.value = next;
}
function applyFilter() {
  statuses.value = [...pending.value];
  setFilter(false);
  filterBtn?.focus();
}
function clearFilter() {
  pending.value = new Set();
  statuses.value = [];
}
function onFilterKeydown(e) {
  if (e.key === "Escape") {
    setFilter(false);
    filterBtn?.focus();
  }
}
function onDocClick(e) {
  if (filterOpen.value && filterMenu && !filterMenu.contains(e.target) && !filterBtn?.contains(e.target)) {
    setFilter(false);
  }
}
document.addEventListener("click", onDocClick);
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

/* sticky head rule */
const scrolled = ref(false);
let ticking = false;
function onWrapScroll(e) {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    scrolled.value = e.target.scrollTop > 2;
    ticking = false;
  });
}

const filterColumn = computed(() => props.columns.find((c) => c.filterOptions));
const cellColspan = computed(
  () => props.columns.length + (props.selectable ? 1 : 0) + (props.expandable ? 1 : 0)
);
</script>

<template>
  <div>
    <div class="table-toolbar">
      <div class="field table-search">
        <label class="sr-only" :for="searchId">Search rows</label>
        <input :id="searchId" v-model="q" class="input" type="search" placeholder="Search" autocomplete="off" />
      </div>
      <div class="row">
        <label class="switch">
          <input type="checkbox" v-model="compact" />
          <span class="track"></span>
          <span class="switch-label">Compact</span>
        </label>
      </div>
    </div>

    <div class="table-selection" :hidden="!selected.size">
      <span class="table-selection-count" aria-live="polite">{{ selected.size }} selected</span>
      <button class="btn-ghost btn-sm" type="button" @click="clearSelection">Clear</button>
    </div>

    <div class="table-wrap table-scroll" :class="{ 'is-scrolled': scrolled }" @scroll="onWrapScroll">
      <table class="table datatable" :class="{ 'table-compact': compact }" :aria-label="ariaLabel || undefined">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="expandable" scope="col" class="cell-toggle"><span class="sr-only">Expand row</span></th>
            <th v-if="selectable" scope="col" class="cell-check">
              <label class="checkbox">
                <input ref="allRef" type="checkbox" :checked="allChecked" @change="toggleAll" />
                <span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
                <span class="sr-only">Select all on this page</span>
              </label>
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :class="{ 'col-num': col.numeric, 'cell-filter': col.filterOptions }"
              :aria-sort="col.sortable ? ariaSort(col) : undefined"
            >
              <button
                v-if="col.sortable"
                class="sort-btn"
                type="button"
                tabindex="0"
                :data-sort="sort.key === col.key ? sort.dir : 'none'"
                @click="sortBy(col)"
                @keydown="(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), sortBy(col))"
              >{{ col.label }}</button>
              <div v-else-if="col.filterOptions" class="dropdown" :class="{ 'is-open': filterOpen }">
                <button
                  :ref="(el) => (filterBtn = el)"
                  class="th-filter"
                  type="button"
                  :aria-expanded="String(filterOpen)"
                  :aria-controls="filterId"
                  :class="{ 'is-filtered': statuses.length > 0 }"
                  @click="toggleFilter"
                >
                  {{ col.label }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h18l-7 8v5l-4 2v-7L3 5z" /></svg>
                </button>
                <div
                  :ref="(el) => (filterMenu = el)"
                  class="dropdown-menu menu-filter"
                  :id="filterId"
                  role="group"
                  :aria-label="`Filter by ${col.label}`"
                  @keydown="onFilterKeydown"
                >
                  <p class="menu-filter-head">{{ col.label }}</p>
                  <label v-for="opt in col.filterOptions" :key="opt" class="checkbox menu-filter-option">
                    <input type="checkbox" :value="opt" :checked="pending.has(opt)" @change="toggleOption(opt)" />
                    <span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
                    {{ opt }}
                  </label>
                  <div class="menu-divider" role="separator"></div>
                  <div class="menu-filter-foot">
                    <button class="btn-ghost btn-sm" type="button" @click="clearFilter">Clear</button>
                    <button class="btn-primary btn-sm" type="button" @click="applyFilter">Apply</button>
                  </div>
                </div>
              </div>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>

        <tbody v-if="!loading && pageRows.length">
          <template v-for="(row, i) in pageRows" :key="keyOf(row, sorted.indexOf(row))">
            <tr :class="{ 'is-selected': selected.has(keyOf(row, sorted.indexOf(row))) }">
              <td v-if="expandable" class="cell-toggle">
                <button
                  class="row-toggle"
                  type="button"
                  :aria-expanded="String(isExpanded(row))"
                  :aria-label="(isExpanded(row) ? 'Hide' : 'Show') + ' details'"
                  @click="toggleExpand(i)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6l6 6-6 6" /></svg>
                </button>
              </td>
              <td v-if="selectable" class="cell-check">
                <label class="checkbox">
                  <input type="checkbox" :aria-label="`Select ${rowName(row, i)}`" :checked="selected.has(keyOf(row, sorted.indexOf(row)))" @change="toggleSelect(row, sorted.indexOf(row))" />
                  <span class="box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg></span>
                </label>
              </td>
              <td v-for="col in columns" :key="col.key" :class="{ 'col-num': col.numeric, 'mono': col.mono }">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
              </td>
            </tr>
            <tr v-if="expandable" :hidden="!isExpanded(row)">
              <td class="table-detail" :colspan="cellColspan">
                <div class="table-detail-inner">
                  <slot name="detail" :row="row">
                    <dl v-if="row.detail" class="descriptions" data-cols="3">
                      <div v-for="(d, di) in row.detail" :key="di" class="descriptions-item">
                        <dt class="descriptions-label">{{ d.label }}</dt>
                        <dd class="descriptions-value">{{ d.value }}</dd>
                      </div>
                    </dl>
                  </slot>
                </div>
              </td>
            </tr>
          </template>
        </tbody>

        <tbody v-else-if="loading">
          <tr v-for="n in size" :key="'ld' + n">
            <td v-if="expandable" class="cell-toggle"><span class="skeleton sk-cell" style="--sk-w: 1.75rem"></span></td>
            <td v-if="selectable" class="cell-check"><span class="skeleton sk-cell" style="--sk-w: 1.25rem"></span></td>
            <td v-for="col in columns" :key="col.key" :class="{ 'col-num': col.numeric }"><span class="skeleton sk-cell" style="--sk-w: 8rem"></span></td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td class="table-empty" :colspan="cellColspan">
              <div class="empty">
                <span class="empty-icon" aria-hidden="true">
                  <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7" stroke-linecap="round" stroke-width="2" /><path stroke-linecap="round" stroke-width="2" d="M20 20l-3.5-3.5" /></svg>
                </span>
                <p class="empty-title">{{ emptyTitle }}</p>
                <p class="empty-desc">{{ emptyDesc }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-foot">
      <div class="row">
        <span class="table-foot-count">{{ footCount }}</span>
        <label class="sr-only" :for="`${filterId}-size`">Rows per page</label>
        <div class="select-wrap">
          <select class="input" :id="`${filterId}-size`" v-model.number="size">
            <option v-for="s in pageSizes" :key="s" :value="s">{{ s }} / page</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      <nav class="pagination" aria-label="Pages">
        <button type="button" aria-label="Previous page" :disabled="page <= 1" @click="page -= 1">&#8592;</button>
        <button
          v-for="p in pageCount"
          :key="p"
          type="button"
          :aria-current="p === page ? 'true' : undefined"
          @click="page = p"
        >{{ p }}</button>
        <button type="button" aria-label="Next page" :disabled="page >= pageCount" @click="page += 1">&#8594;</button>
      </nav>
    </div>
  </div>
</template>
