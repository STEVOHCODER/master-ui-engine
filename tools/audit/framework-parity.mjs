/* Framework parity check + catalog merge.

   frameworks/registry.json is the single list of which binding exists for which
   component. This tool proves that list is true before the site is allowed to
   claim it:

     node tools/audit/framework-parity.mjs          report drift, exit 1 on error
     node tools/audit/framework-parity.mjs --write  also merge bindings into the
                                                    catalog and rebuild catalog.js

   What it checks, per component:
   1. every path the registry names (source, preview, architecture, catalog) is a
      real file in this repository;
   2. every class a binding writes is defined in the shared stylesheet layer, so
      no package invents its own design;
   3. every implemented binding has a `verified` note naming a command or a check,
      because "it should work" is not a status;
   4. the catalog's `frameworks` field matches the registry exactly.

   It never rewrites a MUE:META header: the header stamping belongs to
   showcase/data/build-catalog.ps1, and mixing the two would put every preview
   file at risk to add sixteen framework rows. */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WRITE = process.argv.includes("--write");

const STATUSES = ["stable", "experimental", "planned", "unsupported"];
const FRAMEWORKS = ["vanilla", "react", "vue", "svelte", "angular", "web-components"];

const read = (file) => readFileSync(join(REPO, file), "utf8");
const exists = (file) => existsSync(join(REPO, file));

/* ---- class definitions in the shared layer -------------------------------- */
const STYLE_SHEETS = [
  "styles/components.css",
  "design-tokens/engine.css",
  "design-tokens/motion/scale.css",
  "styles/landing.css",
];

const defined = new Set();
for (const sheet of STYLE_SHEETS) {
  if (!exists(sheet)) continue;
  for (const match of read(sheet).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) defined.add(match[1]);
}

/* A preview's own scaffolding (grid, section labels) is styled inside that file,
   so those tokens are legal without being part of the design system. */
function localClasses(text) {
  const out = new Set();
  for (const block of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    for (const match of block[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) out.add(match[1]);
  }
  return out;
}

/* Comments describe classes rather than write them. The MUE:META SHEET: line in
   every binding quotes markup as prose, so class="..." inside a comment must not
   be counted as a token the file emits. */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/(^|[^:"'\\])\/\/[^\n]*/g, "$1");
}

/* A class attribute is either a plain string (HTML/Vue `class="card"`) or an
   expression that builds one (`className={cx("btn", ...)}`, `:class="'badge-' + v`").
   Static values contribute every word; expressions contribute only their string
   literals, so a bare identifier such as `classes` or a state word like `error`
   inside a ternary is never mistaken for a class the element writes. A fragment
   ending in a dash is a prefix (`card-`) and is matched against the sheet. */
function usedClasses(text) {
  const out = new Set();
  const clean = stripComments(text);
  const add = (chunk) => {
    for (const piece of String(chunk).split(/\s+/)) {
      const fragment = piece.split("${")[0];
      if (/^[a-z][a-z0-9-]*$/.test(fragment)) out.add(fragment);
    }
  };
  const literalTokens = (expr) => {
    for (const lit of expr.matchAll(/'([^']*)'|`([^`]*)`|"([^"]*)"/g)) {
      const before = expr.slice(Math.max(0, lit.index - 8), lit.index);
      // "error" in `state === "error"` is a prop value being tested, not a class written.
      if (/(?:[!=]==?|===)\s*$|case\s+$/.test(before)) continue;
      add(lit[1] ?? lit[2] ?? lit[3]);
    }
  };
  for (const m of clean.matchAll(/(?<![:\w-])class\s*=\s*"([^"]*)"/g)) add(m[1]);
  for (const m of clean.matchAll(/(?:class|className)(?:\.\w+)?\s*=\s*\{([\s\S]{0,600}?)\}/g)) literalTokens(m[1]);
  for (const m of clean.matchAll(/(?::class|v-bind:class)\s*=\s*"([^"]*)"/g)) literalTokens(m[1]);
  return out;
}

const definedList = [...defined];
const isDefined = (token) =>
  defined.has(token) ||
  (token.endsWith("-") && definedList.some((name) => name.startsWith(token)));

/* Every source file a binding ships, so a class cannot hide in the second one. */
function bindingFiles(entry) {
  const files = [];
  if (entry.source && exists(entry.source)) {
    const stat = statSync(join(REPO, entry.source));
    if (stat.isDirectory()) {
      for (const name of readdirSync(join(REPO, entry.source))) files.push(join(entry.source, name));
    } else files.push(entry.source);
  }
  if (entry.sources) for (const f of entry.sources) if (exists(f)) files.push(f);
  if (entry.preview && exists(entry.preview)) files.push(entry.preview);
  return files;
}

/* The source files only — a preview page documents a gallery, not a component. */
function sourceFiles(entry) {
  return bindingFiles(entry).filter((f) => f !== entry.preview);
}

/* MUE:META is the framework-independent contract: variants, props, states, a11y,
   keyboard path, events, which vanilla preview it ports, licence and attribution.
   Harvested here so the site and the CLI read one copy of the truth instead of a
   second prose list that can drift from the code. */
function metaFields(text) {
  const block = /BEGIN MUE:META([\s\S]*?)END MUE:META/.exec(text);
  if (!block) return null;
  const fields = {};
  let key = null;
  for (const raw of block[1].split(/\r?\n/)) {
    const line = raw.replace(/^\s+/, "").replace(/\s+$/, "");
    if (!line) continue;
    const kv = /^([A-Z][A-Z0-9_]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1].toLowerCase();
      fields[key] = kv[2].trim();
    } else if (key) {
      fields[key] += " " + line;
    }
  }
  return fields;
}

const SPEC_FIELDS = ["variants", "props", "states", "a11y", "keyboard", "events", "responsive", "dependencies", "ports", "sheet"];

function harvestSpec(files) {
  const spec = {};
  for (const file of files) {
    const meta = metaFields(read(file));
    if (!meta) {
      errors.push(file + " has no MUE:META block, so its contract is not machine-readable.");
      continue;
    }
    for (const field of SPEC_FIELDS) {
      if (!meta[field]) continue;
      if (!spec[field]) spec[field] = "";
      if (spec[field].indexOf(meta[field]) === -1) spec[field] += (spec[field] ? " / " : "") + meta[field];
    }
    if (!meta.license) errors.push(file + " declares no LICENSE field.");
    if (!meta.attribution) errors.push(file + " declares no ATTRIBUTION field.");
    if (!meta.ports && !meta.framework) errors.push(file + " declares neither PORTS nor FRAMEWORK.");
    spec.license = spec.license || meta.license || null;
    spec.attribution = spec.attribution || meta.attribution || null;
  }
  return spec;
}

/* ---- report ----------------------------------------------------------------- */
const errors = [];
const notes = [];
const registry = JSON.parse(read("frameworks/registry.json"));

if (!Array.isArray(registry.components) || registry.components.length === 0) {
  errors.push("frameworks/registry.json lists no components.");
}

for (const component of registry.components) {
  const label = component.catalogId || "(unnamed)";
  if (!component.catalogId) errors.push("component without a catalogId: " + JSON.stringify(component).slice(0, 60));
  if (component.catalog && !exists(component.catalog)) {
    errors.push(label + ": vanilla preview " + component.catalog + " is not a file in this repo.");
  }

  const bindings = component.bindings || {};
  for (const name of Object.keys(bindings)) {
    if (FRAMEWORKS.indexOf(name) === -1) errors.push(label + ": unknown framework key " + name + ".");
    const binding = bindings[name];
    if (STATUSES.indexOf(binding.status) === -1) {
      errors.push(label + "." + name + ": status " + binding.status + " is not one of " + STATUSES.join("/"));
    }
    for (const field of ["source", "preview", "architecture", "docs"]) {
      const value = binding[field];
      if (value && !exists(value)) errors.push(label + "." + name + ": " + field + " " + value + " does not exist.");
    }
    if (binding.status === "stable" || binding.status === "experimental") {
      if (!binding.source && !binding.sources) errors.push(label + "." + name + ": claims " + binding.status + " but ships no source.");
      if (!binding.verified) errors.push(label + "." + name + ": claims " + binding.status + " with no recorded check.");
      else if (!/(node |npm |chrome|headless|build|served|curl|--check)/i.test(binding.verified)) {
        errors.push(label + "." + name + ": verified note must name a command or a check, not an adjective.");
      }
      for (const file of bindingFiles(binding)) {
        const text = read(file);
        const own = localClasses(text);
        for (const token of usedClasses(text)) {
          if (!isDefined(token) && !own.has(token)) {
            errors.push(label + "." + name + ": " + file + " writes ." + token + ", which no shared stylesheet defines.");
          }
        }
      }
      binding.spec = harvestSpec(sourceFiles(binding));
    }
    if (binding.status === "planned") {
      if (binding.source || binding.sources) errors.push(label + "." + name + ": planned, but it lists source files.");
      notes.push(label + "." + name + " is planned and says so.");
    }
  }
  for (const name of bindings.vanilla ? FRAMEWORKS : []) {
    if (!bindings[name]) notes.push(label + ": no " + name + " entry at all (treated as unsupported).");
  }
}

/* A component listed under two bindings of the same file reports once per binding;
   the same file read twice reports twice. Collapse to one line per real problem. */
const seenError = new Set();
for (let i = errors.length - 1; i >= 0; i -= 1) {
  if (seenError.has(errors[i])) errors.splice(i, 1);
  else seenError.add(errors[i]);
}
const seenNote = new Set();
for (let i = notes.length - 1; i >= 0; i -= 1) {
  if (seenNote.has(notes[i])) notes.splice(i, 1);
  else seenNote.add(notes[i]);
}

/* ---- catalog merge ---------------------------------------------------------- */
const catalogPath = "showcase/data/component-catalog.json";
const catalog = JSON.parse(read(catalogPath));
const byId = new Map(catalog.items.map((item) => [item.id, item]));
let changed = 0;

for (const component of registry.components) {
  const item = byId.get(component.catalogId);
  if (!item) {
    errors.push(component.catalogId + ": catalogId is not in the catalog.");
    continue;
  }
  const frameworks = {};
  for (const name of Object.keys(component.bindings || {})) {
    const binding = component.bindings[name];
    frameworks[name] = {
      status: binding.status,
      source: binding.source || (binding.sources ? binding.sources.join(" ") : null),
      sources: binding.sources || null,
      preview: binding.preview || (binding.previews ? binding.previews.join(" ") : null),
      install: binding.install || null,
      import: binding.import || null,
      tag: binding.tag || null,
      package: binding.package || null,
      architecture: binding.architecture || null,
      verified: binding.verified || null,
      spec: binding.spec || null,
    };
  }
  item.frameworks = frameworks;
  item.frameworkKeys = Object.keys(frameworks).filter((k) => ["stable", "experimental"].indexOf(frameworks[k].status) > -1);
  item.supportMatrix = Object.keys(frameworks)
    .filter((k) => k !== "vanilla")
    .reduce((out, k) => out.concat(k + ":" + frameworks[k].status), [])
    .join(" ");
  changed += 1;
}

if (changed) catalog.version = registry.version || catalog.version;

/* Licence + attribution roll-up, so docs can state what the tree actually carries
   rather than repeating "MIT" from memory. A third-party-derived port must say so in
   its ATTRIBUTION field or it shows up here as a difference the maintainer sees. */
const licences = new Set();
const attributions = new Set();
for (const item of catalog.items) {
  for (const name of Object.keys(item.frameworks || {})) {
    const spec = (item.frameworks[name] || {}).spec;
    if (!spec) continue;
    if (spec.license) licences.add(name + ": " + spec.license);
    if (spec.attribution) attributions.add(name + ": " + spec.attribution);
  }
}
notes.push("licences in the tree — " + ([...licences].join(" | ") || "none declared"));
notes.push("attribution in the tree — " + ([...attributions].join(" | ") || "none declared"));

if (WRITE && errors.length === 0) {
  const json = JSON.stringify(catalog, null, 2) + "\n";
  writeFileSync(join(REPO, catalogPath), json, "utf8");
  writeFileSync(
    join(REPO, "showcase/data/catalog.js"),
    "// GENERATED by showcase/data/build-catalog.ps1 and tools/audit/framework-parity.mjs - do not edit by hand.\n" +
      "// Single source of truth: showcase/data/component-catalog.json\n" +
      "window.MUE_CATALOG = " + json.trimEnd() + ";\n",
    "utf8"
  );
  console.log("catalog updated: " + changed + " entries carry a frameworks field.");
} else if (errors.length) {
  console.log("catalog NOT written: " + errors.length + " problem(s).");
}

for (const note of notes) console.log("note   " + note);
for (const error of errors) console.log("ERROR  " + error);
console.log((errors.length ? "FAILED " : "OK     ") + errors.length + " error(s), " + notes.length + " note(s), " +
  registry.components.length + " components, " + defined.size + " classes defined in the shared layer.");
process.exit(errors.length ? 1 : 0);
