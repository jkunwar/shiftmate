import { Shift, Workplace } from '@/types';
import { shiftEarnings } from '@/utils/timeCalculations';

export interface WorkplaceSummary {
  minutes: number;
  shiftCount: number;
  /** Hours times rate for every shift. */
  estimated: number;
  /** What paid shifts actually brought in: the amount recorded, else the estimate. */
  received: number;
  unpaidMinutes: number;
  /** Estimated earnings of shifts that haven't been paid yet. */
  unpaidAmount: number;
}

/** Totals for one workplace's shifts, for any span of time. Worked out on demand from the shifts. */
export function summarizeWorkplaceShifts(
  shifts: Shift[],
  workplace?: Pick<Workplace, 'hourlyRate'> | null,
): WorkplaceSummary {
  const totals: WorkplaceSummary = {
    minutes: 0,
    shiftCount: shifts.length,
    estimated: 0,
    received: 0,
    unpaidMinutes: 0,
    unpaidAmount: 0,
  };

  for (const shift of shifts) {
    const earnings = shiftEarnings(shift, workplace);
    totals.minutes += shift.workedMinutes;
    totals.estimated += earnings;

    if (shift.paymentStatus === 'paid') {
      totals.received += shift.actualPaidAmount ?? earnings;
    } else if (shift.paymentStatus === 'unpaid') {
      totals.unpaidMinutes += shift.workedMinutes;
      totals.unpaidAmount += earnings;
    }
  }

  return totals;
}
