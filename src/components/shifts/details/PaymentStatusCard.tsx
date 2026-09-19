import { StyleSheet, Text, View } from 'react-native';

import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift } from '@/types';
import { formatDate } from '@/utils/timeCalculations';

/** Whether the shift is paid, with when and how much once it is. */
export function PaymentStatusCard({ shift }: { shift: Shift }) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.text}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Payment Status</Text>
        {shift.paymentStatus === 'paid' && shift.paidDate ? (
          <Text style={[styles.paidOn, { color: theme.textSecondary }]}>
            Paid on {formatDate(shift.paidDate, 'short')}
            {shift.actualPaidAmount !== undefined ? ` (${money(shift.actualPaidAmount)})` : ''}
          </Text>
        ) : null}
      </View>
      <PaymentStatusBadge status={shift.paymentStatus} size="md" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  text: {
    gap: 2,
  },
  label: {
    fontSize: FontSize.xs,
  },
  paidOn: {
    fontSize: FontSize.xs,
  },
});
