/* Copies the live engine previews into site/engine so the marketing pages can
   iframe the real components instead of screenshots of them. */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SITE, "..");
const OUT = join(SITE, "engine");

const TREES = ["styles", "design-tokens", "components", "examples", "templates", "showcase", "frameworks"];
const DEV_DIRS = /(^|[\\/])(node_modules|\.git|\.cache|[A-Za-z0-9._-]+cache)([\\/]|$)/;
const isWebFile = (src) => !DEV_DIRS.test(src) && !/[\\/]\.?[^\\/]*\.(ps1|sh|cmd|bat)$/i.test(src);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const tree of TREES) {
  const from = join(REPO, tree);
  if (!existsSync(from)) throw new Error("missing engine tree: " + tree);
  cpSync(from, join(OUT, tree), { recursive: true, filter: isWebFile });
}

const countHtml = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? countHtml(join(dir, e.name)) : e.name.endsWith(".html") ? 1 : 0),
    0
  );

let pages = 0;
for (const tree of TREES) pages += countHtml(join(OUT, tree));

/* showcase/index.html is the one copied page whose URL is a folder index. Vercel's
   cleanUrls 308s /engine/showcase/index.html to /engine/showcase, and a path with no
   trailing slash makes the browser resolve ../design-tokens/engine.css and lab.js
   against /engine/ instead of /engine/showcase/. Pinning a base there keeps the
   source file relative (so file:// and tools/audit/serve.js still work) while the
   deployed copy loads its own assets. */
const labPath = join(OUT, "showcase", "index.html");
const lab = readFileSync(labPath, "utf8");
if (!lab.includes("<base ")) {
  writeFileSync(labPath, lab.replace(/(<meta charset[^>]*>)/i, `$1\n  <base href="/engine/showcase/">`), "utf8");
}

/* The 59 previews are iframed assets, not landing pages, so they stay out of the
   index. That has to be a per-file meta tag rather than an X-Robots-Tag on
   /engine/**: the header also lands on the CSS and JavaScript Googlebot fetches
   to render the marketing pages, and a noindexed stylesheet or script is what
   Search Console files as "Other error — Stylesheet / Script". */
const META_ROBOTS = '<meta name="robots" content="noindex, follow">';
const walkHtml = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkHtml(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : []
  );

let tagged = 0;
for (const file of walkHtml(OUT)) {
  const html = readFileSync(file, "utf8");
  if (/name=["']robots["']/i.test(html)) continue;
  const withMeta = html.replace(/(<meta charset[^>]*>)/i, `$1\n  ${META_ROBOTS}`);
  if (withMeta === html) throw new Error("no charset meta to anchor the robots tag: " + file);
  writeFileSync(file, withMeta, "utf8");
  tagged++;
}

console.log(
  "engine/ ready — " + pages + " html files (" + tagged + " tagged noindex), styles " +
    statSync(join(OUT, "styles/components.css")).size + " bytes"
);
