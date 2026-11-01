/* ==========================================================================
   GET /api/stats?days=14 — owner-only analytics reader.
   Answers, for the selected UTC day window:
     totals      views, unique visitors, new vs returning, countries, subscribers
     events      every tracked event name, counted (page_view comes from the
                 views table, the other nine from web_events)
     series      one point per day, zero-filled so a quiet day draws as a gap
     comparison  the immediately preceding window, without top lists
     top_paths / top_referrers / top_countries / top_targets
     all_time    exact row counts outside any window

   There is no fabricated data in here. PostgREST has no GROUP BY, so a bounded
   window scan is read and aggregated in memory; when the scan hits its cap the
   response says so (coverage.truncated) instead of presenting a partial window
   as a complete one. Unconfigured or unreachable database answers 200 with
   ok:false + reason so the dashboard can print "unavailable" rather than zeros.
   ========================================================================== */

import {
  SCAN_LIMIT,
  TOP_LIMIT,
  buildStats,
  clampDays,
  createSupabaseClient,
  DEFAULT_DAYS,
  isoDay,
  sendJson,
  shiftDay,
  startDayOf,
} from "./_lib.js";
import { adminConfigured, adminSession } from "./_admin.js";

function unavailable(res, reason) {
  return sendJson(res, 200, { ok: false, available: false, reason: reason });
}

/* Every read is checked: a PostgREST error object and a thrown network failure
   mean the same thing to the caller — the numbers cannot be claimed. */
function rowsOf(result) {
  if (!result || result.error) throw new Error(result && result.error.code ? result.error.code : "read_failed");
  return Array.isArray(result.data) ? result.data : [];
}

function countOf(result) {
  if (!result || result.error) throw new Error(result && result.error.code ? result.error.code : "count_failed");
  return typeof result.count === "number" ? result.count : null;
}

function percentChange(current, previous) {
  const now = typeof current === "number" ? current : null;
  const before = typeof previous === "number" ? previous : null;
  if (now === null || before === null) return null;
  if (before === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - before) / before) * 1000) / 10;
}

async function readWindowRows(client, startDay, endDay) {
  const views = await client
    .from("web_page_views")
    .select("day,vid,path,referrer_host,country")
    .gte("day", startDay)
    .lte("day", endDay)
    .order("day", { ascending: false })
    .limit(SCAN_LIMIT);

  const events = await client
    .from("web_events")
    .select("day,name,vid,path,target")
    .gte("day", startDay)
    .lte("day", endDay)
    .order("day", { ascending: false })
    .limit(SCAN_LIMIT);

  /* First-seen days inside the window are the "new" half of new vs returning;
     everything else in the window's visitor set arrived here before. */
  const fresh = await client
    .from("web_visitors")
    .select("vid")
    .gte("first_seen_day", startDay)
    .lte("first_seen_day", endDay)
    .limit(SCAN_LIMIT);

  return { viewRows: rowsOf(views), eventRows: rowsOf(events), newVisitorRows: rowsOf(fresh) };
}

async function countWindowSubscribers(client, startDay, endDay) {
  return countOf(
    await client
      .from("web_subscribers")
      .select("email", { count: "exact", head: true })
      .gte("day", startDay)
      .lte("day", endDay)
  );
}

async function exactCountryCount(client, startDay, endDay) {
  try {
    const result = await client.rpc("mue_count_distinct_country", {
      p_from_day: startDay,
      p_to_day: endDay,
    });
    return result.error || typeof result.data !== "number" ? null : result.data;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  if (!adminConfigured(process.env) || !adminSession(req, process.env)) {
    return sendJson(res, 401, { ok: false, available: false, error: "authentication_required" });
  }

  const { client, reason } = await createSupabaseClient(process.env);
  if (!client) return unavailable(res, reason);

  const url = new URL(req.url, "http://internal.local");
  const rawDays = url.searchParams.get("days");
  const days = rawDays === null ? DEFAULT_DAYS : clampDays(rawDays);
  const endDay = isoDay(Date.now());
  const startDay = startDayOf(endDay, days);
  const previousEndDay = shiftDay(startDay, -1);
  const previousStartDay = shiftDay(previousEndDay, -(days - 1));

  let stats;
  let previousStats;
  let comparison;
  let windowSubscribers = null;
  try {
    const currentRows = await readWindowRows(client, startDay, endDay);
    const previousRows = await readWindowRows(client, previousStartDay, previousEndDay);
    stats = buildStats({
      viewRows: currentRows.viewRows,
      eventRows: currentRows.eventRows,
      newVisitorRows: currentRows.newVisitorRows,
      days: days,
      endDay: endDay,
    });
    previousStats = buildStats({
      viewRows: previousRows.viewRows,
      eventRows: previousRows.eventRows,
      newVisitorRows: previousRows.newVisitorRows,
      days: days,
      endDay: previousEndDay,
    });

    windowSubscribers = await countWindowSubscribers(client, startDay, endDay);
    stats.totals.subscribers = windowSubscribers;
    previousStats.totals.subscribers = await countWindowSubscribers(client, previousStartDay, previousEndDay);
  } catch (error) {
    console.log("[stats] window read failed " + String(error && error.message));
    return unavailable(res, "database_unavailable");
  }

  /* Country totals are recomputed exactly by the database. A window scan that
     hit SCAN_LIMIT would undercount them, and an all-time scan is not possible
     at all — so the RPC wins whenever it answers, and the response says which
     one produced the number. */
  const currentCountries = await exactCountryCount(client, startDay, endDay);
  if (currentCountries !== null) {
    stats.totals.countries = currentCountries;
    stats.coverage.countries_exact = true;
  }
  const previousCountries = await exactCountryCount(client, previousStartDay, previousEndDay);
  comparison = {
    days: days,
    start_day: previousStartDay,
    end_day: previousEndDay,
    totals: previousStats.totals,
    series: previousStats.series,
    coverage: previousStats.coverage,
    events: previousStats.events,
  };
  if (previousCountries !== null) {
    comparison.totals.countries = previousCountries;
    comparison.coverage.countries_exact = true;
  }
  comparison.deltas = {
    views: percentChange(stats.totals.views, previousStats.totals.views),
    visitors: percentChange(stats.totals.visitors, previousStats.totals.visitors),
    events: percentChange(stats.totals.events, previousStats.totals.events),
    countries: percentChange(stats.totals.countries, comparison.totals.countries),
    subscribers: percentChange(stats.totals.subscribers, previousStats.totals.subscribers),
  };

  const allTime = {};
  try {
    const counts = await Promise.all([
      client.from("web_page_views").select("id", { count: "exact", head: true }),
      client.from("web_visitors").select("vid", { count: "exact", head: true }),
      client.from("web_events").select("id", { count: "exact", head: true }),
      client.from("web_subscribers").select("email", { count: "exact", head: true }),
      client.rpc("mue_count_distinct_country", { p_from_day: null, p_to_day: null }),
    ]);
    allTime.views = countOf(counts[0]);
    allTime.visitors = countOf(counts[1]);
    allTime.events = countOf(counts[2]);
    allTime.subscribers = countOf(counts[3]);
    allTime.countries = counts[4].error || typeof counts[4].data !== "number" ? null : counts[4].data;
  } catch (error) {
    /* A failed all-time read is reported as null per field, never as 0. */
    console.log("[stats] all-time counts failed " + String(error && error.message));
    allTime.views = allTime.views === undefined ? null : allTime.views;
  }

  if (typeof windowSubscribers === "number") allTime.window_subscribers = windowSubscribers;

  stats.all_time = allTime;
  stats.comparison = comparison || null;
  stats.window.top_limit = TOP_LIMIT;
  return sendJson(res, 200, stats);
}
