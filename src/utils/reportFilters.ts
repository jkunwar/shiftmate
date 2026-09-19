import { Shift, UserPreferences, Workplace } from '@/types';
import { DateRange, formatRange, getMonthRange, getWeekRange } from '@/utils/dateRanges';
import { getPayPeriod, PayPeriodSetting } from '@/utils/payPeriods';
import { shiftEarnings } from '@/utils/timeCalculations';

export type DatePreset =
  | 'this-week'
  | 'last-week'
  | 'this-pay-period'
  | 'last-pay-period'
  | 'this-month'
  | 'last-month'
  | 'custom';
export type PaymentFilter = 'all' | 'paid' | 'unpaid';

/** A report's date range plus the label shown for it (and printed on exports). */
export interface ReportRange extends DateRange {
  label: string;
}

/**
 * The preset a report shows: the user's choice, or by default this pay period when pay periods are
 * set up and this week when they are not. A pay-period choice is dropped if pay periods go away.
 */
export function effectiveDatePreset(
  chosen: DatePreset | null,
  payPeriodsAvailable: boolean,
): DatePreset {
  const fallback: DatePreset = payPeriodsAvailable ? 'this-pay-period' : 'this-week';
  if (!chosen) return fallback;
  if (!payPeriodsAvailable && chosen.endsWith('pay-period')) return fallback;
  return chosen;
}

/** The date boundaries for a preset, relative to `today`. */
export function resolveDateRange(
  preset: DatePreset,
  today: string,
  weekStartsOn: UserPreferences['weekStartsOn'],
  custom: DateRange,
  payPeriod?: PayPeriodSetting,
): ReportRange {
  switch (preset) {
    case 'this-pay-period':
    case 'last-pay-period': {
      const range = payPeriod && getPayPeriod(today, payPeriod, preset === 'this-pay-period' ? 0 : -1);
      // Not set up (any more): fall back to the month so the report still has a range
      if (!range) return resolveDateRange('this-month', today, weekStartsOn, custom);
      const name = preset === 'this-pay-period' ? 'This Pay Period' : 'Last Pay Period';
      return { ...range, label: `${name} (${formatRange(range)})` };
    }
    case 'this-week': {
      const range = getWeekRange(today, weekStartsOn, 0);
      return { ...range, label: `This Week (${formatRange(range)})` };
    }
    case 'last-week': {
      const range = getWeekRange(today, weekStartsOn, -1);
      return { ...range, label: `Last Week (${formatRange(range)})` };
    }
    case 'last-month': {
      const { start, end, label } = getMonthRange(today, -1);
      return { start, end, label };
    }
    case 'custom':
      return { start: custom.start, end: custom.end, label: `${custom.start} to ${custom.end}` };
    case 'this-month':
    default: {
      const { start, end, label } = getMonthRange(today, 0);
      return { start, end, label };
    }
  }
}

export interface ReportFilter {
  range: DateRange;
  /** A workplace id, or 'all'. */
  workplaceId: string;
  payment: PaymentFilter;
}

/** The shifts matching the filter, newest first. */
export function filterShifts(shifts: Shift[], { range, workplaceId, payment }: ReportFilter): Shift[] {
  return shifts
    .filter((shift) => {
      if (shift.date < range.start || shift.date > range.end) return false;
      if (workplaceId !== 'all' && shift.workplaceId !== workplaceId) return false;
      if (payment !== 'all' && shift.paymentStatus !== payment) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Total worked minutes and estimated earnings for a list of shifts. */
export function summarizeShifts(shifts: Shift[], workplaces: Workplace[]) {
  return shifts.reduce(
    (total, shift) => ({
      minutes: total.minutes + shift.workedMinutes,
      earnings:
        total.earnings +
        shiftEarnings(
          shift,
          workplaces.find((w) => w.id === shift.workplaceId),
        ),
    }),
    { minutes: 0, earnings: 0 },
  );
}
