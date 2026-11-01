-- ==========================================================================
-- MASTER-UI-ENGINE product site — visitor analytics + waitlist schema.
--
-- HOW TO APPLY: Supabase dashboard -> your project -> SQL Editor -> New query
-- -> paste this whole file -> Run. It is idempotent (create table if not
-- exists / create or replace function / grants), so re-running it after a
-- change is safe and never drops data.
--
-- WHO READS THIS DATA: only the three serverless functions in site/api/
-- (track.js, stats.js, subscribe.js), using the SUPABASE_SERVICE_ROLE_KEY on
-- the Vercel side. The browser never talks to Supabase, so no key is ever
-- shipped in site/assets/*.js.
--
-- ACCESS MODEL: every table gets RLS enabled and NO policies. Supabase's
-- service_role has BYPASSRLS, so the functions keep working; anon and
-- authenticated get no table grants at all, so the data is not readable from
-- the browser even if someone guesses a table name. Do not add public/anon
-- policies here — that would publish the analytics to the whole internet.
--
-- PRIVACY SHAPE: day + timestamp, path (no query string), referrer hostname,
-- a two-letter country code from Vercel's edge header, and an anonymous
-- per-browser id. There is no IP column, no user-agent column and no
-- free-text column, by design.
-- ==========================================================================

-- #region tables

-- One row per recorded page view. The window scan behind the per-day series,
-- top pages, top referrers and country totals reads this table.
create table if not exists public.web_page_views (
  id           uuid primary key default gen_random_uuid(),
  day          text not null check (day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  occurred_at  timestamptz not null default now(),
  path         text not null check (path ~ '^/'),
  referrer_host text,
  country      text check (country is null or country ~ '^[A-Z]{2}$'),
  vid          text check (vid is null or vid ~ '^[A-Za-z0-9_-]{8,64}$')
);

-- One row per tracked event other than page_view (searches, preview opens,
-- code copies, GitHub clicks, theme switches, waitlist clicks).
create table if not exists public.web_events (
  id           uuid primary key default gen_random_uuid(),
  day          text not null check (day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  occurred_at  timestamptz not null default now(),
  name         text not null check (name in (
                 'library_search', 'component_preview_open', 'template_preview_open',
                 'copy_code', 'github_click', 'documentation_click',
                 'install_instruction_open', 'theme_switch', 'newsletter_signup')),
  path         text,
  target       text,
  vid          text check (vid is null or vid ~ '^[A-Za-z0-9_-]{8,64}$')
);

-- Membership table: one row per anonymous id ever seen. Its row count IS the
-- all-time distinct-visitor total, so stats.js never needs a DISTINCT count.
-- first_seen_day < window start + a hit inside the window = a return visit.
create table if not exists public.web_visitors (
  vid             text primary key check (vid ~ '^[A-Za-z0-9_-]{8,64}$'),
  first_seen_day  text not null check (first_seen_day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  last_seen_day   text not null check (last_seen_day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  countries       text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Waitlist. The primary key on the normalized (trimmed, lowercased) address is
-- what makes subscribe.js idempotent: a repeat signup cannot create a row.
create table if not exists public.web_subscribers (
  email       text primary key,
  day         text not null check (day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  created_at  timestamptz not null default now()
);

-- Crude abuse budget for the anonymous subscribe route: one row per
-- (bucket, day). `key` is a SHA-256 hex digest of "subscribe:<vid or email>",
-- so this table holds no address and no raw visitor id either.
create table if not exists public.web_rate_hits (
  key         text not null check (key ~ '^[a-f0-9]{64}$'),
  day         text not null check (day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  hits        integer not null default 1 check (hits > 0),
  updated_at  timestamptz not null default now(),
  primary key (key, day)
);

-- #endregion tables

-- #region indexes
-- Every read from stats.js is a day-window scan or a filter on one of these
-- columns, so these four index families are what keep the endpoints cheap.
create index if not exists web_page_views_day_idx    on public.web_page_views (day);
create index if not exists web_page_views_path_idx   on public.web_page_views (path);
create index if not exists web_page_views_vid_idx    on public.web_page_views (vid);
create index if not exists web_page_views_country_idx on public.web_page_views (country);
create index if not exists web_events_day_idx        on public.web_events (day);
create index if not exists web_events_name_idx       on public.web_events (name);
create index if not exists web_events_vid_idx        on public.web_events (vid);
create index if not exists web_events_target_idx     on public.web_events (name, target);
create index if not exists web_visitors_first_seen_idx on public.web_visitors (first_seen_day);
create index if not exists web_visitors_last_seen_idx  on public.web_visitors (last_seen_day);
create index if not exists web_subscribers_day_idx   on public.web_subscribers (day);
-- #endregion indexes

-- #region functions
/* Atomic visitor membership: one call records "this id was seen on this day
   from this country". Written as a function because PostgREST cannot express
   "keep the earliest first_seen_day and append to an array" in an upsert.
   Runs as the calling role (security invoker, the default), which is exactly
   why service_role needs the table grants below. */
create or replace function public.mue_track_visitor(p_vid text, p_day text, p_country text)
returns void
language sql
as $$
  insert into public.web_visitors as v (vid, first_seen_day, last_seen_day, countries)
  values (
    p_vid,
    p_day,
    p_day,
    case when p_country is null then '{}'::text[] else array[p_country] end
  )
  on conflict (vid) do update
     set first_seen_day = least(v.first_seen_day, excluded.first_seen_day),
         last_seen_day  = greatest(v.last_seen_day, excluded.last_seen_day),
         countries      = case
                            when p_country is null then v.countries
                            when p_country = any (v.countries) then v.countries
                            else array_append(v.countries, p_country)
                          end,
         updated_at     = now();
$$;

/* Advisory fixed-window budget for subscribe.js: increments this bucket/day and
   answers whether the write is still allowed. The select-then-update pair is
   not serialized, so concurrent requests can slip one or two past the cap —
   acceptable for a crude guard against one browser spamming the waitlist.
   Deliberately does not lock or throw: a broken limiter must not eat signups. */
create or replace function public.mue_bump_rate_hit(p_key text, p_day text, p_limit integer)
returns boolean
language plpgsql
as $$
declare
  current_hits integer;
begin
  insert into public.web_rate_hits (key, day, hits)
  values (p_key, p_day, 1)
  on conflict (key, day) do nothing;

  select hits into current_hits
  from public.web_rate_hits
  where web_rate_hits.key = p_key and web_rate_hits.day = p_day;

  if current_hits is null then
    return true;                        -- storage anomaly: fail open
  end if;
  if current_hits >= coalesce(p_limit, 5) then
    return false;
  end if;

  update public.web_rate_hits
     set hits = hits + 1, updated_at = now()
   where web_rate_hits.key = p_key and web_rate_hits.day = p_day;
  return true;
end;
$$;

/* Exact distinct-country count for a day window (null bounds = all time).
   The window scan in stats.js caps at SCAN_LIMIT rows, which would undercount
   countries on a busy day, so the dashboard prefers this number when it
   answers and falls back to the scan when it does not. */
create or replace function public.mue_count_distinct_country(p_from_day text, p_to_day text)
returns bigint
language sql
stable
as $$
  select count(distinct v.country)
  from public.web_page_views v
  where v.country is not null
    and (p_from_day is null or v.day >= p_from_day)
    and (p_to_day   is null or v.day <= p_to_day);
$$;
-- #endregion functions

-- #region access control
alter table public.web_page_views enable row level security;
alter table public.web_events     enable row level security;
alter table public.web_visitors   enable row level security;
alter table public.web_subscribers enable row level security;
alter table public.web_rate_hits  enable row level security;

-- The browser roles get nothing at all. No policies are created, so even a
-- future grant mistake would still return zero rows to anon.
revoke all on public.web_page_views    from anon, authenticated;
revoke all on public.web_events        from anon, authenticated;
revoke all on public.web_visitors      from anon, authenticated;
revoke all on public.web_subscribers   from anon, authenticated;
revoke all on public.web_rate_hits     from anon, authenticated;
revoke all on function public.mue_track_visitor(text, text, text)              from public, anon, authenticated;
revoke all on function public.mue_bump_rate_hit(text, text, integer)           from public, anon, authenticated;
revoke all on function public.mue_count_distinct_country(text, text)           from public, anon, authenticated;

-- service_role bypasses RLS, but it is not the table owner, so it still needs
-- explicit privileges. These are the only grants that matter for the site.
grant usage on schema public to service_role;
grant select, insert, update on public.web_page_views  to service_role;
grant select, insert, update on public.web_events      to service_role;
grant select, insert, update on public.web_visitors    to service_role;
grant select, insert         on public.web_subscribers to service_role;
grant select, insert, update on public.web_rate_hits   to service_role;
grant execute on function public.mue_track_visitor(text, text, text)     to service_role;
grant execute on function public.mue_bump_rate_hit(text, text, integer)  to service_role;
grant execute on function public.mue_count_distinct_country(text, text)  to service_role;
-- #endregion access control

-- #region owner queries
-- Not part of the deploy; run these by hand in the SQL editor when needed.
-- Delete one visitor's history (a GDPR/CCDSA-style erasure request arrives as
-- "remove the anonymous id in my browser", which the visitor can read on the
-- privacy page... or simply ask by email and clear the address below):
--   delete from public.web_page_views where vid = '<vid>';
--   delete from public.web_events     where vid = '<vid>';
--   delete from public.web_visitors   where vid = '<vid>';
-- Remove a waitlist address on request:
--   delete from public.web_subscribers where email = 'reader@example.com';
-- Peek at the newest signups:
--   select email, created_at from public.web_subscribers order by created_at desc limit 50;
-- #endregion owner queries
