import { shift, workplace } from '@/__fixtures__/shifts';
import { addDays, calculateWorkedMinutes, formatCurrency, formatDuration, findOverlappingShift, formatTime, generateTimesheetCSV, groupShiftsByMonthAndWeek, shiftEarnings, toLocalDateString, weekStartOf, changesPay } from './timeCalculations';

describe('calculateWorkedMinutes', () => {
  it('subtracts the break from a normal shift', () => {
    expect(calculateWorkedMinutes('16:00', '21:00', 30)).toEqual({
      workedMinutes: 270,
      isOvernight: false,
    });
  });

  it('treats an end before the start as an overnight shift', () => {
    expect(calculateWorkedMinutes('22:00', '06:00', 0)).toEqual({
      workedMinutes: 480,
      isOvernight: true,
    });
  });

  it('rejects missing or malformed times', () => {
    expect(calculateWorkedMinutes('', '10:00').error).toBeDefined();
    expect(calculateWorkedMinutes('ab:cd', '10:00').error).toBeDefined();
  });

  it('rejects a break as long as the shift, or a negative break', () => {
    expect(calculateWorkedMinutes('10:00', '11:00', 60).error).toBeDefined();
    expect(calculateWorkedMinutes('10:00', '11:00', -5).error).toBeDefined();
  });
});

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0h');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(300)).toBe('5h');
    expect(formatDuration(330)).toBe('5h 30m');
  });

  it('formats times in 12h and 24h', () => {
    expect(formatTime('16:30', '12h')).toBe('4:30 PM');
    expect(formatTime('00:05', '12h')).toBe('12:05 AM');
    expect(formatTime('16:30', '24h')).toBe('16:30');
  });

  it('formats currency with the chosen symbol', () => {
    expect(formatCurrency(1234.5, '€')).toBe('€1,234.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('shiftEarnings', () => {
  it("uses the shift's own rate over the workplace's", () => {
    expect(shiftEarnings(shift({ hourlyRate: 15 }), workplace({ hourlyRate: 20 }))).toBe(30);
  });

  it("falls back to the workplace's rate for older shifts", () => {
    expect(shiftEarnings(shift(), workplace({ hourlyRate: 20 }))).toBe(40);
  });

  it('keeps an explicit rate of 0', () => {
    expect(shiftEarnings(shift({ hourlyRate: 0 }), workplace({ hourlyRate: 20 }))).toBe(0);
  });

  it('is 0 with no rate anywhere', () => {
    expect(shiftEarnings(shift(), null)).toBe(0);
  });
});

describe('dates', () => {
  it('formats a Date in local time', () => {
    expect(toLocalDateString(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('finds the start of the week for either week-start preference', () => {
    // 2026-09-19 is a Saturday
    expect(weekStartOf('2026-09-19', 'monday')).toBe('2026-09-14');
    expect(weekStartOf('2026-09-19', 'sunday')).toBe('2026-09-13');
    expect(weekStartOf('2026-09-20', 'monday')).toBe('2026-09-14'); // a Sunday
  });
});

describe('groupShiftsByMonthAndWeek', () => {
  const shifts = [
    shift({ id: 'a', date: '2026-09-01', workedMinutes: 60 }),
    shift({ id: 'b', date: '2026-09-06', workedMinutes: 60 }), // Sunday
    shift({ id: 'c', date: '2026-09-07', workedMinutes: 120 }), // Monday
    shift({ id: 'd', date: '2026-09-30', workedMinutes: 45 }),
  ];

  it('groups into calendar weeks that start on the chosen day, clipped to the month', () => {
    const [september] = groupShiftsByMonthAndWeek(shifts, workplace(), 'monday');
    const labels = september.weeks.map((w) => w.dateRangeLabel);
    expect(labels).toEqual(['Sep 28 – Sep 30', 'Sep 7 – Sep 13', 'Sep 1 – Sep 6']);
  });

  it('moves shifts between weeks when weeks start on Sunday', () => {
    const [september] = groupShiftsByMonthAndWeek(shifts, workplace(), 'sunday');
    const week = september.weeks.find((w) => w.dateRangeLabel === 'Sep 6 – Sep 12');
    expect(week?.shifts.map((s) => s.id).sort()).toEqual(['b', 'c']);
  });

  it('totals minutes and per-shift earnings for the month', () => {
    const mixed = [
      shift({ id: 'x', date: '2026-09-10', workedMinutes: 120, hourlyRate: 15 }),
      shift({ id: 'y', date: '2026-09-11', workedMinutes: 120 }),
    ];
    const [group] = groupShiftsByMonthAndWeek(mixed, workplace({ hourlyRate: 20 }));
    expect(group.totalMinutes).toBe(240);
    expect(group.totalEarnings).toBe(15 * 2 + 20 * 2);
    expect(group.unpaidEarnings).toBe(70);
  });

  it('lists months newest first', () => {
    const groups = groupShiftsByMonthAndWeek([
      shift({ id: 'a', date: '2026-08-15' }),
      shift({ id: 'b', date: '2026-09-15' }),
    ]);
    expect(groups.map((g) => g.monthKey)).toEqual(['2026-09', '2026-08']);
  });
});

describe('generateTimesheetCSV', () => {
  it('has hours but no pay columns', () => {
    const csv = generateTimesheetCSV([shift({ notes: 'say "hi"' })], [workplace()], 'Sept');
    const [title, header, row] = csv.split('\n');
    expect(title).toBe('# Timesheet Report - Sept');
    expect(header).toBe(
      'Workplace,Date,Day,Start Time,End Time,Break (min),Worked Hours,Status,Notes',
    );
    expect(header).not.toMatch(/rate|earn/i);
    expect(row).toContain('"Cafe"');
    expect(row).toContain('2.00'); // hours
    expect(row).toContain('"say ""hi"""'); // quotes escaped
    expect(row).not.toContain('$');
  });

  it('uses the given clock format', () => {
    const csv = generateTimesheetCSV([shift()], [workplace()], 'x', (t) => t);
    expect(csv).toContain('10:00');
  });
});

describe('findOverlappingShift', () => {
  const existing = [shift({ id: 'e1', date: '2026-09-10', startTime: '10:00', endTime: '14:00' })];

  it('finds a shift that overlaps', () => {
    const candidate = { date: '2026-09-10', startTime: '13:00', endTime: '16:00' };
    expect(findOverlappingShift(candidate, existing)?.id).toBe('e1');
  });

  it('allows shifts that only touch', () => {
    const candidate = { date: '2026-09-10', startTime: '14:00', endTime: '18:00' };
    expect(findOverlappingShift(candidate, existing)).toBeUndefined();
  });

  it('ignores other days and the shift being edited', () => {
    expect(findOverlappingShift({ date: '2026-09-11', startTime: '10:00', endTime: '14:00' }, existing)).toBeUndefined();
    expect(findOverlappingShift({ date: '2026-09-10', startTime: '10:00', endTime: '14:00' }, existing, 'e1')).toBeUndefined();
  });

  it('accounts for overnight shifts running into the next day', () => {
    const night = [shift({ id: 'n', date: '2026-09-10', startTime: '22:00', endTime: '06:00' })];
    expect(findOverlappingShift({ date: '2026-09-11', startTime: '05:00', endTime: '09:00' }, night)?.id).toBe('n');
    expect(findOverlappingShift({ date: '2026-09-11', startTime: '06:00', endTime: '09:00' }, night)).toBeUndefined();
  });
});

describe('changesPay', () => {
  const base = { workplaceId: 'w1', workedMinutes: 480, hourlyRate: 20 };

  it('is false when nothing pay-related changed', () => {
    expect(changesPay(base, { ...base })).toBe(false);
  });

  it('is true when the hours, rate or workplace change', () => {
    expect(changesPay(base, { ...base, workedMinutes: 450 })).toBe(true);
    expect(changesPay(base, { ...base, hourlyRate: 21 })).toBe(true);
    expect(changesPay(base, { ...base, workplaceId: 'w2' })).toBe(true);
  });

  it('ignores floating point noise in the rate', () => {
    expect(changesPay(base, { ...base, hourlyRate: 20.000001 })).toBe(false);
  });
});
