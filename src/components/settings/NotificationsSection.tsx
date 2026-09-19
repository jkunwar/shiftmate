import { Bell } from 'lucide-react-native';
import { Switch } from 'react-native';

import { PreferenceRow } from '@/components/settings/PreferenceRow';
import { SectionCard } from '@/components/settings/SectionCard';
import { useTheme } from '@/hooks/use-theme';
import { UserPreferences } from '@/types';

type ReminderKey = 'shiftReminder' | 'weeklyHoursReminder' | 'unpaidHoursReminder';

const REMINDERS: { key: ReminderKey; title: string; description: string }[] = [
  {
    key: 'shiftReminder',
    title: 'Shift Reminders',
    description: 'Prompt to log hours at usual times',
  },
  {
    key: 'weeklyHoursReminder',
    title: 'Weekly Hours Summary',
    description: 'End of week total worked notification',
  },
  {
    key: 'unpaidHoursReminder',
    title: 'Unpaid Hours Alert',
    description: 'Remind when payday is approaching',
  },
];

interface NotificationsSectionProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

/** One switch per kind of reminder. */
export function NotificationsSection({
  preferences,
  onUpdatePreferences,
}: NotificationsSectionProps) {
  const theme = useTheme();

  return (
    <SectionCard icon={Bell} title="Notifications">
      {REMINDERS.map((reminder, index) => (
        <PreferenceRow
          key={reminder.key}
          first={index === 0}
          title={reminder.title}
          description={reminder.description}>
          <Switch
            value={preferences[reminder.key]}
            onValueChange={(enabled) => onUpdatePreferences({ [reminder.key]: enabled })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
            thumbColor="#ffffff"
          />
        </PreferenceRow>
      ))}
    </SectionCard>
  );
}
