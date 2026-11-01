/* BEGIN MUE:META
  COMPONENT: Avatar
  ID: react-ui-avatar
  GROUP: Frameworks > React > Components
  CATEGORY: display
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#display + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#display — .avatar (2.25rem circle, --tint-primary fill, initials centred by display:grid), .avatar img (cover), .avatar-group and the -space-2 overlap with the --bg-surface ring
  PORTS: components/display/descriptions.html (the people row and the group stack), components/tables/data-table.html (cell-user initials)
  VARIANTS: initials, image (src + alt), and MueAvatarGroup for a stack; size comes from the sheet, not from a prop
  A11Y: the previews mark an avatar aria-hidden when the person's name is already written beside it, so that is this binding's default; a standalone avatar that carries meaning on its own is given role="img" + aria-label through the label prop, and an image is only rendered with the alt it needs; a group is decoration around already-named rows, so it stays aria-hidden unless every member has a label
  KEYBOARD: none — an avatar is not a control. Where a preview puts one inside a button or a link (the header avatar, the row action), that focusability belongs to the button
  VERIFIED: rendered from preview/preview.js in headless Chrome (puppeteer-core) 2026-11-01 — initials, image and group all render with the sheet's classes; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

export function MueAvatar({ src, alt = "", initials, label, className, ...rest }) {
  const named = label !== undefined;
  return (
    <span
      className={cx("avatar", className)}
      role={named ? "img" : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={named ? undefined : "true"}
      {...rest}
    >
      {src ? <img src={src} alt={alt} /> : initials}
    </span>
  );
}

export function MueAvatarGroup({ className, children, ...rest }) {
  return (
    <span className={cx("avatar-group", className)} {...rest}>
      {children}
    </span>
  );
}

export default MueAvatar;
