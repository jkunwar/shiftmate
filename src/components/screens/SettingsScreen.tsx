import { ArrowLeft, KeyRound } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { AboutSection } from '@/components/settings/AboutSection';
import { AccountActions } from '@/components/settings/AccountActions';
import { AccountDetailsSection } from '@/components/settings/AccountDetailsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { PayPeriodSection } from '@/components/settings/PayPeriodSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { ProfileSummary } from '@/components/settings/ProfileSummary';
import { SectionCard } from '@/components/settings/SectionCard';
import { BottomTabInset, FontSize, ScreenTitle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { User, UserPreferences } from '@/types';

interface SettingsScreenProps {
  user: User;
  preferences: UserPreferences;
  /** Settings is a tab, so there's normally nothing to go back to; the button only shows if given. */
  onBack?: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  onUpdatePreferences: (updatedPrefs: Partial<UserPreferences>) => void;
  /** Permanently deletes the account. Resolves with an error message, or null on success. */
  onDeleteAccount?: () => Promise<string | null>;
  /** Local-only mode (no account): "Delete" resets the on-device data instead. */
  onResetDemoData?: () => void;
  /** Shows the "Change Password" card (needs a signed-in Supabase account). */
  canChangePassword?: boolean;
  isSupabaseConnected?: boolean;
  onSignOutSupabase?: () => void;
  /** Cloud sync: shows a "Sync Now" row with how many changes are still waiting. */
  onSyncNow?: () => void;
  pendingChanges?: number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  preferences,
  onBack,
  onUpdateUser,
  onUpdatePreferences,
  onDeleteAccount,
  onResetDemoData,
  canChangePassword = false,
  isSupabaseConnected = false,
  onSignOutSupabase,
  onSyncNow,
  pendingChanges = 0,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={styles.backButton}>
            <ArrowLeft color={theme.textSecondary} size={16} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Back</Text>
          </Pressable>
        ) : null}
        <Text style={[styles.heading, { color: theme.text }]}>Settings</Text>
      </View>

      <ProfileSummary user={user} />

      <PreferencesSection preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
      <PayPeriodSection preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
      <NotificationsSection preferences={preferences} onUpdatePreferences={onUpdatePreferences} />
      <AccountDetailsSection user={user} onUpdateUser={onUpdateUser} />

      {canChangePassword ? (
        <SectionCard icon={KeyRound} title="Change Password">
          <SetPasswordForm submitLabel="Update Password" />
        </SectionCard>
      ) : null}

      <AboutSection />

      <AccountActions
        isSupabaseConnected={isSupabaseConnected}
        onSyncNow={onSyncNow}
        pendingChanges={pendingChanges}
        onSignOut={onSignOutSupabase}
        onDeleteAccount={onDeleteAccount}
        onResetDemoData={onResetDemoData}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  heading: {
    ...ScreenTitle,
  },
});
