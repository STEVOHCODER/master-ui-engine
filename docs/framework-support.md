# Framework support matrix

What exists as source in this repository, as opposed to what is planned. Every
row is either a file you can open or a document that says it is not built yet.
Nothing here is a claim about a framework the repo does not carry.

| Component | HTML/CSS/JS | React | Vue | Web Components | Svelte | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| Buttons (`btn-buttons`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Input Fields (`frm-input-fields`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Select Menus (`frm-select-menus`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Checkboxes (`frm-checkboxes`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Switches (`frm-switches`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Radio Buttons (`frm-radio-buttons`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Date Picker (`frm-date-picker`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| File Upload (`frm-dropzone`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Cards (`ui-cards`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Marketing Sections (`ui-sections`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Tables (`ui-tables`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Charts (`ui-charts`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Rating (`ui-rating`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Dialogs (`ui-dialogs`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Popover (`ui-popover`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Modals (`ui-modals`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Dropdowns (`ui-dropdowns`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Notifications (`ui-notifications`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Footers (`ui-footers`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Progress (`fb-progress`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Skeleton (`fb-skeleton`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Empty state (`fb-empty`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Error state (`fb-error`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Stepper (`fb-stepper`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Breadcrumbs (`nav-breadcrumbs`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Header Navigation (`nav-header`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Navigation Menu (`nav-menu`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Pagination (`nav-pagination`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Tabs (`nav-tabs`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Sidebar (`nav-sidebar`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Data Table (`ui-datatable`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Descriptions (`ui-descriptions`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |
| Tour and Float Buttons (`ui-guidance`) | `stable` | `stable` | `stable` | `stable` | `planned` | `planned` |

Of the 54 catalogued entries, 33 are components and every one of them exists in
HTML/CSS/JS; 33 also have a React binding, 33 a Vue one and 33 a Web Component. The
remaining 21 entries — 15 examples and 6 templates — are compositions rather than
controls, so they ship as HTML/CSS/JS only and the library page hides the stack tabs for
them. Svelte and Angular are `planned` for all 33: one architecture document per stack
sets out how each binding would write the same classes, and no source file exists for
any of them.

Statuses used by the matrix:

- **stable** — source, preview and a recorded check.
- **experimental** — source and preview exist and compile, but the recorded check
  stops short of the browser matrix `stable` demands. No entry in this registry
  currently carries it; a binding loses the label only by being driven again.
- **planned** — no source files. Only an architecture document. The site labels
  these as absent instead of showing an empty tab.
- **unsupported** — no source and no plan.

## The rule behind the matrix

One design, several houses. `design-tokens/engine.css` holds the values and
`styles/components.css` holds every class; a framework package writes those
classes and adds the behaviour that framework needs (focus, keyboard, state).
A binding never carries its own stylesheet, its own colour, or its own radius.

That is what `tools/audit/framework-parity.mjs` enforces:

```bash
node tools/audit/framework-parity.mjs          # fail the build on drift
node tools/audit/framework-parity.mjs --write  # merge the registry into the catalog
```

It checks five things and exits non-zero on any of them: every path named in
`frameworks/registry.json` is a real file; every class a binding writes — in its
sources *and* in its preview page — is defined in the shared stylesheet layer (a token
like `card-` is treated as a prefix and matched against the sheet); every
`stable`/`experimental` binding has a `verified` note naming a command or a check; every
source file carries a `MUE:META` block with `LICENSE` and `ATTRIBUTION`; and a planned
entry is refused if it lists source files, so "planned" cannot quietly become "we think
it exists".

The same run harvests each component's contract — `VARIANTS`, `PROPS`, `A11Y`,
`KEYBOARD`, `EVENTS`, `DEPENDENCIES`, `SHEET`, `PORTS` — out of the `MUE:META` block and
writes it into `showcase/data/component-catalog.json` as `frameworks.<name>.spec`. That
is the copy the preview page renders and `node tools/mue.js show <id> --framework vue`
prints, so the docs, the site and the CLI cannot each invent their own list of props.

Latest roll-up (2026-11-01): `OK 0 error(s), 68 note(s), 33 components, 404 classes
defined in the shared layer`, licence `MIT` on every binding, attribution
`MASTER-UI-ENGINE contributors` on every binding — nothing in `frameworks/` is a
re-skinned third-party component, and the only third-party code in the deployed tree is
the React/Vue runtime inside the two committed preview bundles.

## What the 2026-11-01 runs recorded

| Package | Command | Result as run |
| --- | --- | --- |
| React | `node frameworks/react/build.mjs`, then the built `preview/gallery.html` driven by puppeteer-core in headless Chrome and Edge | 34 modules in `components/` covering all 33 catalogued components; `preview/preview.js` 317.2 KiB with the React runtime bundled in, so the preview makes zero remote requests; 34 `.section` blocks rendered; 46/46 behaviour probes at 1280px and 46/46 at 390px in light and dark with `0` console errors; axe-core 0 serious/critical across 8 runs (2 widths x 2 themes x 2 browsers); dialog focus trap + Escape return, tab roving + `End`, switch `Space`, dropdown arrows/wrap/Escape/select, accordion single-open, table `aria-sort`, field `is-error`/`aria-invalid`, toast dismiss, theme persisted |
| Vue | `node frameworks/vue/build.mjs` (vite 8.3.5 + @vitejs/plugin-vue), then the built gallery driven the same way | 37 single-file components in `components/`; 46 modules transformed, `preview/dist/preview.js` 163,580 bytes (52.82 kB gzip), rebuild byte-identical; 37 `#section-*` blocks rendered; the same 46/46 probes at both widths in both browsers, `0` console errors, axe-core 0 serious/critical in 8 runs, plus `Selected: edit` from the dropdown callback |
| Web Components | no build step — `node --check` per module, served by `node tools/audit/serve.js --port 8791`, gallery driven the same way | 40 modules defining 43 `<mue-*>` tags, 0 shadow roots (light DOM by design); 36 `.section` blocks; the same 46/46 probes at both widths in Chrome and Edge, `0` page or console errors, axe-core 0 serious/critical in 8 runs; events observed: `mue-open`, `mue-close`, `mue-change`, `mue-select`, `mue-sort` |
| Site integration | `node tools/audit/framework-parity.mjs --write`, `node site/build.mjs`, then `node site/serve.mjs` with the built copy driven by headless Chrome | library facet reads the registry and offers `HTML/CSS/JS (54) / React (33) / Vue (33) / Web Components (33)`; choosing React narrows 54 cards to 33 and every remaining card carries the react chip; `/preview?id=ui-cards&fw=react|vue|web-components` selects the matching tab, keeps `?id=…&fw=…` in the URL and points the iframe at that package's real gallery; each binding's copy-source button returns "Copied."; 0 px horizontal overflow at 390 wide; no console errors on `/`, `/library`, `/templates`, `/agents`, `/privacy` |
| CLI | `node tools/mue.js stack`, `show ui-cards --framework <fw>`, `search <q> --framework <fw>`, `add <id> --framework <fw> --into <dir>`, `registry --json`, `check all` | matrix prints `react/vue/web-components: 33/54 entries live` and `svelte/angular: 0/54 entries live, 33 documented as planned`; `--framework svelte` prints "This repository has no svelte component for ui-cards" plus the documented plan path, never a placeholder; `mue check all` reports 54 files, 0 issues; a partial `mue add --framework` now rewrites `index.js` so it only references the modules it actually installed |

Each of those checks was run against the files in this repository, on one machine, on
2026-11-01. Not run: Safari, Firefox, a screen reader with real assistive tech, a touch
device, server-side rendering, npm publish, and any load or Lighthouse figure. The
behaviour probes and axe-core runs cover Chrome and Edge only.

## How each package is checked

| Package | Compile check | Behaviour check |
| --- | --- | --- |
| HTML/CSS/JS (`components/`) | `node tools/mue.js check all` | `node tools/audit/serve.js --port 8791`, then `tools/audit/harness.js` drives each preview in an iframe at 320/375/768/1280 and measures composited contrast in light and dark |
| React (`frameworks/react/`) | `node build.mjs` (esbuild) | headless Chrome and Edge over the built gallery bundle: behaviour probes at 1280px and 390px in both themes, then axe-core at both widths |
| Vue (`frameworks/vue/`) | `node build.mjs` (vite) | headless Chrome and Edge over the built bundle, same probe and axe matrix |
| Web Components (`frameworks/web-components/`) | `node --check` per module | headless Chrome and Edge over a local HTTP server, same probe and axe matrix |
| Svelte (`frameworks/svelte/`) | — no source to compile | — |
| Angular (`frameworks/angular/`) | — no source to compile | — |

Results per component, with the date and the command, live in
`frameworks/registry.json` (`verified` per binding) and are what the site renders
in the "Bindings in this repository" strip on every preview page.

### Why the galleries are called `gallery.html`, not `index.html`

The site is deployed with `cleanUrls: true`, and Vercel answers
`/dir/index.html` with a redirect to `/dir` — no trailing slash. A page loaded
from that URL resolves its relative assets one level shallower than it does on
the file system, so `../../../design-tokens/engine.css` lands on
`/design-tokens/engine.css` and the deployed gallery renders unstyled with a
404 on its bundle. Renaming the file to `preview/gallery.html` makes the
redirect target `/engine/frameworks/<name>/preview/gallery`, whose directory is
the one the paths were written against, so the same file works from a clone and
from the site. Do not rename it back to `index.html`.

## What a framework binding does **not** include

- No third-party component library re-skinned. The classes belong to this repo.
- No framework-specific theme system. `html.dark` and the tokens do the work.
- No runtime CDN in a preview: React and Vue previews are built into a bundle
  committed in the repository, because the site is served as static files.
- No npm publication unless `frameworks/<name>/package.json` says so; these are
  folders you copy, the same as the HTML files.

## Screens and templates are not ported

The ports cover **components**, one file at a time: the 33 rows of
`frameworks/registry.json`. The 6 templates and 15 worked examples under
`templates/` and `examples/` exist only as HTML/CSS/JS. There is no React SaaS
starter, no Vue admin dashboard and no Angular ecommerce page in this
repository, and neither the site nor the CLI claims one.

Why it stays that way until someone does the work: a component port is markup
plus focus and state handling for one control. A screen port additionally
decides routing, data fetching, form state, session handling and slot APIs —
each a framework convention this repo would have to invent and then keep
correct across two builds. A half-ported screen is worse than none, because an
agent reads "React template" as permission to copy the rest of the page from
somewhere else.

What a real framework template would have to clear before it is listed here:

- one `MUE:META` block per screen file, with `PORTS:` naming the vanilla screen;
- a row in `frameworks/registry.json` with real paths, so
  `node tools/audit/framework-parity.mjs` can refuse it if the files are missing
  or it writes a class the shared sheet does not define;
- a committed build (`node build.mjs` in that package) and a headless-Chrome run
  at 390/820/1280 in light and dark, recorded in `verified` with the date;
- no invented dependency: if it needs a router or a client-side store, the
  dependency is named with the version actually used in the build.

Until those exist, `mue stack` is the authority on what a framework has, and it
counts entries, not screens.
