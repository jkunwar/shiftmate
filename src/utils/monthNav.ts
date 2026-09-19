import { MonthGroup } from '@/types';
import { monthName } from '@/utils/dateRanges';

/** "2026-09" moved by one month, rolling over the year: shiftMonthKey('2026-12', 1) is '2027-01'. */
export function shiftMonthKey(monthKey: string, delta: -1 | 1): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + delta;
  if (month < 1) {
    month = 12;
    year -= 1;
  } else if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** "2026-09" as "September 2026". */
export function monthLabelFor(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${monthName(month - 1) || monthKey} ${year}`;
}

/** A month with no shifts, for months the grouping has nothing for. */
export function emptyMonthGroup(monthKey: string): MonthGroup {
  return {
    monthKey,
    monthLabel: monthLabelFor(monthKey),
    totalMinutes: 0,
    totalEarnings: 0,
    shiftCount: 0,
    unpaidMinutes: 0,
    unpaidEarnings: 0,
    weeks: [],
  };
}
