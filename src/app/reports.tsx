import { useMemo } from 'react';

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

  // Only changes when the pay settings do, so the report's date range isn't recalculated needlessly
  const payPeriod = useMemo(
    () => ({ frequency: preferences.payFrequency, anchor: preferences.payAnchor }),
    [preferences.payFrequency, preferences.payAnchor],
  );

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
          payPeriod={payPeriod}
          onRefresh={supabaseUser ? syncNow : undefined}
        />
      )}
    </ThemedView>
  );
}
