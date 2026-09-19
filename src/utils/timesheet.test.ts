import { shift, workplace } from '@/__fixtures__/shifts';
import { buildShareText, buildTimesheetHtml, groupShiftsByWeek } from './timesheet';

// 2026-09-07 is a Monday
const shifts = [
  shift({ id: 'a', date: '2026-09-08', workedMinutes: 330 }),
  shift({ id: 'b', date: '2026-09-08', workedMinutes: 60, startTime: '18:00' }),
  shift({ id: 'c', date: '2026-09-15', workedMinutes: 300 }),
];

describe('groupShiftsByWeek', () => {
  it('orders weeks oldest first and totals each day', () => {
    const weeks = groupShiftsByWeek(shifts, 'monday');
    expect(weeks.map((w) => w.label)).toEqual(['Sep 7 – Sep 13', 'Sep 14 – Sep 20']);
    expect(weeks[0].totalMinutes).toBe(390);
    expect(weeks[0].days).toEqual([{ date: '2026-09-08', minutes: 390, shiftCount: 2 }]);
  });
});

describe('buildShareText', () => {
  const info = { workplaceName: 'Cafe', rangeLabel: 'September 2026', weekStartsOn: 'monday' as const };

  it('lists hours for each day grouped by week, with no pay figures', () => {
    const text = buildShareText({ ...info, shifts });
    expect(text).toBe(
      [
        'Work Timesheet: Cafe (September 2026)',
        'Total Worked: 11h 30m (3 shifts)',
        '',
        'Sep 7 – Sep 13 · 6h 30m',
        'Tue, Sep 8 – 6h 30m',
        '',
        'Sep 14 – Sep 20 · 5h',
        'Tue, Sep 15 – 5h',
      ].join('\n'),
    );
    expect(text).not.toMatch(/estimated|\$/i);
  });

  it('skips the week heading when the report covers a single week', () => {
    const text = buildShareText({ ...info, shifts: shifts.slice(0, 2) });
    expect(text).not.toContain('·');
    expect(text).toContain('Tue, Sep 8 – 6h 30m');
  });
});

describe('buildTimesheetHtml', () => {
  const base = {
    user: { id: 'u', name: 'Alex <b>', email: 'a@b.c' },
    workplaces: [workplace()],
    workplaceName: 'Cafe',
    rangeLabel: 'September 2026',
    shifts,
    weekStartsOn: 'monday' as const,
    showWorkplace: false,
  };

  it('has hours and signature lines but no pay figures', () => {
    const html = buildTimesheetHtml(base);
    expect(html).toContain('TIMESHEET');
    expect(html).toContain('Total Worked Time');
    expect(html).toContain('Employee Signature');
    expect(html).not.toMatch(/earning|\brate\b|estimated/i);
  });

  it('escapes user-provided text', () => {
    const html = buildTimesheetHtml(base);
    expect(html).toContain('Alex &lt;b&gt;');
    expect(html).not.toContain('Alex <b>');
  });

  it('adds a workplace column only when asked', () => {
    expect(buildTimesheetHtml(base)).not.toContain('<th>Workplace</th>');
    expect(buildTimesheetHtml({ ...base, showWorkplace: true })).toContain('<th>Workplace</th>');
  });

  it('uses the given clock format', () => {
    const html = buildTimesheetHtml({ ...base, formatTimeValue: (t) => `[${t}]` });
    expect(html).toContain('[10:00]');
  });
});
