import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface InlineNoticeProps {
  message: string;
  /** 'error' is red with an icon; 'info' is a quiet grey note. */
  tone?: 'error' | 'info';
}

/** A short message inside a form or sheet. */
export function InlineNotice({ message, tone = 'info' }: InlineNoticeProps) {
  const theme = useTheme();
  const isError = tone === 'error';
  const color = isError ? theme.danger : theme.textSecondary;

  return (
    <View
      style={[
        styles.notice,
        isError
          ? { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` }
          : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      {isError ? <AlertCircle color={color} size={16} /> : null}
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  text: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
