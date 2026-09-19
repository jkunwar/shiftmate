import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { WorkplaceWorkLogScreen } from '@/components/screens/WorkplaceWorkLogScreen';
import { WorkplacesScreen } from '@/components/screens/WorkplacesScreen';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/lib/app-state';

export default function WorkplacesRoute() {
  const {
    preferences,
    workplaces,
    shifts,
    deleteWorkplace,
    activeWorkplaceId,
    setActiveWorkplaceId,
    openShiftDetails,
    openAddShift,
    openAddWorkplace,
    openEditWorkplace,
    supabaseUser,
    syncNow,
    isInitialLoading,
  } = useAppState();
  const onRefresh = supabaseUser ? syncNow : undefined;

  const activeWorkplace = workplaces.find((w) => w.id === activeWorkplaceId);

  return (
    <ThemedView style={{ flex: 1 }}>
      {isInitialLoading ? (
        <LoadingSkeleton type="workplaces" />
      ) : activeWorkplace ? (
        <WorkplaceWorkLogScreen
          // Reset month, view mode and collapsed weeks when switching workplaces
          key={activeWorkplace.id}
          workplace={activeWorkplace}
          shifts={shifts}
          onBack={() => setActiveWorkplaceId(null)}
          onAddShift={openAddShift}
          onSelectShift={openShiftDetails}
          onDeleteWorkplace={deleteWorkplace}
          onEditWorkplace={openEditWorkplace}
          onRefresh={onRefresh}
          weekStartsOn={preferences.weekStartsOn}
        />
      ) : (
        <WorkplacesScreen
          workplaces={workplaces}
          shifts={shifts}
          onSelectWorkplace={setActiveWorkplaceId}
          onAddWorkplace={openAddWorkplace}
          onRefresh={onRefresh}
        />
      )}
    </ThemedView>
  );
}
