import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/common/FormField';
import { softChipStyle } from '@/components/shifts/form/soft-chip';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BREAK_OPTIONS } from '@/utils/shiftForm';

interface BreakPickerProps {
  value: number;
  onChange: (minutes: number) => void;
}

/** The unpaid break, in a few fixed lengths. */
export function BreakPicker({ value, onChange }: BreakPickerProps) {
  const theme = useTheme();

  return (
    <FormField label="Unpaid Break" hint={value > 0 ? `${value} minutes` : 'No break'}>
      <View style={styles.row}>
        {BREAK_OPTIONS.map((minutes) => {
          const selected = value === minutes;
          return (
            <Pressable
              key={minutes}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(minutes)}
              style={[styles.pill, softChipStyle(theme, selected)]}>
              <Text
                style={[
                  styles.text,
                  { color: selected ? theme.accent : theme.textSecondary },
                  selected && styles.textSelected,
                ]}>
                {minutes === 0 ? 'None' : `${minutes}m`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  textSelected: {
    fontWeight: '600',
  },
});
