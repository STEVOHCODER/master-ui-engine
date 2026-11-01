# mue-web-components — light-DOM custom elements

Twenty-one custom elements covering the shared sixteen components. No build step, no
framework runtime, no Shadow DOM: each element upgrades the markup you write and applies
the classes already defined in [`styles/components.css`](../../styles/components.css).

Status: **experimental** — the elements are real, the preview renders, and the interactive
paths below were driven in headless Chrome on 2026-11-01. Not published to npm.

## Use it

```html
<link rel="stylesheet" href="design-tokens/engine.css" />
<link rel="stylesheet" href="styles/components.css" />
<script type="module" src="frameworks/web-components/index.js"></script>

<mue-button variant="primary" size="lg">Deploy</mue-button>
```

Importing `index.js` defines every tag. Loading it twice is harmless — each module guards
with `customElements.get(...)`. With a bundler, `import "mue-web-components"` or import a
single element to ship less:

```js
import "./frameworks/web-components/components/mue-dialog.js";
```

## Why light DOM

A shadow root would isolate these elements from `styles/components.css` and from the
`html.dark` theme flip. The elements therefore build real child nodes in the light DOM, so
document-level classes, tokens and theme rules reach them with no `::part` or
`adoptedStyleSheets` plumbing. The cost is that the host reorganises your children, so the
child markup per element is fixed and documented (and visible in
[`preview/gallery.html`](preview/gallery.html)).

## Elements

| Tag | Attributes | Emits |
| --- | --- | --- |
| `mue-button` | `variant` `size` `state` `type` `disabled` `block` `icon` `aria-label` | — |
| `mue-input` | `label` `type` `name` `value` `placeholder` `helper` `message` `state` `disabled` `required` | `mue-change` |
| `mue-textarea` | as input, plus `rows` | `mue-change` |
| `mue-select` | `label` `name` `value` `helper` `message` `state` `disabled` `required` (authored `<option>`s are upgraded) | `mue-change` |
| `mue-checkbox` | `label` `name` `value` `checked` `disabled` | `mue-change` |
| `mue-radio` / `mue-radio-group` | group: `label` `name` `value` `disabled`; radio: `label` `value` `checked` `disabled` | `mue-change` |
| `mue-switch` | `label` `name` `value` `checked` `disabled` (`role="switch"` + `aria-checked` on the native input) | `mue-change` |
| `mue-card` | `variant` `interactive` `selected`; children keep `.card-body` `.card-title` `.card-desc` `.card-tag` `.card-actions` | — |
| `mue-badge` | `variant` `solid` `dot` | — |
| `mue-dialog` | `title` `open`; `[slot="footer"]` children move to `.dialog-footer` | `mue-open` `mue-close` |
| `mue-dropdown` | `label` `variant` `open`; author children become `.menu-item` rows in a `role="menu"` list | `mue-select` `mue-open` `mue-close` |
| `mue-tabs` / `mue-tab` / `mue-tabpanel` | tabs: `selected` `label`; tab: `disabled` | `mue-change` |
| `mue-accordion` / `mue-accordion-item` | item: `label` `open` | `mue-change` |
| `mue-table` | `striped` `compact`; an authored `<table>` is upgraded, `th[data-sort]` sorts | `mue-sort` |
| `mue-notification` | `type` (`alert`\|`toast`) `variant` `title` `message` `open` `timeout` | `mue-close` |
| `mue-avatar` / `mue-avatar-group` | avatar: `src` `alt` `initials` `name`; group: `label` | — |

[`registry.js`](registry.js) is the same list as machine-readable data (no functions, no
imports), one entry per tag with its variants, events, ARIA contract and verification
status. `tools/audit/framework-parity.mjs` and the site read it; hand-written docs do not
replace it.

## Preview

[`preview/gallery.html`](preview/gallery.html) demos all sixteen components (one section per
component) and logs every custom event into a live region. It needs no build step, but
`served` over http — ES modules and the `../index.js` import are blocked on `file://`:

```bash
node tools/audit/serve.js --port 8791   # then open /frameworks/web-components/preview/gallery.html
```

## Verified (2026-11-01, headless Chrome via puppeteer-core)

- 21 of 21 tags defined, 0 elements with a `shadowRoot`, `pageErrors []`. The only console
  error over http is the `/favicon.ico` 404.
- Dialog: `open` + `.overlay.is-open`, `role="dialog"`, `aria-modal="true"`, focus lands
  inside, Escape clears the attribute.
- Tabs: `ArrowRight` moves focus to "Classes", `Enter` selects it, `aria-selected` is
  `false/true/false`, panel index follows, and the tablist carries `data-mue-bound="1"` so
  the vanilla `styles/mue.js` handler skips it (no double binding).
- Switch: `Space` flips `checked` and `aria-checked`. Dropdown: opens with
  `aria-expanded="true"` and `aria-hidden="false"` on the menu, a row click emits
  `mue-select` then `mue-close` with `reason: "select"`.
- Accordion: closing the open item writes `aria-expanded="false"`; opening the next one
  leaves exactly one open. Table: header click writes `data-sort="asc"` +
  `aria-sort="ascending"` and emits `mue-sort` with the column name.
- Toast: `open` shows `.is-open` with `role="alert"`, `hide()` sets `hidden` and clears the
  attribute. Events observed in the run: `mue-open`, `mue-close`, `mue-change`,
  `mue-select`, `mue-sort`.

## Not verified / not claimed

- Checkbox, radio, input, textarea, select, button, card, badge, avatar and avatar-group
  render and carry their sheet classes; they were confirmed by DOM inspection in that run,
  not by keyboard-driven interaction the way the six above were.
- No axe-core run, no screen-reader check, no Safari/Firefox pass (Chrome only), no
  published package.
- `:defined` / FOUC: the elements upgrade on module execution, so an unstyled flash is
  possible on slow connections. Not solved here; `visibility` gating is the caller's call.

## Licence

MIT, the same as the engine. See [`frameworks/README.md`](../README.md).
