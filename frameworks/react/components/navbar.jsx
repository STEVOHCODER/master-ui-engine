/* BEGIN MUE:META
  COMPONENT: Header navigation and navigation menu
  ID: react-nav-header
  GROUP: Frameworks > React > Components
  CATEGORY: navigation
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#navigation (with #dropdown for the menu surface, #fields for the search slot, #buttons and #display for the actions an app puts in `actions`) + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#navigation — .site-header/.navbar (sticky bar, .is-scrolled shadow), .nav-brand, .nav-links (+ .is-open drawer under 768px), .nav-item, .nav-link ([aria-current="page"]), .nav-spacer, .nav-search (--nav-search-max-w), .hamburger + #dropdown — .dropdown.is-open .dropdown-menu, .menu-item, .menu-divider
  PORTS: components/navigation/header-nav.html (brand + links + actions + hamburger) and components/navigation/navigation-menu.html (default navbar, navbar with a dropdown)
  PROPS: MueHeaderNav — brand, brandHref, links ([{label, href, current}]), actions (node, e.g. a .btn and an .avatar), search ({label, placeholder, value, defaultValue, onChange}) rendered in .nav-search, open/defaultOpen/onOpenChange (drawer), scrolled (controlled shadow; measured when omitted), className. MueNavMenu — label, items ([{label, href, current, menu:[{label, href, divider, onSelect}]}]), same drawer props. Slots: MueNavLink, MueNavBrand, MueNavSpacer, MueNavSearch
  STATES: drawer open (.is-open + aria-expanded), dropdown open (.dropdown.is-open + aria-expanded), current link (aria-current="page"), scrolled shadow (.is-scrolled past 8px), and a closed menu that is aria-hidden + inert
  VARIANTS: site-header (role=banner, brand, actions, hamburger) and navbar (a plain labelled nav, with or without a dropdown cell)
  A11Y: <header role="banner"> / <nav aria-label> landmarks; the hamburger is a real button with aria-controls + aria-expanded pointing at the list id from useId; the active cell pairs a colour with a tint background; the dropdown trigger keeps aria-haspopup/aria-expanded and its surface is a <ul class="dropdown-menu"> of links; a closed surface is inert so its rows leave the tab order; the search cell is labelled by a .sr-only label because a placeholder is not a label; the hamburger glyph is decoration and the button's name is "Toggle navigation"
  KEYBOARD: Tab walks the cells in reading order and Enter follows a link; the hamburger opens the drawer and Escape closes it and returns focus to the button; inside an open dropdown ArrowDown/ArrowUp walk the rows and wrap, Home/End jump, Escape closes and restores focus to the trigger, a click outside closes it. styles/mue.js binds both of these only at boot, which is why the bindings own them
  EVENTS: onOpenChange(open) for the drawer, onSelect(item, event) per nav cell and per menu row — href navigation is never prevented; the scroll shadow is read from window.scrollY in a rAF-throttled listener, the same threshold styles/mue.js uses
  RESPONSIVE: below 768px the sheet hides the hamburger's sibling list and reveals it as a full-width drawer when .is-open lands on .nav-links; the bar itself wraps onto two rows; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module and it was driven in headless Chrome (puppeteer-core) 2026-11-03 — the hamburger toggled .is-open and aria-expanded, Escape closed it, the dropdown opened on click, ArrowDown walked its rows and Escape restored focus; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useId, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const Chevron = () => (
  <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

/* The two behaviours styles/mue.js owns at boot, re-implemented for React: the
   drawer toggle (the shared script binds the click once, on the button that was
   in the DOM at load) and the scroll shadow past 8px. */
function useScrolled(controlled) {
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    if (controlled !== undefined) return undefined;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setMeasured(window.scrollY > 8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [controlled]);
  return controlled ?? measured;
}

function useDrawer({ open, defaultOpen = false, onOpenChange }) {
  const [internal, setInternal] = useState(defaultOpen);
  const shown = open ?? internal;
  const buttonRef = useRef(null);

  const setShow = (next) => {
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!shown) return undefined;
    const onKeydown = (event) => {
      if (event.key !== "Escape") return;
      setShow(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [shown]);

  return { shown, setShow, buttonRef };
}

export function MueNavBrand({ href = "#", className, children, ...rest }) {
  return (
    <a className={cx("nav-brand", className)} href={href} {...rest}>
      {children}
    </a>
  );
}

export function MueNavSpacer({ className, ...rest }) {
  return <div className={cx("nav-spacer", className)} {...rest} />;
}

export function MueNavLink({ href = "#", current = false, onSelect, className, children, ...rest }) {
  return (
    <li className="nav-item">
      <a
        className={cx("nav-link", className)}
        href={href}
        aria-current={current ? "page" : undefined}
        onClick={onSelect}
        {...rest}
      >
        {children}
      </a>
    </li>
  );
}

export function MueNavSearch({ label, placeholder, value, defaultValue, onChange, className, ...rest }) {
  const auto = useId();
  const id = `nav-search-${auto}`;
  return (
    <div className={cx("nav-search", className)} {...rest}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </div>
  );
}

/* A nav cell that opens a menu surface instead of following a link. */
function NavDropdown({ item, onSelect }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector(".menu-item, .dropdown-item")?.focus();
    const onDocumentClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [open]);

  const rows = () => Array.from(menuRef.current?.querySelectorAll(".menu-item, .dropdown-item") ?? []);

  const onKeydown = (event) => {
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
        setOpen(false);
        triggerRef.current?.focus();
        break;
      default:
    }
  };

  return (
    <li className="nav-item">
      <div ref={wrapRef} className={cx("dropdown", open && "is-open")}>
        <button
          ref={triggerRef}
          type="button"
          className="nav-link"
          aria-haspopup="true"
          aria-expanded={String(open)}
          onClick={() => setOpen((current) => !current)}
        >
          {item.label}
          <Chevron />
        </button>
        <ul
          ref={menuRef}
          className="dropdown-menu"
          aria-hidden={String(!open)}
          inert={open ? undefined : true}
          onKeyDown={onKeydown}
        >
          {(item.menu ?? []).map((row, index) =>
            row.divider ? (
              <li key={`${index}-divider`}>
                <div className="menu-divider" role="separator" />
              </li>
            ) : (
              <li key={`${index}-${row.label}`}>
                <a
                  className="menu-item"
                  href={row.href ?? "#"}
                  onClick={(event) => {
                    setOpen(false);
                    row.onSelect?.(row, event);
                    onSelect?.(row, event);
                  }}
                >
                  {row.label}
                </a>
              </li>
            )
          )}
        </ul>
      </div>
    </li>
  );
}

export function MueNavMenu({
  as = "nav",
  variant = "navbar",
  label = "Main navigation",
  items = [],
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  scrolled,
  className,
  children,
  ...rest
}) {
  const auto = useId();
  const listId = `nav-links-${auto}`;
  const { shown, setShow, buttonRef } = useDrawer({ open, defaultOpen, onOpenChange });
  const isScrolled = useScrolled(scrolled);
  const Tag = as;

  return (
    <Tag
      className={cx(variant, isScrolled && "is-scrolled", className)}
      aria-label={variant === "navbar" ? label : undefined}
      role={variant === "site-header" ? "banner" : undefined}
      {...rest}
    >
      {children ?? (
        <>
          <ul className={cx("nav-links", shown && "is-open")} id={listId}>
            {items.map((item, index) =>
              item.menu ? (
                <NavDropdown key={item.key ?? `${index}-${item.label}`} item={item} onSelect={onSelect} />
              ) : (
                <MueNavLink
                  key={item.key ?? `${index}-${item.label}`}
                  href={item.href}
                  current={item.current}
                  onSelect={(event) => {
                    setShow(false);
                    onSelect?.(item, event);
                  }}
                >
                  {item.label}
                </MueNavLink>
              )
            )}
          </ul>
          <MueNavSpacer />
          <button
            ref={buttonRef}
            className="hamburger"
            type="button"
            aria-controls={listId}
            aria-expanded={String(shown)}
            aria-label="Toggle navigation"
            onClick={() => setShow(!shown)}
          >
            {"☰"}
          </button>
        </>
      )}
    </Tag>
  );
}

export function MueHeaderNav({
  brand,
  brandHref = "#",
  links = [],
  actions,
  search,
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  scrolled,
  className,
  children,
  ...rest
}) {
  const auto = useId();
  const listId = `header-links-${auto}`;
  const { shown, setShow, buttonRef } = useDrawer({ open, defaultOpen, onOpenChange });
  const isScrolled = useScrolled(scrolled);

  return (
    <header className={cx("site-header", isScrolled && "is-scrolled", className)} role="banner" {...rest}>
      <MueNavBrand href={brandHref}>{brand}</MueNavBrand>
      <ul className={cx("nav-links", shown && "is-open")} id={listId}>
        {links.map((item, index) => (
          <MueNavLink
            key={item.key ?? `${index}-${item.label}`}
            href={item.href}
            current={item.current}
            onSelect={(event) => {
              setShow(false);
              onSelect?.(item, event);
            }}
          >
            {item.label}
          </MueNavLink>
        ))}
      </ul>
      {search ? <MueNavSearch {...search} /> : null}
      <MueNavSpacer />
      {actions ? <div className="row">{actions}</div> : null}
      {children}
      <button
        ref={buttonRef}
        className="hamburger"
        type="button"
        data-menu-toggle={listId}
        aria-controls={listId}
        aria-expanded={String(shown)}
        aria-label="Toggle navigation"
        onClick={() => setShow(!shown)}
      >
        {"☰"}
      </button>
    </header>
  );
}

export default MueHeaderNav;
