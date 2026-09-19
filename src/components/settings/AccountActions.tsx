import { LogOut, RefreshCw, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DeleteAccountModal } from '@/components/common/DeleteAccountModal';
import { ActionRow } from '@/components/settings/ActionRow';
import { syncLabel } from '@/utils/settings';

interface AccountActionsProps {
  /** Signed in to a cloud account: shows sync and sign out. */
  isSupabaseConnected: boolean;
  onSyncNow?: () => void;
  pendingChanges: number;
  onSignOut?: () => void;
  /** Permanently deletes the account. Resolves with an error message, or null on success. */
  onDeleteAccount?: () => Promise<string | null>;
  /** Local-only mode (no account): "Delete" resets the on-device data instead. */
  onResetDemoData?: () => void;
}

/** Session and danger-zone actions, kept last and away from everyday settings. */
export function AccountActions({
  isSupabaseConnected,
  onSyncNow,
  pendingChanges,
  onSignOut,
  onDeleteAccount,
  onResetDemoData,
}: AccountActionsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
      <View style={styles.actions}>
        {isSupabaseConnected && onSyncNow ? (
          <ActionRow icon={RefreshCw} label={syncLabel(pendingChanges)} onPress={onSyncNow} />
        ) : null}
        {isSupabaseConnected && onSignOut ? (
          <ActionRow icon={LogOut} label="Sign Out" onPress={onSignOut} />
        ) : null}
        <ActionRow
          icon={Trash2}
          destructive
          label="Delete Account & Records"
          onPress={() => setConfirmingDelete(true)}
        />
      </View>

      {/* With an account: typed confirmation. Local-only mode: plain confirm that resets the device. */}
      {onDeleteAccount ? (
        <DeleteAccountModal
          isOpen={confirmingDelete}
          onDelete={onDeleteAccount}
          onClose={() => setConfirmingDelete(false)}
        />
      ) : (
        <ConfirmationDialog
          isOpen={confirmingDelete}
          title="Erase local data?"
          message="All shifts, workplaces, and timesheet records on this device will be permanently erased."
          confirmLabel="Erase Everything"
          cancelLabel="Cancel"
          isDestructive
          onConfirm={() => {
            setConfirmingDelete(false);
            onResetDemoData?.();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
});
