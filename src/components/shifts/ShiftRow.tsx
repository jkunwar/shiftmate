import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

interface ShiftRowProps {
  shift: Shift;
  workplace?: Workplace;
  showWorkplace?: boolean;
  onClick: () => void;
}

export const ShiftRow: React.FC<ShiftRowProps> = ({
  shift,
  workplace,
  showWorkplace = false,
  onClick,
}) => {
  const theme = useTheme();
  const { time } = useFormat();

  const formattedDate = formatDate(shift.date, 'compact'); // "Sep 14 · Monday"
  const startTime = time(shift.startTime);
  const endTime = time(shift.endTime);
  const durationStr = formatDuration(shift.workedMinutes);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onClick}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.backgroundElement : theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.details}>
        {showWorkplace && workplace ? (
          <View style={styles.workplaceRow}>
            <View style={[styles.dot, { backgroundColor: workplaceColor(workplace.color, theme.accent) }]} />
            <Text numberOfLines={1} style={[styles.workplaceName, { color: theme.text }]}>
              {workplace.name}
            </Text>
          </View>
        ) : null}

        <View style={styles.dateRow}>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{formattedDate}</Text>
          {shift.breakMinutes > 0 ? (
            <Text
              style={[
                styles.breakTag,
                { color: theme.textSecondary, backgroundColor: theme.backgroundElement },
              ]}>
              {shift.breakMinutes}m break
            </Text>
          ) : null}
        </View>

        <Text style={[styles.time, { color: theme.textSecondary }]}>
          {startTime} – {endTime}
        </Text>
      </View>

      {/* Right side: prominent worked hours & status badge */}
      <View style={styles.trailing}>
        <View style={styles.summary}>
          <Text style={[styles.duration, { color: theme.text }]}>{durationStr}</Text>
          <PaymentStatusBadge status={shift.paymentStatus} size="sm" />
        </View>
        <ChevronRight color={theme.textSecondary} size={16} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  details: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    gap: 4,
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
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  breakTag: {
    fontSize: FontSize.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  time: {
    fontSize: FontSize.xs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summary: {
    alignItems: 'flex-end',
    gap: 4,
  },
  duration: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
