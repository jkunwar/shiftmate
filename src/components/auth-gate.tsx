import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { OnboardingScreen } from '@/components/screens/OnboardingScreen';
import { ResetPasswordScreen } from '@/components/screens/ResetPasswordScreen';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

/**
 * Shows the app only to signed-in users. Without Supabase configured there are no accounts,
 * so the app runs in local-only mode and the gate stays open.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { isConfigured, isLoading, session, isRecovery } = useAuth();

  if (!isConfigured) return <>{children}</>;

  if (isLoading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (isRecovery) {
    return (
      <ThemedView style={styles.fill}>
        <ResetPasswordScreen />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <ThemedView style={styles.fill}>
        <OnboardingScreen />
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
