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
