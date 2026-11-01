/* BEGIN MUE:META
  COMPONENT: File upload (dropzone)
  ID: react-frm-dropzone
  GROUP: Frameworks > React > Components
  CATEGORY: forms
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#dropzone + #fields + #utilities (.sr-only) + design-tokens/engine.css (all linked by the host page); no other module in this package
  SHEET: styles/components.css#dropzone — .dropzone (position:relative target), input.dropzone-input (stretched over the box at zero opacity), .dropzone.is-dragging, .dropzone-icon, .dropzone-title, .dropzone-link, .dropzone-hint, .dropzone-list, .file-row, .file-icon, .file-name, .file-size, .file-remove; #fields for the label, #utilities for .sr-only
  PORTS: components/forms/file-upload.html (Project-exports run with its three .file-row entries, the Drag-over run, the single-file run, and the "Wiring it up" script block: dragover / dragleave / drop / change)
  PROPS: MueDropzone — id, label (the .sr-only name the input is tied to with htmlFor — never the decoration text inside the box), name, multiple, accept, disabled, title (node, defaults to the preview's "Drop files here or browse files"), hint, icon (node; the preview swaps a different glyph per use), files (array of File or {name,size} for a static demo row), onFilesChange(files: FileList) from browse and drop, onRemove(file, index) from a list row, listLabel, max, className, wrapClassName, rest spread on the <input>. MueFileRow — name, size (bytes or a preformatted string), icon, onRemove, removeLabel. MueFileList — files, onRemove, label. formatSize(bytes) is exported for hosts that need the same wording
  STATES: idle, keyboard/pointer focus (.dropzone:focus-within ring from the sheet), .is-dragging (added on dragover, cleared on dragleave and drop — the one state the preview says CSS cannot reach on its own), populated (the .dropzone-list appears once there is a file)
  VARIANTS: multi-file with accept list, single image, drag-over demo, and the three static rows the preview lists
  A11Y: the control is a real <input type="file"> so Tab, Enter and the OS picker work with no script; it is named by a .sr-only <label for>, not by the visible .dropzone-title; the remove button carries a .sr-only name that includes the file it removes ("Remove brief.pdf") so the row is not ambiguous; size and count are text, not colour
  KEYBOARD: Tab reaches the input (it covers the whole box, so the focus ring lands on the target via :focus-within) and Enter/Space opens the picker; each remove button is a native <button> so Enter/Space deletes that row; nothing else is intercepted
  EVENTS: onFilesChange(FileList) on browse-change and on drop (a drop assigns input.files exactly as the preview's script does, then reports it); onRemove(file, index) per row; the native input's onChange/onDrag/onDrop are still overridable through rest
  RESPONSIVE: .file-name truncates with an ellipsis while .file-size and the remove button are flex:none, so the row survives 390px; the box is grid/centre so it just gets taller; rendered at 1280px and 390px in the gallery
  VERIFIED: node build.mjs rebuilt preview/preview.js with this module; the built gallery was then opened in headless Chrome (puppeteer-core) 2026-11-01, the console and network logs captured, and the list was driven — uploading a file with page.uploadFile() added a .file-row and cleared again after clicking its .file-remove, and dispatching a dragover on the box toggled .is-dragging; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useId, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/* 18 KB / 2.4 MB — the two shapes the preview's rows use. */
export function formatSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ExtensionIcon({ name = "" }) {
  const ext = name.toLowerCase().split(".").pop();
  if (/(png|jpe?g|gif|webp|svg|avif)/.test(ext)) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 15l5-4 4 3 3-2 6 5" />
      </svg>
    );
  }
  if (/(csv|txt|tsv|json|log)/.test(ext)) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M14 3v5h5" />
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function fileName(file) {
  if (typeof file === "string") return file;
  return file?.name ?? "";
}

function fileSize(file) {
  if (typeof file === "string") return "";
  if (typeof file?.size === "string") return file.size;
  return formatSize(file?.size);
}

export function MueFileRow({
  name,
  size,
  icon,
  onRemove,
  removeLabel,
  className,
  ...rest
}) {
  const label = removeLabel ?? `Remove ${name}`;
  return (
    <li className={cx("file-row", className)} {...rest}>
      <span className="file-icon" aria-hidden="true">
        {icon ?? <ExtensionIcon name={name} />}
      </span>
      <span className="file-name">{name}</span>
      {size ? <span className="file-size">{size}</span> : null}
      {onRemove ? (
        <button className="file-remove" type="button" onClick={onRemove}>
          <span className="sr-only">{label}</span>
          <RemoveIcon />
        </button>
      ) : null}
    </li>
  );
}

export function MueFileList({
  files = [],
  onRemove,
  label = "Selected files",
  className,
  ...rest
}) {
  if (!files.length) return null;
  return (
    <ul className={cx("dropzone-list", className)} aria-label={label} {...rest}>
      {files.map((file, i) => (
        <MueFileRow
          key={`${fileName(file)}-${i}`}
          name={fileName(file)}
          size={fileSize(file)}
          onRemove={
            onRemove
              ? () => onRemove(file, i)
              : undefined
          }
        />
      ))}
    </ul>
  );
}

export function MueDropzone({
  id,
  label = "Attach files",
  name,
  multiple = false,
  accept,
  disabled = false,
  title = (
    <>
      Drop files here or <span className="dropzone-link">browse files</span>
    </>
  ),
  hint,
  icon,
  files,
  onFilesChange,
  onRemove,
  listLabel,
  max,
  className,
  wrapClassName,
  ...rest
}) {
  const auto = useId();
  const inputId = id ?? `dropzone-${auto}`;
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const report = (list) => onFilesChange?.(list);

  return (
    <div className={cx("field", wrapClassName)}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <div
        className={cx("dropzone", dragging && "is-dragging", className)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!dragging) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer?.files;
          if (!dropped?.length) return;
          /* The preview's own line: hand the dropped files to the native input so
             the control stays the single source of truth, then report them. */
          if (inputRef.current) {
            try {
              inputRef.current.files = dropped;
            } catch {
              /* Some engines reject the assignment; the drop still reports. */
            }
          }
          report(dropped);
        }}
      >
        <input
          ref={inputRef}
          className="dropzone-input"
          id={inputId}
          name={name}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          onChange={(event) => report(event.target.files)}
          {...rest}
        />
        <span className="dropzone-icon" aria-hidden="true">
          {icon ?? <UploadIcon />}
        </span>
        <span className="dropzone-title">{title}</span>
        {hint ? (
          <span className="dropzone-hint" id={`${inputId}-hint`}>
            {hint}
          </span>
        ) : null}
      </div>
      {files ? <MueFileList files={files} onRemove={onRemove} label={listLabel} /> : null}
      {max && files?.length ? (
        <div className="spread">
          <span className="badge badge-success">
            {`${files.length} of ${max} ${files.length === 1 ? "file" : "files"}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default MueDropzone;
