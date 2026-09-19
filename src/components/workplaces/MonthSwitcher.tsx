import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MonthSwitcherProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** ‹ September 2026 › with a divider above it. */
export function MonthSwitcher({ label, onPrevious, onNext }: MonthSwitcherProps) {
  const theme = useTheme();

  return (
    <View style={[styles.bar, { borderTopColor: theme.border }]}>
      <Pressable
        accessibilityLabel="Previous month"
        onPress={onPrevious}
        hitSlop={8}
        style={styles.button}>
        <ChevronLeft color={theme.textSecondary} size={16} />
      </Pressable>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable accessibilityLabel="Next month" onPress={onNext} hitSlop={8} style={styles.button}>
        <ChevronRight color={theme.textSecondary} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  button: {
    padding: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
