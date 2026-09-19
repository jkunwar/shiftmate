import React from 'react';

import { AddShiftModal } from '@/components/shifts/AddShiftModal';
import { ShiftDetailsModal } from '@/components/shifts/ShiftDetailsModal';
import { AddWorkplaceModal } from '@/components/workplaces/AddWorkplaceModal';
import { useAppState } from '@/lib/app-state';

/** Modals shared by every tab, driven by the app state. Render once, inside the provider. */
export function AppModals() {
  const {
    preferences,
    workplaces,
    shifts,
    selectedShift,
    closeShiftDetails,
    shiftEditor,
    openEditShift,
    closeShiftEditor,
    workplaceEditor,
    closeWorkplaceEditor,
    addShift,
    updateShift,
    deleteShift,
    setPaymentStatus,
    addWorkplace,
    updateWorkplace,
  } = useAppState();

  // Read the live shift so payment changes show up while the details sheet is open
  const detailsShift = shifts.find((s) => s.id === selectedShift?.id) ?? null;

  return (
    <>
      <ShiftDetailsModal
        isOpen={detailsShift !== null}
        shift={detailsShift}
        workplace={workplaces.find((w) => w.id === detailsShift?.workplaceId)}
        onClose={closeShiftDetails}
        onEdit={(shift) => {
          closeShiftDetails();
          openEditShift(shift);
        }}
        onDelete={deleteShift}
        onTogglePaymentStatus={setPaymentStatus}
      />

      <AddShiftModal
        isOpen={shiftEditor.isOpen}
        initialShift={shiftEditor.shift}
        workplaces={workplaces}
        defaultWorkplaceId={shiftEditor.workplaceId}
        onClose={closeShiftEditor}
        onSave={(shiftData) => {
          if (shiftEditor.shift) updateShift(shiftEditor.shift.id, shiftData);
          else addShift(shiftData);
        }}
      />

      <AddWorkplaceModal
        isOpen={workplaceEditor.isOpen}
        initialWorkplace={workplaceEditor.workplace}
        onClose={closeWorkplaceEditor}
        onSave={(workplaceData) => {
          if (workplaceEditor.workplace) updateWorkplace(workplaceEditor.workplace.id, workplaceData);
          else addWorkplace(workplaceData);
        }}
        defaultHourlyRate={preferences.defaultHourlyRate}
      />
    </>
  );
}
