---
name: master-ui-engine
description: Use when building or restyling any UI — components, pages, dashboards, landing pages, forms, charts — so the agent reuses the MASTER-UI-ENGINE library instead of generating generic interfaces. Also use for design tokens, light/dark theming, CSS component kits, and installing a designed component into another project.
argument-hint: "[component or page to build]"
license: MIT
metadata:
  author: MASTER-UI-ENGINE contributors
  version: "1.0.0"
---

# MASTER-UI-ENGINE

One design system in vanilla HTML/CSS/JS: `design-tokens/` (tokens), `styles/components.css` (31 `#region` copy units), `styles/mue.js` (theme toggle, tabs, dialogs, toasts, accordions), 46 self-contained previews, and `tools/mue.js` — a zero-dependency CLI that is the library's API. Run it from the repo root; never read the 3000-line sheet or a whole preview into context to answer one question.

## Order of operations (non-negotiable)

1. **Search** the library. A blank file is a failure, not a start.
2. **Read the contract** of the winner: `show <id>` gives its `SHEET:` regions, the tags to link, and the exact markup to copy.
3. **Lift the region CSS** — link `styles/components.css`, or take `region <name>` verbatim.
4. **Build** with the preview's classes and tokens. Re-theme by overriding a custom property; re-time by overriding `--duration-*` / `--ease-*`. Never rewrite a component rule for one page.
5. **Gate** with `check <file>`, then `doctor` if you touched the library.

## The commands (real output)

```bash
node tools/mue.js search "pricing card"
  ui-cards               Cards                  components/cards/cards.html
    regions: cards
    matched: name

node tools/mue.js show ui-cards          # HEADER · TO LINK · CSS YOU NEED · MARKUP
node tools/mue.js regions                # 23 copy units: tokens chrome buttons fields choice cards ...
node tools/mue.js region cards           # /* #region cards */ .card { display: flex; ... #endregion
node tools/mue.js usage .btn-primary
  .btn-primary         defined in: buttons
    used by 21 preview(s): btn-buttons, ui-cards, ui-dialogs, ...
node tools/mue.js tokens --filter tint
  --tint-primary               hsla(var(--color-primary-500) / 0.12)  design-tokens/colors/semantic.css
node tools/mue.js head <file|id>         # MUE:META fields, links, scripts, head-comment count
node tools/mue.js scaffold page.html --use ui-cards btn-buttons
node tools/mue.js check all              # 46 files checked · 0 with issues
node tools/mue.js doctor                 # 54 previews · 41 use the shared sheet · 13 still self-contained
```

`--json` on any of them. `help` lists every command.

## Install into another project

```bash
node tools/mue.js add ui-cards --into ../my-app
  mue/ui-cards.html  [written]  snippet
    regions: tokens, buttons, cards, badges, feedback, utilities
    <link rel="stylesheet" href="../design-tokens/engine.css">
    <link rel="stylesheet" href="../styles/components.css">
    <script src="../styles/mue.js" defer></script>

node tools/mue.js add ui-cards,frm-input-fields --into ../app --force
node tools/mue.js add --all-marketing --into ./site --create   # every preview in that group/category
node tools/mue.js registry                                      # the whole library as one JSON document
```

`add` copies `design-tokens/**` + `styles/components.css` + `styles/mue.js` into the target once, writes a runnable `mue/<id>.html` per item, and prints the tags at the correct depth. Identical files are skipped, differing files are kept unless `--force`, nothing is deleted, nothing is written outside `--into`. Default ships the sheet whole; `--minimal` ships `styles/components.trimmed.css` — `tokens`, the regions the header names, the regions the markup's classes live in, and one transitive level after that. A class you add by hand later can live in a region that pass never saw, so **linking `styles/components.css` wholesale is the safer default**.

## Token rules agents get wrong

- **Primitives are raw HSL triplets**: `hsl(var(--color-primary-500))`. Semantics already resolve to a color: `var(--text-secondary)`, no `hsl()`. A bare triplet is invalid CSS and gets dropped silently — and never assign a triplet to `--color-primary` / `--text-primary`.
- **Prefer semantics**; they flip with `html.dark`. Solid light tints like `hsl(var(--color-primary-50))` do not — use `--tint-primary` / `--tint-primary-strong`.
- **`.invert`** on a container re-declares the semantics for its subtree: that is how a dark panel inside a light page is done. No per-component dark rules. Text on a hand-painted gray-900/950 surface uses the opposite end of the ramp (`--color-gray-50`, `--color-gray-300`).
- **Motion is composite**: `var(--motion-colors)`, `--motion-lift`, `--motion-press`, `--motion-reveal`, from `design-tokens/motion/scale.css`. Nothing hardcodes `0.2s ease`; `prefers-reduced-motion` is already handled by the engine.
- **One** `<!-- BEGIN MUE:META … END MUE:META -->` comment in `<head>`, never a paired `<!-- /MUE:META -->`: extra comments make the parser relocate the field lines and the document into `<body>`.
- **The page `<style>` is scaffolding only** (the grid that places variants, a widget with no region). A component rule the sheet lacks belongs in the sheet's right `#region`, not in the page.
- No build step, no CDN, no web fonts: the only loads are `engine.css`, `components.css`, `mue.js`, by relative path.

## Quality gate before "done"

- [ ] `node tools/mue.js check <file>` clean, `doctor` shows no new problems
- [ ] Opens directly in a browser and renders styled (verify the relative depth)
- [ ] Every class resolves — sheet, tokens, or genuine scaffolding; `SHEET:` names the regions used
- [ ] No hardcoded brand color or duration; overriding a token was the only restyle
- [ ] Both themes legible, AA contrast, no horizontal overflow at 320/375/768/1200
- [ ] Keyboard reachable with a visible `:focus-visible` ring; interactions actually work
- [ ] New component: added to a `#region`, has a `.code-wrap` panel with `data-section="region[,region]"`, catalog entry + `build-catalog.ps1` re-run, license and attribution recorded

`AGENTS.md` is this repo's law; this file is the portable behaviour pack. When they disagree, `AGENTS.md` wins.
