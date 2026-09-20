import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { reportDatabaseError } from './error-reporting';
import { fetchAllPages } from './paginate';
import { secureSessionStorage } from './secure-session-storage';
import { normalizeSupabaseKey, normalizeSupabaseUrl } from './supabase-config';
import { Shift, Workplace } from '../types';

// A malformed value counts as "not configured" (local-only mode) instead of crashing at start-up
const supabaseUrl = normalizeSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = normalizeSupabaseKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

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
        storage: secureSessionStorage,
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

const WORKPLACE_COLUMNS = 'id, name, color, hourly_rate, address, usual_schedule, notes';
const SHIFT_COLUMNS =
  'id, workplace_id, date, start_time, end_time, break_minutes, hourly_rate, worked_minutes, payment_status, paid_date, actual_paid_amount, notes';

/** Postgres "undefined column": the database is missing a column added in a later version. */
const isMissingColumn = (error: { code?: string } | null) =>
  error?.code === '42703' || error?.code === 'PGRST204';

function mapShiftRow(row: any): Shift {
  return {
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
  };
}

// Database Service Helpers
export const supabaseDb = {
  async fetchWorkplaces(userId: string): Promise<Workplace[]> {
    const sb = getSupabase();
    if (!sb) return [];

    // Only the columns the app uses. A database that hasn't been upgraded yet falls back to '*'.
    const load = (columns: string) =>
      fetchAllPages(async (from, to) => {
        const { data, error } = await sb
          .from('workplaces')
          .select(columns)
          .eq('user_id', userId)
          // The id breaks ties so paging never skips or repeats a row
          .order('created_at', { ascending: true })
          .order('id')
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      });

    try {
      return (await load(WORKPLACE_COLUMNS)).map(mapWorkplaceRow);
    } catch (err) {
      if (!isMissingColumn(err as { code?: string })) {
        console.warn('Error fetching workplaces from Supabase:', (err as Error).message);
        throw err;
      }
      // The database is missing a newer column: worth knowing, though the app carries on with '*'
      reportDatabaseError(err, 'fetch_workplaces');
      return (await load('*')).map(mapWorkplaceRow);
    }
  },

  /** Insert-or-update by id, so a retried request can never create a duplicate. */
  async upsertWorkplace(userId: string, wp: Workplace): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase is not configured');

    const { error } = await sb.from('workplaces').upsert({
      id: wp.id,
      user_id: userId,
      name: wp.name,
      color: wp.color || '#3E6B99',
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

    const load = (columns: string) =>
      fetchAllPages(async (from, to) => {
        const { data, error } = await sb
          .from('shifts')
          .select(columns)
          .eq('user_id', userId)
          .order('date', { ascending: false })
          // The id breaks ties so paging never skips or repeats a row
          .order('id')
          .range(from, to);
        if (error) throw error;
        return data ?? [];
      });

    let rows: any[];
    try {
      rows = await load(SHIFT_COLUMNS);
    } catch (err) {
      if (!isMissingColumn(err as { code?: string })) {
        console.warn('Error fetching shifts from Supabase:', (err as Error).message);
        throw err;
      }
      reportDatabaseError(err, 'fetch_shifts');
      rows = await load('*');
    }

    return rows.map(mapShiftRow);
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
