import { Alert, Linking } from 'react-native';

import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/lib/app-state';
import { useAuth } from '@/lib/auth';
import { remindersSupported, requestNotificationPermission } from '@/lib/notifications';
import { User, UserPreferences } from '@/types';

export default function SettingsRoute() {
  const { isConfigured, updateProfile } = useAuth();
  const {
    user,
    preferences,
    supabaseUser,
    pendingChanges,
    syncNow,
    signOutSupabase,
    deleteAccountData,
    updateUser,
    updatePreferences,
    resetDemoData,
  } = useAppState();

  // Switching a reminder on needs the system's notification permission first
  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    const turningOnReminder =
      updates.shiftReminder || updates.weeklyHoursReminder || updates.unpaidHoursReminder;

    if (turningOnReminder && !remindersSupported) {
      Alert.alert(
        'Reminders unavailable here',
        'Reminders need a development build or the installed app. Expo Go on Android doesn\'t support notifications.',
      );
      return;
    }

    if (turningOnReminder && !(await requestNotificationPermission())) {
      Alert.alert(
        'Notifications are off',
        'Allow notifications for ShiftMate in your phone settings to get reminders.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    updatePreferences(updates);
  };

  // Name and email live in the Supabase account too, not just on the device
  const handleUpdateUser = async (updates: Partial<User>) => {
    updateUser(updates);
    if (!supabaseUser) return;

    const emailChanged = Boolean(updates.email) && updates.email !== supabaseUser.email;
    const { error } = await updateProfile({
      name: updates.name,
      email: emailChanged ? updates.email : undefined,
    });
    if (error) {
      Alert.alert('Could not update your account', error);
    } else if (emailChanged) {
      Alert.alert('Confirm your new email', 'We sent a confirmation link to the new address.');
    }
  };

  // Signing out clears the device's copy, so warn if changes haven't reached the cloud yet
  const handleSignOut = () => {
    if (pendingChanges === 0) {
      signOutSupabase();
      return;
    }
    Alert.alert(
      'Unsynced changes',
      `${pendingChanges} ${pendingChanges === 1 ? 'change hasn' : 'changes haven'}'t been saved to the cloud yet. Signing out now will discard ${pendingChanges === 1 ? 'it' : 'them'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out Anyway', style: 'destructive', onPress: signOutSupabase },
      ],
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SettingsScreen
        user={user}
        preferences={preferences}
        onUpdateUser={handleUpdateUser}
        onUpdatePreferences={handleUpdatePreferences}
        // Demo data is for local-only mode; with an account the cloud holds the data
        onResetDemoData={isConfigured ? undefined : resetDemoData}
        onDeleteAccount={isConfigured ? deleteAccountData : undefined}
        canChangePassword={Boolean(supabaseUser)}
        isSupabaseConnected={Boolean(supabaseUser)}
        onSignOutSupabase={handleSignOut}
        onSyncNow={syncNow}
        pendingChanges={pendingChanges}
      />
    </ThemedView>
  );
}
