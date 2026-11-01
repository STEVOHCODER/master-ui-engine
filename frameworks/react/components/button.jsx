/* BEGIN MUE:META
  COMPONENT: Button
  ID: react-btn-button
  GROUP: Frameworks > React > Components
  CATEGORY: buttons
  FRAMEWORK: react 19 (JSX, automatic runtime; the consumer needs a bundler, not a build step here)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#buttons + design-tokens/engine.css (linked by the host page; this file imports no CSS)
  SHEET: styles/components.css#buttons — .btn .btn-primary .btn-secondary .btn-outline .btn-ghost .btn-danger .btn-success .btn-link .btn-sm .btn-lg .btn-icon .btn-block .loading .bar .spinner
  PORTS: components/buttons/buttons.html
  VARIANTS: variant=primary|secondary|outline|ghost|danger|success|link, size=sm|lg|icon|base, block, loading, spinner, disabled
  A11Y: a real <button> (or <a> when href is set), so :disabled and native activation stay the browser's; type defaults to "button" so a button inside a form never submits by accident; loading sets aria-busy and keeps its width because the sweep is an absolutely positioned .bar; the .spinner glyph is aria-hidden; an icon-only button must be given an aria-label by the caller (the sheet cannot supply a name)
  KEYBOARD: native Tab focus and Space/Enter activation; the ring is .btn:focus-visible in the sheet (2px outline + --ring-focus) and the 1px press is :active, so no focus or motion logic lives in this file
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — click handler fires, disabled blocks the click, loading renders the sweep; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

/** Join only the fragments that exist; every rule behind them lives in components.css. */
function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger", "success", "link"];

export function MueButton({
  variant = "primary",
  size,
  block = false,
  loading = false,
  spinner = false,
  disabled = false,
  type = "button",
  href,
  className,
  children,
  ...rest
}) {
  /* .btn is the base rule; the variant class repeats that group plus its own
     colours, so the DOM matches both the contract example and the preview. */
  const classes = cx(
    "btn",
    VARIANTS.includes(variant) && `btn-${variant}`,
    (size === "sm" || size === "lg") && `btn-${size}`,
    size === "icon" && "btn-icon",
    block && "btn-block",
    loading && "loading",
    className
  );

  const sweep = loading ? <span className="bar" aria-hidden="true" /> : null;
  const dots = spinner && !loading ? <span className="spinner" aria-hidden="true" /> : null;

  if (href && !disabled) {
    return (
      <a className={classes} href={href} {...rest}>
        {sweep}
        {dots}
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      type={type}
      disabled={disabled}
      aria-busy={loading ? "true" : undefined}
      {...rest}
    >
      {sweep}
      {dots}
      {children}
    </button>
  );
}

export default MueButton;
