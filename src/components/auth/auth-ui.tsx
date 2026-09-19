import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { FontSize } from '@/constants/theme';

export function Field({ label, ...inputProps }: { label: string } & TextInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
        ]}
        {...inputProps}
      />
    </View>
  );
}

export function Banner({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const theme = useTheme();
  const color = tone === 'error' ? theme.danger : theme.success;
  const background = tone === 'error' ? theme.dangerSoft : theme.successSoft;

  return (
    <View style={[styles.banner, { backgroundColor: background, borderColor: `${color}55` }]}>
      <Text style={[styles.bannerText, { color }]}>{message}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  loadingLabel,
  isLoading,
  onPress,
}: {
  label: string;
  loadingLabel?: string;
  isLoading?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: pressed ? theme.accentPressed : theme.accent },
        isLoading && styles.disabled,
      ]}>
      {isLoading ? <ActivityIndicator color={theme.onAccent} size="small" /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>
        {isLoading ? (loadingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.linkButton}>
      <Text style={[styles.linkText, { color: theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  },
  primaryButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.7,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
