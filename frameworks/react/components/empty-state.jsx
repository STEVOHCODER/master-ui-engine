/* BEGIN MUE:META
  COMPONENT: Empty state
  ID: react-fb-empty
  GROUP: Frameworks > React > Components
  CATEGORY: feedback
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback + #buttons + #utilities + design-tokens/engine.css (all linked by the host page); no other module in this package
  SHEET: styles/components.css#feedback — .empty-state and .empty (one shared rule set: dashed card, centred column, mue-fade-in entrance), .empty-icon, .empty-title, .empty-desc, and the .row the preview puts the actions in
  PORTS: components/feedback/empty-state.html (No results run, First-time use run)
  PROPS: title, desc, icon (node — the preview uses an aria-hidden glyph/emoji here), actions (node or array of nodes, wrapped in .row), variant ("empty" | "empty-state", default "empty" — the class the preview's own copy-paste markup uses; both are the same rule in the sheet), role (default "status", pass null for a purely decorative panel), label (aria-label, default "Empty state"), className, children (appended after the actions, for anything extra the preview's markup allowed), plus any other prop spread on the panel
  STATES: empty only — the host renders it when its data set has nothing to show; the entrance fade is owned by the sheet
  VARIANTS: with/without icon, with/without description, one action or two (the preview demos a "Browse all" primary plus a "Clear filters" outline)
  A11Y: role="status" so a screen reader is told when the list empties, aria-label="Empty state" names the panel exactly as the preview does, the icon is aria-hidden because the meaning is in the title and description, and every action is a real <button> or <a role="button">
  KEYBOARD: none intercepted — the actions keep native Tab order and Enter/Space activation
  EVENTS: none of its own; onClick/onKeyDown belong to whatever nodes are passed as actions
  RESPONSIVE: the panel is a centred flex column and .empty-desc is capped at 42ch, so the text wraps rather than overflowing at 390px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the panel was read back from the DOM (role="status", .empty-title text, the two action buttons) plus its buttons clicked; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Fragment } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const BOXES = new Set(["empty", "empty-state"]);

function actionList(actions) {
  return (Array.isArray(actions) ? actions : [actions]).filter(
    (node) => node !== null && node !== undefined && node !== false
  );
}

export function MueEmptyState({
  title,
  desc,
  icon,
  actions,
  variant = "empty",
  role = "status",
  label = "Empty state",
  className,
  children,
  ...rest
}) {
  const buttons = actionList(actions);

  return (
    <div
      className={cx(BOXES.has(variant) ? variant : "empty-state", className)}
      role={role ?? undefined}
      aria-label={label ?? undefined}
      {...rest}
    >
      {icon ? (
        <div className="empty-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      {title ? <h2 className="empty-title">{title}</h2> : null}
      {desc ? <p className="empty-desc">{desc}</p> : null}
      {buttons.length ? (
        <div className="row">
          {buttons.map((node, i) => (
            <Fragment key={node?.key ?? i}>{node}</Fragment>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export default MueEmptyState;
