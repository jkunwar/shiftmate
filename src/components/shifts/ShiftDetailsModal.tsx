import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/common/BottomSheet';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { SheetHeader } from '@/components/common/SheetHeader';
import { MarkPaidDialog } from '@/components/payments/MarkPaidDialog';
import { InfoCard } from '@/components/shifts/details/InfoCard';
import { PaymentStatusCard } from '@/components/shifts/details/PaymentStatusCard';
import { ShiftActions } from '@/components/shifts/details/ShiftActions';
import { TotalWorkedCard } from '@/components/shifts/details/TotalWorkedCard';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';
import { formatDate, shiftEarnings, shiftHourlyRate } from '@/utils/timeCalculations';
import { workplaceColor } from '@/utils/workplaceColor';

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
  const { time } = useFormat();
  const insets = useSafeAreaInsets();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);

  if (!isOpen || !shift) return null;

  return (
    <BottomSheet onClose={onClose} keyboardAvoiding={false} maxWidth={448} maxHeight="90%">
      <SheetHeader
        compact
        title={workplace?.name || 'Workplace Shift'}
        leading={
          <View
            style={[styles.dot, { backgroundColor: workplaceColor(workplace?.color, theme.accent) }]}
          />
        }
        onClose={onClose}
      />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.dateBlock}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Shift Date</Text>
          <Text style={[styles.dateHeadline, { color: theme.text }]}>
            {formatDate(shift.date, 'full')}
          </Text>
        </View>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <InfoCard
              label="Working Hours"
              value={`${time(shift.startTime)} – ${time(shift.endTime)}`}
            />
          </View>
          <View style={styles.column}>
            <InfoCard
              label="Break Duration"
              value={shift.breakMinutes > 0 ? `${shift.breakMinutes} minutes` : 'No break'}
            />
          </View>
        </View>

        <TotalWorkedCard
          workedMinutes={shift.workedMinutes}
          hourlyRate={shiftHourlyRate(shift, workplace)}
          earnings={shiftEarnings(shift, workplace)}
        />

        <PaymentStatusCard shift={shift} />

        {shift.notes ? (
          <InfoCard label="Shift Notes">
            <Text style={[styles.notes, { color: theme.text }]}>{shift.notes}</Text>
          </InfoCard>
        ) : null}

        <ShiftActions
          isPaid={shift.paymentStatus === 'paid'}
          onEdit={() => onEdit(shift)}
          onMarkPaid={() => setShowMarkPaid(true)}
          onMarkUnpaid={() => onTogglePaymentStatus(shift.id, 'unpaid')}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      </ScrollView>

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

      {showMarkPaid ? (
        <MarkPaidDialog
          shift={shift}
          workplace={workplace}
          title="Mark Shift as Paid"
          showShiftSubtitle={false}
          amountLabel="Amount Received"
          confirmLabel="Confirm Paid"
          onClose={() => setShowMarkPaid(false)}
          onSave={(paidDate, receivedAmount) => {
            onTogglePaymentStatus(shift.id, 'paid', paidDate, receivedAmount);
            setShowMarkPaid(false);
          }}
        />
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  dateBlock: {
    gap: 2,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateHeadline: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  notes: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
