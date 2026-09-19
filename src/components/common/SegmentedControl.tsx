import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretches the segments to share the full width equally. */
  fill?: boolean;
  /** Colour of the selected label. */
  selectedTone?: 'text' | 'accent';
}

/** A row of mutually exclusive options; the selected one sits on a raised surface. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fill,
  selectedTone = 'text',
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map(({ value: optionValue, label, icon: Icon }) => {
        const selected = optionValue === value;
        const color = selected
          ? selectedTone === 'accent'
            ? theme.accent
            : theme.text
          : theme.textSecondary;

        return (
          <Pressable
            key={optionValue}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(optionValue)}
            style={[
              styles.segment,
              fill && styles.segmentFill,
              selected && { backgroundColor: theme.surface },
            ]}>
            {Icon ? <Icon color={color} size={14} /> : null}
            <Text
              numberOfLines={1}
              style={[styles.segmentText, { color }, selected && styles.segmentTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentFill: {
    flex: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  segmentTextSelected: {
    fontWeight: '600',
  },
});
