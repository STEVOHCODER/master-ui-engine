/* Shared owner-authentication primitives.

   The expected password is stored only as a salted scrypt hash in
   ADMIN_PASSWORD_HASH. ADMIN_SESSION_SECRET signs an owner session; neither
   secret is exposed to the browser. */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "mue_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SCRYPT_KEY_LENGTH = 64;

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function equalText(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function normalizeUsername(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 128);
}

export function adminConfigured(env = process.env) {
  return Boolean(
    normalizeUsername(env.ADMIN_USERNAME) &&
      typeof env.ADMIN_PASSWORD_HASH === "string" &&
      env.ADMIN_PASSWORD_HASH &&
      typeof env.ADMIN_SESSION_SECRET === "string" &&
      env.ADMIN_SESSION_SECRET.length >= 32
  );
}

export function createPasswordHash(password, env = {}) {
  const salt = randomBytes(16);
  const cost = Number(env.ADMIN_SCRYPT_N || 16384);
  const blockSize = Number(env.ADMIN_SCRYPT_R || 8);
  const parallelism = Number(env.ADMIN_SCRYPT_P || 1);
  const hash = scryptSync(String(password), salt, SCRYPT_KEY_LENGTH, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: 64 * 1024 * 1024,
  });
  return [
    "scrypt",
    cost,
    blockSize,
    parallelism,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export function verifyAdminPassword(username, password, env = process.env) {
  const expectedUsername = normalizeUsername(env.ADMIN_USERNAME);
  const stored = String(env.ADMIN_PASSWORD_HASH || "");
  if (!expectedUsername || !stored) return false;
  if (!equalText(normalizeUsername(username), expectedUsername)) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelism = Number(parts[3]);
  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  if (!Number.isInteger(cost) || !Number.isInteger(blockSize) || !Number.isInteger(parallelism)) return false;
  if (!salt.length || expected.length !== SCRYPT_KEY_LENGTH) return false;

  const actual = scryptSync(String(password || ""), salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelism,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actual, expected);
}

export function createSessionToken(username, env = process.env) {
  const payload = {
    u: normalizeUsername(username),
    e: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    n: randomBytes(12).toString("hex"),
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", env.ADMIN_SESSION_SECRET)
    .update(body)
    .digest("base64url");
  return body + "." + signature;
}

export function verifySessionToken(token, env = process.env) {
  if (typeof token !== "string" || token.length > 4096) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", env.ADMIN_SESSION_SECRET || "")
    .update(body)
    .digest("base64url");
  if (!equalText(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body));
    const username = normalizeUsername(payload.u);
    if (!username || !equalText(username, normalizeUsername(env.ADMIN_USERNAME))) return null;
    if (!Number.isFinite(payload.e) || payload.e * 1000 <= Date.now()) return null;
    return { username: username, expiresAt: payload.e };
  } catch {
    return null;
  }
}

export function sessionCookie(token, secure = true) {
  return [
    ADMIN_COOKIE + "=" + token,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + SESSION_TTL_SECONDS,
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearedSessionCookie(secure = true) {
  return [ADMIN_COOKIE + "=deleted", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0", secure ? "Secure" : null]
    .filter(Boolean)
    .join("; ");
}

export function adminSession(req, env = process.env) {
  const header = String(req.headers.cookie || "");
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== ADMIN_COOKIE) continue;
    const token = decodeURIComponent(part.slice(separator + 1).trim());
    return verifySessionToken(token, env);
  }
  return null;
}

export function requestIsSecure(req) {
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  return forwarded === "https" || String(req.headers.host || "").endsWith(".vercel.app");
}

/* Vercel compiles every file in api/ into a function and requires a default
   export; this module is a helper library, so its "route" answers 404 and never
   touches a credential, a cookie or the database. */
export default function handler(_req, res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: false, reason: "not_found" }));
}

/* Node-only module, shared by the login, session, data and stats functions.
   Vercel's edge middleware verifies the same cookie with Web Crypto instead,
   because node:crypto is not available there. */
