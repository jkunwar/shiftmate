import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppModals } from '@/components/app-modals';
import AppTabs from '@/components/app-tabs';
import { AuthGate } from '@/components/auth-gate';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppStateProvider } from '@/lib/app-state';
import { AuthProvider } from '@/lib/auth';
import { ThemeModeProvider } from '@/lib/theme-mode';

const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.accent,
      background: Colors.light.background,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.accent,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  },
};

function ThemedApp() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={navigationThemes[colorScheme]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <AuthGate>
          {/* Mounted only while signed in, so each account starts from its own fresh state */}
          <AppStateProvider>
            <AppTabs />
            <AppModals />
          </AppStateProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
