import { AlertTriangle } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Dialog } from '@/components/common/Dialog';
import { FormField } from '@/components/common/FormField';
import { InlineNotice } from '@/components/common/InlineNotice';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CONFIRM_WORD = 'DELETE';

interface DeleteAccountModalProps {
  isOpen: boolean;
  /** Deletes the account. Resolves with an error message, or null once it's gone. */
  onDelete: () => Promise<string | null>;
  onClose: () => void;
}

/** Mounted fresh each time it opens, so the typed word and any error start empty. */
const DeleteAccountForm: React.FC<Omit<DeleteAccountModalProps, 'isOpen'>> = ({
  onDelete,
  onClose,
}) => {
  const theme = useTheme();
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const canDelete = typed.trim().toUpperCase() === CONFIRM_WORD && !isDeleting;

  const close = () => {
    if (isDeleting) return;
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    const error = await onDelete();
    setIsDeleting(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    // Success signs the user out, which replaces this whole screen
    onClose();
  };

  return (
    <Dialog onClose={close}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.dangerSoft }]}>
          <AlertTriangle color={theme.danger} size={20} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>Delete your account?</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            This permanently deletes your account and every workplace, shift and payment record. It
            can&apos;t be undone.
          </Text>
        </View>
      </View>

      <FormField label={`Type ${CONFIRM_WORD} to confirm`}>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder={CONFIRM_WORD}
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isDeleting}
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
          ]}
        />
      </FormField>

      {errorMsg ? <InlineNotice tone="error" message={errorMsg} /> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={isDeleting}
          onPress={close}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
          ]}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!canDelete}
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.dangerPressed : theme.danger },
            !canDelete && styles.disabled,
          ]}>
          {isDeleting ? <ActivityIndicator color={theme.onAccent} size="small" /> : null}
          <Text style={[styles.buttonText, styles.deleteText, { color: theme.onAccent }]}>
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </Pressable>
      </View>
    </Dialog>
  );
};

/** Irreversible action, so the user has to type DELETE before the button unlocks. */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <DeleteAccountForm {...props} /> : null;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  headerText: {
    flex: 1,
  },
  iconWrap: {
    padding: 10,
    borderRadius: 12,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: 22,
  },
  message: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  deleteText: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
});
