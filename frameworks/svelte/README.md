# Svelte 5 binding — planned, not implemented

**Status: planned — no source files, nothing verified.**
There are no `.svelte` files, no `package.json`, no build script and no preview
in this directory today. Everything in
[`ARCHITECTURE.md`](./ARCHITECTURE.md) is a design proposal that has never been
compiled, rendered or audited. Do not treat it as evidence that any of it works.

Only React, Vue and Web Components have code in `frameworks/`; this package is
the `planned` row in [`../README.md`](../README.md), with no bundle, no committed
preview and no entry in the support log.

## What this package will contain

The same sixteen components the other bindings carry, each one a thin wrapper
over classes that already exist in `styles/components.css`:

`button`, `input`, `textarea`, `select`, `checkbox`, `radio`, `switch`, `card`,
`badge`, `dialog`, `dropdown`, `tabs`, `accordion`, `table`, `notification`
(alert + toast), `avatar` (+ group).

Plus, when the work is done: `src/lib` component sources, a static preview that
builds inside the repo (`frameworks/svelte/preview/preview.js`), `build.mjs`, and
a `MUE:META` header in every source file.

## What you must NOT assume

- **No npm package exists.** Nothing is published; there is no install command to
  write here yet.
- **No preview exists.** No URL, no screenshot, no demo page renders this.
- **No support-matrix claim.** `docs/framework-support.md` exists, but its Svelte row is
  "— no source to compile", and `frameworks/registry.json` lists `mue-svelte` with
  `components: 0` and no source paths; the matrix is generated from that registry, not by hand.
- **No performance, bundle-size or SSR claim.** Nothing has been measured.
- **Not every API named in ARCHITECTURE.md has been re-checked against a Svelte
  release here.** Toolchain versions and a few open choices are left unresolved
  on purpose; read that file's "Open questions" before writing code.

## Contract it inherits (read first, it is binding)

- [`../../frameworks/README.md`](../../frameworks/README.md) — the seven rules:
  design lives only in `styles/components.css` + `design-tokens/engine.css`,
  bindings add markup and behaviour only, variants map to existing modifier
  classes, theming comes from `html.dark`, `MUE:META` in every source file, no
  extra runtime dependency, previews are static files on Vercel with no runtime
  CDN.
- [`../../docs/framework-support.md`](../../docs/framework-support.md) — the support matrix and
  the rule behind it; dated results live in `frameworks/registry.json` per binding.
