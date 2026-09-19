import { AlertTriangle, Trash2 } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const confirmColor = isDestructive ? theme.danger : theme.accent;
  const confirmPressedColor = isDestructive ? theme.dangerPressed : theme.accentPressed;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isDestructive ? theme.dangerSoft : theme.warningSoft },
              ]}>
              {isDestructive ? (
                <Trash2 color={theme.danger} size={20} />
              ) : (
                <AlertTriangle color={theme.warning} size={20} />
              )}
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
              ]}>
              <Text style={[styles.buttonText, { color: theme.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: pressed ? confirmPressedColor : confirmColor },
              ]}>
              <Text style={[styles.buttonText, styles.confirmText, { color: theme.onAccent }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
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
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmText: {
    fontWeight: '600',
  },
});
