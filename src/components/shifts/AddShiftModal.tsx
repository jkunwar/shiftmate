import { Check, Clock } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/common/BottomSheet';
import { TimeField } from '@/components/common/DateTimeFields';
import { FormField } from '@/components/common/FormField';
import { InlineNotice } from '@/components/common/InlineNotice';
import { MoneyInput } from '@/components/common/MoneyInput';
import { SheetHeader } from '@/components/common/SheetHeader';
import { BreakPicker } from '@/components/shifts/form/BreakPicker';
import { PaymentStatusPicker } from '@/components/shifts/form/PaymentStatusPicker';
import { ShiftDateField } from '@/components/shifts/form/ShiftDateField';
import { ShiftSummary } from '@/components/shifts/form/ShiftSummary';
import { WorkplacePicker } from '@/components/shifts/form/WorkplacePicker';
import { FontSize } from '@/constants/theme';
import { useShiftForm } from '@/hooks/use-shift-form';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<Shift, 'id'>) => void;
  workplaces: Workplace[];
  defaultWorkplaceId?: string;
  initialShift?: Shift | null; // For editing existing shift
  /** Used to warn when the new shift overlaps one that's already logged. */
  existingShifts?: Shift[];
}

const AddShiftForm: React.FC<Omit<AddShiftModalProps, 'isOpen'>> = ({
  onClose,
  onSave,
  workplaces,
  defaultWorkplaceId,
  initialShift,
  existingShifts = [],
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const form = useShiftForm({
    workplaces,
    defaultWorkplaceId,
    initialShift,
    existingShifts,
    onSave,
    onClose,
  });

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader
        title={initialShift ? 'Edit Shift' : 'Add Shift'}
        subtitle="Record worked hours in seconds"
        onClose={onClose}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
        {initialShift?.paymentStatus === 'paid' ? (
          <InlineNotice message="This shift is marked paid. Changing its hours, rate or workplace won't change the amount you received." />
        ) : null}
        {form.errorMsg ? <InlineNotice tone="error" message={form.errorMsg} /> : null}

        <WorkplacePicker
          workplaces={workplaces}
          selectedId={form.workplaceId}
          onSelect={form.selectWorkplace}
          canQuickFill={form.hasUsualSchedule}
          onQuickFill={form.applyUsualSchedule}
        />

        <ShiftDateField value={form.date} onChange={form.setDate} />

        <View style={styles.row}>
          <View style={styles.flex}>
            <FormField label="Start Time">
              <TimeField
                value={form.startTime}
                onChange={form.setStartTime}
                accessibilityLabel="Start time"
              />
            </FormField>
          </View>
          <View style={styles.flex}>
            <FormField label="End Time">
              <TimeField
                value={form.endTime}
                onChange={form.setEndTime}
                accessibilityLabel="End time"
              />
            </FormField>
          </View>
        </View>

        {form.isOvernight ? (
          <View style={[styles.overnight, { backgroundColor: theme.accentSoft }]}>
            <Clock color={theme.accent} size={14} />
            <Text style={[styles.overnightText, { color: theme.accent }]}>
              Shift extends past midnight (+24h overnight shift)
            </Text>
          </View>
        ) : null}

        <BreakPicker value={form.breakMinutes} onChange={form.setBreakMinutes} />

        {/* Pay rate, saved with the shift so later rate changes don't alter it */}
        <FormField label="Hourly Rate" hint="Saved with this shift">
          <MoneyInput value={form.rateInput} onChangeText={form.setRateInput} />
        </FormField>

        <ShiftSummary
          workedMinutes={form.workedMinutes}
          earnings={form.hourlyRate > 0 ? form.estimatedEarnings : null}
        />

        <PaymentStatusPicker
          status={form.paymentStatus}
          onStatusChange={form.setPaymentStatus}
          paidDate={form.paidDate}
          onPaidDateChange={form.setPaidDate}
        />

        <FormField label="Notes (Optional)">
          <TextInput
            value={form.notes}
            onChangeText={form.setNotes}
            placeholder="e.g. Closing duties, cash register #2"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
            ]}
          />
        </FormField>

        <Pressable
          accessibilityRole="button"
          onPress={form.submit}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}>
          <Check color={theme.onAccent} size={16} />
          <Text style={[styles.saveText, { color: theme.onAccent }]}>Save Shift</Text>
        </Pressable>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  overnight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  overnightText: {
    flex: 1,
    fontSize: FontSize.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  saveText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});

export const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <AddShiftForm {...props} /> : null;
