import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';

interface DayDetailCardProps {
  date: string;
  workplaceName: string;
  shifts: Shift[];
  onSelectShift: (shift: Shift) => void;
}

/** The shifts of the selected day, with the day's total. */
export function DayDetailCard({ date, workplaceName, shifts, onSelectShift }: DayDetailCardProps) {
  const theme = useTheme();
  const { time } = useFormat();
  const totalMinutes = shifts.reduce((total, s) => total + s.workedMinutes, 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>{formatDate(date, 'medium')}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{workplaceName}</Text>
        </View>
        {shifts.length > 0 ? (
          <Text style={[styles.title, { color: theme.text }]}>{formatDuration(totalMinutes)}</Text>
        ) : null}
      </View>

      {shifts.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          No shifts recorded on this date.
        </Text>
      ) : (
        <View style={styles.list}>
          {shifts.map((shift) => (
            <Pressable
              key={shift.id}
              accessibilityRole="button"
              onPress={() => onSelectShift(shift)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <View>
                <Text style={[styles.time, { color: theme.text }]}>
                  {time(shift.startTime)} – {time(shift.endTime)}
                </Text>
                {shift.breakMinutes > 0 ? (
                  <Text style={[styles.breakText, { color: theme.textSecondary }]}>
                    {shift.breakMinutes}m break
                  </Text>
                ) : null}
              </View>
              <View style={styles.trailing}>
                <Text style={[styles.duration, { color: theme.text }]}>
                  {formatDuration(shift.workedMinutes)}
                </Text>
                <PaymentStatusBadge status={shift.paymentStatus} size="sm" />
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
  empty: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  time: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  breakText: {
    fontSize: FontSize.xs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  duration: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
