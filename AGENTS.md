# AGENTS.md — Instructions for AI Coding Agents

This file tells OpenCode, Codex, Claude Code, and other AI coding agents how
to use MASTER-UI-ENGINE to build user interfaces without generating generic
interfaces from scratch.

`SKILL.md` (repo root) is the installable, portable version of these rules — the
same order of operations, token rules and quality gate in skill-pack frontmatter
that an agent loads on any "build or restyle this UI" task. Install it by copying
this repo, or `SKILL.md` on its own, into your client's skills directory: Claude
Code, Codex and OpenCode each keep one, and the path differs per client and
version, so see your client's skills-directory docs. Then call it by name
(`/master-ui-engine`) or let its trigger description load it. This file stays the
repo law: when the two disagree, `AGENTS.md` wins.

## Purpose

MASTER-UI-ENGINE is a reusable UI/UX component library. Every file under
`components/`, `examples/`, and `templates/` is a browser-rendered HTML document
with no build step. The 33 component previews and the 6 starter templates draw
on three shared files — the tokens (`design-tokens/engine.css`), the component
sheet (`styles/components.css`), and the behaviour layer (`styles/mue.js`). The
15 `examples/` pages and the visual lab predate that conversion and still
carry their own copy of the chrome.

**Prefer reuse over reinvention**: search this library first, then adapt a
selected component to the target project rather than designing from a blank
canvas.

The library currently holds 54 previews — 33 components, 15 example pages, and
6 starter templates. There are no React/Vue ports and no third-party design
system packs yet; everything is vanilla HTML/CSS/JS driven by one token system.

## Agent workflow (mandatory)

```
DISCOVER PROJECT → IDENTIFY FRAMEWORK → UNDERSTAND BRAND
    → SEARCH THE LIBRARY → SELECT A COMPONENT → ADAPT AND IMPLEMENT
    → REVIEW UI/UX → TEST FUNCTIONALITY → VERIFY RESPONSIVENESS
```

### 1. DISCOVER PROJECT

Inspect the target project to determine:
- Frontend framework (React, Vue, Svelte, Next.js, vanilla HTML/JS, …)
- Styling solution (Tailwind, plain CSS, CSS modules, styled-components)
- Build tool (Vite, webpack, Next.js, none)
- Existing design system or component library, if any

### 2. IDENTIFY FRAMEWORK

Ask the repository which stacks it actually ships before you decide to port anything:

```bash
node tools/mue.js stack
  vanilla:           54/54 entries live
  react:             14/54 entries live
  vue:               14/54 entries live
  web-components:    14/54 entries live
  svelte:            0/54 entries live, 14 documented as planned
  angular:           0/54 entries live, 14 documented as planned
```

- **HTML/CSS/JS** — `components/*`, `examples/*`, `templates/*`. Everything is available.
- **React 19** — `frameworks/react/` (16 components: button, input, textarea, select,
  checkbox, radio, switch, card, badge, dialog, dropdown, tabs, accordion, table,
  notification, avatar). `node tools/mue.js show <id> --framework react` prints that
  binding's contract and its full source.
- **Vue 3** — `frameworks/vue/`, the same sixteen as `<script setup>` SFCs.
- **Any framework that can render custom elements, and vanilla too** —
  `frameworks/web-components/`: 21 light-DOM `<mue-*>` tags, no build step, no shadow root.
- **Svelte and Angular** — no source. `frameworks/svelte/ARCHITECTURE.md` and
  `frameworks/angular/ARCHITECTURE.md` describe how they would be built. For those
  projects, and for the 40 catalogued entries with no binding, port the vanilla markup
  and the token variables; the CSS is framework-agnostic and translates directly.

A binding is not a second design system. It writes the classes already defined in
`styles/components.css` and ships no stylesheet of its own; `tools/audit/framework-parity.mjs`
fails the build if it invents one.

### 3. UNDERSTAND BRAND

Before selecting a component, identify:
- Primary/secondary colors (brand guidelines or existing CSS variables)
- Typography (family, scale, weights)
- Border radius, shadow style, spacing scale
- Light/dark mode requirement

The canonical token system lives in `design-tokens/`. Adapt components by
overriding those custom properties, not by editing every rule.

### 4. SEARCH MASTER-UI-ENGINE

`showcase/data/component-catalog.json` is the machine-readable index. Each
entry carries `id`, `name`, `group`, `category`, `path`, `framework`,
`designSystem`, `variants`, `breakpoints`, `theming`, `license`, and a
`verified` note. Filter it by:
- group — `Components`, `Examples`, `Templates`
- category — `buttons`, `forms`, `navigation`, `cards`, `tables`, `charts`,
  `dialogs`, `modals`, `dropdowns`, `sidebars`, `footers`, `notifications`,
  `feedback`, plus the page categories
- name or path

Every preview also repeats that metadata in an HTML comment between
`<!-- BEGIN MUE:META` and `END MUE:META -->` at the top of the file, so you can
read one file without opening the catalog.

Do not grep your way through 46 HTML files. `tools/mue.js` is the query API for
this library and it is the fastest route from a request to a reusable answer:

```bash
node tools/mue.js search "card grid"        # ranked previews + the regions each uses
node tools/mue.js show ui-cards              # header, tags to link, markup to copy
node tools/mue.js region cards             # the exact CSS of one copy unit
node tools/mue.js usage .btn-primary       # where a class is defined, who uses it
node tools/mue.js tokens --filter radius    # token names, values, files
node tools/mue.js scaffold page.html --use ui-cards btn-buttons
node tools/mue.js add ui-cards --into ../my-app   # install: the snippet + the layers it needs, into your project
node tools/mue.js registry                        # the whole library as one JSON document (machine endpoint)
node tools/mue.js check all                 # the gate, across the library
node tools/mue.js doctor                    # catalog / header / sheet consistency
```

`--json` on any of them. See `tools/README.md`.

Folders are the fallback:
- `components/buttons/`, `components/forms/`, `components/navigation/`,
  `components/cards/`, `components/tables/`, `components/charts/`,
  `components/dialogs/`, `components/modals/`, `components/dropdowns/`,
  `components/notifications/`, `components/sidebars/`, `components/footers/`,
  `components/feedback/`
- `examples/*` — dashboards, analytics, ecommerce, marketplaces, apps, auth,
  landing, portfolio, booking, education
- `templates/*` — saas, dashboards, ecommerce, marketplaces, web-applications

### 5. SELECT AND ADAPT

1. Open the candidate file directly (`showcase/index.html` renders them side by
   side with 375 / 768 / 1200 width switches) and compare 2–3 variants.
2. Copy the exact markup out of the file — do not retype from memory. You do
   not need its CSS: every class the preview uses is defined in
   `styles/components.css`, split into `/* #region name */` blocks listed in the
   file's `SHEET:` header line.
3. Bring the layer with it. The shortest path is three lines in the project
   head, using the same relative depth the preview uses:

   ```html
   <link rel="stylesheet" href="design-tokens/engine.css">
   <link rel="stylesheet" href="styles/components.css">
   <script src="styles/mue.js" defer></script>
   ```

   `mue.js` is optional but it is what gives you the working theme toggle, tabs,
   dropdowns, dialogs, toasts, accordions and the Copy buttons — including
   **Copy + CSS**, which puts just the `#region` blocks a snippet needs on the
   clipboard for projects that would rather inline them than link a sheet. Or
   let the CLI do the whole install — `node tools/mue.js add ui-cards --into ../app`
   copies `design-tokens/**`, `styles/components.css` and `styles/mue.js` into
   that project and writes a runnable `../app/mue/ui-cards.html` whose links are
   already at the right depth (`--minimal` ships only the regions used; linking
   the sheet whole is the safer default). Or copy
   `design-tokens/**` + `styles/**` into the project by hand, or map the tokens
   onto the project's own variables.
4. Replace the brand primitives (`--color-primary-*`, the grayscale ramp) with
   the target brand values; the semantics and every component follow.
5. Put the component under the project's own component folder, not into
   MASTER-UI-ENGINE, unless you are contributing it back.
6. Preserve existing application functionality — never break working features
   to add a UI component.

Pick one visual language per project and keep it consistent. The library is
one design system; mixing it with a third-party kit in the same screen needs a
clear reason.

## File conventions

Header block, emitted by `showcase/data/build-catalog.ps1` and kept in sync
with the catalog:

```html
<!-- BEGIN MUE:META
  COMPONENT: Tables
  ID: ui-tables
  GROUP: Components
  CATEGORY: tables
  FRAMEWORK: vanilla (HTML/CSS/JS, no build step)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: design-tokens/engine.css, styles/components.css, styles/mue.js (all linked in this head)
  SHEET: styles/components.css#tables — wrap, cells, sticky head, striped/compact and the [data-sort] caret are defined there; badges come from #badges, row actions from #buttons
  THEME: light + dark (html.dark, persisted and synced by styles/mue.js)
  VARIANTS: Default, With row actions
  MOTION: durations and easings come from design-tokens/motion/scale.css; nothing here hardcodes a time
  RESPONSIVE: reflows at <=768px
  VERIFIED: WCAG AA contrast in light + dark and no overflow at 375/768/1280, audited 2026-10-31
  CATALOG: showcase/data/component-catalog.json#ui-tables
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<title>Tables | MASTER-UI-ENGINE</title>
<link rel="stylesheet" href="../../design-tokens/engine.css">
<link rel="stylesheet" href="../../styles/components.css">
<script src="../../styles/mue.js" defer></script>
```

It is one comment, not two: `<!-- MUE:META -->` … `<!-- /MUE:META -->` leaves the
field lines as raw text inside `<head>`, and the parser then relocates them and
the rest of the document into `<body>`.

Rules for a preview file:
- No build step and no network dependencies: fonts, CDNs and JS libraries stay
  out. The only files a preview loads are `design-tokens/engine.css`,
  `styles/components.css` and `styles/mue.js`, all three by relative path.
- Link all three (adjust the relative depth for the folder). A preview's job is
  to show shared markup, so it must not re-declare the CSS it demonstrates:

  ```html
  <link rel="stylesheet" href="../../design-tokens/engine.css">
  <link rel="stylesheet" href="../../styles/components.css">
  <script src="../../styles/mue.js" defer></script>
  ```

- The page `<style>` holds demo scaffolding only — the grid that places the
  variants, a bespoke widget the sheet has no region for. If a component needs
  a rule the sheet lacks, the sheet is the fix: add it to the right
  `#region` block, never quietly in the page.
- Colors come from tokens: `hsl(var(--color-gray-700))` for primitives,
  `var(--text-secondary)` for semantics. Never a hardcoded hex on new work.
  A raw triplet without `hsl()` is invalid CSS and gets dropped silently.
- Prefer semantic tokens over primitives — they flip with the theme. Solid light
  tints like `hsl(var(--color-primary-50))` are not theme-safe; use
  `--tint-primary` / `--tint-primary-strong`.
- For a panel that should read dark inside a light page, put `.invert` on the
  container: it re-declares the semantic tokens for its subtree, so the shared
  components restyle themselves. No per-component dark rules.
- Motion uses the tokens in `design-tokens/motion/scale.css` — `--duration-*`,
  the named easings and the composites (`--motion-colors`, `--motion-lift`,
  `--motion-press`, `--motion-reveal`). Nothing hardcodes `0.2s ease`.
- End the page with a `.code-wrap` block holding the escaped markup; `mue.js`
  injects Copy markup / Copy + CSS. Give it `data-section="region[,region]"` so
  the CSS slice knows which regions the snippet needs. Do not hand-write copy
  buttons.
- Text on a hand-painted dark surface (gray-900/950 backgrounds such as footers
  and nav rails) uses the *opposite end* of the ramp — `--color-gray-50` for
  primary text, `--color-gray-300` for secondary. Mid-ramp greys fail in both
  themes there. `.invert` is the better answer when the band is a card or a
  shell region, not a bespoke gradient.
- A dark toggle flips `class="dark"` on `<html>` and stores the choice in
  `localStorage["mui-theme"]`. `mue.js` does both, syncs across frames, and adds
  `mue-js` to `<html>` so `.reveal` can never leave a page blank when the
  behaviour layer fails to load.

## Adding a new component

1. Add its rules to `styles/components.css`, in an existing `#region` when the
   family is already there and a new `#region name` / `#endregion name` pair
   when it is not. The sheet is the single paste target — one edit there
   re-themes every preview.
2. Create `components/<category>/<name>.html` following the rules above. Its
   markup uses only classes the sheet defines.
3. Add an entry to `showcase/data/component-catalog.json` (`id`, `name`,
   `group`, `category`, `path`, `framework`, `designSystem`, `variants`,
   `license`, plus the derived fields you can compute: `breakpoints`,
   `theming`).
4. Run `powershell -File showcase/data/build-catalog.ps1` to refresh
   `showcase/data/catalog.js` (what the lab loads) and the per-file headers.
5. Open it in the lab at 375 / 768 / 1200 in both themes.

## Quality gates (before declaring a component done)

- [ ] `node tools/mue.js check <file>` is clean, and `doctor` reports no
      new problems
- [ ] Renders correctly when opened directly in a browser
- [ ] Links `design-tokens/engine.css`, `styles/components.css` and
      `styles/mue.js`; no hardcoded brand colors
- [ ] Every class in the markup resolves — either the sheet, the tokens, or a
      page rule that is genuinely demo scaffolding
- [ ] `SHEET:` header names the `#region`(s) the page draws on
- [ ] Ends with a `.code-wrap` block; `mue.js` adds working Copy markup /
      Copy + CSS buttons to it
- [ ] All variants display and switch correctly
- [ ] Dark toggle flips `html.dark` and the page stays legible
- [ ] Text contrast meets WCAG AA (4.5:1 body, 3:1 large) in light and dark
- [ ] No horizontal overflow at 320 / 375 / 768 / 1200
- [ ] Keyboard navigable, with a visible `:focus-visible` ring
- [ ] Motion respects `prefers-reduced-motion` and uses `motion/scale.css`
      tokens rather than literal durations
- [ ] Catalog entry added and `build-catalog.ps1` re-run
- [ ] License and attribution recorded

## Review checklist (the house standard)

- Clear visual hierarchy; consistent typography and spacing
- Meaningful animation only — no decorative excess
- No glassmorphism, heavy gradients, or oversized cards unless brand demands
- Real content and working interactions — no dead buttons or placeholder charts
- Iconography is inline SVG driven by `currentColor`, not emoji or gray boxes

## Do not

- Do not generate a generic interface from scratch when a component exists here.
- Do not mix multiple design systems in one interface without a clear reason.
- Do not include non-functional buttons or fake interactions.
- Do not hardcode brand colors; use design tokens.
- Do not ship an example without a visual preview that renders standalone.
- Do not hand-edit `showcase/data/catalog.js` — regenerate it.
- Do not hand-edit anything under `site/engine/` — it is a build copy of these previews (`node site/build.mjs`), and it is not committed.
- Do not add a catalog entry without a one-line `summary`: `mue search`, `mue show` and the product site all show it in place of generated filler.
