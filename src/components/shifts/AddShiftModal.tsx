import { AlertCircle, Check, Clock, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField, TimeField } from '@/components/common/DateTimeFields';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { PaymentStatus, Shift, Workplace } from '@/types';
import { calculateWorkedMinutes, formatDuration } from '@/utils/timeCalculations';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: Omit<Shift, 'id'>) => void;
  workplaces: Workplace[];
  defaultWorkplaceId?: string;
  initialShift?: Shift | null; // For editing existing shift
}

const BREAK_OPTIONS = [0, 15, 30, 45, 60];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Formats a Date as YYYY-MM-DD in the device's local timezone (toISOString would use UTC). */
function toLocalDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Shows a rate in the input, leaving it blank when there isn't one. */
function rateToInput(rate?: number): string {
  return rate ? rate.toFixed(2) : '';
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workplaces,
  defaultWorkplaceId,
  initialShift,
}) => {
  const theme = useTheme();
  const { money, currency } = useFormat();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const todayStr = toLocalDateString(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayDate);

  const [workplaceId, setWorkplaceId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paidDate, setPaidDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');
  // Pay rate saved with this shift; starts from the workplace's rate and can be changed per shift
  const [rateInput, setRateInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Synchronize on open or change of initialShift
  useEffect(() => {
    if (isOpen) {
      if (initialShift) {
        setWorkplaceId(initialShift.workplaceId);
        setDate(initialShift.date);
        setStartTime(initialShift.startTime);
        setEndTime(initialShift.endTime);
        setBreakMinutes(initialShift.breakMinutes || 0);
        setPaymentStatus(initialShift.paymentStatus);
        setPaidDate(initialShift.paidDate || todayStr);
        setNotes(initialShift.notes || '');
        setRateInput(
          rateToInput(
            initialShift.hourlyRate ??
              workplaces.find((w) => w.id === initialShift.workplaceId)?.hourlyRate,
          ),
        );
      } else {
        // New shift: Pre-select workplace
        const targetWpId = defaultWorkplaceId || (workplaces.length > 0 ? workplaces[0].id : '');
        setWorkplaceId(targetWpId);
        setDate(todayStr);
        setRateInput(rateToInput(workplaces.find((w) => w.id === targetWpId)?.hourlyRate));

        // Check if the selected workplace has a usual schedule
        const wp = workplaces.find((w) => w.id === targetWpId);
        const activeSchedule = wp?.usualSchedule?.find((s) => s.active);
        setStartTime(activeSchedule?.startTime ?? '16:00');
        setEndTime(activeSchedule?.endTime ?? '21:00');

        setBreakMinutes(0);
        setPaymentStatus('unpaid');
        setPaidDate(todayStr);
        setNotes('');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialShift, defaultWorkplaceId, workplaces, todayStr]);

  if (!isOpen) return null;

  const currentWorkplace = workplaces.find((w) => w.id === workplaceId);
  // Some locales' decimal keypads produce "18,5"
  const parsedRate = parseFloat(rateInput.replace(',', '.'));
  const hourlyRate = Number.isNaN(parsedRate) || parsedRate < 0 ? 0 : parsedRate;
  const activeSchedule = currentWorkplace?.usualSchedule?.find((s) => s.active);

  // Real-time calculation
  const timesValid = TIME_PATTERN.test(startTime) && TIME_PATTERN.test(endTime);
  const calcResult = timesValid
    ? calculateWorkedMinutes(startTime, endTime, breakMinutes)
    : { workedMinutes: 0, isOvernight: false, error: 'Enter times as HH:mm (24-hour), e.g. 16:00' };
  const workedMinutes = calcResult.workedMinutes;
  const isOvernight = calcResult.isOvernight;
  const estimatedEarnings = (workedMinutes / 60) * hourlyRate;

  const handleApplyUsualSchedule = () => {
    if (!activeSchedule) return;
    setStartTime(activeSchedule.startTime);
    setEndTime(activeSchedule.endTime);
  };

  const handleSubmit = () => {
    if (!workplaceId) {
      setErrorMsg('Please select a workplace');
      return;
    }
    if (!isValidDate(date)) {
      setErrorMsg('Please enter a valid shift date (YYYY-MM-DD)');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg('Start time and end time are required');
      return;
    }
    if (calcResult.error) {
      setErrorMsg(calcResult.error);
      return;
    }
    if (workedMinutes <= 0) {
      setErrorMsg('Worked time must be greater than 0 minutes');
      return;
    }
    if (paymentStatus === 'paid' && !isValidDate(paidDate)) {
      setErrorMsg('Please enter a valid paid date (YYYY-MM-DD)');
      return;
    }

    onSave({
      workplaceId,
      date,
      startTime,
      endTime,
      breakMinutes,
      workedMinutes,
      hourlyRate,
      paymentStatus,
      paidDate: paymentStatus === 'paid' ? paidDate : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    onClose();
  };

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  const chipStyle = (selected: boolean) => ({
    backgroundColor: selected ? theme.accentSoft : theme.surface,
    borderColor: selected ? theme.accent : theme.border,
  });

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.backdrop}>
          {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {initialShift ? 'Edit Shift' : 'Add Shift'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Record worked hours in seconds
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

            {/* Form body */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
              {errorMsg ? (
                <View
                  style={[
                    styles.banner,
                    { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` },
                  ]}>
                  <AlertCircle color={theme.danger} size={16} />
                  <Text style={[styles.bannerText, { color: theme.danger }]}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Workplace selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Workplace</Text>
                <View style={styles.chipWrap}>
                  {workplaces.map((wp) => {
                    const selected = wp.id === workplaceId;
                    return (
                      <Pressable
                        key={wp.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setWorkplaceId(wp.id);
                          setRateInput(rateToInput(wp.hourlyRate));
                        }}
                        style={[styles.workplaceChip, chipStyle(selected)]}>
                        <View
                          style={[styles.dot, { backgroundColor: wp.color || theme.accent }]}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? theme.accent : theme.text },
                            selected && styles.chipTextSelected,
                          ]}>
                          {wp.name}
                          {wp.hourlyRate ? ` (${currency}${wp.hourlyRate.toFixed(2)}/hr)` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {activeSchedule ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={handleApplyUsualSchedule}
                    style={styles.quickFill}>
                    <Sparkles color={theme.accent} size={12} />
                    <Text style={[styles.quickFillText, { color: theme.accent }]}>
                      Quick fill regular schedule
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Date with quick select */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                  <View style={styles.quickDates}>
                    {(
                      [
                        ['Today', todayStr],
                        ['Yesterday', yesterdayStr],
                      ] as const
                    ).map(([label, value]) => {
                      const selected = date === value;
                      return (
                        <Pressable
                          key={label}
                          accessibilityRole="button"
                          onPress={() => setDate(value)}
                          style={[
                            styles.quickDate,
                            selected && { backgroundColor: theme.accentSoft },
                          ]}>
                          <Text
                            style={[
                              styles.quickDateText,
                              { color: selected ? theme.accent : theme.textSecondary },
                              selected && styles.chipTextSelected,
                            ]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <DateField value={date} onChange={setDate} accessibilityLabel="Shift date" />
              </View>

              {/* Start and end times */}
              <View style={styles.row}>
                <View style={[styles.field, styles.flex]}>
                  <Text style={[styles.label, { color: theme.text }]}>Start Time</Text>
                  <TimeField value={startTime} onChange={setStartTime} accessibilityLabel="Start time" />
                </View>
                <View style={[styles.field, styles.flex]}>
                  <Text style={[styles.label, { color: theme.text }]}>End Time</Text>
                  <TimeField value={endTime} onChange={setEndTime} accessibilityLabel="End time" />
                </View>
              </View>

              {isOvernight ? (
                <View style={[styles.overnight, { backgroundColor: theme.accentSoft }]}>
                  <Clock color={theme.accent} size={14} />
                  <Text style={[styles.overnightText, { color: theme.accent }]}>
                    Shift extends past midnight (+24h overnight shift)
                  </Text>
                </View>
              ) : null}

              {/* Break selection pills */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.label, { color: theme.text }]}>Unpaid Break</Text>
                  <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    {breakMinutes > 0 ? `${breakMinutes} minutes` : 'No break'}
                  </Text>
                </View>
                <View style={styles.pillRow}>
                  {BREAK_OPTIONS.map((min) => {
                    const selected = breakMinutes === min;
                    return (
                      <Pressable
                        key={min}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setBreakMinutes(min)}
                        style={[styles.pill, chipStyle(selected)]}>
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? theme.accent : theme.textSecondary },
                            selected && styles.chipTextSelected,
                          ]}>
                          {min === 0 ? 'None' : `${min}m`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Pay rate, saved with the shift so later rate changes don't alter it */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <Text style={[styles.label, { color: theme.text }]}>Hourly Rate</Text>
                  <Text style={[styles.hint, { color: theme.textSecondary }]}>Saved with this shift</Text>
                </View>
                <View style={styles.amountWrap}>
                  <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                    {currency}
                  </Text>
                  <TextInput
                    value={rateInput}
                    onChangeText={setRateInput}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.rateInput, inputStyle]}
                  />
                </View>
              </View>

              {/* Real-time calculation summary */}
              <View
                style={[
                  styles.summary,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                    Calculated Worked Time
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {formatDuration(workedMinutes)}
                  </Text>
                </View>
                {hourlyRate > 0 ? (
                  <View style={styles.earnings}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                      Est. Earnings
                    </Text>
                    <Text style={[styles.earningsValue, { color: theme.success }]}>
                      {money(estimatedEarnings)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Payment status */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Payment Status</Text>
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: paymentStatus === 'unpaid' }}
                    onPress={() => setPaymentStatus('unpaid')}
                    style={[
                      styles.statusButton,
                      styles.flex,
                      paymentStatus === 'unpaid'
                        ? { backgroundColor: theme.warningSoft, borderColor: theme.warning }
                        : { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: paymentStatus === 'unpaid' ? theme.warning : theme.textSecondary },
                      ]}>
                      ○ Unpaid
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: paymentStatus === 'paid' }}
                    onPress={() => setPaymentStatus('paid')}
                    style={[
                      styles.statusButton,
                      styles.flex,
                      paymentStatus === 'paid'
                        ? { backgroundColor: theme.successSoft, borderColor: theme.success }
                        : { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: paymentStatus === 'paid' ? theme.success : theme.textSecondary },
                      ]}>
                      ● Paid
                    </Text>
                  </Pressable>
                </View>

                {paymentStatus === 'paid' ? (
                  <View
                    style={[
                      styles.paidDateBox,
                      { backgroundColor: theme.successSoft, borderColor: `${theme.success}55` },
                    ]}>
                    <Text style={[styles.paidDateLabel, { color: theme.success }]}>Paid Date</Text>
                    <DateField value={paidDate} onChange={setPaidDate} accessibilityLabel="Paid date" />
                  </View>
                ) : null}
              </View>

              {/* Notes (optional) */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Closing duties, cash register #2"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, inputStyle]}
                />
              </View>

              {/* Submit */}
              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: pressed ? theme.accentPressed : theme.accent },
                ]}>
                <Check color={theme.onAccent} size={16} />
                <Text style={[styles.saveText, { color: theme.onAccent }]}>Save Shift</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 512,
    maxHeight: '92%',
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
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workplaceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  quickFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  quickDates: {
    flexDirection: 'row',
    gap: 6,
  },
  quickDate: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quickDateText: {
    fontSize: 12,
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
    fontSize: 11,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  earnings: {
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidDateBox: {
    marginTop: 4,
    padding: 12,
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  paidDateLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountWrap: {
    justifyContent: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  rateInput: {
    paddingLeft: 30,
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
    fontSize: 14,
    fontWeight: '600',
  },
});
