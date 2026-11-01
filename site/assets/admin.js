/* MASTER-UI-ENGINE owner console.
   Reads /api/admin/session, /api/stats and /api/admin/data — all of which
   require the signed session cookie. Values from the API are always written with
   textContent, so a stored path or email can never be parsed as markup. */
(function () {
  "use strict";

  var REASONS = {
    not_configured: "Not connected: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing in the Vercel project.",
    database_unavailable: "Unreachable: the read failed. Supabase may be down, or supabase/schema.sql has not been run.",
    authentication_required: "Session expired. Sign in again."
  };
  var EVENT_LABELS = {
    page_view: "Page views",
    library_search: "Library searches",
    component_preview_open: "Component previews",
    template_preview_open: "Template previews",
    copy_code: "Code copies",
    github_click: "GitHub clicks",
    documentation_click: "Documentation clicks",
    install_instruction_open: "Install instructions",
    theme_switch: "Theme switches",
    newsletter_signup: "Waitlist clicks"
  };
  var RANK_IDS = ["rankPaths", "rankCountries", "rankReferrers", "rankEvents", "rankTargets"];
  var PAGE_SIZE = 25;

  var days = 14;
  var lastStats = null;
  var kind = "views";
  var offset = 0;
  var rows = [];

  var el = {
    status: document.getElementById("statusPill"),
    window: document.getElementById("windowPill"),
    updated: document.getElementById("updatedPill"),
    cap: document.getElementById("capWarning"),
    tiles: document.getElementById("tiles"),
    chart: document.getElementById("chart"),
    chartSummary: document.getElementById("chartSummary"),
    chartNote: document.getElementById("chartNote"),
    toast: document.getElementById("toast"),
    head: document.getElementById("recordHead"),
    body: document.getElementById("recordBody"),
    pageLabel: document.getElementById("pageLabel"),
    prev: document.getElementById("prevPage"),
    next: document.getElementById("nextPage")
  };

  /* ---- small helpers ---- */
  function number(value) {
    return typeof value === "number" && isFinite(value) ? value.toLocaleString("en-US") : "unavailable";
  }

  function byKey(key, value) {
    var nodes = document.querySelectorAll('[data-live="' + key + '"]');
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = value;
  }

  function status(state, message) {
    el.status.setAttribute("data-state", state);
    el.status.textContent = message;
  }

  function showPill(pill, text) {
    if (!text) { pill.hidden = true; pill.textContent = ""; return; }
    pill.hidden = false;
    pill.textContent = text;
  }

  var toastTimer = null;

  function toast(message, tone) {
    el.toast.textContent = message;
    el.toast.setAttribute("data-tone", tone || "ok");
    el.toast.setAttribute("data-show", "true");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.removeAttribute("data-show"); }, 4200);
  }

  function request(url, options) {
    var settings = options || {};
    settings.credentials = "same-origin";
    settings.cache = "no-store";
    return fetch(url, settings).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { status: response.status, data: data || {} };
      });
    });
  }

  function toLogin() {
    status("error", "Session expired. Sign in again.");
    window.location.replace("/admin/login");
  }

  /* ---- deltas ---- */
  function renderDelta(name, delta) {
    var node = document.querySelector('[data-delta="' + name + '"]');
    if (!node) return;
    if (typeof delta !== "number" || !isFinite(delta)) {
      node.removeAttribute("data-dir");
      node.textContent = "no comparison";
      return;
    }
    if (delta === 0) {
      node.setAttribute("data-dir", "flat");
      node.textContent = "0% vs previous";
      return;
    }
    node.setAttribute("data-dir", delta > 0 ? "up" : "down");
    node.textContent = (delta > 0 ? "+" : "") + Math.round(delta * 10) / 10 + "% vs previous";
  }

  /* ---- ranked lists ---- */
  function fillList(id, list, labelOf, countOf) {
    var host = document.getElementById(id);
    if (!host) return;
    host.innerHTML = "";
    if (!list.length) {
      var empty = document.createElement("li");
      empty.className = "is-empty";
      var label = document.createElement("span");
      label.className = "rank-label";
      label.textContent = "Nothing recorded in this window yet.";
      var track = document.createElement("span");
      track.className = "rank-track";
      track.setAttribute("aria-hidden", "true");
      track.appendChild(document.createElement("i"));
      var zero = document.createElement("span");
      zero.className = "rank-num";
      zero.textContent = "0";
      host.appendChild(empty);
      empty.appendChild(label); empty.appendChild(track); empty.appendChild(zero);
      return;
    }
    var top = countOf(list[0]);
    for (var i = 0; i < list.length; i += 1) {
      var count = countOf(list[i]);
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.className = "rank-label";
      name.textContent = labelOf(list[i]);
      name.title = name.textContent;
      var bar = document.createElement("span");
      bar.className = "rank-track";
      bar.setAttribute("aria-hidden", "true");
      var fill = document.createElement("i");
      fill.style.setProperty("--w", (top > 0 ? Math.max(3, Math.round((count / top) * 100)) : 0) + "%");
      bar.appendChild(fill);
      var value = document.createElement("span");
      value.className = "rank-num";
      value.textContent = number(count);
      li.appendChild(name); li.appendChild(bar); li.appendChild(value);
      host.appendChild(li);
    }
  }

  function entry(label, count) { return { label: label, count: count }; }

  function clearLists() {
    for (var i = 0; i < RANK_IDS.length; i += 1) fillList(RANK_IDS[i], [], identity, zero);
  }

  function identity() { return ""; }
  function zero() { return 0; }

  /* ---- chart ---- */
  function chartMessage(message) {
    el.chart.innerHTML = "";
    var note = document.createElement("p");
    note.className = "note";
    note.textContent = message;
    el.chart.appendChild(note);
    el.chart.setAttribute("aria-label", "Bar chart of page views per day: " + message);
    el.chartSummary.textContent = message;
  }

  function drawChart(series, previous, windowDays) {
    if (!series || !series.length) {
      el.chartNote.hidden = true;
      chartMessage("No days to draw in this window.");
      return;
    }
    var width = 620, height = 190, pad = 18, ceiling = 14, baseline = height - 24;
    var max = 0, total = 0, i;
    for (i = 0; i < series.length; i += 1) {
      max = Math.max(max, series[i].views || 0);
      total += series[i].views || 0;
    }
    var priorMax = 0;
    var hasPrevious = Array.isArray(previous) && previous.length === series.length;
    if (hasPrevious) {
      for (i = 0; i < previous.length; i += 1) priorMax = Math.max(priorMax, previous[i].views || 0);
      max = Math.max(max, priorMax);
    }
    var slot = (width - pad * 2) / series.length;
    var barW = Math.max(3, Math.min(28, slot - 4));
    var scale = max > 0 ? baseline - ceiling - 10 : 0;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + " " + height +
      '" role="presentation" focusable="false">';
    svg += '<line class="c-grid" x1="' + pad + '" y1="' + baseline + '" x2="' + (width - pad) + '" y2="' + baseline + '"></line>';
    for (i = 0; i < series.length; i += 1) {
      var views = series[i].views || 0;
      var h = views > 0 && scale > 0 ? Math.max(2, Math.round((views / max) * scale)) : 0;
      var x = pad + i * slot + (slot - barW) / 2;
      svg += '<rect class="c-bar" x="' + x.toFixed(1) + '" y="' + (baseline - h) + '" width="' + barW.toFixed(1) +
        '" height="' + h + '" rx="1"><title>' + escapeText(series[i].day) + ": " + views + " views, " +
        (series[i].visitors || 0) + " visitors</title></rect>";
      if (i === 0 || i === series.length - 1 || (series.length <= 16 && i % 2 === 0)) {
        svg += '<text class="c-axis" x="' + (x + barW / 2).toFixed(1) + '" y="' + (height - 7) +
          '" text-anchor="middle">' + escapeText(String(series[i].day || "").slice(5).replace("-", "/")) + "</text>";
      }
    }
    if (hasPrevious) {
      var points = [];
      for (i = 0; i < previous.length; i += 1) {
        var pv = previous[i].views || 0;
        points.push((pad + i * slot + slot / 2).toFixed(1) + "," + (baseline - (scale > 0 ? Math.round((pv / max) * scale) : 0)).toFixed(1));
      }
      svg += '<polyline class="c-line" points="' + points.join(" ") + '"></polyline>';
    }
    svg += '<text class="c-axis" x="' + pad + '" y="11">' + escapeText(number(max)) + " view" + (max === 1 ? "" : "s") + " at peak</text>";

    /* The only interpolated values are numbers and ISO dates produced by the
       server; escapeText keeps even those safe if that ever changes. */
    var holder = document.createElement("div");
    holder.innerHTML = svg;
    el.chart.innerHTML = "";
    if (holder.firstChild) el.chart.appendChild(holder.firstChild);

    el.chartNote.hidden = !hasPrevious;
    el.chart.setAttribute("aria-label", "Bar chart of page views for each of the last " + windowDays +
      " days. Peak " + max + " views, window total " + total + " views." +
      (hasPrevious ? " Dashed line is the previous window of the same length." : ""));
    var summary = [];
    for (i = 0; i < series.length; i += 1) {
      summary.push(series[i].day + ": " + (series[i].views || 0) + " views, " + (series[i].visitors || 0) + " visitors");
    }
    el.chartSummary.textContent = summary.join(". ") + ".";
  }

  function escapeText(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---- stats ---- */
  function renderUnavailable(data) {
    var reason = (data && (data.error || data.reason)) || "";
    el.tiles.hidden = false;
    var keys = ["views", "visitors", "countries", "events", "subscribers"];
    for (var i = 0; i < keys.length; i += 1) {
      byKey(keys[i], "unavailable");
      renderDelta(keys[i], null);
    }
    byKey("views-all", "all time: —");
    byKey("visitors-split", "anonymous device ids");
    byKey("countries-note", "from the Vercel edge header");
    byKey("subscribers-all", "on the list: —");
    showPill(el.window, "");
    showPill(el.updated, "");
    el.cap.hidden = true;
    clearLists();
    chartMessage("Chart unavailable — the numbers could not be read.");
    status("error", REASONS[reason] || "Unavailable: the stats endpoint returned no data.");
  }

  function render(data) {
    var totals = data.totals || {};
    var all = data.all_time || {};
    var win = data.window || {};
    var cover = data.coverage || {};
    var comparison = data.comparison || null;
    var deltas = (comparison && comparison.deltas) || {};

    lastStats = data;
    el.tiles.hidden = false;
    byKey("views", number(totals.views));
    byKey("visitors", number(totals.visitors));
    byKey("countries", number(totals.countries));
    byKey("events", number(totals.events));
    byKey("subscribers", number(totals.subscribers));
    byKey("views-all", "all time: " + number(all.views) + " · " + number(all.visitors) + " visitors");
    byKey("visitors-split", number(totals.returning_visitors) + " returning · " + number(totals.new_visitors) + " new");
    byKey("countries-note", number(all.countries) + " all time" + (cover.countries_exact ? " · window exact" : " · window from the scan"));
    byKey("subscribers-all", "on the list: " + number(all.subscribers));

    renderDelta("views", deltas.views);
    renderDelta("visitors", deltas.visitors);
    renderDelta("countries", deltas.countries);
    renderDelta("events", deltas.events);
    renderDelta("subscribers", deltas.subscribers);

    showPill(el.window, (win.start_day || "") + " → " + (win.end_day || "") +
      (comparison ? "  ·  vs " + (comparison.start_day || "") + " → " + (comparison.end_day || "") : ""));
    showPill(el.updated, "updated " + new Date().toLocaleTimeString("en-GB"));

    var truncated = !!cover.truncated;
    el.cap.hidden = !truncated;
    if (truncated) status("warn", "Live, but this window was capped at " + number(cover.scan_limit) + " rows per table");
    else status("live", "Live from your Supabase project");

    drawChart(data.series || [], comparison && comparison.series, win.days || days);

    fillList("rankPaths", (data.top_paths || []).map(function (row) { return entry(row.path, row.views); }), label, count);
    fillList("rankCountries", (data.top_countries || []).map(function (row) { return entry(row.country, row.views); }), label, count);
    fillList("rankReferrers", (data.top_referrers || []).map(function (row) { return entry(row.host, row.views); }), label, count);

    var byName = data.events || {};
    var events = [];
    for (var name in EVENT_LABELS) {
      if (Object.prototype.hasOwnProperty.call(EVENT_LABELS, name) && byName[name]) {
        events.push(entry(EVENT_LABELS[name], byName[name]));
      }
    }
    events.sort(function (a, b) { return b.count - a.count; });
    fillList("rankEvents", events, label, count);

    fillList("rankTargets", (data.top_targets || []).map(function (row) {
      var kindLabel = EVENT_LABELS[row.name] || row.name || "event";
      return entry(kindLabel.replace(/s$/, "") + " · " + row.target, row.count);
    }), label, count);
  }

  function label(row) { return row.label; }
  function count(row) { return row.count; }

  function loadStats(nextDays) {
    days = nextDays || days;
    var buttons = document.querySelectorAll("[data-days]");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].setAttribute("aria-pressed", String(Number(buttons[i].getAttribute("data-days")) === days));
    }
    status("warn", "Loading…");
    request("/api/stats?days=" + days).then(function (result) {
      if (result.status === 401) { toLogin(); return; }
      var data = result.data;
      if (data && data.ok) render(data);
      else renderUnavailable(data);
    }).catch(function () { renderUnavailable({ error: "database_unavailable" }); });
  }

  /* ---- records ---- */
  var TABLES = {
    views: { columns: ["When", "Path", "Country", "Referrer", "Visitor", ""], keys: ["occurred_at", "path", "country", "referrer_host", "vid", "erase"] },
    events: { columns: ["When", "Event", "Path", "Target", "Visitor", ""], keys: ["occurred_at", "name", "path", "target", "vid", "erase"] },
    subscribers: { columns: ["When", "Email", "Day", "", ""], keys: ["created_at", "email", "day", "erase"] }
  };

  function renderHead(nextKind) {
    var columns = TABLES[nextKind].columns;
    el.head.innerHTML = "";
    var row = document.createElement("tr");
    for (var i = 0; i < columns.length; i += 1) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = columns[i] || "Erase";
      row.appendChild(th);
    }
    el.head.appendChild(row);
  }

  function cell(text, mono) {
    var td = document.createElement("td");
    if (mono) td.className = "mono";
    td.textContent = text === null || text === undefined || text === "" ? "—" : String(text);
    td.title = td.textContent;
    return td;
  }

  function renderRows(nextKind, list) {
    el.body.innerHTML = "";
    if (!list.length) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = TABLES[nextKind].columns.length;
      td.textContent = "No records stored yet.";
      tr.appendChild(td);
      el.body.appendChild(tr);
      return;
    }
    for (var i = 0; i < list.length; i += 1) {
      var row = document.createElement("tr");
      var item = list[i];
      if (nextKind === "views") {
        row.appendChild(cell(when(item.occurred_at), true));
        row.appendChild(cell(item.path));
        row.appendChild(cell(item.country, true));
        row.appendChild(cell(item.referrer_host));
        row.appendChild(cell(item.vid, true));
        row.appendChild(eraseCell(nextKind, item.vid, null));
      } else if (nextKind === "events") {
        row.appendChild(cell(when(item.occurred_at), true));
        row.appendChild(cell(EVENT_LABELS[item.name] || item.name));
        row.appendChild(cell(item.path));
        row.appendChild(cell(item.target));
        row.appendChild(cell(item.vid, true));
        row.appendChild(eraseCell(nextKind, item.vid, null));
      } else {
        row.appendChild(cell(when(item.created_at), true));
        row.appendChild(cell(item.email));
        row.appendChild(cell(item.day, true));
        row.appendChild(eraseCell(nextKind, null, item.email));
      }
      el.body.appendChild(row);
    }
  }

  function when(value) {
    if (!value) return "—";
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  }

  function eraseCell(nextKind, vid, email) {
    var td = document.createElement("td");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "erase-btn";
    button.textContent = vid ? "Erase visitor" : "Remove";
    button.disabled = !vid && !email;
    if (vid) button.title = "Delete every view, event and membership row for this visitor id";
    if (email) button.title = "Delete this waitlist address";
    button.addEventListener("click", function () { erase(nextKind, vid, email, button); });
    td.appendChild(button);
    return td;
  }

  function erase(nextKind, vid, email, button) {
    var target = vid ? "visitor " + vid : "address " + email;
    if (!window.confirm("Permanently delete all records for " + target + "? This cannot be undone.")) return;
    button.disabled = true;
    var query = vid ? "?vid=" + encodeURIComponent(vid) : "?subscriber=" + encodeURIComponent(email);
    request("/api/admin/data" + query, { method: "DELETE" }).then(function (result) {
      if (result.status === 401) { toLogin(); return; }
      if (result.data && result.data.ok) {
        var deleted = result.data.deleted || {};
        var total = 0;
        for (var table in deleted) {
          if (Object.prototype.hasOwnProperty.call(deleted, table)) total += deleted[table];
        }
        toast("Erased " + total + " row" + (total === 1 ? "" : "s") + ".", "ok");
        loadRecords(nextKind, offset);
        loadStats();
      } else if (result.data && result.data.error === "erase_incomplete") {
        toast("The erase was incomplete — the database refused one of the tables.", "error");
        button.disabled = false;
      } else {
        toast("Erase rejected: " + ((result.data && result.data.error) || "unknown reason"), "error");
        button.disabled = false;
      }
    }).catch(function () {
      toast("Erase failed: the network did not answer.", "error");
      button.disabled = false;
    });
  }

  function loadRecords(nextKind, nextOffset) {
    kind = nextKind || kind;
    offset = Math.max(0, nextOffset || 0);
    renderHead(kind);
    el.body.innerHTML = "";
    var loading = document.createElement("tr");
    var td = document.createElement("td");
    td.colSpan = TABLES[kind].columns.length;
    td.textContent = "Loading…";
    loading.appendChild(td);
    el.body.appendChild(loading);
    el.prev.disabled = true;
    el.next.disabled = true;

    request("/api/admin/data?kind=" + kind + "&limit=" + PAGE_SIZE + "&offset=" + offset).then(function (result) {
      if (result.status === 401) { toLogin(); return; }
      if (!result.data || !result.data.ok) {
        rows = [];
        el.body.innerHTML = "";
        var tr = document.createElement("tr");
        var cellNode = document.createElement("td");
        cellNode.colSpan = TABLES[kind].columns.length;
        cellNode.textContent = "Records unavailable: " + ((result.data && result.data.error) || "database could not be read");
        tr.appendChild(cellNode);
        el.body.appendChild(tr);
        el.pageLabel.textContent = "no rows";
        return;
      }
      rows = result.data.rows || [];
      renderRows(kind, rows);
      var first = rows.length ? offset + 1 : 0;
      var last = offset + rows.length;
      el.pageLabel.textContent = first + "–" + last + " newest first";
      el.prev.disabled = offset <= 0;
      el.next.disabled = rows.length < PAGE_SIZE;
    }).catch(function () {
      el.pageLabel.textContent = "read failed";
    });
  }

  /* ---- export ---- */
  function csvCell(value) {
    var text = value === null || value === undefined ? "" : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function exportCsv() {
    if (!lastStats) { toast("There is nothing loaded to export yet.", "error"); return; }
    var lines = [];
    lines.push(["section", "key", "value"].map(csvCell).join(","));
    var win = lastStats.window || {};
    var totals = lastStats.totals || {};
    var all = lastStats.all_time || {};
    lines.push(["window", "days", win.days].map(csvCell).join(","));
    lines.push(["window", "start_day", win.start_day].map(csvCell).join(","));
    lines.push(["window", "end_day", win.end_day].map(csvCell).join(","));
    for (var key in totals) {
      if (Object.prototype.hasOwnProperty.call(totals, key)) lines.push(["window_total", key, totals[key]].map(csvCell).join(","));
    }
    for (var every in all) {
      if (Object.prototype.hasOwnProperty.call(all, every)) lines.push(["all_time", every, all[every]].map(csvCell).join(","));
    }
    (lastStats.series || []).forEach(function (row) {
      lines.push(["day", row.day, row.views + "/" + row.visitors].map(csvCell).join(","));
    });
    (lastStats.top_paths || []).forEach(function (row) { lines.push(["top_path", row.path, row.views].map(csvCell).join(",")); });
    (lastStats.top_referrers || []).forEach(function (row) { lines.push(["top_referrer", row.host, row.views].map(csvCell).join(",")); });
    (lastStats.top_countries || []).forEach(function (row) { lines.push(["top_country", row.country, row.views].map(csvCell).join(",")); });
    (lastStats.top_targets || []).forEach(function (row) { lines.push(["top_target", row.name + " " + row.target, row.count].map(csvCell).join(",")); });
    rows.forEach(function (row) {
      lines.push(["record", kind, JSON.stringify(row)].map(csvCell).join(","));
    });

    var blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "mue-stats-" + (win.end_day || "window") + "-" + days + "d.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Exported the window, ranked lists and the " + rows.length + " records on screen.", "ok");
  }

  /* ---- wiring ---- */
  document.getElementById("refreshButton").addEventListener("click", function () {
    loadStats();
    loadRecords(kind, offset);
  });
  document.getElementById("exportButton").addEventListener("click", exportCsv);
  document.getElementById("logoutButton").addEventListener("click", function () {
    request("/api/admin/session", { method: "DELETE" }).then(function () { window.location.replace("/admin/login"); })
      .catch(function () { window.location.replace("/admin/login"); });
  });

  var themeButton = document.getElementById("themeButton");

  function paintTheme() {
    var dark = document.documentElement.classList.contains("dark");
    themeButton.textContent = dark ? "Light" : "Dark";
    themeButton.setAttribute("aria-pressed", String(dark));
  }

  themeButton.addEventListener("click", function () {
    var root = document.documentElement;
    root.classList.toggle("dark");
    try { localStorage.setItem("mui-theme", root.classList.contains("dark") ? "dark" : "light"); } catch (error) { /* storage blocked */ }
    paintTheme();
  });

  try {
    if (localStorage.getItem("mui-theme") === "dark") document.documentElement.classList.add("dark");
  } catch (error) { /* storage blocked */ }
  paintTheme();

  var dayButtons = document.querySelectorAll("[data-days]");
  for (var d = 0; d < dayButtons.length; d += 1) {
    dayButtons[d].addEventListener("click", function (event) {
      loadStats(Number(event.currentTarget.getAttribute("data-days")));
    });
  }

  var tabs = document.querySelectorAll("[data-kind]");
  for (var t = 0; t < tabs.length; t += 1) {
    tabs[t].addEventListener("click", function (event) {
      for (var i = 0; i < tabs.length; i += 1) tabs[i].setAttribute("aria-selected", "false");
      event.currentTarget.setAttribute("aria-selected", "true");
      loadRecords(event.currentTarget.getAttribute("data-kind"), 0);
    });
  }

  el.prev.addEventListener("click", function () { loadRecords(kind, Math.max(0, offset - PAGE_SIZE)); });
  el.next.addEventListener("click", function () { loadRecords(kind, offset + PAGE_SIZE); });

  request("/api/admin/session").then(function (result) {
    if (result.status === 401 || (result.data && result.data.signed_in === false)) { toLogin(); return; }
    loadStats(14);
    loadRecords("views", 0);
  }).catch(function () {
    status("error", "Cannot reach the site right now.");
  });
}());
