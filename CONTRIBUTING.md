# Contributing to MASTER-UI-ENGINE

Thank you for helping build a reusable UI/UX library for AI coding agents.

## How to contribute

1. **Fork the repository** and create a feature branch from `main`.
2. **Follow the folder structure** — components under `components/<category>/`,
   full pages under `examples/<category>/`, starter apps under
   `templates/<category>/`, tokens under `design-tokens/`.
3. **Put component rules in the shared sheet.** `styles/components.css` is the
   single paste target — a preview demonstrates the sheet, it does not re-declare
   it. Add your CSS to the matching `#region` block (or a new region), then link
   the three files from the head:

   ```html
   <link rel="stylesheet" href="../../design-tokens/engine.css">
   <link rel="stylesheet" href="../../styles/components.css">
   <script src="../../styles/mue.js" defer></script>
   ```

   An HTML file must still render standalone in a browser: no build step, no
   network fonts, no CDN scripts, and no path outside the repository.
4. **Include the metadata header** — see the `<!-- BEGIN MUE:META … END MUE:META -->`
   convention in `AGENTS.md`; you get it for free by adding a catalog entry and
   re-running the build script.
5. **Add a catalog entry** — update `showcase/data/component-catalog.json`, then
   run `powershell -File showcase/data/build-catalog.ps1` to regenerate
   `showcase/data/catalog.js` and stamp the header into your file.
6. **Follow the quality gates** — the checklist at the end of `AGENTS.md`.
7. **Verify both themes and three widths** — open the lab (`showcase/index.html`),
   toggle dark mode, and check 375 / 768 / 1200 for overflow.
8. **Respect licenses** — do not add commercial or non-redistributable code
   without permission. Record the original source and attribution in the
   catalog entry and in `RESOURCES.md`.
9. **Open a pull request** with a clear description of what was added or
   changed, and a screenshot of the preview in light and dark.

## Framework bindings

A binding is a port of an existing component into React, Vue, Web Components,
Svelte or Angular. It is not a second design system, and the audit says so in
code. The rules:

1. **No CSS in a binding.** The port writes the classes already defined in
   `styles/components.css` and links the same two files the vanilla preview
   links. A variant maps onto the modifier class that already exists (a
   `variant` prop becomes `card-outlined`, not a new rule). If a class you need
   is missing, add it to the shared sheet first and let every stack use it.
2. **Every binding file starts with a `MUE:META` block**, the same convention as
   an HTML preview, carrying `FRAMEWORK`, `PORTS:` (the vanilla file it came
   from), `DEPENDENCIES:`, `SHEET:`, the variant/prop/a11y/keyboard/event lists
   and — required — `LICENSE:` and `ATTRIBUTION:`. The parity audit fails a
   binding that declares no licence or no attribution, and `mue show <id>
   --framework <name>` prints that contract back to whoever is consuming it.
3. **Register the port, then let the tool write the catalog.** Add the component
   to `frameworks/registry.json` with its source paths, package name, install
   note, import line and a `verified` note, then run
   `node tools/audit/framework-parity.mjs --write`. It checks that every path is
   a real file, every class the binding writes exists in the shared layer, every
   `stable`/`experimental` binding names the command or browser run that
   verified it, that a `planned` entry claims no source files, and that
   `showcase/data/component-catalog.json` matches the registry. Edit the catalog
   by hand and the next run overwrites it.
4. **Status is earned, not asserted.** `stable` means the source builds or serves, renders in
   its own preview, and was driven there in headless Chrome **and** Edge — behaviour probes at
   1280px and 390px in light and dark, plus axe-core at both widths — with each of those
   commands named in the `verified` note and dated. `experimental` is what a binding sits at
   until that matrix exists for it. Neither label claims npm publication, Safari, Firefox, a
   screen reader, a touch device or server-side rendering, and a `verified` note that hides
   one of those gaps is a defect. `planned` means an architecture document and nothing else. If
   your element is registered but never exercised, say so in its status (the Web
   Components package marks untested elements `defined-only` for exactly this
   reason).
5. **Ship a preview that needs no network.** Each implemented package has a
   gallery page under `frameworks/<name>/preview/`. React and Vue galleries are
   built in-repo (`node build.mjs`) and the bundles are committed, so the
   deployed preview makes zero CDN requests. Do not commit `node_modules`,
   lockfiles for the site build, or a CDN tag. Keep the gallery file named
   something other than `index.html` — `cleanUrls` on the host redirects
   `/dir/index.html` to `/dir`, which shifts every relative asset path one
   level and serves the deployed gallery without its stylesheet.
6. **Attribution and licence.** All four stacks here are the repository's own
   MIT-licensed work. Taking a component from shadcn/ui, Ant Design or anywhere
   else means recording it in the `ATTRIBUTION` field, in the catalog entry and
   in `RESOURCES.md`, and checking the source licence is redistributable first.

## Design principles

- Reuse over reinvention
- Professional, product-quality visuals (not generic AI slop)
- Accessible by default (WCAG AA contrast, keyboard navigation, ARIA)
- Mobile-first responsive behavior
- Light and dark theme support — dark mode comes from the primitive mirror in
  `design-tokens/themes/dark.css`, so write against the ramp, not against hex
  values
- No fake interactions, placeholder charts, or emoji standing in for icons

## Code review checklist

- [ ] Renders standalone in a browser
- [ ] Metadata header present and matches the catalog entry
- [ ] Catalog entry present; `build-catalog.ps1` re-run
- [ ] Accessible (keyboard, ARIA, AA contrast in light and dark)
- [ ] Responsive at mobile / tablet / desktop with no horizontal overflow
- [ ] License and attribution documented
- [ ] Framework port (if any): no stylesheet of its own, `MUE:META` present, registered in `frameworks/registry.json`, `node tools/audit/framework-parity.mjs` exits 0
- [ ] Framework port status matches a recorded check — `experimental` needs the command or browser run named, `planned` needs no source files
