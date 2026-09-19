import { CalendarDays } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { ChipGroup } from '@/components/common/ChipGroup';
import { DateField } from '@/components/common/DateTimeFields';
import { FormField } from '@/components/common/FormField';
import { SectionCard } from '@/components/settings/SectionCard';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { PayFrequency, UserPreferences } from '@/types';
import { defaultPayAnchor, describePayPeriod } from '@/utils/payPeriods';
import { weekStartOf } from '@/utils/timeCalculations';

const FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: 'off', label: 'Not set' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'semimonthly', label: 'Twice a month' },
  { value: 'monthly', label: 'Monthly' },
];

interface PayPeriodSectionProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

/** How often the user is paid, so Reports can offer "This Pay Period" and "Last Pay Period". */
export function PayPeriodSection({ preferences, onUpdatePreferences }: PayPeriodSectionProps) {
  const theme = useTheme();
  const today = useToday();
  const { payFrequency, payAnchor } = preferences;

  const needsAnchor =
    payFrequency === 'weekly' || payFrequency === 'biweekly' || payFrequency === 'monthly';
  const current = describePayPeriod(today, { frequency: payFrequency, anchor: payAnchor });

  const changeFrequency = (frequency: PayFrequency) => {
    onUpdatePreferences({
      payFrequency: frequency,
      // Start from something sensible so the current period shows straight away; it can be changed
      payAnchor:
        payAnchor ||
        defaultPayAnchor(frequency, today, weekStartOf(today, preferences.weekStartsOn)),
    });
  };

  return (
    <SectionCard icon={CalendarDays} title="Pay Period">
      <FormField
        label="How often are you paid?"
        description="Adds “This Pay Period” and “Last Pay Period” to Reports and exports.">
        <ChipGroup options={FREQUENCIES} value={payFrequency} onChange={changeFrequency} />
      </FormField>

      {needsAnchor ? (
        <FormField
          label="A pay period started on"
          description={
            payFrequency === 'monthly'
              ? 'Pick the first day of any pay period. That day of the month repeats.'
              : 'Pick the first day of any recent pay period, such as your last payday cycle.'
          }>
          <DateField
            value={payAnchor}
            onChange={(anchor) => onUpdatePreferences({ payAnchor: anchor })}
            accessibilityLabel="A pay period started on"
          />
        </FormField>
      ) : null}

      {current ? (
        <Text style={[styles.current, { color: theme.textSecondary }]}>
          Current pay period: <Text style={[styles.currentValue, { color: theme.text }]}>{current}</Text>
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  current: {
    fontSize: FontSize.sm,
  },
  currentValue: {
    fontWeight: '700',
  },
});
