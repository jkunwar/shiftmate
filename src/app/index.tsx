import { useRouter } from 'expo-router';

import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { PaymentTrackingScreen } from '@/components/screens/PaymentTrackingScreen';
import { ThemedView } from '@/components/themed-view';
import { useAppState } from '@/lib/app-state';

export default function HomeRoute() {
  const router = useRouter();
  const {
    user,
    preferences,
    workplaces,
    shifts,
    setPaymentStatus,
    setActiveWorkplaceId,
    showPaymentTracking,
    setShowPaymentTracking,
    openShiftDetails,
    openAddShift,
    supabaseUser,
    syncNow,
    isInitialLoading,
  } = useAppState();
  const onRefresh = supabaseUser ? syncNow : undefined;

  return (
    <ThemedView style={{ flex: 1 }}>
      {isInitialLoading ? (
        <LoadingSkeleton type="home" />
      ) : showPaymentTracking ? (
        <PaymentTrackingScreen
          workplaces={workplaces}
          shifts={shifts}
          onBack={() => setShowPaymentTracking(false)}
          onUpdateShiftStatus={setPaymentStatus}
          onSelectShift={openShiftDetails}
          onRefresh={onRefresh}
        />
      ) : (
        <HomeScreen
          user={user}
          workplaces={workplaces}
          shifts={shifts}
          onSelectWorkplace={(workplaceId) => {
            setActiveWorkplaceId(workplaceId);
            router.navigate('/workplaces');
          }}
          onOpenPaymentTracking={() => setShowPaymentTracking(true)}
          onViewAllWorkplaces={() => {
            setActiveWorkplaceId(null);
            router.navigate('/workplaces');
          }}
          onSelectShift={openShiftDetails}
          onAddShift={() => openAddShift()}
          weekStartsOn={preferences.weekStartsOn}
          onRefresh={onRefresh}
        />
      )}
    </ThemedView>
  );
}
