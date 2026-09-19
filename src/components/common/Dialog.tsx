import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface DialogProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

/** A card centred on a dimmed backdrop; tap outside to close. Mount it only while it is open. */
export function Dialog({ onClose, children, maxWidth = 384 }: DialogProps) {
  const theme = useTheme();

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.backdrop}>
          {/* Tapping outside the card closes it. It is a sibling rather than a parent of the card so it never competes with scrolling inside. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.card,
              { maxWidth, backgroundColor: theme.surface, borderColor: theme.border },
            ]}>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    padding: 20,
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
});
