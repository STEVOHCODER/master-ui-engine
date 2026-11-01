/* BEGIN MUE:META
  COMPONENT: vue package build wrapper
  ID: vue-build
  GROUP: Frameworks / Vue 3
  FRAMEWORK: vue 3 (runs vite programmatically with vite.config.js)
  DEPENDENCIES: vite, @vitejs/plugin-vue (devDependencies)
  USAGE: node build.mjs  — compiles all sixteen SFCs + the preview gallery and writes
         preview/dist/preview.js (stable name, single chunk, no hashing). Exits non-zero on any compile error.
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */
import { build } from "vite";
import { fileURLToPath } from "node:url";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const started = Date.now();

try {
  await build({ root, configFile: path.join(root, "vite.config.js") });
} catch (err) {
  console.error("build failed:", err?.message || err);
  process.exit(1);
}

const out = path.join(root, "preview", "dist", "preview.js");
if (!existsSync(out)) {
  console.error(`expected output missing: ${out}`);
  process.exit(1);
}
console.log(`ok: ${out} (${statSync(out).size} bytes) in ${Date.now() - started}ms`);
