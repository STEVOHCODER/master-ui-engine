/* BEGIN MUE:META
  COMPONENT: Rating
  ID: react-ui-rating
  GROUP: Frameworks > React > Components
  CATEGORY: display
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#rating + #fields (.field-helper, .sr-only) + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#rating — .rating, .rating-stars, .star, .star.is-filled, .star.is-half, .rating-value, .rating-input, .rating-radio, .rating-star (44px target, focus ring via .rating-radio:focus-visible + .rating-star)
  PORTS: components/display/rating.html (Read-only run incl. its half star, Rate-this-kit radio group run)
  PROPS: MueRating — value (number, halves allowed), max (default 5), label (aria-label override; default "<value> out of <max> stars"), showValue (default true, the .rating-value number), caption (node appended after the value, e.g. the preview's "312 reviews"), children (appended last, e.g. a .badge), className, rest spread on the <p>. MueRatingInput — name (the form field), value (controlled) / defaultValue (uncontrolled), max, legend (.sr-only group name, default "Rate from 1 to N stars"), disabled, onChange(value), className, children (appended inside the fieldset), rest spread on the <fieldset>
  STATES: read-only (no interaction, .star.is-filled / .star.is-half derived from value) and interactive (the native radio's :checked drives the fill through the sheet's :has() rules, so React never has to paint a hover state)
  VARIANTS: 5.0 / 4.0 / 3.5 star rows (the preview's three) and the five-star radio group
  A11Y: the read-only row is role="img" with an aria-label that spells the score out and an aria-hidden star row, exactly as the preview argues; the input is a real <fieldset> + <legend> radio group so each star keeps its own accessible name ("4 stars, radio button, checked") and the chosen value is the one that submits with the form
  KEYBOARD: Tab enters the radio group and native arrow keys move within it (Right/Up raise, Left/Down lower) with Space committing — nothing is intercepted, so the group behaves like every other radiogroup a reader already knows
  EVENTS: onChange(value: number) on the input branch (undefined when the group is cleared by a host); the read-only branch fires nothing
  RESPONSIVE: both branches are inline-flex rows and the stars are fixed 44px targets, so five of them clear 390px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the radio group was driven from the keyboard (ArrowRight/ArrowLeft) while reading which input:checked and its value back from the DOM, plus a click on a star; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Fragment } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const STAR = "★";

export function MueRating({
  value = 0,
  max = 5,
  label,
  showValue = true,
  caption,
  className,
  children,
  ...rest
}) {
  const rounded = Math.min(Math.max(value, 0), max);
  const stars = Array.from({ length: max }, (_, i) => {
    const n = i + 1;
    if (rounded >= n) return "is-filled";
    if (rounded >= n - 0.5) return "is-half";
    return null;
  });

  return (
    <p
      className={cx("rating", className)}
      role="img"
      aria-label={label ?? `${rounded} out of ${max} stars`}
      {...rest}
    >
      <span className="rating-stars" aria-hidden="true">
        {stars.map((state, i) => (
          <span key={i} className={cx("star", state)}>
            {STAR}
          </span>
        ))}
      </span>
      {showValue ? (
        <span className="rating-value">{rounded.toFixed(1)}</span>
      ) : null}
      {caption}
      {children}
    </p>
  );
}

export function MueRatingInput({
  name,
  value,
  defaultValue,
  max = 5,
  legend = `Rate from 1 to ${max} stars`,
  disabled = false,
  onChange,
  className,
  children,
  ...rest
}) {
  return (
    <fieldset className={cx("rating-input", className)} {...rest}>
      <legend className="sr-only">{legend}</legend>
      {/* Flat siblings only: .rating-star:has(~ .rating-radio:checked) needs every
          radio and label to be a sibling of every other, so the pairs are keyed
          with a Fragment rather than wrapped in a per-star element. */}
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const inputId = `${name ?? "rating"}-${star}`;
        return (
          <Fragment key={star}>
            <input
              className="rating-radio"
              type="radio"
              name={name}
              id={inputId}
              value={String(star)}
              checked={value === undefined ? undefined : value === star}
              defaultChecked={value === undefined ? defaultValue === star : undefined}
              disabled={disabled}
              onChange={() => onChange?.(star)}
            />
            <label className="rating-star" htmlFor={inputId}>
              <span aria-hidden="true">{STAR}</span>
              <span className="sr-only">{`${star} ${star === 1 ? "star" : "stars"}`}</span>
            </label>
          </Fragment>
        );
      })}
      {children}
    </fieldset>
  );
}

export default MueRating;
