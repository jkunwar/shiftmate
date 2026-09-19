import { shift, workplace } from '@/__fixtures__/shifts';
import {
  filterPaymentShifts,
  initialReceivedInput,
  isValidPaidDate,
  parseReceivedAmount,
  summarizePayments,
} from './paymentStats';

const cafe = workplace({ id: 'w1', hourlyRate: 20 });
const shop = workplace({ id: 'w2', hourlyRate: 10 });

const shifts = [
  shift({ id: 'a', workplaceId: 'w1', date: '2026-09-01', workedMinutes: 120, paymentStatus: 'unpaid' }),
  shift({ id: 'b', workplaceId: 'w2', date: '2026-09-03', workedMinutes: 60, paymentStatus: 'paid' }),
  shift({ id: 'c', workplaceId: 'w1', date: '2026-09-02', workedMinutes: 60, paymentStatus: 'unpaid' }),
];

describe('summarizePayments', () => {
  const stats = summarizePayments(shifts, [cafe, shop]);

  it('totals hours and counts by status', () => {
    expect(stats.totalMinutes).toBe(240);
    expect(stats.unpaidMinutes).toBe(180);
    expect(stats.paidMinutes).toBe(60);
    expect(stats.unpaidCount).toBe(2);
    expect(stats.paidCount).toBe(1);
  });

  it('totals estimated earnings by status using each workplace rate', () => {
    expect(stats.unpaidEarnings).toBeCloseTo(2 * 20 + 1 * 20);
    expect(stats.paidEarnings).toBeCloseTo(10);
  });

  it('is all zero with no shifts', () => {
    expect(summarizePayments([], [])).toEqual({
      totalMinutes: 0,
      unpaidMinutes: 0,
      unpaidEarnings: 0,
      paidMinutes: 0,
      paidEarnings: 0,
      unpaidCount: 0,
      paidCount: 0,
    });
  });
});

describe('filterPaymentShifts', () => {
  it('filters by status, newest first', () => {
    expect(filterPaymentShifts(shifts, { status: 'unpaid', workplaceId: 'all' }).map((s) => s.id)).toEqual(['c', 'a']);
    expect(filterPaymentShifts(shifts, { status: 'paid', workplaceId: 'all' }).map((s) => s.id)).toEqual(['b']);
    expect(filterPaymentShifts(shifts, { status: 'all', workplaceId: 'all' }).map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('filters by workplace too', () => {
    expect(filterPaymentShifts(shifts, { status: 'all', workplaceId: 'w2' }).map((s) => s.id)).toEqual(['b']);
    expect(filterPaymentShifts(shifts, { status: 'paid', workplaceId: 'w1' })).toEqual([]);
  });
});

describe('parseReceivedAmount', () => {
  it('reads numbers, accepting a decimal comma', () => {
    expect(parseReceivedAmount('120')).toBe(120);
    expect(parseReceivedAmount('99,5')).toBe(99.5);
  });

  it('returns undefined when it is not a number', () => {
    expect(parseReceivedAmount('')).toBeUndefined();
    expect(parseReceivedAmount('abc')).toBeUndefined();
  });
});

describe('initialReceivedInput', () => {
  it('starts with the expected amount to two places, or empty when there is none', () => {
    expect(initialReceivedInput(120)).toBe('120.00');
    expect(initialReceivedInput(0)).toBe('');
  });
});

describe('isValidPaidDate', () => {
  it('accepts YYYY-MM-DD only', () => {
    expect(isValidPaidDate('2026-09-19')).toBe(true);
    expect(isValidPaidDate('19/09/2026')).toBe(false);
    expect(isValidPaidDate('')).toBe(false);
  });
});
