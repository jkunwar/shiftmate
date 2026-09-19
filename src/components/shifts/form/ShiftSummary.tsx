import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface ShiftSummaryProps {
  workedMinutes: number;
  /** Estimated earnings; hidden when there is no rate to work them out from. */
  earnings: number | null;
}

/** The live result of the times, break and rate the user has entered. */
export function ShiftSummary({ workedMinutes, earnings }: ShiftSummaryProps) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View
      style={[styles.summary, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Calculated Worked Time</Text>
        <Text style={[styles.value, { color: theme.text }]}>{formatDuration(workedMinutes)}</Text>
      </View>
      {earnings !== null ? (
        <View style={styles.earnings}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Est. Earnings</Text>
          <Text style={[styles.earningsValue, { color: theme.success }]}>{money(earnings)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  earnings: {
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
