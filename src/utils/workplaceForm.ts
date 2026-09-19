import { UsualScheduleDay, Workplace } from '@/types';
import { TIME_PATTERN } from '@/utils/shiftForm';
import { workplaceColor } from '@/utils/workplaceColor';

/** Earthy tones that sit well on both the light and dark backgrounds. */
export const PRESET_COLORS = ['#3E6B99', '#5F8A5B', '#C9892B', '#8A5A83', '#B5533C', '#3F8A87'];

export const DEFAULT_SCHEDULE: UsualScheduleDay[] = [
  { dayOfWeek: 1, dayName: 'Monday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 2, dayName: 'Tuesday', startTime: '16:00', endTime: '21:00', active: false },
  { dayOfWeek: 3, dayName: 'Wednesday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 4, dayName: 'Thursday', startTime: '16:00', endTime: '21:00', active: false },
  { dayOfWeek: 5, dayName: 'Friday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '16:00', active: false },
  { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '16:00', active: false },
];

export interface WorkplaceFormValues {
  name: string;
  address: string;
  hourlyRate: string;
  notes: string;
  color: string;
  schedule: UsualScheduleDay[];
}

const rateText = (rate?: number) => (rate ? rate.toFixed(2) : '');

/** Starting values: the workplace being edited, or blanks with the default rate for a new one. */
export function initialWorkplaceValues(
  initialWorkplace?: Workplace | null,
  defaultHourlyRate?: number,
): WorkplaceFormValues {
  return {
    name: initialWorkplace?.name ?? '',
    address: initialWorkplace?.address ?? '',
    hourlyRate: rateText(initialWorkplace ? initialWorkplace.hourlyRate : defaultHourlyRate),
    notes: initialWorkplace?.notes ?? '',
    color: workplaceColor(initialWorkplace?.color, PRESET_COLORS[0]),
    schedule: initialWorkplace?.usualSchedule ?? DEFAULT_SCHEDULE,
  };
}

export type WorkplaceValidation =
  | { ok: false; error: string }
  | { ok: true; rate: number | undefined };

/** The first problem with the form, or the parsed hourly rate (undefined when left blank). */
export function validateWorkplaceForm({
  name,
  hourlyRate,
  schedule,
}: Pick<WorkplaceFormValues, 'name' | 'hourlyRate' | 'schedule'>): WorkplaceValidation {
  if (!name.trim()) return { ok: false, error: 'Workplace name is required' };

  // Some locales' decimal keypads produce "18,5"
  const normalized = hourlyRate.trim().replace(',', '.');
  const rate = normalized ? parseFloat(normalized) : undefined;
  if (normalized && (rate === undefined || Number.isNaN(rate) || rate < 0)) {
    return { ok: false, error: 'Please enter a valid hourly rate' };
  }

  const badDay = schedule.find(
    (day) => day.active && !(TIME_PATTERN.test(day.startTime) && TIME_PATTERN.test(day.endTime)),
  );
  if (badDay) {
    return { ok: false, error: `Enter ${badDay.dayName}'s times as HH:mm (24-hour), e.g. 16:00` };
  }

  return { ok: true, rate };
}

/** A copy of the schedule with one day switched on or off. */
export function toggleScheduleDay(schedule: UsualScheduleDay[], index: number) {
  return schedule.map((day, i) => (i === index ? { ...day, active: !day.active } : day));
}

/** A copy of the schedule with one day's start or end time changed. */
export function setScheduleTime(
  schedule: UsualScheduleDay[],
  index: number,
  field: 'startTime' | 'endTime',
  value: string,
) {
  return schedule.map((day, i) => (i === index ? { ...day, [field]: value } : day));
}
