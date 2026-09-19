import { shift, workplace } from '@/__fixtures__/shifts';
import { buildHomeSummary, pickRecentShifts } from './homeSummary';

const week = { start: '2026-09-14', end: '2026-09-20' };
const cafe = workplace({ id: 'w1', name: 'Cafe', hourlyRate: 20 });
const shop = workplace({ id: 'w2', name: 'Shop', hourlyRate: 10 });

describe('buildHomeSummary', () => {
  const shifts = [
    shift({ id: 'a', workplaceId: 'w1', date: '2026-09-15', workedMinutes: 120 }),
    shift({ id: 'b', workplaceId: 'w2', date: '2026-09-16', workedMinutes: 60, paymentStatus: 'paid' }),
    shift({ id: 'c', workplaceId: 'w1', date: '2026-09-08', workedMinutes: 180 }), // last week
  ];
  const summary = buildHomeSummary(shifts, [cafe, shop], week);

  it('totals only the shifts inside the week', () => {
    expect(summary.weekShifts.map((s) => s.id)).toEqual(['a', 'b']);
    expect(summary.weekMinutes).toBe(180);
    expect(summary.weekEarnings).toBeCloseTo(2 * 20 + 1 * 10);
  });

  it('breaks the week down per workplace and skips ones with no hours', () => {
    expect(summary.breakdown.map((b) => [b.workplace.id, b.minutes, b.shiftsCount])).toEqual([
      ['w1', 120, 1],
      ['w2', 60, 1],
    ]);
    expect(buildHomeSummary([], [cafe], week).breakdown).toEqual([]);
  });

  it('counts unpaid work across all weeks', () => {
    expect(summary.unpaidCount).toBe(2);
    expect(summary.unpaidMinutes).toBe(300);
    expect(summary.unpaidAmount).toBeCloseTo(2 * 20 + 3 * 20);
  });
});

describe('pickRecentShifts', () => {
  it('returns the latest shifts first, by date then start time, up to the limit', () => {
    const list = [
      shift({ id: 'old', date: '2026-09-01' }),
      shift({ id: 'late', date: '2026-09-10', startTime: '18:00' }),
      shift({ id: 'early', date: '2026-09-10', startTime: '08:00' }),
      shift({ id: 'newest', date: '2026-09-12' }),
    ];
    expect(pickRecentShifts(list, 3).map((s) => s.id)).toEqual(['newest', 'late', 'early']);
  });

  it('does not reorder the original list', () => {
    const list = [shift({ id: 'a', date: '2026-09-01' }), shift({ id: 'b', date: '2026-09-02' })];
    pickRecentShifts(list);
    expect(list.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
