/* BEGIN MUE:META
  COMPONENT: Dialog
  ID: react-ui-dialog
  GROUP: Frameworks > React > Components
  CATEGORY: modals
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#overlays (with #buttons, #fields) + design-tokens/engine.css + the html.mue-locked scroll lock in engine.css (linked by the host page)
  SHEET: styles/components.css#overlays — .overlay .is-open .dialog .dialog-header .dialog-title .dialog-body .dialog-footer .dialog-close; .overlay:not(.is-open) is what takes a closed dialog out of the tab order
  PORTS: components/modals/modals.html (form modal, focus trap, scrim dismiss)
  VARIANTS: controlled only (open + onClose); width maps to the documented --modal-w override on the panel; slots: title / children / footer
  A11Y: role="dialog", aria-modal="true" and aria-labelledby on the panel; every input inside keeps its own .field-label because placeholder text is not a label; the close glyph is a real button with an aria-label; the scrim itself never receives focus; a closed overlay is inert plus visibility:hidden, so its inputs are unreachable by keyboard or screen reader; the body scrolls inside .dialog-body instead of growing the page
  KEYBOARD: Escape closes (document-level while open, like the shared script); Tab cycles the panel and wraps at both ends; focus moves to the first visible control on open and returns to the trigger on close; page scroll is locked with html.mue-locked for as long as the dialog is open
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — trigger click opens, Escape closes and focus returns to the trigger; a documented deviation from the preview is that the panel carries tabindex="-1" and the aria-labelledby target is an <h2> so both are programmatically reachable
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useId, useRef } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The same focusable set styles/mue.js walks, so the trap cycles the controls a
   reader can actually reach and nothing else. */
const FOCUSABLE =
  "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])";

export function MueDialog({
  open,
  onClose,
  title,
  labelledBy,
  width,
  closeLabel = "Close dialog",
  footer,
  className,
  children,
  ...rest
}) {
  const autoId = useId();
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const lastFocusRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    lastFocusRef.current = document.activeElement;
    document.documentElement.classList.add("mue-locked");

    const list = () =>
      Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);

    const raf = requestAnimationFrame(() => {
      const first = list()[0];
      (first ?? panel).focus();
    });

    const onKeydown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current?.();
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
  }, [open]);

  return (
    <div
      ref={overlayRef}
      className={cx("overlay", open && "is-open")}
      inert={open ? undefined : true}
      onClick={(event) => {
        if (event.target === overlayRef.current) closeRef.current?.();
      }}
      {...rest}
    >
      <div
        ref={panelRef}
        className={cx("dialog", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? (title ? autoId : undefined)}
        tabIndex={-1}
        style={width ? { "--modal-w": width } : undefined}
      >
        {title ? (
          <div className="dialog-header">
            <h2 className="dialog-title" id={autoId}>
              {title}
            </h2>
            <button type="button" className="dialog-close" aria-label={closeLabel} onClick={onClose}>
              {"×"}
            </button>
          </div>
        ) : null}
        <div className="dialog-body">{children}</div>
        {footer ? <div className="dialog-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export default MueDialog;
