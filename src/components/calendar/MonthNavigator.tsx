import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface MonthNavigatorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

/** A card with the month title between previous and next buttons. */
export function MonthNavigator({ label, onPrevious, onNext }: MonthNavigatorProps) {
  const theme = useTheme();
  const pressedStyle = ({ pressed }: { pressed: boolean }) => [
    styles.button,
    pressed && { backgroundColor: theme.backgroundElement },
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        accessibilityLabel="Previous month"
        onPress={onPrevious}
        hitSlop={8}
        style={pressedStyle}>
        <ChevronLeft color={theme.textSecondary} size={20} />
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]}>{label}</Text>
      <Pressable accessibilityLabel="Next month" onPress={onNext} hitSlop={8} style={pressedStyle}>
        <ChevronRight color={theme.textSecondary} size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  button: {
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
