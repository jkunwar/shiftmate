import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Field, LinkButton, PrimaryButton } from '@/components/auth/auth-ui';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { FontSize } from '@/constants/theme';

type AuthStep = 'welcome' | 'signup' | 'signin' | 'forgot' | 'confirm';

const PURPLE = '#8A5A83';

function Pillar({
  icon: Icon,
  color,
  background,
  title,
  description,
}: {
  icon: LucideIcon;
  color: string;
  background: string;
  title: string;
  description: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.pillar,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={[styles.pillarIcon, { backgroundColor: background }]}>
        <Icon color={color} size={16} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.pillarTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.pillarDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

/** Welcome, sign up, sign in, forgot password and "check your email" steps. Signing in swaps the app in via AuthGate. */
export const OnboardingScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, resendConfirmation, sendPasswordReset, linkError, clearLinkError } =
    useAuth();

  const [step, setStep] = useState<AuthStep>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goToStep = (next: AuthStep) => {
    setErrorMsg('');
    setInfoMsg('');
    clearLinkError();
    setStep(next);
  };

  const handleCreateAccount = async () => {
    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const { error, needsConfirmation } = await signUp(name, email, password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    // Without confirmation the new session is picked up and AuthGate shows the app
    if (needsConfirmation) setStep('confirm');
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    clearLinkError();
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) setErrorMsg(error);
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Enter the email address of your account');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const { error } = await sendPasswordReset(email);
    setIsLoading(false);

    if (error) setErrorMsg(error);
    else setInfoMsg('If an account exists for that email, a reset link is on its way.');
  };

  const handleResend = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const { error } = await resendConfirmation(email);
    setIsLoading(false);

    if (error) setErrorMsg(error);
    else setInfoMsg('Confirmation email sent again.');
  };

  const messages = (
    <>
      {linkError ? <Banner tone="error" message={linkError} /> : null}
      {errorMsg ? <Banner tone="error" message={errorMsg} /> : null}
      {infoMsg ? <Banner tone="success" message={infoMsg} /> : null}
    </>
  );

  const emailField = (
    <Field
      label="Email"
      value={email}
      onChangeText={setEmail}
      placeholder="alex@example.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="email"
    />
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}>
      <View style={styles.inner}>
        {/* Top brand logo */}
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.accent }]}>
            <Clock color={theme.onAccent} size={20} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[styles.brandName, { color: theme.text }]}>ShiftMate</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Simple. Fast. Accurate.
            </Text>
          </View>
        </View>

        {/* Main flow content */}
        <View style={styles.main}>
          {step === 'welcome' ? (
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
                  Designed for fast, 10-second daily shift logging, workplace organization, unpaid
                  hour tracking, and clean timesheet reports.
                </Text>
              </View>

              {linkError ? <Banner tone="error" message={linkError} /> : null}

              {/* 3 value pillars */}
              <View style={styles.pillars}>
                <Pillar
                  icon={Clock}
                  color={theme.accent}
                  background={theme.accentSoft}
                  title="Record in 10 Seconds"
                  description="Pre-selected templates and automatic calculations."
                />
                <Pillar
                  icon={CheckCircle2}
                  color={theme.success}
                  background={theme.successSoft}
                  title="Paid vs Unpaid Tracking"
                  description="Always know how much money you are currently owed."
                />
                <Pillar
                  icon={FileSpreadsheet}
                  color={PURPLE}
                  background={`${PURPLE}22`}
                  title="Employer-Ready Timesheets"
                  description="Export clean PDFs or CSVs directly to your manager."
                />
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => goToStep('signup')}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: pressed ? theme.accentPressed : theme.accent },
                  ]}>
                  <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>
                    Get Started
                  </Text>
                  <ArrowRight color={theme.onAccent} size={16} />
                </Pressable>

                <LinkButton
                  label="I already have an account"
                  onPress={() => goToStep('signin')}
                />
              </View>
            </View>
          ) : null}

          {step === 'signup' ? (
            <View style={styles.section}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Your hours sync securely to your account
                </Text>
              </View>

              {messages}

              <View style={styles.form}>
                <Field
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Alex Rivera"
                  autoCapitalize="words"
                  autoComplete="name"
                />
                {emailField}
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
                <Field
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                />

                <View style={styles.actions}>
                  <PrimaryButton
                    label="Create Account"
                    loadingLabel="Creating Account..."
                    isLoading={isLoading}
                    onPress={handleCreateAccount}
                  />
                  <LinkButton
                    label="Already have an account? Sign In"
                    onPress={() => goToStep('signin')}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {step === 'signin' ? (
            <View style={styles.section}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Sign in to sync your work hours
                </Text>
              </View>

              {messages}

              <View style={styles.form}>
                {emailField}
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={() => goToStep('forgot')}
                  hitSlop={8}
                  style={styles.forgot}>
                  <Text style={[styles.forgotText, { color: theme.accent }]}>
                    Forgot password?
                  </Text>
                </Pressable>

                <View style={styles.actions}>
                  <PrimaryButton
                    label="Sign In"
                    loadingLabel="Signing In..."
                    isLoading={isLoading}
                    onPress={handleSignIn}
                  />
                  <LinkButton
                    label="Need an account? Create one"
                    onPress={() => goToStep('signup')}
                  />
                </View>
              </View>
            </View>
          ) : null}

          {step === 'forgot' ? (
            <View style={styles.section}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  We&apos;ll email you a link to choose a new password
                </Text>
              </View>

              {messages}

              <View style={styles.form}>
                {emailField}
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Send Reset Link"
                    loadingLabel="Sending..."
                    isLoading={isLoading}
                    onPress={handleForgotPassword}
                  />
                  <LinkButton label="Back to Sign In" onPress={() => goToStep('signin')} />
                </View>
              </View>
            </View>
          ) : null}

          {step === 'confirm' ? (
            <View style={styles.section}>
              <View
                style={[
                  styles.mailIcon,
                  { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}55` },
                ]}>
                <Mail color={theme.accent} size={28} />
              </View>

              <View>
                <Text style={[styles.title, { color: theme.text }]}>Check Your Email</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  We sent a confirmation link to {email.trim()}. Open it on this device, then sign
                  in.
                </Text>
              </View>

              {messages}

              <View style={styles.actions}>
                <PrimaryButton label="Go to Sign In" onPress={() => goToStep('signin')} />
                <LinkButton
                  label={isLoading ? 'Sending...' : "Didn't get it? Resend email"}
                  onPress={handleResend}
                />
              </View>
            </View>
          ) : null}
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Your data is protected by row-level security in your account
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagline: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  main: {
    paddingVertical: 32,
  },
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
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillarIcon: {
    padding: 8,
    borderRadius: 12,
  },
  pillarTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  pillarDescription: {
    fontSize: FontSize.xs,
  },
  actions: {
    gap: 10,
    paddingTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  primaryButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 4,
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
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
  },
});
