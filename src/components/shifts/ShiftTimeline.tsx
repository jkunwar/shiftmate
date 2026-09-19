import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';

interface ShiftTimelineProps {
  shifts: Shift[];
  onSelectShift: (shift: Shift) => void;
}

const RAIL_WIDTH = 18;
const DOT_SIZE = 8;

/** Shifts down a vertical line, one dot per day. The dot shows the payment state. */
export const ShiftTimeline: React.FC<ShiftTimelineProps> = ({ shifts, onSelectShift }) => {
  const theme = useTheme();
  const { time } = useFormat();

  return (
    <View>
      {shifts.map((shift, index) => {
        const unpaid = shift.paymentStatus === 'unpaid';
        const statusColor = unpaid ? theme.warning : theme.success;
        const isFirst = index === 0;
        const isLast = index === shifts.length - 1;
        const day = `${formatDate(shift.date, 'dayOfWeek').slice(0, 3)}, ${formatDate(shift.date, 'short')}`;

        return (
          <Pressable
            key={shift.id}
            accessibilityRole="button"
            accessibilityLabel={`${day}, ${time(shift.startTime)} to ${time(shift.endTime)}, ${formatDuration(
              shift.workedMinutes,
            )}, ${unpaid ? 'unpaid' : 'paid'}`}
            onPress={() => onSelectShift(shift)}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: theme.backgroundElement }]}>
            {/* The rail is drawn per row so the line runs unbroken from dot to dot */}
            <View style={styles.rail}>
              <View
                style={[
                  styles.line,
                  { backgroundColor: theme.border },
                  isFirst && styles.lineFromDot,
                  isLast && styles.lineToDot,
                ]}
              />
              <View style={[styles.dot, { backgroundColor: statusColor, borderColor: theme.background }]} />
            </View>

            <View style={styles.details}>
              <Text style={[styles.day, { color: theme.text }]}>{day}</Text>
              <Text style={[styles.time, { color: theme.textSecondary }]}>
                {time(shift.startTime)} – {time(shift.endTime)}
                {shift.breakMinutes > 0 ? `  ·  ${shift.breakMinutes}m break` : ''}
              </Text>
            </View>

            <View style={styles.trailing}>
              <Text style={[styles.duration, { color: theme.text }]}>
                {formatDuration(shift.workedMinutes)}
              </Text>
              <Text style={[styles.status, { color: statusColor }]}>{unpaid ? 'Unpaid' : 'Paid'}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 10,
    gap: 4,
  },
  rail: {
    width: RAIL_WIDTH + 12,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 2,
  },
  // The line starts at the first dot and stops at the last one instead of sticking out
  lineFromDot: {
    top: '50%',
  },
  lineToDot: {
    bottom: '50%',
  },
  dot: {
    width: DOT_SIZE + 4,
    height: DOT_SIZE + 4,
    borderRadius: (DOT_SIZE + 4) / 2,
    borderWidth: 2,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  day: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  time: {
    fontSize: FontSize.xs,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  duration: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
