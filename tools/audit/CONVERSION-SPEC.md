# MASTER-UI-ENGINE preview conversion spec

Goal: each component preview stops carrying its own copy of the page chrome and
component CSS and instead links the shared layer, so pasted markup arrives
styled and one edit to the shared sheet re-themes every preview.

Reference conversion (already done, copy this pattern exactly):
`components/buttons/buttons.html`

Shared files (READ ONLY — never edit them):
- `design-tokens/engine.css` (token entry point, already imports motion/scale.css)
- `design-tokens/motion/scale.css` (`--duration-*`, `--ease-*`, `--lift-hover`, `--reveal-shift`, `--motion-colors`, `--motion-lift`, ...)
- `styles/components.css` (canonical component rules, split into `/* #region name */` blocks)
- `styles/mue.js` (theme toggle, copy buttons, tabs, dropdowns, dialogs, toasts, reveal, count-up)

## 1. Head

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- BEGIN MUE:META
  ...keep every existing field, then update these three lines...
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, styles/mue.js (all linked in this head)
  SHEET: styles/components.css#<region> — the classes below are defined there
  MOTION: durations and easings come from design-tokens/motion/scale.css; nothing here hardcodes a time
  RESPONSIVE: <what actually happens, in plain words>
END MUE:META -->
<title>Name | MASTER-UI-ENGINE</title>
<link rel="stylesheet" href="{DEPTH}design-tokens/engine.css">
<link rel="stylesheet" href="{DEPTH}styles/components.css">
<script src="{DEPTH}styles/mue.js" defer></script>
<style>
  /* page-specific demo layout only */
</style>
</head>
```

`{DEPTH}` is `../` per directory level from the file to the repo root. `components/forms/input-fields.html`
uses `../../`; `components/forms/date-picker/date-picker.html` uses `../../../`.

The MUE:META block MUST stay a single comment with exactly one `BEGIN` and one `END`.
Two adjacent comments in `<head>` relocate the rest of the document into `<body>` — a real
parser hazard in this repo's history.

## 2. Body

- `<body class="page">`
- header: `<header class="masthead">` containing `<div><div class="brand">…</div><div class="meta">Components &gt; X</div></div>`
  and the toggle:

```html
<button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">
  <span data-theme-state>Dark mode</span><span class="dot" aria-hidden="true"></span>
</button>
```

- delete the page's inline theme-toggle `<script>` entirely; `styles/mue.js` owns it now.
  Delete any other inline script whose job mue.js covers (tabs, dropdown, dialog, toast,
  reveal, count-up). If the page has behaviour mue.js does not cover, keep that script and
  list it in your report.
- headings: one `h1`, then `h2` per section; never skip a level.
- keep the `.meta-card` block, update the `Defined in:` line to name the region.

## 3. CSS: what to delete vs keep

Delete from the page `<style>` every rule that `styles/components.css` already defines —
chrome (`.shell`, `.brand`, `.meta`, `.subtitle`, `.section`, `.meta-card`, `.code-wrap`,
`.code-bar`, `pre`, `.theme-toggle`, `.dot`, `.hl-attr`, `.hl-val`) and component families
(buttons, fields, checkbox/radio/switch/slider, cards, badges/chips, tabs, navbar/sidebar/
breadcrumbs/pagination, dropdown, modal/dialog, toast/alert, tables, skeleton/progress/
empty/error/tooltip, chart frame/legend, footer, `.stack/.row/.grid-auto/.truncate/.reveal`).

Keep, in the page `<style>`, only what is specific to that preview: demo grids, a bespoke
widget the sheet has no region for (e.g. the calendar grid), and any rule the sheet lacks.
Everything you keep must:
- use tokens, never a literal color, duration or easing;
- use semantic tokens (`var(--text-secondary)`, `var(--bg-surface)`, `var(--tint-primary)`)
  rather than `hsl(var(--color-gray-600))` — semantic tokens flip correctly in dark mode,
  raw primitives do not always;
- never use a solid light tint such as `hsl(var(--color-primary-50))` for a background or
  text colour; use `--tint-primary` / `--tint-primary-strong`.

If a component genuinely needs a rule the shared sheet is missing, DO NOT add it to
`styles/components.css`. Keep it in the page `<style>` for now and report the exact CSS
block plus the region it belongs to — the sheet is edited centrally.

## 4. Copy target

Every preview ends with a code block that the shared script attaches Copy buttons to:

```html
<div class="code-wrap" data-section="buttons">
  <div class="code-bar"><span>Markup</span></div>
<pre><code>&lt;escaped markup&gt;</code></pre>
</div>
```

`data-section` is the components.css region name(s) the snippet needs (comma-separated).
Escape `<` and `>` inside `<code>`. Do not hand-write a copy button — mue.js injects both.

## 5. Markup

Rename local class names to the shared equivalents where they map 1:1 (e.g. `.button` →
`.btn-primary`, `.input` → inside `.field`, `.pill` → `.badge`). Where a local class has no
shared equivalent, keep it. Do not invent new variants in the page.

## 6. Responsive + motion requirements per page

- nothing may overflow horizontally at 320px; use `.grid-auto`, `flex-wrap`, `min-width:0`
  on flex children that contain long text or inputs;
- interactive elements must be ≥36px tall (44px by default via `--control-h`);
- interactive transitions must use the composite tokens (`--motion-colors`,
  `--motion-lift`, `--motion-press`) not a literal `0.2s ease`;
- no `scroll-behavior: smooth` (breaks programmatic scroll in background tabs).

## 7. Report

Reply with, per file: path, the regions you relied on, any CSS you had to keep locally and
why, and anything you think belongs in the shared sheet (exact block + target region).

## 8. Sheet inventory (21 regions, styles/components.css)

`tokens, chrome, buttons, fields, choice, cards, badges, tabs, navigation, sidebar, dropdown,
overlays, notifications, tables, feedback, charts, footers, display, utilities, shell, chat`

`shell` is the app frame: `.app` (+ `.is-locked` when the frame must fill the viewport and
scroll internally), `.app > .main`, `.content`, `.page-head`, `.content-grid` (override its
column split with `--grid-cols`), `.sidebar nav`.
`chat` is the conversation surface: `.thread`, `.msg` / `.msg.ai` / `.msg.user` /
`.msg.typing` / `.msg.is-streaming`, `.bubble`, `.composer`, `.composer-form`, `.chat-head`,
`.chat-item`, `.conversation-list`.

`.theme-toggle` is global now (no longer `.page`-scoped), so an app mock-up can use the shared
toggle markup without adopting any other doc chrome.

## 9. Which body class an example or template gets

- Documentation-style single-column page → `<body class="page">`, `.shell`, `.masthead`, `.section`.
- Full app mock-up (dashboard, chat, storefront, auth screen) → no `page` class; use the
  `shell`/`chat` classes plus the component families, and keep only the page's own layout
  helpers in `<style>`.

## 10. Gate — run it, then report its output

```
node "C:/Users/NIYOMUGABO Steven/Documents/Qoder/2026-10-31/b7c393d1/audit/check-classes.js" <file.html>
```

A converted file must report: `HEAD comments: 1`, `sheet: 1`, `mue.js: 1`, `UNRESOLVED(0)`,
`RAWPRIM … 0`, `SUBLTINT: 0`, `HARDCODED-MOTION: 0`, `SMOOTH: false`, `BALANCE … 0`.
Fix and re-run until clean. Do not edit the checker or any shared file to make it pass.
