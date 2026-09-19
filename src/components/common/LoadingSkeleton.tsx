import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

interface LoadingSkeletonProps {
  type: 'home' | 'workplaces' | 'worklog' | 'reports';
}

type Tone = 'strong' | 'soft' | 'warning';

interface BoneProps {
  height: number;
  width?: DimensionValue;
  radius?: number;
  tone?: Tone;
  bordered?: boolean;
}

function Bone({ height, width = '100%', radius = 6, tone = 'strong', bordered }: BoneProps) {
  const theme = useTheme();
  const backgroundColor = {
    strong: theme.backgroundSelected,
    soft: theme.backgroundElement,
    warning: theme.warningSoft,
  }[tone];

  return (
    <View
      style={[
        { height, width, borderRadius: radius, backgroundColor },
        bordered && { borderWidth: 1, borderColor: theme.border },
      ]}
    />
  );
}

/** Pulses all of its children together, like Tailwind's `animate-pulse`. */
function Pulse({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(1);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + 8 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  const theme = useTheme();

  if (type === 'home') {
    return (
      <Pulse>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.gapSmall}>
            <Bone height={16} width={96} />
            <Bone height={28} width={176} />
          </View>
          <Bone height={40} width={40} radius={20} />
        </View>

        {/* This week summary card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Bone height={16} width={80} radius={4} />
          <Bone height={36} width={128} />
          <View style={styles.summaryStats}>
            <Bone height={20} width={96} radius={4} />
            <Bone height={20} width={80} radius={4} />
          </View>
        </View>

        {/* Workplace breakdown */}
        <View style={styles.gapMedium}>
          <Bone height={20} width={160} radius={4} />
          <View style={styles.gapSmall}>
            <Bone height={64} radius={12} tone="soft" />
            <Bone height={64} radius={12} tone="soft" />
          </View>
        </View>

        {/* Unpaid card */}
        <Bone height={80} radius={16} tone="warning" />
      </Pulse>
    );
  }

  if (type === 'workplaces') {
    return (
      <Pulse>
        <View style={styles.headerRow}>
          <Bone height={28} width={128} />
          <Bone height={36} width={128} radius={12} />
        </View>
        <View style={styles.gapCards}>
          <Bone height={128} radius={16} tone="soft" bordered />
          <Bone height={128} radius={16} tone="soft" bordered />
          <Bone height={128} radius={16} tone="soft" bordered />
        </View>
      </Pulse>
    );
  }

  if (type === 'worklog') {
    return (
      <Pulse>
        <Bone height={24} width={144} />
        <Bone height={40} radius={12} tone="soft" />
        <Bone height={96} radius={16} tone="soft" />
        <View style={styles.gapSmall}>
          <Bone height={24} width={96} radius={4} />
          <Bone height={80} radius={12} tone="soft" />
          <Bone height={80} radius={12} tone="soft" />
        </View>
      </Pulse>
    );
  }

  return (
    <Pulse>
      <Bone height={28} width={112} />
      <Bone height={48} radius={12} tone="soft" />
      <Bone height={112} radius={16} tone="soft" />
      <View style={styles.gapSmall}>
        <Bone height={64} radius={12} tone="soft" />
        <Bone height={64} radius={12} tone="soft" />
      </View>
    </Pulse>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 4,
  },
  gapSmall: {
    gap: 8,
  },
  gapMedium: {
    gap: 10,
  },
  gapCards: {
    gap: 12,
    paddingTop: 8,
  },
});
