/* Local dev server for the site: static files with the same clean URLs Vercel
   uses, plus /api/* wired to the real serverless functions so track, stats and
   subscribe can be exercised before deploy. Reads SUPABASE_URL and
   SUPABASE_SERVICE_ROLE_KEY from the environment or site/.env.local. */
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8820);
const ROUTES = ["/library", "/templates", "/preview", "/agents", "/admin", "/admin/login", "/privacy"];

loadEnv(join(SITE, ".env.local"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".jsx": "text/plain; charset=utf-8",
  ".vue": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function fileFor(pathname) {
  if (pathname === "/") return join(SITE, "index.html");
  if (pathname === "/analytics" || pathname === "/analytics.html") return null;
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const direct = join(SITE, safe);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  /* /admin resolves to admin/index.html, the way Vercel serves it. */
  const index = join(direct, "index.html");
  if (existsSync(index) && statSync(index).isFile()) return index;
  const html = direct + ".html";
  if (!extname(safe) && existsSync(html) && ROUTES.includes(pathname)) return html;
  return null;
}

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

const api = {
  "/api/track": () => import("./api/track.js"),
  "/api/stats": () => import("./api/stats.js"),
  "/api/subscribe": () => import("./api/subscribe.js"),
  "/api/admin/login": () => import("./api/admin/login.js"),
  "/api/admin/session": () => import("./api/admin/session.js"),
  "/api/admin/data": () => import("./api/admin/data.js"),
};

const REDIRECTS = { "/analytics": "/admin", "/analytics.html": "/admin" };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:" + PORT);
  const handler = api[url.pathname];
  if (handler) {
    res.status = (code) => { res.statusCode = code; return res; };
    try {
      const mod = await handler();
      await mod.default(req, res);
    } catch (error) {
      send(res, 500, JSON.stringify({ ok: false, reason: "local_function_error", error: String(error && error.message) }), "application/json");
    }
    return;
  }

  const redirected = REDIRECTS[url.pathname];
  if (redirected) {
    res.writeHead(307, { Location: redirected, "Cache-Control": "no-store" });
    res.end();
    return;
  }

  const file = fileFor(url.pathname);
  if (!file) {
    send(res, 404, "Not found\n");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  console.log("site → http://127.0.0.1:" + PORT + "/");
  console.log(missing.length
    ? "functions will answer 503 until " + missing.join(" and ") + " is set"
    : "functions configured — /api/track, /api/stats and /api/subscribe are live");
});
