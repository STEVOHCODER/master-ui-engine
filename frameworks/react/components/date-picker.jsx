/* BEGIN MUE:META
  COMPONENT: Date picker
  ID: react-frm-date-picker
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#fields — the whole component is one .field holding a native <input type="date">; the sheet owns .field, .field-label, .field-helper, .field-msg, .is-error, .is-success, the control, its focus ring and the state colours
  PORTS: components/forms/date-picker/date-picker.html (Default run, With-constraints run — the constrained pair is stacked in .stack as the preview stacks it)
  PROPS: id, label (required-looking text for .field-label), value (controlled, ISO yyyy-mm-dd) / defaultValue (uncontrolled), min, max, required (sets the native attribute plus aria-required), state ("error" | "success" | undefined, drives .is-error/.is-success on the wrapper), message (.field-msg, wired with aria-describedby and aria-invalid), helper (.field-helper), disabled, name, className, onChange(value, date) where date is a Date or null, plus any other prop spread on the <input>
  STATES: empty, filled, error (.is-error + aria-invalid="true"), success (.is-success), disabled; out-of-range days are not markup — min/max are enforced by the platform picker exactly as the preview documents
  VARIANTS: default, constrained (min and/or max), required with a validation message
  A11Y: a real <label class="field-label" for> so the control is never named by a placeholder, aria-describedby only when a message exists, aria-required with the native required attribute, and the visible state colour is duplicated by the message text so error is never colour-only
  KEYBOARD: nothing is intercepted — Arrow keys step the focused day/month/year segment, Up/Down change it, PageUp/PageDown jump a year, typing digits fills a segment and Escape closes the platform calendar. The preview ships no script of its own (its only local CSS tints the picker glyph), so this binding deliberately does not re-implement that calendar in the DOM; the documented deviation is recorded in frameworks/react/README.md
  EVENTS: onChange(value, date) fires with the raw yyyy-mm-dd string and a parsed Date (null when the field is incomplete or invalid); native input/invalid events pass through via rest
  RESPONSIVE: .field input is width:100% with min-width:0 from the sheet, so it shrinks inside a narrow form; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the control was driven from the keyboard (focus, then arrow/segment edits) while reading input.value back from the DOM and confirming the .is-error branch sets aria-invalid="true"; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* yyyy-mm-dd -> Date, or null when the segment is still empty or out of range
   for the engine (e.g. 2026-02-31 rolls over, so it is rejected instead). */
function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const roundTrip = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
  return roundTrip === value ? date : null;
}

export function MueDatePicker({
  id,
  label,
  value,
  defaultValue,
  min,
  max,
  required = false,
  state,
  message,
  helper,
  disabled = false,
  name,
  className,
  onChange,
  ...rest
}) {
  const auto = useId();
  const inputId = id ?? `date-${auto}`;
  const msgId = message ? `${inputId}-msg` : undefined;
  /* Uncontrolled by default: pass value to own it from the host. */
  const [internal, setInternal] = useState(defaultValue ?? "");
  const shown = value ?? internal;

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

      <input
        id={inputId}
        name={name}
        type="date"
        value={shown}
        min={min}
        max={max}
        disabled={disabled}
        required={required || undefined}
        aria-required={required ? "true" : undefined}
        aria-invalid={state === "error" ? "true" : undefined}
        aria-describedby={msgId}
        onChange={(event) => {
          const next = event.target.value;
          if (value === undefined) setInternal(next);
          onChange?.(next, parseDate(next));
        }}
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

export default MueDatePicker;
