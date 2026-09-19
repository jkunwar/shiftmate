import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dateInMonth, monthGridShape } from '@/utils/calendar';

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarGridProps {
  monthKey: string;
  /** Dates (YYYY-MM-DD) that have at least one shift. */
  datesWithShifts: Set<string>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

/** The month as a Sunday-first grid; days with shifts are tinted and the selected day is filled. */
export function CalendarGrid({
  monthKey,
  datesWithShifts,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const theme = useTheme();
  const { daysInMonth, leadingBlanks } = monthGridShape(monthKey);

  return (
    <View style={[styles.grid, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.weekdays}>
        {WEEKDAY_INITIALS.map((initial, index) => (
          <View key={index} style={styles.cell}>
            <Text style={[styles.weekday, { color: theme.textSecondary }]}>{initial}</Text>
          </View>
        ))}
      </View>

      <View style={styles.days}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const date = dateInMonth(monthKey, dayNumber);
          const hasShifts = datesWithShifts.has(date);
          const isSelected = selectedDate === date;

          return (
            <View key={dayNumber} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelectDate(date)}
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
                      color: isSelected ? theme.onAccent : hasShifts ? theme.accent : theme.text,
                    },
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {dayNumber}
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
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  weekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  days: {
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
});
