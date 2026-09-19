import React, { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { readStored, STORAGE_KEYS } from '@/lib/storage';
import { UserPreferences } from '@/types';

type Scheme = 'light' | 'dark';

interface ThemeModeValue {
  scheme: Scheme;
  /** Forces dark or light. Until this is called the device setting is followed. */
  setDarkMode: (dark: boolean) => void;
}

const ThemeModeContext = createContext<ThemeModeValue | null>(null);

// Nothing to subscribe to: only the difference between server and client snapshots is used
const subscribeNever = () => () => {};

/**
 * Owns the app's light/dark choice. It reads the saved preference straight from storage so the
 * sign-in screens (which render before the app state exists) already use the right theme.
 */
export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemColorScheme();
  const [override, setOverride] = useState<boolean | null>(() => {
    const saved = readStored<Partial<UserPreferences> | null>(STORAGE_KEYS.preferences, null);
    return typeof saved?.darkMode === 'boolean' ? saved.darkMode : null;
  });

  // Static web rendering happens without storage or a device setting, so start light there
  // and switch after hydration to avoid a mismatch.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true, // in the browser and on devices
    () => Platform.OS !== 'web', // while rendering on the server
  );

  const dark = override === null ? system === 'dark' : override;
  const scheme: Scheme = hydrated && dark ? 'dark' : 'light';

  return (
    <ThemeModeContext.Provider value={{ scheme, setDarkMode: setOverride }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeValue {
  const context = useContext(ThemeModeContext);
  const system = useSystemColorScheme();
  // Outside the provider, fall back to the device setting
  return context ?? { scheme: system === 'dark' ? 'dark' : 'light', setDarkMode: () => {} };
}
