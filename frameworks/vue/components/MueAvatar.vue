<!-- BEGIN MUE:META
  COMPONENT: Avatar (+ group)
  ID: vue-ui-avatar
  GROUP: Frameworks / Vue 3
  CATEGORY: display
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css (display region) only — this SFC ships no CSS of its own
  SHEET: styles/components.css — avatar, avatar img, avatar-group, avatar-group .avatar overlap (grep-verified; no other avatar classes exist, so no size props)
  VARIANTS: initials/image via default slot or src; group=true renders the .avatar-group row and slots avatars in
  A11Y: img alt is passed through; initials text is the accessible name; decorative use is the author's choice via alt=""
  KEYBOARD: none — an avatar is not interactive unless the author wraps it in a real control
  PORTED FROM: grep of styles/components.css avatar/badge regions (used across the previews)
  VERIFIED: compiles in build.mjs; rendered in preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
defineProps({
  /** Image source; without it the slot text renders as initials. */
  src: { type: String, default: null },
  alt: { type: String, default: "" },
  /** Wrap slot content in .avatar-group instead of rendering a single avatar. */
  group: { type: Boolean, default: false },
});
</script>

<template>
  <div v-if="group" class="avatar-group"><slot /></div>
  <span v-else class="avatar">
    <img v-if="src" :src="src" :alt="alt" />
    <slot v-else />
  </span>
</template>
