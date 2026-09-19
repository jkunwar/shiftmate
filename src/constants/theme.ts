/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Warm paper and ink with a denim accent, moss for money, ochre for "unpaid" and brick for danger.
  // Tinted neutrals instead of pure grey keep it from looking like a default UI kit.
  light: {
    text: '#1F1D1A',
    background: '#F5F2EC',
    backgroundElement: '#ECE8DF',
    backgroundSelected: '#E0DBCE',
    textSecondary: '#6A6459',
    surface: '#FCFBF8',
    border: '#E2DDD1',
    accent: '#2F5D8A',
    accentPressed: '#264D73',
    accentSoft: '#E3EBF3',
    onAccent: '#FFFFFF',
    success: '#3D7A4F',
    successSoft: '#E1EEE1',
    danger: '#B23A2E',
    dangerPressed: '#8F2E24',
    dangerSoft: '#F8E3DF',
    warning: '#94590A',
    warningSoft: '#F6EAD2',
    // The week summary card: a deep denim panel in both modes
    hero: '#24384D',
    heroText: '#F5F2EC',
    heroMuted: '#A8B5C3',
    heroChip: '#33495F',
    heroPositive: '#A5D3AF',
  },
  dark: {
    text: '#ECE8DF',
    background: '#151412',
    backgroundElement: '#24221E',
    backgroundSelected: '#302D28',
    textSecondary: '#A39D90',
    surface: '#1D1B18',
    border: '#33302A',
    accent: '#8DB1DA',
    accentPressed: '#79A0CE',
    accentSoft: '#22303F',
    // Dark text on the light accent / moss / brick fills reads better than white does
    onAccent: '#0F1822',
    success: '#8DBE97',
    successSoft: '#1F2D22',
    danger: '#E38B7D',
    dangerPressed: '#D8776A',
    dangerSoft: '#3A211D',
    warning: '#E0B060',
    warningSoft: '#372B16',
    hero: '#243040',
    heroText: '#ECE8DF',
    heroMuted: '#95A4B4',
    heroChip: '#31404F',
    heroPositive: '#8DBE97',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * The type scale. Use these instead of raw numbers so text sizes stay consistent across screens.
 * xs: captions, badges, table labels · sm: secondary text, buttons · md: body and row titles ·
 * lg: section and modal headings · xl: screen headings · xxl: large figures · display: the hero number.
 */
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

/** The heading at the top of each main tab screen, so every tab starts at the same size. */
export const ScreenTitle = {
  fontSize: 26,
  fontWeight: '700',
  letterSpacing: -0.3,
} as const;

/** The title in the header of a screen opened from a tab (Payment Tracking, a workplace's log). */
export const SubScreenTitle = {
  fontSize: 21,
  fontWeight: '700',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = 80;
export const MaxContentWidth = 800;
/** How far the raised + button pokes above the top edge of the tab bar. */
export const AddButtonRaise = 22;
