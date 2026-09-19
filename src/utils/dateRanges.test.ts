import { formatRange, getMonthRange, getWeekRange } from './dateRanges';

describe('getWeekRange', () => {
  it('returns the week containing today for a Monday start', () => {
    expect(getWeekRange('2026-09-19', 'monday')).toEqual({ start: '2026-09-14', end: '2026-09-20' });
  });

  it('returns the week for a Sunday start', () => {
    expect(getWeekRange('2026-09-19', 'sunday')).toEqual({ start: '2026-09-13', end: '2026-09-19' });
  });

  it('moves by whole weeks', () => {
    expect(getWeekRange('2026-09-19', 'monday', -1)).toEqual({ start: '2026-09-07', end: '2026-09-13' });
  });

  it('crosses a year boundary', () => {
    expect(getWeekRange('2027-01-01', 'monday')).toEqual({ start: '2026-12-28', end: '2027-01-03' });
  });
});

describe('getMonthRange', () => {
  it('returns the current month with its label', () => {
    expect(getMonthRange('2026-09-19')).toEqual({
      start: '2026-09-01',
      end: '2026-09-30',
      monthKey: '2026-09',
      label: 'September 2026',
    });
  });

  it('steps back across a year boundary', () => {
    expect(getMonthRange('2027-01-15', -1)).toMatchObject({
      start: '2026-12-01',
      end: '2026-12-31',
      label: 'December 2026',
    });
  });

  it('knows leap years', () => {
    expect(getMonthRange('2028-02-10').end).toBe('2028-02-29');
    expect(getMonthRange('2027-02-10').end).toBe('2027-02-28');
  });
});

it('formats a range', () => {
  expect(formatRange({ start: '2026-09-14', end: '2026-09-20' })).toBe('Sep 14 – Sep 20');
});
