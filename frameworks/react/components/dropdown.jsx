/* BEGIN MUE:META
  COMPONENT: Dropdown
  ID: react-ui-dropdown
  GROUP: Frameworks > React > Components
  CATEGORY: dropdowns
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#dropdown (with #buttons) + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#dropdown — .dropdown .is-open .dropdown-menu .dropdown-item .menu-item .menu-item.danger .menu-divider; a closed menu is opacity:0/pointer-events:none, never display:none, so it can fade
  PORTS: components/dropdowns/dropdowns.html (plain rows, rows with icons, divider, danger row)
  VARIANTS: triggerVariant=primary|secondary|outline|ghost|danger|success|link, rows with or without an inline SVG icon, divider, danger row
  A11Y: the trigger is a real button with aria-haspopup="true" and aria-expanded kept in sync; rows are real focusable buttons inside <ul class="dropdown-menu"> so the 44px row and the tint hover arrive together; a closed menu is aria-hidden="true" and inert, which is also the state the sheet keys its opening transition off; decorative icons are aria-hidden and the label carries the meaning; opening moves focus to the first row, exactly like the shared script
  KEYBOARD: Enter/Space open the menu (native button activation); ArrowDown/ArrowUp walk the rows and wrap at both ends; Home/End jump to the first/last row; Escape closes and returns focus to the trigger; a click outside the .dropdown closes it. Home/End is the one addition over styles/mue.js, which binds arrows only
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — trigger click opens, ArrowDown walks, selecting a row closes and fires onSelect, Escape restores focus to the trigger; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const Chevron = () => (
  <svg
    width="1rem"
    height="1rem"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

export function MueDropdown({
  label,
  triggerVariant = "outline",
  triggerClassName,
  className,
  children,
  onOpenChange,
  ...rest
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const setShow = (next) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  /* Opening hands focus to the first row, the same move the shared script makes. */
  useEffect(() => {
    if (!open) return undefined;
    const first = menuRef.current?.querySelector(".menu-item, .dropdown-item");
    first?.focus();

    const onDocumentClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setShow(false);
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [open]);

  const rows = () => Array.from(menuRef.current?.querySelectorAll(".menu-item, .dropdown-item") ?? []);

  const onMenuKeydown = (event) => {
    const items = rows();
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    const move = (next) => {
      event.preventDefault();
      items[(next + items.length) % items.length].focus();
    };
    switch (event.key) {
      case "ArrowDown":
        move(index + 1);
        break;
      case "ArrowUp":
        move(index - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(items.length - 1);
        break;
      case "Escape":
        event.stopPropagation();
        setShow(false);
        triggerRef.current?.focus();
        break;
      default:
    }
  };

  return (
    <div ref={wrapRef} className={cx("dropdown", open && "is-open", className)} {...rest}>
      <button
        ref={triggerRef}
        type="button"
        className={cx("btn", `btn-${triggerVariant}`, triggerClassName)}
        aria-haspopup="true"
        aria-expanded={String(open)}
        onClick={() => setShow(!open)}
      >
        {label}
        <Chevron />
      </button>

      <ul
        ref={menuRef}
        className={cx("dropdown-menu", open && "is-open")}
        aria-hidden={String(!open)}
        inert={open ? undefined : true}
        onKeyDown={onMenuKeydown}
        onClick={() => setShow(false)}
      >
        {children}
      </ul>
    </div>
  );
}

/* `icon` must be an aria-hidden inline SVG, exactly as the preview writes it;
   .menu-item svg in the sheet is what sizes and tints it. */
export function MueDropdownItem({ icon, danger = false, onSelect, className, children, ...rest }) {
  return (
    <li>
      <button
        type="button"
        className={cx("menu-item", danger && "danger", className)}
        onClick={() => onSelect?.()}
        {...rest}
      >
        {icon}
        {children}
      </button>
    </li>
  );
}

export function MueDropdownDivider() {
  return (
    <li>
      <div className="menu-divider" />
    </li>
  );
}

export default MueDropdown;
