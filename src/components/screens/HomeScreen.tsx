import { ChevronRight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRefreshControl } from '@/components/common/refresh-control';
import { WeekBars } from '@/components/charts/WeekBars';
import { CompactShiftRow } from '@/components/shifts/CompactShiftRow';
import { BottomTabInset, FontSize, ScreenTitle } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, User, Workplace } from '@/types';
import { formatRange, getWeekRange } from '@/utils/dateRanges';
import { formatDuration, shiftEarnings } from '@/utils/timeCalculations';
import { buildWeekDays } from '@/utils/weekChart';
import { workplaceColor } from '@/utils/workplaceColor';

interface HomeScreenProps {
  user: User;
  workplaces: Workplace[];
  shifts: Shift[];
  onSelectWorkplace: (workplaceId: string) => void;
  onOpenPaymentTracking: () => void;
  onViewAllWorkplaces: () => void;
  onSelectShift: (shift: Shift) => void;
  onAddShift: () => void;
  /** Which day the "This Week" card starts on. Defaults to Monday. */
  weekStartsOn?: 'monday' | 'sunday';
  /** Pull-to-refresh handler (syncs with the cloud). Omit to turn the gesture off. */
  onRefresh?: () => Promise<void>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onRefresh,
  user,
  workplaces,
  shifts,
  onSelectWorkplace,
  onOpenPaymentTracking,
  onViewAllWorkplaces,
  onSelectShift,
  weekStartsOn = 'monday',
}) => {
  const theme = useTheme();
  const refreshControl = useRefreshControl(onRefresh);
  const { money } = useFormat();
  const insets = useSafeAreaInsets();

  // The week containing today
  const today = useToday();
  const week = getWeekRange(today, weekStartsOn);

  const currentWeekShifts = useMemo(() => {
    return shifts.filter((s) => s.date >= week.start && s.date <= week.end);
  }, [shifts, week.start, week.end]);

  const weekDays = useMemo(() => buildWeekDays(shifts, week.start), [shifts, week.start]);

  const totalWeekMinutes = currentWeekShifts.reduce((acc, s) => acc + s.workedMinutes, 0);

  // Total estimated earnings for current week
  const totalWeekEarnings = currentWeekShifts.reduce(
    (acc, s) =>
      acc +
      shiftEarnings(
        s,
        workplaces.find((w) => w.id === s.workplaceId),
      ),
    0,
  );

  // Breakdown by workplace for this week
  const workplaceWeekBreakdown = useMemo(() => {
    return workplaces
      .map((wp) => {
        const wpShifts = currentWeekShifts.filter((s) => s.workplaceId === wp.id);
        const minutes = wpShifts.reduce((acc, s) => acc + s.workedMinutes, 0);
        const earnings = wpShifts.reduce((acc, s) => acc + shiftEarnings(s, wp), 0);
        return { workplace: wp, minutes, earnings, shiftsCount: wpShifts.length };
      })
      .filter((item) => item.minutes > 0);
  }, [workplaces, currentWeekShifts]);

  // Overall unpaid statistics
  const unpaidShifts = useMemo(() => {
    return shifts.filter((s) => s.paymentStatus === 'unpaid');
  }, [shifts]);

  const totalUnpaidMinutes = unpaidShifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  const totalUnpaidAmount = unpaidShifts.reduce(
    (acc, s) =>
      acc +
      shiftEarnings(
        s,
        workplaces.find((w) => w.id === s.workplaceId),
      ),
    0,
  );

  // Recent 3 shifts sorted by date desc
  const recentShifts = useMemo(() => {
    return [...shifts]
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 3);
  }, [shifts]);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const cardStyle = { backgroundColor: theme.surface, borderColor: theme.border };
  const shiftCount = currentWeekShifts.length;
  // Name the workplace on a row only when the recent shifts come from more than one
  const recentSpansWorkplaces = new Set(recentShifts.map((s) => s.workplaceId)).size > 1;

  return (
    <ScrollView
      refreshControl={refreshControl}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      {/* Header */}
      <View>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
        <Text style={[styles.name, { color: theme.text }]}>{user.name.split(' ')[0]}</Text>
      </View>

      {/* This week */}
      <View style={[styles.hero, { backgroundColor: theme.hero }]}>
        <View style={styles.heroHeader}>
          <Text style={[styles.heroLabel, { color: theme.heroMuted }]}>This week</Text>
          <Text
            style={[styles.heroRange, { color: theme.heroMuted, backgroundColor: theme.heroChip }]}>
            {formatRange(week)}
          </Text>
        </View>

        <View style={styles.heroBody}>
          <Text style={[styles.heroValue, { color: theme.heroText }]}>
            {formatDuration(totalWeekMinutes)}
          </Text>
          <View style={styles.heroChart}>
            <WeekBars
              days={weekDays}
              today={today}
              emphasis={theme.heroText}
              muted={theme.heroMuted}
            />
          </View>
        </View>

        <View style={[styles.heroStats, { borderTopColor: theme.heroChip }]}>
          <View>
            <Text style={[styles.heroStatLabel, { color: theme.heroMuted }]}>Est. earnings</Text>
            <Text style={[styles.heroStatValue, { color: theme.heroPositive }]}>
              {money(totalWeekEarnings)}
            </Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: theme.heroChip }]} />
          <View>
            <Text style={[styles.heroStatLabel, { color: theme.heroMuted }]}>Shifts</Text>
            <Text style={[styles.heroStatValue, { color: theme.heroText }]}>{shiftCount}</Text>
          </View>
        </View>
      </View>

      {/* Owed to you */}
      {unpaidShifts.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenPaymentTracking}
          style={({ pressed }) => [
            styles.unpaidRow,
            cardStyle,
            pressed && { backgroundColor: theme.backgroundElement },
          ]}>
          <View style={[styles.unpaidDot, { backgroundColor: theme.warning }]} />
          <Text style={[styles.unpaidText, { color: theme.text }]}>
            {formatDuration(totalUnpaidMinutes)} unpaid
          </Text>
          <Text style={[styles.unpaidAmount, { color: theme.text }]}>
            {money(totalUnpaidAmount)}
          </Text>
          <ChevronRight color={theme.textSecondary} size={16} />
        </Pressable>
      ) : null}

      {/* This week by workplace: only useful when there is more than one to compare */}
      {workplaceWeekBreakdown.length > 1 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>By workplace</Text>
          <View style={[styles.group, cardStyle]}>
            {workplaceWeekBreakdown.map((item, index) => (
              <Pressable
                key={item.workplace.id}
                accessibilityRole="button"
                onPress={() => onSelectWorkplace(item.workplace.id)}
                style={({ pressed }) => [
                  styles.wpRow,
                  index > 0 && {
                    borderTopColor: theme.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <View
                  style={[styles.wpDot, { backgroundColor: workplaceColor(item.workplace.color, theme.accent) }]}
                />
                <Text numberOfLines={1} style={[styles.wpName, { color: theme.text }]}>
                  {item.workplace.name}
                </Text>
                <Text style={[styles.wpDuration, { color: theme.text }]}>
                  {formatDuration(item.minutes)}
                </Text>
                <ChevronRight color={theme.textSecondary} size={16} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Recent shifts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Recent shifts</Text>
          {recentShifts.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={onViewAllWorkplaces} hitSlop={8}>
              <Text style={[styles.sectionLink, { color: theme.accent }]}>See all</Text>
            </Pressable>
          ) : null}
        </View>

        {recentShifts.length === 0 ? (
          <View style={[styles.emptyCard, cardStyle]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No shifts yet. Tap + to log your first one.
            </Text>
          </View>
        ) : (
          <View style={[styles.group, cardStyle]}>
            {recentShifts.map((shift, index) => (
              <View
                key={shift.id}
                style={
                  index > 0
                    ? { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }
                    : undefined
                }>
                <CompactShiftRow
                  shift={shift}
                  workplace={
                    recentSpansWorkplaces
                      ? workplaces.find((w) => w.id === shift.workplaceId)
                      : undefined
                  }
                  onPress={() => onSelectShift(shift)}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  greeting: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  name: {
    ...ScreenTitle,
  },
  hero: {
    padding: 18,
    gap: 2,
    borderRadius: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  heroRange: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroChart: {
    width: 148,
  },
  heroValue: {
    fontSize: FontSize.display,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heroStatLabel: {
    fontSize: FontSize.xs,
  },
  heroStatValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  unpaidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  unpaidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unpaidText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  unpaidAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLink: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  wpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wpDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  wpName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  wpDuration: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
