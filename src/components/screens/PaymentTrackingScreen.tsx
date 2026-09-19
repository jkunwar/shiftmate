import { ArrowLeft } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipGroup } from '@/components/common/ChipGroup';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSeparator } from '@/components/common/list-separator';
import { useRefreshControl } from '@/components/common/refresh-control';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { MarkPaidDialog } from '@/components/payments/MarkPaidDialog';
import { PaymentMetricsBar } from '@/components/payments/PaymentMetricsBar';
import { PaymentShiftCard } from '@/components/payments/PaymentShiftCard';
import { UnpaidBalanceCard } from '@/components/payments/UnpaidBalanceCard';
import { BottomTabInset, FontSize, SubScreenTitle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { filterPaymentShifts, StatusFilter, summarizePayments } from '@/utils/paymentStats';

interface PaymentTrackingScreenProps {
  workplaces: Workplace[];
  shifts: Shift[];
  onBack: () => void;
  onUpdateShiftStatus: (
    shiftId: string,
    status: 'paid' | 'unpaid',
    paidDate?: string,
    actualPaidAmount?: number,
  ) => void;
  onSelectShift: (shift: Shift) => void;
  /** Pull-to-refresh handler (syncs with the cloud). Omit to turn the gesture off. */
  onRefresh?: () => Promise<void>;
}

export const PaymentTrackingScreen: React.FC<PaymentTrackingScreenProps> = ({
  onRefresh,
  workplaces,
  shifts,
  onBack,
  onUpdateShiftStatus,
  onSelectShift,
}) => {
  const theme = useTheme();
  const refreshControl = useRefreshControl(onRefresh);
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<StatusFilter>('unpaid');
  const [workplaceId, setWorkplaceId] = useState('all');
  const [shiftBeingPaid, setShiftBeingPaid] = useState<Shift | null>(null);

  const stats = useMemo(() => summarizePayments(shifts, workplaces), [shifts, workplaces]);
  const filteredShifts = useMemo(
    () => filterPaymentShifts(shifts, { status: filter, workplaceId }),
    [shifts, filter, workplaceId],
  );

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: 'unpaid', label: `Unpaid (${stats.unpaidCount})` },
    { value: 'paid', label: `Paid (${stats.paidCount})` },
    { value: 'all', label: `All Shifts (${shifts.length})` },
  ];

  return (
    <>
      <FlatList
        data={filteredShifts}
        keyExtractor={(shift) => shift.id}
        refreshControl={refreshControl}
        ItemSeparatorComponent={ListSeparator}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                hitSlop={8}
                style={styles.backButton}>
                <ArrowLeft color={theme.textSecondary} size={16} />
                <Text style={[styles.backText, { color: theme.textSecondary }]}>Home</Text>
              </Pressable>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Tracking</Text>
              <View style={styles.headerSpacer} />
            </View>

            <UnpaidBalanceCard
              unpaidMinutes={stats.unpaidMinutes}
              unpaidEarnings={stats.unpaidEarnings}
              paidEarnings={stats.paidEarnings}
            />

            <PaymentMetricsBar
              totalMinutes={stats.totalMinutes}
              unpaidMinutes={stats.unpaidMinutes}
              paidMinutes={stats.paidMinutes}
            />

            <View style={styles.filters}>
              <SegmentedControl fill options={statusTabs} value={filter} onChange={setFilter} />
              <ChipGroup
                variant="ink"
                options={[
                  { value: 'all', label: 'All Workplaces' },
                  ...workplaces.map((wp) => ({ value: wp.id, label: wp.name })),
                ]}
                value={workplaceId}
                onChange={setWorkplaceId}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            type="unpaid"
            title={filter === 'unpaid' ? "You're all caught up" : 'No shifts found'}
            description={
              filter === 'unpaid'
                ? 'No unpaid hours recorded for this selection.'
                : 'Try changing your filters.'
            }
          />
        }
        renderItem={({ item: shift }) => (
          <PaymentShiftCard
            shift={shift}
            workplace={workplaces.find((w) => w.id === shift.workplaceId)}
            onPress={() => onSelectShift(shift)}
            onMarkPaid={() => setShiftBeingPaid(shift)}
            onMarkUnpaid={() => onUpdateShiftStatus(shift.id, 'unpaid')}
          />
        )}
      />

      {shiftBeingPaid ? (
        <MarkPaidDialog
          key={shiftBeingPaid.id}
          shift={shiftBeingPaid}
          workplace={workplaces.find((w) => w.id === shiftBeingPaid.workplaceId)}
          onClose={() => setShiftBeingPaid(null)}
          onSave={(paidDate, receivedAmount) => {
            onUpdateShiftStatus(shiftBeingPaid.id, 'paid', paidDate, receivedAmount);
            setShiftBeingPaid(null);
          }}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  headerBlock: {
    gap: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  headerTitle: {
    ...SubScreenTitle,
  },
  headerSpacer: {
    width: 88,
  },
  filters: {
    gap: 8,
  },
});
