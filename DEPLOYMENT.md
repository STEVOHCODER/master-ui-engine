# Deployment

## Website (Vercel + Supabase)

The product site lives in `site/`. It is a static HTML/CSS/JS site with three
Node serverless functions beside it, so the whole deploy is one Vercel project
plus one Supabase project. No build step, no framework runtime.

```
site/
  index.html  library.html  templates.html  preview.html  agents.html
  admin/      index.html  login.html    <- owner console, no clean-URL rewrite needed
  privacy.html
  assets/     web.css  web.js  library.css  library.js  admin.css  admin.js  analytics.js  img/
  api/        track.js  stats.js  subscribe.js  _lib.js  _admin.js  admin/login.js  admin/session.js  admin/data.js
  tools/      admin-credentials.mjs <- creates the owner password hash locally (not deployed)
  engine/     <- copied from styles/, design-tokens/, components/, examples/,
                templates/, showcase/, frameworks/ by site/build.mjs (generated, not committed).
                node_modules/, *.lock and the PowerShell helpers are refused by the copier;
                the two framework preview bundles are committed build artifacts, so the
                deployed previews make no CDN request.
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
curl -X POST https://masterinterface.xyz/api/track \
  -H 'Origin: https://masterinterface.xyz' \
  -H 'Content-Type: application/json' \
  -d '{"v":"abcdefghijklmnop","p":"/","events":[{"name":"page_view","path":"/"}]}'
# -> {"ok":true,"stored":1}   ({"ok":false,"reason":"not_configured"} = env vars)

# 2. an event
curl -X POST https://masterinterface.xyz/api/track \
  -H 'Origin: https://masterinterface.xyz' -H 'Content-Type: application/json' \
  -d '{"v":"abcdefghijklmnop","p":"/library.html","events":[{"name":"copy_code","id":"card-pricing","target":"snippet"}]}'

# 3. the numbers are not public
curl https://masterinterface.xyz/api/stats?days=7
# -> {"ok":false,"available":false,"error":"authentication_required"}  (HTTP 401)

# 4. sign in, then read them
curl -c /tmp/mue-jar -X POST https://masterinterface.xyz/api/admin/login \
  -H 'Origin: https://masterinterface.xyz' -H 'Content-Type: application/json' \
  -d '{"username":"YOU","password":"FROM-ADMIN-PASSWORD-HASH"}'
curl -b /tmp/mue-jar 'https://masterinterface.xyz/api/stats?days=7'
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

3. **Authorisation inside every owner route.** There is no edge middleware
   here: Vercel only runs `middleware.js` for a Next.js project, and adding the
   `next` dependency to this static site turns the build into a Next.js build
   that fails ("Couldn't find any `pages` or `app` directory"). Instead every
   owner route checks the cookie itself. `api/stats.js`, `api/admin/data.js` and
   `api/admin/session.js` call `adminSession(req, process.env)` before touching
   the database and answer `401 { ok: false, error: "authentication_required" }`
   without it; `admin.html` asks `GET /api/admin/session` first and bounces to
   `/admin/login` when the answer is `signed_in: false`. `vercel.json` redirects
   the old public `/analytics` path to `/admin`, and `robots.txt` plus the
   `noindex` header keep both admin pages out of search.

   What that means in practice: the two admin HTML files are static shells with
   no numbers in them, so they are world-readable markup, while every figure and
   every row is served only to a holder of a valid signed cookie. If you want
   the pages themselves gated too, turn on Vercel → Settings → Deployment
   Protection for `/admin/*` only and keep `/api/track` and `/api/subscribe`
   out of the protected paths, so real visitors are never challenged on a beacon.

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
Erasure is a `DELETE` with an `Origin` check and no confirmation token, so the
console asks before it sends, and the rows are gone.

### 5. Canonical URLs and the last mile

- **The domain is `https://masterinterface.xyz`** (apex + `www`, both attached to
  the Vercel project). Every `SITE_URL`, `<link rel="canonical">`, `og:url`,
  `twitter:image` and JSON-LD `url`/`@id` in `index.html`, `library.html`,
  `templates.html`, `agents.html`, `preview.html`, `faq.html` and `privacy.html`
  points there, `sitemap.xml` lists those pages with a `<lastmod>`, and
  `robots.txt` ends with `Sitemap: https://masterinterface.xyz/sitemap.xml`.
  `site/vercel.json` redirects `www.masterinterface.xyz` and
  `master-ui-engine.vercel.app` to the apex with permanent host-matched rules, so
  only one hostname can be canonical; preview deployments keep their own hashed
  host and are unaffected. `SITE_URL` is documentation only: the functions derive
  the allowed origin from `x-forwarded-host`, so a wrong `SITE_URL` cannot lock
  out your own visitors.
- **Apex HTTPS:** Vercel has issued the certificate for `masterinterface.xyz`, so
  `https://` works and `api/_admin.js` sees `x-forwarded-proto: https`. The
  session cookie is `Secure`, which is why signing in over plain `http://` — or
  on a local `node site/serve.mjs` origin other than `localhost` — cannot
  complete: `requestIsSecure()` also accepts a host ending in `.vercel.app`.
- `/admin` and `/admin/login` ship `noindex, nofollow`, carry a
  `X-Robots-Tag` header, are disallowed in `robots.txt`, and do **not** load
  `/assets/analytics.js`, so the owner's own visits never inflate the numbers.
- Every `/api/*` response sets `X-Robots-Tag: noindex, nofollow` inside
  `sendJson()` in `site/api/_lib.js`, not in `vercel.json`. Googlebot GETs the
  POST-only endpoints, files the `405` JSON as an "Other error" row, and a
  `robots.txt` disallow leaves that row in place — only a fetched `noindex`
  clears it. The header is set in code so it survives on every status, including
  `405` and `401`, which no static header block would distinguish.
- Nothing on the site links a `.html` URL any more. `engineUrl()` in
  `site/assets/library.js`, the preview frames and `src`/`data-src` attributes in
  `index.html`, the filter form's `action` and every `/preview` link use the
  extension-less form that `cleanUrls` redirects *to*, so no page Google
  discovers from ours costs a `308` hop. Relative asset paths are unaffected:
  `/engine/components/cards/cards` has the same directory as
  `/engine/components/cards/cards.html`, so `../../design-tokens/engine.css`
  still resolves. `node site/serve.mjs` mirrors this and resolves any
  extension-less path to its `.html` file, so local and deployed URLs match.
  `data-path` attributes and the GitHub "View source" links keep the real
  `.html` filename — those name a file in the repository, not a URL to crawl.
- The 59 preview pages under `/engine/**` carry `X-Robots-Tag: noindex, follow`
  from `vercel.json` (set 2026-11-01, after Google's first crawl filed them as
  content pages). They are the iframed assets, not the search landing pages, and
  the React and Web Components galleries are client-rendered shells, so keeping
  them out of the index also keeps crawl reports down to the seven real pages.
  They stay reachable and still load for `llms.txt`, the CLI and the catalog —
  `robots.txt` deliberately does **not** disallow `/engine/`, because a
  disallowed URL cannot be fetched and therefore cannot be told `noindex`.
  Note that a `.html` URL answers the `cleanUrls` 308 before the header block
  applies, so the redirect itself carries no `X-Robots-Tag`; Google follows it to
  the extension-less URL, which does, and honours the tag from there. Since the
  site no longer links any `.html` URL, that path now only matters for links made
  from outside.
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

### 8. Search submission

**Both verification paths are already in place** (added 2026-11-01, so Google can
read either):

- A `TXT` record on the apex of the Vercel-managed DNS for `masterinterface.xyz`
  holding `google-site-verification=<token>`, which is what a *Domain property*
  needs. Check it with `node -e "require('node:dns').promises.resolveTxt('masterinterface.xyz').then(r=>console.log(r.map(x=>x.join(''))))"` — the token is
  public data, not a credential, and re-adding it costs nothing.
- The same token as `<meta name="google-site-verification">` in the `<head>` of
  all seven public pages, which is what a *URL-prefix property* needs.

That means nothing in the repo is left to do; only Google's own UI is waiting on
you:

1. **Verify.** In Search Console add a *Domain property* for `masterinterface.xyz`
   and click verify — the TXT record answers it. If you would rather not own the
   DNS, add the URL-prefix property `https://masterinterface.xyz/` instead; the
   meta tag answers that too.
2. **Submit the sitemap** at `https://masterinterface.xyz/sitemap.xml`.

Then check, in this order: `curl -sI https://masterinterface.xyz/robots.txt`
returns 200 and names the sitemap; `sitemap.xml` returns 200 and every `<loc>`
resolves 200 on the same host; and URL Inspection on `https://masterinterface.xyz/`
reports the canonical as the apex URL, not `master-ui-engine.vercel.app`.

**The two crawl errors in the first report, and what closed them** (both fixed
2026-11-01; Search Console re-crawls on its own schedule, so the rows outlive the
fix by days):

- *Other error* on `/api/track` — a POST-only endpoint that returns `405` plus
  JSON when Googlebot GETs it, with nothing telling the crawler to leave it
  alone. Fixed by the `X-Robots-Tag: noindex, nofollow` in `sendJson()`.
- *Redirect page* on `/engine/**.html` — `cleanUrls` answers those with a `308`
  to the extension-less URL. They were only ever discovered because our own
  pages linked them. Fixed by emitting the extension-less form everywhere, so a
  crawl now reaches the page in one request; the `.html` URLs keep working for
  anyone who links the old form.
- The report also said the sitemap "couldn't fetch pages". The file itself is
  sound and answers `200 application/xml` with six `<loc>` entries that each
  resolve `200` — the rows were the two causes above plus crawl results recorded
  before the apex certificate was issued. Verify with `node site/build.mjs` and
  a GET of `https://masterinterface.xyz/sitemap.xml`.

`llms.txt` at the site root is for agent readers, not for ranking — Google has
said it does not use the file, so treat it as machine-readable documentation and
expect no Search Console entry for it.
