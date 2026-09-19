import { ReportsScreen } from '@/components/screens/ReportsScreen';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/lib/app-state';

export default function ReportsRoute() {
  const { user, workplaces, shifts, preferences, openShiftDetails } = useAppState();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ReportsScreen
        user={user}
        workplaces={workplaces}
        shifts={shifts}
        onSelectShift={openShiftDetails}
        weekStartsOn={preferences.weekStartsOn}
      />
    </ThemedView>
  );
}
