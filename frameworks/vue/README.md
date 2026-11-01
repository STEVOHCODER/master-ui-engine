# mue-vue — Vue 3 bindings for MASTER-UI-ENGINE

Sixteen `<script setup>` single-file components that render **the same DOM as the vanilla
previews** under `components/**`. Every class comes from `styles/components.css`, every
colour/radius/motion value from `design-tokens/engine.css`; this package ships **no CSS and
no runtime dependency except Vue** (see the contract in [`../README.md`](../README.md)).

Status: **experimental** — compiled and driven headlessly on 2026-11-03 (commands in
“Verified” below). No screen-reader or touch-device pass has been run yet.

## Install

The engine has no published registry entry for this folder, so install by copy:

1. In your app: `npm i vue` (Vue 3.5 or newer — the components use `defineModel` and `useId`).
2. Copy `frameworks/vue/` into your project (or use it as a workspace package; its
   `exports` point at `./index.js`).
3. Link the two stylesheets your app already serves from this repo:
   `design-tokens/engine.css` and `styles/components.css`. A bundler that compiles `.vue`
   SFCs is required (Vite + `@vitejs/plugin-vue`, `vue-loader`, Nuxt, etc.).

## Usage

```vue
<script setup>
import { MueButton, MueInput } from "mue-vue"; // adjust to your copy path
</script>
<template>
  <MueButton variant="primary" @click="save">Save</MueButton>
  <MueInput v-model="email" label="Email" type="email" :error="emailError" />
</template>
```

One example per component (all sixteen):

```vue
<!-- 1 button -->
<MueButton variant="outline" size="sm" :loading="saving" :block="true">Save</MueButton>
<MueButton variant="ghost" icon-only aria-label="Save">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-width="2" d="M5 13l4 4L19 7"/></svg>
</MueButton>

<!-- 2 input (v-model) -->
<MueInput v-model="name" label="Full name" placeholder="Alex Morgan"
          helper="Shown under the control." :error="taken ? 'This username is already taken.' : null" />

<!-- 3 textarea (v-model) -->
<MueTextarea v-model="bio" label="Bio" :rows="3" />

<!-- 4 select (v-model, native select + .select-wrap chevron from the sheet) -->
<MueSelect v-model="role" label="Role" :options="['Designer', 'Developer']"
           :error="!role ? 'Please select a role.' : null" />

<!-- 5 checkbox (v-model boolean) -->
<MueCheckbox v-model="terms">I agree to the terms of service</MueCheckbox>

<!-- 6 radio group (v-model on the selected value) -->
<MueRadioGroup v-model="plan" legend="Plan" :options="[
  { label: 'Starter — $19/mo', value: 'starter' },
  { label: 'Professional — $49/mo', value: 'pro' },
  { label: 'Legacy', value: 'legacy', disabled: true }
]" />

<!-- 7 switch (v-model boolean; Space toggles like the vanilla input) -->
<MueSwitch v-model="darkMode" label="Dark mode" />

<!-- 8 card -->
<MueCard variant="elevated featured" tag="Featured" title="Design system launch"
         desc="Available for all AI coding agents.">
  <template #actions><MueButton variant="ghost" size="sm">View</MueButton></template>
</MueCard>

<!-- 9 badge -->
<MueBadge variant="primary" :dot="true">New</MueBadge>

<!-- 10 dialog (v-model boolean; Teleport, Escape + focus trap + focus return) -->
<MueButton aria-haspopup="dialog" @click="open = true">Add new item</MueButton>
<MueDialog v-model="open" title="Add new item">
  <MueInput v-model="itemName" label="Item name" placeholder="Enter name" />
  <template #footer>
    <MueButton variant="outline" @click="open = false">Cancel</MueButton>
    <MueButton variant="primary" @click="open = false">Create item</MueButton>
  </template>
</MueDialog>

<!-- 11 dropdown ({label,value,danger?,divider?} or plain strings; @select) -->
<MueDropdown label="Actions" :items="[
  { label: 'Edit', value: 'edit' },
  { label: 'Duplicate', value: 'duplicate' },
  { divider: true },
  { label: 'Delete', value: 'delete', danger: true }
]" @select="run" />

<!-- 12 tabs (v-model = active index; panels via #panel-<i> slots) -->
<MueTabs v-model="tab" aria-label="Item views" :items="[{ label: 'Overview' }, { label: 'Settings' }]">
  <template #panel-0><h3>Overview</h3><p>Key metrics.</p></template>
  <template #panel-1><h3>Settings</h3><p>Preferences.</p></template>
</MueTabs>

<!-- 13 accordion (exclusive by default, like styles/mue.js) -->
<MueAccordion :items="[
  { title: 'Do I need a bundler?', content: 'No. Paste a region and it renders.' },
  { title: 'Does dark mode need extra classes?', content: 'It needs none.' }
]" />

<!-- 14 table (sortable headers publish aria-sort; #cell-<key> slots) -->
<MueTable caption="Active projects" striped :columns="[
  { key: 'project', label: 'Project', sortable: true },
  { key: 'owner',   label: 'Owner',   sortable: true },
  { key: 'status',  label: 'Status',  sortable: true }
]" :rows="rows">
  <template #cell-status="{ value }"><MueBadge :variant="value === 'Active' ? 'success' : 'warning'">{{ value }}</MueBadge></template>
</MueTable>

<!-- 15 notification: alert (mode="alert", static) and toast (mode="toast", animated + self-dismisses) -->
<MueNotification mode="alert" variant="success" title="Changes saved" msg="Saved successfully." />
<div class="toast-region" aria-live="polite"><div class="toast-stack">
  <MueNotification v-for="t in toasts" :key="t.id" mode="toast" :variant="t.variant"
                   :title="t.title" :msg="t.msg" @dismiss="toasts = toasts.filter(x => x.id !== t.id)" />
</div></div>

<!-- 16 avatar (+ group) -->
<MueAvatar>AM</MueAvatar>
<MueAvatar src="/alice.jpg" alt="Alice Morgan" />
<MueAvatar :group="true"><MueAvatar>AM</MueAvatar><MueAvatar>+2</MueAvatar></MueAvatar>
```

## Build the preview gallery

```sh
cd frameworks/vue
npm install          # dev tooling only: vue, vite, @vitejs/plugin-vue
node build.mjs       # compiles all 16 SFCs + preview/App.vue → preview/dist/preview.js
```

`preview/dist/preview.js` (stable name, single chunk, no hashing, `base: "./`) is committed.
Open `preview/gallery.html` through a static server rooted at the **repo root** (e.g.
`npx serve .` there, then `/frameworks/vue/preview/gallery.html`); `file://` won't load the
ES module. The page links `../../../design-tokens/engine.css`, `../../../styles/components.css`
and `../../../styles/mue.js` — mue.js only wires the static theme toggle, because its
tablist/dialog/dropdown boot hooks run before Vue mounts and find nothing to bind.

## Verified (2026-11-03, Windows, Node v24.11.1)

- Resolved devDependencies: `vue 3.5.44`, `vite 8.3.5`, `@vitejs/plugin-vue 6.0.10`
  (`npm install --save-dev vue vite @vitejs/plugin-vue`; never hand-picked).
- `node build.mjs` → exit 0, 25 modules transformed, `preview/dist/preview.js` (103 349 bytes)
  — proves all sixteen SFCs compile.
- Headless Chrome (puppeteer-core) against a `node:http` static server at the repo root,
  page `/frameworks/vue/preview/gallery.html`: **console errors `[]`, page errors `[]`**
  (the only 404 anywhere was the browser's automatic `/favicon.ico` request), and all
  sixteen `#section-*` blocks present. Interactions that passed:
  - email input: typing `bad` → `.field.is-error` + `aria-invalid="true"`; valid address → `.is-success`
  - switch: focus + `Space` → `checked` false→true and bound text updated
  - checkbox click toggled; radio click selected index 2
  - tabs: two × `ArrowRight` → tab 2 selected, focus followed the selection, only panel 2 visible (roving tabindex)
  - dropdown: open → `aria-expanded="true"` + focus on first row; `ArrowDown ×2` → Delete, `ArrowUp` → Duplicate,
    `Escape` → closed and focus back on the trigger; row click → `select` event fired
  - dialog: open → `role=dialog`, `aria-modal`, labelledby resolves, focus inside, `html.mue-locked`;
    Tab×3 stayed trapped; `Escape` → closed, focus returned to `#open-dialog`, scroll lock removed
  - accordion: click → `aria-expanded=true` + panel `is-open`; click again → closed
  - table: click Owner header → `aria-sort="ascending"`, `data-sort="asc"`, first row “Alex Morgan”
  - notification: alert renders `alert alert-success role=alert`; toast button spawned
    `toast toast-success is-open role=alert`; close button removed it (stack empty after 700 ms)
  - theme toggle (mue.js) flipped `html.dark` from the gallery page.

## Not verified / not implemented (honestly)

- **Not verified:** real screen-reader announcements, touch-device behaviour (`(hover:none)`
  control heights), SSR of these components, and any production deploy of the gallery.
- **Not implemented:** dropdown rows take text labels only — the vanilla preview's per-row
  inline SVG icons have no slot (the trigger icon is built in); tabs do not handle
  Home/End (the vanilla source doesn't); accordion panels add `role="region"` +
  `aria-labelledby`, a small ARIA improvement over the vanilla markup, noted in its META;
  the checkbox `description` prop renders unstyled text because `.choice-desc` is
  preview-local CSS, **not** in `styles/components.css` (contract rule 1 forbids using it);
  avatars have no size/variant props because the sheet defines only `.avatar`, `.avatar img`,
  `.avatar-group`; the dialog does not expose the vanilla `--modal-w` override as a prop
  (it would be an inline token value) and keeps the sheet default.
- Toast exit timing is a JS timeout (420 ms / 0 ms under `prefers-reduced-motion`), copied
  from `styles/mue.js` — no CSS duration is hardcoded in this package.

## Layout

```
package.json  index.js  build.mjs  vite.config.js  README.md
components/Mue{Button,Input,Textarea,Select,Checkbox,RadioGroup,Switch,Card,Badge,
               Dialog,Dropdown,Tabs,Accordion,Table,Notification,Avatar}.vue
preview/{index.html,main.js,App.vue,dist/preview.js}   # dist is committed build output
```

## License

MIT. Attribution: MASTER-UI-ENGINE contributors — these are bindings to the
MASTER-UI-ENGINE design system; the design, tokens and classes remain in
`design-tokens/engine.css` and `styles/components.css`.
