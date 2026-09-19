/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f1115',
    background: '#F4F5F7',
    backgroundElement: '#ECEEF2',
    backgroundSelected: '#DFE2E8',
    textSecondary: '#5B616B',
    surface: '#ffffff',
    border: '#DDE1E7',
    accent: '#1a73e0',
    accentPressed: '#1560bd',
    accentSoft: '#E6F0FD',
    onAccent: '#ffffff',
    success: '#047857',
    successSoft: '#D1FAE5',
    danger: '#be123c',
    dangerPressed: '#9f1239',
    dangerSoft: '#FFE4E6',
    warning: '#b45309',
    warningSoft: '#FEF3C7',
  },
  dark: {
    text: '#F3F4F6',
    background: '#0B0C0E',
    backgroundElement: '#1B1D22',
    backgroundSelected: '#2A2D34',
    textSecondary: '#A3A9B3',
    surface: '#15171B',
    border: '#2A2D34',
    accent: '#4DA3FF',
    accentPressed: '#3B8FE8',
    accentSoft: '#10294a',
    // Dark text on the light-blue / green / red fills reads better than white does
    onAccent: '#04121f',
    success: '#34d399',
    successSoft: '#06281f',
    danger: '#fb7185',
    dangerPressed: '#f43f5e',
    dangerSoft: '#3d0f1a',
    warning: '#fbbf24',
    warningSoft: '#3a2606',
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
