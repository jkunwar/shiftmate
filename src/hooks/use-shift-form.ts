import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useFormat } from '@/hooks/use-format';
import { PaymentStatus, Shift, Workplace } from '@/types';
import {
  computeWorkedTime,
  initialFormValues,
  isFutureDate,
  paidShiftPayChanged,
  parseRate,
  rateToInput,
  validateShiftForm,
} from '@/utils/shiftForm';
import { findOverlappingShift, formatDate, toLocalDateString } from '@/utils/timeCalculations';

interface ShiftFormOptions {
  workplaces: Workplace[];
  defaultWorkplaceId?: string;
  /** The shift being edited; omit for a new one. */
  initialShift?: Shift | null;
  /** Used to warn when the shift overlaps one that is already logged. */
  existingShifts: Shift[];
  onSave: (shift: Omit<Shift, 'id'>) => void;
  onClose: () => void;
}

/**
 * The add/edit shift form: its fields, the live worked-time calculation, validation, and the
 * confirmations before saving (changing a paid shift, overlapping another shift).
 * Mount it fresh each time the form opens, so it starts from the right values.
 */
export function useShiftForm({
  workplaces,
  defaultWorkplaceId,
  initialShift,
  existingShifts,
  onSave,
  onClose,
}: ShiftFormOptions) {
  const { time } = useFormat();

  const [initial] = useState(() =>
    initialFormValues({ initialShift, defaultWorkplaceId, workplaces }, toLocalDateString()),
  );

  const [workplaceId, setWorkplaceId] = useState(initial.workplaceId);
  const [date, setDate] = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [breakMinutes, setBreakMinutes] = useState(initial.breakMinutes);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initial.paymentStatus);
  const [paidDate, setPaidDate] = useState(initial.paidDate);
  const [notes, setNotes] = useState(initial.notes);
  // Pay rate saved with this shift; starts from the workplace's rate and can be changed per shift
  const [rateInput, setRateInput] = useState(initial.rateInput);
  const [errorMsg, setErrorMsg] = useState('');

  const currentWorkplace = workplaces.find((w) => w.id === workplaceId);
  const activeSchedule = currentWorkplace?.usualSchedule?.find((s) => s.active);
  const hourlyRate = parseRate(rateInput);

  // Real-time calculation
  const worked = computeWorkedTime(startTime, endTime, breakMinutes);
  const estimatedEarnings = (worked.workedMinutes / 60) * hourlyRate;

  const selectWorkplace = (workplace: Workplace) => {
    setWorkplaceId(workplace.id);
    setRateInput(rateToInput(workplace.hourlyRate));
  };

  const applyUsualSchedule = () => {
    if (!activeSchedule) return;
    setStartTime(activeSchedule.startTime);
    setEndTime(activeSchedule.endTime);
  };

  const submit = () => {
    const problem = validateShiftForm(
      { workplaceId, date, startTime, endTime, paymentStatus, paidDate },
      worked,
    );
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    const save = () => {
      onSave({
        workplaceId,
        date,
        startTime,
        endTime,
        breakMinutes,
        workedMinutes: worked.workedMinutes,
        hourlyRate,
        paymentStatus,
        paidDate: paymentStatus === 'paid' ? paidDate : undefined,
        // Editing must not wipe the amount that was recorded when the shift was marked paid
        actualPaidAmount: paymentStatus === 'paid' ? initialShift?.actualPaidAmount : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      onClose();
    };

    // Things that are usually a slip but sometimes intended, so they are asked about instead of
    // blocked. Each answer of "yes" moves on to the next question, then the save.
    const questions: { title: string; message: string; confirmLabel: string }[] = [];

    // A shift that hasn't happened yet would count toward hours and the unpaid balance right away.
    // An existing future shift is only asked about again if its date was changed.
    if (isFutureDate(date, toLocalDateString()) && initialShift?.date !== date) {
      questions.push({
        title: 'Shift is in the future',
        message: `${formatDate(date, 'medium')} hasn't happened yet. The shift will count toward your hours and unpaid balance right away. Save it anyway?`,
        confirmLabel: 'Save Anyway',
      });
    }

    // A paid shift whose hours, rate or workplace change no longer matches what was paid
    if (
      paidShiftPayChanged(initialShift, paymentStatus, workplaces, {
        workplaceId,
        workedMinutes: worked.workedMinutes,
        hourlyRate,
      })
    ) {
      questions.push({
        title: 'Change a paid shift?',
        message:
          'This shift is marked paid. Changing its hours, rate or workplace updates the estimate, but the amount you received stays as it was.',
        confirmLabel: 'Save Changes',
      });
    }

    const overlapping = findOverlappingShift(
      { date, startTime, endTime },
      existingShifts,
      initialShift?.id,
    );
    if (overlapping) {
      const where =
        workplaces.find((w) => w.id === overlapping.workplaceId)?.name ?? 'another shift';
      questions.push({
        title: 'Overlapping shift',
        message: `This overlaps ${where} (${time(overlapping.startTime)} – ${time(overlapping.endTime)}) on ${formatDate(overlapping.date, 'medium')}. Save it anyway?`,
        confirmLabel: 'Save Anyway',
      });
    }

    const ask = (index: number) => {
      const question = questions[index];
      if (!question || Platform.OS === 'web') {
        save();
        return;
      }
      Alert.alert(question.title, question.message, [
        { text: 'Cancel', style: 'cancel' },
        { text: question.confirmLabel, onPress: () => ask(index + 1) },
      ]);
    };
    ask(0);
  };

  return {
    // values and setters
    workplaceId,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    breakMinutes,
    setBreakMinutes,
    paymentStatus,
    setPaymentStatus,
    paidDate,
    setPaidDate,
    notes,
    setNotes,
    rateInput,
    setRateInput,
    // derived
    hourlyRate,
    workedMinutes: worked.workedMinutes,
    isOvernight: worked.isOvernight,
    estimatedEarnings,
    hasUsualSchedule: Boolean(activeSchedule),
    errorMsg,
    // actions
    selectWorkplace,
    applyUsualSchedule,
    submit,
  };
}
