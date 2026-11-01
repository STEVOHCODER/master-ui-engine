<!-- BEGIN MUE:META
  COMPONENT: vue preview gallery
  ID: vue-preview-gallery
  GROUP: Frameworks / Vue 3
  FRAMEWORK: vue 3
  DEPENDENCIES: index.js (sixteen SFCs); styles come only from design-tokens/engine.css + styles/components.css
  NOTES: every section below uses classes defined in styles/components.css (page, shell, section, demo-area, stack, row,
         grid-auto, btn-row, toast-region, toast-stack). No local <style> block exists — that would be a second stylesheet.
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META -->
<script setup>
import { ref } from "vue";
import {
  MueButton, MueInput, MueTextarea, MueSelect, MueCheckbox, MueRadioGroup,
  MueSwitch, MueCard, MueBadge, MueDialog, MueDropdown, MueTabs,
  MueAccordion, MueTable, MueNotification, MueAvatar,
  MueDatePicker, MueDropzone, MueChart, MueRating, MueRatingInput, MuePopover,
  MueModal, MueFooter, MueProgress, MueSkeleton, MueEmptyState, MueErrorState,
  MueStepper, MueBreadcrumbs, MuePagination, MueSidebar, MueHeaderNav, MueNavMenu,
  MueTour, MueFloatButton, MueDataTable,
} from "../index.js";

/* forms */
const fullName = ref("");
const email = ref("");
const bio = ref("");
const role = ref("Designer");
const department = ref("Pick one");
const subscribed = ref(false);
const terms = ref(true);
const plan = ref("pro");
const darkMode = ref(false);
const notifications = ref(true);

/* dialog */
const dialogOpen = ref(false);
const itemName = ref("");
const itemDesc = ref("");

/* dropdown */
const lastAction = ref("No action yet.");

/* tabs */
const activeTab = ref(0);

/* toasts */
let toastId = 0;
const toasts = ref([]);
const spawn = (variant) => {
  const copy = {
    success: ["Success", "Operation completed successfully."],
    error: ["Error", "Something went wrong. Please try again."],
    warning: ["Warning", "Please review the highlighted fields."],
    info: ["Info", "New features are available."],
  }[variant];
  toasts.value.push({ id: ++toastId, variant, title: copy[0], msg: copy[1] });
};
const dropToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

/* table */
const columns = [
  { key: "num", label: "#" },
  { key: "project", label: "Project", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "updated", label: "Updated", sortable: true },
];
const rows = [
  { num: "01", project: "Dashboard redesign", owner: "Alex Morgan", status: "Active", updated: "2h ago" },
  { num: "02", project: "Mobile app v2", owner: "Sam Rivera", status: "In review", updated: "1d ago" },
  { num: "03", project: "Marketing site", owner: "Jules Kim", status: "On hold", updated: "3d ago" },
  { num: "04", project: "API migration", owner: "Alex Morgan", status: "Active", updated: "5d ago" },
];

/* date picker */
const shippedOn = ref("");

/* dropzone */
const uploaded = ref([{ name: "quarterly-report.pdf", size: "248 KB" }]);

/* rating */
const ratingInput = ref(4);

/* modal */
const modalOpen = ref(false);
const modalItemName = ref("");

/* progress (interactive demo) */
const progressValue = ref(0);

/* stepper */
const checkoutSteps = [
  { name: "Account", text: "Verified" },
  { name: "Workspace", text: "Two seats added" },
  { name: "Billing", text: "Choose a plan" },
  { name: "Invite", text: "Optional" },
];
const timelineSteps = [
  { name: "Marketing sections region", text: "Shipped 2026-10-28", body: "Hero, pricing, testimonials and the closing band." },
  { name: "Stepper, dropzone, rating, popover", text: "In review", body: "Four new regions in this sheet." },
  { name: "Command palette", text: "Planned", body: "Keyboard-first search over the catalog." },
];
const stepIndex = ref(2);
const timelineIndex = ref(1);

/* breadcrumbs */
const lastCrumb = ref("Analytics dashboard");

/* pagination */
const bookPage = ref(3);

/* sidebar */
const sidebarActive = ref("Dashboard");

/* header nav */
const navLinks = [
  { label: "Dashboard", href: "#section-headernav", active: true },
  { label: "Projects", href: "#section-headernav" },
  { label: "Team", href: "#section-headernav" },
  { label: "Settings", href: "#section-headernav" },
];

/* nav menu (with a dropdown) */
const menuLinks = [
  { label: "Dashboard", href: "#section-navmenu", active: true },
  {
    label: "Resources",
    children: [
      { label: "Documentation", value: "docs" },
      { label: "Templates", value: "templates" },
      { label: "Design systems", value: "design" },
    ],
  },
  { label: "Team", href: "#section-navmenu" },
  { label: "Settings", href: "#section-navmenu" },
];
const menuPick = ref("No menu item chosen yet.");

/* tour */
const tourSteps = [
  { title: "Recalculate reads the live ledger", body: "Every forecast recomputes from the order ledger on click.", targetLabel: "Recalculate", placement: "end" },
  { title: "Export carries the stamp", body: "CSV, XLSX or a link — each stamped with the recalculation time.", targetLabel: "Export", placement: "end" },
  { title: "Nothing changes silently", body: "Every edit is written to the audit trail with who and when.", targetLabel: "Audit trail", placement: "top" },
  { title: "Save the view, not a copy", body: "A saved view keeps the columns, grouping and filters.", targetLabel: "Save view", placement: "top end" },
];

/* float buttons dock */
const floatVariants = [
  { label: "Help", glyph: "help" },
  { label: "Back to top", glyph: "up", variant: "primary", scrollToTop: true },
  { label: "Contact support", glyph: "chat", variant: "label", text: "Contact support" },
];
const floatDock = [
  { label: "New forecast", glyph: "plus", variant: "primary" },
  { label: "Chat with support", glyph: "chat" },
  { label: "Back to top", glyph: "up", scrollToTop: true },
];
const floatPick = ref("No float button pressed yet.");

/* data table */
const dtColumns = [
  { key: "customer", label: "Customer", sortable: true },
  { key: "order", label: "Order" },
  { key: "status", label: "Status", filterOptions: ["Paid", "In transit", "Disputed"] },
  { key: "amount", label: "Amount", sortable: true, numeric: true, mono: true },
  { key: "placed", label: "Placed", sortable: true, mono: true },
];
const dtRows = [
  { id: "98214", customer: "Kai Tanaka", order: "ORD-98214", status: "Paid", amount: 11480.0, placed: "28 Oct 2026", search: "kai tanaka ord-98214", detail: [{ label: "Ship to", value: "4-11-7 Akasaka, Tokyo, Japan" }, { label: "Payment", value: "JCB ending 8811" }] },
  { id: "98207", customer: "Amara Okafor", order: "ORD-98207", status: "In transit", amount: 2340.0, placed: "27 Oct 2026", search: "amara okafor ord-98207", detail: [{ label: "Ship to", value: "14 Adeola Odeku St, Lagos, Nigeria" }, { label: "Payment", value: "Bank transfer - settled" }] },
  { id: "98199", customer: "Lucas Meyer", order: "ORD-98199", status: "Disputed", amount: 8910.5, placed: "26 Oct 2026", search: "lucas meyer ord-98199", detail: [{ label: "Ship to", value: "Speyerer Strasse 42, Heidelberg, Germany" }, { label: "Dispute", value: "Goods not received" }] },
  { id: "98186", customer: "Priya Raman", order: "ORD-98186", status: "Paid", amount: 460.0, placed: "24 Oct 2026", search: "priya raman ord-98186", detail: [{ label: "Ship to", value: "Residency Road, Bengaluru, India" }, { label: "Payment", value: "UPI - reference 4471" }] },
  { id: "98175", customer: "Sofia Almeida", order: "ORD-98175", status: "In transit", amount: 14200.0, placed: "23 Oct 2026", search: "sofia almeida ord-98175", detail: [{ label: "Ship to", value: "Rua da Prata 118, Lisboa, Portugal" }, { label: "Payment", value: "Multibanco - paid" }] },
  { id: "98164", customer: "Daniel Whitfield", order: "ORD-98164", status: "Paid", amount: 3725.25, placed: "22 Oct 2026", search: "daniel whitfield ord-98164", detail: [{ label: "Ship to", value: "Ballymount Cross, Dublin, Ireland" }, { label: "Payment", value: "Visa ending 4242" }] },
  { id: "98152", customer: "Yuki Sato", order: "ORD-98152", status: "Disputed", amount: 1180.0, placed: "20 Oct 2026", search: "yuki sato ord-98152", detail: [{ label: "Ship to", value: "Nishishinjuku, Tokyo, Japan" }, { label: "Dispute", value: "Damaged on arrival" }] },
  { id: "98141", customer: "Fatima Al-Hassan", order: "ORD-98141", status: "In transit", amount: 22640.0, placed: "19 Oct 2026", search: "fatima al-hassan ord-98141", detail: [{ label: "Ship to", value: "Al Quoz Industrial 3, Dubai, UAE" }, { label: "Payment", value: "Letter of credit" }] },
];
const dtLoading = ref(false);
function refreshTable() {
  dtLoading.value = true;
  window.setTimeout(() => {
    dtLoading.value = false;
  }, 1200);
}
</script>

<template>
  <div>
    <!-- 1 button -->
    <div class="section" id="section-button">
      <h2>Button</h2>
      <p>Ported from <code>components/buttons/buttons.html</code>. Variants, sizes and the loading sweep are the sheet's classes.</p>
      <div class="btn-row">
        <MueButton variant="primary">Primary</MueButton>
        <MueButton variant="secondary">Secondary</MueButton>
        <MueButton variant="outline">Outline</MueButton>
        <MueButton variant="ghost">Ghost</MueButton>
        <MueButton variant="danger">Danger</MueButton>
        <MueButton variant="success">Success</MueButton>
        <MueButton variant="link">Link</MueButton>
      </div>
      <div class="btn-row">
        <MueButton variant="primary" size="sm">Small</MueButton>
        <MueButton variant="primary">Base</MueButton>
        <MueButton variant="primary" size="lg">Large</MueButton>
        <MueButton variant="primary" disabled>Disabled</MueButton>
        <MueButton variant="primary" :loading="true">Saving…</MueButton>
        <MueButton variant="outline" icon-only aria-label="Save">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        </MueButton>
      </div>
    </div>

    <!-- 2 input -->
    <div class="section" id="section-input">
      <h2>Input</h2>
      <p>v-model, helper text, and live validation — the <code>is-error</code>/<code>is-success</code> state sits on the field wrapper.</p>
      <div class="stack">
        <MueInput v-model="fullName" label="Full name" placeholder="Alex Morgan" autocomplete="name" helper="We'll use this to personalize your dashboard." />
        <MueInput
          v-model="email"
          type="email"
          label="Email address"
          placeholder="alex@example.com"
          autocomplete="email"
          :error="email && !email.includes('@') ? 'Enter a valid email address.' : null"
          :success="email && email.includes('@') ? 'Email looks good.' : null"
        />
        <MueInput label="Disabled input" disabled placeholder="Cannot edit" />
      </div>
    </div>

    <!-- 3 textarea -->
    <div class="section" id="section-textarea">
      <h2>Textarea</h2>
      <div class="stack">
        <MueTextarea v-model="bio" label="Bio" rows="3" placeholder="Tell us about yourself..." helper="A closed .field column, exactly like the vanilla preview." />
      </div>
    </div>

    <!-- 4 select -->
    <div class="section" id="section-select">
      <h2>Select</h2>
      <p>Native select inside the sheet's <code>.select-wrap</code> chevron; the browser still owns the option list.</p>
      <div class="stack">
        <MueSelect v-model="role" label="Role" :options="['Designer', 'Developer', 'Product Manager']" helper="Your choice now: shows v-model working." />
        <MueSelect
          v-model="department"
          label="Department (error)"
          :options="[
            { label: 'Pick one', value: 'Pick one' },
            { label: 'Engineering', value: 'Engineering' },
            { label: 'Design', value: 'Design' },
          ]"
          error="Please select a department."
        />
      </div>
    </div>

    <!-- 5 checkbox -->
    <div class="section" id="section-checkbox">
      <h2>Checkbox</h2>
      <p>Native checkbox inside its own label; the visible box is painted from <code>:checked</code>.</p>
      <div class="checkbox-group">
        <MueCheckbox v-model="subscribed">Subscribe to newsletter</MueCheckbox>
        <MueCheckbox v-model="terms">I agree to the terms of service</MueCheckbox>
        <MueCheckbox :model-value="true" disabled>Receive marketing emails</MueCheckbox>
      </div>
    </div>

    <!-- 6 radio -->
    <div class="section" id="section-radio">
      <h2>Radio group</h2>
      <p>fieldset + legend; exclusivity and arrow-key cycling are the browser's job via the shared name.</p>
      <MueRadioGroup
        v-model="plan"
        legend="Plan"
        :options="[
          { label: 'Starter — $19/mo', value: 'starter' },
          { label: 'Professional — $49/mo', value: 'pro' },
          { label: 'Enterprise — $199/mo', value: 'enterprise' },
          { label: 'Legacy (disabled)', value: 'legacy', disabled: true },
        ]"
      />
    </div>

    <!-- 7 switch -->
    <div class="section" id="section-switch">
      <h2>Switch</h2>
      <p id="switch-state">Dark mode is {{ darkMode ? "on" : "off" }} — toggle with Space once the input has focus.</p>
      <div class="stack" id="switch-demo">
        <MueSwitch v-model="darkMode" label="Dark mode" />
        <MueSwitch v-model="notifications" label="Push notifications" />
        <MueSwitch :model-value="true" disabled label="Auto-save (disabled)" />
      </div>
    </div>

    <!-- 8 card -->
    <div class="section" id="section-card">
      <h2>Card</h2>
      <div class="grid-auto">
        <MueCard tag="Design" title="UI design fundamentals" desc="Learn spacing, typography, and color principles for interfaces.">
          <template #media>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 8"/></svg>
          </template>
          <template #actions>
            <MueBadge>12 min read</MueBadge>
            <MueButton variant="link">Read →</MueButton>
          </template>
        </MueCard>
        <MueCard variant="elevated featured" tag="Featured" title="Design system launch" desc="MASTER-UI-ENGINE is now available for all AI coding agents.">
          <template #actions>
            <MueBadge variant="primary" :dot="true">New</MueBadge>
            <MueButton variant="ghost" size="sm">View</MueButton>
          </template>
        </MueCard>
      </div>
    </div>

    <!-- 9 badge -->
    <div class="section" id="section-badge">
      <h2>Badge</h2>
      <div class="btn-row">
        <MueBadge>Neutral</MueBadge>
        <MueBadge variant="primary">Primary</MueBadge>
        <MueBadge variant="success">Success</MueBadge>
        <MueBadge variant="warning">Warning</MueBadge>
        <MueBadge variant="error">Error</MueBadge>
        <MueBadge variant="info" :dot="true">Info</MueBadge>
        <MueBadge variant="success" solid>Solid</MueBadge>
      </div>
    </div>

    <!-- 10 dialog -->
    <div class="section" id="section-dialog">
      <h2>Dialog</h2>
      <p>Escape closes, Tab is trapped inside, focus returns to the trigger. The page behind is scroll-locked.</p>
      <div class="demo-area">
        <MueButton id="open-dialog" variant="primary" aria-haspopup="dialog" @click="dialogOpen = true">Add new item</MueButton>
      </div>
      <MueDialog v-model="dialogOpen" title="Add new item">
        <div class="stack">
          <MueInput v-model="itemName" label="Item name" placeholder="Enter name" />
          <MueInput v-model="itemDesc" label="Description" placeholder="Optional description" />
          <p class="field-helper">The item will be added to your current list.</p>
        </div>
        <template #footer>
          <MueButton variant="outline" @click="dialogOpen = false">Cancel</MueButton>
          <MueButton variant="primary" @click="dialogOpen = false">Create item</MueButton>
        </template>
      </MueDialog>
    </div>

    <!-- 11 dropdown -->
    <div class="section" id="section-dropdown">
      <h2>Dropdown</h2>
      <p id="dropdown-last">{{ lastAction }}</p>
      <div class="demo-area" id="dropdown-demo">
        <MueDropdown
          label="Actions"
          :items="[
            { label: 'Edit', value: 'edit' },
            { label: 'Duplicate', value: 'duplicate' },
            { divider: true, label: '' },
            { label: 'Delete', value: 'delete', danger: true },
          ]"
          @select="(v) => (lastAction = `Selected: ${v}`)"
        />
      </div>
    </div>

    <!-- 12 tabs -->
    <div class="section" id="section-tabs">
      <h2>Tabs</h2>
      <p>Arrow-left / Arrow-right move focus and activate, roving tabindex included.</p>
      <div id="tabs-demo">
        <MueTabs
          v-model="activeTab"
          aria-label="Item views"
          :items="[
            { label: 'Overview', content: 'A high-level summary of the selected item with key metrics and recent activity.' },
            { label: 'Details', content: 'Detailed specifications, attributes, and configuration options.' },
            { label: 'Settings', content: 'Preferences and controls for customizing behavior.' },
          ]"
        />
      </div>
    </div>

    <!-- 13 accordion -->
    <div class="section" id="section-accordion">
      <h2>Accordion</h2>
      <MueAccordion
        :items="[
          { title: 'Do I need a bundler?', content: 'No. Link the engine and this sheet, paste a region, and the section renders.' },
          { title: 'Does dark mode need extra classes?', content: 'It needs none. Every rule reads semantics, so html.dark re-themes the whole page.' },
          { title: 'What about images and fonts?', content: 'Nothing in the kit fetches anything. Fonts fall back to the system stack.' },
        ]"
      />
    </div>

    <!-- 14 table -->
    <div class="section" id="section-table">
      <h2>Table</h2>
      <MueTable :columns="columns" :rows="rows" caption="Active projects" striped>
        <template #cell-status="{ value }">
          <MueBadge :variant="value === 'Active' ? 'success' : value === 'In review' ? 'warning' : null">{{ value }}</MueBadge>
        </template>
      </MueTable>
    </div>

    <!-- 15 notification -->
    <div class="section" id="section-notification">
      <h2>Notification (alert + toast)</h2>
      <div class="btn-row">
        <MueButton id="toast-success-btn" variant="primary" @click="spawn('success')">Success</MueButton>
        <MueButton variant="outline" @click="spawn('error')">Error</MueButton>
        <MueButton variant="outline" @click="spawn('warning')">Warning</MueButton>
        <MueButton variant="outline" @click="spawn('info')">Info</MueButton>
      </div>
      <div class="stack">
        <MueNotification mode="alert" variant="success" title="Changes saved" msg="Your changes have been saved successfully." />
      </div>
    </div>

    <!-- 16 avatar -->
    <div class="section" id="section-avatar">
      <h2>Avatar (+ group)</h2>
      <div class="row">
        <MueAvatar>AM</MueAvatar>
        <MueAvatar>SR</MueAvatar>
        <MueAvatar :group="true">
          <MueAvatar>AM</MueAvatar>
          <MueAvatar>JK</MueAvatar>
          <MueAvatar>SR</MueAvatar>
          <MueAvatar>+2</MueAvatar>
        </MueAvatar>
      </div>
    </div>

    <!-- 17 date picker -->
    <div class="section" id="section-datepicker">
      <h2>Date picker</h2>
      <p>Native <code>&lt;input type="date"&gt;</code> inside the sheet's <code>.field</code>; the platform owns the calendar popover. You picked: <b>{{ shippedOn || "nothing yet" }}</b>.</p>
      <div class="stack">
        <MueDatePicker v-model="shippedOn" label="Ship on" helper="Use the picker or type YYYY-MM-DD." />
        <MueDatePicker label="Latest delivery" model-value="" min="2026-01-01" max="2026-12-31" error="This date is outside the allowed range." />
      </div>
    </div>

    <!-- 18 dropzone -->
    <div class="section" id="section-dropzone">
      <h2>File upload (dropzone)</h2>
      <p>Drag files over the target (it lights up via <code>.is-dragging</code>) or click to browse; picked files list below and each row can be removed.</p>
      <MueDropzone
        v-model="uploaded"
        label="Upload project files"
        title="Drop files here"
        hint="PDF, CSV or PNG up to 10 MB each."
        multiple
      />
    </div>

    <!-- 19 chart -->
    <div class="section" id="section-chart">
      <h2>Chart (bar + line)</h2>
      <p>Geometry is computed from the data into the shared <code>.chart</code> SVG; the bars animate and the line draws from the sheet.</p>
      <div class="grid-auto">
        <MueChart
          type="bar"
          title="Quarterly revenue"
          :bars="[
            { label: 'Q1', value: 42 },
            { label: 'Q2', value: 68, tone: 'success' },
            { label: 'Q3', value: 55 },
            { label: 'Q4', value: 80, tone: 'warning' },
          ]"
          :legend="[{ label: 'This year', tone: 'primary' }, { label: 'Beats plan', tone: 'success' }, { label: 'Watch', tone: 'warning' }]"
        />
        <MueChart
          type="line"
          title="Weekly active users"
          :values="[12, 18, 15, 24, 30, 27, 38]"
          :labels="['M', 'T', 'W', 'T', 'F', 'S', 'S']"
          note="Up 38% week over week."
        />
      </div>
    </div>

    <!-- 20 rating (read-only) -->
    <div class="section" id="section-rating">
      <h2>Rating (read-only)</h2>
      <div class="stack">
        <MueRating :value="4.5" caption="312 reviews" />
        <MueRating :value="3" />
        <MueRating :value="0.5" caption="Just launched" />
      </div>
    </div>

    <!-- 21 rating input -->
    <div class="section" id="section-ratinginput">
      <h2>Rating input</h2>
      <p>Five radios in 1-5 order — Tab in, then Left/Right (or Up/Down) move the value; Space commits. You rated: <b>{{ ratingInput || 0 }} / 5</b>.</p>
      <MueRatingInput v-model="ratingInput" legend="Rate this component" />
    </div>

    <!-- 22 popover -->
    <div class="section" id="section-popover">
      <h2>Popover</h2>
      <p>Hover reveals it; click or Enter pins it (Escape and an outside click dismiss). The surface is <code>role="note"</code>.</p>
      <div class="demo-area">
        <MuePopover title="Checklist" text="Everything below ships with the sheet." :items="['No build step', 'Light + dark', 'Keyboard operable']" placement="start">
          <template #trigger>Details</template>
        </MuePopover>
      </div>
    </div>

    <!-- 23 modal -->
    <div class="section" id="section-modal">
      <h2>Modal</h2>
      <p>Escape closes, Tab is trapped inside, focus returns to the trigger; the page behind is scroll-locked. Name typed: <b>{{ modalItemName || "—" }}</b>.</p>
      <div class="demo-area">
        <MueButton id="open-modal" variant="primary" aria-haspopup="dialog" @click="modalOpen = true">Add new item</MueButton>
      </div>
      <MueModal v-model="modalOpen" title="Add new item" modal-width="35rem">
        <div class="stack">
          <MueInput v-model="modalItemName" label="Item name" placeholder="Enter name" />
          <p class="field-helper">The item will be added to your current list.</p>
        </div>
        <template #footer>
          <MueButton variant="outline" @click="modalOpen = false">Cancel</MueButton>
          <MueButton variant="primary" @click="modalOpen = false">Create item</MueButton>
        </template>
      </MueModal>
    </div>

    <!-- 24 footer -->
    <div class="section" id="section-footer">
      <h2>Footer</h2>
      <MueFooter
        brand="MASTER-UI-ENGINE"
        desc="Reusable UI/UX components and design systems for AI coding agents."
        :columns="[
          { heading: 'Product', links: [{ label: 'Components' }, { label: 'Templates' }, { label: 'Design systems' }] },
          { heading: 'Resources', links: [{ label: 'Documentation' }, { label: 'Accessibility' }, { label: 'Changelog' }] },
          { heading: 'Legal', links: [{ label: 'Privacy' }, { label: 'Terms' }, { label: 'License' }] },
        ]"
        copyright="© 2026 MASTER-UI-ENGINE. MIT Licensed."
        :social="[{ label: 'GH', ariaLabel: 'GitHub' }, { label: 'TW', ariaLabel: 'Twitter' }, { label: 'DC', ariaLabel: 'Discord' }]"
      />
    </div>

    <!-- 25 progress -->
    <div class="section" id="section-progress">
      <h2>Progress</h2>
      <p>Determinate, semantic variants, striped, indeterminate, and an interactive readout — the fill reads the <code>--value</code> token.</p>
      <div class="stack">
        <MueProgress label="Upload" :value="65" />
        <MueProgress label="Processing" :value="100" variant="success" />
        <MueProgress label="Review" :value="30" variant="warning" />
        <MueProgress label="Sync" :value="45" variant="striped" />
        <MueProgress label="Working" variant="indeterminate" />
        <MueProgress id="dt-demo-progress" label="Demo progress" :value="progressValue" />
      </div>
      <div class="btn-row" style="margin-top: var(--space-4)">
        <MueButton id="progress-25" variant="outline" size="sm" @click="progressValue = 25">25%</MueButton>
        <MueButton variant="outline" size="sm" @click="progressValue = 50">50%</MueButton>
        <MueButton variant="outline" size="sm" @click="progressValue = 75">75%</MueButton>
        <MueButton variant="primary" size="sm" @click="progressValue = 100">Complete</MueButton>
      </div>
    </div>

    <!-- 26 skeleton -->
    <div class="section" id="section-skeleton">
      <h2>Skeleton</h2>
      <p>Placeholder shapes that hold layout while content loads. Each root announces <code>role="status"</code> and hides the bars from readers.</p>
      <div class="grid-auto">
        <MueSkeleton variant="card" />
        <MueSkeleton variant="list" />
      </div>
      <div style="margin-top: var(--space-4)"><MueSkeleton variant="button" /></div>
    </div>

    <!-- 27 empty state -->
    <div class="section" id="section-empty">
      <h2>Empty state</h2>
      <MueEmptyState icon="🔍" title="No results found" desc="Try adjusting your search terms or filters.">
        <template #actions>
          <MueButton variant="outline">Clear filters</MueButton>
          <MueButton variant="primary">Browse all</MueButton>
        </template>
      </MueEmptyState>
    </div>

    <!-- 28 error state -->
    <div class="section" id="section-error">
      <h2>Error state</h2>
      <div class="stack">
        <MueErrorState title="Something went wrong" desc="We couldn't load your projects. Please refresh or contact support.">
          <template #actions>
            <MueButton variant="outline">Refresh</MueButton>
            <MueButton variant="primary">Contact support</MueButton>
          </template>
        </MueErrorState>
        <MueErrorState inline title="Payment declined" desc="Your card was rejected by the issuer. Try a different payment method.">
          <template #actions>
            <MueButton variant="primary" size="sm">Retry</MueButton>
          </template>
        </MueErrorState>
      </div>
    </div>

    <!-- 29 stepper -->
    <div class="section" id="section-stepper">
      <h2>Stepper (+ timeline)</h2>
      <p>The three states are classes; this binding turns the active step into a model and adds Back/Next (and ArrowLeft/ArrowRight).</p>
      <MueStepper v-model="stepIndex" :steps="checkoutSteps" controls next-label="Continue" />
      <p class="card-title" style="margin-top: var(--space-6)">Changelog timeline</p>
      <MueStepper v-model="timelineIndex" variant="timeline" :steps="timelineSteps" controls />
    </div>

    <!-- 30 breadcrumbs -->
    <div class="section" id="section-breadcrumbs">
      <h2>Breadcrumbs</h2>
      <p>Click a crumb to see the <code>select</code> event: last activated was <b>{{ lastCrumb }}</b>.</p>
      <MueBreadcrumbs
        :items="[
          { label: 'Home' },
          { label: 'Products' },
          { label: 'Software' },
          { label: 'Analytics dashboard' },
        ]"
        @select="(c) => (lastCrumb = c.label)"
      />
    </div>

    <!-- 31 pagination -->
    <div class="section" id="section-pagination">
      <h2>Pagination</h2>
      <p>Controlled with <code>v-model</code>; the window collapses to first/last + a sibling range with ellipsis gaps. Current page: <b>{{ bookPage }}</b>.</p>
      <MuePagination v-model="bookPage" :pages="20" :sibling="1" />
    </div>

    <!-- 32 sidebar -->
    <div class="section" id="section-sidebar">
      <h2>Sidebar</h2>
      <p>Sectioned nav; clicking a link moves the active row (v-model). Active: <b>{{ sidebarActive }}</b>.</p>
      <div style="padding: var(--space-4); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); background: var(--bg-surface)">
        <MueSidebar
          v-model="sidebarActive"
          brand="App"
          :sections="[
            { heading: 'Workspace', links: [
              { label: 'Dashboard', icon: '★' },
              { label: 'Projects', icon: '📄' },
              { label: 'Team', icon: '👥' },
              { label: 'Messages', icon: '✉' },
            ] },
            { heading: 'Account', links: [{ label: 'Settings', icon: '⚙' }] },
          ]"
        />
      </div>
    </div>

    <!-- 33 header nav -->
    <div class="section" id="section-headernav">
      <h2>Header navigation</h2>
      <p>Narrow the window (below 768px) and the links collapse behind the hamburger into a drawer (Escape/outside click close it). Scrolling past 8px adds the shadow.</p>
      <MueHeaderNav brand="Brand" :links="navLinks">
        <template #actions>
          <MueButton variant="outline" size="sm">Sign in</MueButton>
          <MueAvatar>JS</MueAvatar>
        </template>
      </MueHeaderNav>
    </div>

    <!-- 34 navigation menu -->
    <div class="section" id="section-navmenu">
      <h2>Navigation menu (with dropdown)</h2>
      <p id="navmenu-last">{{ menuPick }}</p>
      <MueNavMenu :links="menuLinks" @select="(v) => (menuPick = `Picked: ${v}`)" />
    </div>

    <!-- 35 tour -->
    <div class="section" id="section-tour">
      <h2>Product tour (coachmark)</h2>
      <p>Next/Back walk the steps, Skip and Escape close the tour (focus returns to Replay), and the open step's target is spotlighted.</p>
      <MueTour :steps="tourSteps" :start="1" />
    </div>

    <!-- 36 float buttons -->
    <div class="section" id="section-floatbtn">
      <h2>Float buttons</h2>
      <p id="float-last">{{ floatPick }}</p>
      <p>Inline variants:</p>
      <MueFloatButton :buttons="floatVariants" @select="(b) => (floatPick = `Pressed: ${b.label}`)" />
      <p class="card-desc" style="margin-top: var(--space-4)">The docked group below pins to the corner and rises into place once the page scrolls past 420px — try scrolling.</p>
      <MueFloatButton docked :buttons="floatDock" @select="(b) => (floatPick = `Pressed: ${b.label}`)" />
    </div>

    <!-- 37 data table -->
    <div class="section" id="section-datatable">
      <h2>Data table</h2>
      <p>Live selection, sorting, a status filter, expandable detail rows, search, density, page size and a loading state — all on the shared <code>#datatable</code> classes.</p>
      <div class="demo-area" style="margin-bottom: var(--space-4)">
        <MueButton id="dt-refresh" variant="outline" size="sm" @click="refreshTable">Refresh (loading)</MueButton>
      </div>
      <MueDataTable
        :columns="dtColumns"
        :rows="dtRows"
        caption="Open orders, sortable, filterable and selectable"
        selectable
        expandable
        :loading="dtLoading"
        :page-sizes="[5, 8]"
        empty-title="No orders match those filters"
      >
        <template #cell-customer="{ row }">
          <span class="cell-user"><span class="avatar" aria-hidden="true">{{ row.customer.split(' ').map((p) => p[0]).join('').slice(0, 2) }}</span>
            <span><span class="cell-user-name">{{ row.customer }}</span>
            <span class="cell-user-sub">{{ row.order }}</span></span></span>
        </template>
        <template #cell-status="{ value }">
          <span class="badge" :class="value === 'Paid' ? 'badge-success' : value === 'In transit' ? 'badge-info' : 'badge-danger'"><span class="dot"></span>{{ value }}</span>
        </template>
        <template #cell-amount="{ value }">${{ Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</template>
      </MueDataTable>
    </div>

    <!-- toast host: same region/stack structure the vanilla preview uses -->
    <div class="toast-region" aria-live="polite">
      <div class="toast-stack">
        <MueNotification
          v-for="t in toasts"
          :key="t.id"
          mode="toast"
          :variant="t.variant"
          :title="t.title"
          :msg="t.msg"
          @dismiss="dropToast(t.id)"
        />
      </div>
    </div>
  </div>
</template>
