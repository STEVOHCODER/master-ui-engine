/* ==========================================================================
   POST /api/track — the site's own event collector.
   Body (either shape):
     { v: "<anonymous visitor id>", p: "/library/", events: [
         { name: "copy_code", id: "card-pricing", target: "btn", path: "/library/", t: 1730000000000 } ] }
     { name: "github_click", target: "repo", path: "/", v: "..." }        // single event

   Writes:
     web_page_views  one row per page_view
     web_events      one row per every other event name
     web_visitors    one row per anonymous id, with first/last seen day and the
                     country codes that id has appeared from, so "returned" is
                     answerable without scanning history.

   Privacy contract enforced here: the day and timestamp come from the server
   clock (a client `t` only nudges within a 3-day band, never backdates a
   window); paths are stripped of query strings and fragments; referrers are
   reduced to a hostname; the user agent is read only to drop obvious bots and
   is never stored; IP addresses are never read or stored at all.

   Honest failure: a beacon must not retry-storm, so an unreachable database
   answers 200 with ok:false + reason instead of a 5xx.
   ========================================================================== */

import {
  cleanId,
  collectBody,
  countryFromHeaders,
  createSupabaseClient,
  isoDay,
  originAllowed,
  parseJsonBody,
  parseReferrerHost,
  isLikelyBot,
  requestHostOf,
  sanitizeBatch,
  sendJson,
} from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const headers = req.headers || {};
  const hostHeader = headers["x-forwarded-host"] || headers.host || "";
  /* Same-origin write guard. Anything that is not this site posting to itself
     (CSRF, a third-party page proxying beacons) is refused before parsing. */
  if (!originAllowed(headers.origin, hostHeader)) {
    return sendJson(res, 403, { ok: false, error: "origin_forbidden" });
  }

  let parsed = null;
  try {
    parsed = parseJsonBody(await collectBody(req));
  } catch {
    return sendJson(res, 400, { ok: false, error: "payload_too_large" });
  }
  if (!parsed) return sendJson(res, 400, { ok: false, error: "invalid_payload" });

  const batch = sanitizeBatch(parsed);
  if (!batch.events.length) {
    return sendJson(res, 200, { ok: true, stored: 0, ignored: batch.ignored });
  }

  /* Bots are answered as success so the client never retries, but nothing is
     written: crawler hits would otherwise inflate every number on the page. */
  if (isLikelyBot(headers["user-agent"])) {
    return sendJson(res, 200, { ok: true, stored: 0, skipped: "bot" });
  }

  const { client, reason } = await createSupabaseClient(process.env);
  if (!client) return sendJson(res, 200, { ok: false, reason: reason });

  const serverNow = Date.now();
  const day = isoDay(serverNow);
  const occurredAt = new Date(serverNow).toISOString();
  const country = countryFromHeaders(headers);
  const referrerHost = parseReferrerHost(headers.referer || headers.referrer, requestHostOf(headers));
  const vid = batch.vid;

  /* The client's `t` is validated in _lib.js and then deliberately ignored: a
     clock the site does not control cannot be allowed to move a hit into an
     earlier or later day than the one the server observed it on. */
  const viewRows = [];
  const eventRows = [];
  for (let index = 0; index < batch.events.length; index += 1) {
    const event = batch.events[index];
    if (event.name === "page_view") {
      viewRows.push({
        day: day,
        occurred_at: occurredAt,
        path: event.path || "/",
        referrer_host: referrerHost,
        country: country,
        vid: vid,
      });
    } else {
      eventRows.push({
        day: day,
        occurred_at: occurredAt,
        name: event.name,
        path: event.path,
        /* One column holds whichever token the caller supplied: `target` is the
           element label, `id` the component or template id. The dashboard's
           "most copied / most opened" list reads this column. */
        target: event.target || cleanId(event.id),
        vid: vid,
      });
    }
  }

  const stored = { views: 0, events: 0 };
  const failed = [];

  if (viewRows.length) {
    const result = await client.from("web_page_views").insert(viewRows);
    if (result.error) failed.push("views:" + result.error.code);
    else stored.views = viewRows.length;
  }
  if (eventRows.length) {
    const result = await client.from("web_events").insert(eventRows);
    if (result.error) failed.push("events:" + result.error.code);
    else stored.events = eventRows.length;
  }

  /* Membership is what makes "returning visitors" answerable, so it is written
     even for an event-only batch. Best-effort: a membership failure never turns
     a stored hit into a failed beacon, it is logged for the function tail. */
  if (vid && !failed.length) {
    const rpc = await client.rpc("mue_track_visitor", { p_vid: vid, p_day: day, p_country: country });
    if (rpc.error) {
      await rememberVisitor(client, vid, day, country);
    }
  }

  if (failed.length) {
    console.log("[track] write failed " + failed.join(","));
    return sendJson(res, 200, { ok: false, reason: "database_unavailable", stored: stored });
  }

  return sendJson(res, 200, { ok: true, stored: stored.views + stored.events });
}

/* Fallback for a project whose schema predates mue_track_visitor(), or where
   the role cannot execute it: insert the membership row, and when it already
   exists bump only last_seen_day. first_seen_day is never overwritten, so
   "new vs returning" stays correct; only per-visitor country accumulation is
   lost, and country totals come from web_page_views regardless. */
async function rememberVisitor(client, vid, day, country) {
  const inserted = await client
    .from("web_visitors")
    .insert({ vid: vid, first_seen_day: day, last_seen_day: day, countries: country ? [country] : [] });
  if (!inserted.error) return;
  if (inserted.error.code !== "23505") {
    console.log("[track] visitor membership failed " + inserted.error.code);
    return;
  }
  const updated = await client
    .from("web_visitors")
    .update({ last_seen_day: day })
    .eq("vid", vid)
    .lt("last_seen_day", day);
  if (updated.error) console.log("[track] visitor refresh failed " + updated.error.code);
}
