<!-- BEGIN MUE:META
  COMPONENT: Breadcrumbs
  ID: vue-nav-breadcrumbs
  GROUP: Frameworks / Vue 3
  CATEGORY: navigation
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation only — this SFC ships no CSS of its own
  SHEET: styles/components.css#navigation — breadcrumbs, separator, [aria-current]
  VARIANTS: default trail; the last entry renders as the current page (a span, not a link); separator glyph is a prop
  A11Y: <nav aria-label="Breadcrumb"> landmark; the current crumb carries aria-current="page"; separators are aria-hidden; each ancestor is a real <a> so link semantics survive
  KEYBOARD: native link focus; the binding emits select (and suppresses the href jump) when an ancestor crumb is activated, so a consumer can route
  PORTED FROM: components/navigation/breadcrumbs.html
  VERIFIED: compiles in build.mjs; clicking a crumb (emits select) exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  /** [{ label, href? }] — the final entry is treated as the current page. */
  items: { type: Array, required: true },
  separator: { type: String, default: "›" },
  ariaLabel: { type: String, default: "Breadcrumb" },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <nav class="breadcrumbs" :aria-label="ariaLabel">
    <template v-for="(crumb, i) in items" :key="i">
      <span v-if="i === items.length - 1" aria-current="page">{{ crumb.label }}</span>
      <template v-else>
        <a :href="crumb.href || '#'" @click.prevent="emit('select', crumb)">{{ crumb.label }}</a>
        <span class="separator" aria-hidden="true">{{ separator }}</span>
      </template>
    </template>
  </nav>
</template>
