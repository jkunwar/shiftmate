import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface TotalWorkedCardProps {
  workedMinutes: number;
  hourlyRate: number;
  earnings: number;
}

/** The shift's total time and, when it has a rate, its estimated earnings. */
export function TotalWorkedCard({ workedMinutes, hourlyRate, earnings }: TotalWorkedCardProps) {
  const theme = useTheme();
  const { money, currency } = useFormat();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}33` }]}>
      <View>
        <Text style={[styles.label, { color: theme.accent }]}>Total Worked</Text>
        <Text style={[styles.total, { color: theme.text }]}>{formatDuration(workedMinutes)}</Text>
      </View>
      {hourlyRate > 0 ? (
        <View style={styles.earnings}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Estimated Earnings ({currency}
            {hourlyRate}/hr)
          </Text>
          <Text style={[styles.earningsValue, { color: theme.text }]}>{money(earnings)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  total: {
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  earnings: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
