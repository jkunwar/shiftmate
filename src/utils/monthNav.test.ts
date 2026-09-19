import { emptyMonthGroup, monthLabelFor, shiftMonthKey } from './monthNav';

describe('shiftMonthKey', () => {
  it('moves forward and back within a year', () => {
    expect(shiftMonthKey('2026-09', 1)).toBe('2026-10');
    expect(shiftMonthKey('2026-09', -1)).toBe('2026-08');
  });

  it('rolls over the year in both directions and keeps two digits', () => {
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthKey('2026-02', 1)).toBe('2026-03');
  });
});

describe('monthLabelFor', () => {
  it('writes the month out', () => {
    expect(monthLabelFor('2026-09')).toBe('September 2026');
    expect(monthLabelFor('2027-01')).toBe('January 2027');
  });
});

describe('emptyMonthGroup', () => {
  it('has no shifts and a label', () => {
    expect(emptyMonthGroup('2026-09')).toEqual({
      monthKey: '2026-09',
      monthLabel: 'September 2026',
      totalMinutes: 0,
      totalEarnings: 0,
      shiftCount: 0,
      unpaidMinutes: 0,
      unpaidEarnings: 0,
      weeks: [],
    });
  });
});
