import { ArrowLeft, Check, Clock, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/common/DateTimeFields';
import { EmptyState } from '@/components/common/EmptyState';
import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { BottomTabInset } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { ListSeparator } from '@/components/common/list-separator';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useRefreshControl } from '@/components/common/refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import {
  formatDate,
  formatDuration,
  shiftEarnings,
  toLocalDateString,
} from '@/utils/timeCalculations';

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

type StatusFilter = 'unpaid' | 'paid' | 'all';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  const { money, time, currency } = useFormat();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<StatusFilter>('unpaid');
  const [selectedWpFilter, setSelectedWpFilter] = useState<string>('all');
  const [activePayModalShift, setActivePayModalShift] = useState<Shift | null>(null);
  const [paidDateInput, setPaidDateInput] = useState<string>(toLocalDateString());
  const [actualAmountInput, setActualAmountInput] = useState<string>('');

  // Calculations for all shifts
  const stats = useMemo(() => {
    let totalMinutesWorked = 0;
    let unpaidMinutes = 0;
    let unpaidEarnings = 0;
    let paidMinutes = 0;
    let paidEarnings = 0;

    shifts.forEach((shift) => {
      const earnings = shiftEarnings(
        shift,
        workplaces.find((w) => w.id === shift.workplaceId),
      );

      totalMinutesWorked += shift.workedMinutes;

      if (shift.paymentStatus === 'unpaid') {
        unpaidMinutes += shift.workedMinutes;
        unpaidEarnings += earnings;
      } else {
        paidMinutes += shift.workedMinutes;
        paidEarnings += earnings;
      }
    });

    return { totalMinutesWorked, unpaidMinutes, unpaidEarnings, paidMinutes, paidEarnings };
  }, [shifts, workplaces]);

  // Filtered shifts list
  const filteredShifts = useMemo(() => {
    return shifts
      .filter((s) => {
        if (filter === 'unpaid' && s.paymentStatus !== 'unpaid') return false;
        if (filter === 'paid' && s.paymentStatus !== 'paid') return false;
        if (selectedWpFilter !== 'all' && s.workplaceId !== selectedWpFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, filter, selectedWpFilter]);

  const unpaidCount = shifts.filter((s) => s.paymentStatus === 'unpaid').length;
  const paidCount = shifts.filter((s) => s.paymentStatus === 'paid').length;

  const handleOpenMarkPaid = (shift: Shift) => {
    const expected = shiftEarnings(
      shift,
      workplaces.find((w) => w.id === shift.workplaceId),
    );

    setActivePayModalShift(shift);
    setPaidDateInput(toLocalDateString());
    setActualAmountInput(expected > 0 ? expected.toFixed(2) : '');
  };

  const isPaidDateValid = DATE_PATTERN.test(paidDateInput);

  const handleConfirmPaid = () => {
    if (!activePayModalShift || !isPaidDateValid) return;
    const parsedAmount = parseFloat(actualAmountInput.replace(',', '.'));
    const actualAmount = Number.isNaN(parsedAmount) ? undefined : parsedAmount;
    onUpdateShiftStatus(activePayModalShift.id, 'paid', paidDateInput, actualAmount);
    setActivePayModalShift(null);
  };

  const currentWp = activePayModalShift
    ? workplaces.find((w) => w.id === activePayModalShift.workplaceId)
    : null;
  const currentExpected = activePayModalShift ? shiftEarnings(activePayModalShift, currentWp) : 0;

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'unpaid', label: `Unpaid (${unpaidCount})` },
    { key: 'paid', label: `Paid (${paidCount})` },
    { key: 'all', label: `All Shifts (${shifts.length})` },
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
            {/* Top header */}
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                onPress={onBack}
                hitSlop={8}
                style={styles.backButton}
              >
                <ArrowLeft color={theme.textSecondary} size={16} />
                <Text style={[styles.backText, { color: theme.textSecondary }]}>Dashboard</Text>
              </Pressable>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Payment Tracking</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Prominent unpaid hero card */}
            <View
              style={[
                styles.hero,
                { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}66` },
              ]}
            >
              <View style={styles.heroLabel}>
                <Clock color={theme.warning} size={16} />
                <Text style={[styles.heroLabelText, { color: theme.warning }]}>Unpaid Balance</Text>
              </View>

              <View style={styles.heroRow}>
                <View style={styles.flex}>
                  <Text style={[styles.heroValue, { color: theme.text }]}>
                    {formatDuration(stats.unpaidMinutes)}
                  </Text>
                  <Text style={[styles.heroSub, { color: theme.warning }]}>
                    Estimated unpaid: {money(stats.unpaidEarnings)}
                  </Text>
                </View>

                <View style={styles.right}>
                  <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>
                    Paid to date
                  </Text>
                  <Text style={[styles.paidToDate, { color: theme.success }]}>
                    {money(stats.paidEarnings)}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3-way metrics bar: total worked | unpaid | paid */}
            <View
              style={[
                styles.metrics,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.flex}>
                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                  Total Worked
                </Text>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {formatDuration(stats.totalMinutesWorked)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.metricLabel, { color: theme.warning }]}>Unpaid</Text>
                <Text style={[styles.metricValue, { color: theme.warning }]}>
                  {formatDuration(stats.unpaidMinutes)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.metricLabel, { color: theme.success }]}>Paid</Text>
                <Text style={[styles.metricValue, { color: theme.success }]}>
                  {formatDuration(stats.paidMinutes)}
                </Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={styles.filters}>
              <SegmentedControl
                fill
                options={statusTabs.map((tab) => ({ value: tab.key, label: tab.label }))}
                value={filter}
                onChange={setFilter}
              />

              {/* Workplace filter pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pills}
              >
                {[{ id: 'all', name: 'All Workplaces' }, ...workplaces].map((wp) => {
                  const selected = selectedWpFilter === wp.id;
                  return (
                    <Pressable
                      key={wp.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedWpFilter(wp.id)}
                      style={[
                        styles.pill,
                        selected
                          ? { backgroundColor: theme.text, borderColor: theme.text }
                          : { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          { color: selected ? theme.background : theme.textSecondary },
                        ]}
                      >
                        {wp.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
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
        renderItem={({ item: shift }) => {
          const wp = workplaces.find((w) => w.id === shift.workplaceId);
          const earnings = shiftEarnings(shift, wp);
          const isUnpaid = shift.paymentStatus === 'unpaid';

          return (
            <View
              key={shift.id}
              style={[
                styles.shiftCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelectShift(shift)}
                style={styles.shiftTop}
              >
                <View style={styles.flex}>
                  <View style={styles.wpRow}>
                    <View style={[styles.dot, { backgroundColor: wp?.color || theme.accent }]} />
                    <Text numberOfLines={1} style={[styles.wpName, { color: theme.text }]}>
                      {wp?.name || 'Workplace'}
                    </Text>
                  </View>
                  <Text style={[styles.shiftMeta, { color: theme.textSecondary }]}>
                    {formatDate(shift.date, 'medium')} · {time(shift.startTime)} –{' '}
                    {time(shift.endTime)}
                  </Text>
                </View>

                <View style={styles.right}>
                  <Text style={[styles.shiftDuration, { color: theme.text }]}>
                    {formatDuration(shift.workedMinutes)}
                  </Text>
                  <Text style={[styles.shiftEarnings, { color: theme.textSecondary }]}>
                    {money(earnings)}
                  </Text>
                </View>
              </Pressable>

              <View style={[styles.shiftBottom, { borderTopColor: theme.border }]}>
                <View style={styles.statusRow}>
                  <PaymentStatusBadge status={shift.paymentStatus} size="sm" />
                  {shift.paymentStatus === 'paid' && shift.actualPaidAmount !== undefined ? (
                    <Text style={[styles.received, { color: theme.textSecondary }]}>
                      Recv: {money(shift.actualPaidAmount)}
                    </Text>
                  ) : null}
                </View>

                {isUnpaid ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleOpenMarkPaid(shift)}
                    style={({ pressed }) => [
                      styles.markPaid,
                      { backgroundColor: theme.success },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Check color={theme.onAccent} size={14} />
                    <Text style={[styles.markPaidText, { color: theme.onAccent }]}>Mark Paid</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onUpdateShiftStatus(shift.id, 'unpaid')}
                    hitSlop={8}
                  >
                    <Text style={[styles.markUnpaid, { color: theme.textSecondary }]}>
                      Mark Unpaid
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Mark as paid dialog */}
      <Modal
        visible={activePayModalShift !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActivePayModalShift(null)}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          <View style={styles.backdrop}>
            {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
            <Pressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={() => setActivePayModalShift(null)}
            />
            <View
              style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.dialogHeader}>
                <View style={styles.flex}>
                  <Text style={[styles.dialogTitle, { color: theme.text }]}>
                    Record Payment Received
                  </Text>
                  {activePayModalShift ? (
                    <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
                      {currentWp?.name} · {formatDate(activePayModalShift.date, 'short')}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Close"
                  onPress={() => setActivePayModalShift(null)}
                  hitSlop={8}
                >
                  <X color={theme.textSecondary} size={16} />
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Payment Date</Text>
                <DateField
                  value={paidDateInput}
                  onChange={setPaidDateInput}
                  invalid={!isPaidDateValid}
                  accessibilityLabel="Payment date"
                />
              </View>

              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>
                    Actual Amount Received
                  </Text>
                  <Text style={[styles.expected, { color: theme.textSecondary }]}>
                    Expected: {money(currentExpected)}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={[styles.currency, { color: theme.textSecondary }]}>{currency}</Text>
                  <TextInput
                    value={actualAmountInput}
                    onChangeText={setActualAmountInput}
                    placeholder={currentExpected.toFixed(2)}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.amountInput, inputStyle]}
                  />
                </View>
              </View>

              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActivePayModalShift(null)}
                  style={({ pressed }) => [
                    styles.dialogButton,
                    {
                      backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.dialogButtonText, { color: theme.textSecondary }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!isPaidDateValid}
                  onPress={handleConfirmPaid}
                  style={({ pressed }) => [
                    styles.dialogButton,
                    { backgroundColor: theme.success, borderColor: theme.success },
                    (pressed || !isPaidDateValid) && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dialogButtonText,
                      styles.dialogButtonStrong,
                      { color: theme.onAccent },
                    ]}
                  >
                    Save Payment
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 16,
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
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 88,
  },
  hero: {
    padding: 20,
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroValue: {
    fontSize: 30,
    fontWeight: '900',
  },
  heroSub: {
    fontSize: 12,
    marginTop: 2,
  },
  smallLabel: {
    fontSize: 12,
  },
  paidToDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  filters: {
    gap: 8,
  },
  pills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerBlock: {
    gap: 16,
    marginBottom: 16,
  },
  shiftCard: {
    padding: 14,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  shiftTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  wpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wpName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  shiftMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  shiftDuration: {
    fontSize: 14,
    fontWeight: '700',
  },
  shiftEarnings: {
    fontSize: 12,
    fontWeight: '500',
  },
  shiftBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  received: {
    fontSize: 11,
  },
  markPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markPaidText: {
    fontSize: 12,
    fontWeight: '600',
  },
  markUnpaid: {
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dialog: {
    width: '100%',
    maxWidth: 384,
    padding: 20,
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogSub: {
    fontSize: 12,
  },
  field: {
    gap: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldLabel: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  expected: {
    fontSize: 11,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  amountWrap: {
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  amountInput: {
    paddingLeft: 28,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  dialogButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dialogButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dialogButtonStrong: {
    fontWeight: '600',
  },
});
