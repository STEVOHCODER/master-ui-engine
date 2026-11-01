# Framework packages

MASTER-UI-ENGINE ships one design and several bindings. The design stays where it
has always been: `design-tokens/engine.css` (tokens) and `styles/components.css`
(the only place a class is defined). A framework package adds **markup + behaviour
bindings for that framework and nothing else** — it never introduces a new
stylesheet, a new colour, or a shadow DOM that hides the tokens.

| Package | Directory | Build step | Live preview | Status |
| --- | --- | --- | --- | --- |
| Vanilla HTML/CSS/JS | `components/` | none | yes (every preview page) | stable |
| React 19 | `frameworks/react/` | esbuild, output committed | yes | stable|
| Vue 3 (SFC) | `frameworks/vue/` | `@vue/compiler-sfc`, output committed | yes | stable|
| Web Components | `frameworks/web-components/` | none | yes | stable|
| Svelte 5 | `frameworks/svelte/` | — | no | planned (architecture documented) |
| Angular | `frameworks/angular/` | — | no | planned (architecture documented) |

Nothing here is claimed to work until the check in
[`docs/framework-support.md`](../docs/framework-support.md) has actually run
against it. A package that is `planned` has no source files, and the site says so.

## The contract every binding follows

1. **Class names come from `styles/components.css`.** A React `<MueButton>` renders
   `<button class="btn btn-primary">`; a Vue `<MueButton>` renders the same DOM. If
   the class is not in that file, the component does not get to use it.
2. **Variants are props, not new components.** `variant`, `size`, `state`, `block`
   map to the existing modifier classes (`btn-ghost`, `btn-sm`, `is-invalid`,
   `btn-block`). The full list of legal values is the list of classes in
   `styles/components.css`, checked by `tools/audit/framework-parity.mjs`.
3. **Tokens are never inline.** No hex colour, no `px` radius, no hardcoded
   duration in any package. Spacing, colour, type, radius and motion come from
   `design-tokens/engine.css` and `design-tokens/motion/scale.css` through the
   shared classes.
4. **Theming is `html.dark`.** Packages style nothing for light/dark themselves;
   they inherit it. Do not write theme logic into a component.
5. **Accessibility is ported, not re-invented.** The ARIA roles, states, labels,
   focus handling and keyboard behaviour documented in the matching
   `components/**/*.html` preview (`MUE:META` block) are part of the component:
   `role`, `aria-expanded`, `aria-controls`, `aria-live`, `aria-checked`,
   labelled-by relationships and Escape/Arrow/Home/End handling must survive the
   port.
6. **Each source file carries its own `MUE:META` block** (the same block style the
   vanilla previews use) with `COMPONENT`, `ID`, `FRAMEWORK`, `DEPENDENCIES`,
   `VARIANTS`, `A11Y`, `KEYBOARD`, `VERIFIED`, `LICENSE`, `ATTRIBUTION`. That block
   is what the catalog and `tools/mue.js` read.
7. **No new runtime dependency** beyond the framework itself. Icons are inline SVG
   from the vanilla previews; there is no icon package, no CSS-in-JS, no utility
   framework.

## The shared component set

All three implemented packages carry the same 33 catalogued components, so a visitor can
compare them one to one:

buttons, input fields and textarea, select menus, checkboxes, switches, radio buttons,
date picker, file upload, cards, accordion sections, tables, data table, charts, rating,
dialogs, popover, modals, dropdown menus, alerts and toasts, badges and avatars, footers,
progress, skeleton, empty state, error state, stepper, breadcrumbs, header navigation,
navigation menu, pagination, tabs, sidebar, and tour plus float buttons.

Anything outside that set — the 15 examples and 6 templates in the catalog — is
composition rather than a control, so it stays HTML/CSS/JS only.

## Previews without a runtime CDN

Vercel serves this site as static files, so a preview cannot depend on a CDN or a
dev server. React and Vue therefore **build their preview once, in the repo, and
commit the bundle**:

- `frameworks/react/` — `node build.mjs` (esbuild) → `frameworks/react/preview/preview.js`,
  and the vendored `react-dom` runtime is inside that bundle. Nothing is fetched at
  view time.
- `frameworks/vue/` — `node build.mjs` (`@vue/compiler-sfc`) → `frameworks/vue/preview/preview.js`
  plus the vendored `vue.runtime.esm-browser.prod.js` copied next to it.
- `frameworks/web-components/` — plain ES modules, loaded directly, no build.

`node build.mjs` in each package is the check that the source compiles; the
rendered page is the check that it works. Both are recorded in
`docs/framework-support.md` with the date and the command, not with adjectives.

`node_modules/` and `.cache/` never reach the deployed site: `site/.vercelignore`
and the `site/build.mjs` copy filter exclude them.
