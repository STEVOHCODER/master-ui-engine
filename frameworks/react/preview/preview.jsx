/* BEGIN MUE:META
  COMPONENT: React preview gallery
  ID: react-preview-gallery
  GROUP: Frameworks > React
  CATEGORY: frameworks
  FRAMEWORK: react 19 (JSX, bundled to preview/preview.js by node build.mjs)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: index.js (the thirty-three bindings), preview/gallery.html which links design-tokens/engine.css, styles/components.css and styles/mue.js
  SHEET: none of its own — every class below is taken from styles/components.css, and the page carries no local <style>
  VARIANTS: one .section per component in the shared set (thirty-three sections), showing the variants that page's preview documents
  A11Y: the page is body.page with the shared .masthead chrome; each section is a labelled <div class="section" id="sec-*"> so the checks can name what rendered; the theme toggle is plain HTML in index.html because styles/mue.js binds it at boot
  KEYBOARD: this gallery is where the ported keyboard behaviour is exercised — dialog and modal (Escape + trap + focus return), dropdown and the navbar menu (arrows + Escape), tabs (roving tabindex), table (Enter sorts), pagination (Left/Right + Home/End), stepper (arrows + Home/End), popover (Escape), guidance tour (Next/Back/Skip + Escape to the replay control), switch (Space toggles), rating (native group arrows)
  VERIFIED: mounted in headless Chrome (puppeteer-core) 2026-11-01 at 1280x900, 820x1180 and 390x844 in light and dark with the console and network logged, and the keyboard paths above driven in the DOM
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
  MueBarChart,
  MueBreadcrumbs,
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
  MueDataTable,
  MueDatePicker,
  MueDialog,
  MueDropdown,
  MueDropdownDivider,
  MueDropdownItem,
  MueEmptyState,
  MueErrorState,
  MueFileList,
  MueFooter,
  MueFloatButton,
  MueFloatDock,
  MueGuidance,
  MueGuidanceCard,
  MueGuidanceReplay,
  MueGuidanceStage,
  MueGuidanceStatus,
  MueGuidanceStep,
  MueHeaderNav,
  MueInput,
  MueLineChart,
  MueModal,
  MueNavMenu,
  MuePagination,
  MuePopover,
  MueProgress,
  MueProgressGroup,
  MueRadioGroup,
  MueRating,
  MueRatingInput,
  MueSelect,
  MueSidebar,
  MueSkeleton,
  MueSkeletonCard,
  MueSkeletonRow,
  MueStepper,
  MueSwitch,
  MueTab,
  MueTable,
  MueTabs,
  MueTextarea,
  MueTimeline,
  MueToast,
  MueToastRegion,
  MueToastStack,
  MueTooltip,
  MueDropzone,
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

/* The same eight-order fixture the vanilla preview and the Vue and Web Component
   galleries use, so the three bindings can be compared cell for cell. */
const DT_ROWS = [
  { id: "98214", customer: "Kai Tanaka", order: "ORD-98214", status: "Paid", amount: 11480.0, placed: "28 Oct 2026", search: "kai tanaka ord-98214", detail: [{ label: "Ship to", value: "4-11-7 Akasaka, Tokyo, Japan" }, { label: "Payment", value: "JCB ending 8811" }] },
  { id: "98207", customer: "Amara Okafor", order: "ORD-98207", status: "In transit", amount: 2340.0, placed: "27 Oct 2026", search: "amara okafor ord-98207", detail: [{ label: "Ship to", value: "14 Adeola Odeku St, Lagos, Nigeria" }, { label: "Payment", value: "Bank transfer - settled" }] },
  { id: "98199", customer: "Lucas Meyer", order: "ORD-98199", status: "Disputed", amount: 8910.5, placed: "26 Oct 2026", search: "lucas meyer ord-98199", detail: [{ label: "Ship to", value: "Speyerer Strasse 42, Heidelberg, Germany" }, { label: "Dispute", value: "Goods not received" }] },
  { id: "98186", customer: "Priya Raman", order: "ORD-98186", status: "Paid", amount: 460.0, placed: "24 Oct 2026", search: "priya raman ord-98186", detail: [{ label: "Ship to", value: "Residency Road, Bengaluru, India" }, { label: "Payment", value: "UPI - reference 4471" }] },
  { id: "98175", customer: "Sofia Almeida", order: "ORD-98175", status: "In transit", amount: 14200.0, placed: "23 Oct 2026", search: "sofia almeida ord-98175", detail: [{ label: "Ship to", value: "Rua da Prata 118, Lisboa, Portugal" }, { label: "Payment", value: "Multibanco - paid" }] },
  { id: "98164", customer: "Daniel Whitfield", order: "ORD-98164", status: "Paid", amount: 3725.25, placed: "22 Oct 2026", search: "daniel whitfield ord-98164", detail: [{ label: "Ship to", value: "Ballymount Cross, Dublin, Ireland" }, { label: "Payment", value: "Visa ending 4242" }] },
  { id: "98152", customer: "Yuki Sato", order: "ORD-98152", status: "Disputed", amount: 1180.0, placed: "20 Oct 2026", search: "yuki sato ord-98152", detail: [{ label: "Ship to", value: "Nishishinjuku, Tokyo, Japan" }, { label: "Dispute", value: "Damaged on arrival" }] },
  { id: "98141", customer: "Fatima Al-Hassan", order: "ORD-98141", status: "In transit", amount: 22640.0, placed: "19 Oct 2026", search: "fatima al-hassan ord-98141", detail: [{ label: "Ship to", value: "Al Quoz Industrial 3, Dubai, UAE" }, { label: "Payment", value: "Letter of credit" }] },
];

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
  const [picked, setPicked] = useState("2026-11-12");
  const [uploads, setUploads] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pager, setPager] = useState(3);
  const [percent, setPercent] = useState(45);
  const [stars, setStars] = useState();
  const [checkout, setCheckout] = useState(2);
  const [dtLoading, setDtLoading] = useState(false);

  const refreshTable = () => {
    setDtLoading(true);
    window.setTimeout(() => setDtLoading(false), 1200);
  };

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
        The shared set of thirty-three, rendered as real React components over the same classes the
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

      <Section id="sec-card" title="Card" note="Base, elevated + featured, and an interactive product card; a card that owns role=button carries no nested controls — buttons inside would be nested-interactive, so that pattern keeps its actions in a plain card.">
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
              <span className="field-helper">Enter or Space adds it</span>
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

      <Section id="sec-datatable" title="Data table" note="Live selection, sorting, a status filter, expandable detail rows, search, density, page size and a loading state — all on the shared #datatable classes.">
        <div className="demo-area" style={{ marginBottom: "var(--space-4)" }}>
          <MueButton id="dt-refresh" variant="outline" size="sm" onClick={refreshTable}>
            Refresh (loading)
          </MueButton>
        </div>
        <MueDataTable
          columns={[
            { key: "customer", label: "Customer", sortable: true },
            { key: "order", label: "Order" },
            { key: "status", label: "Status", filterOptions: ["Paid", "In transit", "Disputed"] },
            { key: "amount", label: "Amount", sortable: true, numeric: true, mono: true },
            { key: "placed", label: "Placed", sortable: true, mono: true },
          ]}
          rows={DT_ROWS}
          caption="Open orders, sortable, filterable and selectable"
          selectable
          expandable
          loading={dtLoading}
          pageSizes={[5, 8]}
          emptyTitle="No orders match those filters"
          cells={{
            customer: (row) => (
              <span className="cell-user">
                <span className="avatar" aria-hidden="true">
                  {row.customer.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span>
                  <span className="cell-user-name">{row.customer}</span>
                  <span className="cell-user-sub">{row.order}</span>
                </span>
              </span>
            ),
            status: (row, value) => (
              <MueBadge variant={value === "Paid" ? "success" : value === "In transit" ? "info" : "danger"} dot>
                {value}
              </MueBadge>
            ),
            amount: (row, value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          }}
        />
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

      <Section id="sec-breadcrumbs" title="Breadcrumbs" note="The default rsaquo trail and the compact slash trail from components/navigation/breadcrumbs.html; the last step is a span, not a link.">
        <MueBreadcrumbs
          items={[
            { label: "Home", href: "#sec-breadcrumbs" },
            { label: "Library", href: "#sec-breadcrumbs" },
            { label: "Navigation", href: "#sec-breadcrumbs" },
            { label: "Breadcrumbs" },
          ]}
        />
        <p className="field-helper">Compact, slash separators:</p>
        <MueBreadcrumbs
          compact
          separator="/"
          items={[
            { label: "Components", href: "#sec-breadcrumbs" },
            { label: "Navigation", href: "#sec-breadcrumbs" },
            { label: "Breadcrumbs" },
          ]}
        />
      </Section>

      <Section id="sec-charts" title="Charts" note="Bar and line artwork inside .chart — plain SVG, viewBox-scaled, no chart library and no colour set from script.">
        <div className="grid-auto">
          <MueBarChart
            title="Orders by weekday"
            desc="Monday is the quietest day; Friday carries the week."
            gridLines={3}
            valueFormat={(value) => `${value} orders`}
            data={[
              { label: "Mon", value: 120 },
              { label: "Tue", value: 168 },
              { label: "Wed", value: 142 },
              { label: "Thu", value: 205 },
              { label: "Fri", value: 260, tone: "success" },
              { label: "Sat", value: 96, tone: "warning" },
            ]}
            legend={[
              { label: "Weekday", tone: "primary" },
              { label: "Peak", tone: "success" },
              { label: "Soft", tone: "warning" },
            ]}
          />
          <MueLineChart
            title="Recurring revenue"
            desc="Eleven weeks of net-new revenue against the prior quarter."
            data={[
              { label: "W1", value: 32 },
              { label: "W2", value: 41 },
              { label: "W3", value: 38 },
              { label: "W4", value: 52 },
              { label: "W5", value: 61 },
              { label: "W6", value: 58 },
              { label: "W7", value: 74 },
            ]}
            prior={[30, 34, 36, 40, 44, 47, 50]}
            valueFormat={(value) => `$${value}k`}
          />
        </div>
      </Section>

      <Section id="sec-date-picker" title="Date picker" note="One .field around a native input type=date; the platform owns the calendar, so nothing here re-implements one.">
        <div className="grid-auto">
          <MueDatePicker
            label="Board pack date"
            defaultValue="2026-11-17"
            helper="Arrow keys step the focused segment; Escape closes the platform calendar."
            onChange={(value) => setPicked(value)}
          />
          <MueDatePicker
            label="Locked to the quarter"
            min="2026-10-01"
            max="2026-12-31"
            value={picked}
            state={picked ? "success" : "error"}
            message={picked ? `Chosen: ${picked}` : "Pick a day inside this quarter."}
          />
        </div>
      </Section>

      <Section id="sec-empty-state" title="Empty state" note="role=status panels: the no-results run with two actions and the first-time run with one.">
        <div className="grid-auto">
          <MueEmptyState
            icon={<Search />}
            title="No results"
            desc="Nothing matches the filters on this view. Clear one of them and the rows come back."
            actions={[
              <MueButton key="browse" href="#sec-empty-state" size="sm">
                Browse all
              </MueButton>,
              <MueButton key="clear" variant="outline" size="sm" onClick={() => pushToast("info", "Filters", "Empty states carry the actions the preview puts in .row.")}>
                Clear filters
              </MueButton>,
            ]}
          />
          <MueEmptyState
            variant="empty-state"
            icon={<Box />}
            title="First-time use"
            desc="Create a forecast and its audit trail lands here."
            actions={
              <MueButton variant="ghost" href="#sec-empty-state" size="sm">
                New forecast
              </MueButton>
            }
          />
        </div>
      </Section>

      <Section id="sec-error-state" title="Error state" note="role=alert in both shapes: the inline row (icon beside the copy) and the centred column from the preview's Markup block.">
        <div className="stack">
          <MueErrorState
            title="Upload failed"
            desc="The file was 24 MB and the form caps at 10 MB."
            actions={
              <MueButton size="sm" onClick={() => pushToast("warning", "Retry", "The recovery action is an ordinary button, so Enter reaches it.")}>
                Retry
              </MueButton>
            }
          />
          <MueErrorState
            inline={false}
            title="We could not reach the ledger"
            desc="The forecast on screen is the last good copy from 08:41 GMT."
            actions={
              <>
                <MueButton size="sm">Reload</MueButton>
                <MueButton variant="outline" size="sm" href="#sec-error-state">
                  Status page
                </MueButton>
              </>
            }
          />
        </div>
      </Section>

      <Section id="sec-file-upload" title="File upload" note="A real input type=file stretched over the .dropzone, the drag-over state the sheet cannot reach on its own, and the .file-row list.">
        <div className="grid-auto">
          <MueDropzone
            label="Project exports"
            name="exports"
            multiple
            accept=".csv,.xlsx,.pdf"
            hint="Up to 3 files, 10 MB each."
            max={3}
            files={uploads}
            onFilesChange={(list) => setUploads(Array.from(list))}
            onRemove={(file, index) => setUploads((current) => current.filter((_, n) => n !== index))}
          />
          <MueDropzone
            label="Cover image"
            name="cover"
            accept="image/*"
            hint="One image, 2 MB."
            icon={<Box />}
            title={
              <>
                Drop a cover or <span className="dropzone-link">browse</span>
              </>
            }
          />
          <MueFileList
            label="Attached files"
            files={[
              { name: "november-forecast.xlsx", size: "2.1 MB" },
              { name: "ledger-diff.csv", size: "18 KB" },
              { name: "board-pack.pdf", size: "240 KB" },
            ]}
          />
        </div>
      </Section>

      <Section id="sec-footer" title="Footer" note="The marketing footer from components/footers/footers.html: brand block, three link columns and the bottom bar with social.">
        <MueFooter
          as="div"
          brand="ACME Ledger"
          desc="Forecasting the finance team can defend line by line."
          columns={[
            {
              title: "Product",
              links: [
                { label: "Components", href: "#sec-footer" },
                { label: "Templates", href: "#sec-footer" },
                { label: "Pricing", href: "#sec-footer" },
              ],
            },
            {
              title: "Developers",
              links: [
                { label: "Design tokens", href: "#sec-footer" },
                { label: "Framework parity", href: "#sec-footer" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "#sec-footer" },
                { label: "Security", href: "#sec-footer" },
                { label: "Contact", href: "#sec-footer" },
              ],
            },
          ]}
          bottom="© 2026 MASTER-UI-ENGINE contributors — MIT."
          social={[
            { label: "GitHub", href: "#sec-footer" },
            { label: "LinkedIn", href: "#sec-footer" },
            { label: "RSS", href: "#sec-footer" },
          ]}
        />
      </Section>

      <Section id="sec-guidance" title="Guidance" note="The coachmark tour and the float dock from components/overlays/guidance.html — one state variable moves .is-open between the four steps, and the stage's own shadow paints the scrim.">
        <MueGuidance total={4}>
          <div className="row">
            <MueGuidanceReplay id="tour-replay" />
            <MueGuidanceStatus id="tour-state" />
          </div>

          <MueGuidanceStage id="tour">
            <div className="card-body">
              <div className="spread">
                <div>
                  <p className="card-title">November forecast</p>
                  <p className="card-desc">Draft — recalculated 08:41 GMT</p>
                </div>
                <div className="row">
                  <MueGuidanceStep
                    step={1}
                    placement="end"
                    title="Recalculate reads the live ledger"
                    body="Every forecast is recomputed from the order ledger on click, so a draft can never be exported on stale numbers."
                    target={
                      <MueButton variant="outline" size="sm">
                        Recalculate
                      </MueButton>
                    }
                  />
                  <MueGuidanceStep
                    step={2}
                    placement="end"
                    title="Export carries the stamp"
                    body="CSV, XLSX or a shareable link — each one is stamped with the recalculation time from step 1."
                    target={
                      <MueButton size="sm">
                        Export
                      </MueButton>
                    }
                  />
                </div>
              </div>

              <div className="grid-auto">
                <div className="stat">
                  <span className="stat-label">Committed</span>
                  <span className="stat-value">$418,900</span>
                  <span className="stat-delta is-up">+12.4% vs October</span>
                </div>
                <div className="stat">
                  <span className="stat-label">At risk</span>
                  <span className="stat-value">$62,140</span>
                  <span className="stat-delta is-down">-3.1% vs October</span>
                </div>
              </div>
            </div>

            <div className="card-body">
              <MueGuidanceStep
                as="div"
                step={3}
                placement="top"
                title="Nothing changes silently"
                body="Every edit to a forecast is written here with who made it and when, which is what makes the export in step 2 defensible."
                target={
                  <>
                    <p className="stat-label">Audit trail</p>
                    <MueTimeline
                      items={[
                        { title: "Row-level security applied to finance", meta: "A. Morgan — 08:41 GMT", state: "done" },
                        { title: "Forecast draft reopened after the currency fix", meta: "S. Rivera — 07:55 GMT", state: "current" },
                        { title: "Board pack locks at 17:00", meta: "Scheduled", state: "upcoming" },
                      ]}
                    />
                  </>
                }
              />
            </div>

            <div className="card-actions">
              <MueGuidanceStep
                step={4}
                placement="top-end"
                title="Save the view, not a copy of the data"
                body="A saved view keeps the columns, the grouping and the filters, so finance opens the same picture instead of another spreadsheet."
                target={
                  <MueButton variant="ghost" size="sm">
                    Save view
                  </MueButton>
                }
              />
              <MueBadge variant="success" dot>
                Synced
              </MueBadge>
            </div>
          </MueGuidanceStage>
        </MueGuidance>

        <p className="field-helper">Card anatomy, out of the stage — the counter, title, body and action row are the only parts:</p>
        <div className="grid-auto">
          <MueGuidanceCard
            step={1}
            total={2}
            title="Below the target"
            body="The default placement: the notch points up at whatever is being taught and the card hangs below it."
            nextLabel="Next"
          />
          <MueGuidanceCard
            step={2}
            total={2}
            placement="top"
            skipLabel={null}
            backLabel="Back"
            nextLabel="Finish"
            title="Above the target"
            body="Add .tour-top and the card opens upward, which keeps a step near the bottom of a panel inside the frame."
          />
        </div>

        <p className="field-helper">Float buttons — default, primary, labelled and the anchor form:</p>
        <div className="row">
          <MueFloatButton label="Help">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M9.6 9.2a2.5 2.5 0 114 2.1c-.9.6-1.6 1-1.6 2.1" />
            </svg>
          </MueFloatButton>
          <MueFloatButton label="Back to top" variant="primary" toTop>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
            </svg>
          </MueFloatButton>
          <MueFloatButton variant="label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 01-8 8H8l-5 3 1.4-4.6A8 8 0 1121 12z" />
            </svg>
            Contact support
          </MueFloatButton>
          <MueFloatButton label="Jump to the tour" href="#sec-guidance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 13h16M4 13l4-4M4 13l4 4" />
            </svg>
          </MueFloatButton>
        </div>
      </Section>

      <Section id="sec-modal" title="Modal" note="The overlay/panel pair from components/modals/modals.html: Escape closes, Tab wraps, focus returns to the trigger, and the footer stays pinned.">
        <div className="demo-area">
          <MueModal
            trigger="Open modal"
            open={modalOpen}
            onOpenChange={setModalOpen}
            onClose={() => pushToast("info", "Closed", "Escape, the scrim, the glyph and Cancel all report through onClose.")}
            title="Create a release"
            width="35rem"
            footer={
              <>
                <MueButton variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </MueButton>
                <MueButton
                  onClick={() => {
                    setModalOpen(false);
                    pushToast("success", "Published", "The pinned footer is .modal-footer; focus went back to the trigger.");
                  }}
                >
                  Publish
                </MueButton>
              </>
            }
          >
            <div className="stack">
              <MueInput label="Release name" id="release-name" placeholder="v2.4.0" />
              <MueTextarea label="Release notes" id="release-notes" rows={3} placeholder="What changed?" />
              <p className="field-helper">The body scrolls inside .modal-body instead of growing the page.</p>
            </div>
          </MueModal>
        </div>
      </Section>

      <Section id="sec-navbar" title="Header navigation" note="The sticky site-header with its hamburger drawer, and the navbar variant whose cell opens a menu — both from components/navigation/.">
        <MueHeaderNav
          brand="ACME Ledger"
          brandHref="#sec-navbar"
          links={[
            { label: "Overview", href: "#sec-navbar", current: true },
            { label: "Forecasts", href: "#sec-navbar" },
            { label: "Approvals", href: "#sec-navbar" },
          ]}
          search={{ label: "Search projects", placeholder: "Search projects" }}
          actions={
            <MueButton size="sm" href="#sec-navbar">
              New forecast
            </MueButton>
          }
        />
        <MueNavMenu
          label="Product navigation"
          items={[
            { label: "Workspace", href: "#sec-navbar", current: true },
            {
              label: "Insights",
              menu: [
                { label: "Revenue", href: "#sec-navbar" },
                { label: "Churn", href: "#sec-navbar", divider: false },
                { divider: true, label: "divider" },
                {
                  label: "Scheduled report",
                  href: "#sec-navbar",
                  onSelect: () => pushToast("info", "Insights", "A menu row is an ordinary link, so the router still owns it."),
                },
              ],
            },
            { label: "Settings", href: "#sec-navbar" },
          ]}
        />
      </Section>

      <Section id="sec-pagination" title="Pagination" note="Short run shows every cell; the long run collapses to .ellipsis around the window. Left/Right step and Home/End jump.">
        <MuePagination pages={5} defaultPage={2} />
        <MuePagination pages={24} page={pager} onChange={setPager} />
        <p className="field-helper">Controlled page: {pager} of 24</p>
      </Section>

      <Section id="sec-popover" title="Popover" note="The CSS-only surface from components/dialogs/popover.html. The near-edge samples are anchored .popover-start / .popover-end exactly as that preview argues, and tap-to-pin plus Escape are the app's added path.">
        <div className="demo-area">
          <div className="spread">
            <MuePopover
              trigger="Why this moves"
              labelled="Open the annotation"
              placement="start"
              title="Recalculated on open"
              body="The number is never cached, so a draft cannot be exported on stale figures."
            />
            <MuePopover
              trigger="Checks"
              placement="end"
              title="Three checks before export"
              body="All three run before a file leaves the app."
              list={["Ledger is balanced", "FX rates are current", "Approvals are signed"]}
            />
          </div>
          <div className="spread">
            <MuePopover
              trigger="Pinned"
              placement="start"
              defaultOpen
              title="Pinned for touch"
              body="Hover cannot serve a finger, so a tap keeps .is-open on until Escape or a tap outside clears it."
            />
            <MueTooltip label="Saved 08:41 GMT">
              <MueButton variant="ghost" size="sm">
                Hover or focus me
              </MueButton>
            </MueTooltip>
          </div>
        </div>
      </Section>

      <Section id="sec-progress" title="Progress" note="Determinate, toned, striped, indeterminate and the labelled group; --value is the only knob the sheet reads.">
        <div className="stack">
          <MueProgressGroup label="Upload" value={percent} />
          <MueProgressGroup label="Storage used" value={72} tone="warning" striped />
          <MueProgressGroup label="Sync" value={100} tone="success" />
          <MueProgress indeterminate label="Working" />
        </div>
        <div className="btn-row">
          <MueButton size="sm" onClick={() => setPercent((p) => Math.min(100, p + 10))}>
            +10%
          </MueButton>
          <MueButton size="sm" variant="outline" onClick={() => setPercent((p) => Math.max(0, p - 10))}>
            −10%
          </MueButton>
        </div>
      </Section>

      <Section id="sec-rating" title="Rating" note="A read-only row is role=img with the score in its label; the input is a real radio group, so the arrows stay with the platform.">
        <div className="stack">
          <MueRating value={5} caption={<MueBadge>312 reviews</MueBadge>} />
          <MueRating value={4} caption={<MueBadge variant="info">48 reviews</MueBadge>} />
          <MueRating value={3.5} showValue={false} />
          <MueRatingInput name="kit-rating" defaultValue={4} onChange={setStars} />
          <p className="field-helper">Chosen: {stars ? `${stars} stars` : "nothing yet"}</p>
        </div>
      </Section>

      <Section id="sec-sidebar" title="Sidebar" note="The sectioned rail from components/sidebars/sidebar.html; the active row carries aria-current=page, and a row without an href is a real button.">
        <MueSidebar
          brand="Ledger OS"
          defaultCurrent="overview"
          sections={[
            {
              heading: "Analyse",
              items: [
                { key: "overview", label: "Overview", href: "#sec-sidebar" },
                { key: "forecast", label: "Forecast", href: "#sec-sidebar", icon: "◴" },
                { key: "risk", label: "At risk", href: "#sec-sidebar", icon: "⚑" },
              ],
            },
            {
              heading: "Manage",
              items: [
                { key: "approvals", label: "Approvals", href: "#sec-sidebar" },
                {
                  key: "sign-out",
                  label: "Sign out",
                  onSelect: () => pushToast("info", "Sign out", "A row with no href renders button.sidebar-item, so it stays operable."),
                },
              ],
            },
          ]}
        />
      </Section>

      <Section id="sec-skeleton" title="Skeleton" note="Card, list-row and button placeholders; every shape is aria-hidden because it carries no meaning yet.">
        <div className="grid-auto">
          <MueSkeletonCard />
          <MueSkeletonCard lines={3} />
          <div className="stack">
            <MueSkeletonRow lines={2} />
            <MueSkeletonRow lines={3} />
          </div>
        </div>
        <div className="row">
          <MueSkeleton shape="btn" width="9rem" />
        </div>
      </Section>

      <Section id="sec-stepper" title="Stepper" note="The rail is an <ol>; with onChange it becomes one tab stop that answers arrows, Home and End. The changelog .timeline reads the same three states backwards.">
        <MueStepper
          label="Checkout"
          current={checkout}
          onChange={setCheckout}
          steps={[
            { name: "Cart", text: "3 items" },
            { name: "Address", text: "Delivered to Rotterdam" },
            { name: "Payment" },
            { name: "Review" },
          ]}
        />
        <p className="field-helper">Static rail (step 3 of 4, no key handler because it has no onChange):</p>
        <MueStepper
          label="Migration"
          defaultCurrent={3}
          steps={[{ name: "Export" }, { name: "Transform" }, { name: "Load" }, { name: "Verify" }]}
        />
        <MueTimeline
          items={[
            { title: "Row-level security applied to finance", meta: "A. Morgan — 08:41 GMT", state: "done" },
            { title: "Forecast draft reopened after the currency fix", meta: "S. Rivera — 07:55 GMT", state: "current" },
            { title: "Board pack locks at 17:00", meta: "Scheduled", state: "upcoming" },
          ]}
        />
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
