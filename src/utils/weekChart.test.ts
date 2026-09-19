import { shift } from '@/__fixtures__/shifts';
import { buildWeekDays } from './weekChart';

describe('buildWeekDays', () => {
  it('returns seven consecutive days from the week start', () => {
    const days = buildWeekDays([], '2026-09-14');
    expect(days.map((d) => d.date)).toEqual([
      '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17',
      '2026-09-18', '2026-09-19', '2026-09-20',
    ]);
    expect(days.map((d) => d.short)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(days.map((d) => d.initial).join('')).toBe('MTWTFSS');
  });

  it('adds up several shifts on one day and leaves other days at zero', () => {
    const days = buildWeekDays(
      [
        shift({ id: 'a', date: '2026-09-16', workedMinutes: 120 }),
        shift({ id: 'b', date: '2026-09-16', workedMinutes: 90 }),
        shift({ id: 'c', date: '2026-09-20', workedMinutes: 60 }),
      ],
      '2026-09-14',
    );
    expect(days.map((d) => d.minutes)).toEqual([0, 0, 210, 0, 0, 0, 60]);
  });

  it('ignores shifts outside the week', () => {
    const days = buildWeekDays([shift({ date: '2026-09-13' }), shift({ date: '2026-09-21' })], '2026-09-14');
    expect(days.every((d) => d.minutes === 0)).toBe(true);
  });

  it('can start the week on Sunday', () => {
    const days = buildWeekDays([], '2026-09-13');
    expect(days[0].short).toBe('Sun');
    expect(days[6].short).toBe('Sat');
  });
});
