import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShiftTimeline } from '@/components/shifts/ShiftTimeline';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Shift, WeekGroup } from '@/types';
import { formatDuration } from '@/utils/timeCalculations';

interface WeekSectionProps {
  week: WeekGroup;
  collapsed: boolean;
  onToggle: () => void;
  onSelectShift: (shift: Shift) => void;
}

/** A week that expands to a timeline of its shifts and collapses to one line. */
export function WeekSection({ week, collapsed, onToggle, onSelectShift }: WeekSectionProps) {
  const theme = useTheme();
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <View style={[styles.week, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.title}>
          <Chevron color={theme.textSecondary} size={16} />
          <Text style={[styles.label, { color: theme.text }]}>
            {week.weekLabel}
            <Text style={[styles.range, { color: theme.textSecondary }]}>
              {'  '}({week.dateRangeLabel})
            </Text>
          </Text>
        </View>
        <Text style={[styles.total, { color: theme.text }]}>{formatDuration(week.totalMinutes)}</Text>
      </Pressable>

      {!collapsed ? <ShiftTimeline shifts={week.shifts} onSelectShift={onSelectShift} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  week: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    // Puts the chevron directly above the timeline's line
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  range: {
    fontSize: FontSize.sm,
    fontWeight: '400',
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
