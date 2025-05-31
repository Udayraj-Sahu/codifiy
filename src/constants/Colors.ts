// theme/colors.ts (or your chosen path)

export const palette = {
	// Primary Accent (from buttons and branding in the target image)
	primaryBlue: "#5B6CFF", // Indigo/blue used in buttons like "Reserve"
	primaryBlueDark: "#3E4ACC", // Slightly darker shade for presses
	primaryBlueLight: "#AEB7FF", // Lighter shade

	// Base Neutrals from the target image
	black: "#000000",
	darkBackground: "#0A0A0A", // App main background
	cardBackground: "#1A1A1A", // Cards/containers background

	// Text Colors from the target image
	textLight: "#F5F5F5", // Main headings, primary text
	textMedium: "#A0A0A0", // Subtext, labels, secondary details
	textPlaceholderGray: "#888888", // Placeholder text

	// Standard Colors
	white: "#FFFFFF",
	errorRed: "#FF3B30",
	borderGray: "#2A2A2A",
};

export const colors = {
	primary: palette.primaryBlue,
	primaryDark: palette.primaryBlueDark,
	primaryLight: palette.primaryBlueLight,
	primaryDisabled: palette.primaryBlueLight, // Often uses a lighter/desaturated primary

	backgroundMain: palette.darkBackground,
	backgroundHeader: palette.darkBackground, // Header matches main background in image
	backgroundCard: palette.cardBackground, // For UI elements like cards, search bar
	backgroundDisabled: palette.cardBackground, // Or a slightly different shade

	textPrimary: palette.textLight,
	textSecondary: palette.textMedium,
	textPlaceholder: palette.textPlaceholderGray,
	textWhite: palette.white,
	textError: palette.errorRed,
	textLink: palette.primaryBlue, // Links often use the primary color

	borderDefault: palette.borderGray,
	borderInputFocus: palette.primaryBlue,
	borderError: palette.errorRed,

	iconDefault: palette.textMedium, // Default icon color (matches secondary text)
	iconPrimary: palette.primaryBlue, // Icons that are active or primary
	iconWhite: palette.white, // Icons that need to be stark white
	iconPlaceholder: palette.textPlaceholderGray, // Icons in input fields e.g. search icon

	buttonPrimaryBackground: palette.primaryBlue,
	buttonPrimaryText: palette.white,
	buttonPrimaryDisabledBackground: palette.primaryBlueLight, // Or a more greyed out version
	buttonPrimaryDisabledText: palette.textMedium,

	// Specific semantic colors based on usage in the image/components
	ratingStarColor: palette.primaryBlue, // Color for rating stars
	shadowColor: palette.black, // For all shadows (typically black)
	error: "#DC3545", // Bright red for text/icons
	errorMuted: "#4D1A20", // Darker, desaturated red for backgrounds
	info: "#17A2B8",
	// You can continue to alias palette colors directly if needed
	// but semantic names above are preferred for component styling.
	...palette, // Expose raw palette too, if desired for specific cases
};

export type AppColor = keyof typeof colors;
