// src/theme/typography.ts
import { Platform } from 'react-native';
import { colors } from './colors'; // CORRECTED: Import colors

// Define your font families (ensure they are linked in your project)
const fontFamilies = {
  // Ensure these string names match exactly how they are registered in your app (iOS: Font Name, Android: filename without extension)
  primaryRegular: Platform.select({ ios: 'System', android: 'sans-serif' }), // Example using system defaults
  primaryBold: Platform.select({ ios: 'System-Bold', android: 'sans-serif-bold' }),
  primarySemiBold: Platform.select({ ios: 'System-Semibold', android: 'sans-serif-medium' }), // 'sans-serif-medium' is often semibold on Android
  // If using custom fonts:
  // primaryRegular: 'YourCustomFont-Regular',
  // primaryBold: 'YourCustomFont-Bold',
};

type FontWeightValue = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

const fontWeights: { [key: string]: FontWeightValue } = { // More specific type for keys if needed
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700', // 'bold' is also a valid FontWeightValue
};

const fontSizes = {
  xs: 10,
  s: 12,
  m: 14,
  l: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

const lineHeightsInput = { // Define base values
  tight: 1.2,
  body: 1.5,
  heading: 1.3,
};

// Calculate line heights based on font sizes for better maintainability
const lineHeights = {
  tight: fontSizes.m * lineHeightsInput.tight,
  body: fontSizes.m * lineHeightsInput.body,
  heading: fontSizes.xl * lineHeightsInput.heading,
  getForSize: (size: number, multiplier: keyof typeof lineHeightsInput = 'body') => size * lineHeightsInput[multiplier],
};


export const typography = {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  // Predefined text styles (Now with colors imported)
  body: {
    fontFamily: fontFamilies.primaryRegular,
    fontSize: fontSizes.m,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    color: colors.textSecondary, // Now 'colors' is accessible
  },
  h1: {
    fontFamily: fontFamilies.primaryBold,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    // lineHeight: lineHeights.getForSize(fontSizes.xxxl, 'heading'), // Example of dynamic line height
    color: colors.textPrimary, // Now 'colors' is accessible
  },
  // ... etc for h2, h3, label, caption etc.
};