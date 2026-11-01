/* BEGIN MUE:META
  COMPONENT: vue preview build config
  ID: vue-vite-config
  GROUP: Frameworks / Vue 3
  FRAMEWORK: vue 3 (vite + @vitejs/plugin-vue)
  DEPENDENCIES: vite, @vitejs/plugin-vue (devDependencies only — the package itself stays dependency-free)
  NOTES: output is committed with a STABLE name (preview/dist/preview.js, single chunk, no hashing)
         and base "./" so relative asset URLs work under any path; see frameworks/README.md
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("./preview/dist", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // Build the gallery page script, not a library: one entry, one chunk.
      input: fileURLToPath(new URL("./preview/main.js", import.meta.url)),
      output: {
        entryFileNames: "preview.js",
        chunkFileNames: "preview-[name].js",
        assetFileNames: "preview[extname]",
        format: "es",
      },
    },
  },
});
