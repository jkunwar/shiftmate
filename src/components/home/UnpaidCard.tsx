import { ChevronRight, Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface UnpaidCardProps {
  minutes: number;
  amount: number;
  onViewUnpaid: () => void;
}

/** What is still owed: the unpaid hours, the estimated amount and a way into Payment Tracking. */
export function UnpaidCard({ minutes, amount, onViewUnpaid }: UnpaidCardProps) {
  const theme = useTheme();
  const { money } = useFormat();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}55` },
      ]}>
      <View style={styles.header}>
        <View style={styles.label}>
          <Clock color={theme.warning} size={16} />
          <Text style={[styles.labelText, { color: theme.warning }]}>Unpaid</Text>
        </View>
        <Text style={[styles.amount, { color: theme.warning }]}>{money(amount)}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.summary}>
          <Text style={[styles.hours, { color: theme.text }]}>{formatDuration(minutes)}</Text>
          <Text style={[styles.hint, { color: theme.warning }]}>Estimated unpaid amount</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onViewUnpaid}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.warning },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.buttonText, { color: theme.onAccent }]}>View unpaid hours</Text>
          <ChevronRight color={theme.onAccent} size={14} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  amount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  summary: {
    flexShrink: 1,
  },
  hours: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  hint: {
    fontSize: FontSize.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
