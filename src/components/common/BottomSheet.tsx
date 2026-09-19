import React from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Lifts the sheet above the keyboard. Turn off for sheets without text inputs. */
  keyboardAvoiding?: boolean;
  maxWidth?: number;
  maxHeight?: `${number}%`;
}

/** A modal sheet anchored to the bottom of the screen: dimmed backdrop, tap outside to close. */
export function BottomSheet({
  onClose,
  children,
  keyboardAvoiding = true,
  maxWidth = 512,
  maxHeight = '92%',
}: BottomSheetProps) {
  const theme = useTheme();

  const content = (
    <View style={styles.backdrop}>
      {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
      <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { maxWidth, maxHeight, backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        {children}
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
