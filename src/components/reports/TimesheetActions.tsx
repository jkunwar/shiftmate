import React from 'react';
import { Download, Printer, Share2, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TimesheetActionsProps {
  /** Share, CSV and PDF are switched off when there is nothing to export. */
  hasShifts: boolean;
  onShare: () => void;
  onExportCSV: () => void;
  /** Creates and shares the PDF; the PDF buttons only show when this is provided. */
  onPrint?: () => void;
  onClose: () => void;
}

/** The strip along the top of the preview: a title and share, CSV, PDF and close icons. */
export function TimesheetToolbar({
  hasShifts,
  onShare,
  onExportCSV,
  onPrint,
  onClose,
}: TimesheetActionsProps) {
  const theme = useTheme();

  const iconButton = (
    label: string,
    icon: React.ReactNode,
    onPress: () => void,
    disabled = !hasShifts,
  ) => (
    <Pressable
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: theme.backgroundSelected },
        disabled && styles.disabled,
      ]}>
      {icon}
    </Pressable>
  );

  return (
    <View
      style={[
        styles.toolbar,
        { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border },
      ]}>
      <Text numberOfLines={1} style={[styles.toolbarTitle, { color: theme.textSecondary }]}>
        Formal Timesheet Document
      </Text>
      <View style={styles.toolbarActions}>
        {iconButton('Share', <Share2 color={theme.textSecondary} size={16} />, onShare)}
        {iconButton('Export CSV', <Download color={theme.textSecondary} size={16} />, onExportCSV)}
        {onPrint
          ? iconButton('Print timesheet', <Printer color={theme.textSecondary} size={16} />, onPrint)
          : null}
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          hitSlop={4}
          style={styles.iconButton}>
          <X color={theme.textSecondary} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

/** The buttons along the bottom of the preview: export CSV and export PDF. */
export function TimesheetFooter({
  hasShifts,
  onExportCSV,
  onPrint,
}: Pick<TimesheetActionsProps, 'hasShifts' | 'onExportCSV' | 'onPrint'>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.footer, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !hasShifts }}
        disabled={!hasShifts}
        onPress={onExportCSV}
        style={({ pressed }) => [
          styles.footerButton,
          {
            backgroundColor: pressed ? theme.backgroundSelected : theme.surface,
            borderColor: theme.border,
          },
          !hasShifts && styles.disabled,
        ]}>
        <Download color={theme.text} size={14} />
        <Text style={[styles.footerText, { color: theme.text }]}>Export CSV</Text>
      </Pressable>
      {onPrint ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasShifts }}
          disabled={!hasShifts}
          onPress={onPrint}
          style={({ pressed }) => [
            styles.footerButton,
            {
              backgroundColor: pressed ? theme.accentPressed : theme.accent,
              borderColor: 'transparent',
            },
            !hasShifts && styles.disabled,
          ]}>
          <Printer color={theme.onAccent} size={14} />
          <Text style={[styles.footerText, { color: theme.onAccent }]}>Export PDF</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
