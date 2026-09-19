import { UserPreferences } from '@/types';
import { addDays, formatDate, toLocalDateString, weekStartOf } from '@/utils/timeCalculations';

export { addDays, weekStartOf };

type WeekStart = UserPreferences['weekStartsOn'];

export interface DateRange {
  /** YYYY-MM-DD, inclusive */
  start: string;
  /** YYYY-MM-DD, inclusive */
  end: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const monthName = (monthIndex: number) => MONTH_NAMES[monthIndex] ?? '';

function parts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

/** The week containing `today`, moved by `offsetWeeks` (-1 = last week). */
export function getWeekRange(today: string, weekStartsOn: WeekStart, offsetWeeks = 0): DateRange {
  const start = addDays(weekStartOf(today, weekStartsOn), offsetWeeks * 7);
  return { start, end: addDays(start, 6) };
}

/** The calendar month containing `today`, moved by `offsetMonths` (-1 = last month). */
export function getMonthRange(today: string, offsetMonths = 0): DateRange & { monthKey: string; label: string } {
  const { year, month } = parts(today);
  const first = new Date(year, month - 1 + offsetMonths, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  return {
    start: toLocalDateString(first),
    end: toLocalDateString(last),
    monthKey: toLocalDateString(first).slice(0, 7),
    label: `${monthName(first.getMonth())} ${first.getFullYear()}`,
  };
}

/** "Sep 14 – Sep 20" */
export function formatRange({ start, end }: DateRange): string {
  return `${formatDate(start, 'short')} – ${formatDate(end, 'short')}`;
}
