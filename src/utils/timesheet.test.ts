import { shift, workplace } from '@/__fixtures__/shifts';
import {
  buildShareText,
  buildTimesheetHtml,
  formatLongRange,
  formatTotalDuration,
  groupShiftsByWeek,
} from './timesheet';

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

describe('formatTotalDuration', () => {
  it('always shows hours and two-digit minutes', () => {
    expect(formatTotalDuration(600)).toBe('10h 00m');
    expect(formatTotalDuration(390)).toBe('6h 30m');
    expect(formatTotalDuration(5)).toBe('0h 05m');
    expect(formatTotalDuration(0)).toBe('0h 00m');
  });
});

describe('formatLongRange', () => {
  it('writes the range with the year', () => {
    expect(formatLongRange('2026-09-14', '2026-09-27')).toBe('Sep 14 – Sep 27, 2026');
  });

  it('shows both years when the range crosses New Year', () => {
    expect(formatLongRange('2026-12-28', '2027-01-10')).toBe('Dec 28, 2026 – Jan 10, 2027');
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
    generatedOn: '2026-09-20',
  };

  it('has the title, the people and period, hours and signature lines but no pay figures', () => {
    const html = buildTimesheetHtml(base);
    expect(html).toContain('SHIFTMATE');
    expect(html).toContain('TIMESHEET');
    expect(html).not.toContain('OFFICIAL WORK RECORD');
    expect(html).toContain('Employee');
    expect(html).toContain('Total worked time');
    expect(html).toContain('Employee Signature');
    expect(html).toContain('Supervisor / Manager');
    expect(html).not.toMatch(/earning|\brate\b|estimated/i);
  });

  it('shows the pay period with its year when the dates are given, else the label', () => {
    expect(buildTimesheetHtml({ ...base, rangeStart: '2026-09-14', rangeEnd: '2026-09-27' })).toContain(
      'Sep 14 – Sep 27, 2026',
    );
    expect(buildTimesheetHtml(base)).toContain('September 2026');
  });

  it('gives every week its own numbered heading, table and total', () => {
    const html = buildTimesheetHtml(base);
    expect(html).toContain('Week 1');
    expect(html).toContain('Week 2');
    expect(html).toContain('Sep 7 – Sep 13');
    expect(html.match(/<table>/g)).toHaveLength(2);
    expect(html.match(/Week total/g)).toHaveLength(2);
    expect(html).toContain('6h 30m'); // week 1 total
    expect(html).toContain('11h 30m'); // grand total
  });

  it('never renders a week as a table row', () => {
    const html = buildTimesheetHtml(base);
    expect(html).not.toContain('class="week"><td');
    expect(html).toContain('<div class="week-head">');
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

  describe('estimated pay', () => {
    const withPay = {
      ...base,
      includeEstimatedPay: true,
      formatMoney: (n: number) => `$${n.toFixed(2)}`,
    };

    it('is shown only when asked for', () => {
      // 11.5 hours at the fixture workplace's 20 per hour
      expect(buildTimesheetHtml(withPay)).toContain('$230.00');
      expect(buildTimesheetHtml(withPay)).toContain('Estimated pay');
      expect(buildTimesheetHtml(base)).not.toContain('$230.00');
    });

    it('is left out when there is no rate to work it out from', () => {
      const html = buildTimesheetHtml({
        ...withPay,
        workplaces: [workplace({ hourlyRate: undefined })],
        shifts: shifts.map((s) => ({ ...s, hourlyRate: undefined })),
      });
      expect(html).not.toContain('Estimated pay');
    });

    it('needs a money formatter', () => {
      expect(buildTimesheetHtml({ ...base, includeEstimatedPay: true })).not.toContain('Estimated pay');
    });
  });
});
