import { useEffect } from 'react';
import { AppState } from 'react-native';

import { applyReminderPlan, buildReminderPlan } from '@/lib/notifications';
import { Shift, UserPreferences, Workplace } from '@/types';

/** Keeps the scheduled local notifications in step with the preferences and data. */
export function useReminders(preferences: UserPreferences, workplaces: Workplace[], shifts: Shift[]) {
  // The plan is reduced to a string so the effect only reruns when the reminders actually change
  const reminderPlan = JSON.stringify(
    buildReminderPlan({
      preferences,
      workplaces,
      hasUnpaidShifts: shifts.some((s) => s.paymentStatus === 'unpaid'),
    }),
  );

  useEffect(() => {
    const plan = JSON.parse(reminderPlan);
    void applyReminderPlan(plan);

    // Picks up permission that was granted in the system settings while the app was closed
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void applyReminderPlan(plan);
    });
    return () => appStateSub.remove();
  }, [reminderPlan]);
}
