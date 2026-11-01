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
