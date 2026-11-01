/* BEGIN MUE:META
  COMPONENT: Element registry
  ID: wc-mue-registry
  GROUP: Frameworks > Web Components
  CATEGORY: meta
  ROLE: machine-readable catalog for the site integration step. MUE_ELEMENTS is a plain
    JSON-serialisable array — no functions, no imports. One entry per registered tag.
  STATUS_FIELD: "not-verified" until the headless-Chrome gallery run has exercised it.
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

// status values: "not-verified" | "defined-only" | "interaction-verified"
// Set by the headless-Chrome run of 2026-11-01 (see README): 21 tags defined, 0 shadow roots,
// dialog/tabs/switch/dropdown/accordion/table/toast exercised by real clicks and key presses.
export const MUE_ELEMENTS = [
  {
    tag: "mue-button",
    component: "Button",
    file: "components/mue-button.js",
    variants: ["primary", "secondary", "outline", "ghost", "danger", "success", "link", "sm", "lg", "icon", "block", "loading", "disabled"],
    events: [],
    a11y: "Renders a real <button>; disabled maps to the native attribute; loading sets aria-busy; icon-only needs aria-label.",
    keyboard: "Enter / Space activate (native button).",
    status: "defined-only"
  },
  {
    tag: "mue-input",
    component: "Input",
    file: "components/mue-input.js",
    variants: ["type=text|email|password|search|tel|url|number", "state=error|success", "disabled"],
    events: ["mue-change"],
    a11y: "Label joined by for/id; error sets aria-invalid=true and aria-describedby to the .field-msg; helper text under the control.",
    keyboard: "Native text-input behaviour.",
    status: "defined-only"
  },
  {
    tag: "mue-textarea",
    component: "Textarea",
    file: "components/mue-textarea.js",
    variants: ["state=error|success", "disabled", "rows"],
    events: ["mue-change"],
    a11y: "Label joined by for/id; error sets aria-invalid=true and aria-describedby.",
    keyboard: "Native multi-line editing.",
    status: "defined-only"
  },
  {
    tag: "mue-select",
    component: "Select",
    file: "components/mue-select.js",
    variants: ["state=error|success", "disabled"],
    events: ["mue-change"],
    a11y: "Native <select> keeps OS/keyboard/screen-reader behaviour; label by for/id; error sets aria-invalid + aria-describedby; chevron svg aria-hidden.",
    keyboard: "Native select (type-ahead, arrows, Enter).",
    status: "defined-only"
  },
  {
    tag: "mue-checkbox",
    component: "Checkbox",
    file: "components/mue-checkbox.js",
    variants: ["checked", "disabled"],
    events: ["mue-change"],
    a11y: "Native checkbox wrapped in its own <label>; checked state announced; focus ring lands on the box via input:focus-visible + .box.",
    keyboard: "Space toggles.",
    status: "defined-only"
  },
  {
    tag: "mue-radio",
    component: "Radio",
    file: "components/mue-radio.js",
    variants: ["checked", "disabled"],
    events: ["mue-change"],
    a11y: "Native radio wrapped in its label; exclusivity from a shared name set by <mue-radio-group>.",
    keyboard: "Arrow keys move within the shared-name group; Space selects.",
    status: "defined-only"
  },
  {
    tag: "mue-radio-group",
    component: "Radio Group",
    file: "components/mue-radio-group.js",
    variants: ["disabled"],
    events: ["mue-change"],
    a11y: "<fieldset class=radiogroup> + <legend> name the question; shared name makes options exclusive.",
    keyboard: "Arrow keys move the selection (native radio).",
    status: "defined-only"
  },
  {
    tag: "mue-switch",
    component: "Switch",
    file: "components/mue-switch.js",
    variants: ["checked", "disabled"],
    events: ["mue-change"],
    a11y: "Native checkbox given role=switch + aria-checked; visible track is aria-hidden.",
    keyboard: "Space toggles.",
    status: "interaction-verified"
  },
  {
    tag: "mue-card",
    component: "Card",
    file: "components/mue-card.js",
    variants: ["elevated", "outlined", "featured", "interactive", "selected"],
    events: [],
    a11y: "A group of real elements, never a div with a click handler; selected sets aria-pressed.",
    keyboard: "Interactive cards focus via their own links/buttons.",
    status: "defined-only"
  },
  {
    tag: "mue-badge",
    component: "Badge",
    file: "components/mue-badge.js",
    variants: ["primary", "success", "warning", "danger", "error", "info", "solid", "dot"],
    events: [],
    a11y: "Conveys state through text, not colour alone; decorative dot is aria-hidden.",
    keyboard: "None.",
    status: "defined-only"
  },
  {
    tag: "mue-dialog",
    component: "Dialog",
    file: "components/mue-dialog.js",
    variants: ["open"],
    events: ["mue-open", "mue-close"],
    a11y: "role=dialog + aria-modal=true + aria-labelledby; focus moves in on open and back on close; Tab trapped; scrim never focused.",
    keyboard: "Escape closes; Tab / Shift+Tab cycle within the panel.",
    status: "interaction-verified"
  },
  {
    tag: "mue-dropdown",
    component: "Dropdown",
    file: "components/mue-dropdown.js",
    variants: ["trigger variant=primary|secondary|outline|ghost|danger|success"],
    events: ["mue-select", "mue-open", "mue-close"],
    a11y: "Trigger has aria-haspopup + aria-expanded; menu aria-hidden when closed (fade, not display:none); rows are real buttons.",
    keyboard: "Enter/Space opens; ArrowUp/Down walk + wrap; Home/End; Escape closes and refocuses trigger.",
    status: "interaction-verified"
  },
  {
    tag: "mue-tabs",
    component: "Tabs",
    file: "components/mue-tabs.js",
    variants: ["selected index"],
    events: ["mue-change"],
    a11y: "role=tablist/tab/tabpanel with aria-controls + aria-labelledby; aria-selected marks active; inactive panels get hidden; roving tabindex (data-mue-bound opts out of the vanilla mue.js handler).",
    keyboard: "ArrowLeft/Right + Home/End move focus; Enter/Space (or click) activate.",
    status: "interaction-verified"
  },
  {
    tag: "mue-tab",
    component: "Tab",
    file: "components/mue-tab.js",
    variants: ["disabled"],
    events: [],
    a11y: "role=tab, aria-selected + aria-controls managed by <mue-tabs>.",
    keyboard: "Controlled by <mue-tabs> (arrows move focus, Enter/Space activate).",
    status: "interaction-verified"
  },
  {
    tag: "mue-tabpanel",
    component: "Tab Panel",
    file: "components/mue-tabpanel.js",
    variants: [],
    events: [],
    a11y: "role=tabpanel + aria-labelledby; tabindex=0; hidden when inactive.",
    keyboard: "None of its own.",
    status: "interaction-verified"
  },
  {
    tag: "mue-accordion",
    component: "Accordion",
    file: "components/mue-accordion.js",
    variants: ["multiple"],
    events: ["mue-change"],
    a11y: "Delegates roles to items; single-open by default (closes siblings), add multiple for several.",
    keyboard: "Enter/Space on each trigger.",
    status: "interaction-verified"
  },
  {
    tag: "mue-accordion-item",
    component: "Accordion Item",
    file: "components/mue-accordion-item.js",
    variants: ["open"],
    events: ["mue-change"],
    a11y: "Trigger is a real <button> with aria-expanded + aria-controls; panel is a labelled region kept in the flow.",
    keyboard: "Enter/Space toggle.",
    status: "interaction-verified"
  },
  {
    tag: "mue-table",
    component: "Table",
    file: "components/mue-table.js",
    variants: ["striped", "compact"],
    events: ["mue-sort"],
    a11y: "Wrapped in .table-wrap; <th scope=col>; sortable headers get tabindex=0 + aria-sort; striping is decoration only.",
    keyboard: "Enter/Space on a focused [data-sort] header sorts it.",
    status: "interaction-verified"
  },
  {
    tag: "mue-notification",
    component: "Notification (alert + toast)",
    file: "components/mue-notification.js",
    variants: ["type=alert|toast", "variant=success|error|danger|warning|info"],
    events: ["mue-close"],
    a11y: "role=alert so text is announced; icon glyph aria-hidden; dismiss is a real labelled button; toasts never steal focus.",
    keyboard: "Close button dismisses a toast; Escape does not trap (a toast is not modal).",
    status: "interaction-verified"
  },
  {
    tag: "mue-avatar",
    component: "Avatar",
    file: "components/mue-avatar.js",
    variants: ["src (image)", "initials", "name"],
    events: [],
    a11y: "Image avatars keep alt; initials are real text; aria-label from name. No size/shape class exists in components.css, so none is exposed.",
    keyboard: "None.",
    status: "defined-only"
  },
  {
    tag: "mue-avatar-group",
    component: "Avatar Group",
    file: "components/mue-avatar-group.js",
    variants: ["label"],
    events: [],
    a11y: "role=group + aria-label over a stack of <mue-avatar> children.",
    keyboard: "None.",
    status: "defined-only"
  }
];

export default MUE_ELEMENTS;
