# Deployment

## Website (Vercel + Supabase)

The product site lives in `site/`. It is a static HTML/CSS/JS site with three
Node serverless functions beside it, so the whole deploy is one Vercel project
plus one Supabase project. No build step, no framework runtime.

```
site/
  index.html  library.html  templates.html  preview.html  agents.html
  admin.html  admin-login.html  privacy.html
  assets/     web.css  web.js  library.css  library.js  admin.css  admin.js  analytics.js  img/
  api/        track.js  stats.js  subscribe.js  _lib.js  _admin.js  admin/login.js  admin/session.js  admin/data.js
  middleware.js                     <- edge route guard for /admin and /api/stats
  tools/      admin-credentials.mjs <- creates the owner password hash locally (not deployed)
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
   `/admin`, `/admin/login` and `/privacy` to their `.html` files, and adds the
   `X-Robots-Tag: noindex` header to the console.
4. **Environment Variables**. Three of these connect the analytics, three more
   open the owner console. The Supabase pair and `SITE_URL` go on *Production*,
   *Preview* and *Development*; the `ADMIN_*` trio only needs *Production*,
   because a preview deployment that cannot sign in shows a clear
   `admin_not_configured` rather than a fake dashboard.

   | Name | Value | Notes |
   | --- | --- | --- |
   | `SUPABASE_URL` | `https://<ref>.supabase.co` | Project URL from step 1.5 |
   | `SUPABASE_SERVICE_ROLE_KEY` | the `service_role` secret | **Sensitive** — tick the encrypt flag |
   | `SITE_URL` | `https://your-domain` | used for canonical/og URLs; not read by the functions |
   | `ADMIN_USERNAME` | the owner login name | matched exactly, case-sensitive |
   | `ADMIN_PASSWORD_HASH` | `scrypt$N$r$p$salt$digest` | output of `site/tools/admin-credentials.mjs`; never a password |
   | `ADMIN_SESSION_SECRET` | 32+ random characters | signs the session cookie; rotating it signs everyone out |

   The functions are deliberately dumb about configuration: with either
   Supabase variable missing they answer `200 {"ok":false,"available":false,
   "reason":"not_configured"}` and the dashboard prints *unavailable* instead of
   zeros. So an env var typo shows up as a stated fact, not as fake traffic.
5. **Deploy**. Add `@supabase/supabase-js` to `site/package.json` (already
   declared there) and let Vercel install it during the build — nothing is
   vendored into the repo.

### 3. Smoke test the pipe (2 minutes, before you tell anyone)

Locally first, with no deploy: put the two Supabase values (plus the three
`ADMIN_*` values from `site/.env.admin`) in `site/.env.local`, git-ignored, and
run `npm start` inside `site/` — `serve.mjs` imports the same handler files, so
`http://127.0.0.1:8820/admin` renders the real console after you sign in at
`/admin/login`. `Origin` must match the host, which it does from that page. Then
the same checks against the deployed app:

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

# 3. the numbers are not public
curl https://YOUR-APP.vercel.app/api/stats?days=7
# -> {"ok":false,"available":false,"error":"authentication_required"}  (HTTP 401)

# 4. sign in, then read them
curl -c /tmp/mue-jar -X POST https://YOUR-APP.vercel.app/api/admin/login \
  -H 'Origin: https://YOUR-APP.vercel.app' -H 'Content-Type: application/json' \
  -d '{"username":"YOU","password":"FROM-ADMIN-PASSWORD-HASH"}'
curl -b /tmp/mue-jar 'https://YOUR-APP.vercel.app/api/stats?days=7'
# totals.views / visitors / countries / events / subscribers, comparison{deltas},
# series[], top_paths[], top_countries[], top_referrers[], top_targets[],
# events{}, all_time{}, coverage.truncated
rm -f /tmp/mue-jar
```

Then open the site in a normal browser, copy a snippet, switch the theme, and
reload `/admin` — the `copy_code` and `theme_switch` counters must move.
Nothing on this site is a sample or an estimate, so if a number does not move the
instrument is broken, not the marketing.

### 4. The owner console

`/admin` is the dashboard, and it is not public. Four pieces hold it shut:

1. **Credentials, as Vercel secrets.** `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`
   and `ADMIN_SESSION_SECRET` are read by the functions; none of them is a
   password. Create all three locally without typing the password into a command
   argument:

   ```bash
   cd site
   node tools/admin-credentials.mjs --username you --generate   # prints .env.admin
   set -o pipefail && grep '^ADMIN_PASSWORD_HASH=' .env.admin | cut -d= -f2- \
     | vercel env add ADMIN_PASSWORD_HASH production
   set -o pipefail && grep '^ADMIN_SESSION_SECRET=' .env.admin | cut -d= -f2- \
     | vercel env add ADMIN_SESSION_SECRET production
   echo -n 'you' | vercel env add ADMIN_USERNAME production
   shred -u .env.admin        # or rm .env.admin — the hash lives in Vercel now
   ```

   `ADMIN_PASSWORD_HASH` is `scrypt$N$r$p$salt$digest`; the raw password is never
   stored, logged or compared with `===`. Rotate by re-running the tool and
   re-adding the two secret values.

2. **A signed session cookie.** Login sets `mue_admin_session` —
   base64 payload + HMAC-SHA256 over `ADMIN_SESSION_SECRET`, `HttpOnly`,
   `SameSite=Lax`, `Secure`, eight hours. `api/_admin.js` verifies it in the
   functions and `middleware.js` verifies the same signature with Web Crypto at
   the edge, because `node:crypto` does not exist there.

3. **Middleware in front of the routes.** `site/middleware.js` matches `/admin`,
   `/admin/login`, `/api/stats` and `/api/admin/:path*`. Without a valid cookie,
   an HTML request is redirected to `/admin/login` and an API request gets a
   `401 { ok: false, error: "authentication_required" }`. `/analytics` now
   redirects to `/admin`. Each function re-checks the session anyway, so a
   routing change cannot silently expose the data.

4. **Rate limiting that the owner cannot lock out.** `api/admin/login.js` reads
   today's counter from `web_rate_hits` first, then verifies the password and
   increments only on a miss — so ten bad guesses close the door until the next
   UTC day, but your own successful sign-ins cost nothing. A failed counter read
   returns `503` rather than allowing unmeasured guesses.

`/api/track` and `/api/subscribe` stay public: they are the collector and the
waitlist form, they are origin-guarded and bot-filtered, and Vercel Deployment
Protection would challenge real visitors on a `sendBeacon`. If you also want the
hosting-layer gate, protect `/admin` only and keep both write endpoints excluded.

Records are reachable from the console itself: `api/admin/data.js` lists page
views, events and waitlist rows newest-first and erases one visitor (views,
events and membership rows) or one address on request. The Supabase role used by
the functions needs `delete` on those tables, which `supabase/schema.sql` grants.

If Vercel refuses to build `middleware.js` for your framework preset, the site
still fails closed: the functions answer `401` on their own, so the dashboard
renders its "session expired" state instead of data. Delete the file and route
protection then lives entirely in `api/_admin.js`.

### 5. Canonical URLs and the last mile

- Point `SITE_URL` and the `<link rel="canonical">` / `og:url` values in
  `index.html`, `library.html`, `templates.html`, `agents.html`, `privacy.html`
  at the real domain (a custom domain changes every one of them). `privacy.html`
  currently carries `https://master-ui-engine.vercel.app/privacy` with an HTML
  comment marking it for replacement. `SITE_URL` is documentation only: the
  functions derive the allowed origin from `x-forwarded-host`, so a wrong
  `SITE_URL` cannot lock out your own visitors.
- `admin.html` and `admin-login.html` ship `noindex, nofollow`, carry a
  `X-Robots-Tag` header, are disallowed in `robots.txt`, and do **not** load
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
