import { useState } from 'react';

import { Shift, Workplace } from '@/types';

export interface ShiftEditorState {
  isOpen: boolean;
  workplaceId?: string;
  shift: Shift | null;
}

export interface WorkplaceEditorState {
  isOpen: boolean;
  workplace: Workplace | null;
}

/**
 * Drill-down state for the tab screens (which workplace's work log is open on the Workplaces tab,
 * whether Payment Tracking is open on the Home tab) and the global modals rendered by <AppModals />.
 */
export function useModalState() {
  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string | null>(null);
  const [showPaymentTracking, setShowPaymentTracking] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shiftEditor, setShiftEditor] = useState<ShiftEditorState>({ isOpen: false, shift: null });
  const [workplaceEditor, setWorkplaceEditor] = useState<WorkplaceEditorState>({
    isOpen: false,
    workplace: null,
  });

  return {
    activeWorkplaceId,
    setActiveWorkplaceId,
    showPaymentTracking,
    setShowPaymentTracking,

    selectedShift,
    openShiftDetails: setSelectedShift,
    closeShiftDetails: () => setSelectedShift(null),
    shiftEditor,
    openAddShift: (workplaceId?: string) => setShiftEditor({ isOpen: true, workplaceId, shift: null }),
    openEditShift: (shift: Shift) => setShiftEditor({ isOpen: true, shift }),
    closeShiftEditor: () => setShiftEditor({ isOpen: false, shift: null }),
    workplaceEditor,
    openAddWorkplace: () => setWorkplaceEditor({ isOpen: true, workplace: null }),
    openEditWorkplace: (workplace: Workplace) => setWorkplaceEditor({ isOpen: true, workplace }),
    closeWorkplaceEditor: () => setWorkplaceEditor({ isOpen: false, workplace: null }),
  };
}
