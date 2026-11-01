# Deployment

## Website (Vercel + Supabase)

The product site lives in `site/`. It is a static HTML/CSS/JS site with three
Node serverless functions beside it, so the whole deploy is one Vercel project
plus one Supabase project. No build step, no framework runtime.

```
site/
  index.html  library.html  templates.html  preview.html  agents.html
  analytics.html  privacy.html          (this file's author owns analytics + privacy)
  assets/     web.css  web.js  library.css  library.js  analytics.js  img/
  api/        track.js  stats.js  subscribe.js  _lib.js
  engine/     <- copied from styles/, design-tokens/, components/, examples/,
                templates/, showcase/ by site/build.mjs (generated, not committed)
  vercel.json cleanUrls + the extensionless rewrites + security headers
  package.json  "type": "module", the @supabase/supabase-js dependency, build/start scripts
  serve.mjs   local dev server: static files with the same clean URLs, and
              /api/* wired to the real functions (npm start → http://127.0.0.1:8820)
```

Run it locally before deploying: `cd site && npm install && npm start`. Pages work
with no configuration; the three endpoints answer `not_configured` until
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are in the environment or in an
uncommitted `site/.env.local` (that filename is in `.gitignore`).

`site/api/_lib.js` is the shared helper module. Vercel compiles **every** file in
`api/` into a function and a Node function without a default export fails the
build, so `_lib.js` exports a 404 handler alongside its helpers. It is reachable
as `/api/_lib` and does nothing.

### 1. Supabase (about 4 minutes)

1. <https://supabase.com/dashboard> → **New project**. Any region near your
   visitors; pick a strong database password and write it down. Wait for
   provisioning to finish.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` (repo root), select **all** of it, paste, then
   **Run**. It is idempotent: `create table if not exists`, `create or replace
   function`, explicit grants. Re-running it after an edit is safe and never
   drops rows.
4. Confirm the five tables exist: **Table Editor** should show
   `web_page_views`, `web_events`, `web_visitors`, `web_subscribers`,
   `web_rate_hits`. Confirm the three functions exist: **Database → Functions /
   RPCs** should list `mue_track_visitor`, `mue_bump_rate_hit`,
   `mue_count_distinct_country`. If the tables are there but the functions are
   not, the paste was truncated — run the file again, whole.
5. **Project Settings → API** (the page labelled *Project Access* / *Data API*):
   copy the **Project URL** (`https://<ref>.supabase.co`) and the
   **service_role `secret`** key. Copy the long `service_role` value, **not** the
   `anon` key. The service role key bypasses row-level security, so it belongs on
   the server only: it never appears in `site/assets/`, in a browser request, or
   in this repository.

The tables have RLS enabled and **no policies**, and `anon` / `authenticated`
have no table or function grants at all. The browser never queries Supabase
directly — only the three functions do, with the service role key.

### 2. Vercel

1. <https://vercel.com/new> → **Import Git Repository** → `STEVOHCODER/master-ui-engine`.
2. **Framework Preset**: `Other`. **Root Directory**: `site` — this is the step
   that makes `site/api/track.js` become `POST /api/track`. Press *Edit* next to
   Root Directory and select `site`; if you import before setting it, the deploy
   404s and the functions are never created.
3. **Build Command**: `npm run build` (runs `site/build.mjs`, which copies the
   engine trees into `site/engine/`; the pages link `/engine/design-tokens/engine.css`
   and `/engine/styles/mue.js`, so without it every page is unstyled).
   **Output Directory**: leave empty — with Root Directory `site`, the static
   files *are* `site/`. Vercel installs `site/package.json` for you, which is how
   `@supabase/supabase-js` reaches the functions. `site/vercel.json` is read
   because it sits at the root directory: it keeps `cleanUrls` on, maps
   `/analytics` and `/privacy` to their `.html` files, and adds the
   `X-Robots-Tag: noindex` header to the dashboard.
4. **Environment Variables**, three names on *Production*, *Preview* and
   *Development*:

   | Name | Value | Notes |
   | --- | --- | --- |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` | Project URL from step 1.5 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` secret | **Sensitive** — tick the encrypt flag |
   | `SITE_URL` | `https://your-domain` | used for canonical/og URLs; not read by the functions |

   The functions are deliberately dumb about configuration: with either
   Supabase variable missing they answer `200 {"ok":false,"available":false,
   "reason":"not_configured"}` and the dashboard prints *unavailable* instead of
   zeros. So an env var typo shows up as a stated fact, not as fake traffic.
5. **Deploy**. Add `@supabase/supabase-js` to `site/package.json` (already
   declared there) and let Vercel install it during the build — nothing is
   vendored into the repo.

### 3. Smoke test the pipe (2 minutes, before you tell anyone)

Locally first, with no deploy: put the two Supabase values in `site/.env.local`
(git-ignored) and run `npm start` inside `site/` — `serve.mjs` imports the same
three handler files, so `http://127.0.0.1:8820/analytics` renders the real
dashboard. `Origin` must match the host, which it does from that page. Then the
same checks against the deployed app:

```bash
# 1. a visit, straight to the collector
curl -X POST https://YOUR-APP.vercel.app/api/track \
  -H 'Origin: https://YOUR-APP.vercel.app' \
  -H 'Content-Type: application/json' \
  -d '{"v":"abcdefghijklmnop","p":"/","events":[{"name":"page_view","path":"/"}]}'
# -> {"ok":true,"stored":1}   ({"ok":false,"reason":"not_configured"} = env vars)

# 2. an event
curl -X POST https://YOUR-APP.vercel.app/api/track \
  -H 'Origin: https://YOUR-APP.vercel.app' -H 'Content-Type: application/json' \
  -d '{"v":"abcdefghijklmnop","p":"/library.html","events":[{"name":"copy_code","id":"card-pricing","target":"snippet"}]}'

# 3. the numbers
curl https://YOUR-APP.vercel.app/api/stats?days=7
# totals.views / visitors / countries, series[], top_paths[], top_countries[],
# top_referrers[], top_targets[], events{}, all_time{}, coverage.truncated
```

Then open the site in a normal browser, copy a snippet, switch the theme, and
reload `/analytics` — the `copy_code` and `theme_switch` counters must move.
Nothing on this site is a sample or an estimate, so if a number does not move the
instrument is broken, not the marketing.

### 4. Gate the dashboard

`/analytics` (and `/analytics.html`, which is the same file) is **public to
anyone who has the URL**, and so is `/api/stats` — the JSON the dashboard renders
is the same data with or without the page. The site has no accounts, so the gate
belongs at the hosting layer:

1. Vercel → your project → **Settings → Deployment Protection**.
2. Enable **Vercel Authentication** (invited collaborators / your own Vercel
   account; available on every plan). If you are on Pro or Enterprise,
   **Password Protection** is the simpler choice for a single owner.
3. Set **Protection Mode** to **Every Deployment** — the default only guards
   preview URLs, which leaves production wide open.
4. Add the two write endpoints to **Excluded Paths** so real visitors are not
   challenged on a beacon: `/api/track` and `/api/subscribe`. Leave
   `/api/stats` and `/analytics` protected (the exclusion list is not needed for
   them, and `robots.txt` plus the `noindex` header already keep the dashboard
   out of search). A protected deployment is read through your browser session,
   so the dashboard keeps working for you. The local `serve.mjs` has no such gate
   — never point it at a production Supabase project from a shared machine.
5. Decide deliberately about `/api/subscribe`: it is same-origin-guarded and
   rate-limited, but it is still an open write endpoint. It accepts one
   normalized address per submission, ignores duplicates, and stores nothing else.

Vercel's plan gating and the exact labels in these panels change; if a toggle is
not where it is described above, look for the same three concepts — an auth
method, a scope covering production, and a path exclusion list.

### 5. Canonical URLs and the last mile

- Point `SITE_URL` and the `<link rel="canonical">` / `og:url` values in
  `index.html`, `library.html`, `templates.html`, `agents.html`, `privacy.html`
  at the real domain (a custom domain changes every one of them). `privacy.html`
  currently carries `https://master-ui-engine.vercel.app/privacy` with an HTML
  comment marking it for replacement. `SITE_URL` is documentation only: the
  functions derive the allowed origin from `x-forwarded-host`, so a wrong
  `SITE_URL` cannot lock out your own visitors.
- `analytics.html` ships `noindex, nofollow` and does **not** load
  `/assets/analytics.js`, so the owner's own visits never inflate the numbers.
- Library search text: `library.js` reports a search as
  `mueTrack("library_search", { id: <typed text> })`. `STORE_SEARCH_TERMS` in
  `site/api/_lib.js` is `false`, so `/api/track` stores the *count* of searches
  and drops the words before insert; `library_search` never appears in
  `top_targets`. Set it to `true` only if you decide you want the queries, and
  then say so on the privacy page in the same commit.
- If you add pages: `<script defer src="/assets/analytics.js"></script>` and then
  `window.mueTrack("event_name", { id, path, target })` for anything worth
  counting. The event vocabulary is fixed in `site/api/_lib.js` (`EVENT_NAMES`)
  and enforced again by a `check` constraint in `web_events.name` — an unknown
  name is dropped by the collector, and a renamed event is a schema migration,
  not a string change.
- The privacy notice is the contract for what these tables hold: path, country
  code, referrer hostname, anonymous id. There is no IP column and no user-agent
  column in `supabase/schema.sql`, so adding one is a visible decision rather
  than a quiet `INSERT` change.

### 6. Deleting data when someone asks

Run in the Supabase SQL editor (the queries are also the last section of
`supabase/schema.sql`):

```sql
delete from public.web_page_views where vid = '<mue-vid>';
delete from public.web_events     where vid = '<mue-vid>';
delete from public.web_visitors   where vid = '<mue-vid>';
delete from public.web_subscribers where email = '<address>';
```

### 7. Where the catalogue comes from

`showcase/data/component-catalog.json` is **generated** from the `MUE-ASSET`
blocks in the source files and drives the library page, the search count, the
copy counters and the dashboard totals. It is never edited by hand. After any
engine asset change run `node tools/mue.js catalog --write` from the repo root
and verify with the read-only `node tools/mue.js catalog`. A site deploy that
skips the regeneration ships a library page whose counts disagree with the
files in the repo. See `AGENTS.md` for the full build order and the gate list.

### What is not covered here

- No live Supabase project was available while this was written, so the
  Supabase calls in `site/api/*.js` are verified against the v2 client API and
  the schema, not executed end to end. The steps above are the verification.
- The site is one Vercel project on a hobby plan; Vercel's function-invocation
  and bandwidth limits apply to the beacons. `SCAN_LIMIT` in `site/api/_lib.js`
  caps one stats request at 5,000 rows per table and the dashboard prints a
  warning when a window hits that cap instead of quietly undercounting.
