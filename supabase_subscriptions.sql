-- Subscriptions ("$0.99 for the first month, then monthly") on top of the existing paid flag.
--
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run), in the
-- project that matches the Dodo mode you are testing (a test project/branch first, production later).
-- It is safe to run again. It only ADDS columns, a table and a function; nothing is dropped and no
-- existing row loses access: "isPaid" is only read here, never turned off.
--
-- Until it has been run, the old-plan payment path keeps working exactly as before, but subscription
-- events fail with an error in the Vercel logs (Dodo then retries them), so run it BEFORE going live.
--
-- Two kinds of paid users afterwards:
--   old plan   "isPaid" is true and subscription_status is NULL (and legacy_access = true after the backfill below).
--              Nothing in the webhook ever turns these off.
--   subscriber subscription_status is set (active / past_due / on_hold / cancelled / expired).

-- ---------------------------------------------------------------------------------------------------------------
-- what the site needs to show and decide access (readable like the rest of the users row)
-- ---------------------------------------------------------------------------------------------------------------
alter table public.users add column if not exists subscription_status text;
alter table public.users add column if not exists subscription_current_period_end timestamptz;     -- end of the paid period
alter table public.users add column if not exists subscription_cancel_at_period_end boolean not null default false;
alter table public.users add column if not exists legacy_access boolean not null default false;    -- bought the old plan: never switched off

-- Everyone who is paid right now bought the old plan. Mark them so no subscription event can ever
-- turn their access off. Cast to text so this works whether "isPaid" is a boolean or text column.
update public.users
   set legacy_access = true
 where subscription_status is null
   and lower("isPaid"::text) in ('true', 't')
   and legacy_access = false;

-- ---------------------------------------------------------------------------------------------------------------
-- Dodo identifiers: service role only (the webhook and /api/manage-subscription), invisible to the browser
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.user_billing (
  user_id          text primary key,        -- users.id (the Clerk user id)
  email            text,
  dodo_customer_id text,                    -- used to open Dodo's customer portal
  subscription_id  text,                    -- the current subscription; only events for this id can change access
  last_event_at    timestamptz,             -- timestamp of the newest Dodo event applied (late events are skipped)
  updated_at       timestamptz not null default now()
);
create unique index if not exists user_billing_subscription_idx on public.user_billing (subscription_id) where subscription_id is not null;

alter table public.user_billing enable row level security;
revoke all on public.user_billing from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- optional safety net
-- ---------------------------------------------------------------------------------------------------------------
-- The site already treats a cancelled subscriber as unpaid once their paid period is over, and the webhook
-- switches access off when Dodo says the subscription ended or a renewal failed. This function also makes the
-- stored flag match for anyone cancelled whose period has run out, in case no final event arrived. It never
-- touches the old plan (legacy_access = true or subscription_status is null).
-- Run it by hand, or schedule it daily with pg_cron (Database -> Extensions -> pg_cron), for example:
--   select cron.schedule('expire-lapsed-subscriptions', '15 3 * * *', $$ select public.expire_lapsed_subscriptions() $$);
create or replace function public.expire_lapsed_subscriptions() returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.users
     set "isPaid" = 'false'
   where subscription_status = 'cancelled'
     and subscription_current_period_end is not null
     and subscription_current_period_end <= now()
     and legacy_access = false
     and lower("isPaid"::text) in ('true', 't');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expire_lapsed_subscriptions() from public, anon, authenticated;
grant execute on function public.expire_lapsed_subscriptions() to service_role;
