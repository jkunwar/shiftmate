import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { WeekDay } from '@/utils/weekChart';
import { formatDuration } from '@/utils/timeCalculations';

interface WeekBarsProps {
  days: WeekDay[];
  /** YYYY-MM-DD of today; that column is emphasised until another one is tapped. */
  today: string;
  /** Colour of the emphasised column and the caption. */
  emphasis: string;
  /** Colour of the other columns, the day letters and the baseline. */
  muted: string;
}

const CHART_HEIGHT = 52;
const BAR_WIDTH = 16; // capped so the columns never fill their slot
const MIN_SCALE_MINUTES = 4 * 60; // a short week shouldn't fill the chart with one small bar
const STUB_HEIGHT = 2;

/**
 * Hours per day for one week: a single series, so no legend. Today is emphasised and the rest sit
 * back. Tapping a column shows that day's hours in the caption above the chart.
 */
export const WeekBars: React.FC<WeekBarsProps> = ({ days, today, emphasis, muted }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const scaleMax = Math.max(MIN_SCALE_MINUTES, ...days.map((d) => d.minutes));
  const focusDate = selected ?? (days.some((d) => d.date === today) ? today : null);
  const focus = days.find((d) => d.date === focusDate);

  return (
    <View style={styles.chart}>
      <Text numberOfLines={1} style={[styles.caption, { color: muted }]}>
        {focus ? `${focus.short}  ·  ` : ''}
        {focus ? (
          <Text style={{ color: emphasis, fontWeight: '600' }}>{formatDuration(focus.minutes)}</Text>
        ) : null}
      </Text>

      <View style={[styles.plot, { borderBottomColor: `${muted}55` }]}>
        {days.map((day) => {
          const isFocus = day.date === focusDate;
          const height =
            day.minutes > 0
              ? Math.max(STUB_HEIGHT, Math.round((day.minutes / scaleMax) * CHART_HEIGHT))
              : STUB_HEIGHT;

          return (
            <Pressable
              key={day.date}
              accessibilityRole="button"
              accessibilityLabel={`${day.short}, ${formatDuration(day.minutes)}`}
              // The slot is the hit target, so a thin bar is still easy to tap
              onPress={() => setSelected(day.date === selected ? null : day.date)}
              style={styles.slot}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isFocus ? emphasis : `${muted}A6`,
                    opacity: day.minutes > 0 ? 1 : 0.5,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.labels}>
        {days.map((day) => (
          <Text
            key={day.date}
            style={[
              styles.label,
              { color: muted },
              day.date === focusDate && { color: emphasis, fontWeight: '700' },
            ]}>
            {day.initial}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    gap: 4,
  },
  caption: {
    fontSize: FontSize.xs,
    textAlign: 'right',
    minHeight: 16,
  },
  plot: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: BAR_WIDTH,
    // Rounded at the data end, square on the baseline
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  labels: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
  },
});
