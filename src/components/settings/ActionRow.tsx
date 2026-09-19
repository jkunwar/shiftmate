import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ActionRowProps {
  icon: LucideIcon;
  label: string;
  /** Red styling for actions that destroy data. */
  destructive?: boolean;
  onPress: () => void;
}

/** A tappable row for an action: sync, sign out, delete. */
export function ActionRow({ icon: Icon, label, destructive, onPress }: ActionRowProps) {
  const theme = useTheme();
  const textColor = destructive ? theme.danger : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        destructive
          ? { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}33` }
          : {
              backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
              borderColor: theme.border,
            },
        destructive && pressed && styles.pressed,
      ]}>
      <View style={styles.label}>
        <Icon color={textColor} size={16} />
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </View>
      <ChevronRight color={destructive ? theme.danger : theme.textSecondary} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    flexShrink: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
