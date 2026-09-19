import { Platform } from 'react-native';

export const Colors = {
  // Warm off-white and ink with a muted, brownish terracotta. Terracotta is well away from the red
  // used for danger, so a primary action never looks like a destructive one. Green is only for
  // money and "paid", ochre only for "unpaid".
  light: {
    text: '#292725',
    background: '#F7F5F2',
    backgroundElement: '#EEEAE5',
    backgroundSelected: '#E4DFD9',
    textSecondary: '#706B66',

    surface: '#FFFFFF',
    surfaceSecondary: '#FBFAF8',
    border: '#DDD8D2',
    borderStrong: '#CBC5BE',

    accent: '#9A5B45',
    accentPressed: '#7F4938',
    accentSoft: '#F6ECE8',
    onAccent: '#FFFFFF',

    success: '#28745A',
    successPressed: '#1F5E49',
    successSoft: '#E6F2EC',

    warning: '#9C6200',
    warningPressed: '#7F4E00',
    warningSoft: '#FFF4DC',

    danger: '#B42318',
    dangerPressed: '#912018',
    dangerSoft: '#FDECEA',

    info: '#496F9F',
    infoSoft: '#EEF4FA',

    // The week summary card: a deep warm brown panel
    hero: '#3A3430',
    heroText: '#FFFFFF',
    heroMuted: '#C8C0B8',
    heroChip: '#514943',
    heroPositive: '#A9D5B8',
  },

  dark: {
    text: '#F3F0EC',
    background: '#151311',
    backgroundElement: '#211E1B',
    backgroundSelected: '#2C2824',
    textSecondary: '#A7A09A',

    surface: '#1B1917',
    surfaceSecondary: '#211F1C',
    border: '#332F2B',
    borderStrong: '#443F39',

    accent: '#D0917A',
    accentPressed: '#BE7C65',
    accentSoft: '#33231E',
    // Dark text on the light terracotta reads better than white does
    onAccent: '#1F130E',

    success: '#6BBF9E',
    successPressed: '#57A888',
    successSoft: '#17291F',

    warning: '#E4B45F',
    warningPressed: '#D39D3D',
    warningSoft: '#2B2415',

    danger: '#EF8B82',
    dangerPressed: '#E57268',
    dangerSoft: '#321B19',

    info: '#82A9D3',
    infoSoft: '#192635',

    hero: '#302A27',
    heroText: '#F3F0EC',
    heroMuted: '#BDB4AC',
    heroChip: '#443B36',
    heroPositive: '#91C9A5',
  },
} as const;

export type ThemeColor =
  keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const ScreenTitle = {
  fontSize: 26,
  fontWeight: '700',
  letterSpacing: -0.4,
} as const;

export const SubScreenTitle = {
  fontSize: 21,
  fontWeight: '700',
  letterSpacing: -0.2,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const ComponentSize = {
  buttonHeight: 48,
  buttonHeightSmall: 40,
  inputHeight: 48,
  tabBarHeight: 64,
  iconButton: 44,
  fab: 56,
} as const;

export const Layout = {
  screenHorizontalPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,
  maxContentWidth: 800,
} as const;

export const BottomTabInset = 80;
export const AddButtonRaise = 22;
