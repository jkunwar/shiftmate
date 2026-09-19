import { ChevronRight, Clock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShiftRow } from '@/components/shifts/ShiftRow';
import { BottomTabInset } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, User, Workplace } from '@/types';
import { formatRange, getWeekRange } from '@/utils/dateRanges';
import { formatDuration, shiftEarnings } from '@/utils/timeCalculations';

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
}

// The "This Week" card is dark in both light and dark mode, as in the original design
const WEEK_CARD = {
  background: '#0f172a',
  border: '#1e293b',
  muted: '#94a3b8',
  chip: '#1e293b',
  earnings: '#34d399',
  text: '#ffffff',
};

// Amber button with white text stays readable in both modes
const UNPAID_BUTTON = { base: '#b45309', pressed: '#92400e' };

export const HomeScreen: React.FC<HomeScreenProps> = ({
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
  const { money } = useFormat();
  const insets = useSafeAreaInsets();

  // The week containing today
  const today = useToday();
  const week = getWeekRange(today, weekStartsOn);

  const currentWeekShifts = useMemo(() => {
    return shifts.filter((s) => s.date >= week.start && s.date <= week.end);
  }, [shifts, week.start, week.end]);

  const totalWeekMinutes = currentWeekShifts.reduce((acc, s) => acc + s.workedMinutes, 0);

  // Total estimated earnings for current week
  const totalWeekEarnings = currentWeekShifts.reduce(
    (acc, s) => acc + shiftEarnings(s, workplaces.find((w) => w.id === s.workplaceId)),
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
    (acc, s) => acc + shiftEarnings(s, workplaces.find((w) => w.id === s.workplaceId)),
    0,
  );

  // Recent 4 shifts sorted by date desc
  const recentShifts = useMemo(() => {
    return [...shifts]
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
      .slice(0, 4);
  }, [shifts]);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const cardStyle = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
          <Text style={[styles.name, { color: theme.text }]}>{user.name.split(' ')[0]}</Text>
        </View>
      </View>

      {/* Current week summary card */}
      <View
        style={[
          styles.weekCard,
          { backgroundColor: WEEK_CARD.background, borderColor: WEEK_CARD.border },
        ]}>
        <View style={styles.weekHeader}>
          <Text style={[styles.weekLabel, { color: WEEK_CARD.muted }]}>This Week</Text>
          <Text
            style={[
              styles.weekRange,
              { color: WEEK_CARD.muted, backgroundColor: WEEK_CARD.chip },
            ]}>
            {formatRange(week)}
          </Text>
        </View>

        <Text style={[styles.weekValue, { color: WEEK_CARD.text }]}>
          {formatDuration(totalWeekMinutes)}
        </Text>

        <View style={[styles.weekStats, { borderTopColor: WEEK_CARD.border }]}>
          <View>
            <Text style={[styles.weekStatLabel, { color: WEEK_CARD.muted }]}>Est. Earnings</Text>
            <Text style={[styles.weekStatValue, { color: WEEK_CARD.earnings }]}>
              {money(totalWeekEarnings)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: WEEK_CARD.border }]} />
          <View>
            <Text style={[styles.weekStatLabel, { color: WEEK_CARD.muted }]}>Shifts</Text>
            <Text style={[styles.weekStatValue, { color: WEEK_CARD.text }]}>
              {currentWeekShifts.length} {currentWeekShifts.length === 1 ? 'shift' : 'shifts'}
            </Text>
          </View>
        </View>
      </View>

      {/* This week by workplace */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>This Week by Workplace</Text>
          <Pressable accessibilityRole="button" onPress={onViewAllWorkplaces} hitSlop={8}>
            <Text style={[styles.sectionLink, { color: theme.accent }]}>All Workplaces</Text>
          </Pressable>
        </View>

        {workplaceWeekBreakdown.length === 0 ? (
          <View style={[styles.emptyCard, cardStyle]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No shifts logged this week yet.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {workplaceWeekBreakdown.map((item) => (
              <Pressable
                key={item.workplace.id}
                accessibilityRole="button"
                onPress={() => onSelectWorkplace(item.workplace.id)}
                style={({ pressed }) => [
                  styles.wpRow,
                  cardStyle,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <View style={styles.wpLeft}>
                  <View
                    style={[
                      styles.wpBar,
                      { backgroundColor: item.workplace.color || theme.accent },
                    ]}
                  />
                  <View style={styles.flex}>
                    <Text numberOfLines={1} style={[styles.wpName, { color: theme.text }]}>
                      {item.workplace.name}
                    </Text>
                    <Text style={[styles.wpMeta, { color: theme.textSecondary }]}>
                      {item.shiftsCount} {item.shiftsCount === 1 ? 'shift' : 'shifts'}
                    </Text>
                  </View>
                </View>

                <View style={styles.wpRight}>
                  <View style={styles.right}>
                    <Text style={[styles.wpDuration, { color: theme.text }]}>
                      {formatDuration(item.minutes)}
                    </Text>
                    <Text style={[styles.wpEarnings, { color: theme.success }]}>
                      {money(item.earnings)}
                    </Text>
                  </View>
                  <ChevronRight color={theme.textSecondary} size={16} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Unpaid card */}
      <View
        style={[
          styles.unpaidCard,
          { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}55` },
        ]}>
        <View style={styles.unpaidHeader}>
          <View style={styles.unpaidLabel}>
            <Clock color={theme.warning} size={16} />
            <Text style={[styles.unpaidLabelText, { color: theme.warning }]}>Unpaid</Text>
          </View>
          <Text style={[styles.unpaidAmount, { color: theme.warning }]}>
            {money(totalUnpaidAmount)}
          </Text>
        </View>

        <View style={styles.unpaidRow}>
          <View style={styles.flex}>
            <Text style={[styles.unpaidValue, { color: theme.text }]}>
              {formatDuration(totalUnpaidMinutes)}
            </Text>
            <Text style={[styles.unpaidHint, { color: theme.warning }]}>
              Estimated unpaid amount
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onOpenPaymentTracking}
            style={({ pressed }) => [
              styles.unpaidButton,
              { backgroundColor: pressed ? UNPAID_BUTTON.pressed : UNPAID_BUTTON.base },
            ]}>
            <Text style={styles.unpaidButtonText}>View unpaid hours</Text>
            <ChevronRight color="#ffffff" size={14} />
          </Pressable>
        </View>
      </View>

      {/* Recent shifts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Shifts</Text>
          <Pressable accessibilityRole="button" onPress={onViewAllWorkplaces} hitSlop={8}>
            <Text style={[styles.sectionLink, { color: theme.accent }]}>View all</Text>
          </Pressable>
        </View>

        {recentShifts.length === 0 ? (
          <View style={[styles.emptyCard, cardStyle]}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No shifts recorded yet.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentShifts.map((shift) => {
              const wp = workplaces.find((w) => w.id === shift.workplaceId);
              return (
                <ShiftRow
                  key={shift.id}
                  shift={shift}
                  workplace={wp}
                  showWorkplace
                  onClick={() => onSelectShift(shift)}
                />
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekCard: {
    padding: 20,
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  weekRange: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  weekValue: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  weekStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  weekStatLabel: {
    fontSize: 11,
  },
  weekStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 8,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  wpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  wpLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wpBar: {
    width: 10,
    height: 28,
    borderRadius: 999,
  },
  wpName: {
    fontSize: 14,
    fontWeight: '600',
  },
  wpMeta: {
    fontSize: 12,
  },
  wpRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wpDuration: {
    fontSize: 14,
    fontWeight: '700',
  },
  wpEarnings: {
    fontSize: 12,
    fontWeight: '500',
  },
  unpaidCard: {
    padding: 16,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  unpaidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unpaidLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unpaidLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  unpaidAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  unpaidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  unpaidValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  unpaidHint: {
    fontSize: 12,
  },
  unpaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unpaidButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
