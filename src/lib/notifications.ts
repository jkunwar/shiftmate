import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';

import { UserPreferences, Workplace } from '@/types';

/**
 * Local reminders driven by the Notifications settings. They're plain weekly notifications scheduled
 * on the device, so they work offline and need no server.
 */

const CHANNEL_ID = 'reminders';

// Expo Go on Android throws as soon as expo-notifications is imported (SDK 53+), so the package is
// only loaded where it can work: iOS, and Android development builds or installed apps.
const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** False on web and in Expo Go on Android; reminders then do nothing. */
export const remindersSupported = Platform.OS !== 'web' && !isExpoGoAndroid;

let Notifications: typeof NotificationsModule | null = null;
if (remindersSupported) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
}

if (Notifications) {
  // Show reminders as a banner even while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export interface ReminderSpec {
  /** 1 = Sunday ... 7 = Saturday, as expo-notifications expects */
  weekday: number;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

interface PlanInput {
  preferences: Pick<
    UserPreferences,
    'shiftReminder' | 'weeklyHoursReminder' | 'unpaidHoursReminder' | 'weekStartsOn'
  >;
  workplaces: Workplace[];
  hasUnpaidShifts: boolean;
}

/** Works out which weekly reminders should exist for the current settings and data. */
export function buildReminderPlan({ preferences, workplaces, hasUnpaidShifts }: PlanInput): ReminderSpec[] {
  const plan: ReminderSpec[] = [];

  // Shift reminder: when a usual shift ends, prompt to log it
  if (preferences.shiftReminder) {
    for (const workplace of workplaces) {
      for (const day of workplace.usualSchedule ?? []) {
        if (!day.active) continue;
        const [hour, minute] = day.endTime.split(':').map(Number);
        if (Number.isNaN(hour) || Number.isNaN(minute)) continue;
        plan.push({
          weekday: day.dayOfWeek + 1, // schedule uses 0 = Sunday
          hour,
          minute,
          title: 'Log your hours',
          body: `Did you work at ${workplace.name} today? Add your shift in ShiftMate.`,
        });
      }
    }
  }

  // Weekly summary: on the last day of the week, in the evening
  if (preferences.weeklyHoursReminder) {
    plan.push({
      weekday: preferences.weekStartsOn === 'monday' ? 1 : 7, // Sunday or Saturday
      hour: 18,
      minute: 0,
      title: 'Your week in review',
      body: 'See how many hours you worked this week and send your timesheet.',
    });
  }

  // Unpaid alert: Friday afternoon, only while there are unpaid hours
  if (preferences.unpaidHoursReminder && hasUnpaidShifts) {
    plan.push({
      weekday: 6,
      hour: 17,
      minute: 0,
      title: 'Unpaid hours',
      body: 'You still have unpaid hours. Check your payments before the weekend.',
    });
  }

  return plan;
}

async function hasPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Asks the system for permission (once); resolves true if reminders can be shown. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  if (await hasPermission()) return true;
  const result = await Notifications.requestPermissionsAsync();
  return (
    result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Replaces every scheduled reminder with the given plan. Does nothing without permission. */
export async function applyReminderPlan(plan: ReminderSpec[]): Promise<void> {
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (plan.length === 0 || !(await hasPermission())) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    for (const reminder of plan) {
      await Notifications.scheduleNotificationAsync({
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: reminder.weekday,
          hour: reminder.hour,
          minute: reminder.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch (error) {
    console.warn('Could not schedule reminders:', error);
  }
}

/** Removes all scheduled reminders (used on sign-out). */
export async function cancelAllReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled
  }
}
