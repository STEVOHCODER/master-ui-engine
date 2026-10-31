// Snapshot the MUE:META block of every preview so a build-catalog.ps1 run can be
// diffed field by field instead of eyeballed.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const out = {};
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "showcase" || e.name.startsWith(".")) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (e.name.endsWith(".html")) {
      const t = fs.readFileSync(p, "utf8");
      const m = t.match(/<!-- BEGIN MUE:META[\s\S]*?END MUE:META -->/);
      const head = t.slice(0, t.indexOf("</head>"));
      const comments = (head.match(/<!--/g) || []).length;
      out[path.relative(ROOT, p).replace(/\\/g, "/")] = {
        block: m ? m[0] : null,
        headComments: comments,
        linksSheet: /styles\/components\.css/.test(head),
        linksScript: /styles\/mue\.js/.test(head),
      };
    }
  }
})(ROOT);
const target = process.argv[2];
if (!target) {
  console.error("usage: snapshot-headers.js <outfile>");
  process.exit(2);
}
fs.writeFileSync(target, JSON.stringify(out, null, 1));
const withBlock = Object.values(out).filter((v) => v.block).length;
const twoComment = Object.entries(out).filter(([, v]) => v.headComments > 1).map(([k]) => k);
console.log("files:", Object.keys(out).length, "| with MUE:META:", withBlock);
console.log("heads with more than one comment (parser hazard):", twoComment.length ? twoComment.join(", ") : "none");
