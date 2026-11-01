# Framework support matrix

What exists as source in this repository, as opposed to what is planned. Every
row is either a file you can open or a document that says it is not built yet.
Nothing here is a claim about a framework the repo does not carry.

| Component | HTML/CSS/JS | React | Vue | Web Components | Svelte | Angular |
| --- | --- | --- | --- | --- | --- | --- |
| Buttons (`btn-buttons`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Input fields and textarea (`frm-input-fields`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Select menus (`frm-select-menus`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Checkboxes (`frm-checkboxes`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Radio buttons (`frm-radio-buttons`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Switches (`frm-switches`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Cards (`ui-cards`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Badges and avatars (`ui-descriptions`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Dialogs (`ui-dialogs`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Dropdown menus (`ui-dropdowns`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Tabs (`nav-tabs`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Accordion sections (`ui-sections`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Tables (`ui-tables`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |
| Alerts and toasts (`ui-notifications`) | `stable` | `experimental` | `experimental` | `experimental` | `planned` | `planned` |

The other 40 catalogued entries — examples, templates, and components such as charts,
date picker, dropzone, stepper, sidebar, popover, modals, pagination and the marketing
footers — are **HTML/CSS/JS only**. No React, Vue, Svelte or Angular version of them
exists in this repository, and the library page says so when a stack filter would leave
them out.

Statuses used by the matrix:

- **stable** — source, preview and a recorded check.
- **experimental** — source and preview exist and compile; the check that is
  recorded is the one that was actually run, dated.
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

Latest roll-up (2026-11-01): `OK 0 error(s), 30 note(s), 14 components, 404 classes
defined in the shared layer`, licence `MIT` on every binding, attribution
`MASTER-UI-ENGINE contributors` on every binding — nothing in `frameworks/` is a
re-skinned third-party component, and the only third-party code in the deployed tree is
the React/Vue runtime inside the two committed preview bundles.

## What the 2026-11-01 runs recorded

| Package | Command | Result as run |
| --- | --- | --- |
| React | `node build.mjs`, then headless Chrome over `preview/gallery.html` (`file://` and over http) | bundle 250.2 KiB; 16/16 sections; `proofFailures []`, `consoleErrors []`, `consoleWarnings []`, `pageErrors []`, `remoteRequests []`; dialog focus trap + Escape return, tab roving + `End`, switch `Space`, dropdown arrows/wrap/Escape/select, accordion single-open, table `aria-sort`, field `is-error`/`aria-invalid`, toast dismiss, theme persisted; only 404 over http was `/favicon.ico` |
| Vue | `node build.mjs` (vite 8.3.5), then headless Chrome | 25 modules, `preview/dist/preview.js` 103,349 bytes; 16/16 `#section-*`; `errors []`, `pageerrors []`; same interaction set as React plus `Selected: edit` from the dropdown callback |
| Web Components | `node --check` per module, then headless Chrome over a local http server | 21/21 tags defined, 0 elements with a `shadowRoot`, `pageErrors []`; dialog Escape, tabs `ArrowRight`+`Enter` with `data-mue-bound="1"`, switch `Space`, dropdown select closing, accordion flags `[false,true,false]`, table `data-sort="asc"` + `mue-sort`, toast `hide()`; events observed: `mue-open`, `mue-close`, `mue-change`, `mue-select`, `mue-sort` |
| Site integration | `node tools/audit/framework-parity.mjs --write`, `node site/build.mjs`, headless Chrome over the built site | library facet offers React (14) / Vue (14) / Web Components (14); selecting React shows 14 cards; the binding strip switches the iframe to each package's real preview, `?id=…&fw=…` stays in the URL, planned tabs hide the frame with an honest note, copying `card.jsx` returns "Copied 4.6k chars of component source", `errors none`, 0 px overflow at 390 wide |
| CLI | `node tools/mue.js stack`, `show <id> --framework <fw>`, `search <q> --framework <fw>` | matrix counts as printed in `SKILL.md`; `--framework svelte` prints "no svelte component for ui-cards", never a placeholder |

Each of those checks was run against the files in this repository, on one machine, in
Chrome. Not run: axe-core, Safari, Firefox, screen readers, touch devices, SSR,
viewport/contrast sweeps of the framework previews, and any load or Lighthouse figure.

## How each package is checked

| Package | Compile check | Behaviour check |
| --- | --- | --- |
| HTML/CSS/JS (`components/`) | `node tools/mue.js check all` | every preview page is the behaviour test, driven by hand |
| React (`frameworks/react/`) | `node build.mjs` (esbuild) | headless Chrome over the built bundle |
| Vue (`frameworks/vue/`) | `node build.mjs` (vite) | headless Chrome over the built bundle |
| Web Components (`frameworks/web-components/`) | `node --check` per module | headless Chrome over a local HTTP server |
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

The ports cover **components**, one file at a time: the 14 rows of
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
