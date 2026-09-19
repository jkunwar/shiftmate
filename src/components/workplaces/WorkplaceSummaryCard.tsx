import { Clock, MapPin, Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MonthSwitcher } from '@/components/workplaces/MonthSwitcher';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { MonthGroup, Workplace } from '@/types';
import { formatDuration } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

interface WorkplaceSummaryCardProps {
  workplace: Workplace;
  month: MonthGroup;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

/** The workplace, its month switcher, that month's totals and what is still unpaid. */
export function WorkplaceSummaryCard({
  workplace,
  month,
  onPreviousMonth,
  onNextMonth,
  onEdit,
  onDelete,
}: WorkplaceSummaryCardProps) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.top}>
        <View style={styles.title}>
          <View
            style={[styles.colorBar, { backgroundColor: workplaceColor(workplace.color, theme.accent) }]}
          />
          <View style={styles.titleText}>
            <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
              {workplace.name}
            </Text>
            {workplace.address ? (
              <View style={styles.address}>
                <MapPin color={theme.textSecondary} size={12} />
                <Text numberOfLines={1} style={[styles.addressText, { color: theme.textSecondary }]}>
                  {workplace.address}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {onEdit ? (
          <Pressable
            accessibilityLabel="Edit workplace"
            onPress={onEdit}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { backgroundColor: theme.backgroundElement },
            ]}>
            <Pencil color={theme.textSecondary} size={16} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityLabel="Delete workplace"
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { backgroundColor: theme.dangerSoft },
          ]}>
          {({ pressed }) => <Trash2 color={pressed ? theme.danger : theme.textSecondary} size={16} />}
        </Pressable>
      </View>

      <MonthSwitcher label={month.monthLabel} onPrevious={onPreviousMonth} onNext={onNextMonth} />

      <View style={[styles.stats, { borderTopColor: theme.border }]}>
        <Stat label="Worked" value={formatDuration(month.totalMinutes)} />
        <Stat label="Shifts" value={String(month.shiftCount)} />
        <Stat label="Estimated" value={money(month.totalEarnings)} />
      </View>

      {month.unpaidMinutes > 0 ? (
        <View style={[styles.unpaid, { borderTopColor: theme.border }]}>
          <View style={styles.unpaidLabel}>
            <Clock color={theme.warning} size={14} />
            <Text style={[styles.unpaidText, { color: theme.warning }]}>
              {formatDuration(month.unpaidMinutes)} unpaid
            </Text>
          </View>
          <Text style={[styles.unpaidAmount, { color: theme.warning }]}>
            {money(month.unpaidEarnings)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    flex: 1,
  },
  colorBar: {
    width: 14,
    height: 40,
    borderRadius: 999,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    flexShrink: 1,
    fontSize: FontSize.xs,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  unpaid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  unpaidLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unpaidText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  unpaidAmount: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
