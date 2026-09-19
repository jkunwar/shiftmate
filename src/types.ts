export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface UsualScheduleDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  startTime: string; // e.g. "16:00"
  endTime: string;   // e.g. "21:00"
  active: boolean;
}

export interface Workplace {
  id: string;
  name: string;
  address?: string;
  hourlyRate?: number;
  notes?: string;
  color?: string; // semantic tag color
  usualSchedule?: UsualScheduleDay[];
}

export type PaymentStatus = 'paid' | 'unpaid';

export interface Shift {
  id: string;
  workplaceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm format, e.g. "16:00"
  endTime: string;   // HH:mm format, e.g. "21:00"
  breakMinutes: number; // e.g. 30
  /** Pay rate when the shift was logged. Older shifts don't have one and use the workplace's current rate. */
  hourlyRate?: number;
  workedMinutes: number; // calculated
  paymentStatus: PaymentStatus;
  paidDate?: string; // YYYY-MM-DD
  actualPaidAmount?: number;
  notes?: string;
}

export interface WeekGroup {
  weekNumber: number;
  weekLabel: string; // e.g. "Week 1", "Week 2"
  dateRangeLabel: string; // e.g. "Sep 1 - Sep 7"
  totalMinutes: number;
  shifts: Shift[];
}

export interface MonthGroup {
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "September 2026"
  totalMinutes: number;
  totalEarnings: number;
  shiftCount: number;
  unpaidMinutes: number;
  unpaidEarnings: number;
  weeks: WeekGroup[];
}

/** How often the user is paid; 'off' means pay-period filters aren't used. */
export type PayFrequency = 'off' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface UserPreferences {
  defaultHourlyRate: number;
  weekStartsOn: 'monday' | 'sunday';
  timeFormat: '12h' | '24h';
  currency: string; // '$', '€', '£'
  darkMode: boolean;
  shiftReminder: boolean;
  weeklyHoursReminder: boolean;
  unpaidHoursReminder: boolean;
  payFrequency: PayFrequency;
  /** YYYY-MM-DD of a day a pay period started on; weekly, bi-weekly and monthly cycles count from it. */
  payAnchor: string;
}
