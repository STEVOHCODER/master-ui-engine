/* Static server for the library, with this folder exposed at /__audit__/ so a
   browser page can import harness.js same-origin. Zero dependencies.

     node tools/audit/serve.js [--port 8791]

   Use it for three things: the visual lab over http (so "Copy + CSS" can fetch
   the sheet instead of falling back to a link note), screenshot capture, and
   running tools/audit/harness.js inside a page. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
};

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const PORT = Number(arg("--port", process.env.MUE_PORT || 8791));

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    // /__audit__/ maps into this folder; everything else into the repo root.
    const inAudit = url.startsWith("/__audit__/");
    const base = inAudit ? __dirname : ROOT;
    const rel = inAudit ? url.slice("/__audit__/".length) : url;
    const file = path.normalize(path.join(base, rel === "/" || rel === "" ? "index.html" : rel));
    // Never serve a file outside the folder the request maps into.
    if (file !== base && !file.startsWith(base + path.sep)) {
      res.writeHead(403);
      return res.end("outside the served root");
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("not found: " + url);
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        // Previews are edited in place; a cached stylesheet hides the change.
        "Cache-Control": "no-store",
      });
      res.end(buf);
    });
  })
  .listen(PORT, "127.0.0.1", () => {
    console.log("serving " + ROOT);
    console.log("  lab      http://127.0.0.1:" + PORT + "/showcase/index.html");
    console.log("  harness  http://127.0.0.1:" + PORT + "/__audit__/harness.js");
  });
