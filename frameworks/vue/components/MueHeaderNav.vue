<!-- BEGIN MUE:META
  COMPONENT: Header Navigation
  ID: vue-nav-header
  GROUP: Frameworks / Vue 3
  CATEGORY: navigation
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation (+ #buttons, #display) — this SFC ships no CSS of its own
  SHEET: styles/components.css#navigation — site-header, navbar, nav-brand, nav-links, nav-item, nav-link, nav-spacer, hamburger; #display — avatar; drawer reveal via nav-links.is-open, shadow via site-header.is-scrolled
  VARIANTS: brand + inline links on wide viewports; below 768px the sheet hides the links and the hamburger reveals a .is-open drawer; a #actions slot holds the user controls
  A11Y: <header role="banner"> landmark; the hamburger is a real button with aria-controls + aria-expanded pointing at the list; links are native <a> and the active one gets aria-current="page"
  KEYBOARD: Escape closes the drawer and returns focus to the hamburger; an outside click closes it (ported from styles/mue.js). The scroll shadow (>8px) is added by this binding, matching the vanilla script
  PORTED FROM: components/navigation/header-nav.html + styles/mue.js#nav
  VERIFIED: compiles in build.mjs; hamburger open/close, Escape and the scroll shadow exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, useId } from "vue";

const props = defineProps({
  brand: { type: String, default: "Brand" },
  /** [{ label, href?, active? }] */
  links: { type: Array, default: () => [] },
});

const uid = useId();
const listId = computed(() => `mue-header-links${uid}`);
const header = ref(null);
const open = ref(false);
const scrolled = ref(false);

function toggle() {
  open.value = !open.value;
}

function onDocClick(e) {
  if (header.value && !header.value.contains(e.target)) open.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape" && open.value) open.value = false;
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    scrolled.value = window.scrollY > 8;
    ticking = false;
  });
}

watch(open, (v) => {
  if (v) {
    document.addEventListener("click", onDocClick);
  } else {
    document.removeEventListener("click", onDocClick);
  }
});

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onDocClick);
});
</script>

<template>
  <header ref="header" class="site-header" :class="{ 'is-scrolled': scrolled }" role="banner" @keydown="onKeydown">
    <a class="nav-brand" href="#">{{ brand }}</a>
    <ul class="nav-links" :class="{ 'is-open': open }" :id="listId">
      <li v-for="link in props.links" :key="link.label" class="nav-item">
        <a
          class="nav-link"
          :href="link.href || '#'"
          :aria-current="link.active ? 'page' : undefined"
          @click="open = false"
        >{{ link.label }}</a>
      </li>
      <slot name="links" />
    </ul>
    <div class="nav-spacer"></div>
    <div class="row">
      <slot name="actions" />
    </div>
    <button
      class="hamburger"
      type="button"
      :aria-controls="listId"
      :aria-expanded="String(open)"
      aria-label="Toggle navigation"
      @click.stop="toggle"
    >&#9776;</button>
  </header>
</template>
