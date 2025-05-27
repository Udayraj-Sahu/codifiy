// components/ScreenHeader.tsx (Conceptual - Corrected SafeAreaView)
import React from "react";
import {
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // CORRECTED IMPORT
// For icons, you'd typically use a library like react-native-vector-icons
// import Icon from 'react-native-vector-icons/Ionicons'; // Example

// --- Theme constants (Colors, Fonts, Spacing) ---
// (Assuming these are defined as discussed previously)
const Colors = {
	headerBackground: "#FFFFFF",
	textHeader: "#1A1A1A",
	iconDefault: "#4A4A4A",
	borderLight: "#EAEAEA",
};
const Fonts = {
	size: { large: 18 },
	weight: { semiBold: "600" as "600" },
};
const Spacing = { small: 8, medium: 12 };
// --- End Theme constants ---

interface ScreenHeaderProps {
	title: string;
	onPressBack?: () => void;
	showBackButton?: boolean;
	rightActionComponent?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	titleStyle?: StyleProp<TextStyle>;
	backButtonIcon?: React.ReactNode;
	headerLeft?: () => React.ReactNode; // Allow custom left component
	headerRight?: () => React.ReactNode;
	statusBarColor?: string; // This would color the background behind status bar if SafeAreaView allows
	barStyle?: "default" | "light-content" | "dark-content";
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
	title,
	onPressBack,
	showBackButton: explicitShowBackButton,
	rightActionComponent,
	style,
	titleStyle,
	headerLeft,
	headerRight,
	backButtonIcon,
	statusBarColor = Colors.headerBackground, // Default from theme
	// barStyle = 'dark-content', // For StatusBar component
}) => {
	const actualShowBackButton =
		explicitShowBackButton !== undefined
			? explicitShowBackButton
			: !!onPressBack;
	const defaultBackIcon = (
		<Text style={{ fontSize: 24, color: Colors.iconDefault }}>‹</Text>
	);

	return (
		<SafeAreaView
			style={[{ backgroundColor: statusBarColor }, styles.safeArea]} // Apply BG color for notch area
			edges={["top"]} // NOW VALID with react-native-safe-area-context
		>
			<View style={[styles.headerContainer, style]}>
				<View style={styles.leftComponent}>
					{actualShowBackButton && (
						<TouchableOpacity
							onPress={onPressBack}
							style={styles.touchableArea}>
							{backButtonIcon || defaultBackIcon}
						</TouchableOpacity>
					)}
				</View>
				<View style={styles.titleContainer}>
					<Text style={[styles.title, titleStyle]} numberOfLines={1}>
						{title}
					</Text>
				</View>
				<View style={styles.rightComponent}>
					{rightActionComponent}
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		// No specific background needed here if the inner view has it,
		// unless you want the notch area itself to have a different color than content bg
	},
	headerContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: 56,
		paddingHorizontal: Spacing.small,
		backgroundColor: Colors.headerBackground, // Main header background
		borderBottomWidth: 1,
		borderBottomColor: Colors.borderLight,
	},
	leftComponent: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
	},
	titleContainer: { flex: 3, justifyContent: "center", alignItems: "center" },
	title: {
		fontSize: Fonts.size.large,
		fontWeight: Fonts.weight.semiBold,
		color: Colors.textHeader,
	},
	rightComponent: {
		flex: 1,
		justifyContent: "flex-end",
		alignItems: "flex-end",
	},
	touchableArea: { padding: Spacing.small },
});

export default ScreenHeader;
