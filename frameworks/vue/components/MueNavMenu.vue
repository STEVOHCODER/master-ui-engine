<!-- BEGIN MUE:META
  COMPONENT: Navigation Menu
  ID: vue-nav-menu
  GROUP: Frameworks / Vue 3
  CATEGORY: navigation
  FRAMEWORK: vue 3 (<script setup> SFC)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation (+ #dropdown) — this SFC ships no CSS of its own
  SHEET: styles/components.css#navigation — navbar, nav-links, nav-item, nav-link, nav-spacer, hamburger; #dropdown — dropdown, dropdown.is-open, dropdown-menu, menu-item, menu-item.danger, menu-divider
  VARIANTS: plain links and/or dropdown items (a link with a children array); a hamburger reveals the whole list as a drawer below 768px
  A11Y: <nav aria-label> landmark; each dropdown trigger is a button with aria-haspopup + aria-expanded kept in sync; the active link carries aria-current="page"; the menu mirrors aria-hidden to its open state
  KEYBOARD: opening a dropdown focuses its first item; ArrowUp/ArrowDown walk and wrap the items; Escape closes the menu (focus back to the trigger) and, if open, the drawer; a click outside closes both. Ported from styles/mue.js (drawer + [data-dropdown])
  PORTED FROM: components/navigation/navigation-menu.html + styles/mue.js#dropdowns
  VERIFIED: compiles in build.mjs; dropdown arrows, Escape, outside click and the drawer toggled headlessly in the preview gallery (see README)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from "vue";

const props = defineProps({
  /** [{ label, href?, active?, children?: [{ label, value?, danger?, divider? }] }] */
  links: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: "Main navigation" },
});

const emit = defineEmits(["select"]);

const uid = useId();
const listId = computed(() => `mue-navmenu${uid}`);
const root = ref(null);
const drawerOpen = ref(false);
const openMenu = ref(-1);

function menuItems() {
  if (!root.value) return [];
  const open = root.value.querySelector(".dropdown.is-open .dropdown-menu");
  return open ? Array.from(open.querySelectorAll(".menu-item")) : [];
}

function toggleMenu(i) {
  openMenu.value = openMenu.value === i ? -1 : i;
}

function pick(item) {
  emit("select", item.value !== undefined ? item.value : item.label);
  openMenu.value = -1;
}

function closeMenu() {
  if (openMenu.value === -1) return;
  openMenu.value = -1;
  const trigger = root.value?.querySelector(".dropdown.is-open .nav-link");
  trigger?.focus();
}

function onKeydown(e) {
  if (openMenu.value !== -1) {
    const els = menuItems();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!els.length) return;
      e.preventDefault();
      const i = els.indexOf(document.activeElement);
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length;
      els[next].focus();
      return;
    }
    if (e.key === "Escape") {
      e.stopPropagation();
      closeMenu();
      return;
    }
  }
  if (e.key === "Escape" && drawerOpen.value) drawerOpen.value = false;
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) {
    openMenu.value = -1;
    drawerOpen.value = false;
  } else if (root.value && !e.target.closest(".dropdown")) {
    openMenu.value = -1;
  }
}

watch(openMenu, (v) => {
  if (v !== -1) nextTick(() => menuItems()[0]?.focus());
});

document.addEventListener("click", onDocClick);
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <nav ref="root" class="navbar" :aria-label="ariaLabel" @keydown="onKeydown">
    <ul class="nav-links" :class="{ 'is-open': drawerOpen }" :id="listId">
      <li v-for="(link, i) in props.links" :key="link.label" class="nav-item">
        <a
          v-if="!link.children"
          class="nav-link"
          :href="link.href || '#'"
          :aria-current="link.active ? 'page' : undefined"
          @click="drawerOpen = false"
        >{{ link.label }}</a>
        <div v-else class="dropdown" :class="{ 'is-open': openMenu === i }">
          <button
            class="nav-link"
            type="button"
            aria-haspopup="true"
            :aria-expanded="String(openMenu === i)"
            @click.stop="toggleMenu(i)"
          >
            {{ link.label }}
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <ul class="dropdown-menu" :aria-hidden="String(openMenu !== i)">
            <li v-for="(sub, j) in link.children" :key="j">
              <div v-if="sub.divider" class="menu-divider"></div>
              <button v-else class="menu-item" :class="{ danger: sub.danger }" type="button" @click="pick(sub)">
                {{ sub.label }}
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
    <div class="nav-spacer"></div>
    <slot name="actions" />
    <button
      class="hamburger"
      type="button"
      :aria-controls="listId"
      :aria-expanded="String(drawerOpen)"
      aria-label="Toggle navigation"
      @click.stop="drawerOpen = !drawerOpen"
    >&#9776;</button>
  </nav>
</template>
