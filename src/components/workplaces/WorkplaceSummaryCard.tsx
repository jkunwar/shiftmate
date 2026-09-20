import { CheckCircle2, Clock, MapPin, Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/common/SegmentedControl';
import { MonthSwitcher } from '@/components/workplaces/MonthSwitcher';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Workplace } from '@/types';
import { formatDuration } from '@/utils/timeCalculations';
import { WorkplaceSummary } from '@/utils/workplaceTotals';
import { workplaceColor } from '@/utils/workplaceColor';

export type SummaryScope = 'month' | 'all';

interface WorkplaceSummaryCardProps {
  workplace: Workplace;
  /** The month the switcher (and the log below) is on, e.g. "September 2026". */
  monthLabel: string;
  /** Totals shown in the tiles: for that month, or for the workplace's whole history. */
  stats: WorkplaceSummary;
  scope: SummaryScope;
  onScopeChange: (scope: SummaryScope) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

/** The workplace, its month switcher, that month's totals and what is still unpaid. */
export function WorkplaceSummaryCard({
  workplace,
  monthLabel,
  stats,
  scope,
  onScopeChange,
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

      {/* The switcher below chooses the month of the log; the tiles can cover that month or everything */}
      <MonthSwitcher label={monthLabel} onPrevious={onPreviousMonth} onNext={onNextMonth} />

      <View style={[styles.scope, { borderTopColor: theme.border }]}>
        <SegmentedControl
          selectedTone="accent"
          options={[
            { value: 'month', label: monthLabel },
            { value: 'all', label: 'All time' },
          ]}
          value={scope}
          onChange={onScopeChange}
        />
      </View>

      <View style={styles.stats}>
        <Stat label="Worked" value={formatDuration(stats.minutes)} />
        <Stat label="Shifts" value={String(stats.shiftCount)} />
        <Stat label="Estimated" value={money(stats.estimated)} />
      </View>

      {stats.received > 0 ? (
        <View style={[styles.line, { borderTopColor: theme.border }]}>
          <View style={styles.lineLabel}>
            <CheckCircle2 color={theme.success} size={14} />
            <Text style={[styles.lineText, { color: theme.success }]}>Received</Text>
          </View>
          <Text style={[styles.lineAmount, { color: theme.success }]}>{money(stats.received)}</Text>
        </View>
      ) : null}

      {stats.unpaidMinutes > 0 ? (
        <View style={[styles.line, { borderTopColor: theme.border }]}>
          <View style={styles.lineLabel}>
            <Clock color={theme.warning} size={14} />
            <Text style={[styles.lineText, { color: theme.warning }]}>
              {formatDuration(stats.unpaidMinutes)} unpaid
            </Text>
          </View>
          <Text style={[styles.lineAmount, { color: theme.warning }]}>{money(stats.unpaidAmount)}</Text>
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
  scope: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: 'flex-start',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  lineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  lineAmount: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
