import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/common/DateTimeFields';
import { FormField } from '@/components/common/FormField';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, toLocalDateString } from '@/utils/timeCalculations';

interface ShiftDateFieldProps {
  value: string;
  onChange: (date: string) => void;
}

/** The shift date, with Today and Yesterday shortcuts. */
export function ShiftDateField({ value, onChange }: ShiftDateFieldProps) {
  const theme = useTheme();
  const today = toLocalDateString();
  const shortcuts = [
    ['Today', today],
    ['Yesterday', addDays(today, -1)],
  ] as const;

  return (
    <FormField
      label="Date"
      headerRight={
        <View style={styles.shortcuts}>
          {shortcuts.map(([label, date]) => {
            const selected = value === date;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                onPress={() => onChange(date)}
                style={[styles.shortcut, selected && { backgroundColor: theme.accentSoft }]}>
                <Text
                  style={[
                    styles.shortcutText,
                    { color: selected ? theme.accent : theme.textSecondary },
                    selected && styles.shortcutTextSelected,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      }>
      <DateField value={value} onChange={onChange} accessibilityLabel="Shift date" />
    </FormField>
  );
}

const styles = StyleSheet.create({
  shortcuts: {
    flexDirection: 'row',
    gap: 6,
  },
  shortcut: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shortcutText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  shortcutTextSelected: {
    fontWeight: '600',
  },
});
