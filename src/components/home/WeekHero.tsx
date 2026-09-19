import { StyleSheet, Text, View } from 'react-native';

import { WeekBars } from '@/components/charts/WeekBars';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { DateRange, formatRange } from '@/utils/dateRanges';
import { formatDuration } from '@/utils/timeCalculations';
import { WeekDay } from '@/utils/weekChart';

interface WeekHeroProps {
  week: DateRange;
  days: WeekDay[];
  /** YYYY-MM-DD of today, emphasised in the chart. */
  today: string;
  totalMinutes: number;
  earnings: number;
  shiftCount: number;
}

/** The current week at a glance: hours, a per-day chart, earnings and shift count. */
export function WeekHero({ week, days, today, totalMinutes, earnings, shiftCount }: WeekHeroProps) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View style={[styles.hero, { backgroundColor: theme.hero }]}>
      <View style={styles.body}>
        {/* Label, hours and range stack to the same height as the chart beside them */}
        <View style={styles.summary}>
          <Text style={[styles.label, { color: theme.heroMuted }]}>This week</Text>
          <View style={styles.valueGroup}>
            <Text style={[styles.value, { color: theme.heroText }]}>
              {formatDuration(totalMinutes)}
            </Text>
            <Text style={[styles.range, { color: theme.heroMuted, backgroundColor: theme.heroChip }]}>
              {formatRange(week)}
            </Text>
          </View>
        </View>

        <View style={styles.chart}>
          <WeekBars days={days} today={today} emphasis={theme.heroText} muted={theme.heroMuted} />
        </View>
      </View>

      <View style={[styles.stats, { borderTopColor: theme.heroChip }]}>
        <View>
          <Text style={[styles.statLabel, { color: theme.heroMuted }]}>Est. earnings</Text>
          <Text style={[styles.statValue, { color: theme.heroPositive }]}>{money(earnings)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.heroChip }]} />
        <View>
          <Text style={[styles.statLabel, { color: theme.heroMuted }]}>Shifts</Text>
          <Text style={[styles.statValue, { color: theme.heroText }]}>{shiftCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 18,
    gap: 10,
    borderRadius: 20,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 16,
  },
  summary: {
    flexShrink: 1,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  valueGroup: {
    alignItems: 'flex-start',
    gap: 6,
  },
  value: {
    fontSize: FontSize.display,
    fontWeight: '800',
    letterSpacing: -1,
  },
  range: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chart: {
    width: 148,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statLabel: {
    fontSize: FontSize.xs,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
});
