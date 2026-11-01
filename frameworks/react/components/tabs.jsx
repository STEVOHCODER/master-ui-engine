/* BEGIN MUE:META
  COMPONENT: Tabs
  ID: react-nav-tabs
  GROUP: Frameworks > React > Components
  CATEGORY: navigation
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#tabs + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#tabs — .tabs .tab-list/[role=tablist] .tab .tab[aria-selected] .tab::after ink bar .tab-panel .tab-panel[hidden] .pills
  PORTS: components/navigation/tabs.html
  VARIANTS: underline ink bar (default), pills (the .pills wrapper on the tablist); controlled (activeTab + onChange) or uncontrolled (defaultTab)
  A11Y: role="tablist" with an accessible name from the label prop, role="tab" per button with aria-controls + aria-selected, role="tabpanel" per panel with aria-labelledby and tabindex="0" so panel content is reachable; the inactive panel is hidden with the hidden attribute exactly as mue.js does it, driven by aria-controls; the ink bar is painted by .tab[aria-selected="true"]::after, so React only publishes the state
  KEYBOARD: roving tabindex — only the selected tab is in the tab order; ArrowRight/ArrowLeft move activation and wrap at both ends (what mue.js binds); Home/End jump to first/last (the documented ARIA pattern, added here); Enter/Space activate through native button behaviour; below 640px the tablist scrolls horizontally while the rows stay 44px, which is the sheet's overflow-x:auto
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — ArrowRight walks the tablist, aria-selected and the hidden panels follow, and the roving tabindex keeps one tab stop
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Children, isValidElement, useId, useMemo, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueTab({ children }) {
  /* Panels are rendered by MueTabs; this component exists to describe one. */
  return children ?? null;
}

export function MueTabs({
  label,
  pills = false,
  defaultTab,
  activeTab,
  onChange,
  className,
  children,
  ...rest
}) {
  const base = useId();
  const tabs = useMemo(
    () =>
      Children.toArray(children)
        .filter(isValidElement)
        .map((child, index) => ({
          id: child.props.id ?? `${base}-${index}`,
          label: child.props.label ?? `Tab ${index + 1}`,
          content: child.props.children,
        })),
    [children, base]
  );

  const controlled = activeTab !== undefined;
  const [internal, setInternal] = useState(() => defaultTab ?? tabs[0]?.id);
  const selected = controlled ? activeTab : internal;

  const select = (id) => {
    if (!controlled) setInternal(id);
    onChange?.(id);
  };

  const index = Math.max(0, tabs.findIndex((tab) => tab.id === selected));
  const panelId = (id) => `${id}-panel`;
  const triggerId = (id) => `${id}-tab`;

  const onKeyDown = (event) => {
    if (!tabs.length) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    let next = null;
    if (step) next = (index + step + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    select(tabs[next].id);
    document.getElementById(triggerId(tabs[next].id))?.focus();
  };

  return (
    <div className={cx("tabs", className)} {...rest}>
      {/* .pills replaces .tab-list: it is the same tablist with a segmented skin,
          so stacking both would fight over padding, radius and the ink bar. */}
      <div className={pills ? "pills" : "tab-list"} role="tablist" aria-label={label}>
        {tabs.map((tab, position) => {
          const on = position === index;
          return (
            <button
              key={tab.id}
              type="button"
              id={triggerId(tab.id)}
              className="tab"
              role="tab"
              aria-controls={panelId(tab.id)}
              aria-selected={String(on)}
              tabIndex={on ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={onKeyDown}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, position) => (
        <div
          key={tab.id}
          id={panelId(tab.id)}
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={triggerId(tab.id)}
          tabIndex={0}
          hidden={position !== index}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

export default MueTabs;
