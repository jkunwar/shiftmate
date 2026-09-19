import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Info,
  KeyRound,
  LogOut,
  RefreshCw,
  Moon,
  Sliders,
  Sun,
  Trash2,
  User as UserIcon,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DeleteAccountModal } from '@/components/common/DeleteAccountModal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
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

/** A boolean that turns on when triggered and switches itself off after `ms`. */
function useTimedFlag(ms: number) {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const trigger = () => {
    if (timer.current) clearTimeout(timer.current);
    setActive(true);
    timer.current = setTimeout(() => setActive(false), ms);
  };

  return [active, trigger] as const;
}

function SectionCard({
  icon: Icon,
  iconColor,
  title,
  right,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Icon color={iconColor} size={16} />
          <Text style={[styles.cardTitleText, { color: theme.text }]}>{title}</Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Label + description on the left, a control on the right. */
function PreferenceRow({
  title,
  description,
  first,
  children,
}: {
  title: string;
  description: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.prefRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
          paddingTop: 12,
        },
      ]}>
      <View style={styles.prefText}>
        <Text style={[styles.prefTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.prefDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

function ActionRow({
  icon: Icon,
  iconColor,
  label,
  destructive,
  onPress,
}: {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const textColor = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        destructive
          ? { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}33` }
          : {
            backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: theme.border,
          },
        destructive && pressed && styles.pressed,
      ]}>
      <View style={styles.actionLabel}>
        <Icon color={iconColor ?? textColor} size={16} />
        <Text style={[styles.actionText, { color: textColor }]}>{label}</Text>
      </View>
      <ChevronRight color={destructive ? theme.danger : theme.textSecondary} size={16} />
    </Pressable>
  );
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

  const [userName, setUserName] = useState(user.name);
  const [userEmail, setUserEmail] = useState(user.email);
  const [defaultRate, setDefaultRate] = useState(preferences.defaultHourlyRate.toString());
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [savedNotice, showSavedNotice] = useTimedFlag(2500);

  const initials =
    user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?';

  const handleSaveProfile = () => {
    onUpdateUser({ name: userName.trim() || user.name, email: userEmail.trim() || user.email });
    showSavedNotice();
  };

  // Saved when the field loses focus, so it doesn't depend on the profile button below
  const handleSaveRate = () => {
    // Some locales' decimal keypads produce "18,5"
    const rateNum = parseFloat(defaultRate.replace(',', '.'));
    if (!isNaN(rateNum) && rateNum > 0) {
      if (rateNum !== preferences.defaultHourlyRate) {
        onUpdatePreferences({ defaultHourlyRate: rateNum });
      }
    } else {
      setDefaultRate(preferences.defaultHourlyRate.toString());
    }
  };

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      {/* Header */}
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

      {/* Profile summary */}
      <View style={[styles.profile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>{initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text numberOfLines={1} style={[styles.profileName, { color: theme.text }]}>
            {user.name}
          </Text>
          <Text numberOfLines={1} style={[styles.profileEmail, { color: theme.textSecondary }]}>
            {user.email}
          </Text>
        </View>
      </View>

      {/* Preferences */}
      <SectionCard icon={Sliders} iconColor={theme.accent} title="Preferences">
        <PreferenceRow
          first
          title="Default Hourly Rate"
          description="Applied to new workplaces">
          <View style={styles.rateWrap}>
            <Text style={[styles.currency, { color: theme.textSecondary }]}>{preferences.currency}</Text>
            <TextInput
              value={defaultRate}
              onChangeText={setDefaultRate}
              onEndEditing={handleSaveRate}
              keyboardType="decimal-pad"
              style={[styles.input, styles.rateInput, inputStyle]}
            />
          </View>
        </PreferenceRow>

        <PreferenceRow title="Week Starts On" description="Calendar and weekly grouping">
          <SegmentedControl
            selectedTone="accent"
            options={[
              { value: 'monday', label: 'Monday' },
              { value: 'sunday', label: 'Sunday' },
            ]}
            value={preferences.weekStartsOn}
            onChange={(weekStartsOn) => onUpdatePreferences({ weekStartsOn })}
          />
        </PreferenceRow>

        <PreferenceRow title="Time Format" description="12-hour or 24-hour clock">
          <SegmentedControl
            selectedTone="accent"
            options={[
              { value: '12h', label: '12h' },
              { value: '24h', label: '24h' },
            ]}
            value={preferences.timeFormat}
            onChange={(timeFormat) => onUpdatePreferences({ timeFormat })}
          />
        </PreferenceRow>

        <PreferenceRow title="Currency" description="Symbol shown next to amounts">
          <SegmentedControl
            selectedTone="accent"
            options={[
              { value: '$', label: '$' },
              { value: '€', label: '€' },
              { value: '£', label: '£' },
              { value: '¥', label: '¥' },
              { value: '₹', label: '₹' },
            ]}
            value={preferences.currency}
            onChange={(currency) => onUpdatePreferences({ currency })}
          />
        </PreferenceRow>

        <PreferenceRow title="Dark Mode" description="Toggle interface color theme">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle dark mode"
            onPress={() => onUpdatePreferences({ darkMode: !preferences.darkMode })}
            style={[
              styles.themeToggle,
              {
                backgroundColor: preferences.darkMode
                  ? theme.backgroundSelected
                  : theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}>
            {preferences.darkMode ? (
              <Moon color={theme.warning} size={16} />
            ) : (
              <Sun color={theme.textSecondary} size={16} />
            )}
          </Pressable>
        </PreferenceRow>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} iconColor={theme.accent} title="Notifications">
        <PreferenceRow
          first
          title="Shift Reminders"
          description="Prompt to log hours at usual times">
          <Switch
            value={preferences.shiftReminder}
            onValueChange={(shiftReminder) => onUpdatePreferences({ shiftReminder })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
            thumbColor="#ffffff"
          />
        </PreferenceRow>

        <PreferenceRow
          title="Weekly Hours Summary"
          description="End of week total worked notification">
          <Switch
            value={preferences.weeklyHoursReminder}
            onValueChange={(weeklyHoursReminder) => onUpdatePreferences({ weeklyHoursReminder })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
            thumbColor="#ffffff"
          />
        </PreferenceRow>

        <PreferenceRow
          title="Unpaid Hours Alert"
          description="Remind when payday is approaching">
          <Switch
            value={preferences.unpaidHoursReminder}
            onValueChange={(unpaidHoursReminder) => onUpdatePreferences({ unpaidHoursReminder })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
            thumbColor="#ffffff"
          />
        </PreferenceRow>
      </SectionCard>

      {/* Account details */}
      <SectionCard icon={UserIcon} iconColor={theme.accent} title="Account Details">
        {savedNotice ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: theme.successSoft, borderColor: `${theme.success}55` },
            ]}>
            <Check color={theme.success} size={16} />
            <Text style={[styles.noticeText, { color: theme.success }]}>Changes saved</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Name</Text>
          <TextInput
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="words"
            style={[styles.input, inputStyle]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.text }]}>Email</Text>
          <TextInput
            value={userEmail}
            onChangeText={setUserEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, inputStyle]}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleSaveProfile}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}>
          <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>Save Changes</Text>
        </Pressable>
      </SectionCard>

      {/* Security */}
      {canChangePassword ? (
        <SectionCard icon={KeyRound} iconColor={theme.accent} title="Change Password">
          <SetPasswordForm submitLabel="Update Password" />
        </SectionCard>
      ) : null}

      {/* About */}
      <SectionCard icon={Info} iconColor={theme.accent} title="About">
        {[
          ['App Version', 'v1.0.0'],
          ['Data Privacy', 'Only you can see your data'],
        ].map(([label, value], index) => (
          <View
            key={label}
            style={[
              styles.aboutRow,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.border,
              },
            ]}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>{value}</Text>
          </View>
        ))}
      </SectionCard>

      {/* Session & danger zone, kept last and away from everyday settings */}
      <View style={styles.actions}>
        {isSupabaseConnected && onSyncNow ? (
          <ActionRow
            icon={RefreshCw}
            label={
              pendingChanges > 0
                ? `Sync Now (${pendingChanges} ${pendingChanges === 1 ? 'change' : 'changes'} waiting)`
                : 'Sync Now'
            }
            onPress={onSyncNow}
          />
        ) : null}
        {isSupabaseConnected && onSignOutSupabase ? (
          <ActionRow icon={LogOut} label="Sign Out" onPress={onSignOutSupabase} />
        ) : null}
        <ActionRow
          icon={Trash2}
          destructive
          label="Delete Account & Records"
          onPress={() => setShowDeleteAccountConfirm(true)}
        />
      </View>

      {/* With an account: typed confirmation. Local-only mode: plain confirm that resets the device. */}
      {onDeleteAccount ? (
        <DeleteAccountModal
          isOpen={showDeleteAccountConfirm}
          onDelete={onDeleteAccount}
          onClose={() => setShowDeleteAccountConfirm(false)}
        />
      ) : (
        <ConfirmationDialog
          isOpen={showDeleteAccountConfirm}
          title="Erase local data?"
          message="All shifts, workplaces, and timesheet records on this device will be permanently erased."
          confirmLabel="Erase Everything"
          cancelLabel="Cancel"
          isDestructive
          onConfirm={() => {
            setShowDeleteAccountConfirm(false);
            onResetDemoData?.();
          }}
          onCancel={() => setShowDeleteAccountConfirm(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
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
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  profileName: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: FontSize.xs,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prefText: {
    flex: 1,
  },
  prefTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  prefDescription: {
    fontSize: FontSize.xs,
  },
  rateWrap: {
    width: 96,
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  rateInput: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 6,
    textAlign: 'right',
    fontWeight: '700',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actions: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: FontSize.xs,
  },
  aboutValue: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
});
