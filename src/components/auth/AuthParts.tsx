import { Clock, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/auth/auth-ui';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AuthFlow } from '@/hooks/use-auth-flow';

/** The logo and name at the top of every auth screen. */
export function AuthBrand() {
  const theme = useTheme();

  return (
    <View style={styles.brand}>
      <View style={[styles.logo, { backgroundColor: theme.accent }]}>
        <Clock color={theme.onAccent} size={20} strokeWidth={2.5} />
      </View>
      <View>
        <Text style={[styles.brandName, { color: theme.text }]}>ShiftMate</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>Simple. Fast. Accurate.</Text>
      </View>
    </View>
  );
}

/** A step's title with a line of explanation. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();

  return (
    <View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

/** The link error from an email link, the form's error and the success note, when present. */
export function AuthMessages({ flow }: { flow: Pick<AuthFlow, 'linkError' | 'errorMsg' | 'infoMsg'> }) {
  return (
    <>
      {flow.linkError ? <Banner tone="error" message={flow.linkError} /> : null}
      {flow.errorMsg ? <Banner tone="error" message={flow.errorMsg} /> : null}
      {flow.infoMsg ? <Banner tone="success" message={flow.infoMsg} /> : null}
    </>
  );
}

interface ValuePillarProps {
  icon: LucideIcon;
  color: string;
  background: string;
  title: string;
  description: string;
}

/** One selling point on the welcome screen: an icon, a title and a sentence. */
export function ValuePillar({ icon: Icon, color, background, title, description }: ValuePillarProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.pillar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={[styles.pillarIcon, { backgroundColor: background }]}>
        <Icon color={color} size={16} />
      </View>
      <View style={styles.pillarText}>
        <Text style={[styles.pillarTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.pillarDescription, { color: theme.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tagline: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginTop: 4,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pillarIcon: {
    padding: 8,
    borderRadius: 12,
  },
  pillarText: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  pillarDescription: {
    fontSize: FontSize.xs,
  },
});
