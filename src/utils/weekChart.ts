import { Shift } from '@/types';
import { addDays } from '@/utils/timeCalculations';

export interface WeekDay {
  /** YYYY-MM-DD */
  date: string;
  /** One-letter weekday, e.g. "M" */
  initial: string;
  /** Three-letter weekday, e.g. "Mon" */
  short: string;
  minutes: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Worked minutes for each of the seven days starting at `weekStart`. */
export function buildWeekDays(shifts: Shift[], weekStart: string): WeekDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const [year, month, day] = date.split('-').map(Number);
    const name = WEEKDAYS[new Date(year, month - 1, day).getDay()];
    const minutes = shifts
      .filter((s) => s.date === date)
      .reduce((total, s) => total + s.workedMinutes, 0);
    return { date, initial: name[0], short: name.slice(0, 3), minutes };
  });
}
