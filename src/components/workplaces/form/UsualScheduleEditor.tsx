import { StyleSheet, Switch, Text, View } from 'react-native';

import { TimeField } from '@/components/common/DateTimeFields';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UsualScheduleDay } from '@/types';

interface UsualScheduleEditorProps {
  schedule: UsualScheduleDay[];
  onToggleDay: (index: number) => void;
  onChangeTime: (index: number, field: 'startTime' | 'endTime', value: string) => void;
}

/** A weekly template: which days are worked, and the usual start and end times for each. */
export function UsualScheduleEditor({
  schedule,
  onToggleDay,
  onChangeTime,
}: UsualScheduleEditorProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {schedule.map((day, index) => (
        <View key={day.dayOfWeek} style={styles.row}>
          <View style={styles.dayName}>
            <Switch
              value={day.active}
              onValueChange={() => onToggleDay(index)}
              trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
              thumbColor="#ffffff"
            />
            <Text
              numberOfLines={1}
              style={[styles.dayText, { color: day.active ? theme.text : theme.textSecondary }]}>
              {day.dayName}
            </Text>
          </View>

          {day.active ? (
            <View style={styles.times}>
              <View style={styles.timeField}>
                <TimeField
                  compact
                  value={day.startTime}
                  onChange={(time) => onChangeTime(index, 'startTime', time)}
                  accessibilityLabel={`${day.dayName} start time`}
                />
              </View>
              <Text style={{ color: theme.textSecondary }}>–</Text>
              <View style={styles.timeField}>
                <TimeField
                  compact
                  value={day.endTime}
                  onChange={(time) => onChangeTime(index, 'endTime', time)}
                  accessibilityLabel={`${day.dayName} end time`}
                />
              </View>
            </View>
          ) : (
            <Text style={[styles.off, { color: theme.textSecondary }]}>Off</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeField: {
    width: 76,
  },
  off: {
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
});
