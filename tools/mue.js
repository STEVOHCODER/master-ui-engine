#!/usr/bin/env node
/* MUE CLI — the agent API for MASTER-UI-ENGINE.
   Zero dependencies, Node only. Every answer comes from the files in this repo,
   so an agent can reuse a component instead of inventing one.

     node tools/mue.js search "pricing table"
     node tools/mue.js show tbl-pricing
     node tools/mue.js region buttons cards
     node tools/mue.js usage .btn-primary
     node tools/mue.js regions
     node tools/mue.js tokens --filter radius
     node tools/mue.js scaffold my-page.html --use btn-buttons ex-education
     node tools/mue.js add ui-cards --into ../my-app
     node tools/mue.js registry
     node tools/mue.js check all
     node tools/mue.js doctor
     node tools/mue.js serve

   Add --json to anything an agent should parse rather than read.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHEET = path.join(ROOT, 'styles', 'components.css');
const CATALOG = path.join(ROOT, 'showcase', 'data', 'component-catalog.json');
const TOKEN_DIR = path.join(ROOT, 'design-tokens');

/* ------------------------------------------------------------------ helpers */

function read(fileRel) {
  const p = path.isAbsolute(fileRel) ? fileRel : path.join(ROOT, fileRel);
  return fs.readFileSync(p, 'utf8');
}

function rel(fsPath) {
  return path.relative(ROOT, fsPath).split(path.sep).join('/');
}

/** Depth-aware href from a page location to a repo-root asset. */
function href(fromRel, assetRel) {
  const up = '../'.repeat(fromRel.split('/').length - 1);
  return up + assetRel;
}

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue;
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        out.flags[key] = next;
        i++;
      } else {
        out.flags[key] = true;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function emit(json, value, humanLines) {
  if (json) {
    process.stdout.write(JSON.stringify(value, null, 2) + '\n');
  } else {
    const text = humanLines(value);
    process.stdout.write((text ? text + '\n' : '') + '\n');
  }
}

function fail(msg) {
  process.stderr.write('mue: ' + msg + '\n');
  process.exitCode = 1;
}

/* ------------------------------------------------------------------- catalog */

function catalog() {
  return JSON.parse(read(rel(CATALOG)));
}

/** Accepts a catalog id, a repo-relative path, or a bare filename. */
function resolveItem(terms) {
  const items = catalog().items;
  const keys = [].concat(terms);
  for (const raw of keys) {
    const term = String(raw).toLowerCase().replace(/^\.\//, '');
    const hit =
      items.find((i) => i.id.toLowerCase() === term) ||
      items.find((i) => i.path.toLowerCase() === term) ||
      items.find((i) => i.path.toLowerCase().endsWith('/' + term)) ||
      items.find((i) => i.name.toLowerCase() === term);
    if (hit) return hit;
  }
  return null;
}

function ambiguous(terms) {
  const items = catalog().items;
  const term = String(terms[0]).toLowerCase();
  return items.filter(
    (i) =>
      i.id.includes(term) ||
      i.name.toLowerCase().includes(term) ||
      i.category.includes(term)
  );
}

/* -------------------------------------------------------------- MUE:META head */

const META_RE = /<!-- BEGIN MUE:META[\s\S]*?END MUE:META -->/;

/** Structured fields from a preview's own header — the file knows more than the catalog. */
function readMeta(fileRel) {
  const text = read(fileRel);
  const m = text.match(META_RE);
  const fields = {};
  if (m) {
    for (const line of m[0].split(/\r?\n/)) {
      const kv = line.match(/^ {2}([A-Z_]+):\s*(.*)$/);
      if (kv) fields[kv[1]] = kv[2].trim();
    }
  }
  const comments = (text.slice(0, text.toLowerCase().indexOf('</head>')).match(/<!--/g) || []).length;
  return { fields, hasMeta: Boolean(m), headComments: comments };
}

/** `styles/components.css#buttons` -> `buttons`, or null when the page is self-contained. */
function sheetRegions(meta) {
  const sheet = meta.fields.SHEET || '';
  return [...sheet.matchAll(/components\.css#([\w-]+)/g)].map((m) => m[1]);
}

/* --------------------------------------------------------------- sheet regions */

function regionMap() {
  const lines = read(rel(SHEET)).split(/\r?\n/);
  const regions = [];
  let open = null;
  lines.forEach((line, idx) => {
    const start = line.match(/\/\* #region ([\w-]+) \*\//);
    const end = line.match(/\/\* #endregion ([\w-]+) \*\//);
    if (start) open = { name: start[1], from: idx + 1 };
    else if (end && open) {
      regions.push({ ...open, to: idx + 1 });
      open = null;
    }
  });
  return regions;
}

function regionText(name) {
  const hit = regionMap().find((r) => r.name === name);
  if (!hit) return null;
  const lines = read(rel(SHEET)).split(/\r?\n/);
  return lines.slice(hit.from - 1, hit.to).join('\n');
}

/** Class selectors each region defines — the contract behind `usage`. */
function regionClasses(name) {
  const body = regionText(name) || '';
  const found = new Set();
  for (const block of body.split(/\n(?=\S)/)) {
    const selector = block.split('{')[0];
    if (!block.includes('{') || /^\s*(\/\*|\*)/.test(selector)) continue;
    for (const c of selector.matchAll(/\.([A-Za-z][\w-]*)/g)) found.add(c[1]);
  }
  return [...found].sort();
}

function classIndex() {
  const index = new Map();
  for (const r of regionMap()) {
    for (const c of regionClasses(r.name)) {
      if (!index.has(c)) index.set(c, []);
      index.get(c).push(r.name);
    }
  }
  return index;
}

/* ------------------------------------------------------- reuse plumbing (add/registry)
   `add` and `registry` ask the same questions over and over, so the sheet is
   parsed once per run instead of once per question.
   -------------------------------------------------------------------------- */

let sheetCache = null;
function sheetCacheGet() {
  if (!sheetCache) sheetCache = { names: regionMap().map((r) => r.name), index: classIndex() };
  return sheetCache;
}

/** Classes a snippet puts on elements — the reason a trimmed sheet is not just the header list. */
function classesIn(markup) {
  const found = new Set();
  for (const m of String(markup || '').matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) if (/^[A-Za-z][\w-]*$/.test(c)) found.add(c);
  }
  return found;
}

/** Regions this preview declares it draws on: the `SHEET:` line and its own `data-section`. */
function namedRegions(meta, fileRel) {
  const known = new Set(sheetCacheGet().names);
  const text = read(fileRel);
  const decl = (text.match(/class="code-wrap"[^>]*data-section="([^"]*)"/) || [])[1] || '';
  const names = new Set(sheetRegions(meta));
  for (const m of String(meta.fields.SHEET || '').matchAll(/#([\w-]+)/g)) names.add(m[1]);
  for (const c of decl.split(/[,\s]+/)) if (c) names.add(c);
  return [...names].filter((n) => known.has(n) && n !== 'tokens');
}

/**
 * The regions a snippet needs: `tokens`, what the header names, everything the
 * markup's classes live in, and one transitive level — the classes the included
 * CSS styles but does not define itself. A class is *satisfied* when any region
 * already in the set defines it, which is what keeps this list short: `.card`
 * shows up in the selectors of #tables and #chrome too, but #cards ships it.
 *
 * Two levels only, on purpose. The safe default is `styles/components.css`
 * whole; `--minimal` is the opt-out, and a class you add by hand later can live
 * in a region this pass never saw.
 */
function closureRegions(named, markup) {
  const { names, index } = sheetCacheGet();
  const included = new Set(['tokens']);
  const why = { tokens: 'the sheet declares its control sizes here' };
  for (const r of named) {
    included.add(r);
    why[r] = 'named by the preview header';
  }
  const satisfied = (cls) => (index.get(cls) || []).some((r) => included.has(r));
  for (const c of classesIn(markup)) {
    if (satisfied(c)) continue;
    for (const r of index.get(c) || []) {
      if (included.has(r)) continue;
      included.add(r);
      why[r] = 'markup uses .' + c;
    }
  }
  for (const r of [...included]) {
    for (const m of (regionText(r) || '').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([A-Za-z][\w-]*)/g)) {
      const cls = m[1];
      if (satisfied(cls)) continue;
      for (const other of index.get(cls) || []) {
        if (included.has(other)) continue;
        included.add(other);
        why[other] = `region ${r} styles .${cls}`;
      }
    }
  }
  return { regions: names.filter((n) => included.has(n)), why };
}

/** A sheet holding only the regions asked for — same file, shorter. */
function trimmedSheet(regions) {
  const body = regions.map((r) => `/* ==== region ${r} ==== */\n${(regionText(r) || '').trimEnd()}`);
  return (
    `/* MASTER-UI-ENGINE — trimmed sheet, written by \`node tools/mue.js add --minimal\`.\n` +
    `   Contains: ${regions.join(', ')}.\n` +
    `   Resolved one level deep. If a component arrives unstyled, you are missing a region:\n` +
    `   link styles/components.css wholesale instead, or re-run add without --minimal.\n` +
    `   Regenerate: node tools/mue.js add <id> --into <this project> --minimal */\n\n` +
    body.join('\n\n') +
    '\n'
  );
}

/** A runnable page around copy-ready markup: one head comment, three tags, the snippet. */
function snippetPage(item, markup, sheetRel, regions) {
  const fromRel = `mue/${item.id}.html`;
  const meta = readMeta(item.path);
  const tags = assetTags(fromRel, sheetRel);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${item.name} — MUE snippet</title>
<!-- BEGIN MUE:META
  KIND: SNIPPET (installed by tools/mue.js add)
  ID: ${item.id}
  COMPONENT: ${item.name}
  GROUP: ${item.group}
  CATEGORY: ${item.category}
  FRAMEWORK: vanilla (HTML/CSS/JS, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: ${['design-tokens/engine.css', sheetRel, 'styles/mue.js'].join(', ')} (all linked in this head)
  SHEET: ${sheetRel}${regions.filter((r) => r !== 'tokens').map((r) => '#' + r).join(', ')} — every class below is defined there, so this markup renders styled
  THEME: light + dark (html.dark, persisted and synced by styles/mue.js)
  SOURCE: ${item.path}
  VERIFIED: run "node tools/mue.js check <this file>" after editing
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
${tags.join('\n')}
<style>
/* Snippet scaffolding only — component rules live in the sheet above. */
.mue-snippet { display: grid; gap: var(--space-6); align-content: start; }
</style>
</head>
<body class="page">
  <main class="shell mue-snippet">
${indent(markup, 4)}
  </main>
</body>
</html>
`;
}

/** The three tags a page at `fromRel` (project-relative) needs, at the right depth. */
function assetTags(fromRel, sheetRel) {
  const out = [`<link rel="stylesheet" href="${href(fromRel, 'design-tokens/engine.css')}">`];
  if (sheetRel) out.push(`<link rel="stylesheet" href="${href(fromRel, sheetRel)}">`);
  out.push(`<script src="${href(fromRel, 'styles/mue.js')}" defer><\/script>`);
  return out;
}

/** Copy a preview whole and re-point only its shared-layer links at the new depth. */
function retargetAssets(text, previewRel, toRel, sheetRel) {
  return text.replace(/(href|src)="([^"]+\.(?:css|js))"/g, (all, attr, url, offset) => {
    if (/^(https?:|data:|\/\/|#)/.test(url)) return all;
    const line = text.lastIndexOf('\n', offset) >= 0 ? text.slice(text.lastIndexOf('\n', offset) + 1, offset) : text.slice(0, offset);
    if (line.includes('&lt;')) return all; // escaped code sample, not a dependency
    const repoRel = rel(path.resolve(path.join(ROOT, path.dirname(previewRel)), url.split('#')[0]));
    if (/^styles\/components\.css$/.test(repoRel) && sheetRel) return `${attr}="${href(toRel, sheetRel)}"`;
    if (!/^(design-tokens|styles)\//.test(repoRel)) return all;
    return `${attr}="${href(toRel, repoRel)}"`;
  });
}

/* ------------------------------------------------------------------ write guard */

function inside(into, destRel) {
  const base = path.resolve(into);
  const target = path.resolve(base, destRel);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error(`refusing to write outside --into (${destRel})`);
  }
  return target;
}

/** Never deletes, never truncates something different without --force. */
function copyInto(into, destRel, content, force) {
  const dest = inside(into, destRel);
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(String(content), 'utf8');
  if (fs.existsSync(dest)) {
    if (fs.readFileSync(dest).equals(buf)) return { file: destRel, status: 'identical (skipped)' };
    if (!force) return { file: destRel, status: 'kept existing, differs (--force overwrites)' };
    fs.writeFileSync(dest, buf);
    return { file: destRel, status: 'overwritten' };
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return { file: destRel, status: 'written' };
}

/** The shared layers, copied once: every token file at its own path, then the two style files. */
function copySharedLayers(into, force, withSheet, sheetRel) {
  const rows = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else rows.push(copyInto(into, rel(p), fs.readFileSync(p), force));
    }
  })(TOKEN_DIR);
  if (withSheet) rows.push(copyInto(into, sheetRel, read(rel(SHEET)), force));
  rows.push(copyInto(into, 'styles/mue.js', fs.readFileSync(path.join(ROOT, 'styles', 'mue.js')), force));
  return rows;
}

/* ------------------------------------------------------------------- commands */

const cmd = {};

cmd.list = (args, flags, json) => {
  let items = catalog().items;
  if (typeof flags.group === 'string') {
    items = items.filter((i) => i.group.toLowerCase() === flags.group.toLowerCase());
  }
  if (typeof flags.category === 'string') {
    items = items.filter((i) => i.category === flags.category);
  }
  emit(json, items.map((i) => pick(i, 'id', 'name', 'group', 'category', 'path', 'sheet')), (rows) =>
    rows
      .map((i) => `${pad(i.id, 22)} ${pad(i.group, 11)} ${pad(i.category, 16)} ${i.path}`)
      .join('\n') + `\n\n${rows.length} previews. "mue show <id>" gives markup + CSS.`
  );
};

function pick(obj, ...keys) {
  const o = {};
  for (const k of keys) o[k] = obj[k];
  return o;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}

cmd.search = (args, flags, json) => {
  if (!args.length) return fail('usage: mue search "pricing table"');
  const q = args.join(' ').toLowerCase();
  const terms = q.split(/[\s,]+/).filter(Boolean);
  const scored = catalog()
    .items.map((item) => {
      const meta = readMeta(item.path);
      const haystack = {
        name: item.name.toLowerCase(),
        id: item.id.toLowerCase(),
        category: item.category.toLowerCase(),
        group: item.group.toLowerCase(),
        variants: (item.variants || []).join(' ').toLowerCase(),
        summary: (item.summary || '').toLowerCase(),
        prose: Object.values(meta.fields).join(' ').toLowerCase(),
      };
      let score = 0;
      const why = [];
      for (const t of terms) {
        const hit = Object.entries(haystack).find((([k, v]) => v.includes(t)));
        if (!hit) continue;
        const weight = hit[0] === 'name' ? 6 : hit[0] === 'summary' ? 5 : hit[0] === 'variants' ? 4 : hit[0] === 'category' ? 3 : hit[0] === 'prose' ? 2 : 3;
        score += weight;
        if (!why.includes(hit[0])) why.push(hit[0]);
      }
      if (q && haystack.name.includes(q)) score += 8;
      return { item, meta, score, why };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Number(flags.limit || 10));

  if (!scored.length) {
    return fail(`no preview matches "${q}". Try: mue regions, or mue list --group Components`);
  }
  emit(json, scored.map(r => ({ ...pick(r.item, 'id', 'name', 'group', 'path', 'summary'), score: r.score, matchedOn: r.why, regions: sheetRegions(r.meta), theme: r.meta.fields.THEME || r.item.theming })), (rows) =>
    rows
      .map(
        (r) =>
          `${pad(r.id, 22)} ${pad(r.name, 22)} ${r.path}\n` +
          (r.summary ? `  ${r.summary}\n` : '') +
          `  regions: ${r.regions.length ? r.regions.join(', ') : 'none yet — page is self-contained'}\n` +
          `  matched: ${r.matchedOn.join(', ')}`
      )
      .join('\n') + `\n\n"mue show <id>" prints the markup and the CSS it needs.`
  );
};

cmd.show = (args, flags, json) => {
  const item = resolveItem(args);
  if (!item) return notFound(args);
  const meta = readMeta(item.path);
  const regions = sheetRegions(meta);
  const markup = extractMarkup(item.path);
  const deps = [href(item.path, 'design-tokens/engine.css')];
  if (meta.fields.SHEET) deps.push(href(item.path, 'styles/components.css'));
  const out = {
    id: item.id,
    name: item.name,
    group: item.group,
    category: item.category,
    summary: item.summary || null,
    path: item.path,
    preview: 'file:///' + rel(path.join(ROOT, item.path)).replace(/\\/g, '/'),
    meta: meta.fields,
    sheetRegions: regions,
    selfContained: regions.length === 0,
    linkTags: deps.map((d) => `<link rel="stylesheet" href="${d}">`),
    scriptTag:
      regions.length === 0 ? null : `<script src="${href(item.path, 'styles/mue.js')}" defer></script>`,
    markup,
  };
  if (!json) {
    const lines = [
      `${item.name}  (${item.id})`,
      `${item.group} · ${item.category} · ${item.path}`,
      ...(item.summary ? [String(item.summary)] : []),
      '',
      'HEADER',
      ...Object.entries(meta.fields).map(([k, v]) => `  ${pad(k + ':', 14)} ${v}`),
      '',
      'TO LINK FROM A PAGE NEXT TO THIS ONE',
      ...out.linkTags.map((l) => '  ' + l),
      ...(out.scriptTag ? ['  ' + out.scriptTag] : []),
      '',
    ];
    if (regions.length) {
      lines.push('CSS YOU NEED (only if you are not linking the whole sheet)', ...regions.map((r) => `  node tools/mue.js region ${r}`), '');
    } else {
      lines.push('NOTE: this preview still carries its own CSS in a <style> block; nothing to lift.', '');
    }
    lines.push('MARKUP', ...String(markup || '(no code panel)').split('\n').map((l) => '  ' + l));
    process.stdout.write(lines.join('\n') + '\n\n');
  } else {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  }
};

function notFound(args) {
  const near = ambiguous(args);
  fail(
    `no preview named "${args.join(' ')}".` +
      (near.length ? ` Did you mean: ${near.slice(0, 6).map((i) => i.id).join(', ')}?` : ' Run: mue list')
  );
}

/** The copy target of a preview: the <pre><code> inside .code-wrap. */
function extractMarkup(fileRel) {
  const text = read(fileRel);
  const at = text.indexOf('class="code-wrap"');
  if (at < 0) return null;
  const block = text.slice(at, at + 40000);
  const m = block.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/);
  if (!m) return null;
  return decodeEntities(m[1]).replace(/^\n+|\n+$/g, '');
}

cmd.region = (args, flags, json) => {
  const names = args.length ? args : regionMap().map((r) => r.name);
  const missing = names.filter((n) => !regionText(n));
  if (missing.length) return fail(`unknown region(s): ${missing.join(', ')}. Known: ${regionMap().map((r) => r.name).join(', ')}`);
  const out = names.map((n) => ({ region: n, css: regionText(n) }));
  emit(json, out, (rows) =>
    rows
      .map((r) => `/* ==== region ${r.region} ==== */\n${r.css.trimEnd()}`)
      .join('\n\n')
  );
};

cmd.regions = (args, flags, json) => {
  const rows = regionMap().map((r) => ({
    region: r.name,
    lines: `${r.from}-${r.to}`,
    classes: regionClasses(r.name),
  }));
  emit(json, rows, (r) =>
    r
      .map((x) => `${pad(x.region, 16)} ${pad(x.lines, 10)} ${x.classes.slice(0, 12).join(' ')}${x.classes.length > 12 ? ` +${x.classes.length - 12} more` : ''}`)
      .join('\n') + `\n\n${r.length} regions in styles/components.css. "mue region <name>" prints the CSS.`
  );
};

cmd.usage = (args, flags, json) => {
  if (!args.length) return fail('usage: mue usage .btn-primary');
  const wanted = args.map((a) => a.replace(/^\./, ''));
  const index = classIndex();
  const results = wanted.map((c) => {
    const regions = index.get(c) || [];
    const users = [];
    for (const item of catalog().items) {
      const text = read(item.path);
      if (new RegExp(`class="[^"]*\\b${c}\\b`, '').test(text)) users.push(item.id);
    }
    return { class: '.' + c, definedIn: regions, usedBy: users.slice(0, 12), usedByCount: users.length };
  });
  emit(json, results, (rows) =>
    rows
      .map(
        (r) =>
          `${pad(r.class, 20)} ${r.definedIn.length ? 'defined in: ' + r.definedIn.join(', ') : 'NOT in the shared sheet'
          }\n  used by ${r.usedByCount} preview(s): ${r.usedBy.join(', ')}${r.usedByCount > r.usedBy.length ? ' …' : ''}`
      )
      .join('\n')
  );
};

cmd.tokens = (args, flags, json) => {
  const filter = (typeof flags.filter === 'string' ? flags.filter : args[0] || '').toLowerCase();
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.css')) files.push(p);
    }
  })(TOKEN_DIR);
  const rows = [];
  for (const f of files.sort()) {
    const dark = rel(f).includes('dark');
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
      if (filter && !m[1].includes(filter)) continue;
      rows.push({ token: m[1], value: m[2].trim(), file: rel(f), darkOnly: dark });
    }
  }
  emit(json, rows, (r) =>
    r
      .slice(0, Number(flags.limit || 200))
      .map((x) => `${pad(x.token, 28)} ${pad(x.value, 34)} ${x.file}${x.darkOnly ? ' (dark)' : ''}`)
      .join('\n') + `\n\n${r.length} token declaration(s).`
  );
};

cmd.head = (args, flags, json) => {
  if (!args.length) return fail('usage: mue head <file.html|id>');
  const item = resolveItem(args);
  const fileRel = item ? item.path : rel(path.resolve(args[0]));
  const meta = readMeta(fileRel);
  const out = {
    path: fileRel,
    hasMetaBlock: meta.hasMeta,
    headComments: meta.headComments,
    sheets: [...read(fileRel).matchAll(/href="([^"]*\.css)"/g)].map((m) => m[1]),
    scripts: [...read(fileRel).matchAll(/src="([^"]*\.js)"/g)].map((m) => m[1]),
    fields: meta.fields,
  };
  emit(json, out, (o) =>
    [
      `${o.path}`,
      `MUE:META block: ${o.hasMetaBlock ? 'yes' : 'MISSING'} · comments in head: ${o.headComments}${o.headComments > 1 ? '  <-- parser hazard' : ''}`,
      `links: ${o.sheets.join(', ') || 'none'}`,
      `scripts: ${o.scripts.join(', ') || 'none'}`,
      '',
      ...Object.entries(o.fields).map(([k, v]) => `${pad(k + ':', 14)} ${v}`),
    ].join('\n')
  );
};

cmd.scaffold = (args, flags, json) => {
  const target = args[0];
  if (!target) return fail('usage: mue scaffold <out.html> --use btn-buttons cards');
  const uses = args.slice(1).concat(String(flags.use || '').split(/[,\s]+/)).filter(Boolean);
  const outPath = path.resolve(process.cwd(), target);
  const fromRel = rel(outPath);
  const depth = fromRel.split('/').length - 1;
  const up = '../'.repeat(depth);
  const index = classIndex();
  const blocks = [];
  const notes = [];
  for (const u of uses) {
    const item = resolveItem([u]);
    if (item) {
      const markup = extractMarkup(item.path);
      if (markup) {
        blocks.push(`<!-- from ${item.id} -->\n${indent(markup)}`);
        notes.push(`${item.id}: markup lifted from ${item.path}`);
      } else {
        notes.push(`${item.id}: no code panel — open ${item.path} and copy by hand`);
      }
    } else if (index.has(u.replace(/^\./, ''))) {
      blocks.push(`/* region ${index.get(u.replace(/^\./, '')).join(', ')} provides .${u.replace(/^\./, '')} */`);
      notes.push(`${u}: class lives in region ${index.get(u.replace(/^\./, '')).join(', ')}`);
    } else {
      notes.push(`${u}: not found — see "mue search ${u}"`);
    }
  }
  const usedRegions = new Set();
  for (const m of blocks.join('\n').matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      const r = index.get(c);
      if (r) r.forEach((x) => usedRegions.add(x));
    }
  }
  const sheetRef = [...usedRegions].map((r) => `styles/components.css#${r}`).join(', ');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MUE page</title>
<!-- BEGIN MUE:META
  KIND: PAGE
  FRAMEWORK: vanilla (HTML/CSS/JS, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, styles/mue.js (all linked in this head)
  ${sheetRef ? `SHEET: ${sheetRef} — every class below is defined there, so pasted markup arrives styled` : 'SHEET: styles/components.css'}
  THEME: light + dark (html.dark, persisted and synced by styles/mue.js)
  RESPONSIVE: inherits the sheet; add page rules only in the style block below
  VERIFIED: generated by tools/mue.js scaffold ${new Date().toISOString().slice(0, 10)}; run "node tools/mue.js check <this file>" after editing
  LICENSE: MIT
END MUE:META -->
<link rel="stylesheet" href="${up}design-tokens/engine.css">
<link rel="stylesheet" href="${up}styles/components.css">
<script src="${up}styles/mue.js" defer></script>
<style>
/* Page scaffolding only. Component rules belong in styles/components.css. */
.page { max-width: 72rem; margin: 0 auto; padding: var(--space-6); }
</style>
</head>
<body>
  <main class="page">
${blocks.length ? indent(blocks.join('\n\n'), 4) : '    <!-- paste markup here -->'}
  </main>
</body>
</html>
`;
  if (flags.stdout) {
    process.stdout.write(html);
    return;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');
  emit(json, { written: fromRel, uses, notes }, () =>
    `wrote ${fromRel}\n  links engine.css + components.css + mue.js from depth ${depth}\n` +
    notes.map((n) => '  · ' + n).join('\n')
  );
};

function indent(text, spaces = 2) {
  const g = ' '.repeat(spaces);
  return text.split('\n').map((l) => (l.trim() ? g + l : l)).join('\n');
}

/* `npx shadcn add button`, for this kit: the component AND the layers it needs,
   dropped into the caller's project so they own the code afterwards. */
cmd.add = (args, flags, json) => {
  if (!flags.into) return fail('usage: mue add <id>[,<id>] --into ../my-project [--minimal] [--force] [--create]');
  const into = path.resolve(process.cwd(), String(flags.into));
  if (!fs.existsSync(into)) {
    if (!flags.create) return fail(`${into} does not exist — re-run with --create, or point --into an existing project`);
    fs.mkdirSync(into, { recursive: true });
  }
  const force = Boolean(flags.force);
  const minimal = Boolean(flags.minimal);
  const sheetRel = minimal ? 'styles/components.trimmed.css' : 'styles/components.css';

  const wanted = [];
  for (const id of args.join(',').split(/[,\s]+/)) if (id) wanted.push(id);
  for (const key of Object.keys(flags)) {
    if (!key.startsWith('all')) continue;
    const sel = key.slice(3).replace(/^-/, '').toLowerCase();
    for (const i of catalog().items) {
      if (!sel || i.group.toLowerCase() === sel || i.category.toLowerCase() === sel) wanted.push(i.id);
    }
  }
  if (!wanted.length) return fail('nothing to add. Usage: mue add ui-cards btn-buttons --into ../app   or   mue add --all-components --into ../app');

  const plan = [];
  const seen = new Set();
  const misses = [];
  for (const raw of wanted) {
    const item = resolveItem([raw]);
    if (!item) {
      if (!misses.includes(raw)) misses.push(raw);
      continue;
    }
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const meta = readMeta(item.path);
    const markup = extractMarkup(item.path);
    const named = namedRegions(meta, item.path);
    const { regions, why } = closureRegions(named, markup);
    plan.push({ item, markup, named, regions, why, mode: markup ? 'markup' : 'page' });
  }

  // --minimal trims a snippet's CSS; a page copy links the whole sheet by design.
  const wantsWholeSheet = plan.some((p) => p.mode === 'page');
  const includeSheet = !minimal || wantsWholeSheet;
  const shippedSheetRel = includeSheet ? 'styles/components.css' : sheetRel;
  const shared = copySharedLayers(into, force, includeSheet, shippedSheetRel);

  let trimmed = null;
  if (minimal && !wantsWholeSheet) {
    const all = new Set(['tokens']);
    for (const p of plan) p.regions.forEach((r) => all.add(r));
    const union = sheetCacheGet().names.filter((n) => all.has(n));
    trimmed = copyInto(into, sheetRel, trimmedSheet(union), force);
    trimmed.regions = union;
  }

  const written = [];
  const notes = [];
  for (const p of plan) {
    const destRel = `mue/${p.item.id}.html`;
    const content =
      p.mode === 'markup'
        ? snippetPage(p.item, p.markup, shippedSheetRel, p.regions)
        : retargetAssets(read(p.item.path), p.item.path, destRel, minimal && !wantsWholeSheet ? null : shippedSheetRel);
    const res = copyInto(into, destRel, content, force);
    res.next = `open ${path.join(into, destRel)} in a browser, then gate edits: node tools/mue.js check "${path.join(into, destRel)}"`;
    written.push({ ...pick(p.item, 'id', 'name', 'group', 'category', 'path'), ...res, mode: p.mode, headerRegions: p.named, regions: p.regions, regionWhy: p.why, classesUsed: [...classesIn(p.markup)].sort(), tags: assetTags(destRel, shippedSheetRel) });
    if (p.mode === 'page') notes.push(`${p.item.id}: no code panel — installed the whole preview with its shared-layer links re-pointed; other repo links in it will dangle outside the kit`);
  }
  for (const m of misses) notes.push(`${m}: not in the catalog — see "mue search ${m}"`);
  if (minimal) notes.push(`--minimal ships ${shippedSheetRel} only, resolved one level deep. Linking styles/components.css whole is the safer default: a class added to your markup later may live in a region this file skipped.`);

  const out = {
    into,
    minimal,
    shared,
    trimmedSheet: trimmed,
    added: written,
    notes,
    counts: { added: written.length, sharedFiles: shared.length, misses: misses.length },
  };
  emit(json, out, (o) =>
    [
      `added ${o.added.length} component(s) into ${o.into}`,
      '',
      ...o.added.map(
        (a) =>
          `${a.file}  [${a.status}]  ${a.mode === 'markup' ? 'snippet' : 'full preview'}\n` +
          `  regions: ${a.regions.join(', ')}\n` +
          a.tags.map((t) => `  ${t}`).join('\n') +
          `\n  next: ${a.next}`
      ),
      o.trimmedSheet ? `\n${o.trimmedSheet.file} [${o.trimmedSheet.status}] ${o.trimmedSheet.regions.length} of ${sheetCacheGet().names.length} regions` : '',
      `\nshared layers: ${o.shared.length} file(s) — ${countBy(o.shared)}`,
      o.notes.length ? '\nNOTES\n' + o.notes.map((n) => '  · ' + n).join('\n') : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
};

function countBy(rows) {
  const t = {};
  for (const r of rows) t[r.status] = (t[r.status] || 0) + 1;
  return Object.entries(t).map(([k, v]) => `${v} ${k}`).join(', ');
}

/* The library as one machine-readable document — what an MCP wrapper, a website
   registry, or another agent would poll. */
cmd.registry = (args, flags) => {
  const data = catalog();
  const out = {
    name: 'MASTER-UI-ENGINE',
    version: data.version,
    generated: new Date().toISOString().slice(0, 10),
    description: data.description,
    license: 'MIT',
    layers: {
      tokens: 'design-tokens/engine.css',
      sheet: 'styles/components.css',
      behaviour: 'styles/mue.js',
    },
    install: 'node tools/mue.js add <id> --into <project> [--minimal] [--force] [--create]',
    regions: regionMap().map((r) => ({ region: r.name, classes: regionClasses(r.name) })),
    counts: { previews: data.items.length, regions: regionMap().length },
    items: data.items.map((item) => {
      const meta = readMeta(item.path);
      const markup = extractMarkup(item.path);
      const regions = closureRegions(namedRegions(meta, item.path), markup);
      return {
        id: item.id,
        name: item.name,
        group: item.group,
        category: item.category,
        path: item.path,
        kind: item.kind,
        framework: item.framework,
        variants: item.variants || [],
        theming: item.theming,
        license: item.license,
        header: meta.fields,
        regions: regions.regions,
        classesUsed: [...classesIn(markup)].sort(),
        selfContained: markup === null,
        linkTags: assetTags(item.path, 'styles/components.css'),
        markup,
      };
    }),
  };
  const group = typeof flags.group === 'string' ? flags.group : typeof flags.category === 'string' ? flags.category : '';
  const filter = group.toLowerCase();
  if (filter) out.items = out.items.filter((i) => i.group.toLowerCase() === filter || i.category.toLowerCase() === filter);
  out.counts.previews = out.items.length;
  // Always JSON: this is the endpoint, not a report.
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
};

cmd.check = (args, flags, json) => {
  const files = args.length && args[0] !== 'all' ? args : catalog().items.map((i) => i.path);
  const declared = declaredClasses();
  const report = [];
  let bad = 0;
  for (const f of files) {
    const text = read(f);
    const unresolved = [];
    for (const m of text.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) {
        if (!c || declared.has(c) || JS_MARKERS.has(c)) continue;
        if (inlineClass(text, c)) continue;
        unresolved.push(c);
      }
    }
    const headComments = (text.slice(0, text.toLowerCase().indexOf('</head>')).match(/<!--/g) || []).length;
    const item = resolveItem([f]);
    const meta = readMeta(f);
    const issues = {
      file: f,
      unresolved: [...new Set(unresolved)],
      headComments,
      missingMeta: !meta.hasMeta,
      missingSheetField: Boolean(item && sheetRegions(meta).length === 0 && meta.fields.SHEET === undefined && /styles\/components\.css/.test(text.slice(0, text.indexOf('</head>')))),
      noCodePanel: text.indexOf('class="code-wrap"') < 0,
    };
    if (issues.unresolved.length || issues.headComments > 1 || issues.missingMeta) bad++;
    report.push(issues);
  }
  emit(json, { checked: report.length, failing: bad, report: report.filter((r) => r.unresolved.length || r.headComments > 1 || r.missingMeta) }, (r) =>
    `${r.checked} files checked · ${r.failing} with issues\n` +
    r.report
      .map((x) => `${x.file}\n` + [
        x.missingMeta ? '  · no MUE:META block' : null,
        x.headComments > 1 ? `  · ${x.headComments} comments in <head> (relocates the document)` : null,
        x.unresolved.length ? `  · unresolved classes: ${x.unresolved.join(', ')}` : null,
      ].filter(Boolean).join('\n'))
      .join('\n')
  );
  // CI wants a non-zero exit, not a paragraph to read.
  if (bad) process.exitCode = 1;
};

/** True when the page defines the class itself in its own <style> block. */
function inlineClass(text, cls) {
  const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
  return styles.some((s) => new RegExp(`\\.${cls}\\b`).test(s[1]));
}

/** Every class the shared layers define: the token file and the component sheet. */
function declaredClasses() {
  const set = new Set();
  const css = [read(rel(SHEET))];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.css')) css.push(fs.readFileSync(p, 'utf8'));
    }
  })(TOKEN_DIR);
  for (const text of css) for (const m of text.matchAll(/\.([A-Za-z][\w-]*)/g)) set.add(m[1]);
  return set;
}

/** Classes set by styles/mue.js or by progressive-enhancement markers, never styled. */
const JS_MARKERS = new Set(['no-js', 'mue-js', 'mue-locked', 'dark', 'is-open', 'is-copied', 'open', 'active', 'hidden']);

cmd.doctor = (args, flags, json) => {
  const items = catalog().items;
  const regions = new Set(regionMap().map((r) => r.name));
  const rows = [];
  for (const item of items) {
    const meta = readMeta(item.path);
    const refs = sheetRegions(meta);
    for (const r of refs) {
      if (!regions.has(r)) rows.push({ file: item.path, problem: `SHEET cites region "${r}" which is not in components.css` });
    }
    if (!meta.hasMeta) rows.push({ file: item.path, problem: 'no MUE:META block' });
    if (meta.headComments > 1) rows.push({ file: item.path, problem: `${meta.headComments} comments in <head>` });
    if (!fs.existsSync(path.join(ROOT, item.path))) rows.push({ file: item.path, problem: 'catalog path does not exist' });
    if (item.id === undefined) rows.push({ file: item.path, problem: 'catalog entry has no id' });
  }
  const selfContained = items.filter((i) => sheetRegions(readMeta(i.path)).length === 0);
  const out = {
    previews: items.length,
    regions: regions.size,
    sheetBacked: items.length - selfContained.length,
    selfContained: selfContained.map((i) => i.path),
    problems: rows,
  };
  emit(json, out, (o) =>
    [
      `${o.previews} previews · ${o.sheetBacked} use the shared sheet · ${o.selfContained.length} still self-contained`,
      `${o.regions} regions in styles/components.css`,
      o.problems.length ? '\nPROBLEMS\n' + o.problems.map((p) => `  ${p.file}: ${p.problem}`).join('\n') : '\nno structural problems found',
      o.selfContained.length ? '\nCONVERSION BACKLOG (own <style>, no SHEET field)\n' + o.selfContained.map((p) => '  ' + p).join('\n') : '',
    ].join('\n')
  );
  // The conversion backlog is information; a broken header or a dangling SHEET
  // reference is a failure.
  if (rows.length) process.exitCode = 1;
};

cmd.serve = (args, flags) => {
  require(path.join(__dirname, 'audit', 'serve.js'));
};

cmd.help = () => {
  process.stdout.write(
    `MUE — reuse what is already designed.

  search "<words>"        find a preview by what it looks like
  show <id|path>          header, what to link, and the copy-ready markup
  regions                 the ${regionMap().length} CSS copy units in styles/components.css
  region <name>...        the exact CSS of a copy unit
  usage .class            which region defines it, which previews use it
  tokens [--filter x]     every custom property with its value and file
  head <file|id>          structured MUE:META for one preview
  scaffold <out> --use a,b  a page wired to the shared sheet with that markup
  add <id>... --into <dir>  install the component + the layers it needs into your project
  registry               the whole library as one JSON document (machine endpoint)
  check <file|all>        unresolved classes, broken headers, missing metadata
  doctor                  catalog/header/sheet consistency + conversion backlog
  serve                   the visual lab at http://127.0.0.1:8791

  --json on any command. Read AGENTS.md before building: the rule is
  reuse a preview, never invent generic UI.
`
  );
};

/* --------------------------------------------------------------------- main */

const parsed = parseArgs(process.argv.slice(2));
const command = parsed._[0] || 'help';
const handler = cmd[command];
if (!handler) {
  fail(`unknown command "${command}". Run: node tools/mue.js help`);
} else {
  try {
    handler(parsed._.slice(1), parsed.flags, Boolean(parsed.flags.json));
  } catch (err) {
    fail(err.message);
  }
}
