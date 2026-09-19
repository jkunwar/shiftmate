import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';

interface MoneyInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

/** A decimal input with the currency symbol drawn inside its left edge. */
export function MoneyInput({ value, onChangeText, placeholder = '0.00' }: MoneyInputProps) {
  const theme = useTheme();
  const { currency } = useFormat();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.symbol, { color: theme.textSecondary }]}>{currency}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        style={[
          styles.input,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
  },
  symbol: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 14,
    paddingLeft: 30,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
