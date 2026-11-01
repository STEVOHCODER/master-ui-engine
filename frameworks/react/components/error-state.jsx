/* BEGIN MUE:META
  COMPONENT: Error state
  ID: react-fb-error
  GROUP: Frameworks > React > Components
  CATEGORY: feedback
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#feedback — .error-state, .error-inline, .error-icon, .error-body, .empty-title, .empty-desc, .empty-icon, and the .row the preview puts the recovery actions in
  PORTS: components/feedback/error-state.html (Page error run, and the centred panel from its Markup block). The preview's "Form error (inline)" run is a .field.is-error + .field-msg, which this package already ships as <MueInput state="error" message="…">, so nothing is duplicated here
  PROPS: title, desc, icon (node, defaults to the preview's error glyph SVG), actions (node or array, wrapped in .row), inline (default true — false gives the centred column variant from the preview's Markup block, where the icon slot is .empty-icon as it is there), role (default "alert", pass null to drop it), heading (tag for the title, default "h2"), className, children, plus any other prop spread on the panel
  STATES: error (present) only — the host renders it after a failed request and removes it when the retry succeeds
  VARIANTS: inline row (icon beside .error-body) and centred column; either may carry one or two recovery actions
  A11Y: role="alert" so the message is announced without moving focus, the decorative icon is aria-hidden because the wording carries the meaning, the title is a real heading so the panel is findable in the outline, and recovery is a native <button> / <a role="button">
  KEYBOARD: none intercepted — the action buttons keep native Tab order and Enter/Space activation. The preview notes that focus should land near the error when it appears; that is the host's call, and it is reachable because the buttons are ordinary focusable elements
  EVENTS: none of its own; onClick belongs to whatever nodes are passed as actions
  RESPONSIVE: the inline branch is a flex row, so the copy wraps beside the icon; the sheet's own media query stacks .error-inline into a column on narrow screens; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, both branches were read back from the DOM (role="alert", .error-body headings, .error-icon present in the inline branch only) and the Retry button was clicked; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Fragment } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The glyph the preview draws: a stroked circle with an exclamation, coloured
   by .error-icon / .empty-icon in the sheet, never here. */
function ErrorGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.6h.01" />
    </svg>
  );
}

function actionList(actions) {
  return (Array.isArray(actions) ? actions : [actions]).filter(
    (node) => node !== null && node !== undefined && node !== false
  );
}

export function MueErrorState({
  title,
  desc,
  icon,
  actions,
  inline = true,
  role = "alert",
  heading = "h2",
  className,
  children,
  ...rest
}) {
  const Heading = heading;
  const buttons = actionList(actions);
  const body = (
    <>
      {title ? <Heading className="empty-title">{title}</Heading> : null}
      {desc ? <p className="empty-desc">{desc}</p> : null}
      {buttons.length ? (
        <div className="row">
          {buttons.map((node, i) => (
            <Fragment key={node?.key ?? i}>{node}</Fragment>
          ))}
        </div>
      ) : null}
      {children}
    </>
  );

  return (
    <div
      className={cx("error-state", inline && "error-inline", className)}
      role={role ?? undefined}
      {...rest}
    >
      {inline ? (
        <>
          <div className="error-icon" aria-hidden="true">
            {icon ?? <ErrorGlyph />}
          </div>
          <div className="error-body">{body}</div>
        </>
      ) : (
        <>
          <div className="empty-icon" aria-hidden="true">
            {icon ?? <ErrorGlyph />}
          </div>
          {body}
        </>
      )}
    </div>
  );
}

export default MueErrorState;
