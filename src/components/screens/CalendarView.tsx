import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DayDetailCard } from '@/components/calendar/DayDetailCard';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { Shift, Workplace } from '@/types';
import { defaultSelectedDate, groupShiftsByDate } from '@/utils/calendar';
import { monthLabelFor, shiftMonthKey } from '@/utils/monthNav';
import { toLocalDateString } from '@/utils/timeCalculations';

interface CalendarViewProps {
  shifts: Shift[];
  workplace: Workplace;
  currentYearMonth: string; // "YYYY-MM"
  onChangeMonth: (newYearMonth: string) => void;
  onSelectShift: (shift: Shift) => void;
}

/** One workplace's month as a calendar, with the shifts of the tapped day underneath. */
export const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  workplace,
  currentYearMonth,
  onChangeMonth,
  onSelectShift,
}) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    defaultSelectedDate(currentYearMonth, toLocalDateString(), shifts),
  );

  const shiftsByDate = useMemo(
    () => groupShiftsByDate(shifts, currentYearMonth),
    [shifts, currentYearMonth],
  );
  const datesWithShifts = useMemo(() => new Set(shiftsByDate.keys()), [shiftsByDate]);

  const changeMonth = (delta: -1 | 1) => {
    const next = shiftMonthKey(currentYearMonth, delta);
    onChangeMonth(next);
    setSelectedDate(`${next}-01`);
  };

  return (
    <View style={styles.container}>
      <MonthNavigator
        label={monthLabelFor(currentYearMonth)}
        onPrevious={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
      />
      <CalendarGrid
        monthKey={currentYearMonth}
        datesWithShifts={datesWithShifts}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <DayDetailCard
        date={selectedDate}
        workplaceName={workplace.name}
        shifts={shiftsByDate.get(selectedDate) ?? []}
        onSelectShift={onSelectShift}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
