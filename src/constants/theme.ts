import { Platform } from 'react-native';

export const Colors = {
  // Slate blue: calm cool neutrals with a blue accent. Green is only for money and "paid", ochre
  // only for "unpaid" and red only for danger, so each colour keeps a single meaning.
  light: {
    text: '#17202A',
    background: '#F6F8FA',
    backgroundElement: '#EDF1F4',
    backgroundSelected: '#E3E8ED',
    textSecondary: '#66727D',

    surface: '#FFFFFF',
    surfaceSecondary: '#FAFBFC',
    border: '#E1E6EA',
    borderStrong: '#CBD3DA',

    accent: '#356D9A',
    accentPressed: '#2B5A80',
    accentSoft: '#E8F1F7',
    onAccent: '#FFFFFF',

    success: '#347A55',
    successPressed: '#286443',
    successSoft: '#EAF4EE',

    warning: '#A16207',
    warningPressed: '#854D0E',
    warningSoft: '#FFF6E3',

    danger: '#B42318',
    dangerPressed: '#912018',
    dangerSoft: '#FDECEA',

    info: '#356D9A',
    infoSoft: '#E8F1F7',

    // The week summary card: a deep navy panel
    hero: '#243B53',
    heroText: '#FFFFFF',
    heroMuted: '#B8C8D7',
    heroChip: '#304D67',
    heroPositive: '#A8D3B6',
  },

  dark: {
    text: '#F1F5F8',
    background: '#101519',
    backgroundElement: '#192126',
    backgroundSelected: '#252F36',
    textSecondary: '#98A6B1',

    surface: '#161D22',
    surfaceSecondary: '#1C252B',
    border: '#2B353D',
    borderStrong: '#3B474F',

    accent: '#6FA6CF',
    accentPressed: '#5B91BC',
    accentSoft: '#182B39',
    // Dark text on the light accent reads better than white does
    onAccent: '#0E1820',

    success: '#70B88B',
    successPressed: '#5B9F75',
    successSoft: '#18291F',

    warning: '#E4B45F',
    warningPressed: '#D39D3D',
    warningSoft: '#2B2415',

    danger: '#EF8B82',
    dangerPressed: '#E57268',
    dangerSoft: '#321B19',

    info: '#6FA6CF',
    infoSoft: '#182B39',

    hero: '#1F3447',
    heroText: '#F1F5F8',
    heroMuted: '#AFC2D1',
    heroChip: '#29445A',
    heroPositive: '#8FC9A3',
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
