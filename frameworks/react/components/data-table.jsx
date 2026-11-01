/* BEGIN MUE:META
  COMPONENT: Data Table
  ID: react-ui-datatable
  GROUP: Frameworks > React > Components
  CATEGORY: tables
  FRAMEWORK: react 19 (JSX, automatic runtime, hooks only)
  DESIGN_SYSTEM: MASTER-UI-ENGINE tokens
  DEPENDENCIES: styles/components.css#datatable (+ #tables, #dropdown, #descriptions, #feedback, #badges, #choice, #fields, #navigation, #utilities) + react; this file ships no CSS of its own
  SHEET: styles/components.css#datatable — table-toolbar, table-search, table-selection(-count), table-wrap, table-scroll.is-scrolled, table.datatable(.table-compact), cell-toggle, cell-check, sort-btn, th-filter.is-filtered, dropdown/menu-filter*, col-num, table-detail(-inner), table-empty, empty, table-foot(-count), select-wrap, pagination; #choice — checkbox/box + switch/track; #utilities — sr-only
  PORTS: components/tables/data-table.html (the page script becomes component state)
  VARIANTS: selectable + expandable + filterable + sortable columns, compact density, loading (skeleton rows) and empty states
  PROPS: columns, rows, caption, ariaLabel, selectable, expandable, loading, emptyTitle, emptyDesc, pageSizes, selectKey, cells, detail
  A11Y: caption/aria-label; th scope="col" publishes aria-sort and the sort button carries data-sort; the header checkbox is indeterminate when a page is partly picked; each row checkbox is named by its own row (Select <first column> or <selectKey>) so no two share a name; the filter is a labelled group with Apply/Clear; the caret and the row share aria-expanded; search has an sr-only label
  KEYBOARD: sort buttons cycle on Enter/Space (native); the filter closes on Escape and returns focus to its trigger, and closes on an outside click; the table header picks up its rule on scroll; every control is a native input or button
  VERIFIED: node build.mjs then headless Chrome (puppeteer-core) 2026-11-01 in the preview gallery — search narrows the rows, a sort click publishes aria-sort="ascending" and reorders, the filter group applies and clears, select-all marks the page and the next page button moves aria-current
  LICENSE: MIT
  ATTRIBUTION: MASTER-UI-ENGINE contributors
END MUE:META */

import { useEffect, useId, useRef, useState } from "react";

function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

const Tick = () => (
  <span className="box" aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" />
    </svg>
  </span>
);

const keyOf = (row, i) => row.id ?? i;

export function MueDataTable({
  /** [{ key, label, sortable?, numeric?, mono?, filterOptions?, render? }] */
  columns,
  /** row objects; each may carry `id`, `search` (haystack) and `detail` [{label, value}]. */
  rows = [],
  caption = null,
  ariaLabel = null,
  selectable = false,
  expandable = false,
  loading = false,
  emptyTitle = "No results",
  emptyDesc = "Try widening your search or clearing the filters.",
  pageSizes = [5, 10, 20],
  /** column key read aloud as a row's name; defaults to the first column. */
  selectKey = "",
  /** { [columnKey]: (row, value) => node } — the React form of the scoped cell slot. */
  cells = {},
  /** (row) => node — the React form of the detail slot; falls back to row.detail. */
  detail,
  ...rest
}) {
  const uid = useId();
  const searchId = `${uid}-q`;
  const filterId = `${uid}-filter`;
  const sizeId = `${uid}-size`;

  const [q, setQ] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [sort, setSort] = useState({ key: null, dir: "none" });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSizes[0]);
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());

  /* A row checkbox has no text of its own, and every one of them named "Select"
     tells a screen reader nothing, so the name carries the row's identity. */
  const rowName = (row, i) => {
    const key = selectKey || columns[0]?.key;
    const value = key ? row[key] : undefined;
    return value === undefined || value === null || value === "" ? `row ${i + 1}` : String(value);
  };

  const needle = q.trim().toLowerCase();
  const filtered = rows.filter((row) => {
    const hay = String(row.search ?? JSON.stringify(row)).toLowerCase();
    return (!needle || hay.indexOf(needle) > -1) && (!statuses.length || statuses.includes(row.status));
  });

  const sorted = (() => {
    const { key, dir } = sort;
    if (!key || (dir !== "asc" && dir !== "desc")) return filtered;
    const sign = dir === "asc" ? 1 : -1;
    const col = columns.find((c) => c.key === key);
    return [...filtered].sort((a, b) =>
      col?.numeric ? (parseFloat(a[key]) - parseFloat(b[key])) * sign : String(a[key]).localeCompare(String(b[key])) * sign
    );
  })();

  const pageCount = Math.max(1, Math.ceil(sorted.length / size));
  const start = (page - 1) * size;
  const pageRows = sorted.slice(start, start + size);

  /* Narrowing the set or the page size can strand the current page. */
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const footCount = sorted.length
    ? `Showing ${start + 1}-${start + pageRows.length} of ${sorted.length}`
    : `Showing 0 of ${rows.length}`;

  const rowKey = (row) => keyOf(row, sorted.indexOf(row));

  const toggleSelect = (row) => {
    const k = rowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const pageKeys = pageRows.map(rowKey);
  const allChecked = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const ticked = pageKeys.filter((k) => selected.has(k)).length;
  const allIndeterminate = ticked > 0 && ticked < pageKeys.length;

  const allRef = useRef(null);
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = allIndeterminate;
  }, [allIndeterminate, pageKeys.length]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const sortBy = (col) => {
    if (!col.sortable) return;
    setSort((prev) => ({
      key: col.key,
      dir: prev.key === col.key && prev.dir === "asc" ? "desc" : prev.key === col.key && prev.dir === "desc" ? "none" : "asc",
    }));
    setPage(1);
  };
  const ariaSort = (col) =>
    sort.key !== col.key ? "none" : sort.dir === "asc" ? "ascending" : sort.dir === "desc" ? "descending" : "none";

  const toggleExpand = (row) => {
    const k = rowKey(row);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const isExpanded = (row) => expanded.has(rowKey(row));

  const [filterOpen, setFilterOpen] = useState(false);
  const [pending, setPending] = useState(() => new Set());
  const filterBtn = useRef(null);
  const filterMenu = useRef(null);

  const openFilter = (open) => {
    setFilterOpen(open);
    if (open) {
      setPending(new Set(statuses));
      queueMicrotask(() => filterMenu.current?.querySelector("input")?.focus());
    }
  };
  const closeFilter = () => {
    setFilterOpen(false);
    filterBtn.current?.focus();
  };
  const applyFilter = () => {
    setStatuses([...pending]);
    setFilterOpen(false);
    setPage(1);
    filterBtn.current?.focus();
  };
  const clearFilter = () => {
    setPending(new Set());
    setStatuses([]);
  };

  useEffect(() => {
    if (!filterOpen) return undefined;
    const onDocClick = (event) => {
      if (!filterMenu.current?.contains(event.target) && !filterBtn.current?.contains(event.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [filterOpen]);

  /* The sticky head rule only paints once the body has actually scrolled under it. */
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);
  const onWrapScroll = (event) => {
    if (ticking.current) return;
    ticking.current = true;
    const top = event.currentTarget.scrollTop;
    window.requestAnimationFrame(() => {
      setScrolled(top > 2);
      ticking.current = false;
    });
  };

  const filterColumn = columns.find((c) => c.filterOptions);
  const cellColspan = columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0);

  return (
    <div {...rest}>
      <div className="table-toolbar">
        <div className="field table-search">
          <label className="sr-only" htmlFor={searchId}>
            Search rows
          </label>
          <input
            id={searchId}
            className="input"
            type="search"
            placeholder="Search"
            autoComplete="off"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="row">
          <label className="switch">
            <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
            <span className="track"></span>
            <span className="switch-label">Compact</span>
          </label>
        </div>
      </div>

      <div className="table-selection" hidden={selected.size === 0}>
        <span className="table-selection-count" aria-live="polite">
          {selected.size} selected
        </span>
        <button className="btn-ghost btn-sm" type="button" onClick={() => setSelected(new Set())}>
          Clear
        </button>
      </div>

      <div className={cx("table-wrap", "table-scroll", scrolled && "is-scrolled")} onScroll={onWrapScroll}>
        <table className={cx("table", "datatable", compact && "table-compact")} aria-label={ariaLabel || undefined}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {expandable ? (
                <th scope="col" className="cell-toggle">
                  <span className="sr-only">Expand row</span>
                </th>
              ) : null}
              {selectable ? (
                <th scope="col" className="cell-check">
                  <label className="checkbox">
                    <input ref={allRef} type="checkbox" checked={allChecked} onChange={toggleAll} />
                    <Tick />
                    <span className="sr-only">Select all on this page</span>
                  </label>
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cx(col.numeric && "col-num", col.filterOptions && "cell-filter")}
                  aria-sort={col.sortable ? ariaSort(col) : undefined}
                >
                  {col.sortable ? (
                    <button
                      className="sort-btn"
                      type="button"
                      data-sort={sort.key === col.key ? sort.dir : "none"}
                      onClick={() => sortBy(col)}
                    >
                      {col.label}
                    </button>
                  ) : col.filterOptions && col === filterColumn ? (
                    <div className={cx("dropdown", filterOpen && "is-open")}>
                      <button
                        ref={filterBtn}
                        className={cx("th-filter", statuses.length > 0 && "is-filtered")}
                        type="button"
                        aria-expanded={String(filterOpen)}
                        aria-controls={filterId}
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilter(!filterOpen);
                        }}
                      >
                        {col.label}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
                        </svg>
                      </button>
                      <div
                        ref={filterMenu}
                        id={filterId}
                        className="dropdown-menu menu-filter"
                        role="group"
                        aria-label={`Filter by ${col.label}`}
                        aria-hidden={String(!filterOpen)}
                        inert={filterOpen ? undefined : true}
                        onKeyDown={(e) => e.key === "Escape" && closeFilter()}
                      >
                        <p className="menu-filter-head">{col.label}</p>
                        {col.filterOptions.map((opt) => (
                          <label key={opt} className="checkbox menu-filter-option">
                            <input
                              type="checkbox"
                              value={opt}
                              checked={pending.has(opt)}
                              onChange={() =>
                                setPending((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(opt)) next.delete(opt);
                                  else next.add(opt);
                                  return next;
                                })
                              }
                            />
                            <Tick />
                            {opt}
                          </label>
                        ))}
                        <div className="menu-divider" role="separator"></div>
                        <div className="menu-filter-foot">
                          <button className="btn-ghost btn-sm" type="button" onClick={clearFilter}>
                            Clear
                          </button>
                          <button className="btn-primary btn-sm" type="button" onClick={applyFilter}>
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {!loading && pageRows.length ? (
            <tbody>
              {pageRows.map((row) => (
                <FragmentRow
                  key={rowKey(row)}
                  row={row}
                  columns={columns}
                  cells={cells}
                  detail={detail}
                  selectable={selectable}
                  expandable={expandable}
                  selected={selected.has(rowKey(row))}
                  expanded={isExpanded(row)}
                  rowName={rowName(row, sorted.indexOf(row))}
                  onToggleSelect={() => toggleSelect(row)}
                  onToggleExpand={() => toggleExpand(row)}
                  cellColspan={cellColspan}
                />
              ))}
            </tbody>
          ) : loading ? (
            <tbody>
              {Array.from({ length: size }, (_, n) => (
                <tr key={`ld${n}`}>
                  {expandable ? (
                    <td className="cell-toggle">
                      <span className="skeleton sk-cell" style={{ "--sk-w": "1.75rem" }}></span>
                    </td>
                  ) : null}
                  {selectable ? (
                    <td className="cell-check">
                      <span className="skeleton sk-cell" style={{ "--sk-w": "1.25rem" }}></span>
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td key={col.key} className={cx(col.numeric && "col-num")}>
                      <span className="skeleton sk-cell" style={{ "--sk-w": "8rem" }}></span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td className="table-empty" colSpan={cellColspan}>
                  <div className="empty">
                    <span className="empty-icon" aria-hidden="true">
                      <svg width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M20 20l-3.5-3.5" />
                      </svg>
                    </span>
                    <p className="empty-title">{emptyTitle}</p>
                    <p className="empty-desc">{emptyDesc}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      <div className="table-foot">
        <div className="row">
          <span className="table-foot-count">{footCount}</span>
          <label className="sr-only" htmlFor={sizeId}>
            Rows per page
          </label>
          <div className="select-wrap">
            <select
              className="input"
              id={sizeId}
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <nav className="pagination" aria-label="Pages">
          <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ←
          </button>
          {Array.from({ length: pageCount }, (_, n) => n + 1).map((p) => (
            <button key={p} type="button" aria-current={p === page ? "true" : undefined} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            →
          </button>
        </nav>
      </div>
    </div>
  );
}

function FragmentRow({
  row,
  columns,
  cells,
  detail,
  selectable,
  expandable,
  selected,
  expanded,
  rowName,
  onToggleSelect,
  onToggleExpand,
  cellColspan,
}) {
  return (
    <>
      <tr className={cx(selected && "is-selected")}>
        {expandable ? (
          <td className="cell-toggle">
            <button
              className="row-toggle"
              type="button"
              aria-expanded={String(expanded)}
              aria-label={`${expanded ? "Hide" : "Show"} details`}
              onClick={onToggleExpand}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </td>
        ) : null}
        {selectable ? (
          <td className="cell-check">
            <label className="checkbox">
              <input type="checkbox" aria-label={`Select ${rowName}`} checked={selected} onChange={onToggleSelect} />
              <Tick />
            </label>
          </td>
        ) : null}
        {columns.map((col) => (
          <td key={col.key} className={cx(col.numeric && "col-num", col.mono && "mono")}>
            {cells[col.key] ? cells[col.key](row, row[col.key]) : row[col.key]}
          </td>
        ))}
      </tr>
      {expandable ? (
        <tr hidden={!expanded}>
          <td className="table-detail" colSpan={cellColspan}>
            <div className="table-detail-inner">
              {detail ? (
                detail(row)
              ) : row.detail ? (
                <dl className="descriptions" data-cols="3">
                  {row.detail.map((d, di) => (
                    <div key={di} className="descriptions-item">
                      <dt className="descriptions-label">{d.label}</dt>
                      <dd className="descriptions-value">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export default MueDataTable;
