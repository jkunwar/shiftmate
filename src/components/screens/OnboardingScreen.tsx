import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBrand } from '@/components/auth/AuthParts';
import {
  ConfirmEmailStep,
  ForgotPasswordStep,
  SignInStep,
  SignUpStep,
  WelcomeStep,
} from '@/components/auth/steps/AuthSteps';
import { FontSize } from '@/constants/theme';
import { useAuthFlow } from '@/hooks/use-auth-flow';
import { useTheme } from '@/hooks/use-theme';

/** Welcome, sign up, sign in, forgot password and "check your email" steps. Signing in swaps the app in via AuthGate. */
export const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const flow = useAuthFlow();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}>
      <View style={styles.inner}>
        <AuthBrand />

        <View style={styles.main}>
          {flow.step === 'welcome' ? <WelcomeStep flow={flow} /> : null}
          {flow.step === 'signup' ? <SignUpStep flow={flow} /> : null}
          {flow.step === 'signin' ? <SignInStep flow={flow} /> : null}
          {flow.step === 'forgot' ? <ForgotPasswordStep flow={flow} /> : null}
          {flow.step === 'confirm' ? <ConfirmEmailStep flow={flow} /> : null}
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Your data is protected by row-level security in your account
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  main: {
    paddingVertical: 32,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
  },
});
