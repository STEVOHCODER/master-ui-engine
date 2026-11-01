/* BEGIN MUE:META
  COMPONENT: Accordion
  ID: react-ui-accordion
  GROUP: Frameworks > React > Components
  CATEGORY: disclosure
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#disclosure + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#disclosure — .accordion .accordion-item .accordion-trigger .accordion-trigger[aria-expanded=true] svg .accordion-panel .accordion-panel.is-open .accordion-panel > div .accordion-panel p
  PORTS: components/marketing/sections.html (the FAQ accordion, the only preview that carries #disclosure)
  VARIANTS: exclusive (one panel open, the FAQ default) and exclusive={false} (several open, the vanilla data-exclusive="off" case); defaultOpen accepts one id or a list
  A11Y: the header is a real <button> carrying aria-expanded and aria-controls; the panel is a plain div with that id, matching the preview — .accordion-panel > div with overflow:hidden is what collapses it, so a closed panel is height 0 rather than display:none, exactly as the sheet intends; the plus glyph is aria-hidden and focusable="false" so it never takes a separate stop
  KEYBOARD: Enter/Space toggle through native button behaviour, which is all the shared script binds for [data-disclosure]; Tab reaches each header in order; the 45deg rotation is a CSS state, not a JS animation, so nothing is timed here
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — clicking a header moves aria-expanded to true, adds .is-open to its panel and closes the sibling in exclusive mode; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { Children, isValidElement, useId, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const Plus = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function MueAccordionItem({ children }) {
  /* Panels are rendered by MueAccordion; this component exists to describe one. */
  return children ?? null;
}

export function MueAccordion({
  exclusive = true,
  defaultOpen,
  className,
  children,
  ...rest
}) {
  const base = useId();
  const items = Children.toArray(children)
    .filter(isValidElement)
    .map((child, index) => ({
      id: child.props.id ?? `${base}-item-${index}`,
      title: child.props.title,
      content: child.props.children,
    }));

  const initial = new Set(
    (Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]).filter(Boolean)
  );
  const [openIds, setOpenIds] = useState(initial);

  /* Same rule the shared script applies: re-open the clicked header, and in
     exclusive mode every other panel closes first. */
  const toggle = (id) => {
    setOpenIds((current) => {
      const next = new Set(exclusive ? [] : current);
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cx("accordion", className)} {...rest}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        const panelId = `${item.id}-panel`;
        return (
          <div className="accordion-item" key={item.id}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={String(open)}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
            >
              {item.title}
              <Plus />
            </button>
            <div className={cx("accordion-panel", open && "is-open")} id={panelId}>
              <div>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MueAccordion;
