// theme/typography.ts
import { Platform } from "react-native";
import { colors } from "./colors"; // CORRECTED: Import colors from your theme

// Define your font families (ensure they are linked in your project)
const fontFamilies = {
	// Ensure these string names match exactly how they are registered in your app
	// (iOS: Font Name, Android: filename without extension)
	primaryRegular: Platform.select({ ios: "System", android: "sans-serif" }), // Example using system defaults
	primaryMedium: Platform.select({
		ios: "System-Medium",
		android: "sans-serif-medium",
	}), // Often used for semi-bold weights
	primarySemiBold: Platform.select({
		ios: "System-Semibold",
		android: "sans-serif-medium",
	}),
	primaryBold: Platform.select({
		ios: "System-Bold",
		android: "sans-serif-bold",
	}),
	// If using custom fonts:
	// primaryRegular: 'YourCustomFont-Regular',
	// primaryMedium: 'YourCustomFont-Medium',
	// primarySemiBold: 'YourCustomFont-SemiBold',
	// primaryBold: 'YourCustomFont-Bold',
};

type FontWeightValue =
	| "normal"
	| "bold"
	| "100"
	| "200"
	| "300"
	| "400"
	| "500"
	| "600"
	| "700"
	| "800"
	| "900";

const fontWeights: { [key: string]: FontWeightValue } = {
	regular: "400",
	medium: "500",
	semiBold: "600",
	bold: "700", // 'bold' is also a valid FontWeightValue, but '700' is more explicit
};

const fontSizes = {
	xs: 10,
	s: 12,
	m: 14,
	l: 16,
	xl: 18,
	xxl: 20,
	xxxl: 24,
	// Add more sizes as needed, e.g., for display headings
	xxxxl: 32,
};

const lineHeightsInput = {
	// Define base multipliers
	tight: 1.2,
	body: 1.5, // Common for body text for readability
	heading: 1.3, // Often slightly tighter for headings
};

// Calculate line heights based on font sizes for better maintainability
const lineHeights = {
	// Pre-calculated examples based on common font sizes
	xs: Math.round(fontSizes.xs * lineHeightsInput.body),
	s: Math.round(fontSizes.s * lineHeightsInput.body),
	m: Math.round(fontSizes.m * lineHeightsInput.body),
	l: Math.round(fontSizes.l * lineHeightsInput.body),
	xl: Math.round(fontSizes.xl * lineHeightsInput.heading), // Example for heading
	xxl: Math.round(fontSizes.xxl * lineHeightsInput.heading),
	xxxl: Math.round(fontSizes.xxxl * lineHeightsInput.heading),
	xxxxl: Math.round(fontSizes.xxxxl * lineHeightsInput.heading),

	// Function to get line height for any size dynamically
	getForSize: (
		size: number,
		multiplierKey: keyof typeof lineHeightsInput = "body"
	) => Math.round(size * lineHeightsInput[multiplierKey]),
};

export const typography = {
	fontFamilies,
	fontWeights,
	fontSizes,
	lineHeights, // Now provides pre-calculated and dynamic line heights

	// Predefined text styles - these correctly use the imported 'colors'
	// The actual color (dark/light) will depend on your 'colors.ts' definitions.
	h1: {
		fontFamily: fontFamilies.primaryBold,
		fontSize: fontSizes.xxxxl, // Larger size for H1
		fontWeight: fontWeights.bold,
		lineHeight: lineHeights.xxxxl, // Using pre-calculated
		color: colors.textPrimary, // Uses textPrimary from your theme's colors.ts
	},
	h2: {
		fontFamily: fontFamilies.primaryBold,
		fontSize: fontSizes.xxxl,
		fontWeight: fontWeights.bold,
		lineHeight: lineHeights.xxxl,
		color: colors.textPrimary,
	},
	h3: {
		fontFamily: fontFamilies.primarySemiBold, // Or primaryBold
		fontSize: fontSizes.xxl,
		fontWeight: fontWeights.semiBold, // Or bold
		lineHeight: lineHeights.xxl,
		color: colors.textPrimary,
	},
	h4: {
		fontFamily: fontFamilies.primarySemiBold,
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.semiBold,
		lineHeight: lineHeights.xl,
		color: colors.textPrimary,
	},
	bodyLarge: {
		fontFamily: fontFamilies.primaryRegular,
		fontSize: fontSizes.l,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.l,
		color: colors.textPrimary, // Or textSecondary depending on usage
	},
	bodyMedium: {
		// Common body text
		fontFamily: fontFamilies.primaryRegular,
		fontSize: fontSizes.m,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.m,
		color: colors.textSecondary, // Often secondary for body text
	},
	bodySmall: {
		fontFamily: fontFamilies.primaryRegular,
		fontSize: fontSizes.s,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.s,
		color: colors.textSecondary,
	},
	caption: {
		fontFamily: fontFamilies.primaryRegular,
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.regular,
		lineHeight: lineHeights.xs,
		color: colors.textPlaceholder, // Or a more muted secondary color
	},
	button: {
		// Style for text within buttons
		fontFamily: fontFamilies.primarySemiBold, // Or primaryMedium
		fontSize: fontSizes.m,
		fontWeight: fontWeights.semiBold,
		color: colors.buttonPrimaryText, // Default for primary buttons
	},
	// Add more styles like 'label', 'link', etc. as needed
};
