/* BEGIN MUE:META
  COMPONENT: Badge
  ID: react-ui-badge
  GROUP: Frameworks > React > Components
  CATEGORY: badges
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#badges + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#badges — .badge .badge-primary .badge-success .badge-warning .badge-error .badge-danger .badge-info .badge-solid and the .dot marker
  PORTS: components/cards/cards.html (New / count pills), components/tables/tables.html (status column)
  VARIANTS: variant=neutral|primary|success|warning|error|danger|info|solid, dot
  A11Y: a badge is text, so it carries its own name — colour only reinforces it and never replaces it, which is why the classes are tint/text pairs from the sheet; the optional .dot is aria-hidden decoration; a status badge inside a table cell stays readable because the cell keeps its words
  KEYBOARD: none — a badge is not interactive. For a removable/toggleable pill the sheet has .chip with aria-pressed, which belongs to a filter control, not to this component
  VERIFIED: rendered from preview/preview.js in headless Chrome (puppeteer-core) 2026-11-01 — every variant listed above renders; contrast is inherited from the tokens, not re-tested here
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const VARIANTS = ["primary", "success", "warning", "error", "danger", "info", "solid"];

export function MueBadge({ variant, dot = false, className, children, ...rest }) {
  return (
    <span
      className={cx(
        "badge",
        variant && VARIANTS.includes(variant) && `badge-${variant}`,
        className
      )}
      {...rest}
    >
      {dot ? <span className="dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default MueBadge;
