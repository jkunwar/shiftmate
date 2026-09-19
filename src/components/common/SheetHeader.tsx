import { X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  /** Something before the title, such as a colour dot. */
  leading?: React.ReactNode;
  /** A smaller title, for headings that are a name rather than an action. */
  compact?: boolean;
  onClose: () => void;
}

/** The title bar of a bottom sheet, with a close button. */
export function SheetHeader({ title, subtitle, leading, compact, onClose }: SheetHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View style={styles.heading}>
        {leading}
        <View style={styles.headingText}>
          <Text
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact, { color: theme.text }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={8}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && { backgroundColor: theme.backgroundElement },
        ]}>
        <X color={theme.textSecondary} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  heading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headingText: {
    flexShrink: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: FontSize.md,
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
  },
});
