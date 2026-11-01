# mue-react — React 19 bindings

Thin, honest React components over the classes that already live in
[`styles/components.css`](../../styles/components.css). Nothing here restyles anything: the
package adds markup, props and the keyboard/ARIA behaviour documented in the matching
`components/**/*.html` preview. There is no second stylesheet, no CSS-in-JS, no icon package,
no `classnames`, no runtime dependency beyond React itself.

Per [`frameworks/README.md`](../README.md) every catalogued component is carried here:
34 modules over the 33 entries. Everything below was rendered and driven in headless Chrome
and Edge on **2026-11-01**; the results are in [Verified](#verified) rather than in
adjectives.

## Install

```bash
npm i react react-dom          # peer deps: react ^19, react-dom ^19
```

Then either copy `frameworks/react/` into your project, or point npm at it:

```bash
npm i file:./frameworks/react   # or an absolute path to frameworks/react
```

The package ships **JSX source only** (`main`/`exports` → `index.js`, no transpiled `dist`),
which is what keeps the bindings readable and dependency-free. Your bundler has to compile
`.jsx` — Vite and esbuild do it out of the box; for webpack/Next add
`frameworks/react` to the transpile include.

What npm actually resolved when this was built (devDependencies in `package.json`):

| Package | Resolved | Declared as |
| --- | --- | --- |
| `react` | **19.3.1** | `peerDependencies: ^19.0.0` |
| `react-dom` | **19.3.1** | `peerDependencies: ^19.0.0` |
| `esbuild` | **0.28.2** | `devDependencies: ^0.28.2` (preview build only) |

The host page must link the engine, exactly like every vanilla preview does:

```html
<link rel="stylesheet" href="design-tokens/engine.css">
<link rel="stylesheet" href="styles/components.css">
<script src="styles/mue.js" defer></script>
```

Theming is inherited from `html.dark`, which `styles/mue.js` persists. No component here knows
anything about light or dark.

## The set

| Component | File | Exports | Classes from the sheet |
| --- | --- | --- | --- |
| Button | `components/button.jsx` | `MueButton` | `.btn` `.btn-primary/-secondary/-outline/-ghost/-danger/-success/-link` `.btn-sm/-lg/-icon/-block` `.loading .bar .spinner` |
| Input | `components/input.jsx` | `MueInput` | `.field` `.field-label` `.field-helper` `.field-msg` `.is-error` `.is-success` `.input-group` `.input-icon` `.addon` |
| Textarea | `components/textarea.jsx` | `MueTextarea` | `.field textarea` + the same field slots |
| Select | `components/select.jsx` | `MueSelect` | `.field select` `.select-wrap` (+ its chevron `svg`) |
| Checkbox | `components/checkbox.jsx` | `MueCheckbox` `MueCheckboxGroup` | `.checkbox` `.box` `.checkbox-group` |
| Radio | `components/radio.jsx` | `MueRadio` `MueRadioGroup` | `.radio` `.box` `.radiogroup` |
| Switch | `components/switch.jsx` | `MueSwitch` | `.switch` `.track` `.switch-label` |
| Card | `components/card.jsx` | `MueCard` `MueCardMedia` `MueCardHeader` `MueCardBody` `MueCardTitle` `MueCardDesc` `MueCardTag` `MueCardActions` `MueCardPrice` | `.card` `.card-elevated/-outlined/-featured/-interactive/-head(-header)/-body/-media/-tag/-actions` `.card[role=button]` `.card[aria-pressed]` `.price` `.spread` |
| Badge | `components/badge.jsx` | `MueBadge` | `.badge` `.badge-primary/-success/-warning/-error/-danger/-info/-solid` `.dot` |
| Dialog | `components/dialog.jsx` | `MueDialog` | `.overlay.is-open` `.dialog` `.dialog-header/-title/-body/-footer/-close` |
| Dropdown | `components/dropdown.jsx` | `MueDropdown` `MueDropdownItem` `MueDropdownDivider` | `.dropdown.is-open` `.dropdown-menu` `.menu-item(.danger)` `.menu-divider` |
| Tabs | `components/tabs.jsx` | `MueTabs` `MueTab` | `.tabs` `.tab-list` / `.pills` `.tab[aria-selected]` `.tab-panel[hidden]` |
| Accordion | `components/accordion.jsx` | `MueAccordion` `MueAccordionItem` | `.accordion` `.accordion-item` `.accordion-trigger[aria-expanded]` `.accordion-panel.is-open` |
| Table | `components/table.jsx` | `MueTable` | `.table-wrap` `.table` `.table-striped` `.table-compact` `[data-sort]` |
| Notification | `components/notification.jsx` | `MueAlert` `MueToast` `MueToastStack` `MueToastRegion` | `.alert(-success/-error/-warning/-info)` `.alert-icon` `.toast(-…)` `.is-open` `.is-leaving` `.toast-icon/-body/-title/-msg/-close/-stack/-region` |
| Avatar | `components/avatar.jsx` | `MueAvatar` `MueAvatarGroup` | `.avatar` `.avatar img` `.avatar-group` |

## Usage

```jsx
import {
  MueButton, MueInput, MueTextarea, MueSelect, MueCheckbox, MueCheckboxGroup,
  MueRadioGroup, MueSwitch, MueCard, MueCardBody, MueCardTitle, MueCardDesc,
  MueCardTag, MueCardActions, MueCardMedia, MueBadge, MueDialog, MueDropdown,
  MueDropdownItem, MueDropdownDivider, MueTabs, MueTab, MueAccordion,
  MueAccordionItem, MueTable, MueAlert, MueToast, MueToastRegion, MueToastStack,
  MueAvatar, MueAvatarGroup,
} from "mue-react";
```

**Button** — variants, sizes and states are props onto existing modifier classes.

```jsx
<MueButton variant="outline" size="lg" onClick={save}>Save</MueButton>
<MueButton size="icon" aria-label="Save" variant="ghost"><TickSvg /></MueButton>
<MueButton loading block>Saving…</MueButton>   {/* aria-busy="true" + .loading > .bar */}
<MueButton disabled>Disabled</MueButton>
<MueButton variant="link" href="/docs">Read →</MueButton>   {/* renders <a class="btn btn-link"> */}
```

**Input / Textarea / Select** — the whole `.field` column is one component so the label,
control and message can never drift apart.

```jsx
<MueInput label="Username" value={name} onChange={setName}
          state={taken ? "error" : "success"} message={taken ? "Already taken." : "Available."} />
<MueInput label="Search" icon={<SearchSvg />} addon=".dev" placeholder="Projects" />
<MueTextarea label="Bio" rows={3} value={bio} onChange={setBio} helper="At least 10 characters." />
<MueSelect label="Role" value={role} onChange={setRole}
           options={[{ value: "dev", label: "Developer" }, { value: "pm", label: "Product Manager" }]} />
```

**Checkbox / Radio / Switch**

```jsx
<MueCheckboxGroup>
  <MueCheckbox label="Subscribe to newsletter" checked={on} onChange={e => setOn(e.target.checked)} />
  <MueCheckbox label="Marketing emails" defaultChecked disabled />
</MueCheckboxGroup>

<MueRadioGroup name="plan" legend="Plan" value={plan} onChange={setPlan}
  options={[{ value: "starter", label: "Starter — $19/mo" },
            { value: "legacy", label: "Legacy — retired", disabled: true }]} />

<MueSwitch label="Push notifications" checked={push} onChange={e => setPush(e.target.checked)} />
```

**Card / Badge**

```jsx
<MueCard variant="elevated">
  <MueCardMedia><CoverSvg /></MueCardMedia>
  <MueCardBody>
    <MueCardTag>Ecommerce</MueCardTag>
    <MueCardTitle>Wireless headphones</MueCardTitle>
    <MueCardDesc>Active noise cancellation, 30-hour battery.</MueCardDesc>
  </MueCardBody>
  <MueCardActions spread>
    <MueBadge variant="success" dot>Active</MueBadge>
    <MueButton size="sm">Add to cart</MueButton>
  </MueCardActions>
</MueCard>

<MueCard href="/lessons/1">…</MueCard>                       {/* renders <a class="card"> */}
<MueCard selected={picked} onSelect={() => setPicked(true)}>…</MueCard>  {/* role=button + aria-pressed */}
<MueBadge variant="warning">In review</MueBadge>
```

**Dialog** — controlled; Escape, focus trap and focus return are built in.

```jsx
<MueButton onClick={() => setOpen(true)} aria-haspopup="dialog">Add new item</MueButton>

<MueDialog open={open} onClose={() => setOpen(false)} title="Add new item" width="35rem"
  footer={<><MueButton variant="outline" onClick={close}>Cancel</MueButton>
           <MueButton onClick={create}>Create item</MueButton></>}>
  <MueInput label="Item name" placeholder="Enter name" />
</MueDialog>
```

**Dropdown**

```jsx
<MueDropdown label="Actions">
  <MueDropdownItem icon={<PencilSvg />} onSelect={edit}>Edit</MueDropdownItem>
  <MueDropdownDivider />
  <MueDropdownItem danger icon={<TrashSvg />} onSelect={remove}>Delete</MueDropdownItem>
</MueDropdown>
```

**Tabs / Accordion**

```jsx
<MueTabs label="Item views" defaultTab="overview">{/* pills for the segmented skin */}
  <MueTab id="overview" label="Overview">…</MueTab>
  <MueTab id="details" label="Details">…</MueTab>
</MueTabs>

<MueAccordion defaultOpen="faq-1">{/* exclusive by default; exclusive={false} lets several stay open */}
  <MueAccordionItem id="faq-1" title="Do I need a bundler?"><p>No.</p></MueAccordionItem>
</MueAccordion>
```

**Table**

```jsx
<MueTable caption="Active projects" striped
  columns={[{ key: "project", header: "Project", sortable: true },
            { key: "status", header: "Status", sortable: true,
              render: (row) => <MueBadge variant={row.tone}>{row.status}</MueBadge> }]}
  rows={projects} />
```

**Notification** — an alert stays in place; toasts are appended to the fixed region by your
own state, exactly as the preview clones hidden templates.

```jsx
<MueAlert variant="success" title="Changes saved">Your changes have been saved successfully.</MueAlert>

<MueToastRegion>
  <MueToastStack>
    {toasts.map(t => <MueToast key={t.id} variant={t.variant} title={t.title}
                              onDismiss={() => drop(t.id)}>{t.msg}</MueToast>)}
  </MueToastStack>
</MueToastRegion>
```

**Avatar**

```jsx
<MueAvatar initials="AM" />                       {/* aria-hidden, name written beside it */}
<MueAvatar label="Qoder support" initials="QS" /> {/* role=img + aria-label when standalone */}
<MueAvatar src="/u/alex.jpg" alt="Alex Morgan" />
<MueAvatarGroup><MueAvatar initials="AM" /><MueAvatar initials="SR" /></MueAvatarGroup>
```

## Build the preview

```bash
cd frameworks/react
npm install          # react, react-dom, esbuild (dev only)
node build.mjs       # → preview/preview.js (250.2 KiB, committed, exit 0)
```

`preview/preview.js` is an **IIFE with react and react-dom bundled in**, so
`preview/gallery.html` opens with zero network requests: from `file://` directly, or from any
static server (`node ../../tools/audit/serve.js`, then `/frameworks/react/preview/gallery.html`).
The page links the engine CSS, the component sheet and `styles/mue.js` for the theme toggle.
React mounts one frame *after* `mue.js` boots, so the shared script never binds the React
tablist and nothing is double-wired.

## Verified

Headless Chrome 25.16.0 and Headless Edge (both puppeteer-core, local binaries), 2026-11-01,
on `http://127.0.0.1:8791/frameworks/react/preview/gallery.html` served by
`node tools/audit/serve.js --port 8791`. Check scripts live outside the repo.

Gallery: **34 `<Section>` blocks rendered**, and **46/46 behaviour probes pass at 1280px and
again at 390px**, in light and in dark, with **0 console errors**. **axe-core reports 0
serious or critical violations in 8 runs** (both widths × both themes × both browsers).
`node tools/audit/check-classes.js frameworks/react/preview/gallery.html` gives
`UNRESOLVED(0)`, `DUPES(0)`, `RAWPRIM 0`, `HARDCODED-MOTION 0`.

Console: **0 errors, 0 warnings, 0 page errors, 0 non-`file:` requests.**

Interactions driven in the browser (all passed):

- Dialog — trigger click opens (`.overlay.is-open`, `role=dialog`, `aria-modal`, `aria-labelledby`
  resolves, focus lands inside, `html.mue-locked` set); **Escape** closes, unlocks scroll and
  **returns focus to the trigger** (`activeElement.textContent === "Add new item"`); 5 focusables trapped.
- Tabs — **ArrowRight** moved Overview → Details with `aria-selected`, one panel visible,
  roving `tabIndex [−1, 0, −1]`, every `aria-controls` resolving; **End** jumped to Settings.
- Switch — focus + **Space** flipped `false → true` through the controlled state.
- Dropdown — trigger click sets `aria-expanded=true`, `aria-hidden=false`, focus on first row;
  **ArrowDown/ArrowUp** walk and wrap (Edit → Duplicate → … → Delete); **Escape** closes and
  refocuses the trigger; choosing the danger row closes the menu and fires `onSelect` (a toast appeared).
- Accordion — clicking row 3 set `aria-expanded=true` + `.is-open` and closed row 1 (exclusive).
- Table — a header click re-ordered rows and published `aria-sort="ascending"`; **Enter** on
  another header sorted it too (`data-sort="asc"`), with the sheet's own caret.
- Checkbox / Radio / Input validation — click toggles, disabled stays disabled, radio group keeps
  one `name` and reports the choice, and typing `"al"` put `field is-error` + `aria-invalid="true"`
  + a message whose `id` matches `aria-describedby`.
- Toast — a trigger appended a `role="alert"` toast to `.toast-region`; its dismiss button removed
  it after the slide-out.
- Theme — the masthead toggle (plain HTML, driven by `styles/mue.js`) added `html.dark` with the
  React tree still mounted, and the choice was restored from localStorage after a reload.
- Data table — search narrows to the matching row, a header click publishes `aria-sort`, the
  header checkbox marks every row on the page `.is-selected` and moves the selection count, and
  the status filter's Apply drops non-matching rows (`.is-filtered` on its column).
- Navigation menu — its dropdown cell opens with focus on the first row, **ArrowDown** walks it,
  **Escape** closes and returns focus to the trigger; at 390px the drawer opens first, because
  the cell lives inside it.
- `npm pack --dry-run` produces a valid `mue-react-0.1.0.tgz` (37 files, 60.5 kB packed:
  `index.js`, `package.json`, this README and the 34 `components/*.jsx`); no preview bundle and
  no `node_modules` inside.
- `esbuild index.js --bundle --external:react --external:react-dom` resolves the whole module
  graph (119.7 kB), so the entry has no broken import.

## Not verified / known limits

- The native `<select>` popup was **not** automated — it is browser chrome. Only the closed box,
  `onChange` and the ARIA wiring were checked.
- axe-core now covers this gallery — 8 runs, both widths, both themes, Chrome and Edge, all
  clean of serious and critical. What is still **not** measured here is a manual WCAG contrast
  sweep of this package in isolation and a `prefers-reduced-motion` emulation pass; the engine
  owns the tokens and `design-tokens/motion/scale.css` carries the reduced-motion rule, and the
  React port inherits both rather than re-proving them.
- `node tools/audit/framework-parity.mjs` machine-checks this folder against the registry: it
  exits `OK 0 error(s)` over 33 components, and `docs/framework-support.md` records the result
  row by row.
- Published-install was not exercised against a registry: `npm i file:…` and `npm pack` were checked,
  `npm publish` was not.
- This is a **source-only** package: a consumer without JSX transpilation of `node_modules` will fail
  to import it. Documented above, not silently worked around.
- `MueTab`, `MueAccordionItem` and the `MueCard*` slots are declarative wrappers: `MueTab` and
  `MueAccordionItem` are read for their props and never rendered directly.

## Deliberate deviations from the vanilla previews

Recorded because the contract says to state them, not paper over them.

1. `components/forms/checkboxes.html` writes a `.choice-desc` span for the "with description" row.
   **`.choice-desc` is defined nowhere in `styles/components.css`**, so `MueCheckbox` does not render
   it; pass a fragment as `label` instead.
2. `MueSwitch` keeps **checkbox semantics with no `role="switch"`** — the preview adds none, and the
   state is announced by the platform input. This is a port decision, not an oversight.
3. `MueDialog` sets `tabindex="-1"` on the panel and makes the `aria-labelledby` target an `<h2>`.
   The preview uses `<span class="modal-title">` and an un-focusable panel, so its "focus the dialog"
   fallback could never take. Classes are unchanged; only semantics were tightened.
4. A closed `MueDialog` overlay and a closed dropdown menu are also `inert`, on top of the sheet's
   own `visibility: hidden` / `opacity: 0`, so neither can be reached by keyboard or a screen reader.
5. Tabs and dropdown answer **Home/End**; `styles/mue.js` binds arrow keys only. Point 5 of the
   contract asks for Home/End, so the binding goes at least that far.
6. `MueAlert` uses the sheet's own `.alert-icon` slot (styled per `.alert-*` variant in
   `#notifications`) rather than the `.toast-icon` the notifications demo borrows. Both classes exist;
   this one is the alert's.
7. The dropdown trigger renders `class="btn btn-outline"`. The preview writes `btn-outline` alone;
   `.btn` is in the same grouped rule in `#buttons`, so the DOM matches the contract example with an
   identical result.
8. A toast is removed on its own `transitionend` instead of a hardcoded `420 ms` as `mue.js` does,
   because the durations belong to `design-tokens/motion/scale.css`.
9. `MueDialog`'s `width` prop sets the `--modal-w` custom property, the documented per-instance knob
   (`style="--modal-w: 35rem"`) in `components/modals/modals.html`. No colour, radius or timing is
   inlined anywhere in this package.
10. Radio groups render `<fieldset class="radiogroup">` + `<legend>` as the preview does, including
    the browser's default fieldset chrome — neither `components.css` nor `engine.css` resets
    `fieldset`, and this package does not add a reset.

## Layout

```
frameworks/react/
├── package.json          # mue-react 0.1.0, ESM, main/exports → index.js
├── index.js              # one entry, all sixteen + subcomponents
├── build.mjs             # esbuild → preview/preview.js (IIFE, minified, es2020)
├── components/<kebab>.jsx# 16 files, each with its own MUE:META block
└── preview/
    ├── index.html        # links engine.css, components.css, mue.js
    ├── preview.jsx       # the sixteen-section gallery
    └── preview.js        # build output, committed so the preview needs no CDN
```

## License

MIT — MASTER-UI-ENGINE contributors. Same terms as
[the repository root](../../LICENSE); no component here invents a look, so no attribution beyond
the engine is required.
