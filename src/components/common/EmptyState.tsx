import { Briefcase, Calendar, CheckCircle2, FileText, Plus, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { FontSize } from '@/constants/theme';

interface EmptyStateProps {
  type: 'workplaces' | 'shifts' | 'unpaid' | 'reports' | 'custom';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type ThemeKey = 'accent' | 'success' | 'textSecondary';

const defaults: Record<
  EmptyStateProps['type'],
  { icon: LucideIcon; color: ThemeKey; title: string; description: string; button: string }
> = {
  custom: {
    icon: Briefcase,
    color: 'textSecondary',
    title: 'No items found',
    description: 'There are no records to display.',
    button: 'Add Item',
  },
  workplaces: {
    icon: Briefcase,
    color: 'accent',
    title: 'Add your first workplace',
    description: 'Keep your work hours organized in one place.',
    button: 'Add Workplace',
  },
  shifts: {
    icon: Calendar,
    color: 'accent',
    title: 'No shifts recorded yet',
    description: 'Tap the plus button below to log your first work shift.',
    button: 'Add Shift',
  },
  unpaid: {
    icon: CheckCircle2,
    color: 'success',
    title: "You're all caught up",
    description: 'No unpaid hours recorded for this period.',
    button: '',
  },
  reports: {
    icon: FileText,
    color: 'textSecondary',
    title: 'Your reports will appear here',
    description: 'Adjust the filters or record shifts to generate timesheets.',
    button: '',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();
  const preset = defaults[type];
  const Icon = preset.icon;

  const finalTitle = title || preset.title;
  const finalDesc = description || preset.description;
  const finalBtn = actionLabel !== undefined ? actionLabel : preset.button;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Icon color={theme[preset.color]} size={32} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{finalTitle}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{finalDesc}</Text>
      {finalBtn && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}>
          <Plus color={theme.onAccent} size={16} />
          <Text style={[styles.buttonText, { color: theme.onAccent }]}>{finalBtn}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginVertical: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
