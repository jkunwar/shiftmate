import 'expo-sqlite/localStorage/install';

export const STORAGE_KEYS = {
  user: 'wht_user',
  preferences: 'wht_prefs',
  workplaces: 'wht_workplaces',
  shifts: 'wht_shifts',
  payPeriods: 'wht_payperiods',
  outbox: 'wht_outbox',
} as const;

// localStorage comes from expo-sqlite on native; it doesn't exist while rendering on the web server
export function readStored<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working from memory
  }
}

/** Removes the cached account data on sign-out. Preferences (e.g. dark mode) and the auth session are untouched. */
export function clearStoredAccountData() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.workplaces);
    localStorage.removeItem(STORAGE_KEYS.shifts);
    localStorage.removeItem(STORAGE_KEYS.payPeriods);
    localStorage.removeItem(STORAGE_KEYS.outbox);
  } catch {
    // Nothing to clear
  }
}
