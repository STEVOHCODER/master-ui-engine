/* BEGIN MUE:META
  COMPONENT: Table
  ID: react-ui-table
  GROUP: Frameworks > React > Components
  CATEGORY: tables
  FRAMEWORK: react 19 (JSX, automatic runtime)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#tables (with #badges and #buttons for cell content) + design-tokens/engine.css (linked by the host page)
  SHEET: styles/components.css#tables — .table-wrap .table .table-striped .table-compact, the sticky thead th, tbody tr:hover and the [data-sort] caret
  PORTS: components/tables/tables.html (default striped + sortable, and the compact row-actions table)
  VARIANTS: striped, compact, caption, ariaLabel, sortable per column, custom cell renderer
  A11Y: a real <table> with <caption> or aria-label, scope="col" on every header and the same tabindex="0" + title + aria-sort the preview publishes when a column becomes sortable; cell content is passed through, so a status badge or a row-action button in a cell is the sheet's own .badge / .btn-link markup, not a table-specific fork; .card .table-wrap already drops the double frame when a table sits inside a card
  KEYBOARD: sorting answers Enter and Space as well as click, exactly like the preview's page-local script; horizontal scrolling of a narrow table is the .table-wrap overflow, reachable with the caret keys on the wrapper
  VERIFIED: rendered from preview/preview.js and driven by headless Chrome (puppeteer-core) 2026-11-01 — a header click and an Enter keypress both reorder the rows and republish aria-sort; no new CSS is asserted
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const cellText = (value) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

/* The preview's compare: read the cell as text, try the numbers inside it, and
   fall back to localeCompare — so "2h ago" and "$199" sort the way a reader expects. */
function compare(a, b, dir) {
  const nA = parseFloat(a.replace(/[^0-9.-]/g, ""));
  const nB = parseFloat(b.replace(/[^0-9.-]/g, ""));
  const diff = Number.isFinite(nA) && Number.isFinite(nB) ? nA - nB : a.localeCompare(b);
  return dir === "asc" ? diff : -diff;
}

export function MueTable({
  columns,
  rows,
  caption,
  ariaLabel,
  striped = false,
  compact = false,
  onSortedChange,
  className,
  ...rest
}) {
  const [sorted, setSorted] = useState(null);

  const sort = (column) => {
    const dir = sorted?.key === column.key && sorted.dir === "asc" ? "desc" : "asc";
    setSorted({ key: column.key, dir });
    onSortedChange?.({ key: column.key, dir });
  };

  const value = (row, column) =>
    cellText(column.getSortValue ? column.getSortValue(row) : row[column.key]);

  const body = [...rows];
  if (sorted) {
    const column = columns.find((item) => item.key === sorted.key);
    if (column) body.sort((a, b) => compare(value(a, column), value(b, column), sorted.dir));
  }

  return (
    <div className="table-wrap">
      <table
        className={cx("table", striped && "table-striped", compact && "table-compact", className)}
        aria-label={caption ? undefined : ariaLabel}
        {...rest}
      >
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sorted?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sortable ? (active ? (sorted.dir === "asc" ? "ascending" : "descending") : "none") : undefined
                  }
                  data-sort={column.sortable ? (active ? sorted.dir : "") : undefined}
                  tabIndex={column.sortable ? 0 : undefined}
                  title={column.sortable ? `Sort by ${column.header}` : undefined}
                  onClick={column.sortable ? () => sort(column) : undefined}
                  onKeyDown={
                    column.sortable
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            sort(column);
                          }
                        }
                      : undefined
                  }
                >
                  {column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {body.map((row, index) => (
            <tr key={row.key ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MueTable;
