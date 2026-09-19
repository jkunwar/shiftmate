import { CheckCircle2, Edit3, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { PaymentStatusBadge } from '@/components/common/PaymentStatusBadge';
import { DateField } from '@/components/common/DateTimeFields';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, formatDuration, shiftEarnings } from '@/utils/timeCalculations';

interface ShiftDetailsModalProps {
  isOpen: boolean;
  shift: Shift | null;
  workplace?: Workplace;
  onClose: () => void;
  onEdit: (shift: Shift) => void;
  onDelete: (shiftId: string) => void;
  onTogglePaymentStatus: (
    shiftId: string,
    newStatus: 'paid' | 'unpaid',
    paidDate?: string,
    actualPaidAmount?: number,
  ) => void;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today as YYYY-MM-DD in the device's local timezone (toISOString would use UTC). */
function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  isOpen,
  shift,
  workplace,
  onClose,
  onEdit,
  onDelete,
  onTogglePaymentStatus,
}) => {
  const theme = useTheme();
  const { money, time, currency } = useFormat();
  const insets = useSafeAreaInsets();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [actualAmountInput, setActualAmountInput] = useState('');
  const [paidDateInput, setPaidDateInput] = useState(todayLocal());

  if (!isOpen || !shift) return null;

  const hourlyRate = shift.hourlyRate ?? workplace?.hourlyRate ?? 0;
  const earnings = shiftEarnings(shift, workplace);
  const isPaid = shift.paymentStatus === 'paid';
  const isPaidDateValid = DATE_PATTERN.test(paidDateInput);

  const handleOpenMarkPaid = () => {
    setActualAmountInput(earnings > 0 ? earnings.toFixed(2) : '');
    setPaidDateInput(todayLocal());
    setShowMarkPaidModal(true);
  };

  const handleConfirmMarkPaid = () => {
    if (!isPaidDateValid) return;
    const parsedAmount = parseFloat(actualAmountInput);
    const actualAmount = Number.isNaN(parsedAmount) ? undefined : parsedAmount;
    onTogglePaymentStatus(shift.id, 'paid', paidDateInput, actualAmount);
    setShowMarkPaidModal(false);
  };

  const handleMarkUnpaid = () => {
    onTogglePaymentStatus(shift.id, 'unpaid');
  };

  const cardStyle = { backgroundColor: theme.backgroundElement, borderColor: theme.border };
  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitle}>
              <View style={[styles.dot, { backgroundColor: workplace?.color || theme.accent }]} />
              <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
                {workplace?.name || 'Workplace Shift'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { backgroundColor: theme.backgroundElement },
              ]}>
              <X color={theme.textSecondary} size={20} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}
            showsVerticalScrollIndicator={false}>
            {/* Date headline */}
            <View style={styles.gapTiny}>
              <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Shift Date</Text>
              <Text style={[styles.dateHeadline, { color: theme.text }]}>
                {formatDate(shift.date, 'full')}
              </Text>
            </View>

            {/* Time & break cards */}
            <View style={styles.twoColumns}>
              <View style={[styles.card, styles.column, cardStyle]}>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Working Hours</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>
                  {time(shift.startTime)} – {time(shift.endTime)}
                </Text>
              </View>
              <View style={[styles.card, styles.column, cardStyle]}>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Break Duration</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>
                  {shift.breakMinutes > 0 ? `${shift.breakMinutes} minutes` : 'No break'}
                </Text>
              </View>
            </View>

            {/* Total worked time & earnings */}
            <View
              style={[
                styles.totalCard,
                { backgroundColor: theme.accentSoft, borderColor: `${theme.accent}33` },
              ]}>
              <View>
                <Text style={[styles.totalLabel, { color: theme.accent }]}>Total Worked</Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  {formatDuration(shift.workedMinutes)}
                </Text>
              </View>
              {hourlyRate > 0 ? (
                <View style={styles.earnings}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                    Estimated Earnings ({currency}{hourlyRate}/hr)
                  </Text>
                  <Text style={[styles.earningsValue, { color: theme.text }]}>
                    {money(earnings)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Payment status */}
            <View style={[styles.card, styles.statusCard, cardStyle]}>
              <View style={styles.gapTiny}>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                  Payment Status
                </Text>
                {isPaid && shift.paidDate ? (
                  <Text style={[styles.paidOn, { color: theme.textSecondary }]}>
                    Paid on {formatDate(shift.paidDate, 'short')}
                    {shift.actualPaidAmount !== undefined
                      ? ` (${money(shift.actualPaidAmount)})`
                      : ''}
                  </Text>
                ) : null}
              </View>
              <PaymentStatusBadge status={shift.paymentStatus} size="md" />
            </View>

            {/* Notes */}
            {shift.notes ? (
              <View style={[styles.card, cardStyle]}>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Shift Notes</Text>
                <Text style={[styles.notes, { color: theme.text }]}>{shift.notes}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actions}>
              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onEdit(shift)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.column,
                    {
                      backgroundColor: pressed ? theme.backgroundElement : theme.surface,
                      borderColor: theme.border,
                    },
                  ]}>
                  <Edit3 color={theme.text} size={14} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Edit Shift</Text>
                </Pressable>

                {isPaid ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleMarkUnpaid}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.column,
                      {
                        backgroundColor: theme.warningSoft,
                        borderColor: `${theme.warning}55`,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.actionText, { color: theme.warning }]}>Mark as Unpaid</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleOpenMarkPaid}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.column,
                      { backgroundColor: theme.success, borderColor: theme.success },
                      pressed && styles.pressed,
                    ]}>
                    <CheckCircle2 color={theme.onAccent} size={14} />
                    <Text style={[styles.actionText, { color: theme.onAccent }]}>Mark as Paid</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDeleteConfirm(true)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.deleteButton,
                  pressed && { backgroundColor: theme.dangerSoft },
                ]}>
                <Trash2 color={theme.danger} size={14} />
                <Text style={[styles.actionText, { color: theme.danger }]}>Delete Shift</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Nested inside this Modal: iOS can't reliably present a second, sibling Modal on top */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete this shift?"
        message="This shift will be permanently removed from your work log."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(shift.id);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Mark as paid, with amount comparison */}
      <Modal
        visible={showMarkPaidModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowMarkPaidModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <View style={styles.dialogBackdrop}>
            {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
            <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => setShowMarkPaidModal(false)} />
            <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.dialogHeader}>
                <Text style={[styles.dialogTitle, { color: theme.text }]}>Mark Shift as Paid</Text>
                <Pressable
                  accessibilityLabel="Close"
                  onPress={() => setShowMarkPaidModal(false)}
                  hitSlop={8}>
                  <X color={theme.textSecondary} size={16} />
                </Pressable>
              </View>

              <View style={styles.gapTiny}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>Paid Date</Text>
                <DateField
                  value={paidDateInput}
                  onChange={setPaidDateInput}
                  invalid={!isPaidDateValid}
                  accessibilityLabel="Paid date"
                />
              </View>

              <View style={styles.gapTiny}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Amount Received</Text>
                  <Text style={[styles.expected, { color: theme.textSecondary }]}>
                    Expected: {money(earnings)}
                  </Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={[styles.currency, { color: theme.textSecondary }]}>{currency}</Text>
                  <TextInput
                    value={actualAmountInput}
                    onChangeText={setActualAmountInput}
                    placeholder={earnings.toFixed(2)}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.amountInput, inputStyle]}
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowMarkPaidModal(false)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.column,
                    {
                      backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                      borderColor: theme.border,
                    },
                  ]}>
                  <Text style={[styles.actionText, { color: theme.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={!isPaidDateValid}
                  onPress={handleConfirmMarkPaid}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.column,
                    { backgroundColor: theme.success, borderColor: theme.success },
                    (pressed || !isPaidDateValid) && styles.pressed,
                  ]}>
                  <Text style={[styles.actionText, styles.confirmText, { color: theme.onAccent }]}>
                    Confirm Paid
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    maxWidth: 448,
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  gapTiny: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateHeadline: {
    fontSize: 18,
    fontWeight: '700',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  card: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  earnings: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidOn: {
    fontSize: 12,
  },
  notes: {
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 8,
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteButton: {
    borderColor: 'transparent',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  confirmText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  dialogBackdrop: {
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
    borderRadius: 16,
    borderWidth: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expected: {
    fontSize: 11,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  amountWrap: {
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  amountInput: {
    paddingLeft: 28,
  },
});
