import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PreferenceRowProps {
  title: string;
  description: string;
  /** The first row in a card has no divider above it. */
  first?: boolean;
  children: React.ReactNode;
}

/** Label and description on the left, a control on the right. */
export function PreferenceRow({ title, description, first, children }: PreferenceRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
          paddingTop: 12,
        },
      ]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  description: {
    fontSize: FontSize.xs,
  },
});
