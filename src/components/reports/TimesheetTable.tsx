import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';

// Relative column widths
const COLUMNS = {
  date: 1.2,
  day: 0.8,
  start: 1.35,
  end: 1.35,
  break: 0.8,
  hours: 1.1,
} as const;

/** One row per shift: date, weekday, start, end, break and hours. */
export function TimesheetTable({ shifts }: { shifts: Shift[] }) {
  const theme = useTheme();
  const { time } = useFormat();
  const headerCell = [styles.cell, styles.headerCell, { color: theme.textSecondary }];

  return (
    <View>
      <View style={[styles.row, styles.headerRow, { borderBottomColor: theme.border }]}>
        <Text style={[headerCell, { flex: COLUMNS.date }]}>Date</Text>
        <Text style={[headerCell, { flex: COLUMNS.day }]}>Day</Text>
        <Text style={[headerCell, { flex: COLUMNS.start }]}>Start</Text>
        <Text style={[headerCell, { flex: COLUMNS.end }]}>End</Text>
        <Text style={[headerCell, { flex: COLUMNS.break }]}>Break</Text>
        <Text style={[headerCell, styles.right, { flex: COLUMNS.hours }]}>Hours</Text>
      </View>

      {shifts.map((shift, index) => (
        <View
          key={shift.id}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
          ]}>
          <Text style={[styles.cell, styles.dateCell, { flex: COLUMNS.date, color: theme.text }]}>
            {formatDate(shift.date, 'short')}
          </Text>
          <Text style={[styles.cell, { flex: COLUMNS.day, color: theme.textSecondary }]}>
            {formatDate(shift.date, 'dayOfWeek').substring(0, 3)}
          </Text>
          <Text style={[styles.cell, { flex: COLUMNS.start, color: theme.text }]}>
            {time(shift.startTime)}
          </Text>
          <Text style={[styles.cell, { flex: COLUMNS.end, color: theme.text }]}>
            {time(shift.endTime)}
          </Text>
          <Text style={[styles.cell, { flex: COLUMNS.break, color: theme.textSecondary }]}>
            {shift.breakMinutes > 0 ? `${shift.breakMinutes}m` : '—'}
          </Text>
          <Text
            style={[
              styles.cell,
              styles.right,
              styles.hoursCell,
              { flex: COLUMNS.hours, color: theme.text },
            ]}>
            {formatDuration(shift.workedMinutes)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cell: {
    fontSize: FontSize.xs,
    paddingHorizontal: 2,
  },
  headerCell: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateCell: {
    fontWeight: '500',
  },
  hoursCell: {
    fontWeight: '700',
  },
  right: {
    textAlign: 'right',
  },
});
