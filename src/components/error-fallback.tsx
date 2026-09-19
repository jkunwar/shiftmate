import { type ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, FontSize, Spacing } from '@/constants/theme';
import { reportError } from '@/lib/error-reporting';

/**
 * Shown instead of a white screen when a render error escapes. It renders above the app's providers,
 * so it reads the device colour scheme directly instead of the theme hooks.
 */
export function ErrorFallback({ error, retry }: ErrorBoundaryProps) {
  const palette = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    reportError(error, 'render');
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: palette.textSecondary }]}>
        ShiftMate hit an unexpected problem. Your shifts are safe. Try again, and restart the app if
        it keeps happening.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: palette.accent },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.buttonLabel, { color: palette.onAccent }]}>Try again</Text>
      </Pressable>

      {/* The real error, so a problem on a device can be reported or debugged without a computer */}
      <Pressable accessibilityRole="button" onPress={() => setShowDetails((shown) => !shown)}>
        <Text style={[styles.detailsToggle, { color: palette.accent }]}>
          {showDetails ? 'Hide details' : 'Show details'}
        </Text>
      </Pressable>
      {showDetails ? (
        <ScrollView
          style={[styles.details, { backgroundColor: palette.backgroundElement }]}
          contentContainerStyle={styles.detailsContent}>
          <Text selectable style={[styles.detailsText, { color: palette.text }]}>
            {error.message}
            {error.stack ? `\n\n${error.stack.split('\n').slice(0, 12).join('\n')}` : ''}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: { fontSize: FontSize.xl, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: FontSize.md, lineHeight: 22, textAlign: 'center' },
  button: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
  buttonLabel: { fontSize: FontSize.md, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  detailsToggle: { fontSize: FontSize.sm, fontWeight: '600' },
  details: { maxHeight: 220, width: '100%', borderRadius: 12 },
  detailsContent: { padding: Spacing.three },
  detailsText: { fontSize: FontSize.xs, lineHeight: 16 },
});
