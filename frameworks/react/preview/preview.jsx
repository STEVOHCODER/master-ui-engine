/* BEGIN MUE:META
  COMPONENT: React preview gallery
  ID: react-preview-gallery
  GROUP: Frameworks > React
  CATEGORY: frameworks
  FRAMEWORK: react 19 (JSX, bundled to preview/preview.js by node build.mjs)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: index.js (the sixteen bindings), preview/index.html which links design-tokens/engine.css, styles/components.css and styles/mue.js
  SHEET: none of its own — every class below is taken from styles/components.css, and the page carries no local <style>
  VARIANTS: one .section per component in the shared set, showing the variants that page's preview documents
  A11Y: the page is body.page with the shared .masthead chrome; each section is a labelled <div class="section" id="sec-*"> so the checks can name what rendered; the theme toggle is plain HTML in index.html because styles/mue.js binds it at boot
  KEYBOARD: this gallery is where the ported keyboard behaviour is exercised — dialog (Escape + focus return), dropdown (arrows + Escape), tabs (roving tabindex), table (Enter sorts), switch (Space toggles)
  VERIFIED: mounted in headless Chrome (puppeteer-core) 2026-11-01 with zero console errors and zero network requests beyond the three local files
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  MueAccordion,
  MueAccordionItem,
  MueAlert,
  MueAvatar,
  MueAvatarGroup,
  MueBadge,
  MueButton,
  MueCard,
  MueCardActions,
  MueCardBody,
  MueCardDesc,
  MueCardHeader,
  MueCardMedia,
  MueCardPrice,
  MueCardTag,
  MueCardTitle,
  MueCheckbox,
  MueCheckboxGroup,
  MueDialog,
  MueDropdown,
  MueDropdownDivider,
  MueDropdownItem,
  MueInput,
  MueRadioGroup,
  MueSelect,
  MueSwitch,
  MueTab,
  MueTable,
  MueTabs,
  MueTextarea,
  MueToast,
  MueToastRegion,
  MueToastStack,
} from "../index.js";

/* Inline SVG only, exactly as the previews do it: no icon package, no network. */
const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M21 16l-5-5-9 8" />
  </svg>
);
const Box = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);
const Search = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const Pencil = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const Copy = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const Trash = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
/* A 1x1 data URI keeps the preview free of network requests while still
   exercising the .avatar img rule in the sheet. */
const PIXEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23888'/%3E%3C/svg%3E";

let toastCounter = 0;

function Section({ id, title, note, children }) {
  return (
    <div className="section" id={id}>
      <h2>{title}</h2>
      {note ? <p>{note}</p> : null}
      {children}
    </div>
  );
}

function Preview() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("alex");
  const [bio, setBio] = useState("");
  const [plan, setPlan] = useState("pro");
  const [role, setRole] = useState("developer");
  const [rows, setRows] = useState({ newsletter: false, terms: true });
  const [switches, setSwitches] = useState({ dark: false, push: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (variant, title, msg) => {
    toastCounter += 1;
    const key = `${variant}-${toastCounter}`;
    setToasts((current) => [...current, { key, variant, title, msg }]);
  };
  const dropToast = (key) => setToasts((current) => current.filter((t) => t.key !== key));

  const nameError = username.trim().length < 3;

  return (
    <>
      <h1>React bindings</h1>
      <p className="subtitle">
        The shared set of sixteen, rendered as real React components over the same classes the
        vanilla previews use. No new stylesheet, no CDN: react, react-dom and these components are
        bundled into preview.js, and the page links only the engine and the component sheet.
      </p>

      <div className="meta-card">
        <div className="meta">
          <b>Package:</b> mue-react@0.1.0
          <br />
          <b>Framework:</b> React 19 (JSX, automatic runtime)
          <br />
          <b>Defined in:</b> styles/components.css — this package adds markup and behaviour only
          <br />
          <b>Theme:</b> inherited from html.dark via the toggle in the masthead
          <br />
          <b>License:</b> MIT
        </div>
      </div>

      <Section id="sec-button" title="Button" note="Variants, sizes, block, loading and disabled — all modifier classes from #buttons.">
        <div className="demo-area">
          <MueButton variant="primary">Primary</MueButton>
          <MueButton variant="secondary">Secondary</MueButton>
          <MueButton variant="success">Success</MueButton>
          <MueButton variant="danger">Danger</MueButton>
          <MueButton variant="outline">Outline</MueButton>
          <MueButton variant="ghost">Ghost</MueButton>
          <MueButton variant="link">Link</MueButton>
        </div>
        <div className="demo-area">
          <MueButton size="sm">Small</MueButton>
          <MueButton>Base</MueButton>
          <MueButton size="lg">Large</MueButton>
          <MueButton size="icon" variant="outline" aria-label="Save">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </MueButton>
        </div>
        <div className="btn-stack" style={{ maxWidth: "22rem" }}>
          <MueButton
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
              pushToast("success", "Saved", "The loading state above is the .loading sweep.");
            }}
            loading={loading}
            block
          >
            {loading ? "Saving…" : "Save (toggles loading)"}
          </MueButton>
          <MueButton disabled>Disabled</MueButton>
          <MueButton variant="outline" spinner>
            With spinner
          </MueButton>
        </div>
      </Section>

      <Section id="sec-input" title="Input" note="The state class sits on the .field wrapper, so control and message change colour together.">
        <div className="stack">
          <MueInput
            label="Full name"
            id="full-name"
            defaultValue="Alex Morgan"
            autoComplete="name"
            helper="We'll use this to personalize your dashboard."
          />
          <MueInput
            label="Username"
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            state={nameError ? "error" : "success"}
            message={nameError ? "This username is already taken." : "Username is available."}
          />
          <MueInput label="Search" id="search" placeholder="Search projects" icon={<Search />} addon=".dev" />
          <MueInput label="Disabled input" id="disabled-input" disabled placeholder="Cannot edit" helper="Disabled controls drop out of the tab order." />
        </div>
      </Section>

      <Section id="sec-textarea" title="Textarea" note="Same .field column; resize and min-height come from the sheet.">
        <MueTextarea
          label="Bio"
          id="bio"
          rows={3}
          value={bio}
          placeholder="Tell us about yourself..."
          onChange={(event) => setBio(event.target.value)}
          state={bio.length > 0 && bio.length < 10 ? "error" : bio.length >= 10 ? "success" : undefined}
          message={bio.length ? `${bio.length} characters` : undefined}
          helper="Write at least 10 characters."
        />
      </Section>

      <Section id="sec-select" title="Select" note="A native select in .select-wrap: the browser owns the picker, the sheet draws the chevron.">
        <div className="grid-auto">
          <MueSelect
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            options={[
              { value: "designer", label: "Designer" },
              { value: "developer", label: "Developer" },
              { value: "pm", label: "Product Manager" },
            ]}
            helper={`Selected: ${role}`}
          />
          <MueSelect
            label="Department"
            state="error"
            message="Select a department."
            options={["Choose one", "Engineering", "Design", "Marketing"]}
          />
        </div>
      </Section>

      <Section id="sec-checkbox" title="Checkbox" note="Native inputs wrapped in their own label, so the whole row is the hit target.">
        <MueCheckboxGroup>
          <MueCheckbox
            label="Subscribe to newsletter"
            checked={rows.newsletter}
            onChange={(event) => setRows({ ...rows, newsletter: event.target.checked })}
          />
          <MueCheckbox
            label="I agree to the terms of service"
            checked={rows.terms}
            onChange={(event) => setRows({ ...rows, terms: event.target.checked })}
          />
          <MueCheckbox label="Marketing emails" defaultChecked disabled />
        </MueCheckboxGroup>
      </Section>

      <Section id="sec-radio" title="Radio group" note="A fieldset + legend names the group; arrow keys stay with the browser.">
        <MueRadioGroup
          name="plan"
          legend="Plan"
          value={plan}
          onChange={setPlan}
          options={[
            { value: "starter", label: "Starter — $19/mo" },
            { value: "pro", label: "Professional — $49/mo" },
            { value: "enterprise", label: "Enterprise — $199/mo" },
            { value: "sunset", label: "Legacy — retired", disabled: true },
          ]}
        />
        <p className="field-helper">Chosen: {plan}</p>
      </Section>

      <Section id="sec-switch" title="Switch" note="A stretched transparent checkbox: focus it and press Space.">
        <div className="stack">
          <MueSwitch
            label="Dark mode"
            checked={switches.dark}
            onChange={(event) => setSwitches({ ...switches, dark: event.target.checked })}
          />
          <MueSwitch
            label="Push notifications"
            checked={switches.push}
            onChange={(event) => setSwitches({ ...switches, push: event.target.checked })}
          />
          <MueSwitch label="Auto-save (disabled)" disabled />
        </div>
      </Section>

      <Section id="sec-card" title="Card" note="Base, elevated + featured, and an interactive product card; the slots are the sheet's.">
        <div className="grid-auto">
          <MueCard>
            <MueCardMedia><Tick /></MueCardMedia>
            <MueCardBody>
              <MueCardTag>Design</MueCardTag>
              <MueCardTitle>UI design fundamentals</MueCardTitle>
              <MueCardDesc>Learn spacing, typography, and color principles for interfaces.</MueCardDesc>
            </MueCardBody>
            <MueCardActions spread>
              <MueBadge>12 min read</MueBadge>
              <MueButton variant="link" href="#sec-card">Read →</MueButton>
            </MueCardActions>
          </MueCard>

          <MueCard variant="elevated">
            <MueCardHeader>
              <MueCardTitle>Design system launch</MueCardTitle>
              <MueBadge variant="primary" dot>New</MueBadge>
            </MueCardHeader>
            <MueCardBody>
              <MueCardDesc>MASTER-UI-ENGINE is now available for all AI coding agents.</MueCardDesc>
            </MueCardBody>
            <MueCardActions>
              <MueButton variant="ghost" size="sm">View</MueButton>
            </MueCardActions>
          </MueCard>

          <MueCard
            variant="elevated"
            onSelect={() => pushToast("success", "Added", "The interactive card answered with a toast.")}
          >
            <MueCardMedia><Box /></MueCardMedia>
            <MueCardBody>
              <MueCardTag>Ecommerce</MueCardTag>
              <MueCardTitle>Wireless headphones</MueCardTitle>
              <MueCardDesc>Active noise cancellation, 30-hour battery.</MueCardDesc>
            </MueCardBody>
            <MueCardActions spread>
              <MueCardPrice>$199</MueCardPrice>
              <MueButton size="sm">Add to cart</MueButton>
            </MueCardActions>
          </MueCard>
        </div>
      </Section>

      <Section id="sec-badge" title="Badge" note="Every tint pair in #badges, with and without the .dot marker.">
        <div className="demo-area">
          <MueBadge>Neutral</MueBadge>
          <MueBadge variant="primary">Primary</MueBadge>
          <MueBadge variant="success">Success</MueBadge>
          <MueBadge variant="warning">Warning</MueBadge>
          <MueBadge variant="error">Error</MueBadge>
          <MueBadge variant="danger" dot>Danger</MueBadge>
          <MueBadge variant="info" dot>Info</MueBadge>
          <MueBadge variant="solid">Solid</MueBadge>
        </div>
      </Section>

      <Section id="sec-dialog" title="Dialog" note="Escape closes, Tab wraps inside, focus returns to the trigger, and the page behind is scroll-locked.">
        <div className="demo-area">
          <MueButton onClick={() => setDialogOpen(true)} aria-haspopup="dialog">
            Add new item
          </MueButton>
        </div>
        <MueDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add new item"
          width="35rem"
          footer={
            <>
              <MueButton variant="outline" onClick={() => setDialogOpen(false)}>Cancel</MueButton>
              <MueButton
                onClick={() => {
                  setDialogOpen(false);
                  pushToast("success", "Created", "Focus went back to the trigger on close.");
                }}
              >
                Create item
              </MueButton>
            </>
          }
        >
          <div className="stack">
            <MueInput label="Item name" id="item-name" placeholder="Enter name" />
            <MueTextarea label="Description" id="item-desc" rows={2} placeholder="Optional description" />
            <p className="field-helper">The item will be added to your current list.</p>
          </div>
        </MueDialog>
      </Section>

      <Section id="sec-dropdown" title="Dropdown" note="Arrows walk the rows and wrap, Escape returns focus to the trigger, a click outside closes.">
        <div className="demo-area">
          <MueDropdown label="Actions">
            <MueDropdownItem icon={<Pencil />} onSelect={() => pushToast("info", "Edit", "A row is a real button.")}>
              Edit
            </MueDropdownItem>
            <MueDropdownItem icon={<Copy />} onSelect={() => pushToast("info", "Duplicate", "Rows can carry an icon.")}>
              Duplicate
            </MueDropdownItem>
            <MueDropdownDivider />
            <MueDropdownItem danger icon={<Trash />} onSelect={() => pushToast("error", "Deleted", "The danger row is tinted by .menu-item.danger.")}>
              Delete
            </MueDropdownItem>
          </MueDropdown>
        </div>
      </Section>

      <Section id="sec-tabs" title="Tabs" note="Roving tabindex: only the selected tab is a stop. Arrow keys move, Home/End jump.">
        <MueTabs label="Item views" defaultTab="overview">
          <MueTab id="overview" label="Overview">
            <h3>Overview</h3>
            <p>A high-level summary of the selected item with key metrics and recent activity.</p>
          </MueTab>
          <MueTab id="details" label="Details">
            <h3>Details</h3>
            <p>Detailed specifications, attributes, and configuration options.</p>
          </MueTab>
          <MueTab id="settings" label="Settings">
            <h3>Settings</h3>
            <p>Preferences and controls for customizing behavior.</p>
          </MueTab>
        </MueTabs>
      </Section>

      <Section id="sec-accordion" title="Accordion" note="Exclusive by default, one panel open, the way the FAQ in the preview behaves.">
        <MueAccordion defaultOpen="faq-1">
          <MueAccordionItem id="faq-1" title="Do I need a bundler?">
            <p>No. Link the engine and this sheet, paste a region, and the section renders.</p>
          </MueAccordionItem>
          <MueAccordionItem id="faq-2" title="Does dark mode need extra classes?">
            <p>It needs none. Every rule reads semantics, so html.dark re-themes everything at once.</p>
          </MueAccordionItem>
          <MueAccordionItem id="faq-3" title="Can I change the section spacing?">
            <p>Set --section-pad-y once on a page or per band.</p>
          </MueAccordionItem>
        </MueAccordion>
      </Section>

      <Section id="sec-table" title="Table" note="Sortable headers publish aria-sort; cells carry the sheet's own badges and buttons.">
        <MueTable
          caption="Active projects"
          striped
          columns={[
            { key: "n", header: "#" },
            { key: "project", header: "Project", sortable: true },
            { key: "owner", header: "Owner", sortable: true },
            { key: "status", header: "Status", sortable: true, render: (row) => <MueBadge variant={row.tone}>{row.status}</MueBadge> },
            { key: "updated", header: "Updated", sortable: true },
          ]}
          rows={[
            { n: "01", project: "Dashboard redesign", owner: "Alex Morgan", status: "Active", tone: "success", updated: "2h ago" },
            { n: "02", project: "Mobile app v2", owner: "Sam Rivera", status: "In review", tone: "warning", updated: "1d ago" },
            { n: "03", project: "Marketing site", owner: "Jules Kim", status: "On hold", updated: "3d ago" },
            { n: "04", project: "API migration", owner: "Alex Morgan", status: "Active", tone: "success", updated: "5d ago" },
          ]}
        />
        <div style={{ marginTop: "var(--space-4)" }}>
          <MueTable
            ariaLabel="Shared documents"
            compact
            columns={[
              { key: "document", header: "Document" },
              { key: "type", header: "Type" },
              { key: "actions", header: "Actions", render: () => <MueButton variant="link" size="sm">Edit</MueButton> },
            ]}
            rows={[
              { document: "Q1 report.pdf", type: "Report" },
              { document: "Spec.docx", type: "Document" },
            ]}
          />
        </div>
      </Section>

      <Section id="sec-notification" title="Notification" note="Inline alerts stay in place; toasts stack in the fixed region and auto-dismiss.">
        <div className="stack">
          <MueAlert variant="success" title="Changes saved">Your changes have been saved successfully.</MueAlert>
          <MueAlert variant="error" title="Upload failed">The file was too large for the form.</MueAlert>
        </div>
        <div className="btn-row" style={{ marginTop: "var(--space-4)" }}>
          <MueButton onClick={() => pushToast("success", "Success", "Operation completed successfully.")}>Success</MueButton>
          <MueButton variant="outline" onClick={() => pushToast("error", "Error", "Something went wrong. Please try again.")}>Error</MueButton>
          <MueButton variant="outline" onClick={() => pushToast("warning", "Warning", "Please review the highlighted fields.")}>Warning</MueButton>
          <MueButton variant="outline" onClick={() => pushToast("info", "Info", "New features are available.")}>Info</MueButton>
        </div>
      </Section>

      <Section id="sec-avatar" title="Avatar" note="Initials, an image, and a group — aria-hidden beside a name, labelled when standalone.">
        <div className="demo-area">
          <MueAvatar initials="AM" />
          <MueAvatar src={PIXEL} alt="" />
          <MueAvatar label="Qoder support" initials="QS" />
          <MueAvatarGroup>
            <MueAvatar initials="AM" />
            <MueAvatar initials="SR" />
            <MueAvatar initials="JK" />
          </MueAvatarGroup>
          <span>+3 more</span>
        </div>
      </Section>

      <MueToastRegion>
        <MueToastStack>
          {toasts.map((toast) => (
            <MueToast
              key={toast.key}
              variant={toast.variant}
              title={toast.title}
              onDismiss={() => dropToast(toast.key)}
            >
              {toast.msg}
            </MueToast>
          ))}
        </MueToastStack>
      </MueToastRegion>
    </>
  );
}

/* Mount after styles/mue.js has booted: the shared script binds [role=tablist],
   [data-dropdown] and friends once at DOMContentLoaded, and this gallery owns its
   own behaviour. Waiting one frame after boot keeps the two from double-binding. */
const start = () => {
  const root = document.getElementById("preview-root");
  if (!root) return;
  createRoot(root).render(<Preview />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(start));
} else {
  requestAnimationFrame(start);
}
