import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface PaymentMetricsBarProps {
  totalMinutes: number;
  unpaidMinutes: number;
  paidMinutes: number;
}

/** Total worked | unpaid | paid, side by side. */
export function PaymentMetricsBar({
  totalMinutes,
  unpaidMinutes,
  paidMinutes,
}: PaymentMetricsBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Metric label="Total Worked" minutes={totalMinutes} color={theme.text} labelColor={theme.textSecondary} />
      <Metric label="Unpaid" minutes={unpaidMinutes} color={theme.warning} labelColor={theme.warning} />
      <Metric label="Paid" minutes={paidMinutes} color={theme.success} labelColor={theme.success} />
    </View>
  );
}

function Metric({
  label,
  minutes,
  color,
  labelColor,
}: {
  label: string;
  minutes: number;
  color: string;
  labelColor: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.value, { color }]}>{formatDuration(minutes)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  metric: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.xs,
  },
  value: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
