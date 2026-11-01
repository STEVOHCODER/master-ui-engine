/* BEGIN MUE:META
  COMPONENT: vue preview gallery entry
  ID: vue-preview-main
  GROUP: Frameworks / Vue 3
  FRAMEWORK: vue 3
  DEPENDENCIES: index.js (the thirty-seven SFCs), App.vue (gallery layout); classes all come from styles/components.css
  NOTES: page chrome (masthead, theme toggle) is static in preview/gallery.html so styles/mue.js can bind it;
         mue.js loads first and its tablist/dialog/dropdown boot hooks find nothing in the empty #gallery,
         so all interaction below is owned by the Vue bindings — no double binding.
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#gallery");
