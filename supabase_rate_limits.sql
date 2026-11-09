-- Shared rate-limit counters for the public video maker (api/_lib/videoLimit.js).
-- Run once in the Supabase SQL editor. Safe to re-run. Nothing else in the database is touched.
-- Until it is run, the API falls back to per-instance memory counters (weaker but still on).

create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

-- Only the server (service role) may use it; the public API cannot read or write it.
alter table public.rate_limits enable row level security;

-- Counts one request in the current fixed window and says whether it is still within the limit.
create or replace function public.rate_limit_hit(p_key text, p_window int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
  c int;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, w, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into c;

  -- housekeeping: now and then drop counters older than two days
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;

  return c <= p_max;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
