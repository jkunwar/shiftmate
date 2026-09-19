import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/common/DateTimeFields';
import { FormField } from '@/components/common/FormField';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PaymentStatus } from '@/types';

interface PaymentStatusPickerProps {
  status: PaymentStatus;
  onStatusChange: (status: PaymentStatus) => void;
  paidDate: string;
  onPaidDateChange: (date: string) => void;
}

/** Unpaid or Paid, and the paid date when it is paid. */
export function PaymentStatusPicker({
  status,
  onStatusChange,
  paidDate,
  onPaidDateChange,
}: PaymentStatusPickerProps) {
  const theme = useTheme();

  const options = [
    { value: 'unpaid', label: '○ Unpaid', color: theme.warning, soft: theme.warningSoft },
    { value: 'paid', label: '● Paid', color: theme.success, soft: theme.successSoft },
  ] as const;

  return (
    <FormField label="Payment Status">
      <View style={styles.row}>
        {options.map((option) => {
          const selected = status === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onStatusChange(option.value)}
              style={[
                styles.button,
                selected
                  ? { backgroundColor: option.soft, borderColor: option.color }
                  : { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <Text
                style={[styles.text, { color: selected ? option.color : theme.textSecondary }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {status === 'paid' ? (
        <View
          style={[
            styles.paidDate,
            { backgroundColor: theme.successSoft, borderColor: `${theme.success}55` },
          ]}>
          <Text style={[styles.paidDateLabel, { color: theme.success }]}>Paid Date</Text>
          <DateField value={paidDate} onChange={onPaidDateChange} accessibilityLabel="Paid date" />
        </View>
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  paidDate: {
    marginTop: 4,
    padding: 12,
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  paidDateLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
