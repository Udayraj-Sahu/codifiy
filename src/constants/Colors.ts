// src/theme/colors.ts

// It's good practice to define your palette first
const palette = {
  // Primary Colors
  greenPrimary: '#A0D911', // Your Bikya primary green (confirm exact hex)
  greenDark: '#79A80D',   // A darker shade for presses or variants
  greenLight: '#D3EAA4',  // A lighter shade for disabled or backgrounds

  // Neutral Colors
  black: '#000000',
  greyDarkest: '#1A1A1A', // For very dark text, like main headers
  greyDark: '#333333',    // For general body text, input text
  greyMedium: '#666666',   // For secondary text, labels
  greyLight: '#888888',    // For placeholders, tertiary text
  greyLighter: '#AAAAAA',
  greyLightest: '#DDDDDD', // For borders
  borderFocus: '#CCCCCC',   // Example for focused input border
  backgroundLight: '#F5F5F5',// For disabled inputs or subtle backgrounds
  white: '#FFFFFF',

  // Accent & Status Colors
  error: '#FF3B30',       // iOS-like error red
  warning: '#FF9500',     // iOS-like warning orange
  success: '#34C759',     // iOS-like success green
  info: '#007AFF',        // iOS-like info blue
  starYellow: '#FFD700',   // For star ratings
};

export const colors = {
  primary: palette.greenPrimary,
  primaryDark: palette.greenDark,
  primaryLight: palette.greenLight,
  primaryDisabled: palette.greenLight, // Or a specific grey

  textPrimary: palette.greyDarkest,
  textSecondary: palette.greyDark,
  textTertiary: palette.greyMedium,
  textPlaceholder: palette.greyLight,
  textWhite: palette.white,
  textError: palette.error,
  textLink: palette.greenPrimary,
  textMedium: palette.greenPrimary,

  backgroundMain: palette.white, // Or a very light grey for overall app bg
  backgroundHeader: palette.white,
  backgroundCard: palette.white,
  backgroundDisabled: palette.backgroundLight,

  borderDefault: palette.greyLightest,
  borderInput: palette.greyLightest,
  borderInputFocus: palette.borderFocus, // Or primary color
  borderError: palette.error,

  iconDefault: palette.greyMedium,
  iconPrimary: palette.greenPrimary,
  iconWhite: palette.white,

  // Specifics from components
  buttonPrimaryBackground: palette.greenPrimary,
  buttonPrimaryText: palette.white,
  buttonPrimaryDisabledBackground: palette.greenLight,
  buttonPrimaryDisabledText: palette.greyLight, // Or a muted white

  // ... add more semantic color names as needed
  ...palette, // Optionally spread the raw palette if direct access is sometimes useful
};

export type AppColor = keyof typeof colors;