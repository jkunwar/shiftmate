import { Clock } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface UnpaidBalanceCardProps {
  unpaidMinutes: number;
  unpaidEarnings: number;
  paidEarnings: number;
}

/** The headline: how much is still owed, and how much has been paid so far. */
export function UnpaidBalanceCard({
  unpaidMinutes,
  unpaidEarnings,
  paidEarnings,
}: UnpaidBalanceCardProps) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}66` },
      ]}>
      <View style={styles.label}>
        <Clock color={theme.warning} size={16} />
        <Text style={[styles.labelText, { color: theme.warning }]}>Unpaid Balance</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.owed}>
          <Text style={[styles.hours, { color: theme.text }]}>{formatDuration(unpaidMinutes)}</Text>
          <Text style={[styles.estimate, { color: theme.warning }]}>
            Estimated unpaid: {money(unpaidEarnings)}
          </Text>
        </View>

        <View style={styles.paid}>
          <Text style={[styles.paidLabel, { color: theme.textSecondary }]}>Paid to date</Text>
          <Text style={[styles.paidValue, { color: theme.success }]}>{money(paidEarnings)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  owed: {
    flex: 1,
  },
  hours: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
  },
  estimate: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  paid: {
    alignItems: 'flex-end',
  },
  paidLabel: {
    fontSize: FontSize.xs,
  },
  paidValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
