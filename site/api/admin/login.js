/* POST /api/admin/login
   Validates the owner credential against ADMIN_PASSWORD_HASH and establishes a
   signed, HttpOnly session cookie. The password itself is never logged, stored,
   or echoed in an error. */

import {
  adminConfigured,
  createSessionToken,
  requestIsSecure,
  sessionCookie,
  verifyAdminPassword,
} from "../_admin.js";
import {
  collectBody,
  createSupabaseClient,
  isoDay,
  originAllowed,
  parseJsonBody,
  rateKey,
  sendJson,
} from "../_lib.js";

const LOGIN_LIMIT_PER_DAY = 10;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }
  if (!originAllowed(req.headers.origin, req.headers["x-forwarded-host"] || req.headers.host || "")) {
    return sendJson(res, 403, { ok: false, error: "origin_forbidden" });
  }
  if (!adminConfigured(process.env)) {
    return sendJson(res, 503, { ok: false, error: "admin_not_configured" });
  }

  let parsed;
  try {
    parsed = parseJsonBody(await collectBody(req, 8192));
  } catch {
    return sendJson(res, 413, { ok: false, error: "payload_too_large" });
  }
  if (!parsed || typeof parsed.username !== "string" || typeof parsed.password !== "string") {
    return sendJson(res, 400, { ok: false, error: "invalid_payload" });
  }
  if (parsed.username.length > 128 || parsed.password.length > 512) {
    return sendJson(res, 400, { ok: false, error: "invalid_payload" });
  }

  const { client } = await createSupabaseClient(process.env);
  if (!client) return sendJson(res, 503, { ok: false, error: "database_unavailable" });

  /* The counter is read before the check and written only on a wrong password,
     so ten failed guesses close the door for the day without a successful
     sign-in ever spending budget. If the counter cannot be read the endpoint
     fails closed rather than allowing an unmeasured brute force. */
  const attemptKey = rateKey("admin-login", process.env.ADMIN_USERNAME.trim());
  const today = isoDay(Date.now());
  const counter = await client
    .from("web_rate_hits")
    .select("hits")
    .eq("key", attemptKey)
    .eq("day", today)
    .maybeSingle();
  if (counter.error) return sendJson(res, 503, { ok: false, error: "database_unavailable" });
  if (counter.data && Number(counter.data.hits) >= LOGIN_LIMIT_PER_DAY) {
    return sendJson(res, 429, { ok: false, error: "login_rate_limited", retry_after: "the next UTC day" });
  }

  const valid = verifyAdminPassword(parsed.username, parsed.password, process.env);
  if (!valid) {
    await client.rpc("mue_bump_rate_hit", {
      p_key: attemptKey,
      p_day: today,
      p_limit: LOGIN_LIMIT_PER_DAY,
    });
    await delay(350);
    return sendJson(res, 401, { ok: false, error: "invalid_credentials" });
  }

  const token = createSessionToken(process.env.ADMIN_USERNAME, process.env);
  res.setHeader("Set-Cookie", sessionCookie(token, requestIsSecure(req)));
  return sendJson(res, 200, { ok: true, signed_in: true });
}
