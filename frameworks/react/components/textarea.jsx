/* BEGIN MUE:META
  COMPONENT: Textarea
  ID: react-frm-textarea
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#fields — .field, .field textarea, .field-label, .field-helper, .field-msg, .is-error, .is-success
  PORTS: components/forms/input-fields.html (the Bio field)
  VARIANTS: rows, state=error|success|null, disabled, helper text, validation message
  A11Y: same .field column as MueInput so label, control and message cannot drift; real <textarea> with a <label for>; error/success sets aria-invalid plus aria-describedby on the message; resize: vertical and min-height come from the sheet, not from an inline style
  KEYBOARD: native typing and Tab; .field textarea:focus-visible paints the ring; Enter inserts a newline (never intercepted)
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — typing updates the controlled value and the error branch sets aria-invalid; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueTextarea({
  id,
  label,
  rows = 3,
  helper,
  message,
  state,
  disabled = false,
  className,
  ...rest
}) {
  const auto = useId();
  const fieldId = id ?? `textarea-${auto}`;
  const msgId = message ? `${fieldId}-msg` : undefined;

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
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={state === "error" ? "true" : state === "success" ? "false" : undefined}
        aria-describedby={msgId}
        {...rest}
      />
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

export default MueTextarea;
