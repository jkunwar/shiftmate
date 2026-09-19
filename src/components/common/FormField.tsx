import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FormFieldProps {
  label: string;
  /** Small text on the right of the label. */
  hint?: string;
  /** Anything to put on the right of the label instead of a hint (e.g. quick actions). */
  headerRight?: React.ReactNode;
  /** A line of explanation under the label. */
  description?: string;
  children: React.ReactNode;
}

/** A form control with its uppercase label. */
export function FormField({ label, hint, headerRight, description, children }: FormFieldProps) {
  const theme = useTheme();
  const hasHeaderRight = Boolean(hint || headerRight);

  return (
    <View style={styles.field}>
      {hasHeaderRight ? (
        <View style={styles.header}>
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
          {headerRight ?? <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text>}
        </View>
      ) : (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      {description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  description: {
    fontSize: FontSize.xs,
  },
});
