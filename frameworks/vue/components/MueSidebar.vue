<!-- BEGIN MUE:META
  COMPONENT: Sidebar
  ID: vue-nav-sidebar
  GROUP: Frameworks / Vue 3
  CATEGORY: sidebars
  FRAMEWORK: vue 3 (<script setup> SFC, defineModel string)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#sidebar only — this SFC ships no CSS of its own
  SHEET: styles/components.css#sidebar — sidebar, sidebar-brand, sidebar-section, sidebar-heading, sidebar-link, sidebar-label
  VARIANTS: brand line + data-driven sections, each link carries an optional emoji icon and an active state; below 900px the sheet stacks it full width
  A11Y: <aside aria-label> landmark; icons are aria-hidden and the label is real text in sidebar-label; the active link gets aria-current="page" so colour + tint + semantics agree
  KEYBOARD: native link focus; clicking a link moves the active state (v-model) and emits select — the vanilla preview only hardcodes one active row
  PORTED FROM: components/sidebars/sidebar.html
  VERIFIED: compiles in build.mjs; clicking a link to move the active row exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const active = defineModel({ type: String, default: "" });

const props = defineProps({
  brand: { type: String, default: null },
  /** [{ heading, links: [{ label, icon?, href? }] }] */
  sections: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: "Main navigation" },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <aside class="sidebar" :aria-label="ariaLabel">
    <div v-if="brand" class="sidebar-brand">{{ brand }}</div>
    <div v-for="(section, s) in sections" :key="s" class="sidebar-section">
      <div class="sidebar-heading">{{ section.heading }}</div>
      <a
        v-for="link in section.links"
        :key="link.label"
        class="sidebar-link"
        :href="link.href || '#'"
        :aria-current="active === link.label ? 'page' : undefined"
        @click.prevent="active = link.label; emit('select', link)"
      >
        <span aria-hidden="true">{{ link.icon }}</span>
        <span class="sidebar-label">{{ link.label }}</span>
      </a>
    </div>
    <slot />
  </aside>
</template>
