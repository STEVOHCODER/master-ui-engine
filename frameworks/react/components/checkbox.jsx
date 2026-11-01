/* BEGIN MUE:META
  COMPONENT: Checkbox
  ID: react-frm-checkbox
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#choice — .checkbox, its absolutely positioned input, .box, the tick svg, :checked + .box, :focus-visible + .box, .checkbox-group
  PORTS: components/forms/checkboxes.html
  VARIANTS: default, checked, disabled; grouped via MueCheckboxGroup (.checkbox-group)
  A11Y: a native <input type="checkbox"> wrapped in its own <label>, so the whole 44px row is clickable and the checked state is announced by the platform; the visible .box is aria-hidden decoration containing an aria-hidden tick; controlled (checked+onChange) and uncontrolled (defaultChecked) both work because the input is real
  KEYBOARD: native Space toggles, Tab reaches it, and the ring is drawn on the box by input:focus-visible + .box; nothing is intercepted. NOTE: the preview's "with description" row uses .choice-desc, which has no rule in styles/components.css, so it is deliberately not ported — pass a fragment as label instead
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — click toggles the controlled state; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueCheckbox({ label, disabled = false, className, children, ...rest }) {
  return (
    <label className={cx("checkbox", className)}>
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="box" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {children ?? label}
    </label>
  );
}

export function MueCheckboxGroup({ className, children, ...rest }) {
  /* The preview's group is a plain classed div with no heading of its own, so
     this is the same and nothing is invented. A caller that needs a group name
     can wrap the rows in a <fieldset> with a <legend>, as the radio preview does. */
  return (
    <div className={cx("checkbox-group", className)} {...rest}>
      {children}
    </div>
  );
}

export default MueCheckbox;
