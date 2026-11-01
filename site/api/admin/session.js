/* GET /api/admin/session — report whether the owner cookie is valid.
   DELETE /api/admin/session — end the session. No credential material is
   returned; the username is deliberately omitted from public responses. */

import {
  adminConfigured,
  adminSession,
  clearedSessionCookie,
  requestIsSecure,
} from "../_admin.js";
import { originAllowed, sendJson } from "../_lib.js";

export default async function handler(req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    const signedIn = adminConfigured(process.env) && Boolean(adminSession(req, process.env));
    return sendJson(res, 200, { ok: true, signed_in: signedIn });
  }

  if (req.method === "DELETE") {
    if (!originAllowed(req.headers.origin, req.headers["x-forwarded-host"] || req.headers.host || "")) {
      return sendJson(res, 403, { ok: false, error: "origin_forbidden" });
    }
    res.setHeader("Set-Cookie", clearedSessionCookie(requestIsSecure(req)));
    return sendJson(res, 200, { ok: true, signed_in: false });
  }

  return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}
