import { Shift, User, UserPreferences, Workplace } from '@/types';
import { addDays, weekStartOf } from '@/utils/dateRanges';
import {
  formatDate,
  formatDuration,
  formatTime12h,
  shiftEarnings,
  toLocalDateString,
} from '@/utils/timeCalculations';

type WeekStart = UserPreferences['weekStartsOn'];

export interface DayTotal {
  date: string;
  minutes: number;
  shiftCount: number;
}

export interface ReportWeek {
  weekStart: string;
  weekEnd: string;
  label: string;
  totalMinutes: number;
  days: DayTotal[];
  shifts: Shift[];
}

/** "Mon, Sep 14" */
export function formatDayLabel(dateStr: string): string {
  return `${formatDate(dateStr, 'dayOfWeek').slice(0, 3)}, ${formatDate(dateStr, 'short')}`;
}

/** Groups shifts into weeks (oldest first) with a total of hours worked for each day. */
export function groupShiftsByWeek(shifts: Shift[], weekStartsOn: WeekStart): ReportWeek[] {
  const weeks = new Map<string, ReportWeek>();

  const sorted = [...shifts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );

  for (const shift of sorted) {
    const weekStart = weekStartOf(shift.date, weekStartsOn);
    let week = weeks.get(weekStart);
    if (!week) {
      const weekEnd = addDays(weekStart, 6);
      week = {
        weekStart,
        weekEnd,
        label: `${formatDate(weekStart, 'short')} – ${formatDate(weekEnd, 'short')}`,
        totalMinutes: 0,
        days: [],
        shifts: [],
      };
      weeks.set(weekStart, week);
    }

    week.totalMinutes += shift.workedMinutes;
    week.shifts.push(shift);

    const day = week.days.find((d) => d.date === shift.date);
    if (day) {
      day.minutes += shift.workedMinutes;
      day.shiftCount += 1;
    } else {
      week.days.push({ date: shift.date, minutes: shift.workedMinutes, shiftCount: 1 });
    }
  }

  return [...weeks.values()];
}

interface ReportInfo {
  workplaceName: string;
  rangeLabel: string;
  shifts: Shift[];
  weekStartsOn: WeekStart;
}

/** Plain-text summary for the Share button: total, then hours for each day, grouped by week. */
export function buildShareText({ workplaceName, rangeLabel, shifts, weekStartsOn }: ReportInfo): string {
  const totalMinutes = shifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  const weeks = groupShiftsByWeek(shifts, weekStartsOn);

  const lines = [
    `Work Timesheet: ${workplaceName} (${rangeLabel})`,
    `Total Worked: ${formatDuration(totalMinutes)} (${shifts.length} ${shifts.length === 1 ? 'shift' : 'shifts'})`,
  ];

  for (const week of weeks) {
    lines.push('');
    // A single week needs no heading: the period is already in the first line
    if (weeks.length > 1) lines.push(`${week.label} · ${formatDuration(week.totalMinutes)}`);
    for (const day of week.days) {
      lines.push(`${formatDayLabel(day.date)} – ${formatDuration(day.minutes)}`);
    }
  }

  return lines.join('\n');
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Total time as hours and minutes, e.g. "10h 00m" (rows use the shorter "5h" / "5h 30m"). */
export function formatTotalDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/** "Sep 14 – Sep 27, 2026", or with both years when the range crosses New Year. */
export function formatLongRange(start: string, end: string): string {
  const [startYear, endYear] = [start.slice(0, 4), end.slice(0, 4)];
  const from = formatDate(start, 'short');
  const to = formatDate(end, 'short');
  return startYear === endYear
    ? `${from} – ${to}, ${endYear}`
    : `${from}, ${startYear} – ${to}, ${endYear}`;
}

const BRAND = '#A66A55'; // ShiftMate's muted terracotta, used sparingly
const INK = '#292725';
const MUTED = '#6F6A64';
const RULE = '#DDD8D2';
const RULE_STRONG = '#B9B2AA';

/**
 * Printable timesheet document (rendered to PDF by expo-print): a header, who and when, a compact
 * summary, one section per week (its own table, so the column headings repeat if a week runs onto
 * another page), the total, and signature lines.
 *
 * It lists hours only. Estimated pay is included only when `includeEstimatedPay` is set and a
 * `formatMoney` is given, and only when there is a rate to work it out from.
 */
export function buildTimesheetHtml({
  user,
  workplaces,
  workplaceName,
  rangeLabel,
  rangeStart,
  rangeEnd,
  shifts,
  weekStartsOn,
  showWorkplace,
  formatTimeValue = formatTime12h,
  includeEstimatedPay = false,
  formatMoney,
  generatedOn = toLocalDateString(),
}: ReportInfo & {
  user: User;
  workplaces: Workplace[];
  showWorkplace: boolean;
  /** The report's first and last day (YYYY-MM-DD); shown with the year instead of the label. */
  rangeStart?: string;
  rangeEnd?: string;
  /** Clock format for the Start/End columns. Defaults to 12-hour. */
  formatTimeValue?: (time: string) => string;
  includeEstimatedPay?: boolean;
  formatMoney?: (amount: number) => string;
  /** The day the document was made (YYYY-MM-DD). Defaults to today. */
  generatedOn?: string;
}): string {
  const totalMinutes = shifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  const weeks = groupShiftsByWeek(shifts, weekStartsOn);
  const workplaceOf = (id: string) => workplaces.find((w) => w.id === id);
  const shiftCount = `${shifts.length} ${shifts.length === 1 ? 'shift' : 'shifts'}`;
  const period =
    rangeStart && rangeEnd ? formatLongRange(rangeStart, rangeEnd) : rangeLabel;
  const generated = `${formatDate(generatedOn, 'short')}, ${generatedOn.slice(0, 4)}`;

  // Money is shown only when asked for and when at least one shift has a rate behind it
  const totalPay = shifts.reduce(
    (acc, s) => acc + shiftEarnings(s, workplaceOf(s.workplaceId)),
    0,
  );
  const pay = includeEstimatedPay && formatMoney && totalPay > 0 ? formatMoney(totalPay) : null;

  const columns = showWorkplace
    ? [11, 7, 30, 13, 13, 8, 18]
    : [16, 9, 20, 20, 14, 21];
  const colgroup = `<colgroup>${columns.map((w) => `<col style="width:${w}%" />`).join('')}</colgroup>`;

  const weekSections = weeks
    .map((week, index) => {
      const rows = week.shifts
        .map(
          (shift) => `
          <tr>
            <td>${escapeHtml(formatDate(shift.date, 'short'))}</td>
            <td class="muted">${escapeHtml(formatDate(shift.date, 'dayOfWeek').slice(0, 3))}</td>
            ${showWorkplace ? `<td class="wrap">${escapeHtml(workplaceOf(shift.workplaceId)?.name ?? 'Unknown')}</td>` : ''}
            <td>${escapeHtml(formatTimeValue(shift.startTime))}</td>
            <td>${escapeHtml(formatTimeValue(shift.endTime))}</td>
            <td class="muted">${shift.breakMinutes > 0 ? `${shift.breakMinutes}m` : '—'}</td>
            <td class="right hours">${escapeHtml(formatDuration(shift.workedMinutes))}</td>
          </tr>`,
        )
        .join('');

      return `
      <section class="week">
        <div class="week-head">
          <span class="week-no">Week ${index + 1}</span>
          <span class="week-range">${escapeHtml(week.label)}</span>
        </div>
        <table>
          ${colgroup}
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              ${showWorkplace ? '<th>Workplace</th>' : ''}
              <th>Start</th>
              <th>End</th>
              <th>Break</th>
              <th class="right">Hours</th>
            </tr>
          </thead>
          <tbody>${rows}
          </tbody>
        </table>
        <div class="week-total">
          <span class="week-total-label">Week total</span>
          <span class="week-total-value">${escapeHtml(formatTotalDuration(week.totalMinutes))}</span>
        </div>
      </section>`;
    })
    .join('');

  const signatureRow = (label: string) => `
      <div class="sign-row">
        <span class="sign-label">${label}</span>
        <span class="sign-line"></span>
        <span class="sign-label">Date</span>
        <span class="sign-line sign-date"></span>
      </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${INK};
      font-size: 11.5px;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;
    }
    .muted { color: ${MUTED}; }
    .right { text-align: right; }

    /* Header */
    .doc-head { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 12px; border-bottom: 1.5px solid ${INK}; }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: 3px; color: ${BRAND}; }
    h1 { margin: 2px 0 0; font-size: 28px; line-height: 1.1; letter-spacing: 1px; font-weight: 800; }
    .generated { font-size: 10px; color: ${MUTED}; text-align: right; }

    /* Who, where, when */
    .info { display: flex; gap: 28px; padding: 14px 0; }
    .info > div { flex: 1; }
    .info > div.wide { flex: 1.4; }
    .k { font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: ${MUTED}; }
    .v { margin-top: 2px; font-size: 13px; font-weight: 600; }

    /* Summary */
    .summary { display: flex; gap: 40px; padding: 12px 0; border-top: 1px solid ${RULE}; border-bottom: 1px solid ${RULE}; }
    .stat-value { margin-top: 2px; font-size: 19px; font-weight: 700; }
    .stat-value.accent { color: ${BRAND}; }

    /* Weeks */
    .week { margin-top: 24px; }
    .week-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 6px; break-after: avoid; page-break-after: avoid; }
    .week-no { font-size: 10.5px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: ${BRAND}; }
    .week-range { font-size: 10.5px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: ${MUTED}; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    th { text-align: left; padding: 6px 6px; font-size: 9px; font-weight: 700; letter-spacing: 0.9px; text-transform: uppercase; color: ${MUTED}; border-top: 1px solid ${RULE_STRONG}; border-bottom: 1px solid ${RULE_STRONG}; }
    th.right { text-align: right; }
    td { padding: 8px 6px; border-bottom: 1px solid ${RULE}; vertical-align: top; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    td.wrap { overflow-wrap: anywhere; word-break: break-word; }
    td.hours { font-weight: 700; }
    .week-total { display: flex; justify-content: flex-end; align-items: baseline; gap: 14px; padding: 8px 6px 0; break-before: avoid; page-break-before: avoid; }
    .week-total-label { font-size: 9px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: ${MUTED}; }
    .week-total-value { font-size: 13px; font-weight: 800; }

    /* Grand total */
    .grand { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-top: 28px; padding-top: 12px; border-top: 2px solid ${INK}; break-inside: avoid; page-break-inside: avoid; }
    .grand-value { margin-top: 2px; font-size: 24px; font-weight: 800; letter-spacing: -0.3px; }
    .grand-side { text-align: right; line-height: 1.6; }
    .grand-side strong { font-weight: 700; }

    /* Signatures */
    .sign { margin-top: 46px; break-inside: avoid; page-break-inside: avoid; }
    .sign-row { display: flex; align-items: flex-end; gap: 10px; margin-top: 34px; }
    .sign-row:first-child { margin-top: 0; }
    .sign-label { font-size: 10.5px; color: ${MUTED}; white-space: nowrap; }
    .sign-row .sign-label:first-child { flex: 0 0 124px; }
    .sign-line { flex: 1; height: 1px; margin-bottom: 3px; border-bottom: 1px solid ${INK}; opacity: 0.55; }
    .sign-date { flex: 0 0 130px; }

    .footer { margin-top: 30px; font-size: 9px; color: ${MUTED}; text-align: center; }
  </style>
</head>
<body>
  <div class="doc-head">
    <div>
      <div class="brand">SHIFTMATE</div>
      <h1>TIMESHEET</h1>
    </div>
    <div class="generated">Generated ${escapeHtml(generated)}</div>
  </div>

  <div class="info">
    <div>
      <div class="k">Employee</div>
      <div class="v">${escapeHtml(user.name)}</div>
    </div>
    <div>
      <div class="k">Workplace</div>
      <div class="v">${escapeHtml(workplaceName)}</div>
    </div>
    <div class="wide">
      <div class="k">Pay Period</div>
      <div class="v">${escapeHtml(period)}</div>
    </div>
  </div>

  <div class="summary">
    <div>
      <div class="k">Total hours</div>
      <div class="stat-value accent">${escapeHtml(formatTotalDuration(totalMinutes))}</div>
    </div>
    <div>
      <div class="k">Shifts</div>
      <div class="stat-value">${shifts.length}</div>
    </div>${
      pay
        ? `
    <div>
      <div class="k">Estimated pay</div>
      <div class="stat-value">${escapeHtml(pay)}</div>
    </div>`
        : ''
    }
  </div>
${weekSections}

  <div class="grand">
    <div>
      <div class="k">Total worked time</div>
      <div class="grand-value">${escapeHtml(formatTotalDuration(totalMinutes))}</div>
    </div>
    <div class="grand-side">
      <div>${escapeHtml(shiftCount)}</div>${
        pay ? `\n      <div>Estimated pay <strong>${escapeHtml(pay)}</strong></div>` : ''
      }
    </div>
  </div>

  <div class="sign">${signatureRow('Employee Signature')}${signatureRow('Supervisor / Manager')}
  </div>

  <div class="footer">Prepared with ShiftMate</div>
</body>
</html>`;
}
