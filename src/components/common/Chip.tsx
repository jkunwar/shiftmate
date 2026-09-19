import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { FontSize } from '@/constants/theme';

export type ChipVariant = 'accent' | 'ink';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** How the selected chip is filled: the accent colour, or the text colour (inverted). */
  variant?: ChipVariant;
}

/** A rounded filter option, filled while selected. */
export function Chip({ label, selected, onPress, variant = 'accent' }: ChipProps) {
  const theme = useTheme();
  const fill = variant === 'ink' ? theme.text : theme.accent;
  const onFill = variant === 'ink' ? theme.background : theme.onAccent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: fill, borderColor: fill }
          : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Text style={[styles.chipText, { color: selected ? onFill : theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
