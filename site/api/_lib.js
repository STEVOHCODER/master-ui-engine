/* ==========================================================================
   MASTER-UI-ENGINE site — shared serverless helpers.
   Imported by track.js, stats.js and subscribe.js.

   Two rules shape this file:
   1. Every browser-supplied value is rebuilt from an allowed character class
      before it reaches the database, and nothing browser-supplied is echoed.
   2. Everything here is pure (no network, no clock unless passed in) so it can
      be unit-tested with a plain `node` run, without Supabase installed. The
      one impure escape — the Supabase client — is imported lazily inside
      createSupabaseClient(), so `import "./_lib.js"` never needs node_modules.

   NOTE ON THIS FILE BECOMING A ROUTE: Vercel treats every file in `api/` as a
   serverless function, and a Node function without a default export fails the
   build. A no-op 404 handler is therefore exported at the bottom, so this
   module can also be deployed harmlessly as `/api/_lib`.
   ========================================================================== */

import { createHash } from "node:crypto";

/* #region contract */
/* The event vocabulary the front end may fire. Anything else is dropped. */
export const EVENT_NAMES = [
  "page_view",
  "library_search",
  "component_preview_open",
  "template_preview_open",
  "copy_code",
  "github_click",
  "documentation_click",
  "install_instruction_open",
  "theme_switch",
  "newsletter_signup",
];

export const MAX_BATCH = 20; // events accepted per request; extras are dropped
export const MAX_ID = 80; // ids and targets are short tokens, never prose (PATH_SHAPE caps paths)
export const SCAN_LIMIT = 5000; // rows read per stats window
export const TOP_LIMIT = 10; // entries per ranked list
export const DEFAULT_DAYS = 14;
export const MIN_DAYS = 1;
export const MAX_DAYS = 90;
export const MAX_SUBSCRIBES_PER_DAY = 5; // crude per-vid+day guard

/* library_search is the one event whose natural payload is text the visitor
   typed, and the site's promise is that nothing typed is stored. The count is
   kept, the term is dropped. Flip this to true only together with a change to
   site/privacy.html, and expect the raw query (first 64 characters, as the
   browser sends it) to land in web_events.target. */
export const STORE_SEARCH_TERMS = false;
export const TERM_ONLY_EVENTS = ["library_search"];

const VID_SHAPE = /^[A-Za-z0-9_-]{8,64}$/;
const PATH_SHAPE = /^\/[A-Za-z0-9/_\-.~]{0,199}$/;
const HOST_SHAPE = /^[a-z0-9]([a-z0-9\-._]{0,251}[a-z0-9])?$/;
const EMAIL_SHAPE = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]{1,64}@[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/;
const COUNTRY_SHAPE = /^[A-Z]{2}$/;
/* Only ever used to DECIDE whether a request is a machine; never stored. */
const BOT_SHAPE =
  /(bot|spider|crawler|slurp|headless|phantom|lighthouse|selenium|puppeteer|playwright|cypress|curl\/|wget|python|okhttp|java\/|go-http-client|node-fetch|axios|scrapy|monitor|uptime|feedly)/i;
/* #endregion contract */

/* #region scrubbers */
/* Control characters and surrounding space are removed, then the value is cut
   to `max`. Returns null for anything that is not a usable string, so callers
   can distinguish "absent" from "empty". */
export function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const stripped = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!stripped) return null;
  return stripped.length > max ? stripped.slice(0, max) : stripped;
}

export function cleanId(value) {
  return cleanText(value, MAX_ID);
}

export function isTrackedEvent(name) {
  return typeof name === "string" && EVENT_NAMES.indexOf(name) !== -1;
}

/* Anonymous per-browser id. Format-checked only: it authorizes nothing and is
   never treated as identity. */
export function validVid(value) {
  return typeof value === "string" && VID_SHAPE.test(value) ? value : null;
}

/* A path is stored as a plain site path: no query string, no fragment, no
   traversal. A trailing slash is normalised away so /pricing/ and /pricing
   count as the same page. */
export function validPath(value) {
  if (typeof value !== "string") return null;
  let cut = value.split("?")[0].split("#")[0];
  if (cut.length > 1 && cut.charAt(cut.length - 1) === "/") cut = cut.slice(0, -1);
  if (!PATH_SHAPE.test(cut)) return null;
  if (cut.indexOf("//") !== -1 || cut.indexOf("..") !== -1) return null;
  if (cut.split("/").length - 1 > 9) return null;
  return cut;
}

/* Vercel's x-vercel-ip-country header is a two-letter code, or absent. */
export function validCountry(value) {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return COUNTRY_SHAPE.test(upper) ? upper : null;
}

/* A referrer becomes a lowercase hostname or null. Query strings, paths, ports
   and userinfo are dropped here, so they can never reach a row. Self-referrals
   are null: a visit from the site itself is not a source. */
export function parseReferrerHost(referrer, selfHost) {
  const raw = cleanText(referrer, 2000);
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  /* Only http(S) referrers are sources. A javascript:, data: or file: value is
     a crafted header, not a visitor arriving from somewhere. */
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (!HOST_SHAPE.test(host)) return null;
  const self = typeof selfHost === "string" ? selfHost.toLowerCase() : "";
  if (self && host === self) return null;
  return host;
}

/* Trim, lowercase, then reject the shapes that are almost always typos or
   probes. Returns null instead of throwing so the route chooses the status. */
export function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_SHAPE.test(email)) return null;
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.charAt(0) === "." || local.charAt(local.length - 1) === ".") return null;
  if (local.indexOf("..") !== -1) return null;
  if (!domain || domain.charAt(0) === "-" || domain.indexOf("..") !== -1) return null;
  const dot = domain.lastIndexOf(".");
  if (dot < 1 || dot === domain.length - 1) return null;
  if (!/^[a-z]{2,24}$/.test(domain.slice(dot + 1))) return null;
  return email;
}

/* Cross-site write guard: the Origin header's host must be the host the request
   arrived at. Vercel forwards the public host in x-forwarded-host. */
export function originAllowed(originHeader, hostHeader) {
  if (typeof originHeader !== "string" || !originHeader.trim()) return false;
  if (typeof hostHeader !== "string" || !hostHeader.trim()) return false;
  let originHost = "";
  try {
    originHost = new URL(originHeader).hostname.toLowerCase();
  } catch {
    return false;
  }
  const requestHost = hostHeader.split(",")[0].trim().split(":")[0].toLowerCase();
  return !!originHost && originHost === requestHost;
}

export function requestHostOf(headers) {
  const forwarded = headers && headers["x-forwarded-host"];
  const first = typeof forwarded === "string" && forwarded.trim() ? forwarded : (headers && headers.host) || "";
  return String(first).split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isLikelyBot(userAgent) {
  if (typeof userAgent !== "string" || !userAgent.trim()) return true;
  if (userAgent.length > 512) return true;
  return BOT_SHAPE.test(userAgent);
}

/* The country code from the edge header, or null when the header is missing or
   the request looks like a crawler. */
export function countryFromHeaders(headers) {
  return validCountry(headers && headers["x-vercel-ip-country"]);
}

/* #endregion scrubbers */

/* #region calendar math */
export function isoDay(epochMs) {
  const ms = typeof epochMs === "number" && Number.isFinite(epochMs) ? epochMs : Date.now();
  return new Date(ms).toISOString().slice(0, 10);
}

/* UTC midnight of a YYYY-MM-DD string, as epoch ms. */
export function dayNumber(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const parts = day.split("-");
  return Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function dayLabel(utcMs) {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/* `days` clamped to the documented window, from an untrusted query value. */
export function clampDays(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return DEFAULT_DAYS;
  if (value < MIN_DAYS) return MIN_DAYS;
  if (value > MAX_DAYS) return MAX_DAYS;
  return value;
}

/* Oldest-first, zero-filled list of the `days` UTC calendar days ending at
   `endDay`. The window is day-granular so the chart and the totals agree. */
export function daySeries(endDay, days) {
  const span = Math.min(Math.max(days, MIN_DAYS), MAX_DAYS);
  const base = dayNumber(endDay);
  if (!Number.isFinite(base)) return [];
  const labels = [];
  for (let index = span - 1; index >= 0; index -= 1) labels.push(dayLabel(base - index * 86400000));
  return labels;
}

export function startDayOf(endDay, days) {
  const series = daySeries(endDay, days);
  return series.length ? series[0] : endDay;
}

/* Shift one UTC calendar day by a whole-day amount. */
export function shiftDay(day, deltaDays) {
  const base = dayNumber(day);
  const amount = Math.trunc(Number(deltaDays) || 0);
  return Number.isFinite(base) ? dayLabel(base + amount * 86400000) : day;
}
/* #endregion calendar math */

/* #region request shaping */
/* Accepts either a batch { v, p, events:[...] } or a single event object, and
   returns only values that passed validation. Invalid entries are counted in
   `ignored` rather than failing the whole beacon: a batch is best-effort by
   design, and one bad event must not lose the rest. */
export function sanitizeBatch(body) {
  const source = body && typeof body === "object" ? body : null;
  if (!source) return { vid: null, pagePath: null, events: [], ignored: 0 };

  const vid = validVid(source.v !== undefined ? source.v : source.vid);
  const pagePath = validPath(source.p !== undefined ? source.p : source.path);
  const rawEvents = Array.isArray(source.events) ? source.events : [source];
  const events = [];
  let ignored = 0;

  for (let index = 0; index < rawEvents.length; index += 1) {
    if (index >= MAX_BATCH) {
      ignored += rawEvents.length - MAX_BATCH;
      break;
    }
    const item = rawEvents[index];
    if (!item || typeof item !== "object") { ignored += 1; continue; }
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!isTrackedEvent(name)) { ignored += 1; continue; }
    /* Text a visitor typed is discarded here rather than at the caller, so no
       page can accidentally store it by passing the field through. */
    const termOnly = !STORE_SEARCH_TERMS && TERM_ONLY_EVENTS.indexOf(name) !== -1;
    events.push({
      name: name,
      id: termOnly ? null : cleanId(item.id),
      target: termOnly ? null : (cleanId(item.target) || cleanId(item.id)),
      path: validPath(item.path) || pagePath,
      t: typeof item.t === "number" && Number.isFinite(item.t) ? item.t : null,
    });
  }

  return { vid: vid, pagePath: pagePath, events: events, ignored: ignored };
}

/* #endregion request shaping */

/* #region aggregation */
export function countBy(rows, keyFn) {
  const counts = new Map();
  for (let index = 0; index < rows.length; index += 1) {
    const key = keyFn(rows[index]);
    if (key === null || key === undefined) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

/* Highest first, then alphabetical so ties are stable across refreshes. */
export function topFromCounts(counts, limit) {
  const cap = typeof limit === "number" && limit > 0 ? limit : TOP_LIMIT;
  const entries = [];
  counts.forEach(function (count, label) {
    entries.push({ label: label, count: count });
  });
  entries.sort(function (a, b) {
    return b.count - a.count || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
  });
  return entries.slice(0, cap);
}

function addSet(target, value) {
  if (typeof value === "string" && value) target.add(value);
}

/* The whole window view of the data, from rows the route already read.
   Pure: no counts, no network, so it is fully unit-testable. */
export function buildStats(input) {
  const viewRows = Array.isArray(input.viewRows) ? input.viewRows : [];
  const eventRows = Array.isArray(input.eventRows) ? input.eventRows : [];
  const newVisitorRows = Array.isArray(input.newVisitorRows) ? input.newVisitorRows : [];
  const endDay = typeof input.endDay === "string" ? input.endDay : isoDay();
  const days = clampDays(input.days);
  const series = daySeries(endDay, days);
  const startDay = series.length ? series[0] : endDay;

  const perDay = new Map();
  for (let index = 0; index < series.length; index += 1) {
    perDay.set(series[index], { views: 0, visitors: new Set() });
  }

  const windowVisitors = new Set();
  const countrySet = new Set();
  const viewVids = new Set();
  const referrerVids = new Set();

  for (let index = 0; index < viewRows.length; index += 1) {
    const row = viewRows[index];
    const bucket = perDay.get(row.day);
    if (bucket) {
      bucket.views += 1;
      addSet(bucket.visitors, row.vid);
    }
    addSet(windowVisitors, row.vid);
    addSet(countrySet, row.country);
    if (typeof row.vid === "string" && row.vid) viewVids.add(row.vid);
    if (typeof row.referrer_host === "string" && row.referrer_host) referrerVids.add(row.referrer_host);
  }

  /* A visitor first seen inside the window is new; one first seen earlier and
     appearing again is a return. Anything else (unknown membership) is neither,
     and the two numbers will not sum to `visitors` — reported that way. */
  let newInWindow = 0;
  for (let index = 0; index < newVisitorRows.length; index += 1) {
    if (viewVids.has(newVisitorRows[index] && newVisitorRows[index].vid)) newInWindow += 1;
  }

  const eventsByName = countBy(eventRows, function (row) {
    return typeof row.name === "string" ? row.name : null;
  });
  const targetsByName = new Map();
  for (let index = 0; index < eventRows.length; index += 1) {
    const row = eventRows[index];
    if (typeof row.name !== "string" || typeof row.target !== "string" || !row.target) continue;
    let bucket = targetsByName.get(row.name);
    if (!bucket) { bucket = new Map(); targetsByName.set(row.name, bucket); }
    bucket.set(row.target, (bucket.get(row.target) || 0) + 1);
  }

  const seriesOut = [];
  for (let index = 0; index < series.length; index += 1) {
    const day = series[index];
    const bucket = perDay.get(day);
    seriesOut.push({ day: day, views: bucket.views, visitors: bucket.visitors.size });
  }

  const eventsOut = {};
  for (let index = 0; index < EVENT_NAMES.length; index += 1) {
    const name = EVENT_NAMES[index];
    /* page_view lives in web_page_views, so its window count is the view total
       rather than a name in web_events. */
    eventsOut[name] = name === "page_view" ? viewRows.length : (eventsByName.get(name) || 0);
  }

  const topTargets = [];
  targetsByName.forEach(function (bucket, name) {
    const ranked = topFromCounts(bucket, TOP_LIMIT);
    for (let index = 0; index < ranked.length; index += 1) {
      topTargets.push({ name: name, target: ranked[index].label, count: ranked[index].count });
    }
  });
  topTargets.sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); });

  const truncatedViews = viewRows.length >= SCAN_LIMIT;
  const truncatedEvents = eventRows.length >= SCAN_LIMIT;
  const truncatedVisitors = newVisitorRows.length >= SCAN_LIMIT;

  return {
    ok: true,
    available: true,
    window: { days: days, start_day: startDay, end_day: endDay, generated_at: new Date().toISOString() },
    totals: {
      views: viewRows.length,
      visitors: windowVisitors.size,
      new_visitors: newInWindow,
      returning_visitors: Math.max(windowVisitors.size - newInWindow, 0),
      countries: countrySet.size,
      events: eventRows.length,
      referrer_hosts: referrerVids.size,
    },
    events: eventsOut,
    series: seriesOut,
    top_paths: topFromCounts(countBy(viewRows, function (row) { return typeof row.path === "string" ? row.path : null; }), TOP_LIMIT)
      .map(function (entry) { return { path: entry.label, views: entry.count }; }),
    top_referrers: topFromCounts(countBy(viewRows, function (row) { return typeof row.referrer_host === "string" ? row.referrer_host : null; }), TOP_LIMIT)
      .map(function (entry) { return { host: entry.label, views: entry.count }; }),
    top_countries: topFromCounts(countBy(viewRows, function (row) { return typeof row.country === "string" ? row.country : null; }), TOP_LIMIT)
      .map(function (entry) { return { country: entry.label, views: entry.count }; }),
    top_targets: topTargets.slice(0, TOP_LIMIT),
    coverage: {
      scanned_views: viewRows.length,
      scanned_events: eventRows.length,
      scan_limit: SCAN_LIMIT,
      truncated: truncatedViews || truncatedEvents || truncatedVisitors,
      truncated_views: truncatedViews,
      truncated_events: truncatedEvents,
      truncated_visitors: truncatedVisitors,
    },
  };
}
/* #endregion aggregation */

/* #region io */
export function sendJson(res, status, payload) {
  if (typeof res.setHeader === "function") {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    /* The endpoints are same-origin only and never need CORS; sending no
       Access-Control-Allow-Origin is the second half of the write guard. */
  }
  res.status(status);
  res.end(JSON.stringify(payload));
}

/* Raw stream read instead of req.body: sendBeacon posts a text/plain blob when
   the JSON content type is not allowed, and Vercel's parser leaves that empty. */
export function collectBody(req, maxBytes) {
  const cap = maxBytes || 32768;
  return new Promise(function (resolve, reject) {
    let size = 0;
    const chunks = [];
    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > cap) { reject(new Error("payload_too_large")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}

export function parseJsonBody(raw) {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return null;
  if (text.length > 32768) return null;
  try {
    const value = JSON.parse(text);
    /* A batch is an object with `events`, or a single event object. A bare
       array or a scalar is neither, and is treated as an invalid payload. */
    if (Array.isArray(value)) return null;
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

/* Non-secret environment read, split out so stats.js can tell "not configured"
   apart from "database unreachable" without a live project. */
export function readSupabaseEnv(env) {
  const source = env || (typeof process !== "undefined" ? process.env : {}) || {};
  const url = typeof source.SUPABASE_URL === "string" ? source.SUPABASE_URL.trim() : "";
  const key = typeof source.SUPABASE_SERVICE_ROLE_KEY === "string" ? source.SUPABASE_SERVICE_ROLE_KEY.trim() : "";
  return { url: url, key: key, missing: !url || !key };
}

export function isValidSupabaseUrl(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !!parsed.hostname;
  } catch {
    return false;
  }
}

/* Lazily imported so the pure helpers above stay testable with no install. A
   failed import (dependency missing, bundler hiccup, cold install) is reported
   as database_unavailable rather than crashing the function into a 500: the
   dashboard must be able to say what is wrong instead of hanging. */
export async function createSupabaseClient(env) {
  const config = readSupabaseEnv(env);
  if (config.missing) return { client: null, reason: "not_configured" };
  if (!isValidSupabaseUrl(config.url)) return { client: null, reason: "not_configured" };
  let factory;
  try {
    factory = await import("@supabase/supabase-js");
  } catch (error) {
    console.log("[site] supabase client import failed " + String(error && error.message));
    return { client: null, reason: "database_unavailable" };
  }
  if (!factory || typeof factory.createClient !== "function") {
    return { client: null, reason: "database_unavailable" };
  }
  const client = factory.createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "master-ui-engine-site" } },
  });
  return { client: client, reason: null };
}

/* Rate-limiter bucket key: a SHA-256 digest, so neither an email nor a raw
   visitor id is ever written to web_rate_hits. */
export function rateKey(scope, value) {
  return createHash("sha256").update(String(scope) + ":" + String(value)).digest("hex");
}
/* #endregion io */

/* Vercel compiles every file in api/ into a function and requires a default
   export; this module is a helper library, so its "route" simply 404s. */
export default function handler(_req, res) {
  if (typeof res.status === "function") sendJson(res, 404, { ok: false, reason: "not_found" });
  else res.statusCode = 404;
}
