/**
 * Cleans the Supabase URL from the environment and returns '' unless it is a real http(s) URL.
 * A stray quote, space or placeholder would otherwise crash the app while it starts.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
  return /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(value) ? value.replace(/\/+$/, '') : '';
}

/** The anon/publishable key with stray quotes and whitespace removed. */
export function normalizeSupabaseKey(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
}
