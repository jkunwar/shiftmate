import { StyleSheet, Text, View } from 'react-native';

import { ChipGroup } from '@/components/common/ChipGroup';
import { DateField } from '@/components/common/DateTimeFields';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Workplace } from '@/types';
import { DatePreset, PaymentFilter } from '@/utils/reportFilters';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'custom', label: 'Custom' },
];

const PAYMENT_FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'unpaid', label: 'Unpaid Only' },
  { value: 'paid', label: 'Paid Only' },
];

interface ReportFiltersProps {
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
  workplaces: Workplace[];
  /** A workplace id, or 'all'. */
  workplaceId: string;
  onWorkplaceChange: (workplaceId: string) => void;
  payment: PaymentFilter;
  onPaymentChange: (payment: PaymentFilter) => void;
}

/** The date range, workplace and payment-status filters of a report. */
export function ReportFilters({
  datePreset,
  onDatePresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  workplaces,
  workplaceId,
  onWorkplaceChange,
  payment,
  onPaymentChange,
}: ReportFiltersProps) {
  const theme = useTheme();

  return (
    <>
      <ChipGroup options={DATE_PRESETS} value={datePreset} onChange={onDatePresetChange} />

      {datePreset === 'custom' ? (
        <View
          style={[
            styles.customRange,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={styles.flex}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Start Date</Text>
            <DateField
              compact
              value={customStart}
              onChange={onCustomStartChange}
              accessibilityLabel="Start date"
            />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>End Date</Text>
            <DateField
              compact
              value={customEnd}
              onChange={onCustomEndChange}
              accessibilityLabel="End date"
            />
          </View>
        </View>
      ) : null}

      <ChipGroup
        label="Workplace"
        options={[
          { value: 'all', label: 'All Workplaces' },
          ...workplaces.map((wp) => ({ value: wp.id, label: wp.name })),
        ]}
        value={workplaceId}
        onChange={onWorkplaceChange}
      />

      <ChipGroup
        label="Payment Status"
        options={PAYMENT_FILTERS}
        value={payment}
        onChange={onPaymentChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  customRange: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
});
