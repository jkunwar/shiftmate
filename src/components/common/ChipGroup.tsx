import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/common/Chip';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  /** A small heading above the chips. */
  label?: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A scrolling row of chips where exactly one is selected. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
});
