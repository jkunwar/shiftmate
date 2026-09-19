import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeaderProps {
  title: string;
  /** An optional link on the right, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
}

/** The small heading above a Home section. */
export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: theme.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    textTransform: 'capitalize',
    letterSpacing: 0.6,
  },
  action: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
