import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { ReportsScreen } from '@/components/screens/ReportsScreen';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/lib/app-state';

export default function ReportsRoute() {
  const {
    user,
    workplaces,
    shifts,
    preferences,
    openShiftDetails,
    supabaseUser,
    syncNow,
    isInitialLoading,
  } = useAppState();

  return (
    <ThemedView style={{ flex: 1 }}>
      {isInitialLoading ? (
        <LoadingSkeleton type="reports" />
      ) : (
        <ReportsScreen
          user={user}
          workplaces={workplaces}
          shifts={shifts}
          onSelectShift={openShiftDetails}
          weekStartsOn={preferences.weekStartsOn}
          onRefresh={supabaseUser ? syncNow : undefined}
        />
      )}
    </ThemedView>
  );
}
