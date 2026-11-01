/* BEGIN MUE:META
  COMPONENT: React preview build
  ID: react-build-mjs
  GROUP: Frameworks > React
  CATEGORY: frameworks
  FRAMEWORK: react 19 (esbuild, no runtime CDN)
  DEPENDENCIES: esbuild (devDependency only), preview/preview.jsx, ../index.js, react + react-dom (bundled in)
  SHEET: none — this file only bundles; the preview page links the shared stylesheets itself
  VARIANTS: n/a — a build script renders no markup and offers no variants
  A11Y: n/a — nothing reaches the DOM from this file; it writes one bundle
  KEYBOARD: n/a — no behaviour; see the component files for the ported keyboard paths
  VERIFIED: node build.mjs exits 0 and writes preview/preview.js (committed), so the preview opens with zero network requests from file:// as well as over http
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { statSync } from "node:fs";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));

/* Vercel serves this site as static files, so the preview may not fetch React from
   a CDN: react and react-dom are bundled into preview/preview.js and committed. */
await build({
  absWorkingDir: here,
  entryPoints: ["preview/preview.jsx"],
  outfile: "preview/preview.js",
  bundle: true,
  format: "iife",
  jsx: "automatic",
  minify: true,
  target: ["es2020"],
  platform: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".jsx": "jsx" },
  legalComments: "none",
});

const { size } = statSync(join(here, "preview", "preview.js"));
console.log(`mue-react: preview/preview.js written (${(size / 1024).toFixed(1)} KiB)`);
