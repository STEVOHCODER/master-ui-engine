/* BEGIN MUE:META
  COMPONENT: Card
  ID: react-ui-card
  GROUP: Frameworks > React > Components
  CATEGORY: cards
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#cards (with #badges, #buttons, #utilities for .spread) + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#cards — .card .card-elevated .card-outlined .card-featured .card-interactive .card[role=button] .card[aria-pressed=true] .card-media .card-body .card-head/.card-header .card-title .card-desc/.card-text .card-tag .card-actions .price
  PORTS: components/cards/cards.html (default / elevated / featured / interactive product card)
  VARIANTS: variant=elevated|outlined|featured|base, interactive, selected, asLink (href), slots: MueCardMedia / MueCardHeader / MueCardBody / MueCardTitle / MueCardDesc / MueCardTag / MueCardActions
  A11Y: <article class="card"> by default, <a class="card"> when href is set (a.card is styled in the sheet, so a link card needs no extra class); a card with onSelect becomes role="button" + tabindex="0" + aria-pressed, which are exactly the selectors .card[role="button"] and .card-interactive.is-selected already target; media SVG placeholders keep aria-hidden + focusable="false" from the preview; text slots are min-width:0 in the sheet so a long title wraps instead of widening the card
  KEYBOARD: a link card is focusable by being a link; an onSelect card answers Enter and Space and shows .card-interactive:focus-visible; hover lift and media pop are :hover rules in the sheet
  VERIFIED: rendered from preview/preview.js in headless Chrome (puppeteer-core) 2026-11-01 — all four variants and both slot layouts render; the interactive card's Enter activation is exercised through the dialog trigger section, not re-tested per card
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueCard({
  variant,
  interactive = false,
  selected = false,
  href,
  onSelect,
  className,
  children,
  ...rest
}) {
  const classes = cx(
    "card",
    variant === "elevated" && "card-elevated",
    variant === "outlined" && "card-outlined",
    variant === "featured" && "card-featured",
    (interactive || onSelect || href) && "card-interactive",
    selected && "is-selected",
    className
  );

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {children}
      </a>
    );
  }

  const clickable = typeof onSelect === "function";
  return (
    <article
      className={classes}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? String(selected) : undefined}
      onClick={clickable ? onSelect : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(event);
              }
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </article>
  );
}

export function MueCardMedia({ children, className, ...rest }) {
  return (
    <div className={cx("card-media", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueCardHeader({ className, children, ...rest }) {
  return (
    <div className={cx("card-header", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueCardBody({ className, children, ...rest }) {
  return (
    <div className={cx("card-body", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueCardTitle({ className, children, ...rest }) {
  return (
    <h3 className={cx("card-title", className)} {...rest}>
      {children}
    </h3>
  );
}

export function MueCardDesc({ as = "p", className, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={cx("card-desc", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function MueCardTag({ className, children, ...rest }) {
  return (
    <span className={cx("card-tag", className)} {...rest}>
      {children}
    </span>
  );
}

export function MueCardActions({ spread = false, className, children, ...rest }) {
  return (
    <div className={cx("card-actions", spread && "spread", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueCardPrice({ className, children, ...rest }) {
  return (
    <span className={cx("price", className)} {...rest}>
      {children}
    </span>
  );
}

export default MueCard;
