import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The main action of a workplace's screen: log a shift for it. */
export function AddShiftButton({ workplaceName, onPress }: { workplaceName: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? theme.accentPressed : theme.accent },
      ]}>
      <Plus color={theme.onAccent} size={16} />
      <Text style={[styles.text, { color: theme.onAccent }]}>Add Shift to {workplaceName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  text: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
