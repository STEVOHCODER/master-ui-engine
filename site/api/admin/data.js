/* /api/admin/data — authenticated owner records and erasure controls.

   GET  ?kind=views|events|subscribers&limit=50&offset=0
   DELETE ?vid=<anonymous id>            erase all records for that visitor
   DELETE ?subscriber=<email>           remove one waitlist address

   Middleware already blocks unauthenticated calls, but this route verifies the
   session again so a future routing change cannot accidentally expose records. */

import { adminConfigured, adminSession } from "../_admin.js";
import {
  createSupabaseClient,
  normalizeEmail,
  originAllowed,
  sendJson,
  validVid,
} from "../_lib.js";

const DATA_COLUMNS = {
  views: {
    table: "web_page_views",
    select: "id,day,occurred_at,path,referrer_host,country,vid",
    order: "occurred_at",
  },
  events: {
    table: "web_events",
    select: "id,day,occurred_at,name,path,target,vid",
    order: "occurred_at",
  },
  subscribers: {
    table: "web_subscribers",
    select: "email,day,created_at",
    order: "created_at",
  },
};

function clampLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 50;
  return Math.max(5, Math.min(100, Math.trunc(parsed)));
}

function clampOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(50000, Math.trunc(parsed)));
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "DELETE") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }
  if (!adminConfigured(process.env) || !adminSession(req, process.env)) {
    return sendJson(res, 401, { ok: false, error: "authentication_required" });
  }

  const query = new URL(req.url, "http://internal.local").searchParams;
  const { client, reason } = await createSupabaseClient(process.env);
  if (!client) return sendJson(res, 503, { ok: false, error: reason || "database_unavailable" });

  if (req.method === "GET") {
    const kind = String(query.get("kind") || "views");
    const definition = DATA_COLUMNS[kind];
    if (!definition) return sendJson(res, 400, { ok: false, error: "invalid_kind" });
    const result = await client
      .from(definition.table)
      .select(definition.select)
      .order(definition.order, { ascending: false })
      .limit(clampLimit(query.get("limit")))
      .range(clampOffset(query.get("offset")), clampOffset(query.get("offset")) + clampLimit(query.get("limit")) - 1);
    if (result.error) return sendJson(res, 502, { ok: false, error: "database_unavailable" });
    return sendJson(res, 200, { ok: true, kind: kind, rows: result.data || [] });
  }

  if (!originAllowed(req.headers.origin, req.headers["x-forwarded-host"] || req.headers.host || "")) {
    return sendJson(res, 403, { ok: false, error: "origin_forbidden" });
  }

  const vid = validVid(query.get("vid"));
  const subscriber = normalizeEmail(query.get("subscriber"));
  if (!vid && !subscriber) return sendJson(res, 400, { ok: false, error: "nothing_to_erase" });

  const deleted = {};
  const errors = [];

  if (vid) {
    for (const table of ["web_page_views", "web_events", "web_visitors"]) {
      const result = await client.from(table).delete().eq("vid", vid).select();
      if (result.error) errors.push(table + ":" + result.error.code);
      else deleted[table] = (result.data || []).length;
    }
  }

  if (subscriber) {
    const result = await client.from("web_subscribers").delete().eq("email", subscriber).select();
    if (result.error) errors.push("web_subscribers:" + result.error.code);
    else deleted.web_subscribers = (result.data || []).length;
  }

  if (errors.length) return sendJson(res, 502, { ok: false, error: "erase_incomplete", deleted: deleted });
  return sendJson(res, 200, { ok: true, erased: true, deleted: deleted });
}
