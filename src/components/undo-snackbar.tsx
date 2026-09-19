import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/lib/app-state';
import { FontSize } from '@/constants/theme';

/** "Shift deleted · Undo" bar shown for a few seconds after a delete. */
export function UndoSnackbar({ bottom }: { bottom: number }) {
  const theme = useTheme();
  const { undo, dismissUndo } = useAppState();

  if (!undo) return null;

  return (
    <View pointerEvents="box-none" style={[styles.layer, { bottom }]}>
      <View
        accessibilityRole="alert"
        style={[styles.bar, { backgroundColor: theme.text }]}>
        <Text numberOfLines={1} style={[styles.message, { color: theme.background }]}>
          {undo.message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo"
          hitSlop={12}
          onPress={() => {
            undo.restore();
            dismissUndo();
          }}>
          <Text style={[styles.action, { color: theme.accent }]}>Undo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bar: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  message: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  action: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
