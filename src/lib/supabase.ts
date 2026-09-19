import 'expo-sqlite/localStorage/install';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shift, Workplace } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.trim() !== '' &&
    supabaseAnonKey.trim() !== '' &&
    !supabaseUrl.includes('MY_') &&
    !supabaseAnonKey.includes('MY_')
  );
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
};

export const getSupabaseConfig = () => {
  return {
    isConfigured: isSupabaseConfigured(),
    url: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '') : null,
  };
};

// SQL Schema script for user reference
export const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor:

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
drop policy if exists "Users can manage their own workplaces" on public.workplaces;
drop policy if exists "Users can manage their own shifts" on public.shifts;

create policy "Users can manage their own workplaces"
  on public.workplaces for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own shifts"
  on public.shifts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Let a signed-in user delete their own account
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
`;

function mapWorkplaceRow(row: any): Workplace {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : undefined,
    address: row.address || undefined,
    notes: row.notes || undefined,
    usualSchedule: row.usual_schedule || undefined,
  };
}

// Database Service Helpers
export const supabaseDb = {
  async fetchWorkplaces(userId: string): Promise<Workplace[]> {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
      .from('workplaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching workplaces from Supabase:', error.message);
      throw error;
    }

    return (data || []).map(mapWorkplaceRow);
  },

  /** Insert-or-update by id, so a retried request can never create a duplicate. */
  async upsertWorkplace(userId: string, wp: Workplace): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured');

    const { error } = await sb.from('workplaces').upsert({
      id: wp.id,
      user_id: userId,
      name: wp.name,
      color: wp.color || '#3B82F6',
      hourly_rate: wp.hourlyRate || 0,
      address: wp.address || null,
      usual_schedule: wp.usualSchedule || null,
      notes: wp.notes || '',
    });

    if (error) throw error;
  },

  /** Permanently deletes the signed-in user's account and all of their data (see delete_my_account in the schema). */
  async deleteAccount(): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured');
    const { error } = await sb.rpc('delete_my_account');
    if (error) throw error;
  },

  async deleteWorkplace(id: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('workplaces').delete().eq('id', id);
    if (error) throw error;
  },

  async fetchShifts(userId: string): Promise<Shift[]> {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Error fetching shifts from Supabase:', error.message);
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      workplaceId: row.workplace_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      breakMinutes: row.break_minutes || 0,
      hourlyRate: row.hourly_rate != null ? Number(row.hourly_rate) : undefined,
      workedMinutes: row.worked_minutes,
      paymentStatus: (row.payment_status as 'paid' | 'unpaid') || 'unpaid',
      paidDate: row.paid_date || undefined,
      actualPaidAmount: row.actual_paid_amount ? Number(row.actual_paid_amount) : undefined,
      notes: row.notes || undefined,
    }));
  },

  /** Insert-or-update by id, so a retried request can never create a duplicate. */
  async upsertShift(userId: string, shift: Shift): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured');

    const row = {
      id: shift.id,
      user_id: userId,
      workplace_id: shift.workplaceId,
      date: shift.date,
      start_time: shift.startTime,
      end_time: shift.endTime,
      break_minutes: shift.breakMinutes,
      worked_minutes: shift.workedMinutes,
      hourly_rate: shift.hourlyRate ?? null,
      payment_status: shift.paymentStatus,
      paid_date: shift.paidDate || null,
      actual_paid_amount: shift.actualPaidAmount ?? null,
      notes: shift.notes || null,
    };

    let { error } = await sb.from('shifts').upsert(row);

    // The database hasn't been given the hourly_rate column yet: sync everything else rather than
    // blocking the queue. The rate is stored once the column exists and the shift is saved again.
    if (error?.code === 'PGRST204' && /hourly_rate/.test(error.message)) {
      const { hourly_rate: _omitted, ...withoutRate } = row;
      ({ error } = await sb.from('shifts').upsert(withoutRate));
    }

    if (error) throw error;
  },

  async deleteShift(id: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;

    const { error } = await sb.from('shifts').delete().eq('id', id);
    if (error) throw error;
  },
};
