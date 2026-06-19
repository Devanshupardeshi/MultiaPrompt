-- Paste this into the Supabase SQL Editor for the shared realtime prompt counter.
-- The app increments this table only from the server after a prompt is generated successfully.

create table if not exists public.daily_prompt_counts (
  date date primary key,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.daily_prompt_counts enable row level security;

grant select on public.daily_prompt_counts to anon, authenticated;
grant select, insert, update on public.daily_prompt_counts to service_role;

drop policy if exists "Anyone can read daily prompt counts" on public.daily_prompt_counts;
create policy "Anyone can read daily prompt counts"
on public.daily_prompt_counts
for select
to anon, authenticated
using (true);

create or replace function public.increment_daily_prompt_count(target_date date)
returns public.daily_prompt_counts
language plpgsql
as $$
declare
  updated_count public.daily_prompt_counts;
begin
  insert into public.daily_prompt_counts as counts (date, count, updated_at)
  values (target_date, 1, now())
  on conflict (date)
  do update set
    count = counts.count + 1,
    updated_at = now()
  returning * into updated_count;

  return updated_count;
end;
$$;

revoke execute on function public.increment_daily_prompt_count(date) from public;
grant execute on function public.increment_daily_prompt_count(date) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'daily_prompt_counts'
  ) then
    alter publication supabase_realtime add table public.daily_prompt_counts;
  end if;
end $$;
