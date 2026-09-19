import { AlertCircle, Check, Clock, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/common/BottomSheet';
import { DateField, TimeField } from '@/components/common/DateTimeFields';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { PaymentStatus, Shift, Workplace } from '@/types';
import {
  calculateWorkedMinutes,
  changesPay,
  findOverlappingShift,
  formatDate,
  formatDuration,
  toLocalDateString,
} from '@/utils/timeCalculations';
import { FontSize } from '@/constants/theme';
import { workplaceColor } from '@/utils/workplaceColor';

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

const BREAK_OPTIONS = [0, 15, 30, 45, 60];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Shows a rate in the input, leaving it blank when there isn't one. */
function rateToInput(rate?: number): string {
  return rate ? rate.toFixed(2) : '';
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

interface FormValues {
  workplaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  paymentStatus: PaymentStatus;
  paidDate: string;
  notes: string;
  rateInput: string;
}

/** Starting values: the shift being edited, or defaults (with the workplace's usual schedule) for a new one. */
function initialFormValues(
  {
    initialShift,
    defaultWorkplaceId,
    workplaces,
  }: Pick<AddShiftModalProps, 'initialShift' | 'defaultWorkplaceId' | 'workplaces'>,
  todayStr: string,
): FormValues {
  if (initialShift) {
    return {
      workplaceId: initialShift.workplaceId,
      date: initialShift.date,
      startTime: initialShift.startTime,
      endTime: initialShift.endTime,
      breakMinutes: initialShift.breakMinutes || 0,
      paymentStatus: initialShift.paymentStatus,
      paidDate: initialShift.paidDate || todayStr,
      notes: initialShift.notes || '',
      rateInput: rateToInput(
        initialShift.hourlyRate ??
          workplaces.find((w) => w.id === initialShift.workplaceId)?.hourlyRate,
      ),
    };
  }

  const workplaceId = defaultWorkplaceId || (workplaces.length > 0 ? workplaces[0].id : '');
  const workplace = workplaces.find((w) => w.id === workplaceId);
  const activeSchedule = workplace?.usualSchedule?.find((s) => s.active);
  return {
    workplaceId,
    date: todayStr,
    startTime: activeSchedule?.startTime ?? '16:00',
    endTime: activeSchedule?.endTime ?? '21:00',
    breakMinutes: 0,
    paymentStatus: 'unpaid',
    paidDate: todayStr,
    notes: '',
    rateInput: rateToInput(workplace?.hourlyRate),
  };
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
  const { money, time, currency } = useFormat();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const todayStr = toLocalDateString(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayDate);

  // The form is mounted fresh each time the modal opens, so its state starts from these values
  const [initial] = useState(() =>
    initialFormValues({ initialShift, defaultWorkplaceId, workplaces }, todayStr),
  );

  const [workplaceId, setWorkplaceId] = useState<string>(initial.workplaceId);
  const [date, setDate] = useState<string>(initial.date);
  const [startTime, setStartTime] = useState<string>(initial.startTime);
  const [endTime, setEndTime] = useState<string>(initial.endTime);
  const [breakMinutes, setBreakMinutes] = useState<number>(initial.breakMinutes);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initial.paymentStatus);
  const [paidDate, setPaidDate] = useState<string>(initial.paidDate);
  const [notes, setNotes] = useState<string>(initial.notes);
  // Pay rate saved with this shift; starts from the workplace's rate and can be changed per shift
  const [rateInput, setRateInput] = useState<string>(initial.rateInput);
  const [errorMsg, setErrorMsg] = useState<string>('');

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

    const save = () => {
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
        // Editing must not wipe the amount that was recorded when the shift was marked paid
        actualPaidAmount: paymentStatus === 'paid' ? initialShift?.actualPaidAmount : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onClose();
    };

    // Two shifts at the same time is usually a slip, but sometimes intended, so ask instead of blocking
    const saveUnlessOverlapping = () => {
      const overlapping = findOverlappingShift(
        { date, startTime, endTime },
        existingShifts,
        initialShift?.id,
      );
      if (overlapping && Platform.OS !== 'web') {
        const where =
          workplaces.find((w) => w.id === overlapping.workplaceId)?.name ?? 'another shift';
        Alert.alert(
          'Overlapping shift',
          `This overlaps ${where} (${time(overlapping.startTime)} – ${time(overlapping.endTime)}) on ${formatDate(overlapping.date, 'medium')}. Save it anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save Anyway', onPress: save },
          ],
        );
        return;
      }
      save();
    };

    // A paid shift whose hours, rate or workplace change no longer matches what was paid
    if (
      initialShift?.paymentStatus === 'paid' &&
      paymentStatus === 'paid' &&
      Platform.OS !== 'web' &&
      changesPay(
        {
          workplaceId: initialShift.workplaceId,
          workedMinutes: initialShift.workedMinutes,
          hourlyRate:
            initialShift.hourlyRate ??
            workplaces.find((w) => w.id === initialShift.workplaceId)?.hourlyRate ??
            0,
        },
        { workplaceId, workedMinutes, hourlyRate },
      )
    ) {
      Alert.alert(
        'Change a paid shift?',
        'This shift is marked paid. Changing its hours, rate or workplace updates the estimate, but the amount you received stays as it was.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Changes', onPress: saveUnlessOverlapping },
        ],
      );
      return;
    }

    saveUnlessOverlapping();
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
    <BottomSheet onClose={onClose}>
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
        {initialShift?.paymentStatus === 'paid' ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={[styles.bannerText, { color: theme.textSecondary }]}>
              This shift is marked paid. Changing its hours, rate or workplace won&apos;t change the amount
              you received.
            </Text>
          </View>
        ) : null}

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
                  <View style={[styles.dot, { backgroundColor: workplaceColor(wp.color, theme.accent) }]} />
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
                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                    onPress={() => setDate(value)}
                    style={[styles.quickDate, selected && { backgroundColor: theme.accentSoft }]}>
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
            <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>{currency}</Text>
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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
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
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
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
    fontSize: FontSize.xs,
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
    fontSize: FontSize.sm,
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
    fontSize: FontSize.xs,
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
    fontSize: FontSize.xs,
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
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  earnings: {
    alignItems: 'flex-end',
  },
  earningsValue: {
    fontSize: FontSize.md,
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
    fontSize: FontSize.xs,
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
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  amountWrap: {
    justifyContent: 'center',
  },
  currencySymbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: FontSize.sm,
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
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});

export const AddShiftModal: React.FC<AddShiftModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <AddShiftForm {...props} /> : null;
