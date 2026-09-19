import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InfoCardProps {
  label: string;
  /** Text shown under the label. */
  value?: string;
  /** Use instead of `value` for anything more than one line of plain text. */
  children?: React.ReactNode;
}

/** A small tinted card with a caption and a value. */
export function InfoCard({ label, value, children }: InfoCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {value !== undefined ? (
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
  },
  value: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
