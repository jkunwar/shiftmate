import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

interface CompactShiftRowProps {
  shift: Shift;
  /** Shown next to the time; pass it only when there is more than one workplace to tell apart. */
  workplace?: Workplace;
  onPress: () => void;
}

/** A two-line shift row for lists inside a grouped card. Only unpaid shifts get a label. */
export const CompactShiftRow: React.FC<CompactShiftRowProps> = ({ shift, workplace, onPress }) => {
  const theme = useTheme();
  const { time } = useFormat();

  const day = `${formatDate(shift.date, 'dayOfWeek').slice(0, 3)}, ${formatDate(shift.date, 'short')}`;
  const detail = `${time(shift.startTime)} – ${time(shift.endTime)}`;
  const unpaid = shift.paymentStatus === 'unpaid';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${detail}, ${formatDuration(shift.workedMinutes)}${unpaid ? ', unpaid' : ''
        }`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.backgroundElement },
      ]}>
      <View style={styles.details}>
        <Text style={[styles.day, { color: theme.text }]}>{day}</Text>
        <View style={styles.meta}>
          {workplace ? (
            <View style={[styles.dot, { backgroundColor: workplaceColor(workplace.color, theme.accent) }]} />
          ) : null}
          <Text numberOfLines={1} style={[styles.detail, { color: theme.textSecondary }]}>
            {workplace ? `${workplace.name} · ${detail}` : detail}
          </Text>
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={[styles.duration, { color: theme.text }]}>
          {formatDuration(shift.workedMinutes)}
        </Text>
        {unpaid ? <Text style={[styles.unpaid, { color: theme.warning }]}>Unpaid</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    fontSize: FontSize.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detail: {
    flexShrink: 1,
    fontSize: FontSize.xs,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  unpaid: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  duration: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
