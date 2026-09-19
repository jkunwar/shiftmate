import { Shift, User, UserPreferences, Workplace } from '@/types';
import { calculateWorkedMinutes, toLocalDateString } from '@/utils/timeCalculations';

/** A date `n` days before today, so the demo data is always recent. */
function daysAgo(n: number): string {
  const now = new Date();
  return toLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
}

export const demoUser: User = {
  id: 'demo-user',
  name: 'Alex Morgan',
  email: 'alex@example.com',
};

export const demoPreferences: UserPreferences = {
  defaultHourlyRate: 18,
  weekStartsOn: 'monday',
  timeFormat: '12h',
  currency: '$',
  darkMode: false,
  shiftReminder: true,
  weeklyHoursReminder: true,
  unpaidHoursReminder: false,
};

export const demoWorkplaces: Workplace[] = [
  { id: 'wp-cafe', name: 'Blue Bottle Cafe', color: '#3E6B99', hourlyRate: 18.5 },
  { id: 'wp-library', name: 'City Library', color: '#5F8A5B', hourlyRate: 16 },
];

function shift(
  id: string,
  workplaceId: string,
  date: string,
  startTime: string,
  endTime: string,
  breakMinutes: number,
  paid: boolean,
): Shift {
  const { workedMinutes } = calculateWorkedMinutes(startTime, endTime, breakMinutes);
  return {
    id,
    workplaceId,
    date,
    startTime,
    endTime,
    breakMinutes,
    workedMinutes,
    paymentStatus: paid ? 'paid' : 'unpaid',
    paidDate: paid ? date : undefined,
  };
}

export const demoShifts: Shift[] = [
  shift('s1', 'wp-cafe', daysAgo(1), '16:00', '21:00', 30, false),
  shift('s2', 'wp-library', daysAgo(2), '10:00', '16:00', 30, false),
  shift('s3', 'wp-cafe', daysAgo(3), '16:00', '21:00', 0, false),
  shift('s4', 'wp-cafe', daysAgo(6), '16:00', '22:00', 30, true),
  shift('s5', 'wp-library', daysAgo(9), '10:00', '16:00', 30, true),
  shift('s6', 'wp-cafe', daysAgo(12), '16:00', '21:00', 0, true),
  shift('s7', 'wp-library', daysAgo(35), '10:00', '15:00', 30, true),
  shift('s8', 'wp-cafe', daysAgo(42), '16:00', '21:00', 0, true),
];

