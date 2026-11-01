/* BEGIN MUE:META
  COMPONENT: Sidebar
  ID: react-nav-sidebar
  GROUP: Frameworks > React > Components
  CATEGORY: sidebars
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#sidebar + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#sidebar — .sidebar (--sidebar-w, 16rem default), .sidebar-brand, .sidebar-section, .sidebar-heading, .sidebar-link/.sidebar-item, .sidebar-label; below 900px the region itself turns the rail full width and moves its rule to the bottom edge
  PORTS: components/sidebars/sidebar.html (Default: brand line, two sectioned groups, icons, one active link)
  PROPS: MueSidebar — label (aside aria-label, default "Main navigation"), brand, sections (array of {heading, items:[{key, label, href, icon, current}]}), current (controlled active key), defaultCurrent (uncontrolled), onSelect (fn(item, event)), width (maps to the documented --sidebar-w override), children (extra blocks under the sections), className. Slots: MueSidebarSection (title + children), MueSidebarHeading, MueSidebarLink (href, icon, label, current, onSelect), MueSidebarLabel, MueSidebarBrand
  STATES: current (aria-current="page" plus the sheet's tint), hover, and an item with no href which becomes a real <button class="sidebar-item"> instead of a link
  VARIANTS: sectioned rail with icons (the preview), a rail without a brand line, an app-driven controlled rail
  A11Y: <aside aria-label> landmark; the rows sit directly in .sidebar-section exactly as the preview writes them, so no list semantics are invented and no reset CSS is needed; section headings are the sheet's .sidebar-heading text; icon glyphs are aria-hidden and .sidebar-label carries the accessible name and truncates rather than pushing the rail wide; the active row pairs a colour with a tint background, so state is not colour alone
  KEYBOARD: links are native anchors and button rows answer Enter/Space, so Tab walks the rail in reading order; the ring is the sheet's; no key is intercepted — the preview binds none
  EVENTS: onSelect(item, event) fires on click without preventing the href, so a router link or a plain hash both work; the active state is read back from current/defaultCurrent
  RESPONSIVE: width comes from --sidebar-w and the sheet stacks the rail full width under 900px; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module and it was driven in headless Chrome (puppeteer-core) 2026-11-03 — both sections render, the default row carries aria-current="page" and clicking another row moved it; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueSidebarBrand({ className, children, ...rest }) {
  return (
    <div className={cx("sidebar-brand", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueSidebarHeading({ className, children, ...rest }) {
  return (
    <div className={cx("sidebar-heading", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueSidebarLabel({ className, children, ...rest }) {
  return (
    <span className={cx("sidebar-label", className)} {...rest}>
      {children}
    </span>
  );
}

export function MueSidebarLink({
  href,
  current = false,
  icon,
  label,
  onSelect,
  className,
  children,
  ...rest
}) {
  const body =
    children ?? (
      <>
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        <MueSidebarLabel>{label}</MueSidebarLabel>
      </>
    );

  if (!href) {
    return (
      <button
        type="button"
        className={cx("sidebar-item", className)}
        aria-current={current ? "page" : undefined}
        onClick={onSelect}
        {...rest}
      >
        {body}
      </button>
    );
  }

  return (
    <a
      className={cx("sidebar-link", className)}
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onSelect}
      {...rest}
    >
      {body}
    </a>
  );
}

export function MueSidebarSection({ title, className, children, ...rest }) {
  return (
    <div className={cx("sidebar-section", className)} {...rest}>
      {title ? <MueSidebarHeading>{title}</MueSidebarHeading> : null}
      {children}
    </div>
  );
}

export function MueSidebar({
  label = "Main navigation",
  brand,
  sections = [],
  current,
  defaultCurrent,
  onSelect,
  width,
  className,
  children,
  ...rest
}) {
  const [internal, setInternal] = useState(defaultCurrent);
  const active = current ?? internal;
  const keyOf = (item) => item.key ?? item.href ?? item.label;

  return (
    <aside
      className={cx("sidebar", className)}
      aria-label={label}
      style={width ? { "--sidebar-w": width } : undefined}
      {...rest}
    >
      {brand ? <MueSidebarBrand>{brand}</MueSidebarBrand> : null}
      {sections.map((section) => (
        <MueSidebarSection key={section.heading} title={section.heading}>
          {(section.items ?? []).map((item) => (
            <MueSidebarLink
              key={keyOf(item)}
              href={item.href}
              icon={item.icon}
              label={item.label}
              current={active != null ? active === keyOf(item) : item.current}
              onSelect={(event) => {
                if (current === undefined) setInternal(keyOf(item));
                onSelect?.(item, event);
              }}
            />
          ))}
        </MueSidebarSection>
      ))}
      {children}
    </aside>
  );
}

export default MueSidebar;
