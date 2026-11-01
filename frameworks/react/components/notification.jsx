/* BEGIN MUE:META
  COMPONENT: Notification
  ID: react-ui-notification
  GROUP: Frameworks > React > Components
  CATEGORY: notifications
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#notifications (with #buttons) + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#notifications — .toast .toast-success .toast-error .toast-danger .toast-warning .toast-info .is-open .is-leaving .toast-icon .toast-body .toast-title .toast-msg/.toast-desc .toast-close .toast-stack .toast-region, and .alert .alert-success .alert-error .alert-warning .alert-info .alert-icon
  PORTS: components/notifications/notifications.html (four toasts behind buttons, one inline alert)
  VARIANTS: MueAlert (success|error|warning|info, static in place) and MueToast (success|error|warning|info|danger, dismissible, auto-dismiss), composed with MueToastStack / MueToastRegion
  A11Y: both carry role="alert" so the text is announced, exactly like the preview; the icon glyph is decorative and aria-hidden with a text title beside it, so meaning is icon + words and never colour alone; the dismiss control is a real button with aria-label="Dismiss" and the sheet's focus ring; nothing here steals focus, so a toast never traps the keyboard; MueToastRegion is position:fixed in the sheet and stays pointer-events:none except on the toasts themselves
  KEYBOARD: Tab reaches the dismiss button and Enter/Space activates it; there is deliberately no focus management, matching the preview's "a toast never traps the keyboard"
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — a trigger button appends a toast, its dismiss button removes it after the slide-out, and the auto-dismiss timer fires; DEVIATION: the inline alert uses the sheet's own .alert-icon slot instead of the .toast-icon the demo page borrows (both are defined in styles/components.css; #notifications styles .alert-icon per variant specifically)
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const GLYPHS = { success: "✓", error: "✕", danger: "✕", warning: "⚠", info: "i" };
const VARIANTS = ["success", "error", "danger", "warning", "info"];

export function MueAlert({ variant = "info", icon, title, children, className, ...rest }) {
  return (
    <div
      className={cx("alert", VARIANTS.includes(variant) && `alert-${variant}`, className)}
      role="alert"
      {...rest}
    >
      <span className="alert-icon" aria-hidden="true">
        {icon ?? GLYPHS[variant] ?? GLYPHS.info}
      </span>
      <div className="toast-body">
        {title ? <span className="toast-title">{title}</span> : null}
        {children ? <span className="toast-msg">{children}</span> : null}
      </div>
    </div>
  );
}

export function MueToast({
  variant = "info",
  icon,
  title,
  dismissAfter = 4000,
  dismissible = true,
  onDismiss,
  className,
  children,
  ...rest
}) {
  const toastRef = useRef(null);
  const [leaving, setLeaving] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  /* Auto-dismiss is the preview's data-dismiss="4000"; the slide-out is CSS, so
     the toast is dropped when its own transition ends rather than after a
     timeout this file would have to guess at. */
  useEffect(() => {
    if (!dismissAfter) return undefined;
    const timer = setTimeout(() => setLeaving(true), dismissAfter);
    return () => clearTimeout(timer);
  }, [dismissAfter]);

  useEffect(() => {
    if (!leaving) return undefined;
    const node = toastRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dismissRef.current?.();
      return undefined;
    }
    const finish = () => dismissRef.current?.();
    node.addEventListener("transitionend", finish, { once: true });
    return () => node.removeEventListener("transitionend", finish);
  }, [leaving]);

  return (
    <div
      ref={toastRef}
      className={cx(
        "toast",
        "is-open",
        VARIANTS.includes(variant) && `toast-${variant}`,
        leaving && "is-leaving",
        className
      )}
      role="alert"
      {...rest}
    >
      <span className="toast-icon" aria-hidden="true">
        {icon ?? GLYPHS[variant] ?? GLYPHS.info}
      </span>
      <div className="toast-body">
        {title ? <span className="toast-title">{title}</span> : null}
        {children ? <span className="toast-msg">{children}</span> : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          className="toast-close"
          aria-label="Dismiss"
          onClick={() => setLeaving(true)}
        >
          {"×"}
        </button>
      ) : null}
    </div>
  );
}

export function MueToastStack({ className, children, ...rest }) {
  return (
    <div className={cx("toast-stack", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueToastRegion({ className, children, ...rest }) {
  /* No aria-live here: the preview lets each toast's own role="alert" carry the
     announcement, and a second live region on the container would double-speak. */
  return (
    <div className={cx("toast-region", className)} {...rest}>
      {children}
    </div>
  );
}

export default MueAlert;
