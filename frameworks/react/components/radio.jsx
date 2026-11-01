/* BEGIN MUE:META
  COMPONENT: Radio
  ID: react-frm-radio
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#choice + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#choice — .radio, its absolutely positioned input, .box (border-radius 50%), the ::after dot, :checked + .box, :focus-visible + .box, .radiogroup
  PORTS: components/forms/radio-buttons/radio-buttons.html
  VARIANTS: default, selected, disabled; MueRadioGroup for the whole answer set
  A11Y: a real <fieldset class="radiogroup"> with a <legend> names the group, exactly as the preview does; exclusivity comes from the shared name attribute, not from JS; each option is a <label> wrapping its own input so the whole 44px row is clickable; the visible circle is an aria-hidden .box whose dot is a pseudo-element
  KEYBOARD: native radio semantics — arrow keys move through the group and the browser keeps one tab stop; this file deliberately binds no key handler, because reimplementing it would break the wrap-around the platform already gives. Disabled options keep their place in the answer set and drop out of the tab order
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — clicking an option updates the controlled group value; native arrow-key grouping is left to Chrome
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueRadio({ name, value, label, disabled = false, className, children, ...rest }) {
  return (
    <label className={cx("radio", className)}>
      <input type="radio" name={name} value={value} disabled={disabled} {...rest} />
      <span className="box" aria-hidden="true" />
      <span>{children ?? label}</span>
    </label>
  );
}

export function MueRadioGroup({
  name,
  legend,
  value,
  defaultValue,
  onChange,
  options = [],
  children,
  className,
  ...rest
}) {
  const controlled = value !== undefined;
  return (
    <fieldset className={cx("radiogroup", className)} {...rest}>
      {legend ? <legend>{legend}</legend> : null}
      {children ??
        options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <MueRadio
              key={item.value}
              name={name}
              value={item.value}
              label={item.label}
              disabled={item.disabled}
              checked={controlled ? value === item.value : undefined}
              defaultChecked={!controlled ? defaultValue === item.value : undefined}
              onChange={() => onChange?.(item.value)}
            />
          );
        })}
    </fieldset>
  );
}

export default MueRadio;
