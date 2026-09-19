import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, formatDuration, toLocalDateString } from '@/utils/timeCalculations';
import { FontSize } from '@/constants/theme';

interface CalendarViewProps {
  shifts: Shift[];
  workplace: Workplace;
  currentYearMonth: string; // "YYYY-MM"
  onChangeMonth: (newYearMonth: string) => void;
  onSelectShift: (shift: Shift) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  workplace,
  currentYearMonth,
  onChangeMonth,
  onSelectShift,
}) => {
  const theme = useTheme();
  const { time } = useFormat();

  const [yearStr, monthStr] = currentYearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  // Selected date inside the month (defaults to today if same month, or first day with a shift)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = toLocalDateString();
    if (today.startsWith(currentYearMonth)) return today;
    const firstShift = shifts.find((s) => s.date.startsWith(currentYearMonth));
    return firstShift ? firstShift.date : `${currentYearMonth}-01`;
  });

  const changeMonth = (delta: -1 | 1) => {
    let newYear = year;
    let newMonth = month + delta;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const formatted = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onChangeMonth(formatted);
    setSelectedDate(`${formatted}-01`);
  };

  // Calendar math
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

  // Group shifts by date for quick lookup
  const shiftsByDate = new Map<string, Shift[]>();
  shifts.forEach((s) => {
    if (s.date.startsWith(currentYearMonth)) {
      if (!shiftsByDate.has(s.date)) {
        shiftsByDate.set(s.date, []);
      }
      shiftsByDate.get(s.date)!.push(s);
    }
  });

  const selectedDayShifts = shiftsByDate.get(selectedDate) || [];
  const selectedDayMinutes = selectedDayShifts.reduce((acc, s) => acc + s.workedMinutes, 0);

  const cardStyle = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <View style={styles.container}>
      {/* Month navigator */}
      <View style={[styles.navigator, cardStyle]}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => changeMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navButton,
            pressed && { backgroundColor: theme.backgroundElement },
          ]}>
          <ChevronLeft color={theme.textSecondary} size={20} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: theme.text }]}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <Pressable
          accessibilityLabel="Next month"
          onPress={() => changeMonth(1)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navButton,
            pressed && { backgroundColor: theme.backgroundElement },
          ]}>
          <ChevronRight color={theme.textSecondary} size={20} />
        </Pressable>
      </View>

      {/* Calendar grid */}
      <View style={[styles.grid, cardStyle]}>
        <View style={styles.weekRow}>
          {DAYS_OF_WEEK.map((d, i) => (
            <View key={i} style={styles.cell}>
              <Text style={[styles.weekday, { color: theme.textSecondary }]}>{d}</Text>
            </View>
          ))}
        </View>

        <View style={styles.daysWrap}>
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.cell} />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYearMonth}-${String(dayNum).padStart(2, '0')}`;
            const hasShifts = shiftsByDate.has(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <View key={dayNum} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedDate(dateStr)}
                  style={[
                    styles.day,
                    isSelected
                      ? { backgroundColor: theme.accent }
                      : hasShifts && { backgroundColor: theme.accentSoft },
                  ]}>
                  <Text
                    maxFontSizeMultiplier={1.3}
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? theme.onAccent
                          : hasShifts
                            ? theme.accent
                            : theme.text,
                      },
                      isSelected && styles.dayTextSelected,
                    ]}>
                    {dayNum}
                  </Text>
                  {hasShifts ? (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: isSelected ? theme.onAccent : theme.accent },
                      ]}
                    />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* Selected date detail */}
      <View style={[styles.detail, cardStyle]}>
        <View style={[styles.detailHeader, { borderBottomColor: theme.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {formatDate(selectedDate, 'medium')}
            </Text>
            <Text style={[styles.detailSub, { color: theme.textSecondary }]}>
              {workplace.name}
            </Text>
          </View>
          {selectedDayShifts.length > 0 ? (
            <Text style={[styles.detailTitle, { color: theme.text }]}>
              {formatDuration(selectedDayMinutes)}
            </Text>
          ) : null}
        </View>

        {selectedDayShifts.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            No shifts recorded on this date.
          </Text>
        ) : (
          <View style={styles.shiftList}>
            {selectedDayShifts.map((shift) => (
              <Pressable
                key={shift.id}
                accessibilityRole="button"
                onPress={() => onSelectShift(shift)}
                style={({ pressed }) => [
                  styles.shiftRow,
                  {
                    backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <View>
                  <Text style={[styles.shiftTime, { color: theme.text }]}>
                    {time(shift.startTime)} – {time(shift.endTime)}
                  </Text>
                  {shift.breakMinutes > 0 ? (
                    <Text style={[styles.breakText, { color: theme.textSecondary }]}>
                      {shift.breakMinutes}m break
                    </Text>
                  ) : null}
                </View>
                <View style={styles.shiftRight}>
                  <Text style={[styles.shiftDuration, { color: theme.text }]}>
                    {formatDuration(shift.workedMinutes)}
                  </Text>
                  <PaymentStatusBadge status={shift.paymentStatus} size="sm" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: 16,
  },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  navButton: {
    padding: 6,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  grid: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // One seventh of the row; padding (not gap) keeps seven cells per line
  cell: {
    width: `${100 / 7}%`,
    padding: 2,
    alignItems: 'center',
  },
  weekday: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  day: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  dayTextSelected: {
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  detail: {
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  detailSub: {
    fontSize: FontSize.xs,
  },
  empty: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    paddingVertical: 12,
  },
  shiftList: {
    gap: 8,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  shiftTime: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  breakText: {
    fontSize: FontSize.xs,
  },
  shiftRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftDuration: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
