/**
 * Nural design system.
 * Colors come from the illustration set (cream paper, ink navy, amber, terracotta, sage).
 * Use `useTheme()` for colors; Fonts / Spacing / Radius are static.
 */

export const palettes = {
  light: {
    /** Page background */
    background: '#FAF6EE',
    /** Cards and sheets */
    surface: '#FFFDF8',
    /** Slightly recessed areas: inputs, inactive chips */
    surfaceAlt: '#F3ECDD',
    /** Matches the illustrations' paper so images blend into their panel */
    paper: '#F0E2CA',
    text: '#1C2438',
    textSecondary: '#5A6072',
    textMuted: '#8B8778',
    border: '#E7DDC9',
    /** Main call-to-action */
    primary: '#1F2A44',
    onPrimary: '#FAF6EE',
    /** Accent fills (progress, badges) */
    gold: '#C8902E',
    /** Accent that is readable as text on the background */
    goldText: '#8A6014',
    goldSoft: '#F4E6C6',
    terracotta: '#C2603F',
    sage: '#6F9174',
    danger: '#B4452F',
    overlay: 'rgba(28, 36, 56, 0.45)',
  },
  dark: {
    background: '#11141D',
    surface: '#1A1F2D',
    surfaceAlt: '#232A3B',
    paper: '#F0E2CA',
    text: '#F3ECDD',
    textSecondary: '#A9AEBD',
    textMuted: '#7C8294',
    border: '#2B3246',
    primary: '#F3ECDD',
    onPrimary: '#1C2438',
    gold: '#E0AE55',
    goldText: '#E0AE55',
    goldSoft: '#3A3120',
    terracotta: '#D9795A',
    sage: '#8FB394',
    danger: '#E07A63',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColors = { [K in keyof typeof palettes.light]: string };

/** Ink color used on top of illustration paper, in both themes. */
export const PAPER_INK = '#1C2438';

export const Fonts = {
  /** Headings and long-form reading */
  serif: 'Newsreader_400Regular',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  /** Interface text */
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  /** Quranic Arabic */
  arabic: 'Amiri_400Regular',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  /** Horizontal screen padding */
  screen: 20,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Reading text sizes selectable in settings / the reader. */
export const READING_SIZES = [
  { label: 'S', fontSize: 16, lineHeight: 26 },
  { label: 'M', fontSize: 18, lineHeight: 30 },
  { label: 'L', fontSize: 20, lineHeight: 33 },
  { label: 'XL', fontSize: 23, lineHeight: 37 },
] as const;
