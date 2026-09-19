-- ShiftMate database schema. Run this whole file in the Supabase SQL Editor.
-- It is safe to run again: every statement is idempotent, so it also upgrades an older database.

-- 1. Create Workplaces Table
create table if not exists public.workplaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#3B82F6',
  hourly_rate numeric(10, 2) default 0.00,
  address text,
  usual_schedule jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- If the workplaces table already existed, make sure the newer columns are present
alter table public.workplaces add column if not exists address text;
alter table public.workplaces add column if not exists usual_schedule jsonb;

-- 2. Create Shifts Table
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workplace_id uuid references public.workplaces(id) on delete cascade not null,
  date date not null,
  start_time text not null,
  end_time text not null,
  break_minutes integer default 0,
  worked_minutes integer not null,
  hourly_rate numeric(10, 2),
  payment_status text check (payment_status in ('paid', 'unpaid')) default 'unpaid',
  paid_date date,
  actual_paid_amount numeric(10, 2),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- If the shifts table already existed, add the per-shift pay rate and freeze existing shifts at
-- their workplace's current rate (so later rate changes don't rewrite them)
alter table public.shifts add column if not exists hourly_rate numeric(10, 2);
update public.shifts s
  set hourly_rate = w.hourly_rate
  from public.workplaces w
  where s.workplace_id = w.id and s.hourly_rate is null;
notify pgrst, 'reload schema';

-- 3. Enable Row Level Security (RLS)
alter table public.workplaces enable row level security;
alter table public.shifts enable row level security;

-- 4. Policies
-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per query, not once per row
drop policy if exists "Users can manage their own workplaces" on public.workplaces;
drop policy if exists "Users can manage their own shifts" on public.shifts;

create policy "Users can manage their own workplaces"
  on public.workplaces for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A shift must belong to the user AND point at one of the user's own workplaces
create policy "Users can manage their own shifts"
  on public.shifts for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.workplaces w
      where w.id = workplace_id and w.user_id = (select auth.uid())
    )
  );

-- 5. Data checks and indexes
-- "not valid" enforces the rules for new and changed rows without failing on rows that already exist
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'workplaces_valid_check') then
    alter table public.workplaces add constraint workplaces_valid_check
      check (char_length(btrim(name)) > 0 and coalesce(hourly_rate, 0) >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'shifts_valid_check') then
    alter table public.shifts add constraint shifts_valid_check
      check (
        worked_minutes >= 0
        and coalesce(break_minutes, 0) >= 0
        and coalesce(hourly_rate, 0) >= 0
        and start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      ) not valid;
  end if;
end
$$;

create index if not exists workplaces_user_id_idx on public.workplaces (user_id);
create index if not exists shifts_user_date_idx on public.shifts (user_id, date desc);
create index if not exists shifts_workplace_id_idx on public.shifts (workplace_id);

-- 6. Let a signed-in user delete their own account
-- Deleting the auth user cascades to their workplaces and shifts (on delete cascade above).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
