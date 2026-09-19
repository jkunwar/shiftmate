import { CloudOff, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AddButtonRaise } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/lib/app-state';

/** Thin strip above the tab bar: shown while offline or while changes are still waiting to reach the cloud. */
export function SyncBanner() {
  const theme = useTheme();
  const { supabaseUser, isOnline, isSyncing, pendingChanges } = useAppState();

  if (!supabaseUser || (isOnline && pendingChanges === 0)) return null;

  const changes = `${pendingChanges} ${pendingChanges === 1 ? 'change' : 'changes'}`;
  const offline = !isOnline;

  const message = offline
    ? pendingChanges > 0
      ? `Offline · ${changes} will sync when you're back online`
      : 'Offline · showing your saved data'
    : isSyncing
      ? `Syncing ${changes}…`
      : `${changes} waiting to sync`;

  const color = offline ? theme.warning : theme.accent;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        { backgroundColor: offline ? theme.warningSoft : theme.accentSoft, borderTopColor: theme.border },
      ]}>
      {offline ? (
        <CloudOff color={color} size={14} />
      ) : isSyncing ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <RefreshCw color={color} size={14} />
      )}
      <Text numberOfLines={1} style={[styles.text, { color }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    // Leaves room for the raised + button to poke up between the banner and the bar
    marginBottom: AddButtonRaise,
  },
  text: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
