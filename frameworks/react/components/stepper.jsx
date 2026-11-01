/* BEGIN MUE:META
  COMPONENT: Stepper
  ID: react-fb-stepper
  GROUP: Frameworks > React > Components
  CATEGORY: feedback
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#stepper + #display (.timeline) + design-tokens/engine.css (global :focus-visible ring and .sr-only), all linked by the host page; no other module in this package
  SHEET: styles/components.css#stepper — .stepper (the rail), .stepper-item + .is-done/.is-current/.is-upcoming, .stepper-dot (the current one is ringed, the upcoming dashed), .stepper-label, .stepper-name, .stepper-text; #display — .timeline, .timeline-item + the same three state classes, .timeline-title, .timeline-meta
  PORTS: components/feedback/stepper.html (Four-steps-mid-flow run, Short-flow-all-the-way-through run, the related changelog .timeline run, and its Accessibility list)
  PROPS: MueStepper — steps (array of {name, text, dot?, state?}; state overrides the derived one, dot replaces the number/check content), current (1-based step number, controlled) / defaultCurrent (uncontrolled), label (<ol> aria-label, default "Progress"), onChange(step) — required for the keyboard path, vertical (adds nothing; the sheet picks the axis at its own 40rem breakpoint), className, plus rest spread on the <ol>. MueStepperItem is the single <li> for hand-composed rails. MueTimeline — items (array of {title, meta, text, state}), children, className, rest on the <ul>; MueTimelineItem is the single <li>
  STATES: is-done (filled dot with the check glyph, so progress survives greyscale), is-current (ringed dot + aria-current="step"), is-upcoming (dashed) — derived from `current` unless a step declares its own state; the last step keeps is-current on a finished flow exactly as the preview argues
  VARIANTS: the four-step mid-flow rail, the three-step completed rail, and the changelog timeline that reads backwards through the same three states
  A11Y: a real <ol> so reading order is step order, the active item carries aria-current="step", the dot numbers and check glyphs are aria-hidden because .stepper-name is the accessible name (nothing is announced twice), and the three states differ by shape not only colour as the preview lists
  KEYBOARD: the preview ships no script (it says state swapping is two class toggles), so this binding adds one documented path: when onChange is present the <ol> takes tabindex="0" and answers ArrowRight/ArrowDown (next step), ArrowLeft/ArrowUp (previous), Home (first) and End (last), each calling onChange — the global :focus-visible ring in engine.css marks the focused rail, and nothing is intercepted without onChange
  EVENTS: onChange(step) from the arrow keys and from clicking an item when onChange is set; controlled when current is passed, self-managed when only defaultCurrent is
  RESPONSIVE: the sheet is vertical under 40rem and horizontal above it, with .stepper-label min-width:0 so a long name wraps rather than widening the row; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the rail was driven from the keyboard — focusing the <ol> and pressing ArrowRight moved .is-current plus aria-current="step" to the next <li> and turned the previous dot into the check glyph, End jumped to the last step; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const STATES = new Set(["done", "current", "upcoming"]);

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

export function MueStepperItem({
  step = 1,
  name,
  text,
  dot,
  state = "upcoming",
  className,
  children,
  ...rest
}) {
  const isCurrent = state === "current";
  return (
    <li
      className={cx(
        "stepper-item",
        STATES.has(state) ? `is-${state}` : null,
        className
      )}
      aria-current={isCurrent ? "step" : undefined}
      {...rest}
    >
      <span className="stepper-dot" aria-hidden="true">
        {dot ?? (state === "done" ? <CheckGlyph /> : step)}
      </span>
      <span className="stepper-label">
        <span className="stepper-name">{name}</span>
        {text ? <span className="stepper-text">{text}</span> : null}
        {children}
      </span>
    </li>
  );
}

export function MueStepper({
  steps = [],
  current,
  defaultCurrent = 1,
  onChange,
  label = "Progress",
  className,
  ...rest
}) {
  const [internal, setInternal] = useState(defaultCurrent);
  const shown = current ?? internal;

  const go = (next) => {
    const clamped = Math.min(Math.max(1, next), steps.length || 1);
    if (clamped === shown) return;
    if (current === undefined) setInternal(clamped);
    onChange?.(clamped);
  };

  const stateFor = (step, i) => {
    if (STATES.has(steps[i]?.state)) return steps[i].state;
    if (step < shown) return "done";
    if (step === shown) return "current";
    return "upcoming";
  };

  return (
    <ol
      className={cx("stepper", className)}
      aria-label={label}
      tabIndex={onChange ? 0 : undefined}
      onKeyDown={
        onChange
          ? (event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                go(shown + 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                go(shown - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                go(1);
              } else if (event.key === "End") {
                event.preventDefault();
                go(steps.length);
              }
            }
          : undefined
      }
      {...rest}
    >
      {steps.map((entry, i) => {
        const step = i + 1;
        const state = stateFor(step, i);
        return (
          <MueStepperItem
            key={`${entry?.name ?? step}`}
            step={step}
            name={entry?.name}
            text={entry?.text}
            dot={entry?.dot}
            state={state}
            onClick={onChange ? () => go(step) : undefined}
          />
        );
      })}
    </ol>
  );
}

export function MueTimelineItem({
  title,
  meta,
  text,
  state = "upcoming",
  className,
  children,
  ...rest
}) {
  return (
    <li
      className={cx(
        "timeline-item",
        STATES.has(state) ? `is-${state}` : null,
        className
      )}
      aria-current={state === "current" ? "step" : undefined}
      {...rest}
    >
      <span className="timeline-title">{title}</span>
      {meta ? <span className="timeline-meta">{meta}</span> : null}
      {text ?? children}
    </li>
  );
}

export function MueTimeline({ items = [], className, children, ...rest }) {
  return (
    <ul className={cx("timeline", className)} {...rest}>
      {items.map((entry, i) => (
        <MueTimelineItem
          key={`${entry?.title ?? i}`}
          title={entry?.title}
          meta={entry?.meta}
          text={entry?.text}
          state={entry?.state}
        />
      ))}
      {children}
    </ul>
  );
}

export default MueStepper;
