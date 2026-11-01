/* BEGIN MUE:META
  COMPONENT: Skeleton
  ID: react-fb-skeleton
  GROUP: Frameworks > React > Components
  CATEGORY: feedback
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#feedback + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#feedback — .skeleton (shimmer block), .skeleton-text, .skeleton-title, .skeleton-avatar, .skeleton-img, .skeleton-btn, .skeleton-row, .skeleton-body, plus .card and .stack from the same sheet for the composites
  PORTS: components/feedback/skeleton.html (Card skeleton run, List skeleton run, Button skeleton run)
  PROPS: MueSkeleton — shape (text|title|avatar|img|btn|row|body, default text; any other string falls back to the bare .skeleton so no undefined class is emitted), width (the preview's own inline style="width:40%" knob, only a length string), className, children, rest spread on the div; MueSkeletonBody — children; MueSkeletonRow — avatar (default true), lines (default 2), children; MueSkeletonCard — lines (default 2), children
  STATES: loading only — the host swaps the skeleton for real content; the shimmer is a ::after sweep owned by the sheet
  VARIANTS: the three the preview demos: a .card holding .skeleton-img + .skeleton-body, a .skeleton-row holding an avatar and a .stack of lines, and a lone .skeleton-btn
  A11Y: every shape is aria-hidden because it carries no meaning, and the composite wrappers expose the loading state through the host's live region — the preview's advice is to announce loading with aria-live="polite", so MueSkeletonBody accepts role/aria-live props via rest
  KEYBOARD: none — a skeleton is inert placeholder content and nothing is focusable inside it
  EVENTS: none
  RESPONSIVE: shapes are fluid (percent widths inside a flex row) so they never overflow at 390px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the card/list/button composites were read back from the DOM to confirm the shape classes landed; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* Every skeleton shape the shared sheet defines. An unknown shape falls back to
   the plain .skeleton block instead of inventing "skeleton-<something>". */
const SHAPES = new Set(["text", "title", "avatar", "img", "btn", "row", "body"]);

export function MueSkeleton({
  shape = "text",
  width,
  className,
  children,
  ...rest
}) {
  return (
    <div
      className={cx(
        "skeleton",
        SHAPES.has(shape) ? `skeleton-${shape}` : null,
        className
      )}
      aria-hidden="true"
      style={width ? { width } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

export function MueSkeletonBody({ className, children, ...rest }) {
  return (
    <div className={cx("skeleton-body", className)} aria-hidden="true" {...rest}>
      {children}
    </div>
  );
}

export function MueSkeletonRow({
  avatar = true,
  lines = 2,
  className,
  children,
  ...rest
}) {
  return (
    <div className={cx("skeleton-row", className)} aria-hidden="true" {...rest}>
      {avatar ? <MueSkeleton shape="avatar" /> : null}
      <div className="stack" style={{ flex: 1, minWidth: 0 }}>
        {Array.from({ length: Math.max(0, lines) }, (_, i) => (
          <MueSkeleton
            key={i}
            shape={i === 0 ? "title" : "text"}
            width={i === 0 ? "70%" : i === 1 ? "40%" : undefined}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

export function MueSkeletonCard({ lines = 2, className, children, ...rest }) {
  return (
    <div className={cx("card", className)} aria-hidden="true" {...rest}>
      <MueSkeleton shape="img" />
      <MueSkeletonBody>
        {Array.from({ length: Math.max(0, lines) }, (_, i) => (
          <MueSkeleton
            key={i}
            shape={i === 0 ? "title" : "text"}
            width={i === 1 ? "40%" : undefined}
          />
        ))}
        {children}
      </MueSkeletonBody>
    </div>
  );
}

export default MueSkeleton;
