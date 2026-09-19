import { PayFrequency } from '@/types';
import { addDays, toLocalDateString } from '@/utils/timeCalculations';
import { DateRange, formatRange } from '@/utils/dateRanges';
import { isValidDate } from '@/utils/shiftForm';

export interface PayPeriodSetting {
  frequency: PayFrequency;
  /** A day some pay period started on (YYYY-MM-DD). */
  anchor: string;
}

const parts = (date: string) => date.split('-').map(Number) as [number, number, number];
const utcDay = (date: string) => {
  const [y, m, d] = parts(date);
  return Date.UTC(y, m - 1, d) / 86_400_000;
};
const daysBetween = (from: string, to: string) => Math.round(utcDay(to) - utcDay(from));
const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate(); // month 1-12
const dateOf = (year: number, month: number, day: number) =>
  toLocalDateString(new Date(year, month - 1, day));

/** A month counted from year 0, so months can be stepped with plain arithmetic. */
const monthIndex = (year: number, month: number) => year * 12 + (month - 1);
const fromMonthIndex = (index: number) => ({ year: Math.floor(index / 12), month: (index % 12) + 1 });

/** Whether this setting describes pay periods that can be worked out. */
export const hasPayPeriods = ({ frequency, anchor }: PayPeriodSetting) =>
  frequency === 'semimonthly' ||
  frequency === 'monthly' ||
  ((frequency === 'weekly' || frequency === 'biweekly') && isValidDate(anchor));

/**
 * The pay period containing `today`, moved by `offset` periods (-1 = the one before). Null when
 * pay periods aren't set up. Weekly and bi-weekly count from the anchor date, twice a month is the
 * 1st to the 15th and the 16th to the end, and monthly runs from the anchor's day of the month
 * (or is the calendar month without an anchor).
 */
export function getPayPeriod(
  today: string,
  setting: PayPeriodSetting,
  offset = 0,
): DateRange | null {
  if (!hasPayPeriods(setting)) return null;
  const { frequency, anchor } = setting;

  if (frequency === 'weekly' || frequency === 'biweekly') {
    const length = frequency === 'weekly' ? 7 : 14;
    const index = Math.floor(daysBetween(anchor, today) / length) + offset;
    const start = addDays(anchor, index * length);
    return { start, end: addDays(start, length - 1) };
  }

  const [year, month, day] = parts(today);

  if (frequency === 'semimonthly') {
    const half = monthIndex(year, month) * 2 + (day <= 15 ? 0 : 1) + offset;
    const { year: y, month: m } = fromMonthIndex(Math.floor(half / 2));
    return half % 2 === 0
      ? { start: dateOf(y, m, 1), end: dateOf(y, m, 15) }
      : { start: dateOf(y, m, 16), end: dateOf(y, m, daysInMonth(y, m)) };
  }

  // Monthly: the start day repeats each month, clamped for short months
  const startDay = isValidDate(anchor) ? parts(anchor)[2] : 1;
  const startOf = (index: number) => {
    const { year: y, month: m } = fromMonthIndex(index);
    return dateOf(y, m, Math.min(startDay, daysInMonth(y, m)));
  };
  const thisIndex = monthIndex(year, month);
  const startedThisMonth = today >= startOf(thisIndex);
  const index = (startedThisMonth ? thisIndex : thisIndex - 1) + offset;
  return { start: startOf(index), end: addDays(startOf(index + 1), -1) };
}

/** e.g. "Sep 14 – Sep 27", or null when pay periods aren't set up. */
export function describePayPeriod(today: string, setting: PayPeriodSetting, offset = 0) {
  const range = getPayPeriod(today, setting, offset);
  return range ? formatRange(range) : null;
}

/** A sensible first anchor when someone turns a cycle on: the start of the current week or month. */
export function defaultPayAnchor(
  frequency: PayFrequency,
  today: string,
  weekStart: string,
): string {
  if (frequency === 'weekly' || frequency === 'biweekly') return weekStart;
  if (frequency === 'monthly') return `${today.slice(0, 7)}-01`;
  return '';
}
