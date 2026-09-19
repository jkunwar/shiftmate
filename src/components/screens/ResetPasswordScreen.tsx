import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinkButton } from '@/components/auth/auth-ui';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

/** Shown after opening a password-reset email link. Setting a password finishes the recovery. */
export function ResetPasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 },
      ]}>
      <View style={styles.inner}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Set a New Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose a new password for your account
          </Text>
        </View>

        <SetPasswordForm submitLabel="Save Password" />
        <LinkButton label="Cancel and sign out" onPress={signOut} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    gap: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});
