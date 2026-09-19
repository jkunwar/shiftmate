import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/home/SectionHeader';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { WorkplaceWeekItem } from '@/utils/homeSummary';
import { formatDuration } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

interface WorkplaceWeekListProps {
  items: WorkplaceWeekItem[];
  onSelectWorkplace: (workplaceId: string) => void;
}

/** This week's hours per workplace, in one grouped card. Renders nothing when there are none. */
export function WorkplaceWeekList({ items, onSelectWorkplace }: WorkplaceWeekListProps) {
  const theme = useTheme();
  const { money } = useFormat();
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="This Week by Workplace" />
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {items.map((item, index) => (
          <Pressable
            key={item.workplace.id}
            accessibilityRole="button"
            onPress={() => onSelectWorkplace(item.workplace.id)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopColor: theme.border,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
              pressed && { backgroundColor: theme.backgroundElement },
            ]}>
            <View
              style={[
                styles.bar,
                { backgroundColor: workplaceColor(item.workplace.color, theme.accent) },
              ]}
            />
            <View style={styles.details}>
              <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
                {item.workplace.name}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {item.shiftsCount} {item.shiftsCount === 1 ? 'shift' : 'shifts'}
              </Text>
            </View>
            <View style={styles.totals}>
              <Text style={[styles.duration, { color: theme.text }]}>
                {formatDuration(item.minutes)}
              </Text>
              <Text style={[styles.earnings, { color: theme.success }]}>{money(item.earnings)}</Text>
            </View>
            <ChevronRight color={theme.textSecondary} size={16} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bar: {
    alignSelf: 'stretch',
    width: 6,
    borderRadius: 3,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  meta: {
    fontSize: FontSize.sm,
  },
  totals: {
    alignItems: 'flex-end',
    gap: 2,
  },
  earnings: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  duration: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
