<!-- BEGIN MUE:META
  COMPONENT: Float button
  ID: vue-ui-floatbutton
  GROUP: Frameworks / Vue 3
  CATEGORY: overlays
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#guidance — this SFC ships no CSS of its own
  SHEET: styles/components.css#guidance — float-btn, float-btn-primary, float-btn-label, float-btn-group, float-btn-group.is-visible
  VARIANTS: default, primary, labelled (text beside the icon); a docked group pins to the viewport corner and reveals on scroll
  A11Y: every control is a real <button> with an aria-label; icon SVGs are aria-hidden; the label variant carries visible text so an icon is never the only cue
  KEYBOARD: native button focus + Enter/Space; when docked the group reveals once scrolled past the threshold and a click scrolls the page to the top (ported from the guidance.html page script)
  PORTED FROM: components/overlays/guidance.html (float-buttons section)
  VERIFIED: compiles in build.mjs; dock reveal on scroll and a button click exercised headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  /** [{ label, glyph?, variant?, text?, scrollToTop? }] */
  buttons: { type: Array, default: () => [] },
  /** Fixed corner dock that reveals on scroll; otherwise buttons sit inline. */
  docked: { type: Boolean, default: false },
  revealAfter: { type: Number, default: 420 },
});

const emit = defineEmits(["select"]);

const visible = ref(!props.docked);

const GLYPHS = {
  plus: "M12 5v14M5 12h14",
  up: "M12 19V5m0 0l-6 6m6-6l6 6",
  chat: "M21 12a8 8 0 01-8 8H8l-5 3 1.4-4.6A8 8 0 1121 12z",
  help: "M9.6 9.2a2.5 2.5 0 114 2.1c-.9.6-1.6 1-1.6 2.1",
};

let ticking = false;
function onScroll() {
  if (!props.docked || ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    visible.value = window.scrollY > props.revealAfter;
    ticking = false;
  });
}

function onClick(btn) {
  emit("select", btn);
  if (btn.scrollToTop) window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  if (props.docked) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
});

onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <div :class="docked ? ['float-btn-group', { 'is-visible': visible }] : 'row'">
    <button
      v-for="(btn, i) in props.buttons"
      :key="i"
      class="float-btn"
      :class="btn.variant ? `float-btn-${btn.variant}` : undefined"
      type="button"
      :aria-label="btn.label"
      @click="onClick(btn)"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path v-if="GLYPHS[btn.glyph]" :d="GLYPHS[btn.glyph]" />
        <circle v-if="btn.glyph === 'help'" cx="12" cy="12" r="9" stroke-width="2" />
        <circle v-if="btn.glyph === 'help'" cx="12" cy="17.2" r="1.1" fill="currentColor" stroke="none" />
      </svg>
      <template v-if="btn.text">{{ btn.text }}</template>
    </button>
  </div>
</template>
