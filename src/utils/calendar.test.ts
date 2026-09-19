import { shift } from '@/__fixtures__/shifts';
import { dateInMonth, defaultSelectedDate, groupShiftsByDate, monthGridShape } from './calendar';

describe('monthGridShape', () => {
  it('counts the days and the blanks before the 1st', () => {
    // September 2026 starts on a Tuesday and has 30 days
    expect(monthGridShape('2026-09')).toEqual({ daysInMonth: 30, leadingBlanks: 2 });
    // February 2028 (leap year) starts on a Tuesday
    expect(monthGridShape('2028-02')).toEqual({ daysInMonth: 29, leadingBlanks: 2 });
    // November 2026 starts on a Sunday, so no blanks
    expect(monthGridShape('2026-11')).toEqual({ daysInMonth: 30, leadingBlanks: 0 });
  });
});

describe('dateInMonth', () => {
  it('pads the day to two digits', () => {
    expect(dateInMonth('2026-09', 5)).toBe('2026-09-05');
    expect(dateInMonth('2026-09', 30)).toBe('2026-09-30');
  });
});

describe('groupShiftsByDate', () => {
  it('groups the month’s shifts by day and ignores other months', () => {
    const grouped = groupShiftsByDate(
      [
        shift({ id: 'a', date: '2026-09-05' }),
        shift({ id: 'b', date: '2026-09-05' }),
        shift({ id: 'c', date: '2026-09-06' }),
        shift({ id: 'd', date: '2026-10-01' }),
      ],
      '2026-09',
    );
    expect([...grouped.keys()]).toEqual(['2026-09-05', '2026-09-06']);
    expect(grouped.get('2026-09-05')?.map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('defaultSelectedDate', () => {
  const shifts = [shift({ date: '2026-08-12' })];

  it('is today when today is in the month', () => {
    expect(defaultSelectedDate('2026-09', '2026-09-19', shifts)).toBe('2026-09-19');
  });

  it('is the first shift’s day when today is elsewhere', () => {
    expect(defaultSelectedDate('2026-08', '2026-09-19', shifts)).toBe('2026-08-12');
  });

  it('is the 1st when the month has no shifts', () => {
    expect(defaultSelectedDate('2026-07', '2026-09-19', shifts)).toBe('2026-07-01');
  });
});
