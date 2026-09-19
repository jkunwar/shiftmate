import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRefreshControl } from '@/components/common/refresh-control';
import { RecentShifts } from '@/components/home/RecentShifts';
import { UnpaidCard } from '@/components/home/UnpaidCard';
import { WeekHero } from '@/components/home/WeekHero';
import { WorkplaceWeekList } from '@/components/home/WorkplaceWeekList';
import { BottomTabInset, FontSize, ScreenTitle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, User, Workplace } from '@/types';
import { getWeekRange } from '@/utils/dateRanges';
import { buildHomeSummary, pickRecentShifts } from '@/utils/homeSummary';
import { buildWeekDays } from '@/utils/weekChart';

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
  const insets = useSafeAreaInsets();

  // The week containing today
  const today = useToday();
  const week = getWeekRange(today, weekStartsOn);

  const summary = useMemo(
    () => buildHomeSummary(shifts, workplaces, { start: week.start, end: week.end }),
    [shifts, workplaces, week.start, week.end],
  );
  const weekDays = useMemo(() => buildWeekDays(shifts, week.start), [shifts, week.start]);
  const recentShifts = useMemo(() => pickRecentShifts(shifts), [shifts]);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      refreshControl={refreshControl}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      <View>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
        <Text style={[styles.name, { color: theme.text }]}>{user.name.split(' ')[0]}</Text>
      </View>

      <WeekHero
        week={week}
        days={weekDays}
        today={today}
        totalMinutes={summary.weekMinutes}
        earnings={summary.weekEarnings}
        shiftCount={summary.weekShifts.length}
      />

      <WorkplaceWeekList items={summary.breakdown} onSelectWorkplace={onSelectWorkplace} />

      {summary.unpaidCount > 0 ? (
        <UnpaidCard
          minutes={summary.unpaidMinutes}
          amount={summary.unpaidAmount}
          onViewUnpaid={onOpenPaymentTracking}
        />
      ) : null}

      <RecentShifts
        shifts={recentShifts}
        workplaces={workplaces}
        onSelectShift={onSelectShift}
        onSeeAll={onViewAllWorkplaces}
      />
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
});
