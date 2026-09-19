import { normalizeSupabaseKey, normalizeSupabaseUrl } from './supabase-config';

describe('normalizeSupabaseUrl', () => {
  it('accepts a normal project URL and drops a trailing slash', () => {
    expect(normalizeSupabaseUrl('https://abcd.supabase.co')).toBe('https://abcd.supabase.co');
    expect(normalizeSupabaseUrl('https://abcd.supabase.co/')).toBe('https://abcd.supabase.co');
  });

  it('strips whitespace and wrapping quotes', () => {
    expect(normalizeSupabaseUrl('  "https://abcd.supabase.co"  ')).toBe('https://abcd.supabase.co');
    expect(normalizeSupabaseUrl("'https://abcd.supabase.co'")).toBe('https://abcd.supabase.co');
  });

  it('rejects values that are not a real http(s) URL', () => {
    expect(normalizeSupabaseUrl(undefined)).toBe('');
    expect(normalizeSupabaseUrl('')).toBe('');
    expect(normalizeSupabaseUrl('abcd.supabase.co')).toBe('');
    expect(normalizeSupabaseUrl('<your url>')).toBe('');
    expect(normalizeSupabaseUrl('https://')).toBe('');
    expect(normalizeSupabaseUrl('ftp://abcd.supabase.co')).toBe('');
  });
});

describe('normalizeSupabaseKey', () => {
  it('trims whitespace and quotes', () => {
    expect(normalizeSupabaseKey(' "sb_publishable_x" ')).toBe('sb_publishable_x');
    expect(normalizeSupabaseKey(undefined)).toBe('');
  });
});
