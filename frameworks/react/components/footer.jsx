/* BEGIN MUE:META
  COMPONENT: Footer
  ID: react-ui-footers
  GROUP: Frameworks > React > Components
  CATEGORY: footers
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#footers (with #utilities for .sr-only) + design-tokens/engine.css (both linked by the host page); no other module in this package
  SHEET: styles/components.css#footers — .footer/.site-footer (auto-fit column grid), .footer-heading, .footer-links, .footer-brand, .footer-desc, .footer-bottom, .footer-social
  PORTS: components/footers/footers.html (Default: brand block, three link columns, bottom bar with social)
  PROPS: MueFooter — brand, desc, columns (array of {title, links:[{label, href, onClick?}]}), bottom (node or string), social (array of {label, href, icon?}), as ("footer" | "div", default footer), className, plus any other prop spread on the landmark. Slots: MueFooterColumn (title, links), MueFooterLinks (links), MueFooterBrand (as, default div like the preview), MueFooterDesc, MueFooterBottom, MueFooterSocial
  STATES: hover and focus recolour on every link are the sheet's rules; there is no component state to carry
  VARIANTS: full marketing footer (brand + columns + bottom bar) or a bare footer of link columns; a social entry with an inline SVG keeps its aria-label, and one without falls back to the two-letter label text the preview uses
  A11Y: a semantic <footer> landmark by default (role="contentinfo" comes with it); each column's links are a <ul class="footer-links"> under a heading that is a real <h2 class="footer-heading"> scoped by aria-labelledby on the list; social cells are links whose accessible name is the network, never the glyph; the copyright line is text
  KEYBOARD: every link is a native anchor — Tab reaches them in reading order, Enter follows, focus-visible rings come from the sheet; nothing is intercepted
  EVENTS: none invented; onClick can be passed per link through the item object
  RESPONSIVE: the grid is auto-fit at a ~11rem minimum, so four columns drop to one without a breakpoint; the bottom bar spans the grid and wraps its two halves; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module and it was rendered in headless Chrome (puppeteer-core) 2026-11-03 — the landmark, all three columns, the bottom bar and the three social links are in the DOM at both viewports; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueFooterBrand({ as = "div", className, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={cx("footer-brand", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function MueFooterDesc({ className, children, ...rest }) {
  return (
    <p className={cx("footer-desc", className)} {...rest}>
      {children}
    </p>
  );
}

export function MueFooterLinks({ links = [], className, ...rest }) {
  return (
    <ul className={cx("footer-links", className)} {...rest}>
      {links.map((link, index) => (
        <li key={`${index}-${link.label}`}>
          <a href={link.href ?? "#"} onClick={link.onClick}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MueFooterColumn({ title, links = [], headingId, className, ...rest }) {
  const id = headingId ?? `footer-col-${title}`.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className={className} {...rest}>
      <h2 className="footer-heading" id={id}>
        {title}
      </h2>
      <MueFooterLinks links={links} aria-labelledby={id} />
    </div>
  );
}

export function MueFooterBottom({ className, children, ...rest }) {
  return (
    <div className={cx("footer-bottom", className)} {...rest}>
      {children}
    </div>
  );
}

export function MueFooterSocial({ items = [], className, ...rest }) {
  return (
    <div className={cx("footer-social", className)} {...rest}>
      {items.map((item, index) => (
        <a
          key={`${index}-${item.label}`}
          href={item.href ?? "#"}
          aria-label={item.label}
          onClick={item.onClick}
        >
          {item.icon ?? item.label}
        </a>
      ))}
    </div>
  );
}

export function MueFooter({
  as = "footer",
  brand,
  desc,
  columns = [],
  bottom,
  social = [],
  className,
  children,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag className={cx("footer", className)} {...rest}>
      {brand || desc ? (
        <div>
          {brand ? <MueFooterBrand>{brand}</MueFooterBrand> : null}
          {desc ? <MueFooterDesc>{desc}</MueFooterDesc> : null}
        </div>
      ) : null}
      {columns.map((column) => (
        <MueFooterColumn key={column.title} title={column.title} links={column.links} />
      ))}
      {children}
      {bottom || social.length ? (
        <MueFooterBottom>
          {bottom ? <span>{bottom}</span> : null}
          {social.length ? <MueFooterSocial items={social} /> : null}
        </MueFooterBottom>
      ) : null}
    </Tag>
  );
}

export default MueFooter;
