-- Country tracking for /stats  ("which countries do visitors come from?")
--
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run), AFTER
-- supabase_traffic_sources.sql. It is safe to run again. It only ADDS a new table and two functions; the existing
-- funnel and traffic tables/functions are untouched. Until it has been run, the site keeps working exactly as before
-- and /stats -> Countries shows a setup notice.
--
-- What is stored (anonymous): the random per-browser id and a two-letter country code such as "IN" or "US".
-- The country is worked out on the server from the request (Vercel's x-vercel-ip-country header, see api/geo.js).
-- IP addresses are never stored, and no third-party service is used.
--
-- Old records need no changes: a visitor with no country row is counted as "unknown". The country belongs to the
-- visitor, so when someone who was recorded before this migration comes back, their earlier visits are attributed
-- to their country too (it is the latest known country if they travel or use a VPN).
--
-- The table has row level security ON with no policies, so the browser cannot read it directly; it can only be
-- reached through the functions below. get_country_stats() checks the same /stats password by calling the existing
-- get_funnel_stats() (which raises "invalid password" when the password is wrong).

do $$
begin
  if to_regclass('public.traffic_visits') is null or to_regclass('public.traffic_internal_visitors') is null then
    raise exception 'Run supabase_traffic_sources.sql first: the Countries tab breaks the Traffic sources numbers down by country.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- table
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.visitor_countries (
  visitor    text primary key,
  country    text not null check (country ~ '^[A-Z]{2}$'),
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
create index if not exists visitor_countries_country_idx on public.visitor_countries (country);

alter table public.visitor_countries enable row level security;
revoke all on public.visitor_countries from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- writing (called by the site, once per browsing session)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.track_visitor_country(
  p_visitor text,
  p_country text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country text := upper(trim(coalesce(p_country, '')));
begin
  if p_visitor is null or length(p_visitor) < 3 or length(p_visitor) > 80 then return; end if;
  -- no usable country ("XX" is the unknown placeholder): record nothing, the visitor stays "unknown"
  if v_country !~ '^[A-Z]{2}$' or v_country = 'XX' then return; end if;

  insert into public.visitor_countries (visitor, country)
  values (p_visitor, v_country)
  on conflict (visitor) do update set country = excluded.country, last_seen = now();
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- reading (called by /stats, password protected)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.get_country_stats(
  p_password text,
  p_since    timestamptz default null,
  p_visitor  text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  -- Same password as the funnel stats: this raises "invalid password" when it is wrong.
  perform public.get_funnel_stats(p_password => p_password, p_since => null, p_visitor => null);

  -- unlocking /stats marks this browser as yours, so your own visits drop out of the numbers
  if p_visitor is not null and length(p_visitor) between 3 and 80 then
    insert into public.traffic_internal_visitors (visitor) values (p_visitor) on conflict do nothing;
  end if;

  with
  vis as (
    select v.visitor, coalesce(c.country, 'unknown') as country
    from public.traffic_visits v
    left join public.visitor_countries c on c.visitor = v.visitor
    where (p_since is null or v.created_at >= p_since)
      and not exists (select 1 from public.traffic_internal_visitors i where i.visitor = v.visitor)
  ),
  evt as (
    select e.visitor, e.event, coalesce(c.country, 'unknown') as country
    from public.traffic_events e
    left join public.visitor_countries c on c.visitor = e.visitor
    where (p_since is null or e.created_at >= p_since)
      and not exists (select 1 from public.traffic_internal_visitors i where i.visitor = e.visitor)
  ),
  c_visits as (
    select country, count(*) as visits, count(distinct visitor) as visitors from vis group by country
  ),
  c_events as (
    select country,
           count(distinct visitor) filter (where event = 'signed_in')         as signed_in,
           count(distinct visitor) filter (where event = 'photo_submitted')    as submitters,
           count(distinct visitor) filter (where event = 'analysis_succeeded') as succeeded
    from evt group by country
  ),
  countries as (
    select coalesce(v.country, e.country) as country,
           coalesce(v.visits, 0)          as visits,
           coalesce(v.visitors, 0)        as visitors,
           coalesce(e.signed_in, 0)       as signed_in,
           coalesce(e.submitters, 0)      as submitters,
           coalesce(e.succeeded, 0)       as succeeded
    from c_visits v full join c_events e on e.country = v.country
  )
  select jsonb_build_object(
    'tracking_since', (select min(first_seen) from public.visitor_countries),
    'totals', jsonb_build_object(
      'visits',       (select count(*) from vis),
      'visitors',     (select count(distinct visitor) from vis),
      'with_country', (select count(distinct visitor) from vis where country <> 'unknown'),
      'signed_in',    (select count(distinct visitor) from evt where event = 'signed_in'),
      'submitters',   (select count(distinct visitor) from evt where event = 'photo_submitted'),
      'succeeded',    (select count(distinct visitor) from evt where event = 'analysis_succeeded')
    ),
    -- real countries by volume, then the "unknown" bucket last (it is not a country, and early on it is the biggest)
    'countries', coalesce((select jsonb_agg(to_jsonb(c) order by (c.country = 'unknown'), c.visitors desc, c.visits desc, c.country) from countries c), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.track_visitor_country(text, text)                from public;
revoke all on function public.get_country_stats(text, timestamptz, text)       from public;
grant execute on function public.track_visitor_country(text, text)            to anon, authenticated;
grant execute on function public.get_country_stats(text, timestamptz, text)   to anon, authenticated;
