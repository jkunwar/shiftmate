import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeading, AuthMessages, ValuePillar } from '@/components/auth/AuthParts';
import { Banner, Field, LinkButton, PrimaryButton } from '@/components/auth/auth-ui';
import { FontSize } from '@/constants/theme';
import type { AuthFlow } from '@/hooks/use-auth-flow';
import { useTheme } from '@/hooks/use-theme';

// A plum that matches the app's earthy palette
const PLUM = '#8A5A83';

function EmailField({ flow }: { flow: AuthFlow }) {
  return (
    <Field
      label="Email"
      value={flow.email}
      onChangeText={flow.setEmail}
      placeholder="alex@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
    />
  );
}

/** First screen: what the app is for, and where to sign up or in. */
export function WelcomeStep({ flow }: { flow: AuthFlow }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.hero}>
        <View
          style={[
            styles.chip,
            { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}55` },
          ]}>
          <ShieldCheck color={theme.accent} size={14} />
          <Text style={[styles.chipText, { color: theme.accent }]}>
            Multi-Job Work Hour Tracking
          </Text>
        </View>

        <Text style={[styles.headline, { color: theme.text }]}>
          Track your hours. Know what you&apos;ve worked. Get paid accurately.
        </Text>

        <Text style={[styles.lead, { color: theme.textSecondary }]}>
          Designed for fast, 10-second daily shift logging, workplace organization, unpaid hour
          tracking, and clean timesheet reports.
        </Text>
      </View>

      {flow.linkError ? <Banner tone="error" message={flow.linkError} /> : null}

      <View style={styles.pillars}>
        <ValuePillar
          icon={Clock}
          color={theme.accent}
          background={theme.accentSoft}
          title="Record in 10 Seconds"
          description="Pre-selected templates and automatic calculations."
        />
        <ValuePillar
          icon={CheckCircle2}
          color={theme.success}
          background={theme.successSoft}
          title="Paid vs Unpaid Tracking"
          description="Always know how much money you are currently owed."
        />
        <ValuePillar
          icon={FileSpreadsheet}
          color={PLUM}
          background={`${PLUM}22`}
          title="Employer-Ready Timesheets"
          description="Export clean PDFs or CSVs directly to your manager."
        />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Get Started"
          trailingIcon={<ArrowRight color={theme.onAccent} size={16} />}
          onPress={() => flow.goToStep('signup')}
        />
        <LinkButton label="I already have an account" onPress={() => flow.goToStep('signin')} />
      </View>
    </View>
  );
}

export function SignUpStep({ flow }: { flow: AuthFlow }) {
  return (
    <View style={styles.section}>
      <AuthHeading title="Create Account" subtitle="Your hours sync securely to your account" />
      <AuthMessages flow={flow} />

      <View style={styles.form}>
        <Field
          label="Full Name"
          value={flow.name}
          onChangeText={flow.setName}
          placeholder="Alex Rivera"
          autoCapitalize="words"
          autoComplete="name"
        />
        <EmailField flow={flow} />
        <Field
          label="Password"
          value={flow.password}
          onChangeText={flow.setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
        />
        <Field
          label="Confirm Password"
          value={flow.confirmPassword}
          onChangeText={flow.setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
        />

        <View style={styles.actions}>
          <PrimaryButton
            label="Create Account"
            loadingLabel="Creating Account..."
            isLoading={flow.isLoading}
            onPress={flow.createAccount}
          />
          <LinkButton
            label="Already have an account? Sign In"
            onPress={() => flow.goToStep('signin')}
          />
        </View>
      </View>
    </View>
  );
}

export function SignInStep({ flow }: { flow: AuthFlow }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <AuthHeading title="Welcome Back" subtitle="Sign in to sync your work hours" />
      <AuthMessages flow={flow} />

      <View style={styles.form}>
        <EmailField flow={flow} />
        <Field
          label="Password"
          value={flow.password}
          onChangeText={flow.setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => flow.goToStep('forgot')}
          hitSlop={8}
          style={styles.forgot}>
          <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</Text>
        </Pressable>

        <View style={styles.actions}>
          <PrimaryButton
            label="Sign In"
            loadingLabel="Signing In..."
            isLoading={flow.isLoading}
            onPress={flow.signInWithPassword}
          />
          <LinkButton label="Need an account? Create one" onPress={() => flow.goToStep('signup')} />
        </View>
      </View>
    </View>
  );
}

export function ForgotPasswordStep({ flow }: { flow: AuthFlow }) {
  return (
    <View style={styles.section}>
      <AuthHeading
        title="Reset Password"
        subtitle="We'll email you a link to choose a new password"
      />
      <AuthMessages flow={flow} />

      <View style={styles.form}>
        <EmailField flow={flow} />
        <View style={styles.actions}>
          <PrimaryButton
            label="Send Reset Link"
            loadingLabel="Sending..."
            isLoading={flow.isLoading}
            onPress={flow.requestPasswordReset}
          />
          <LinkButton label="Back to Sign In" onPress={() => flow.goToStep('signin')} />
        </View>
      </View>
    </View>
  );
}

export function ConfirmEmailStep({ flow }: { flow: AuthFlow }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.mailIcon,
          { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}55` },
        ]}>
        <Mail color={theme.accent} size={28} />
      </View>

      <AuthHeading
        title="Check Your Email"
        subtitle={`We sent a confirmation link to ${flow.email.trim()}. Open it on this device, then sign in.`}
      />
      <AuthMessages flow={flow} />

      <View style={styles.actions}>
        <PrimaryButton label="Go to Sign In" onPress={() => flow.goToStep('signin')} />
        <LinkButton
          label={flow.isLoading ? 'Sending...' : "Didn't get it? Resend email"}
          onPress={flow.resendConfirmationEmail}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  hero: {
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  headline: {
    fontSize: FontSize.xxl,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  lead: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  pillars: {
    gap: 10,
    paddingTop: 8,
  },
  actions: {
    gap: 10,
    paddingTop: 8,
  },
  form: {
    gap: 12,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  mailIcon: {
    alignSelf: 'flex-start',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
});
