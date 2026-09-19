import { shift, workplace } from '@/__fixtures__/shifts';
import { effectiveDatePreset, filterShifts, resolveDateRange, summarizeShifts } from './reportFilters';

const custom = { start: '2026-09-01', end: '2026-09-05' };
const today = '2026-09-16'; // a Wednesday

describe('resolveDateRange', () => {
  it('this week starts on Monday or Sunday as chosen', () => {
    expect(resolveDateRange('this-week', today, 'monday', custom)).toMatchObject({
      start: '2026-09-14',
      end: '2026-09-20',
    });
    expect(resolveDateRange('this-week', today, 'sunday', custom)).toMatchObject({
      start: '2026-09-13',
      end: '2026-09-19',
    });
  });

  it('last week is the seven days before this week', () => {
    expect(resolveDateRange('last-week', today, 'monday', custom)).toMatchObject({
      start: '2026-09-07',
      end: '2026-09-13',
    });
  });

  it('labels weeks with their dates', () => {
    expect(resolveDateRange('this-week', today, 'monday', custom).label).toContain('This Week (');
    expect(resolveDateRange('last-week', today, 'monday', custom).label).toContain('Last Week (');
  });

  it('this and last month cover whole calendar months', () => {
    expect(resolveDateRange('this-month', today, 'monday', custom)).toMatchObject({
      start: '2026-09-01',
      end: '2026-09-30',
    });
    expect(resolveDateRange('last-month', today, 'monday', custom)).toMatchObject({
      start: '2026-08-01',
      end: '2026-08-31',
    });
  });

  it('resolves pay periods from the setting', () => {
    const pay = { frequency: 'biweekly' as const, anchor: '2026-09-04' };
    expect(resolveDateRange('this-pay-period', today, 'monday', custom, pay)).toEqual({
      start: '2026-09-04',
      end: '2026-09-17',
      label: expect.stringContaining('This Pay Period ('),
    });
    expect(resolveDateRange('last-pay-period', today, 'monday', custom, pay)).toMatchObject({
      start: '2026-08-21',
      end: '2026-09-03',
    });
  });

  it('falls back to this month when pay periods are not set up', () => {
    expect(resolveDateRange('this-pay-period', today, 'monday', custom)).toMatchObject({
      start: '2026-09-01',
      end: '2026-09-30',
    });
    const off = { frequency: 'off' as const, anchor: '' };
    expect(resolveDateRange('last-pay-period', today, 'monday', custom, off)).toMatchObject({
      start: '2026-09-01',
    });
  });

  it('uses the custom dates as given', () => {
    expect(resolveDateRange('custom', today, 'monday', custom)).toEqual({
      ...custom,
      label: '2026-09-01 to 2026-09-05',
    });
  });
});

describe('filterShifts', () => {
  const shifts = [
    shift({ id: 'a', date: '2026-09-02', workplaceId: 'w1', paymentStatus: 'paid' }),
    shift({ id: 'b', date: '2026-09-04', workplaceId: 'w2', paymentStatus: 'unpaid' }),
    shift({ id: 'c', date: '2026-09-04', workplaceId: 'w1', paymentStatus: 'unpaid' }),
    shift({ id: 'd', date: '2026-09-10', workplaceId: 'w1', paymentStatus: 'unpaid' }),
  ];
  const all = { range: custom, workplaceId: 'all', payment: 'all' as const };

  it('keeps shifts inside the range, newest first', () => {
    expect(filterShifts(shifts, all).map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('includes both ends of the range', () => {
    expect(filterShifts(shifts, { ...all, range: { start: '2026-09-02', end: '2026-09-02' } })).toHaveLength(1);
  });

  it('filters by workplace and by payment status', () => {
    expect(filterShifts(shifts, { ...all, workplaceId: 'w1' }).map((s) => s.id)).toEqual(['c', 'a']);
    expect(filterShifts(shifts, { ...all, payment: 'paid' }).map((s) => s.id)).toEqual(['a']);
    expect(filterShifts(shifts, { ...all, payment: 'unpaid', workplaceId: 'w2' }).map((s) => s.id)).toEqual(['b']);
  });

  it('does not change the list it was given', () => {
    const copy = [...shifts];
    filterShifts(shifts, all);
    expect(shifts).toEqual(copy);
  });
});

describe('summarizeShifts', () => {
  it('adds up minutes and earnings, using each shift’s workplace rate', () => {
    const result = summarizeShifts(
      [
        shift({ id: 'a', workplaceId: 'w1', workedMinutes: 120 }),
        shift({ id: 'b', workplaceId: 'w2', workedMinutes: 60 }),
      ],
      [workplace({ id: 'w1', hourlyRate: 20 }), workplace({ id: 'w2', hourlyRate: 10 })],
    );
    expect(result.minutes).toBe(180);
    expect(result.earnings).toBeCloseTo(50);
  });

  it('is zero for no shifts', () => {
    expect(summarizeShifts([], [])).toEqual({ minutes: 0, earnings: 0 });
  });
});

describe('effectiveDatePreset', () => {
  it('defaults to this pay period when set up, else this week', () => {
    expect(effectiveDatePreset(null, true)).toBe('this-pay-period');
    expect(effectiveDatePreset(null, false)).toBe('this-week');
  });

  it('keeps whatever the user picked', () => {
    expect(effectiveDatePreset('last-month', true)).toBe('last-month');
    expect(effectiveDatePreset('custom', false)).toBe('custom');
    expect(effectiveDatePreset('last-pay-period', true)).toBe('last-pay-period');
  });

  it('drops a pay-period choice once pay periods are no longer set up', () => {
    expect(effectiveDatePreset('this-pay-period', false)).toBe('this-week');
    expect(effectiveDatePreset('last-pay-period', false)).toBe('this-week');
  });
});
