import { useThemeMode } from '@/lib/theme-mode';

/** The app's colour scheme: the saved Light/Dark choice, or the device setting until one is made. */
export function useColorScheme(): 'light' | 'dark' {
  return useThemeMode().scheme;
}
