/* BEGIN MUE:META
  COMPONENT: Pagination
  ID: react-nav-pagination
  GROUP: Frameworks > React > Components
  CATEGORY: navigation
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#navigation — .pagination (wrapping row), its button cells, .pagination [aria-current="true"], .pagination :disabled, .pagination .ellipsis
  PORTS: components/navigation/pagination.html (Default run, With ellipsis run)
  PROPS: pages (count), page (controlled current), defaultPage (uncontrolled current), onChange (fn(next)), label (nav aria-label, default "Pagination"), prevLabel/nextLabel, maxCells (window size before the run collapses to ellipses, default 7), className, plus any other prop spread on the <nav>
  STATES: current (aria-current="true"), previous/next disabled at the ends (native disabled, so they leave the tab order), collapsed gaps (.ellipsis, aria-hidden)
  VARIANTS: short run (every page is a cell, exactly the preview's default section) and long run (first, last and a window around the current page, with .ellipsis where cells were dropped — the preview's second section shown statically, here derived from the count)
  A11Y: <nav aria-label="Pagination"> landmark; the current page is a button with aria-current="true", the same attribute the sheet styles; edge arrows carry aria-labels ("Previous page"/"Next page") because their glyphs are punctuation; an ellipsis is decoration and is aria-hidden; every cell is a 44px button via --control-h
  KEYBOARD: cells are native buttons, so Tab reaches them and Enter/Space activate; this binding adds Left/Right to step one page and Home/End to jump to the first/last page, handled on the <nav> so they work from any focused cell — the preview binds no keys, so this is the one documented addition, and it is the pair a reader expects from a pager
  EVENTS: onChange(next) on every cell, arrow and key press; the component is controlled when page is passed and self-managed when only defaultPage is
  RESPONSIVE: the row wraps and the sheet centres it on narrow screens; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module and it was driven in headless Chrome (puppeteer-core) 2026-11-03 — clicking a cell moved aria-current and disabled the matching edge button, ArrowRight advanced the page; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* The window the preview's ellipsis row draws: first page, last page, and the
   neighbours of the current one, with a gap marker wherever cells were dropped. */
function windowed(pages, page, maxCells) {
  if (pages <= maxCells) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }
  const half = Math.max(1, Math.floor((maxCells - 2) / 2));
  const from = Math.max(2, page - half);
  const to = Math.min(pages - 1, page + half);
  const out = [1];
  if (from > 2) out.push("gap-start");
  for (let n = from; n <= to; n += 1) out.push(n);
  if (to < pages - 1) out.push("gap-end");
  out.push(pages);
  return out;
}

export function MuePagination({
  pages = 1,
  page,
  defaultPage = 1,
  onChange,
  label = "Pagination",
  prevLabel = "Previous page",
  nextLabel = "Next page",
  maxCells = 7,
  className,
  ...rest
}) {
  const [internal, setInternal] = useState(defaultPage);
  const current = page ?? internal;

  const go = (next) => {
    const clamped = Math.min(Math.max(1, next), pages);
    if (clamped === current) return;
    if (page === undefined) setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <nav
      className={cx("pagination", className)}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(current + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(current - 1);
        } else if (event.key === "Home") {
          event.preventDefault();
          go(1);
        } else if (event.key === "End") {
          event.preventDefault();
          go(pages);
        }
      }}
      {...rest}
    >
      <button type="button" disabled={current <= 1} aria-label={prevLabel} onClick={() => go(current - 1)}>
        {"←"}
      </button>
      {windowed(pages, current, maxCells).map((cell) =>
        typeof cell === "number" ? (
          <button
            key={cell}
            type="button"
            aria-current={cell === current ? "true" : undefined}
            onClick={() => go(cell)}
          >
            {cell}
          </button>
        ) : (
          <span key={cell} className="ellipsis" aria-hidden="true">
            {"…"}
          </span>
        )
      )}
      <button type="button" disabled={current >= pages} aria-label={nextLabel} onClick={() => go(current + 1)}>
        {"→"}
      </button>
    </nav>
  );
}

export default MuePagination;
