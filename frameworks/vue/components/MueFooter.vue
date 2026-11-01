<!-- BEGIN MUE:META
  COMPONENT: Footer
  ID: vue-ui-footer
  GROUP: Frameworks / Vue 3
  CATEGORY: footers
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#footers only — this SFC ships no CSS of its own
  SHEET: styles/components.css#footers — footer, footer-brand, footer-desc, footer-heading, footer-links, footer-bottom, footer-social
  VARIANTS: brand block + data-driven link columns + a bottom bar with copyright and social links; every part is optional
  A11Y: semantic <footer> landmark; link columns are real <ul>/<a>; a social chip keeps its short
    visible code and adds an .sr-only expansion of the service name, because an aria-label that
    drops the visible text fails WCAG 2.5.3 (label in name)
  KEYBOARD: none beyond native link focus — the sheet lays the columns in an auto-fit grid, so this adds no behaviour
  PORTED FROM: components/footers/footers.html
  VERIFIED: compiles in build.mjs; rendered in the preview gallery at 1280 and 390 (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
const props = defineProps({
  /** Brand line; the preview shows "MASTER-UI-ENGINE". */
  brand: { type: String, default: "" },
  /** Short description under the brand. */
  desc: { type: String, default: null },
  /** [{ heading, links: [{ label, href? }] }] */
  columns: { type: Array, default: () => [] },
  /** Copyright text in the bottom bar. */
  copyright: { type: String, default: "" },
  /** [{ label, href?, ariaLabel }] social chips. */
  social: { type: Array, default: () => [] },
});
</script>

<template>
  <footer class="footer">
    <div v-if="brand || desc">
      <div v-if="brand" class="footer-brand">{{ brand }}</div>
      <p v-if="desc" class="footer-desc">{{ desc }}</p>
      <slot name="intro" />
    </div>
    <div v-for="(col, c) in columns" :key="c">
      <div class="footer-heading">{{ col.heading }}</div>
      <ul class="footer-links">
        <li v-for="(link, l) in col.links" :key="l"><a :href="link.href || '#'">{{ link.label }}</a></li>
      </ul>
    </div>
    <slot />
    <div v-if="copyright || social.length" class="footer-bottom">
      <span>{{ copyright }}</span>
      <div v-if="social.length" class="footer-social">
        <a
          v-for="(s, i) in social"
          :key="i"
          :href="s.href || '#'"
          >{{ s.label }}<span v-if="s.ariaLabel && s.ariaLabel !== s.label" class="sr-only"> {{ s.ariaLabel }}</span
        ></a>
      </div>
    </div>
  </footer>
</template>
