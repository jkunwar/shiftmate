import { workplace } from '@/__fixtures__/shifts';
import { buildReminderPlan } from './notifications';

// Only the plan-building logic is tested; keep the native module out of it
jest.mock('expo-notifications', () => ({ setNotificationHandler: jest.fn() }));

const day = (dayOfWeek: number, endTime: string, active = true) => ({
  dayOfWeek,
  dayName: '',
  startTime: '09:00',
  endTime,
  active,
});

const prefs = {
  shiftReminder: true,
  weeklyHoursReminder: true,
  unpaidHoursReminder: true,
  weekStartsOn: 'monday' as const,
};

describe('buildReminderPlan', () => {
  it('schedules a reminder at the end of each active usual shift', () => {
    const plan = buildReminderPlan({
      preferences: { ...prefs, weeklyHoursReminder: false, unpaidHoursReminder: false },
      workplaces: [
        workplace({ name: 'Cafe', usualSchedule: [day(1, '21:00'), day(0, '16:00', false), day(6, '16:30')] }),
      ],
      hasUnpaidShifts: false,
    });

    expect(plan.map((p) => [p.weekday, p.hour, p.minute])).toEqual([
      [2, 21, 0], // Monday (0 = Sunday in the schedule, 1 = Sunday for notifications)
      [7, 16, 30], // Saturday
    ]);
    expect(plan[0].body).toContain('Cafe');
  });

  it('puts the weekly summary on the last day of the week', () => {
    const monday = buildReminderPlan({ preferences: { ...prefs, shiftReminder: false, unpaidHoursReminder: false }, workplaces: [], hasUnpaidShifts: false });
    const sunday = buildReminderPlan({ preferences: { ...prefs, shiftReminder: false, unpaidHoursReminder: false, weekStartsOn: 'sunday' }, workplaces: [], hasUnpaidShifts: false });
    expect(monday[0].weekday).toBe(1); // ends on Sunday
    expect(sunday[0].weekday).toBe(7); // ends on Saturday
  });

  it('only schedules the unpaid alert while there are unpaid shifts', () => {
    const args = { preferences: { ...prefs, shiftReminder: false, weeklyHoursReminder: false }, workplaces: [] };
    expect(buildReminderPlan({ ...args, hasUnpaidShifts: false })).toEqual([]);
    expect(buildReminderPlan({ ...args, hasUnpaidShifts: true })).toHaveLength(1);
  });

  it('schedules nothing when every reminder is off', () => {
    const off = { ...prefs, shiftReminder: false, weeklyHoursReminder: false, unpaidHoursReminder: false };
    expect(buildReminderPlan({ preferences: off, workplaces: [workplace({ usualSchedule: [day(1, '21:00')] })], hasUnpaidShifts: true })).toEqual([]);
  });
});
