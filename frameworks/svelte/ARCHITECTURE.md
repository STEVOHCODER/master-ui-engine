# Svelte 5 binding — porting design

Design only. **No `.svelte` file exists in this repository, and nothing below has been
compiled or rendered.** Every code block is a *proposal*, written against APIs the author
believes exist; re-verify each one against the Svelte release the toolchain installs.

## 1. Proposed layout

```
frameworks/svelte/
  src/lib/     16 component sources + barrel; src/lib/styles/ imports the shared sheets
  preview/     committed static bundle (§7)   build.mjs   compile check
```

Publishing to npm (`svelte-package`) is out of scope: the repo ships static files served by Vercel and claims no install.

## 2. CSS stays shared, never copied

- Components carry **no `<style>` block**: Svelte scopes component CSS and warns on "unused CSS
  selector" when a rule's class is absent from that file's markup, so any local CSS duplicates or
  fights `styles/components.css`.
- `src/lib/styles/index.js` (proposal) holds the two side-effect imports of
  `design-tokens/engine.css` and `styles/components.css`, imported **once** by the preview entry or
  the app's root layout — never per component, because a static preview has no bundler to dedupe
  repeated stylesheet tags.
- `$lib` is SvelteKit's alias; a bare `vite` + `@sveltejs/vite-plugin-svelte` app declares the same
  path in `vite.config.js` aliases, and the harness the preview uses belongs in `DEPENDENCIES:`. No
  token is inlined; theming comes from `html.dark`, not from a component.

## 3. Variants are props mapped to existing modifier classes

Each class below was grepped out of `styles/components.css` (its region in brackets); a port may not use a class that file does not define.

| Component | Prop → class |
| --- | --- |
| button [`#buttons`] | `variant` → `btn` + `btn-primary`/`-secondary`/`-outline`/`-ghost`/`-danger`/`-success`/`-link`; `size` → `btn-sm`/`btn-lg`; `block` → `btn-block`; `icon` → `btn-icon`; `loading` → `loading` plus a `<span class="bar">` child |
| input, textarea, select [`#fields`] | wrapper `field`; bare `input`/`textarea`/`select` are styled inside `.field`; also `.input`, `.input-group`, `.input-icon`, `.select-wrap`, `.addon`, `.field-label`, `.field-helper`, `.field-msg`; state `field is-error` / `field is-success` |
| checkbox, radio, switch [`#choice`] | `.checkbox`, `.checkbox-group`, `.radio`, `.radiogroup`; switch = `.switch` on the wrapping `<label>` + `.track` (`aria-hidden`) + `.switch-label` |
| card [`#cards`] | `.card`, `.card-header`, `.card-body`, `.card-title`, `.card-desc`/`.card-text`, `.card-actions`, `.card-media`, `card-outlined`/`card-elevated`/`card-interactive` |
| badge [`#badges`] | `.badge` + `badge-primary`/`-success`/`-warning`/`-danger`/`-info`, `badge-solid` |
| dialog [`#overlays`] | `.overlay` + `.modal` with `.modal-header`/`.modal-title`/`.modal-body`/`.modal-footer`/`.modal-close`; width through the `--modal-w` custom property; `is-open`; a closed overlay is hidden by the sheet, which is what keeps it out of the tab order |
| dropdown [`#dropdown`] | `.dropdown`, `.dropdown-menu` (or `.menu`), `.dropdown-item`/`.menu-item`, `.menu-divider`, `is-open` on wrapper and menu |
| tabs [`#tabs`] | `.tabs`, `.tab-list[role=tablist]`, `.tab`, `.tab-panel`; `pills`/`segmented` only if the preview using them is ported |
| accordion [`#disclosure`] | `.accordion`, `.accordion-item`, `.accordion-trigger` (`aria-expanded`), `.accordion-panel` + `is-open` |
| table [`#tables`] | `.table-wrap`, `.table`, `table-compact`, `table-striped`, `.table-toolbar`, `.table-foot` |
| notification [`#notifications`] | `.alert` + `alert-success`/`-warning`/`-error`/`-info`, `.alert-icon`; `.toast` + `toast-success`/`-error`/`-warning`/`-info`, `.toast-region`, `.toast-stack`, `.toast-body`/`-title`/`-desc`/`-close`, `is-open`/`is-leaving` |
| avatar [`#display`] | `.avatar`, `.avatar-group`, `.avatar img` |

## 4. Props and slots (runes)

`$props()` throughout, no legacy `export let`. Default content is the `children` snippet
rendered with `{@render}`; named regions are named snippets, which is how the modal's
header/body/footer map onto the vanilla slots — a caller writes
`{#snippet header()}<span class="modal-title">Add item</span>{/snippet}` inside `<MueDialog>`,
and `MueDialog` receives it as a snippet prop and renders `{@render header?.()}` into
`.modal-header`. Forms bind `bind:value` / `bind:checked` on the real input; no wrapper is
invented around a native control.

```svelte
<!-- PROPOSAL: button -->
<script>
  let { variant = 'primary', size, block = false, loading = false, disabled = false,
        type = 'button', children, ...rest } = $props();
  const cls = $derived(['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block',
    loading && 'loading'].filter(Boolean).join(' '));
</script>
<button class={cls} {type} {disabled} aria-busy={loading || null} {...rest}>
  {#if loading}<span class="bar" aria-hidden="true"></span>{/if}
  {@render children?.()}
</button>
```

## 5. Keyboard and ARIA contracts to reproduce

From the `MUE:META` blocks and the behaviour in `styles/mue.js`; the port is done when these
hold again.

- **dialog** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → `.modal-title`;
  Escape and scrim click close; page scroll locks; Tab cycles the panel and wraps at both
  ends; focus lands on the first control on open, returns to the trigger on close. Svelte
  ships no focus trap, so write one inside `$effect` and restore focus in its cleanup.
- **tablist** — `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`,
  non-selected panels `hidden`, roving `tabIndex`, ArrowLeft/ArrowRight move and activate;
  `mue.js` implements only those two arrows, so Home/End exceeds the vanilla baseline.
- **dropdown** — `aria-haspopup` + `aria-expanded` on the trigger, `aria-hidden` on the
  menu, first row focused on open, ArrowUp/ArrowDown walk with wrap, Escape closes and
  refocuses the trigger, outside click closes. **accordion** — `aria-expanded` on
  `.accordion-trigger`, `is-open` on a panel that stays in the DOM (the sheet animates
  `grid-template-rows`).
- **switch / checkbox / radio** — the role comes from the **native**
  `<input type="checkbox">` inside the wrapping `<label>`: Space toggling, checked semantics
  and announcement are the browser's job, focus rings arrive through `input:focus-visible +
  .track`. Reproduce that markup; faking a `role="switch"` button moves all of it onto us.
- **notification** — `role="alert"`, `aria-label` on icon-only close buttons, `aria-hidden`
  on decorative SVGs. **button** — `type="button"` by default, `aria-label` when icon-only,
  `aria-busy` when loading.

## 6. Svelte-specific a11y caveats

Svelte raises compile-time a11y warnings, and `role` plus every `aria-*` must be written explicitly:
a `<div on:click>` satisfies nobody and does not silence
`a11y-click-events-have-key-events`. Fix the markup instead of reaching for `svelte-ignore`, since
the preview being copied already passes; expect friction from handlers on non-interactive elements
and from `<label>`/`<li>` structures that drift from it. `{...rest}` can drop a required
`aria-label`, so button and close-button ports dev-assert that an accessible name exists rather than
inventing a fallback. Avoid `<svelte:element this={…}>`: explicit element branches keep server HTML
statically inspectable and keep the DOM the parity audit compares identical to the vanilla markup.

## 7. SSR safety, build, preview

Nothing touches `window`, `document`, `localStorage` or `matchMedia` during init or render: focus
traps, scroll locks, outside-click listeners and reduced-motion reads live inside `$effect` —
client-only — each removing what it added in its cleanup, anything else guarded by a
`typeof window` check. SvelteKit code may use `$app/environment`, but the library must not depend on
it, so the preview still runs in a plain `vite` app. Markup-only components (button, card, badge,
table, avatar, fields) render identically on both sides; dialog and dropdown render their **closed**
state server-side so hydration does not swap DOM. Build with `vite` +
`@sveltejs/vite-plugin-svelte` on Svelte 5 runes, pinning the version only once the toolchain
installs it, and build the preview in the repo and **commit** it (`preview/preview.js`) as React and
Vue do: static files, no CDN, no dev server.

## 8. MUE:META block every source file carries

The ten fields `frameworks/README.md` rule 6 names, in the comment style of
`components/buttons/buttons.html`; carrying vanilla's extras (GROUP, CATEGORY, SHEET, THEME, MOTION,
RESPONSIVE, CATALOG) is fine. `A11Y`, `KEYBOARD` and `VERIFIED` are what a reviewer reads first, and
`VERIFIED` stays `none` until a dated check exists.

```
<!-- BEGIN MUE:META
  COMPONENT: Dialog
  ID: svelte-dialog
  FRAMEWORK: Svelte 5 (runes, .svelte)
  DEPENDENCIES: svelte (peer), design-tokens/engine.css, styles/components.css#overlays
  VARIANTS: width via --modal-w, footer button row, bottom sheet below 640px
  A11Y: role=dialog, aria-modal=true, aria-labelledby, closed panel out of tab order
  KEYBOARD: Escape closes; Tab cycles and wraps; focus returns to the trigger
  VERIFIED: none — no build or browser check has run
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
```

## 9. Catalog entry, licensing

When source exists, `frameworks/registry.json` gains a real `source` path per Svelte binding (its
33 grouped entries are how badges/avatars and input/textarea are catalogued today) and
`showcase/data/component-catalog.json` mirrors it using the keys vanilla items have (`id`, `name`,
`group`, `category`, `path`, `framework`, `designSystem`, `variants`, `license`, `kind`, `tokens`,
`engineLinked`, `theming`, `verified`), `framework: "svelte"`, `verified` holding date + command.
MIT (`LICENSE` at the repo root), attribution **MASTER-UI-ENGINE contributors**; code derived
from Svelte docs, a SvelteKit template or any other MIT example names that source in
`ATTRIBUTION:` and states the derivation in the change description. Icons stay inline SVG from
the vanilla previews; rule 7 forbids any other runtime dependency — no Svelte component
library, no headless-a11y package, no icon package.

## 10. Definition of done

The shape the React/Vue/Web Components rows were verified with: a command and a date.

1. `node frameworks/svelte/build.mjs` compiles all sixteen sources, the committed `preview/`
   bundle regenerates, and the §3 class list is re-checked against the sheet;
   `node tools/audit/check-classes.js` is clean on the rendered preview markup.
2. Headless-browser interaction check against `node tools/audit/serve.js`: dialog opens by
   mouse, closes on Escape and scrim click; Tab wraps in the panel and focus returns to the
   trigger; arrows move tabs and update `aria-selected`/`hidden`; ArrowUp/Down and Escape in
   the dropdown; Space toggles the switch; `role="alert"` announced; no console errors; the
   viewport widths used are recorded.
3. Light and dark contrast plus 320/375/768/1280 overflow through `tools/audit/harness.js`.
4. `MUE:META` in every file, catalog item added, `node tools/mue.js check all` and `doctor`
   exit clean.
5. `frameworks/registry.json` gains the real `source`/`preview` paths and a dated `verified` note per
   binding, `node tools/audit/framework-parity.mjs --write` rebuilds the matrix in
   `docs/framework-support.md`; only then does `frameworks/README.md` move Svelte off `planned`.

## 11. Open questions (deliberately unresolved)

Exact Svelte / SvelteKit / vite versions; SvelteKit route or bare `vite` entry for the preview; how far `tools/audit/framework-parity.mjs`
reaches — it checks registry paths, classes and `verified` notes, not DOM equivalence with the vanilla preview; whether Home/End join the
tablist baseline; how `--modal-w` surfaces as a prop. None is answerable from this repository today.
