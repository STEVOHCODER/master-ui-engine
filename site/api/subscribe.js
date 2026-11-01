/* ==========================================================================
   POST /api/subscribe — waitlist capture.
   Body: { email: "reader@example.com", v: "<anonymous visitor id>" }

   What it does: normalizes the address (trim + lowercase), refuses anything
   that is not shaped like mail, writes one row to web_subscribers and reports
   honestly whether that row was new ("created") or already there ("existing").
   Cross-site writes are refused with 403 origin_forbidden, exactly as in
   track.js, and a crude per-visitor-day budget in web_rate_hits stops one
   browser from filling the table. The limiter key is a SHA-256 digest, so the
   limiter table holds no address and no raw visitor id either.

   Nothing here is ever echoed back to the caller: the response is a state word.
   ========================================================================== */

import {
  MAX_SUBSCRIBES_PER_DAY,
  collectBody,
  createSupabaseClient,
  isoDay,
  normalizeEmail,
  originAllowed,
  parseJsonBody,
  rateKey,
  sendJson,
  validVid,
} from "./_lib.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const headers = req.headers || {};
  const hostHeader = headers["x-forwarded-host"] || headers.host || "";
  if (!originAllowed(headers.origin, hostHeader)) {
    return sendJson(res, 403, { ok: false, error: "origin_forbidden" });
  }

  let body = null;
  try {
    body = parseJsonBody(await collectBody(req));
  } catch {
    return sendJson(res, 400, { ok: false, error: "payload_too_large" });
  }
  if (!body) return sendJson(res, 400, { ok: false, error: "invalid_payload" });

  const email = normalizeEmail(body.email);
  if (!email) return sendJson(res, 400, { ok: false, error: "invalid_email" });

  const { client, reason } = await createSupabaseClient(process.env);
  if (!client) return sendJson(res, 200, { ok: false, reason: reason });

  const day = isoDay(Date.now());
  const vid = validVid(body.v !== undefined ? body.v : body.vid);
  /* Budget per identity-agnostic bucket: the anonymous id when the browser sent
     one, otherwise the address itself (as a digest). Five writes a day per
     bucket is far above any real human's behaviour. */
  const bucket = rateKey("subscribe", vid || email);

  try {
    const limited = await withinBudget(client, bucket, day);
    if (!limited.allowed) {
      return sendJson(res, 429, { ok: false, error: "rate_limited", retry_after_day: day });
    }

    /* ignoreDuplicates + select is the read-back that distinguishes a new row
       from a duplicate in a single round trip: an ignored duplicate returns no
       rows, a fresh insert returns exactly the address it stored. */
    const inserted = await client
      .from("web_subscribers")
      .upsert({ email: email, day: day, created_at: new Date().toISOString() }, {
        onConflict: "email",
        ignoreDuplicates: true,
      })
      .select("email");

    if (inserted.error) {
      console.log("[subscribe] write failed " + inserted.error.code);
      return sendJson(res, 200, { ok: false, reason: "database_unavailable" });
    }
    if (Array.isArray(inserted.data) && inserted.data.length === 1) {
      return sendJson(res, 200, { ok: true, state: "created" });
    }

    /* Nothing came back: either the address was already on the list, or the
     duplicate was silently ignored. Confirm before claiming "existing". */
    const check = await client.from("web_subscribers").select("email").eq("email", email).limit(1);
    if (check.error) {
      console.log("[subscribe] confirm failed " + check.error.code);
      return sendJson(res, 200, { ok: false, reason: "database_unavailable" });
    }
    if (Array.isArray(check.data) && check.data.length === 1) {
      return sendJson(res, 200, { ok: true, state: "existing" });
    }
    return sendJson(res, 200, { ok: false, reason: "database_unavailable" });
  } catch (error) {
    console.log("[subscribe] threw " + String(error && error.message));
    return sendJson(res, 200, { ok: false, reason: "database_unavailable" });
  }
}

/* The limiter is advisory, not a vault: if the counter cannot be read or
   written the request is allowed through rather than losing a real signup. A
   counter failure is logged, never surfaced as a fake number. */
async function withinBudget(client, bucket, day) {
  try {
    const bumped = await client.rpc("mue_bump_rate_hit", {
      p_key: bucket,
      p_day: day,
      p_limit: MAX_SUBSCRIBES_PER_DAY,
    });
    /* The function increments the bucket and answers "still allowed?". */
    if (!bumped.error && typeof bumped.data === "boolean") {
      return { allowed: bumped.data };
    }
    console.log("[subscribe] limiter rpc unavailable " + String(bumped.error && bumped.error.code));
    const fallback = await client
      .from("web_rate_hits")
      .select("hits")
      .eq("key", bucket)
      .eq("day", day)
      .limit(1);
    if (fallback.error) return { allowed: true };
    const current = Array.isArray(fallback.data) && fallback.data.length ? Number(fallback.data[0].hits) || 0 : 0;
    if (current >= MAX_SUBSCRIBES_PER_DAY) return { allowed: false };
    await client
      .from("web_rate_hits")
      .upsert({ key: bucket, day: day, hits: current + 1, updated_at: new Date().toISOString() }, {
        onConflict: "key,day",
      });
    return { allowed: true };
  } catch (error) {
    console.log("[subscribe] limiter threw " + String(error && error.message));
    return { allowed: true };
  }
}
