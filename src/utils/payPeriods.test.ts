import { defaultPayAnchor, describePayPeriod, getPayPeriod, hasPayPeriods } from './payPeriods';

const biweekly = { frequency: 'biweekly' as const, anchor: '2026-09-04' };

describe('hasPayPeriods', () => {
  it('needs an anchor for weekly and bi-weekly only', () => {
    expect(hasPayPeriods({ frequency: 'off', anchor: '2026-09-04' })).toBe(false);
    expect(hasPayPeriods({ frequency: 'biweekly', anchor: '' })).toBe(false);
    expect(hasPayPeriods({ frequency: 'weekly', anchor: 'nope' })).toBe(false);
    expect(hasPayPeriods(biweekly)).toBe(true);
    expect(hasPayPeriods({ frequency: 'semimonthly', anchor: '' })).toBe(true);
    expect(hasPayPeriods({ frequency: 'monthly', anchor: '' })).toBe(true);
  });
});

describe('getPayPeriod: bi-weekly and weekly', () => {
  it('finds the 14-day period containing today', () => {
    expect(getPayPeriod('2026-09-19', biweekly)).toEqual({ start: '2026-09-18', end: '2026-10-01' });
    expect(getPayPeriod('2026-09-04', biweekly)).toEqual({ start: '2026-09-04', end: '2026-09-17' });
    expect(getPayPeriod('2026-09-17', biweekly)).toEqual({ start: '2026-09-04', end: '2026-09-17' });
  });

  it('moves by whole periods', () => {
    expect(getPayPeriod('2026-09-19', biweekly, -1)).toEqual({ start: '2026-09-04', end: '2026-09-17' });
    expect(getPayPeriod('2026-09-19', biweekly, 1)).toEqual({ start: '2026-10-02', end: '2026-10-15' });
  });

  it('works for dates before the anchor', () => {
    expect(getPayPeriod('2026-08-30', biweekly)).toEqual({ start: '2026-08-21', end: '2026-09-03' });
  });

  it('counts weekly periods from the anchor', () => {
    const weekly = { frequency: 'weekly' as const, anchor: '2026-09-04' };
    expect(getPayPeriod('2026-09-19', weekly)).toEqual({ start: '2026-09-18', end: '2026-09-24' });
  });

  it('is null without a usable anchor or when off', () => {
    expect(getPayPeriod('2026-09-19', { frequency: 'biweekly', anchor: '' })).toBeNull();
    expect(getPayPeriod('2026-09-19', { frequency: 'off', anchor: '2026-09-04' })).toBeNull();
  });
});

describe('getPayPeriod: twice a month', () => {
  const semi = { frequency: 'semimonthly' as const, anchor: '' };

  it('is the 1st to 15th or the 16th to the end of the month', () => {
    expect(getPayPeriod('2026-09-10', semi)).toEqual({ start: '2026-09-01', end: '2026-09-15' });
    expect(getPayPeriod('2026-09-15', semi)).toEqual({ start: '2026-09-01', end: '2026-09-15' });
    expect(getPayPeriod('2026-09-16', semi)).toEqual({ start: '2026-09-16', end: '2026-09-30' });
    expect(getPayPeriod('2028-02-20', semi)).toEqual({ start: '2028-02-16', end: '2028-02-29' });
  });

  it('steps across months and years', () => {
    expect(getPayPeriod('2026-09-19', semi, -1)).toEqual({ start: '2026-09-01', end: '2026-09-15' });
    expect(getPayPeriod('2026-09-19', semi, -2)).toEqual({ start: '2026-08-16', end: '2026-08-31' });
    expect(getPayPeriod('2026-12-20', semi, 1)).toEqual({ start: '2027-01-01', end: '2027-01-15' });
    expect(getPayPeriod('2026-01-05', semi, -1)).toEqual({ start: '2025-12-16', end: '2025-12-31' });
  });
});

describe('getPayPeriod: monthly', () => {
  it('is the calendar month without an anchor', () => {
    expect(getPayPeriod('2026-09-19', { frequency: 'monthly', anchor: '' })).toEqual({
      start: '2026-09-01',
      end: '2026-09-30',
    });
  });

  it('runs from the anchor day to the day before it next month', () => {
    const monthly = { frequency: 'monthly' as const, anchor: '2026-01-26' };
    expect(getPayPeriod('2026-09-19', monthly)).toEqual({ start: '2026-08-26', end: '2026-09-25' });
    expect(getPayPeriod('2026-09-26', monthly)).toEqual({ start: '2026-09-26', end: '2026-10-25' });
    expect(getPayPeriod('2026-09-19', monthly, -1)).toEqual({ start: '2026-07-26', end: '2026-08-25' });
  });

  it('clamps the start day in short months', () => {
    const monthly = { frequency: 'monthly' as const, anchor: '2026-01-31' };
    expect(getPayPeriod('2026-02-15', monthly)).toEqual({ start: '2026-01-31', end: '2026-02-27' });
    expect(getPayPeriod('2026-03-05', monthly)).toEqual({ start: '2026-02-28', end: '2026-03-30' });
  });
});

describe('describePayPeriod', () => {
  it('writes the range, or null when not set up', () => {
    expect(describePayPeriod('2026-09-19', biweekly)).toBe('Sep 18 – Oct 1');
    expect(describePayPeriod('2026-09-19', { frequency: 'off', anchor: '' })).toBeNull();
  });
});

describe('defaultPayAnchor', () => {
  it('starts from this week for weekly cycles, this month for monthly, nothing otherwise', () => {
    expect(defaultPayAnchor('biweekly', '2026-09-19', '2026-09-14')).toBe('2026-09-14');
    expect(defaultPayAnchor('weekly', '2026-09-19', '2026-09-14')).toBe('2026-09-14');
    expect(defaultPayAnchor('monthly', '2026-09-19', '2026-09-14')).toBe('2026-09-01');
    expect(defaultPayAnchor('semimonthly', '2026-09-19', '2026-09-14')).toBe('');
    expect(defaultPayAnchor('off', '2026-09-19', '2026-09-14')).toBe('');
  });
});
