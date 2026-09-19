import { secureSessionStorage } from './secure-session-storage';

const mockSecure = new Map<string, string>();
const mockLegacy = new Map<string, string>();

jest.mock('expo-sqlite/localStorage/install', () => ({}));
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afterFirstUnlockThisDeviceOnly',
  getItemAsync: async (key: string) => mockSecure.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => void mockSecure.set(key, value),
  deleteItemAsync: async (key: string) => void mockSecure.delete(key),
}));

beforeAll(() => {
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (key: string) => mockLegacy.get(key) ?? null,
    removeItem: (key: string) => void mockLegacy.delete(key),
  };
});

beforeEach(() => {
  mockSecure.clear();
  mockLegacy.clear();
});

describe('secureSessionStorage', () => {
  it('round-trips a value larger than one SecureStore entry', async () => {
    const session = JSON.stringify({ token: 'x'.repeat(5000) });
    await secureSessionStorage.setItem('sb-auth', session);

    expect(mockSecure.size).toBeGreaterThan(2);
    for (const value of mockSecure.values()) expect(value.length).toBeLessThanOrEqual(1800);
    expect(await secureSessionStorage.getItem('sb-auth')).toBe(session);
  });

  it('drops leftover pieces when a shorter value replaces a longer one', async () => {
    await secureSessionStorage.setItem('sb-auth', 'y'.repeat(5000));
    await secureSessionStorage.setItem('sb-auth', 'short');

    expect(await secureSessionStorage.getItem('sb-auth')).toBe('short');
    expect([...mockSecure.keys()].sort()).toEqual(['sb-auth.0', 'sb-auth.count']);
  });

  it('removes every piece', async () => {
    await secureSessionStorage.setItem('sb-auth', 'z'.repeat(5000));
    await secureSessionStorage.removeItem('sb-auth');

    expect(mockSecure.size).toBe(0);
    expect(await secureSessionStorage.getItem('sb-auth')).toBeNull();
  });

  it('moves a session saved by an older version out of localStorage', async () => {
    mockLegacy.set('sb-auth', 'old-session');

    expect(await secureSessionStorage.getItem('sb-auth')).toBe('old-session');
    expect(mockLegacy.has('sb-auth')).toBe(false);
    expect(mockSecure.get('sb-auth.0')).toBe('old-session');
  });

  it('treats a half-written value as signed out', async () => {
    await secureSessionStorage.setItem('sb-auth', 'w'.repeat(5000));
    mockSecure.delete('sb-auth.1');

    expect(await secureSessionStorage.getItem('sb-auth')).toBeNull();
  });
});
