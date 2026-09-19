import { Shift, User, UserPreferences, Workplace } from '@/types';
import { addDays, weekStartOf } from '@/utils/dateRanges';
import { formatDate, formatDuration, formatTime12h } from '@/utils/timeCalculations';

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

/** Printable timesheet document (rendered to PDF by expo-print). Hours only, no pay figures. */
export function buildTimesheetHtml({
  user,
  workplaces,
  workplaceName,
  rangeLabel,
  shifts,
  weekStartsOn,
  showWorkplace,
  formatTimeValue = formatTime12h,
}: ReportInfo & {
  user: User;
  workplaces: Workplace[];
  showWorkplace: boolean;
  /** Clock format for the Start/End columns. Defaults to 12-hour. */
  formatTimeValue?: (time: string) => string;
}): string {
  const totalMinutes = shifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  const weeks = groupShiftsByWeek(shifts, weekStartsOn);
  const wpName = (id: string) => workplaces.find((w) => w.id === id)?.name ?? 'Unknown';
  const columns = showWorkplace ? 7 : 6;

  const weekRows = weeks
    .map((week) => {
      const rows = week.shifts
        .map(
          (shift) => `
        <tr>
          <td>${escapeHtml(formatDate(shift.date, 'short'))}</td>
          <td class="muted">${escapeHtml(formatDate(shift.date, 'dayOfWeek').slice(0, 3))}</td>
          ${showWorkplace ? `<td>${escapeHtml(wpName(shift.workplaceId))}</td>` : ''}
          <td>${escapeHtml(formatTimeValue(shift.startTime))}</td>
          <td>${escapeHtml(formatTimeValue(shift.endTime))}</td>
          <td class="muted">${shift.breakMinutes > 0 ? `${shift.breakMinutes}m` : '—'}</td>
          <td class="right strong">${escapeHtml(formatDuration(shift.workedMinutes))}</td>
        </tr>`,
        )
        .join('');

      return `
        <tr class="week">
          <td colspan="${columns - 1}">${escapeHtml(week.label)}</td>
          <td class="right">${escapeHtml(formatDuration(week.totalMinutes))}</td>
        </tr>${rows}`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 32px; font-size: 12px; }
    .banner { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 14px; }
    .eyebrow { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    h1 { margin: 2px 0; font-size: 26px; letter-spacing: -0.5px; }
    .workplace { color: #1a73e0; font-weight: 600; font-size: 14px; }
    .meta { text-align: right; line-height: 1.6; }
    .meta .label { color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; font-size: 10px; letter-spacing: 0.6px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 8px 4px; }
    td { padding: 8px 4px; border-bottom: 1px solid #e2e8f0; }
    tr.week td { background: #f1f5f9; font-weight: 700; padding: 8px 6px; border-bottom: 1px solid #cbd5e1; }
    .right { text-align: right; }
    .strong { font-weight: 700; }
    .muted { color: #64748b; }
    .totals { margin-top: 20px; padding: 14px 16px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; }
    .totals .label { color: #64748b; font-weight: 600; }
    .totals .value { font-size: 22px; font-weight: 800; }
    .signatures { display: flex; gap: 32px; margin-top: 56px; }
    .signature { flex: 1; border-top: 1px solid #94a3b8; padding-top: 6px; color: #64748b; font-size: 10px; }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <div class="eyebrow">Official Work Record</div>
      <h1>TIMESHEET</h1>
      <div class="workplace">${escapeHtml(workplaceName)}</div>
    </div>
    <div class="meta">
      <div><span class="label">Pay Period</span></div>
      <div><strong>${escapeHtml(rangeLabel)}</strong></div>
      <div><span class="label">Employee:</span> <strong>${escapeHtml(user.name)}</strong></div>
    </div>
  </div>

  <table>
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
    <tbody>${weekRows}</tbody>
  </table>

  <div class="totals">
    <div class="label">Total Worked Time</div>
    <div class="value">${escapeHtml(formatDuration(totalMinutes))}</div>
    <div class="muted">(${shifts.length} ${shifts.length === 1 ? 'shift' : 'shifts'})</div>
  </div>

  <div class="signatures">
    <div class="signature">Employee Signature / Date</div>
    <div class="signature">Supervisor Approval / Date</div>
  </div>
</body>
</html>`;
}
