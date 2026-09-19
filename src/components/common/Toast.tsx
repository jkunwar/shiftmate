import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A pill at the top of the screen. Renders nothing while `message` is empty. */
export function Toast({ message }: { message: string | null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  if (!message) return null;

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <View style={[styles.toast, { backgroundColor: theme.hero, borderColor: theme.heroChip }]}>
        <Text style={[styles.text, { color: theme.heroText }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    maxWidth: '92%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  text: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
