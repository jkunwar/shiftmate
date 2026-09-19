import { Shift } from '@/types';

/** How many days the month has and how many blank cells come before the 1st (Sunday-first grid). */
export function monthGridShape(monthKey: string): { daysInMonth: number; leadingBlanks: number } {
  const [year, month] = monthKey.split('-').map(Number);
  return {
    daysInMonth: new Date(year, month, 0).getDate(),
    leadingBlanks: new Date(year, month - 1, 1).getDay(),
  };
}

/** YYYY-MM-DD for a day of the month. */
export const dateInMonth = (monthKey: string, day: number) =>
  `${monthKey}-${String(day).padStart(2, '0')}`;

/** The month's shifts grouped by their date. */
export function groupShiftsByDate(shifts: Shift[], monthKey: string): Map<string, Shift[]> {
  const byDate = new Map<string, Shift[]>();
  for (const shift of shifts) {
    if (!shift.date.startsWith(monthKey)) continue;
    const list = byDate.get(shift.date);
    if (list) list.push(shift);
    else byDate.set(shift.date, [shift]);
  }
  return byDate;
}

/** The day to show first: today when it is in the month, else the first shift's day, else the 1st. */
export function defaultSelectedDate(monthKey: string, today: string, shifts: Shift[]): string {
  if (today.startsWith(monthKey)) return today;
  const firstShift = shifts.find((s) => s.date.startsWith(monthKey));
  return firstShift ? firstShift.date : `${monthKey}-01`;
}
