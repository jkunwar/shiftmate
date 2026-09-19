import 'expo-sqlite/localStorage/install';
import * as SecureStore from 'expo-secure-store';

import { reportError } from '@/lib/error-reporting';

// SecureStore values are limited to about 2 KB, and a Supabase session is larger, so it is split up.
const CHUNK_SIZE = 1800;

const options: SecureStore.SecureStoreOptions = {
  // Never restored onto another device from a backup
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const countKey = (key: string) => `${key}.count`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function readCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(key), options);
  const count = raw ? Number(raw) : 0;
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function secureGet(key: string): Promise<string | null> {
  const count = await readCount(key);
  if (count === 0) return null;

  const parts = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i), options)),
  );
  // A missing piece means a write was cut short: treat it as signed out rather than parse garbage
  return parts.every((part) => part !== null) ? parts.join('') : null;
}

async function secureSet(key: string, value: string): Promise<void> {
  const previousCount = await readCount(key);
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) chunks.push(value.slice(i, i + CHUNK_SIZE));

  await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk, options)));
  await SecureStore.setItemAsync(countKey(key), String(chunks.length), options);

  // The new value may be shorter than the old one
  for (let i = chunks.length; i < previousCount; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i), options);
  }
}

async function secureRemove(key: string): Promise<void> {
  const count = await readCount(key);
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i), options)),
  );
  await SecureStore.deleteItemAsync(countKey(key), options);
}

/**
 * Storage for the Supabase session that keeps the tokens in the device's secure store
 * (Keychain on iOS, Keystore-backed on Android) instead of the plain-text sqlite localStorage.
 */
export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const secure = await secureGet(key);
      if (secure !== null) return secure;

      // Sessions saved by earlier versions live in localStorage: move them over once
      const legacy = localStorage.getItem(key);
      if (legacy !== null) {
        await secureSet(key, legacy);
        localStorage.removeItem(key);
      }
      return legacy;
    } catch (err) {
      reportError(err, 'session-read');
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await secureSet(key, value);
    } catch (err) {
      reportError(err, 'session-write');
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await secureRemove(key);
      localStorage.removeItem(key);
    } catch (err) {
      reportError(err, 'session-remove');
    }
  },
};
