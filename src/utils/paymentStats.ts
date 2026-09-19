import { Shift, Workplace } from '@/types';
import { shiftEarnings } from '@/utils/timeCalculations';

export type StatusFilter = 'unpaid' | 'paid' | 'all';

export interface PaymentStats {
  totalMinutes: number;
  unpaidMinutes: number;
  unpaidEarnings: number;
  paidMinutes: number;
  paidEarnings: number;
  unpaidCount: number;
  paidCount: number;
}

/** Hours, estimated earnings and shift counts split by payment status. */
export function summarizePayments(shifts: Shift[], workplaces: Workplace[]): PaymentStats {
  const stats: PaymentStats = {
    totalMinutes: 0,
    unpaidMinutes: 0,
    unpaidEarnings: 0,
    paidMinutes: 0,
    paidEarnings: 0,
    unpaidCount: 0,
    paidCount: 0,
  };

  for (const shift of shifts) {
    const earnings = shiftEarnings(
      shift,
      workplaces.find((w) => w.id === shift.workplaceId),
    );
    stats.totalMinutes += shift.workedMinutes;

    if (shift.paymentStatus === 'unpaid') {
      stats.unpaidMinutes += shift.workedMinutes;
      stats.unpaidEarnings += earnings;
      stats.unpaidCount += 1;
    } else {
      stats.paidMinutes += shift.workedMinutes;
      stats.paidEarnings += earnings;
      stats.paidCount += 1;
    }
  }

  return stats;
}

/** Shifts matching the status and workplace ('all' for either), newest first. */
export function filterPaymentShifts(
  shifts: Shift[],
  { status, workplaceId }: { status: StatusFilter; workplaceId: string },
): Shift[] {
  return shifts
    .filter((shift) => {
      if (status !== 'all' && shift.paymentStatus !== status) return false;
      if (workplaceId !== 'all' && shift.workplaceId !== workplaceId) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The amount typed into the "received" box, or undefined when it isn't a number. */
export function parseReceivedAmount(input: string): number | undefined {
  const parsed = parseFloat(input.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** What the "received" box starts with: the expected amount, or empty when there is none. */
export function initialReceivedInput(expected: number): string {
  return expected > 0 ? expected.toFixed(2) : '';
}

export const isValidPaidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
