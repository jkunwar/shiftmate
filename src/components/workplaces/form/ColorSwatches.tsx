import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { PRESET_COLORS } from '@/utils/workplaceForm';

interface ColorSwatchesProps {
  value: string;
  onChange: (color: string) => void;
}

/** A row of colour dots to pick the workplace's badge colour from. */
export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {PRESET_COLORS.map((color) => {
        const selected = value === color;
        return (
          <Pressable
            key={color}
            accessibilityRole="button"
            accessibilityLabel={`Color ${color}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              selected
                ? { borderColor: theme.text, transform: [{ scale: 1.15 }] }
                : styles.swatchIdle,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  swatchIdle: {
    borderColor: 'transparent',
    opacity: 0.8,
  },
});
