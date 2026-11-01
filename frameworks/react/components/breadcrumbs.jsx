/* BEGIN MUE:META
  COMPONENT: Breadcrumbs
  ID: react-nav-breadcrumbs
  GROUP: Frameworks > React > Components
  CATEGORY: navigation
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#navigation — .breadcrumbs (flex row that wraps), .breadcrumbs a, .separator, .breadcrumbs [aria-current="page"]
  PORTS: components/navigation/breadcrumbs.html (Default, Compact)
  PROPS: items (array of {label, href, current} — the last entry is the current page unless one is flagged), label (nav aria-label, default "Breadcrumb"), separator (glyph string, default "›"), compact (boolean), onNavigate (fn(item, index, event)), className, plus any other prop spread on the <nav>
  STATES: current (aria-current="page"), link (item.href); hover and focus colour are the sheet's own rules
  VARIANTS: default (rsaquo separators) and compact (slash separators plus the preview's inline --text-xs size), long trails that wrap onto new lines
  A11Y: a real <nav aria-label="Breadcrumb"> landmark; the current step is a plain <span aria-current="page"> with no href, so it is not offered as a link; every separator glyph is aria-hidden="true" because .breadcrumbs .separator carries no meaning a reader should count; items are emitted as keyed Fragments so the DOM is the preview's flat child list (link, separator, link, separator, current) with no wrapper element between them
  KEYBOARD: links are native anchors, so Tab reaches each level and Enter follows it; the current page is not focusable, exactly as in the preview. No key is intercepted
  EVENTS: onClick per item when onNavigate is passed — the href still navigates, the callback is additive
  RESPONSIVE: the row wraps as the trail grows; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module and it was driven in headless Chrome (puppeteer-core) 2026-11-01 — both trails render, the current span carries aria-current="page", separators are aria-hidden; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Fragment } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueBreadcrumbs({
  items = [],
  label = "Breadcrumb",
  separator = "›",
  compact = false,
  onNavigate,
  className,
  ...rest
}) {
  const last = items.length - 1;
  return (
    <nav
      className={cx("breadcrumbs", className)}
      aria-label={label}
      style={compact ? { fontSize: "var(--text-xs)" } : undefined}
      {...rest}
    >
      {items.map((item, index) => {
        const current = item.current ?? index === last;
        return (
          <Fragment key={`${index}-${item.label}`}>
            {current || !item.href ? (
              <span aria-current={current ? "page" : undefined}>{item.label}</span>
            ) : (
              <a
                href={item.href}
                onClick={
                  onNavigate
                    ? (event) => {
                        onNavigate(item, index, event);
                      }
                    : undefined
                }
              >
                {item.label}
              </a>
            )}
            {index < last ? (
              <span className="separator" aria-hidden="true">
                {separator}
              </span>
            ) : null}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default MueBreadcrumbs;
