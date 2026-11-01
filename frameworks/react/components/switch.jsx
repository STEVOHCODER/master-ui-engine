/* BEGIN MUE:META
  COMPONENT: Switch
  ID: react-frm-switch
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#choice — .switch, its transparent stretched input, .track, the ::after knob, :checked + .track, :focus-visible + .track, .switch-label
  PORTS: components/forms/switches.html
  VARIANTS: default, on, off, disabled
  A11Y: a real <input type="checkbox"> stretched over the whole row and made transparent, so the row is one big hit target, the state is announced by the platform and .switch-label carries the visible name through the wrapping <label>; the .track is aria-hidden decoration. NOTE: the preview keeps checkbox semantics and adds no role="switch", so neither does this binding — that is a deliberate port decision, not an oversight
  KEYBOARD: native — Tab reaches the input and Space toggles it, which is also what .switch input:focus-visible + .track is drawn for; the knob travel is --duration-base/--ease-spring in the sheet, so no timing is written here
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — focus + Space flips the controlled state; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueSwitch({ label, id, disabled = false, className, children, ...rest }) {
  const auto = useId();
  const inputId = id ?? `switch-${auto}`;
  return (
    <label className={cx("switch", className)} htmlFor={inputId}>
      <input id={inputId} type="checkbox" disabled={disabled} {...rest} />
      <span className="track" aria-hidden="true" />
      <span className="switch-label">{children ?? label}</span>
    </label>
  );
}

export default MueSwitch;
