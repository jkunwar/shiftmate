/**
 * The light/dark choice lives in ThemeModeProvider (see lib/theme-mode.tsx).
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  return Colors[useColorScheme()];
}
