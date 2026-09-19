import { AlertTriangle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { FontSize } from '@/constants/theme';

const CONFIRM_WORD = 'DELETE';

interface DeleteAccountModalProps {
  isOpen: boolean;
  /** Deletes the account. Resolves with an error message, or null once it's gone. */
  onDelete: () => Promise<string | null>;
  onClose: () => void;
}

/** Irreversible action, so the user has to type DELETE before the button unlocks. */
export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
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
    setTyped('');
    setErrorMsg('');
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
    setTyped('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.backdrop}>
          {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={close} />
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.header}>
              <View style={[styles.iconWrap, { backgroundColor: theme.dangerSoft }]}>
                <AlertTriangle color={theme.danger} size={20} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: theme.text }]}>Delete your account?</Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                  This permanently deletes your account and every workplace, shift and payment
                  record. It can&apos;t be undone.
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>
                Type {CONFIRM_WORD} to confirm
              </Text>
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
            </View>

            {errorMsg ? (
              <View
                style={[
                  styles.banner,
                  { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` },
                ]}>
                <Text style={[styles.bannerText, { color: theme.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

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
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 384,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
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
  field: {
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
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
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
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
