# Angular binding — porting design

Design only. **No `.ts`, `.html` or Angular CLI config exists in this repository, and nothing below has been compiled, rendered or
audited.** Code blocks are *proposals* against APIs the author believes exist — re-verify each against the Angular line installed.
Section 11 states the version question.

## 1. Proposed layout

```
frameworks/angular/
  src/app/mue/   16 standalone components (.ts + .html) + a public-api.ts barrel
  preview/       committed static output of the built preview app (section 8)
  build.mjs      compile + copy step, matching the React/Vue convention
```
No npm publish is claimed; the contract is static files served by Vercel.

## 2. One stylesheet, no duplicated CSS

- Shared sheets enter through the **global stylesheet entry**, `build.options.styles` in `angular.json`: bundled once, unscoped,
  inherited by every component; never a component's `styles`/`styleUrl`, which copies rules per component. `stylePreloads` warms the
  dev server only — if used while authoring, say so in `MUE:META`, it is not the wiring that reaches the build.
- The sheets sit at the repo root, outside an app's `src/`: scaffold the workspace at the repo root or document a copy step; a third
  committed copy of the CSS is forbidden.
- Components set `encapsulation: ViewEncapsulation.None` and carry **no CSS of their own**, keeping `_ngcontent-*` out of the DOM so
  the parity check diffs markup against the vanilla preview (`None` leaks future local CSS globally, rule 1 forbids). No hex, `px`
  radius or duration literal; theming is `html.dark`, never a component.

## 3. Variants are inputs mapped to existing modifier classes

Each class below was grepped out of `styles/components.css` (region in brackets); a port may not use a class that file does not define.

| Component | Input → class |
| --- | --- |
| button [`#buttons`] | `variant` → `btn` + `btn-primary`/`-secondary`/`-outline`/`-ghost`/`-danger`/`-success`/`-link`; `size` → `btn-sm`/`btn-lg`; `block` → `btn-block`; `iconOnly` → `btn-icon`; `loading` → `loading` plus a `<span class="bar" aria-hidden="true">` |
| input, textarea, select [`#fields`] | host wraps a `field` div; bare `input`/`textarea`/`select` are styled inside `.field`; `.input`, `.input-group`, `.input-icon`, `.select-wrap`, `.addon`, `.field-label`, `.field-helper`, `.field-msg`; state `field is-error` / `field is-success` |
| checkbox, radio, switch [`#choice`] | `.checkbox`, `.checkbox-group`, `.radio`, `.radiogroup`; switch = `.switch` on the wrapping `<label>` + `.track` (`aria-hidden`) + `.switch-label` |
| card, badge [`#cards`, `#badges`] | `.card`, `.card-header`, `.card-body`, `.card-title`, `.card-desc`/`.card-text`, `.card-actions`, `.card-media`, `card-outlined`/`card-elevated`/`card-interactive`; `.badge` + `badge-primary`/`-success`/`-warning`/`-danger`/`-info`, `badge-solid` |
| dialog, dropdown [`#overlays`, `#dropdown`] | `.overlay` + `.modal` with `.modal-header`/`.modal-title`/`.modal-body`/`.modal-footer`/`.modal-close`, `is-open`, width through the `--modal-w` custom property, closed overlay hidden by the sheet; `.dropdown`, `.dropdown-menu` (or `.menu`), `.dropdown-item`/`.menu-item`, `.menu-divider`, `is-open` on wrapper and menu |
| tabs, accordion [`#tabs`, `#disclosure`] | `.tabs`, `.tab-list[role=tablist]`, `.tab`, `.tab-panel` (`pills`/`segmented` only if the preview using them is ported); `.accordion`, `.accordion-item`, `.accordion-trigger` (`aria-expanded`), `.accordion-panel` + `is-open` |
| table, avatar [`#tables`, `#display`] | `.table-wrap`, `.table`, `table-compact`, `table-striped`, `.table-toolbar`, `.table-foot`; `.avatar`, `.avatar-group`, `.avatar img` |
| notification [`#notifications`] | `.alert` + `alert-success`/`-warning`/`-error`/`-info`, `.alert-icon`; `.toast` + `toast-success`/`-error`/`-warning`/`-info`, `.toast-region`, `.toast-stack`, `.toast-body`/`-title`/`-desc`/`-close`, `is-open`/`is-leaving` |

## 4. Component API: standalone, signals, ControlValueAccessor, slots

All components are `standalone: true` (no NgModule) with `ChangeDetectionStrategy.OnPush`. Both input styles exist — `@Input()`/`@Output()`
decorators and signal `input()`/`output()` — and one must be used across all sixteen files so an audit can compare props mechanically.
Proposal: signal inputs plus a `computed()` class string.

```ts
// PROPOSAL: button. Confirm signal inputs and @if control flow exist in the line chosen (section 11).
@Component({
  selector: 'mue-button', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<button [class]="classes()" type="button" [disabled]="disabled()"
      [attr.aria-busy]="loading() ? 'true' : null" (click)="click.emit()">
      @if (loading()) { <span class="bar" aria-hidden="true"></span> } <ng-content /></button>`
})
export class MueButtonComponent {
  variant = input('primary'); size = input<'sm' | 'lg' | undefined>(undefined);
  block = input(false); loading = input(false); disabled = input(false); click = output<void>();
  classes = computed(() => ['btn', `btn-${this.variant()}`, this.size() && `btn-${this.size()}`,
    this.block() && 'btn-block', this.loading() && 'loading'].filter(Boolean).join(' '));
}
```

The six form controls implement `ControlValueAccessor` (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`) with
`providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => X), multi: true }]`, so `formControl`/`ngModel` work on
`<mue-input>`. The inner checkbox is native, so Angular's own accessor covers it and a custom one only keeps the API on the host;
`setDisabledState` must drive the real input's `disabled` (the sheet styles `:disabled` and blocks pointer events), radio propagates
`name` to its group, select keeps the `.select-wrap` chevron markup the previews have.

**Slots**: `ng-content` with a `select` selector maps the vanilla slots without inventing markup — `MueDialog` projects into
`.modal-header`/`.modal-body`/`.modal-footer`, `MueCard` into `.card-header`/`.card-body`/`.card-actions`, `MueTabs` takes
`<ng-content select=".tab-list">` plus panels — and callers write `class="modal-title"` themselves, keeping design in the sheet. Where
a component reaches into projected content (tabs its `.tab` buttons, accordion its triggers) it queries `ContentChildren` or the
`contentChildren()` signal **after content init**, never in the constructor, re-querying when rows change; component-owned attributes
(`role`, `aria-controls`, `aria-labelledby`) are bound by it, not trusted from the caller's template.

## 5. Overlays: hand-written, not `@angular/cdk`

`@angular/cdk` (overlay, a11y `FocusTrap`, `Dialog`, `LiveAnnouncer`) would hand us focus management for free, but rule 7 forbids a
runtime dependency beyond the framework, so both overlays are written over the sheet's own markup the way `styles/mue.js` does.
**Dialog**: toggle `is-open` on `.overlay`; keep the panel in the DOM so the sheet's `visibility` rule removes it from the tab order
when closed; lock page scroll; trap Tab across the same focusable list `mue.js` uses (links, enabled buttons, fields and controls,
`[tabindex]` other than -1, visible only); store the trigger and restore focus on close. **Dropdown**: the sheet positions
`.dropdown-menu` absolutely inside `position: relative` on `.dropdown`, so no portal is needed — accepted tradeoff: no repositioning at
the viewport edge, no scroll containment, no escape from an `overflow: hidden` ancestor. If the previews need those later, that is a
contract amendment, not a dependency taken unilaterally.

## 6. Keyboard and ARIA contracts to reproduce

From the `MUE:META` blocks and `styles/mue.js`; the port is done when these hold again.

- **dialog** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → the projected `.modal-title` id; Escape and scrim click close;
  Tab cycles and wraps; focus to the first control on open, back to the trigger on close.
- **tablist** — `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, non-selected panels `hidden`, roving tabindex
  (`[attr.tabindex]` 0 active, -1 elsewhere); ArrowLeft/ArrowRight move and activate — `mue.js` implements only those two, so Home/End
  exceeds the vanilla baseline.
- **dropdown** — `aria-haspopup` + `aria-expanded` on the trigger, `aria-hidden` on the menu, first row focused on open, ArrowUp/ArrowDown
  walk with wrap, Escape refocuses the trigger, outside click closes (listener removed on destroy). **accordion** — `aria-expanded` on
  `.accordion-trigger`, `is-open` on a panel that stays in the DOM.
- **switch, checkbox, radio** — the role comes from the **native** `<input type="checkbox">` in the wrapping `<label>`: Space toggling,
  checked semantics and announcement are the browser's job, and the focus ring arrives through `.switch input:focus-visible + .track`
  (verified in the sheet); reproduce that markup, don't fake a `role="switch"`.
- **notification** — `role="alert"`, `aria-label` on icon-only close buttons, `aria-hidden` on decorative SVGs. **button** —
  `type="button"` by default, `aria-label` when icon-only, `aria-busy` when loading.

## 7. Angular-specific a11y notes

Angular binds nothing a11y-related implicitly: write `[attr.aria-expanded]`, `[attr.aria-selected]`, `[attr.aria-controls]`,
`[attr.aria-labelledby]` and `role` explicitly, and reserve `@HostBinding('class')` / `@HostBinding('attr.…')` for where the **host
element** itself carries the class or role. The host is extra DOM the vanilla preview lacks: prefer making it the component root
(`<mue-dropdown class="dropdown">`) and record every unavoidable wrapper in `MUE:META` so the parity check compares the right subtree.
`aria-label` stays an `input()`, icon-only ports assert an accessible name instead of inventing one, and there is no `innerHTML` or
sanitiser bypass — icons stay literal inline SVG, as the previews write them.

## 8. SSR, build and preview delivery

The preview stays a client-rendered static page, so SSR is not exercised and must not be claimed. If a consuming app server-renders: no
`window`, `document`, `localStorage` or `matchMedia` in constructors, field initialisers or templates; DOM work after view/content init
and only when `isPlatformBrowser(platformId)` holds, with `DOCUMENT` injected instead of the global; traps and scroll locks after
render; dialog and dropdown render their **closed** state server-side so hydration does not swap DOM. The SSR package name and clean-up
API moved between majors — verify, don't assume. Delivery: the preview is an Angular app built in the repo with its **static output
committed** under `preview/`, as React and Vue commit bundles, because Vercel serves this site as files with no runtime CDN or dev
server — so `baseHref` must be relative for a page served from a subdirectory (`site/build.mjs` already keeps `node_modules/` and
caches out of the deployed folder), the output links the two shared sheets instead of copying them, and reviewers run this package's
`build.mjs`, behaving like the ones `frameworks/README.md` documents.

## 9. MUE:META block every source file carries

The ten fields `frameworks/README.md` rule 6 names, in the comment style of `components/buttons/buttons.html`; vanilla's extras (GROUP,
CATEGORY, SHEET, THEME, MOTION, RESPONSIVE, CATALOG) may be carried too, and `VERIFIED` stays `none` until a dated check exists.

```
<!-- BEGIN MUE:META
  COMPONENT: Dialog
  ID: angular-dialog
  FRAMEWORK: Angular (standalone component, OnPush, ViewEncapsulation.None)
  DEPENDENCIES: @angular/core (peer), design-tokens/engine.css + styles/components.css via angular.json styles
  VARIANTS: width via --modal-w, footer button row, bottom sheet below 640px
  A11Y: role=dialog, aria-modal=true, [attr.aria-labelledby], closed overlay out of tab order
  KEYBOARD: Escape closes; Tab cycles and wraps; focus returns to the trigger
  VERIFIED: none — no build or browser check has run
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
```

Catalog: when source exists, `showcase/data/component-catalog.json` gains one item per component with the keys vanilla items use (`id`,
`name`, `group`, `category`, `path`, `framework`, `designSystem`, `variants`, `license`, `kind`, `tokens`, `engineLinked`, `theming`,
`verified`), `framework: "angular"`, `verified` holding the date and command; until then there is no Angular item. Licensing: MIT
(`LICENSE` at the repo root), attribution **MASTER-UI-ENGINE contributors**; code derived from Angular docs, CLI output or another MIT
example keeps an `ATTRIBUTION:` naming that source and states the derivation in the change description. No CDK, Angular Material, icon
package or CSS-in-JS.

## 10. Definition of done

The shape the React/Vue/Web Components rows were verified with: a command and a date.

1. The build compiles all sixteen components (`ng build`, or `node build.mjs` wrapping it) and regenerates the committed `preview/`
   output with relative asset paths.
2. `node tools/audit/check-classes.js` clean on the rendered preview markup, section 3's class list re-checked against
   `styles/components.css`, and no duplicated CSS inside `preview/`.
3. Headless-browser interaction check against `node tools/audit/serve.js`: dialog opens by mouse and closes on Escape or scrim click,
   Tab wraps in the panel, focus returns to the trigger; arrows move tabs and update `aria-selected`/`hidden`; ArrowUp/ArrowDown and
   Escape in the dropdown; Space toggles the switch; a `ControlValueAccessor` round-trip through `formControl` is observable;
   `role="alert"` announced; no console errors; the viewport widths used are recorded.
4. Light and dark contrast plus 320/375/768/1280 overflow through `tools/audit/harness.js`.
5. `MUE:META` in every file, catalog item added, `node tools/mue.js check all` and `doctor` exit clean.
6. `frameworks/registry.json` gains the real `source`/`preview` paths and a dated `verified` note per binding;
   `node tools/audit/framework-parity.mjs --write` rebuilds the matrix; only then does `frameworks/README.md` move Angular off `planned`.

## 11. Version question and open items

No Angular major or minor is asserted in this repository: the LTS line is picked when work starts and recorded in `MUE:META` `FRAMEWORK:` and in
`frameworks/registry.json`. That pick decides several designs above — decorators versus signal `input()`/`output()`, `@if` versus `<ng-template>`
conditionals, `contentChildren()` versus its decorator equivalent, `stylePreloads` and `baseHref` behaviour, which SSR package applies. Also
unresolved on purpose: where the CLI workspace sits and how the two sheets reach `build.options.styles`; how many wrapper host elements the parity
check must tolerate; whether `--modal-w` becomes an input; Home/End in the tablist; full CLI build or hand-wired entry. None is answerable today.
