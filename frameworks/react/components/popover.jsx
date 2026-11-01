/* BEGIN MUE:META
  COMPONENT: Popover
  ID: react-ui-popover
  GROUP: Frameworks > React > Components
  CATEGORY: dialogs
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#popover + #feedback (the tooltip half) + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#popover — .popover-wrap (+ .is-open), .popover-trigger, .popover, .popover-title, .popover-body, .popover-list, .popover-below, .popover-start, .popover-end; and #feedback — .tooltip-wrap, .tooltip, .tooltip.is-visible, .tooltip-below
  PORTS: components/dialogs/popover.html (Annotation-on-a-term run, Content-not-just-a-sentence run incl. .popover-list, Placements-and-pinned run, Tooltip run)
  PROPS: MuePopover — title (.popover-title), body (.popover-body), list (array of nodes, each an <li> with the preview's tick glyph), placement ("above" | "below" | "start" | "end", mapped to .popover-below/.popover-start/.popover-end; "above" writes no class), open (controlled) / defaultOpen (uncontrolled, the preview's pinned sample), onOpenChange, trigger (button content), icon (node appended inside the button), labelled (aria-label for the trigger when its text is not enough), children (appended inside the surface), surfaceId, className, wrapClassName, triggerClassName, rest spread on the surface. MueTooltip — label, below (default false), open (pins .is-visible for a screenshot or a scripted state), children (the focusable trigger), className. MuePopoverTitle / MuePopoverBody / MuePopoverList are the raw slots for hand-composed surfaces
  STATES: closed (the sheet keeps the surface visibility:hidden so its links leave the tab order), hover/focus-within open (pure CSS, no JS), and .is-open pinned (this binding toggles it on tap so touch users get a path the preview says the app must supply)
  VARIANTS: title+body, title+body+list, anchored start/end for a near-edge trigger, flipped below, plus the one-line tooltip
  A11Y: the trigger is a real <button> carrying aria-describedby pointing at the surface id and aria-expanded mirroring the pinned state, the surface is role="note" exactly as the preview marks it, decorative glyphs are aria-hidden, and Escape returns focus to the trigger so the keyboard user is never left on a hidden node
  KEYBOARD: Tab reaches the trigger and the sheet's :focus-within opens the surface; while pinned open, Escape closes it and refocuses the trigger (the preview names this as the application's job). A pointer tap toggles the pinned state, which is the touch path the preview says hover cannot provide
  EVENTS: onOpenChange(open) from a tap, an outside pointerdown while pinned, or Escape; controlled when open is passed, self-managed when only defaultOpen is
  RESPONSIVE: .popover is max-width min(20rem, 80vw) and .tooltip min(18rem, 80vw); anchored placements keep a near-edge trigger inside the container, which is why the preview prefers them; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the pinned surface was driven — clicking the trigger toggled .is-open + aria-expanded on the wrap/surface, Escape cleared them and focus came back to the trigger; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useId, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The three offset classes the sheet defines; "above" is the default position
   and needs no class, so an unknown placement writes none rather than a class
   the stylesheet does not own. */
const PLACEMENTS = new Set(["below", "start", "end"]);

function Tick() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

export function MuePopoverTitle({ className, children, ...rest }) {
  return (
    <span className={cx("popover-title", className)} {...rest}>
      {children}
    </span>
  );
}

export function MuePopoverBody({ className, children, ...rest }) {
  return (
    <span className={cx("popover-body", className)} {...rest}>
      {children}
    </span>
  );
}

export function MuePopoverList({ items = [], className, ...rest }) {
  return (
    <ul className={cx("popover-list", className)} {...rest}>
      {items.map((item, i) => (
        <li key={item?.key ?? i}>
          <Tick />
          <span>{item?.label ?? item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MuePopover({
  title,
  body,
  list,
  placement,
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  icon,
  labelled,
  children,
  surfaceId,
  className,
  wrapClassName,
  triggerClassName,
  ...rest
}) {
  const auto = useId();
  const id = surfaceId ?? `popover-${auto}`;
  const [internal, setInternal] = useState(defaultOpen);
  const pinned = open ?? internal;
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  const setPinned = (next) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  /* Tap-out and Escape-out are the two things the preview says the application
     must add on top of the CSS-only surface. Escape also restores focus to the
     trigger, because the reader was on it when the surface closed. */
  useEffect(() => {
    if (!pinned) return undefined;

    const onKeydown = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setPinned(false);
      triggerRef.current?.focus();
    };
    const onPointerdown = (event) => {
      if (wrapRef.current?.contains(event.target)) return;
      setPinned(false);
    };

    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onPointerdown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("pointerdown", onPointerdown);
    };
  }, [pinned, open, onOpenChange]);

  /* An aria-label that omits the button's own words breaks
     WCAG 2.5.3 (label in name), so a supplied label is extended with the
     visible trigger text whenever it does not already contain it. */
  const triggerText = typeof trigger === "string" ? trigger.trim() : "";
  const accessibleName =
    labelled && triggerText && !labelled.toLowerCase().includes(triggerText.toLowerCase())
      ? `${labelled}: ${triggerText}`
      : labelled;

  return (
    <span
      ref={wrapRef}
      className={cx("popover-wrap", pinned && "is-open", wrapClassName)}
    >
      <button
        ref={triggerRef}
        className={cx("popover-trigger", triggerClassName)}
        type="button"
        aria-label={accessibleName}
        aria-describedby={id}
        aria-expanded={String(pinned)}
        onClick={() => setPinned(!pinned)}
      >
        {trigger}
        {icon}
      </button>
      <span
        className={cx(
          "popover",
          placement && PLACEMENTS.has(placement) ? `popover-${placement}` : null,
          className
        )}
        id={id}
        role="note"
        {...rest}
      >
        {title ? <MuePopoverTitle>{title}</MuePopoverTitle> : null}
        {body ? <MuePopoverBody>{body}</MuePopoverBody> : null}
        {list?.length ? <MuePopoverList items={list} /> : null}
        {children}
      </span>
    </span>
  );
}

export function MueTooltip({
  label,
  below = false,
  open = false,
  className,
  children,
  ...rest
}) {
  return (
    <span
      className={cx("tooltip-wrap", below && "tooltip-below", className)}
      {...rest}
    >
      {children}
      <span className={cx("tooltip", open && "is-visible")} role="tooltip">
        {label}
      </span>
    </span>
  );
}

export default MuePopover;
