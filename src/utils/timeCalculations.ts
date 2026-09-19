import { MonthGroup, Shift, UserPreferences, WeekGroup, Workplace } from '../types';

/**
 * Calculates worked minutes from start time, end time, and break minutes.
 * Handles overnight shifts if end time < start time (adds 24 hours).
 */
export function calculateWorkedMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number = 0
): { workedMinutes: number; isOvernight: boolean; error?: string } {
  if (!startTime || !endTime) {
    return { workedMinutes: 0, isOvernight: false, error: 'Start and end time required' };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
    return { workedMinutes: 0, isOvernight: false, error: 'Invalid time format' };
  }

  const startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;
  let isOvernight = false;

  if (endTotalMinutes < startTotalMinutes) {
    // Overnight shift: crosses midnight
    endTotalMinutes += 24 * 60;
    isOvernight = true;
  }

  const grossMinutes = endTotalMinutes - startTotalMinutes;

  if (breakMinutes < 0) {
    return { workedMinutes: 0, isOvernight, error: 'Break cannot be negative' };
  }

  if (breakMinutes >= grossMinutes && grossMinutes > 0) {
    return { workedMinutes: 0, isOvernight, error: 'Break cannot exceed or equal shift duration' };
  }

  const workedMinutes = Math.max(0, grossMinutes - breakMinutes);
  return { workedMinutes, isOvernight };
}

/**
 * Formats minutes into human-readable "23h 30m" or "5h" or "45m"
 */
export function formatDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0h';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Estimated earnings for a shift, at the rate saved on the shift (or, for older shifts without
 * one, the workplace's current rate). Saving the rate keeps past earnings from changing when a
 * workplace's rate is edited later.
 */
export function shiftEarnings(shift: Shift, workplace?: Pick<Workplace, 'hourlyRate'> | null): number {
  return (shift.workedMinutes / 60) * shiftHourlyRate(shift, workplace);
}

/** The rate a shift is paid at: its own saved rate, or else its workplace's current one. */
export function shiftHourlyRate(shift: Shift, workplace?: Pick<Workplace, 'hourlyRate'> | null): number {
  return shift.hourlyRate ?? workplace?.hourlyRate ?? 0;
}

/**
 * Formats currency amount
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${currency}${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats 24h time "16:00" to "4:00 PM"
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return timeStr;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Formats 24h time "16:00" as "4:00 PM" or, for the 24-hour preference, "16:00"
 */
export function formatTime(timeStr: string, timeFormat: UserPreferences['timeFormat'] = '12h'): string {
  if (!timeStr) return '';
  return timeFormat === '24h' ? timeStr : formatTime12h(timeStr);
}

/**
 * Formats date "2026-09-14" to various formats
 */
export function formatDate(dateStr: string, style: 'short' | 'medium' | 'full' | 'dayOfWeek' | 'compact' = 'medium'): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayOfWeek = daysOfWeek[dateObj.getDay()];
  const monthShort = monthsShort[dateObj.getMonth()];
  const monthFull = monthsFull[dateObj.getMonth()];

  switch (style) {
    case 'dayOfWeek':
      return dayOfWeek;
    case 'short':
      return `${monthShort} ${day}`;
    case 'compact':
      return `${monthShort} ${day} · ${dayOfWeek}`;
    case 'medium':
      return `${dayOfWeek}, ${monthShort} ${day}`;
    case 'full':
      return `${dayOfWeek}, ${monthFull} ${day}, ${year}`;
    default:
      return `${dayOfWeek}, ${monthShort} ${day}`;
  }
}

/**
 * Groups shifts for a specific workplace into Month -> Week -> Shifts hierarchy
 */
export function groupShiftsByMonthAndWeek(
  shifts: Shift[],
  workplace?: Workplace,
  weekStartsOn: UserPreferences['weekStartsOn'] = 'monday',
): MonthGroup[] {
  // Sort shifts descending by date, then by startTime descending
  const sortedShifts = [...shifts].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.startTime.localeCompare(a.startTime);
  });

  const monthMap = new Map<string, Shift[]>();

  sortedShifts.forEach((shift) => {
    const monthKey = shift.date.substring(0, 7); // "YYYY-MM"
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(shift);
  });

  const monthsFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const result: MonthGroup[] = [];

  monthMap.forEach((monthShifts, monthKey) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthIdx = parseInt(monthStr, 10) - 1;
    const monthLabel = `${monthsFull[monthIdx]} ${year}`;

    // Group into real calendar weeks (starting on the preferred day), clipped to this month
    const monthStart = `${monthKey}-01`;
    const monthEnd = `${monthKey}-${String(new Date(year, monthIdx + 1, 0).getDate()).padStart(2, '0')}`;
    const weekMap = new Map<string, Shift[]>();

    let totalMonthMinutes = 0;
    let unpaidMinutes = 0;

    monthShifts.forEach((shift) => {
      totalMonthMinutes += shift.workedMinutes;
      if (shift.paymentStatus === 'unpaid') {
        unpaidMinutes += shift.workedMinutes;
      }
      const weekStart = weekStartOf(shift.date, weekStartsOn);
      if (!weekMap.has(weekStart)) weekMap.set(weekStart, []);
      weekMap.get(weekStart)!.push(shift);
    });

    // Newest week first; week numbers count up from the first week of the month
    const weekStarts = [...weekMap.keys()].sort();
    const weeks: WeekGroup[] = weekStarts
      .map((weekStart, index) => {
        const shiftsInWeek = weekMap.get(weekStart)!;
        const rangeStart = weekStart < monthStart ? monthStart : weekStart;
        const rangeEnd = addDays(weekStart, 6) > monthEnd ? monthEnd : addDays(weekStart, 6);
        return {
          weekNumber: index + 1,
          weekLabel: `Week ${index + 1}`,
          dateRangeLabel: `${formatDate(rangeStart, 'short')} – ${formatDate(rangeEnd, 'short')}`,
          totalMinutes: shiftsInWeek.reduce((acc, s) => acc + s.workedMinutes, 0),
          shifts: shiftsInWeek,
        };
      })
      .reverse();

    const totalEarnings = monthShifts.reduce((acc, s) => acc + shiftEarnings(s, workplace), 0);
    const unpaidEarnings = monthShifts
      .filter((s) => s.paymentStatus === 'unpaid')
      .reduce((acc, s) => acc + shiftEarnings(s, workplace), 0);

    result.push({
      monthKey,
      monthLabel,
      totalMinutes: totalMonthMinutes,
      totalEarnings,
      shiftCount: monthShifts.length,
      unpaidMinutes,
      unpaidEarnings,
      weeks,
    });
  });

  // Sort months descending
  return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

/**
 * Generates CSV data content for export
 */
export function generateTimesheetCSV(
  shifts: Shift[],
  workplaces: Workplace[],
  filterLabel: string,
  formatTimeValue: (time: string) => string = formatTime12h,
): string {
  const wpMap = new Map(workplaces.map(w => [w.id, w]));

  const headers = ['Workplace', 'Date', 'Day', 'Start Time', 'End Time', 'Break (min)', 'Worked Hours', 'Status', 'Notes'];

  const rows = shifts.map(shift => {
    const wp = wpMap.get(shift.workplaceId);
    const wpName = wp ? wp.name : 'Unknown';
    const day = formatDate(shift.date, 'dayOfWeek');
    const workedHours = (shift.workedMinutes / 60).toFixed(2);

    return [
      `"${wpName}"`,
      shift.date,
      day,
      formatTimeValue(shift.startTime),
      formatTimeValue(shift.endTime),
      shift.breakMinutes,
      workedHours,
      shift.paymentStatus.toUpperCase(),
      `"${(shift.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  return `# Timesheet Report - ${filterLabel}\n` + [headers.join(','), ...rows].join('\n');
}

/**
 * Formats a Date as YYYY-MM-DD in the device's local timezone
 * (toISOString would use UTC and can return the wrong day in the evening).
 */
export function toLocalDateString(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The date `days` after (or, if negative, before) `dateStr`, as YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return toLocalDateString(new Date(year, month - 1, day + days));
}

/** First day of the week containing `dateStr`. */
export function weekStartOf(dateStr: string, weekStartsOn: UserPreferences['weekStartsOn']): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay(); // 0 = Sunday
  const offset = weekStartsOn === 'monday' ? (weekday + 6) % 7 : weekday;
  return addDays(dateStr, -offset);
}

const MINUTES_PER_DAY = 24 * 60;

/** The shift as a [start, end) interval in minutes since 1970, so overnight shifts compare correctly. */
function shiftInterval(shift: Pick<Shift, 'date' | 'startTime' | 'endTime'>): [number, number] {
  const [year, month, day] = shift.date.split('-').map(Number);
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);

  const start = dayIndex * MINUTES_PER_DAY + startH * 60 + startM;
  let end = dayIndex * MINUTES_PER_DAY + endH * 60 + endM;
  if (end <= start) end += MINUTES_PER_DAY; // finishes after midnight
  return [start, end];
}

/** The first existing shift whose time overlaps `candidate` (ignoring the shift being edited), if any. */
export function findOverlappingShift(
  candidate: Pick<Shift, 'date' | 'startTime' | 'endTime'>,
  existing: Shift[],
  ignoreId?: string,
): Shift | undefined {
  const [start, end] = shiftInterval(candidate);
  return existing.find((other) => {
    if (other.id === ignoreId) return false;
    const [otherStart, otherEnd] = shiftInterval(other);
    return start < otherEnd && otherStart < end;
  });
}

export interface PayBasis {
  workplaceId: string;
  workedMinutes: number;
  /** The rate the shift is (or would be) paid at, already resolved. */
  hourlyRate: number;
}

/** True when an edit changes what a shift should earn: its workplace, hours or rate. */
export function changesPay(before: PayBasis, after: PayBasis): boolean {
  return (
    before.workplaceId !== after.workplaceId ||
    before.workedMinutes !== after.workedMinutes ||
    Math.round(before.hourlyRate * 100) !== Math.round(after.hourlyRate * 100)
  );
}
