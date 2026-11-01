/* BEGIN MUE:META
  COMPONENT: Guidance (product tour + float buttons)
  ID: react-ui-guidance
  GROUP: Frameworks > React > Components
  CATEGORY: overlays
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#guidance (+ #cards, #badges, #buttons, #utilities, all linked by the host page), react (createContext/useId/useRef/useState); no other module in this package, no chart or icon library, no CDN
  SHEET: styles/components.css#guidance — .tour-stage, .tour + .is-open, .tour-target, .tour-card, .tour-top, .tour-end, .tour-arrow, .tour-step, .tour-title, .tour-body, .tour-actions, .tour-dots, .dot + .is-current, .float-btn, .float-btn-primary, .float-btn-label, .float-btn-group + .is-visible; #cards supplies the .card/.card-body the stage is built from, #badges the step-state pill, #buttons the Skip/Back/Next and replay controls. Documented deviation: the preview writes .tour-top/.tour-end on the card, while the sheet's moving rule is `.tour-top > .tour-card` / `.tour-end > .tour-card`, so this binding puts the position class on the step wrapper as well as on the card — the card's own class list still matches the preview and the card now actually flips
  PORTS: components/overlays/guidance.html (Product tour run — its four data-step wrappers, replay button and Step-N-of-4 pill; Card anatomy run — the bare .tour-card below and above; Float buttons run — default, primary, labelled and the anchor form; plus the fixed dock its page script reveals past 420px and the Back-to-top button wired there)
  PROPS: MueGuidance — total (step count: the counter, the dot row and the Finish label all read it), current (controlled open step, 1-based, -1 = closed) / defaultCurrent (uncontrolled, default -1 so a tour starts shut), onChange(step) fired for every move including -1, children; it renders no element of its own, only the step state. MueGuidanceStage — the .tour-stage card wrapper (className, children, rest on the div). MueGuidanceStep — step (its 1-based number, written to data-step), target (node inside .tour-target), title, body, placement ("top" | "end" | "top-end" | "end-top"; anything else writes no position class), total (override of the provider's), as ("span" default, "div" when the target is block content — the preview switches for exactly that reason), skipLabel/backLabel/nextLabel/backDisabled/dots (passed through to the card), className. MueGuidanceCard — step, total, title, body, placement, dots, skipLabel / backLabel / nextLabel (null hides that button), onSkip / onBack / onNext, focusHint ("next" | "back"), headingId, children, rest on the card; it is exported so the anatomy variant can be drawn with no target and no provider. MueGuidanceReplay — step (default 1), variant (default "outline"), size (default "sm"), children (default "Replay tour"). MueGuidanceStatus — closedLabel (default "Tour closed"), className — the .badge.badge-info pill. MueFloatButton — variant ("primary" | "label" | none), label (aria-label for an icon-only button), href (renders the anchor form the preview uses), toTop (click scrolls the window to the top, the preview's #fab-top behaviour), onClick, children (inline SVG and/or text). MueFloatDock — visible (controlled), revealAfter (scroll offset, default 420 like the preview), className, children
  STATES: tour closed (no step carries .is-open, the pill reads "Tour closed"), tour open at step N (that one wrapper carries .is-open, so the sheet paints the target ring and reveals its card), first step (Back disabled), last step (Next reads "Finish" and closes), card placement (.tour-top / .tour-end), dot position (.is-current), and for the dock hidden-below-threshold vs .is-visible
  VARIANTS: the four-step coachmark inside a clipped stage (steps 1-2 open below with .tour-end, steps 3-4 with .tour-top), a bare .tour-card below and above with no target, and the float button in default, primary, labelled and anchor form plus the stacked dock
  A11Y: every card is role="dialog" labelled by its own .tour-title id (useId when the host does not pass headingId); the dot row and the notch are aria-hidden because the counter text and the card carry the meaning; Back and Skip are real <button>s, so a disabled first-step Back leaves the tab order instead of faking it; the pill text is the state and the host can wrap it in a live region; a card of a step that is not open carries inert as well as the sheet's own visibility:hidden, so its three buttons cannot be tabbed into; float glyphs are decorative and each icon-only control carries an aria-label
  KEYBOARD: Skip, Back and Next are native buttons (Tab reaches them, Enter/Space presses them); Escape closes the tour at document level and returns focus to MueGuidanceReplay when one is mounted (otherwise focus is left where the browser put it); opening a later step moves focus to that step's Next button, and Back moves focus to the previous step's Back button, so the reader keeps their place exactly as the page script did; no arrow keys are bound — the preview binds none
  EVENTS: onChange(step) from Next, Back, Skip, Finish, Escape, the replay button and any programmatic go(); -1 means closed; MueFloatDock reports nothing (it only reads window.scrollY); MueFloatButton passes onClick through and toTop calls window.scrollTo({ top: 0, behavior: "smooth" })
  RESPONSIVE: the card is capped by the sheet at min(21rem, 100vw - 4rem) so it stays inside the stage at 320px, .tour-stage clips the scrim to the surface being taught, and the dock's gutter tightens below 640px; rendered at 1280px, 820px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the tour was driven — the replay button opened step 1 with .is-open on its wrapper, Next advanced and focused the next card's Next button, the last step's Finish closed it, Escape closed it and put focus back on the replay button, and .tour-top moved step 3's card above its target; no new CSS is asserted and no colour or radius is set from script
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { createContext, useContext, useId, useRef, useState, useEffect } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The tour is one number: which step is open. -1 is closed, which is what the
   preview's own script used (open = -1), so "closed" is a state and not a flag. */
const CLOSED = -1;

/* The two position classes the sheet defines inside #guidance. Anything else
   writes no position class, so the card keeps the default placement below. */
const PLACEMENTS = {
  top: ["tour-top"],
  end: ["tour-end"],
  "top-end": ["tour-top", "tour-end"],
  "end-top": ["tour-top", "tour-end"],
};

/* Only these tones exist in #buttons, so an unknown replay variant writes the
   size class alone rather than a class the sheet does not own. */
const REPLAY_VARIANTS = new Set([
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
  "success",
  "link",
]);

const GuidanceContext = createContext(null);

function useGuidance(who) {
  const ctx = useContext(GuidanceContext);
  if (!ctx) {
    throw new Error(`${who} needs an open <MueGuidance> above it to read the step from.`);
  }
  return ctx;
}

export function MueGuidance({
  total = 1,
  current,
  defaultCurrent = CLOSED,
  onChange,
  children,
}) {
  const [internal, setInternal] = useState(defaultCurrent);
  const [hint, setHint] = useState(null);
  const shown = current ?? internal;
  const replayRef = useRef(null);

  /* Which control the newly opened card should hand focus to, exactly the
     "[data-next]" / "[data-back]" selector argument the preview's show() took. */
  const go = (next, nextHint = null) => {
    setHint(nextHint);
    if (current === undefined) setInternal(next);
    onChange?.(next);
  };

  const close = () => {
    go(CLOSED);
    const replay = replayRef.current;
    if (replay && document.contains(replay)) replay.focus();
  };

  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (shown <= CLOSED) return undefined;
    const onKeydown = (event) => {
      if (event.key !== "Escape") return;
      closeRef.current();
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [shown]);

  const ctx = {
    shown,
    hint,
    total,
    go,
    close,
    registerReplay: (el) => {
      replayRef.current = el;
    },
  };

  /* The provider writes no element: the preview keeps the replay row, the stage
     and the cards as ordinary siblings, and a wrapper here would change them. */
  return <GuidanceContext.Provider value={ctx}>{children}</GuidanceContext.Provider>;
}

export function MueGuidanceStage({ className, children, ...rest }) {
  return (
    <div className={cx("tour-stage", "card", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueGuidanceCard({
  step = 1,
  total = 1,
  title,
  body,
  placement,
  dots,
  skipLabel = "Skip",
  backLabel = "Back",
  nextLabel,
  backDisabled = false,
  onSkip,
  onBack,
  onNext,
  focusHint = null,
  headingId,
  className,
  children,
  ...rest
}) {
  const auto = useId();
  const titleId = headingId ?? `tour-title-${auto}`;
  const nextRef = useRef(null);
  const backRef = useRef(null);
  const shownDots = dots ?? total;
  const nextText = nextLabel ?? (step >= total ? "Finish" : "Next");

  useEffect(() => {
    if (!focusHint) return;
    const el = focusHint === "back" ? backRef.current : nextRef.current;
    el?.focus();
  }, [focusHint, step]);

  return (
    <div
      className={cx("tour-card", PLACEMENTS[placement], className)}
      role="dialog"
      aria-labelledby={titleId}
      {...rest}
    >
      <span className="tour-arrow" aria-hidden="true" />
      <p className="tour-step">{`Step ${step} of ${total}`}</p>
      <p className="tour-title" id={titleId}>
        {title}
      </p>
      <p className="tour-body">{body}</p>
      <div className="tour-actions">
        <span className="tour-dots" aria-hidden="true">
          {Array.from({ length: Math.max(0, shownDots) }, (_, i) => (
            <span key={i} className={cx("dot", i === step - 1 && "is-current")} />
          ))}
        </span>
        <span className="row">
          {skipLabel ? (
            <button type="button" className="btn-ghost btn-sm" data-skip onClick={onSkip}>
              {skipLabel}
            </button>
          ) : null}
          {backLabel ? (
            <button
              type="button"
              className="btn-outline btn-sm"
              data-back
              ref={backRef}
              disabled={backDisabled}
              onClick={onBack}
            >
              {backLabel}
            </button>
          ) : null}
          {nextLabel !== null ? (
            <button
              type="button"
              className="btn-primary btn-sm"
              data-next
              ref={nextRef}
              onClick={onNext}
            >
              {nextText}
            </button>
          ) : null}
        </span>
      </div>
      {children}
    </div>
  );
}

export function MueGuidanceStep({
  step,
  target,
  total,
  placement,
  as = "span",
  className,
  children,
  ...cardProps
}) {
  const { shown, hint, total: providerTotal, go, close } = useGuidance("MueGuidanceStep");
  const open = shown === step;
  const steps = total ?? providerTotal;
  const Wrapper = as;

  return (
    <Wrapper
      className={cx("tour", PLACEMENTS[placement], open && "is-open", className)}
      data-step={step}
    >
      <Wrapper className="tour-target">{target ?? children}</Wrapper>
      <MueGuidanceCard
        step={step}
        total={steps}
        placement={placement}
        backDisabled={step <= 1}
        focusHint={open ? hint : null}
        inert={open ? undefined : true}
        onSkip={close}
        onBack={() => go(step > 1 ? step - 1 : 1, "back")}
        onNext={() => (step < steps ? go(step + 1, "next") : close())}
      />
    </Wrapper>
  );
}

export function MueGuidanceReplay({
  step = 1,
  variant = "outline",
  size = "sm",
  children = "Replay tour",
  className,
  ...rest
}) {
  const { go, registerReplay } = useGuidance("MueGuidanceReplay");
  return (
    <button
      type="button"
      ref={registerReplay}
      className={cx(
        REPLAY_VARIANTS.has(variant) && `btn-${variant}`,
        size ? `btn-${size}` : null,
        className
      )}
      onClick={() => go(step, "next")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function MueGuidanceStatus({ closedLabel = "Tour closed", className, ...rest }) {
  const { shown, total } = useGuidance("MueGuidanceStatus");
  return (
    <span className={cx("badge", "badge-info", className)} {...rest}>
      {shown > CLOSED ? `Step ${shown} of ${total}` : closedLabel}
    </span>
  );
}

export function MueFloatButton({
  variant,
  label,
  href,
  toTop = false,
  onClick,
  children,
  className,
  ...rest
}) {
  const classes = cx(
    "float-btn",
    variant === "primary" && "float-btn-primary",
    variant === "label" && "float-btn-label",
    className
  );
  const activate = (event) => {
    if (toTop) window.scrollTo({ top: 0, behavior: "smooth" });
    onClick?.(event);
  };

  if (href) {
    return (
      <a
        className={classes}
        href={href}
        aria-label={label}
        onClick={onClick ? activate : undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} aria-label={label} onClick={activate} {...rest}>
      {children}
    </button>
  );
}

export function MueFloatDock({ visible, revealAfter = 420, className, children, ...rest }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (visible !== undefined) return undefined;
    let ticking = false;
    const reveal = () => {
      setScrolled(window.scrollY > revealAfter);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(reveal);
    };
    reveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible, revealAfter]);

  const shown = visible ?? scrolled;

  return (
    <div className={cx("float-btn-group", shown && "is-visible", className)} {...rest}>
      {children}
    </div>
  );
}

export default MueGuidance;
