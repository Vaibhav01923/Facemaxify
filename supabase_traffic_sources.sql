-- Traffic sources for /stats  ("how many people come from YouTube?")
--
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- It is safe to run again. It only ADDS new tables and functions; the existing funnel tables/functions are untouched.
-- Until it has been run, the site keeps working exactly as before and /stats -> Traffic sources shows a setup notice.
--
-- What is stored (anonymous): a random per-browser id, the landing path, the source tags from the link (utm_*),
-- the referring site's HOSTNAME only (e.g. "youtube.com") and the funnel steps reached (signed in, submitted a
-- photo, got a result). Never the photo, the full referring URL, an email or anything else personal.
--
-- Tables have row level security ON with no policies, so the browser cannot read them directly; they can only be
-- reached through the functions below. get_traffic_stats() checks the same /stats password by calling the existing
-- get_funnel_stats() (which raises "invalid password" when the password is wrong).

-- ---------------------------------------------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.traffic_visits (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  visitor       text not null,
  landing_path  text not null,
  source        text not null,                 -- youtube, google, instagram, direct, ...
  medium        text not null default '',      -- social, organic, referral, paid, ...
  campaign      text not null default '',      -- utm_campaign, e.g. about / pinned_comment
  content       text not null default '',      -- utm_content
  referrer_host text not null default '',
  via           text not null default 'direct' -- utm | referrer | direct
);
create index if not exists traffic_visits_created_idx on public.traffic_visits (created_at desc);
create index if not exists traffic_visits_source_idx  on public.traffic_visits (source, created_at desc);
create index if not exists traffic_visits_visitor_idx on public.traffic_visits (visitor, created_at desc);

create table if not exists public.traffic_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visitor    text not null,
  event      text not null check (event in ('signed_in', 'photo_submitted', 'analysis_succeeded')),
  tool       text not null default '',
  source     text not null default 'direct',   -- the visitor's source at the time of the event
  medium     text not null default '',
  campaign   text not null default ''
);
create index if not exists traffic_events_created_idx on public.traffic_events (created_at desc);
create index if not exists traffic_events_source_idx  on public.traffic_events (source, event, created_at desc);

-- browsers that have unlocked /stats (yours): left out of every number
create table if not exists public.traffic_internal_visitors (
  visitor    text primary key,
  created_at timestamptz not null default now()
);

alter table public.traffic_visits            enable row level security;
alter table public.traffic_events            enable row level security;
alter table public.traffic_internal_visitors enable row level security;
revoke all on public.traffic_visits, public.traffic_events, public.traffic_internal_visitors from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- writing (called by the site)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.track_traffic_visit(
  p_visitor       text,
  p_path          text,
  p_source        text,
  p_medium        text default '',
  p_campaign      text default '',
  p_content       text default '',
  p_referrer_host text default '',
  p_via           text default 'direct'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text;
begin
  if p_visitor is null or length(p_visitor) < 3 or length(p_visitor) > 80 then return; end if;
  if exists (select 1 from public.traffic_internal_visitors where visitor = p_visitor) then return; end if;
  -- crude flood guard: one browser cannot add more than 40 visits an hour
  if (select count(*) from public.traffic_visits
        where visitor = p_visitor and created_at > now() - interval '1 hour') >= 40 then
    return;
  end if;

  v_source := lower(left(coalesce(nullif(trim(p_source), ''), 'direct'), 60));
  if v_source !~ '^[a-z0-9._:+-]+$' then v_source := 'other'; end if;

  insert into public.traffic_visits (visitor, landing_path, source, medium, campaign, content, referrer_host, via)
  values (
    p_visitor,
    left(coalesce(p_path, '/'), 200),
    v_source,
    left(lower(coalesce(p_medium, '')), 40),
    left(lower(coalesce(p_campaign, '')), 60),
    left(lower(coalesce(p_content, '')), 60),
    left(lower(coalesce(p_referrer_host, '')), 80),
    case when p_via in ('utm', 'referrer', 'direct') then p_via else 'direct' end
  );
end;
$$;

create or replace function public.track_traffic_event(
  p_visitor  text,
  p_event    text,
  p_tool     text default '',
  p_source   text default 'direct',
  p_medium   text default '',
  p_campaign text default ''
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source text;
begin
  if p_visitor is null or length(p_visitor) < 3 or length(p_visitor) > 80 then return; end if;
  if p_event is null or p_event not in ('signed_in', 'photo_submitted', 'analysis_succeeded') then return; end if;
  if exists (select 1 from public.traffic_internal_visitors where visitor = p_visitor) then return; end if;
  if (select count(*) from public.traffic_events
        where visitor = p_visitor and created_at > now() - interval '1 hour') >= 60 then
    return;
  end if;

  v_source := lower(left(coalesce(nullif(trim(p_source), ''), 'direct'), 60));
  if v_source !~ '^[a-z0-9._:+-]+$' then v_source := 'other'; end if;

  insert into public.traffic_events (visitor, event, tool, source, medium, campaign)
  values (
    p_visitor,
    p_event,
    left(coalesce(p_tool, ''), 120),
    v_source,
    left(lower(coalesce(p_medium, '')), 40),
    left(lower(coalesce(p_campaign, '')), 60)
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- reading (called by /stats, password protected)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.get_traffic_stats(
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
    select * from public.traffic_visits v
    where (p_since is null or v.created_at >= p_since)
      and not exists (select 1 from public.traffic_internal_visitors i where i.visitor = v.visitor)
  ),
  evt as (
    select * from public.traffic_events e
    where (p_since is null or e.created_at >= p_since)
      and not exists (select 1 from public.traffic_internal_visitors i where i.visitor = e.visitor)
  ),
  src_visits as (
    select source, count(*) as visits, count(distinct visitor) as visitors from vis group by source
  ),
  src_events as (
    select source,
           count(distinct visitor) filter (where event = 'signed_in')         as signed_in,
           count(distinct visitor) filter (where event = 'photo_submitted')    as submitters,
           count(distinct visitor) filter (where event = 'analysis_succeeded') as succeeded
    from evt group by source
  ),
  sources as (
    select coalesce(v.source, e.source)   as source,
           coalesce(v.visits, 0)          as visits,
           coalesce(v.visitors, 0)        as visitors,
           coalesce(e.signed_in, 0)       as signed_in,
           coalesce(e.submitters, 0)      as submitters,
           coalesce(e.succeeded, 0)       as succeeded
    from src_visits v full join src_events e on e.source = v.source
  ),
  camp_visits as (
    select source, medium, campaign, content, count(*) as visits, count(distinct visitor) as visitors
    from vis where campaign <> '' group by source, medium, campaign, content
  ),
  camp_events as (
    select source, campaign,
           count(distinct visitor) filter (where event = 'signed_in')         as signed_in,
           count(distinct visitor) filter (where event = 'photo_submitted')    as submitters,
           count(distinct visitor) filter (where event = 'analysis_succeeded') as succeeded
    from evt where campaign <> '' group by source, campaign
  ),
  campaigns as (
    select c.source, c.medium, c.campaign, c.content, c.visits, c.visitors,
           coalesce(e.signed_in, 0) as signed_in, coalesce(e.submitters, 0) as submitters, coalesce(e.succeeded, 0) as succeeded
    from camp_visits c left join camp_events e on e.source = c.source and e.campaign = c.campaign
  ),
  referrers as (
    select referrer_host as host, min(source) as source, count(*) as visits, count(distinct visitor) as visitors
    from vis where referrer_host <> '' group by referrer_host
  ),
  landing as (
    select landing_path as path, count(*) as visits, count(distinct visitor) as visitors from vis group by landing_path
  )
  select jsonb_build_object(
    'tracking_since', (select min(created_at) from public.traffic_visits),
    'totals', jsonb_build_object(
      'visits',     (select count(*) from vis),
      'visitors',   (select count(distinct visitor) from vis),
      'signed_in',  (select count(distinct visitor) from evt where event = 'signed_in'),
      'submitters', (select count(distinct visitor) from evt where event = 'photo_submitted'),
      'succeeded',  (select count(distinct visitor) from evt where event = 'analysis_succeeded')
    ),
    'sources',   coalesce((select jsonb_agg(to_jsonb(s) order by s.visitors desc, s.visits desc, s.source) from sources s), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(to_jsonb(c) order by c.visitors desc, c.visits desc, c.campaign) from campaigns c), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(to_jsonb(r) order by r.visitors desc, r.visits desc, r.host) from (select * from referrers order by visitors desc, visits desc limit 30) r), '[]'::jsonb),
    'landing',   coalesce((select jsonb_agg(to_jsonb(l) order by l.visitors desc, l.visits desc, l.path) from (select * from landing order by visitors desc, visits desc limit 30) l), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_traffic_stats(text, timestamptz, text) from public;
grant execute on function public.track_traffic_visit(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.track_traffic_event(text, text, text, text, text, text)               to anon, authenticated;
grant execute on function public.get_traffic_stats(text, timestamptz, text)                            to anon, authenticated;
