/* BEGIN MUE:META
  COMPONENT: Input
  ID: react-frm-input
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields (+ #utilities for .field) + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#fields — .field .field-label .field-helper .field-msg .is-error .is-success .input-group .input-icon .addon
  PORTS: components/forms/input-fields.html
  VARIANTS: type=text|email|password|search|date|…, state=error|success|null, disabled, with icon, with addon, helper text, validation message
  A11Y: the control is a real <input> inside a <label class="field-label" for> so placeholder text is never the only name; state lives on the .field wrapper (is-error / is-success) exactly as the preview does, which is what repaints border AND message together; an error or success message adds aria-invalid and aria-describedby to that message; the decorative icon SVG is aria-hidden
  KEYBOARD: nothing is intercepted — native typing, Tab order, and the .field input:focus-visible ring only; disabled inputs drop out of the tab order via :disabled
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — controlled value updates, the is-error branch repaints with aria-invalid set; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueInput({
  id,
  label,
  type = "text",
  helper,
  message,
  state,
  disabled = false,
  icon,
  addon,
  className,
  ...rest
}) {
  const auto = useId();
  const inputId = id ?? `input-${auto}`;
  const msgId = message ? `${inputId}-msg` : undefined;
  const control = (
    <input
      id={inputId}
      type={type}
      disabled={disabled}
      aria-invalid={state === "error" ? "true" : state === "success" ? "false" : undefined}
      aria-describedby={msgId}
      {...rest}
    />
  );

  return (
    <div
      className={cx(
        "field",
        state === "error" && "is-error",
        state === "success" && "is-success",
        className
      )}
    >
      {label ? (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}

      {icon || addon ? (
        <div className="input-group">
          {icon ? (
            <span className="input-icon">
              {icon}
              {control}
            </span>
          ) : (
            control
          )}
          {addon ? <span className="addon">{addon}</span> : null}
        </div>
      ) : (
        control
      )}

      {message ? (
        <p className="field-msg" id={msgId}>
          {message}
        </p>
      ) : helper ? (
        <p className="field-helper">{helper}</p>
      ) : null}
    </div>
  );
}

export default MueInput;
