import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

/** The title bar of a bottom sheet, with a close button. */
export function SheetHeader({ title, subtitle, onClose }: SheetHeaderProps) {
  const theme = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <View>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
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
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
  },
  closeButton: {
    padding: 8,
    borderRadius: 999,
  },
});
