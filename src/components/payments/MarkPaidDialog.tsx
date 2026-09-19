import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Dialog } from '@/components/common/Dialog';
import { DateField } from '@/components/common/DateTimeFields';
import { FormField } from '@/components/common/FormField';
import { MoneyInput } from '@/components/common/MoneyInput';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import {
  initialReceivedInput,
  isValidPaidDate,
  parseReceivedAmount,
} from '@/utils/paymentStats';
import { formatDate, shiftEarnings, toLocalDateString } from '@/utils/timeCalculations';

interface MarkPaidDialogProps {
  shift: Shift;
  workplace?: Workplace;
  /** Heading; defaults to "Record Payment Received". */
  title?: string;
  /** Show "Workplace · date" under the heading. */
  showShiftSubtitle?: boolean;
  amountLabel?: string;
  confirmLabel?: string;
  onClose: () => void;
  onSave: (paidDate: string, receivedAmount: number | undefined) => void;
}

/** Records when a shift was paid and how much arrived. Mount it fresh for each shift. */
export function MarkPaidDialog({
  shift,
  workplace,
  title = 'Record Payment Received',
  showShiftSubtitle = true,
  amountLabel = 'Actual Amount Received',
  confirmLabel = 'Save Payment',
  onClose,
  onSave,
}: MarkPaidDialogProps) {
  const theme = useTheme();
  const { money } = useFormat();

  const expected = shiftEarnings(shift, workplace);
  const [paidDate, setPaidDate] = useState(toLocalDateString());
  const [received, setReceived] = useState(initialReceivedInput(expected));
  const isDateValid = isValidPaidDate(paidDate);

  const save = () => {
    if (!isDateValid) return;
    onSave(paidDate, parseReceivedAmount(received));
  };

  return (
    <Dialog onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {showShiftSubtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {workplace?.name} · {formatDate(shift.date, 'short')}
            </Text>
          ) : null}
        </View>
        <Pressable accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
          <X color={theme.textSecondary} size={16} />
        </Pressable>
      </View>

      <FormField label="Payment Date">
        <DateField
          value={paidDate}
          onChange={setPaidDate}
          invalid={!isDateValid}
          accessibilityLabel="Payment date"
        />
      </FormField>

      <FormField
        label={amountLabel}
        headerRight={
          <Text style={[styles.expected, { color: theme.textSecondary }]}>
            Expected: {money(expected)}
          </Text>
        }>
        <MoneyInput value={received} onChangeText={setReceived} placeholder={expected.toFixed(2)} />
      </FormField>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? theme.backgroundElement : 'transparent',
              borderColor: theme.border,
            },
          ]}>
          <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!isDateValid}
          onPress={save}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.success, borderColor: theme.success },
            (pressed || !isDateValid) && styles.pressed,
          ]}>
          <Text style={[styles.buttonText, styles.buttonStrong, { color: theme.onAccent }]}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
  expected: {
    fontSize: FontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  buttonStrong: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
