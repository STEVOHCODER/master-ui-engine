/* Static gate for a MASTER-UI-ENGINE preview.
   Usage:  node tools/audit/check-classes.js <file.html> [more.html ...]
   Or:     node tools/mue.js check all
   Reports, per file:
     HEAD       comments inside <head> (must be exactly 1 = the MUE:META block)
     LINKS      whether engine.css / components.css / mue.js are linked
     UNRESOLVED class tokens used in markup that no stylesheet defines
     DUPES      local <style> rules whose selector also exists in the shared sheet
     RAWPRIM    a raw HSL-triplet primitive used without hsl()  (silently dropped)
     SUBLTINT   solid -50 tint fill, which does not flip in dark mode
     MOTION     hardcoded durations / scroll-behavior:smooth in a local <style>
     BALANCE    brace balance of each local <style>
     BODY       the <body> class attribute
*/
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");

const shared = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith(".css")) shared.push(fs.readFileSync(p, "utf8"));
  }
}
walk(path.join(ROOT, "styles"));
walk(path.join(ROOT, "design-tokens"));
const SHARED = shared.join("\n");
const SHEET = fs.readFileSync(path.join(ROOT, "styles/components.css"), "utf8");
const JS = fs.readFileSync(path.join(ROOT, "styles/mue.js"), "utf8");

const strip = (s, re) => s.replace(re, (m) => m.replace(/[^\n]/g, " "));

for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, "utf8");
  const head = src.slice(src.indexOf("<head>"), src.indexOf("</head>"));
  const local = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const localSheets = [...src.matchAll(/<link[^>]+href="([^"]*\.css)"/g)].map((m) => m[1]);

  // markup only: no scripts, no <style>, no escaped code samples
  let markup = src;
  markup = strip(markup, /<script[\s\S]*?<\/script>/g);
  markup = strip(markup, /<style[\s\S]*?<\/style>/g);
  markup = strip(markup, /<pre[\s\S]*?<\/pre>/g);
  markup = strip(markup, /<code[\s\S]*?<\/code>/g);
  markup = strip(markup, /<textarea[\s\S]*?<\/textarea>/g);
  const tokens = new Set();
  for (const m of markup.matchAll(/\bclass="([^"]*)"/g))
    for (const t of m[1].split(/[\s]+/)) if (t && !t.includes("${") && !t.includes("{{")) tokens.add(t);

  const defines = (text, t) => new RegExp("\\." + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])").test(text);
  const unresolved = [...tokens].filter(
    (t) => !defines(local, t) && !defines(SHARED, t) && !JS.includes("'" + t + "'") && !JS.includes('"' + t + '"')
  );

  const dupes = [];
  for (const m of local.matchAll(/([^{}]+)\{/g)) {
    const sel = m[1].split(/\s*,\s*/).map((s) => s.trim()).filter((s) => /^[.#][\w][\w .>:#()-]*$/.test(s));
    for (const s of sel) {
      const leaf = s.split(/[\s>+~]+/).pop();
      const cls = (leaf.match(/\.[\w-]+/g) || []).join(" ");
      if (!cls || !leaf.startsWith(".")) continue;
      const inSheet = SHEET.split("\n").some(
        (line) => line.trim().endsWith("{") && line.trim().slice(0, -1) === leaf.trim()
      );
      if (inSheet && !dupes.includes(cls)) dupes.push(cls);
    }
  }

  const rawPrim = [...SHARED, local].join("\n").match(/:\s*var\(--color-[\w-]+\)\s*[;}]/g) || [];
  const badTint = (local.match(/hsl\(var\(--color-[\w]+-(?:50|100)\)\)/g) || []).length;
  const hardMotion = (local.match(/(?:transition|animation)[^;]*?\d+(?:ms|s)\b/g) || []).filter((x) => !x.includes("var("));
  const smooth = /scroll-behavior\s*:\s*smooth/.test(local) || /scroll-behavior\s*:\s*smooth/.test(src.replace(/<style[\s\S]*?<\/style>/g, ""));
  const braces = [...local].reduce((d, c) => (c === "{" ? d + 1 : c === "}" ? d - 1 : d), 0);

  console.log("\n### " + file.replace(/\\/g, "/"));
  console.log(
    "  HEAD comments:",
    (head.match(/<!--/g) || []).length,
    "| LINKS engine:",
    +/engine\.css/.test(src),
    "sheet:",
    +/styles\/components\.css/.test(src),
    "mue.js:",
    +/styles\/mue\.js/.test(src),
    "| unlinked css:",
    localSheets.length
  );
  console.log("  BODY:", (src.match(/<body[^>]*>/) || ["(none)"])[0].slice(0, 60));
  console.log("  UNRESOLVED(" + unresolved.length + "):", unresolved.join(", ") || "-");
  console.log("  DUPES(" + dupes.length + "):", dupes.join(", ") || "-");
  console.log("  RAWPRIM in shared+local:", rawPrim.length ? rawPrim.join(" | ") : "0");
  console.log("  SUBLTINT:", badTint, "| HARDCODED-MOTION:", hardMotion.length ? hardMotion.slice(0, 4).join(" | ") : 0, "| SMOOTH:", smooth);
  console.log("  BALANCE local <style> braces:", braces, "| local <style> lines:", local.split("\n").length);
}
