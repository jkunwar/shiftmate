import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, formatDuration, shiftEarnings } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

interface PaymentShiftCardProps {
  shift: Shift;
  workplace?: Workplace;
  onPress: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
}

/** A shift with its payment status and a quick action to flip it. */
export function PaymentShiftCard({
  shift,
  workplace,
  onPress,
  onMarkPaid,
  onMarkUnpaid,
}: PaymentShiftCardProps) {
  const theme = useTheme();
  const { money, time } = useFormat();
  const earnings = shiftEarnings(shift, workplace);
  const isUnpaid = shift.paymentStatus === 'unpaid';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.top}>
        <View style={styles.details}>
          <View style={styles.workplaceRow}>
            <View
              style={[styles.dot, { backgroundColor: workplaceColor(workplace?.color, theme.accent) }]}
            />
            <Text numberOfLines={1} style={[styles.workplaceName, { color: theme.text }]}>
              {workplace?.name || 'Workplace'}
            </Text>
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {formatDate(shift.date, 'medium')} · {time(shift.startTime)} – {time(shift.endTime)}
          </Text>
        </View>

        <View style={styles.totals}>
          <Text style={[styles.duration, { color: theme.text }]}>
            {formatDuration(shift.workedMinutes)}
          </Text>
          <Text style={[styles.earnings, { color: theme.textSecondary }]}>{money(earnings)}</Text>
        </View>
      </Pressable>

      <View style={[styles.bottom, { borderTopColor: theme.border }]}>
        <View style={styles.status}>
          <PaymentStatusBadge status={shift.paymentStatus} size="sm" />
          {shift.paymentStatus === 'paid' && shift.actualPaidAmount !== undefined ? (
            <Text style={[styles.received, { color: theme.textSecondary }]}>
              Recv: {money(shift.actualPaidAmount)}
            </Text>
          ) : null}
        </View>

        {isUnpaid ? (
          <Pressable
            accessibilityRole="button"
            onPress={onMarkPaid}
            style={({ pressed }) => [
              styles.markPaid,
              { backgroundColor: theme.success },
              pressed && styles.pressed,
            ]}>
            <Check color={theme.onAccent} size={14} />
            <Text style={[styles.markPaidText, { color: theme.onAccent }]}>Mark Paid</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={onMarkUnpaid} hitSlop={8}>
            <Text style={[styles.markUnpaid, { color: theme.textSecondary }]}>Mark Unpaid</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  details: {
    flex: 1,
  },
  workplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  workplaceName: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  meta: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  totals: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  earnings: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  received: {
    fontSize: FontSize.xs,
  },
  markPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markPaidText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  markUnpaid: {
    fontSize: FontSize.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
