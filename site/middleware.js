/* Route protection for the owner dashboard.
   Vercel runs this before static assets and API functions. The cookie signature
   is verified with Web Crypto, so the dashboard and stats API cannot be reached
   by a browser that only knows the URL. */

import { NextResponse } from "next/server";

export const config = {
  matcher: ["/admin", "/admin/login", "/api/admin/:path*", "/api/stats", "/analytics"],
};

const ADMIN_COOKIE = "mue_admin_session";

function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    cookies[part.slice(0, separator).trim()] = decodeURIComponent(part.slice(separator + 1).trim());
  }
  return cookies;
}

function bytesFromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function base64UrlFromBytes(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function verifySession(header) {
  const token = parseCookies(header)[ADMIN_COOKIE];
  const secret = String(process.env.ADMIN_SESSION_SECRET || "");
  const username = String(process.env.ADMIN_USERNAME || "").trim();
  if (!token || secret.length < 32 || !username) return false;

  const separator = token.lastIndexOf(".");
  const body = token.slice(0, separator);
  const supplied = token.slice(separator + 1);
  if (separator < 1 || !body || !supplied) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = base64UrlFromBytes(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))));
  if (!equalBytes(bytesFromBase64Url(supplied), bytesFromBase64Url(expected))) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(bytesFromBase64Url(body)));
    return payload.u === username && Number.isFinite(payload.e) && payload.e * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/analytics") {
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  if (path === "/api/admin/login") return NextResponse.next();

  let signedIn = false;
  try {
    signedIn = await verifySession(request.headers.get("cookie"));
  } catch {
    signedIn = false;
  }

  if (signedIn) {
    if (path === "/admin/login") {
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url, 307);
    }
    return NextResponse.next();
  }

  if (path === "/admin/login") return NextResponse.next();

  if (path.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ ok: false, error: "authentication_required" }), {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url, 307);
}
