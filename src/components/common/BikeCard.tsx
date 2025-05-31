// components/BikeCard.tsx
import React from "react";
import {
	GestureResponderEvent,
	Image,
	ImageStyle,
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons"; // Using MaterialIcons
import PrimaryButton from "./PrimaryButton"; // Assuming PrimaryButton is theme-aware

// Import theme constants
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path if your theme file is elsewhere

interface BikeCardProps {
	imageUrl?: string;
	name: string;
	rating?: number;
	reviewCount?: number;
	distanceInKm?: number;
	pricePerHour?: number;
	currencySymbol?: string;
	onPressBookNow: () => void;
	onPressCard: () => void;
	style?: StyleProp<ViewStyle>;
	imageStyle?: StyleProp<ImageStyle>;
}

const BikeCard: React.FC<BikeCardProps> = ({
	imageUrl,
	name,
	rating,
	reviewCount,
	distanceInKm,
	pricePerHour,
	currencySymbol = "₹",
	onPressBookNow,
	onPressCard,
	style,
	imageStyle,
}) => {
	const displayRating =
		typeof rating === "number" && !isNaN(rating)
			? rating.toFixed(1)
			: "N/A";
	const displayReviewCount =
		typeof reviewCount === "number" && !isNaN(reviewCount)
			? reviewCount
			: 0;

	const displayDistance =
		typeof distanceInKm === "number" && !isNaN(distanceInKm)
			? `${distanceInKm.toFixed(1)} km`
			: "N/A";

	const displayPrice =
		typeof pricePerHour === "number" && !isNaN(pricePerHour)
			? pricePerHour.toString()
			: "N/A";

	const placeholderImage =
		"https://placehold.co/600x400/1A1A1A/F5F5F5?text=No+Image";

	return (
		<TouchableOpacity
			style={[styles.cardContainer, style]}
			onPress={onPressCard}
			activeOpacity={0.8}>
			<Image
				source={{ uri: imageUrl || placeholderImage }}
				style={[styles.image, imageStyle]}
				resizeMode="cover"
				onError={() => console.log("Failed to load image:", imageUrl)}
			/>
			<View style={styles.contentContainer}>
				<Text style={styles.nameText} numberOfLines={1}>
					{name || "Unnamed Bike"}
				</Text>

				<View style={styles.row}>
					<Icon
						name="star"
						size={typography.fontSizes.m}
						color={colors.ratingStarColor || colors.primary}
						style={styles.iconStyle}
					/>
					<Text style={styles.detailText}>
						{displayRating} ({displayReviewCount} reviews)
					</Text>
				</View>

				<View style={styles.row}>
					<Icon
						name="location-pin"
						size={typography.fontSizes.m}
						color={colors.iconDefault || colors.textSecondary}
						style={styles.iconStyle}
					/>
					<Text style={styles.detailText}>{displayDistance}</Text>
				</View>

				<View style={styles.priceAndButtonRow}>
					<View style={styles.priceContainer}>
						<Text style={styles.priceAmountText}>
							{currencySymbol}
							{displayPrice}
						</Text>
						<Text style={styles.priceUnitText}>/hr</Text>
					</View>
					<PrimaryButton
						title="Book Now"
						onPress={(event: GestureResponderEvent) => {
							event.stopPropagation();
							onPressBookNow();
						}}
						style={styles.bookNowButton}
						textStyle={styles.bookNowButtonText}
						fullWidth={false} // Important for button to not take full width of its parent if not intended
					/>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		marginBottom: spacing.m,
		shadowColor: colors.shadowColor,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	image: {
		width: "100%",
		height: 150,
		borderTopLeftRadius: borderRadius.l,
		borderTopRightRadius: borderRadius.l,
		backgroundColor: colors.borderDefault,
	},
	contentContainer: {
		padding: spacing.m,
	},
	nameText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.s,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.xs,
	},
	iconStyle: {
		marginRight: spacing.xs,
	},
	detailText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	priceAndButtonRow: {
		flexDirection: "row",
		// justifyContent: 'space-between', // Removed
		alignItems: "center",
		marginTop: spacing.m,
	},
	priceContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		flex: 1, // Added: Allows this to take available space
		marginRight: spacing.s, // Added: Creates a gap before the button
	},
	priceAmountText: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		color: colors.primary,
	},
	priceUnitText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginLeft: spacing.xs / 2,
		marginBottom: spacing.xs / 2,
	},
	bookNowButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		// PrimaryButton should manage its own width based on content if fullWidth={false}
	},
	bookNowButtonText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
	},
});

export default BikeCard;
