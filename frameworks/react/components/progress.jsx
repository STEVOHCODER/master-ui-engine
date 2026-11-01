/* BEGIN MUE:META
  COMPONENT: Progress
  ID: react-fb-progress
  GROUP: Frameworks > React > Components
  CATEGORY: feedback
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#feedback — .progress/.track, .track > .bar { width: var(--value, 0%) }, .progress-success, .progress-warning, .progress-striped, .progress-indeterminate, .progress-group, .progress-label, .progress-label .percent
  PORTS: components/feedback/progress.html (Determinate run, Indeterminate run, Interactive demo run)
  PROPS: value, min (default 0), max (default 100), tone ("success" | "warning" | none — any other string is ignored so no undefined class is emitted), striped, indeterminate, label (aria-label for a lone track), labelId (aria-labelledby, set for you by MueProgressGroup), showPercent (default true), className, plus any other prop spread on the role="progressbar" element
  STATES: determinate (aria-valuenow tracks the clamped value), indeterminate (no aria-valuenow, the sheet sweeps the bar itself), success / warning / striped tones on the track
  VARIANTS: a bare .track, and .progress-group with the .progress-label row (name on one side, .percent on the other) exactly as the preview draws it
  A11Y: role="progressbar" with aria-valuemin/valuemax always and aria-valuenow only when the value is measurable; the visible name is the .progress-label span wired by aria-labelledby (the preview's own pairing) or aria-label for a lone track; the percent text and the label mean the state is never colour-only
  KEYBOARD: none intercepted — a progress bar is not an interactive control; the demo buttons in the gallery are ordinary <button>s so Tab/Enter reach them
  EVENTS: no DOM events of its own; value is a plain prop, so the host re-renders it (the preview's [data-progress] click handler becomes a useState + onClick in the gallery)
  RESPONSIVE: the track is width:100% and the label row is a flex pair, so nothing overflows at 390px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the demo buttons were clicked while reading back style.getPropertyValue("--value"), .percent text and aria-valuenow; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The only two tone classes the shared sheet defines for a progress bar. Any
   other value is dropped rather than turned into "progress-<something>", so a
   binding can never write a class the sheet does not own. */
const TONES = new Set(["success", "warning"]);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function MueProgress({
  value = 0,
  min = 0,
  max = 100,
  tone,
  striped = false,
  indeterminate = false,
  label,
  labelId,
  className,
  ...rest
}) {
  const shown = clamp(value, min, max);
  const pct = max === min ? 0 : Math.round(((shown - min) / (max - min)) * 100);

  return (
    <div
      className={cx(
        "track",
        tone && TONES.has(tone) && `progress-${tone}`,
        striped && !indeterminate && "progress-striped",
        indeterminate && "progress-indeterminate",
        className
      )}
      role="progressbar"
      aria-label={labelId ? undefined : label ?? "Progress"}
      aria-labelledby={labelId}
      aria-valuenow={indeterminate ? undefined : shown}
      aria-valuemin={indeterminate ? undefined : min}
      aria-valuemax={indeterminate ? undefined : max}
      {...rest}
    >
      <div
        className="bar"
        style={indeterminate ? undefined : { "--value": `${pct}%` }}
      />
    </div>
  );
}

export function MueProgressGroup({
  label = "Progress",
  value = 0,
  min = 0,
  max = 100,
  tone,
  striped = false,
  indeterminate = false,
  showPercent = true,
  id,
  className,
  children,
  ...rest
}) {
  const auto = useId();
  const labelId = id ?? `progress-${auto}`;
  const shown = clamp(value, min, max);
  const pct = max === min ? 0 : Math.round(((shown - min) / (max - min)) * 100);

  return (
    <div className={cx("progress-group", className)} {...rest}>
      <div className="progress-label">
        <span id={labelId}>{label}</span>
        {showPercent && !indeterminate ? (
          <span className="percent">{`${pct}%`}</span>
        ) : null}
      </div>
      <MueProgress
        value={value}
        min={min}
        max={max}
        tone={tone}
        striped={striped}
        indeterminate={indeterminate}
        labelId={labelId}
      />
      {children}
    </div>
  );
}

export default MueProgress;
