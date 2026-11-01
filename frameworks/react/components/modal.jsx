/* BEGIN MUE:META
  COMPONENT: Modal
  ID: react-ui-modals
  GROUP: Frameworks > React > Components
  CATEGORY: modals
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#overlays (with #buttons, #fields, #utilities) + design-tokens/engine.css + the html.mue-locked scroll lock in engine.css (all linked by the host page); no other module in this package
  SHEET: styles/components.css#overlays — .overlay + .is-open, .modal (shared panel rules with .dialog), .modal-header, .modal-title, .modal-body, .modal-footer, .modal-close, the --modal-w knob, the <640px bottom-sheet treatment, and .overlay:not(.is-open) which is what takes a closed modal out of the tab order
  PORTS: components/modals/modals.html (Create-item modal: trigger, panel, .stack of .field blocks, pinned footer) and the focus-trap behaviour styles/mue.js runs on [data-dialog]/[data-open]/[data-close] there
  PROPS: open (controlled) / defaultOpen (uncontrolled), onClose and onOpenChange(next), trigger (node — when given, the binding renders the preview's aria-haspopup="dialog" opener for you), triggerVariant (default "primary", mapped to the sheet's btn-* set), triggerClassName, title, labelledBy, id (panel id, defaults to a useId() one; the trigger's aria-controls points at it), width (the documented --modal-w value, e.g. "35rem"; the sheet defaults to 32rem), closeLabel (default "Close dialog"), footer (node rendered in .modal-footer), className, children (.modal-body content), overlayProps spread on the .overlay, plus the remaining rest spread on the panel
  STATES: closed (overlay without .is-open, so the sheet hides it AND this binding marks it inert), open (focus inside, page scroll locked, scrim live), scrim-click and close-button dismiss both call onClose
  VARIANTS: the create-item form modal the preview ships (title + body + Cancel/Create footer) and a slotless body-only panel for anything that does not need a header
  A11Y: role="dialog", aria-modal="true", aria-labelledby on the panel; the title target is an <h2> so the panel is reachable in the heading outline (documented deviation from the preview's <span class="modal-title">); the close glyph is a real button with an aria-label; the scrim never receives focus; a closed overlay is inert plus visibility:hidden so its inputs are unreachable; the body scrolls inside .modal-body instead of growing the page, and the footer stays pinned exactly as the preview describes
  KEYBOARD: Escape closes (document-level, capture phase, while open — the same listener shape styles/mue.js uses); Tab cycles the panel's visible focusables and wraps at both ends; on open focus moves to the first visible control inside the panel on the next frame; on close focus returns to whatever had it before (the trigger, in the uncontrolled case); page scroll is locked with html.mue-locked for as long as the modal is open
  EVENTS: onClose() from Escape, the scrim, the close button and any footer button the host wires; onOpenChange(next) fires for both directions; controlled when open is passed, self-managed when only defaultOpen is
  RESPONSIVE: the panel is width:min(--modal-w, 100%) and the sheet turns it into a bottom sheet under 640px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the modal was driven — trigger click set .is-open and moved focus into the panel, Tab wrapped from the last control to the first, Escape cleared .is-open, removed html.mue-locked and returned focus to the trigger; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useId, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The same focusable set styles/mue.js walks for [data-dialog], so the trap
   cycles the controls a reader can actually reach and nothing else. */
const FOCUSABLE =
  "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])";

/* Only these tones exist in the sheet, so an unknown triggerVariant writes the
   base .btn rather than inventing a class. */
const TRIGGER_VARIANTS = new Set([
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
  "success",
  "link",
]);

export function MueModal({
  open,
  defaultOpen = false,
  onClose,
  onOpenChange,
  trigger,
  triggerVariant = "primary",
  triggerClassName,
  title,
  labelledBy,
  id,
  width,
  closeLabel = "Close dialog",
  footer,
  className,
  children,
  overlayProps,
  ...rest
}) {
  const auto = useId();
  const panelId = id ?? `modal-${auto}`;
  const titleId = `${panelId}-title`;
  const [internal, setInternal] = useState(defaultOpen);
  const shown = open ?? internal;
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocusRef = useRef(null);

  const setShown = (next) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  const close = () => {
    setShown(false);
    onClose?.();
  };

  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!shown) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    lastFocusRef.current = document.activeElement;
    document.documentElement.classList.add("mue-locked");

    const list = () =>
      Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );

    const raf = requestAnimationFrame(() => {
      const first = list()[0];
      (first ?? panel).focus();
    });

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = list();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeydown, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeydown, true);
      document.documentElement.classList.remove("mue-locked");
      const previous = lastFocusRef.current;
      if (previous && typeof previous.focus === "function" && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [shown, open, onOpenChange]);

  const panel = (
    <div
      ref={overlayRef}
      className={cx("overlay", shown && "is-open")}
      inert={shown ? undefined : true}
      onClick={(event) => {
        if (event.target === overlayRef.current) close();
      }}
      {...overlayProps}
    >
      <div
        ref={panelRef}
        className={cx("modal", className)}
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? titleId : undefined)}
        tabIndex={-1}
        style={width ? { "--modal-w": width } : undefined}
        {...rest}
      >
        {title ? (
          <div className="modal-header">
            <h2 className="modal-title" id={titleId}>
              {title}
            </h2>
            <button
              type="button"
              className="modal-close"
              aria-label={closeLabel}
              onClick={close}
            >
              {"×"}
            </button>
          </div>
        ) : null}
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );

  if (!trigger) return panel;

  return (
    <>
      <button
        type="button"
        className={cx(
          "btn",
          TRIGGER_VARIANTS.has(triggerVariant) && `btn-${triggerVariant}`,
          triggerClassName
        )}
        aria-haspopup="dialog"
        aria-controls={panelId}
        onClick={() => setShown(true)}
      >
        {trigger}
      </button>
      {panel}
    </>
  );
}

export default MueModal;
