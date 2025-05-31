// components/common/ScreenHeader.tsx
import React from "react";
import {
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Import your theme variables
import { colors, spacing, typography } from "../../theme"; // Adjust path as necessary

interface ScreenHeaderProps {
	title: string;
	showBackButton?: boolean;
	onPressBack?: () => void;
	rightActions?: React.ReactNode; // Optional prop for icons/buttons on the right
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
	title,
	showBackButton,
	onPressBack,
	rightActions,
}) => {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.leftComponent}>
					{showBackButton && (
						<TouchableOpacity
							onPress={onPressBack}
							style={styles.buttonStyle}>
							<MaterialIcons
								name={
									Platform.OS === "ios"
										? "arrow-back-ios"
										: "arrow-back"
								}
								size={24}
								color={colors.iconWhite || colors.textPrimary} // Use themed icon color
							/>
						</TouchableOpacity>
					)}
				</View>
				<View style={styles.titleContainer}>
					<Text style={styles.titleText} numberOfLines={1}>
						{title}
					</Text>
				</View>
				<View style={styles.rightComponent}>{rightActions}</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: colors.backgroundHeader, // THEMED: Header background color
	},
	container: {
		flexDirection: "row",
		alignItems: "center",
		height: Platform.OS === "ios" ? 44 : 56, // Standard header heights
		paddingHorizontal: spacing.s, // Use theme spacing
		// backgroundColor is handled by SafeAreaView
		// borderBottomWidth: StyleSheet.hairlineWidth, // Optional: if you want a border
		// borderBottomColor: colors.borderDefault,    // THEMED: Border color
	},
	leftComponent: {
		width: 50, // Fixed width for the left component (back button)
		alignItems: "flex-start",
		justifyContent: "center",
	},
	buttonStyle: {
		padding: spacing.s, // Use theme spacing for touchable area
	},
	titleContainer: {
		flex: 1, // Allows title to take remaining space and be centered
		alignItems: "center", // Center title horizontally
		justifyContent: "center",
	},
	titleText: {
		fontSize: typography.fontSizes.l, // Use theme typography
		fontFamily: typography.primarySemiBold, // Use theme typography
		color: colors.textPrimary, // THEMED: Header title color
		textAlign: "center",
	},
	rightComponent: {
		width: 50, // Fixed width for right actions, ensures title stays centered
		alignItems: "flex-end",
		justifyContent: "center",
	},
});

export default ScreenHeader;
