import { PaymentStatus, Shift, Workplace } from '@/types';
import { calculateWorkedMinutes, changesPay } from '@/utils/timeCalculations';

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const BREAK_OPTIONS = [0, 15, 30, 45, 60];

/** True for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30). */
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

/** True when `date` is after `today` (both YYYY-MM-DD, which sort as text). */
export const isFutureDate = (date: string, today: string) => date > today;

/** Shows a rate in the input, leaving it blank when there isn't one. */
export function rateToInput(rate?: number): string {
  return rate ? rate.toFixed(2) : '';
}

/** The rate typed into the input. Some locales' decimal keypads produce "18,5"; bad or negative is 0. */
export function parseRate(input: string): number {
  const parsed = parseFloat(input.replace(',', '.'));
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export interface ShiftFormValues {
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
export function initialFormValues(
  {
    initialShift,
    defaultWorkplaceId,
    workplaces,
  }: {
    initialShift?: Shift | null;
    defaultWorkplaceId?: string;
    workplaces: Workplace[];
  },
  todayStr: string,
): ShiftFormValues {
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

export interface WorkedTime {
  workedMinutes: number;
  isOvernight: boolean;
  error?: string;
}

/** Worked minutes between two HH:mm times less the break (a shift can run past midnight). */
export function computeWorkedTime(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): WorkedTime {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return {
      workedMinutes: 0,
      isOvernight: false,
      error: 'Enter times as HH:mm (24-hour), e.g. 16:00',
    };
  }
  return calculateWorkedMinutes(startTime, endTime, breakMinutes);
}

/** The first problem with the form, as a message to show, or null when it can be saved. */
export function validateShiftForm(
  values: Pick<
    ShiftFormValues,
    'workplaceId' | 'date' | 'startTime' | 'endTime' | 'paymentStatus' | 'paidDate'
  >,
  worked: WorkedTime,
): string | null {
  if (!values.workplaceId) return 'Please select a workplace';
  if (!isValidDate(values.date)) return 'Please enter a valid shift date (YYYY-MM-DD)';
  if (!values.startTime || !values.endTime) return 'Start time and end time are required';
  if (worked.error) return worked.error;
  if (worked.workedMinutes <= 0) return 'Worked time must be greater than 0 minutes';
  if (values.paymentStatus === 'paid' && !isValidDate(values.paidDate)) {
    return 'Please enter a valid paid date (YYYY-MM-DD)';
  }
  return null;
}

/** True when the edit changes what an already-paid shift should have earned. */
export function paidShiftPayChanged(
  initialShift: Shift | null | undefined,
  paymentStatus: PaymentStatus,
  workplaces: Workplace[],
  next: { workplaceId: string; workedMinutes: number; hourlyRate: number },
): boolean {
  if (initialShift?.paymentStatus !== 'paid' || paymentStatus !== 'paid') return false;
  return changesPay(
    {
      workplaceId: initialShift.workplaceId,
      workedMinutes: initialShift.workedMinutes,
      hourlyRate:
        initialShift.hourlyRate ??
        workplaces.find((w) => w.id === initialShift.workplaceId)?.hourlyRate ??
        0,
    },
    next,
  );
}
