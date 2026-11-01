/* BEGIN MUE:META
  COMPONENT: Select
  ID: react-frm-select
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#fields + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#fields — .field, .field select, .select-wrap and the .select-wrap svg chevron, .is-error, .is-success
  PORTS: components/forms/select-menus.html, components/forms/input-fields.html (Role field)
  VARIANTS: default, is-error, disabled, options-as-array or <option> children
  A11Y: a real native <select>, so the browser owns the option list, the closed box is the only thing styled, and screen readers get the platform picker for free; <label class="field-label" for> names it; error state sets aria-invalid + aria-describedby; the chevron SVG is aria-hidden and pointer-events:none in the sheet
  KEYBOARD: native — the picker opens with Enter/Space/arrows and types ahead, none of which is reimplemented here; .field select:focus-visible paints the ring and .select-wrap:focus-within repaints the chevron
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — onChange receives the chosen value and the error branch sets aria-invalid; the native popup itself is not automated
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* Same path data as the preview markup; the sheet sizes and tints it. */
const Chevron = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

export function MueSelect({
  id,
  label,
  helper,
  message,
  state,
  disabled = false,
  options,
  className,
  children,
  ...rest
}) {
  const auto = useId();
  const selectId = id ?? `select-${auto}`;
  const msgId = message ? `${selectId}-msg` : undefined;

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
        <label className="field-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className="select-wrap">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={state === "error" ? "true" : state === "success" ? "false" : undefined}
          aria-describedby={msgId}
          {...rest}
        >
          {options
            ? options.map((option) =>
                typeof option === "string" ? (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ) : (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )
            : children}
        </select>
        <Chevron />
      </div>
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

export default MueSelect;
