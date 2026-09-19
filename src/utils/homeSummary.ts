import { Shift, Workplace } from '@/types';
import { DateRange } from '@/utils/dateRanges';
import { shiftEarnings } from '@/utils/timeCalculations';

export interface WorkplaceWeekItem {
  workplace: Workplace;
  minutes: number;
  earnings: number;
  shiftsCount: number;
}

export interface HomeSummary {
  weekShifts: Shift[];
  weekMinutes: number;
  weekEarnings: number;
  /** Workplaces with at least one worked minute in the week. */
  breakdown: WorkplaceWeekItem[];
  unpaidCount: number;
  unpaidMinutes: number;
  unpaidAmount: number;
}

const earningsOf = (shift: Shift, workplaces: Workplace[]) =>
  shiftEarnings(shift, workplaces.find((w) => w.id === shift.workplaceId));

const sum = <T>(items: T[], value: (item: T) => number) =>
  items.reduce((total, item) => total + value(item), 0);

/** Everything the Home screen shows about the current week and about unpaid work overall. */
export function buildHomeSummary(
  shifts: Shift[],
  workplaces: Workplace[],
  week: DateRange,
): HomeSummary {
  const weekShifts = shifts.filter((s) => s.date >= week.start && s.date <= week.end);
  const unpaid = shifts.filter((s) => s.paymentStatus === 'unpaid');

  const breakdown = workplaces
    .map((workplace) => {
      const own = weekShifts.filter((s) => s.workplaceId === workplace.id);
      return {
        workplace,
        minutes: sum(own, (s) => s.workedMinutes),
        earnings: sum(own, (s) => shiftEarnings(s, workplace)),
        shiftsCount: own.length,
      };
    })
    .filter((item) => item.minutes > 0);

  return {
    weekShifts,
    weekMinutes: sum(weekShifts, (s) => s.workedMinutes),
    weekEarnings: sum(weekShifts, (s) => earningsOf(s, workplaces)),
    breakdown,
    unpaidCount: unpaid.length,
    unpaidMinutes: sum(unpaid, (s) => s.workedMinutes),
    unpaidAmount: sum(unpaid, (s) => earningsOf(s, workplaces)),
  };
}

/** The latest shifts first: by date, then by start time. */
export function pickRecentShifts(shifts: Shift[], limit = 3): Shift[] {
  return [...shifts]
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
    .slice(0, limit);
}
