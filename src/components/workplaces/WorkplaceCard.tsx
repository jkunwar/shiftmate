import { CheckCircle2, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDuration, shiftEarnings } from '@/utils/timeCalculations';

interface WorkplaceCardProps {
  workplace: Workplace;
  shifts: Shift[];
  currentMonthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September"
  onClick: () => void;
}

export const WorkplaceCard: React.FC<WorkplaceCardProps> = ({
  workplace,
  shifts,
  currentMonthKey,
  monthName,
  onClick,
}) => {
  const theme = useTheme();
  const { money, currency } = useFormat();

  // Filter shifts for this workplace in the given month
  const monthShifts = shifts.filter(
    (s) => s.workplaceId === workplace.id && s.date.startsWith(currentMonthKey),
  );

  const totalMinutes = monthShifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  const unpaidMinutes = monthShifts
    .filter((s) => s.paymentStatus === 'unpaid')
    .reduce((acc, s) => acc + s.workedMinutes, 0);

  const estimatedEarnings = monthShifts.reduce((acc, s) => acc + shiftEarnings(s, workplace), 0);

  const allPaid = unpaidMinutes === 0 && monthShifts.length > 0;
  const hasUnpaid = unpaidMinutes > 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onClick}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={[styles.colorBar, { backgroundColor: workplace.color || theme.accent }]} />
          <View style={styles.titleText}>
            <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
              {workplace.name}
            </Text>
            <Text style={[styles.month, { color: theme.textSecondary }]}>{monthName}</Text>
          </View>
        </View>
        <ChevronRight color={theme.textSecondary} size={20} />
      </View>

      {/* Metrics row */}
      <View style={[styles.metrics, { borderColor: theme.border }]}>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Hours</Text>
          <Text style={[styles.metricValue, styles.metricStrong, { color: theme.text }]}>
            {formatDuration(totalMinutes)}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Shifts</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {monthShifts.length} {monthShifts.length === 1 ? 'shift' : 'shifts'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Est. Earnings</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {money(estimatedEarnings)}
          </Text>
        </View>
      </View>

      {/* Status footer */}
      <View style={styles.footer}>
        {hasUnpaid ? (
          <View
            style={[
              styles.pill,
              { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}55` },
            ]}>
            <Clock color={theme.warning} size={14} />
            <Text style={[styles.pillText, { color: theme.warning }]}>
              {formatDuration(unpaidMinutes)} unpaid
            </Text>
          </View>
        ) : allPaid ? (
          <View
            style={[
              styles.pill,
              { backgroundColor: theme.successSoft, borderColor: `${theme.success}55` },
            ]}>
            <CheckCircle2 color={theme.success} size={14} />
            <Text style={[styles.pillText, { color: theme.success }]}>All paid</Text>
          </View>
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No shifts this month</Text>
        )}

        {/* Ternary, not `&&`: a rate of 0 would otherwise render a bare "0" outside <Text> */}
        {workplace.hourlyRate ? (
          <Text style={[styles.rate, { color: theme.textSecondary }]}>
            {currency}{workplace.hourlyRate.toFixed(2)}/hr
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorBar: {
    width: 12,
    height: 32,
    borderRadius: 999,
  },
  titleText: {
    flexShrink: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  month: {
    fontSize: 12,
    fontWeight: '500',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricStrong: {
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  empty: {
    fontSize: 12,
  },
  rate: {
    fontSize: 12,
    fontWeight: '500',
  },
});
