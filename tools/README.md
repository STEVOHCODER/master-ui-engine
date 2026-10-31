# tools/

Everything here is plain Node with no dependencies, runs from anywhere in the
repo, and answers the two questions an agent asks before drawing a UI:
**"does this library already have it?"** and **"what exactly do I copy?"**

```
node tools/mue.js help
```

## mue.js — the recall API

`showcase/data/component-catalog.json` is the index; each preview's
`MUE:META` header is the per-file truth; `styles/components.css` is split into
`#region` blocks that are the unit of reuse. `mue.js` reads all three so you
never load a 3004-line sheet or a 700-line preview into context to answer one
question.

| Command | Answers |
|---|---|
| `search "pricing table"` | which preview looks like what I want, ranked, with the regions it uses |
| `show <id>` | its header, the three tags to link, the CSS to lift, and the copy-ready markup |
| `regions` | the copy units in the shared sheet and the classes each defines |
| `region buttons cards` | that CSS verbatim — the whole answer, no sheet read |
| `usage .btn-primary` | which region defines a class, which previews use it |
| `tokens --filter radius` | every custom property, value, and the file that declares it |
| `head <file>` | structured `MUE:META` — `SHEET`, `THEME`, `VARIANTS`, `VERIFIED` |
| `scaffold page.html --use a,b` | a page wired to the shared sheet, holding that markup, born with a valid header |
| `check <file\|all>` | unresolved classes, dead header comments, missing metadata |
| `doctor` | catalog ↔ header ↔ sheet consistency plus the conversion backlog |
| `serve` | the visual lab at `http://127.0.0.1:8791` |

Add `--json` to any command. `search`, `show`, and `region` are the trio that
replaces "generate something generic": find it, read its contract, lift its CSS.

## audit/

- `serve.js` — static server rooted at the repo root, `/__audit__/` maps here.
  Traversal-guarded, `no-store`. `--port` or `MUE_PORT`.
- `check-classes.js` — the single-file gate: header comment count, the three
  links, classes with no definition anywhere, raw triplets used bare, solid
  `-50` tints where `--tint-*` belongs, hardcoded motion, brace balance.
- `harness.js` — browser module loaded by the lab. Measures real contrast in
  both themes and horizontal overflow at 320/375/768/1280 inside iframes, then
  batch-reports. Run it after a visual change; the static gate cannot see paint.
- `snapshot-headers.js` — dumps every `MUE:META` block to JSON. Diff it before
  and after any bulk rewrite of headers.
- `CONVERSION-SPEC.md` — the step-by-step procedure for turning a
  self-contained preview into a sheet-backed one.

`mue check` is the same gate with a batch driver; `check-classes.js` stays for
per-file detail.

## Rules

Nothing in `tools/` writes to `design-tokens/`, `styles/components.css`, or
`styles/mue.js` — those are edited centrally, never by a page conversion.
`showcase/data/build-catalog.ps1` regenerates headers and is preserve-first:
it rebuilds derived fields and keeps descriptive prose it finds in the file.
