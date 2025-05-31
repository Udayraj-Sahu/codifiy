// src/screens/App/Explore/BikeDetailsScreen.tsx
import DateTimePicker, {
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // For icons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import { ExploreStackParamList } from "../../../navigation/types";
import { Bike as StoreBike } from "../../../store/slices/adminBikeSlice";
import {
	clearBikeDetails,
	fetchBikeDetailsById,
} from "../../../store/slices/exploreBikeSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Using dark theme colors

interface BikeDetailScreenData extends StoreBike {
	// Screen-specific transformations can be added here if StoreBike isn't sufficient
	// For now, assuming StoreBike has 'rating' and 'reviewCount' or they are handled
}

const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const placeholderImageUri =
		"https://placehold.co/600x400/1A1A1A/F5F5F5?text=No+Bike+Image"; // Dark theme placeholder

	if (!images || images.length === 0) {
		return (
			<View style={styles.imagePlaceholder}>
				<Image
					source={{ uri: placeholderImageUri }}
					style={styles.fallbackImageStyle}
					resizeMode="contain"
				/>
				{/* Optional: Text removed as placeholder image has text */}
			</View>
		);
	}

	// TODO: Implement actual carousel logic (swipe gestures, etc.) if multiple images exist.
	// For now, this shows one image with basic pagination dots.
	// You might want to use a library like react-native-snap-carousel for a full-featured carousel.
	return (
		<View style={styles.carouselContainer}>
			<Image
				source={{ uri: images[currentIndex] || placeholderImageUri }}
				style={styles.bikeImage}
				resizeMode="cover"
				onError={() =>
					console.log(
						"Failed to load carousel image:",
						images[currentIndex]
					)
				}
			/>
			{images.length > 1 && (
				<View style={styles.paginationDots}>
					{images.map((_, index) => (
						<View
							key={index}
							style={[
								styles.dot,
								index === currentIndex
									? styles.dotActive
									: styles.dotInactive,
							]}
						/>
					))}
				</View>
			)}
		</View>
	);
};

const DateTimePickerInputDisplay: React.FC<{
	label: string;
	value: Date | null;
	onPress: () => void;
	placeholder?: string;
}> = ({ label, value, onPress, placeholder = "Select Date & Time" }) => (
	<TouchableOpacity onPress={onPress} style={styles.dateTimePickerButton}>
		<View style={styles.dateTimePickerTextContainer}>
			<Text style={styles.dateTimePickerLabel}>{label}</Text>
			<Text style={styles.dateTimePickerValue}>
				{value
					? value.toLocaleDateString(undefined, {
							year: "numeric",
							month: "short",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
							hour12: true, // Use 12-hour format for readability
					  })
					: placeholder}
			</Text>
		</View>
		<MaterialIcons name="calendar-today" size={20} color={colors.primary} />
	</TouchableOpacity>
);

type BikeDetailsScreenRouteProp = RouteProp<
	ExploreStackParamList,
	"BikeDetails"
>;
type BikeDetailsScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"BikeDetails"
>;

interface BikeDetailsScreenProps {
	route: BikeDetailsScreenRouteProp;
	navigation: BikeDetailsScreenNavigationProp;
}

const BikeDetailsScreen: React.FC<BikeDetailsScreenProps> = ({
	route,
	navigation,
}) => {
	const { bikeId } = route.params;
	const dispatch = useDispatch<AppDispatch>();

	const {
		bikeDetails: bike,
		isLoadingDetails: loading,
		errorDetails: error,
	} = useSelector((state: RootState) => state.exploreBikes);

	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
	const [currentPickerTarget, setCurrentPickerTarget] = useState<
		"start" | "end" | null
	>(null);
	const [tempDateHolder, setTempDateHolder] = useState<Date | undefined>(
		undefined
	);

	useEffect(() => {
		if (bikeId) {
			dispatch(fetchBikeDetailsById(bikeId));
		}
		return () => {
			dispatch(clearBikeDetails());
		};
	}, [dispatch, bikeId]);

	useEffect(() => {
		if (bike) {
			navigation.setOptions({ title: bike.model || "Bike Details" });
		} else {
			navigation.setOptions({ title: "Bike Details" });
		}
	}, [navigation, bike]);

	const totalPrice = useMemo(() => {
		if (bike && startDate && endDate && endDate > startDate) {
			const hours =
				(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
			return (hours * (bike.pricePerHour || 0)).toFixed(2); // Default pricePerHour to 0 if undefined
		}
		return "0.00";
	}, [bike, startDate, endDate]);

	const showDatePicker = (target: "start" | "end") => {
		setCurrentPickerTarget(target);
		setPickerMode("date");
		const initialDate = target === "start" ? startDate : endDate;
		setTempDateHolder(initialDate || new Date()); // Default to now if null
		setShowPicker(true);
	};

	const onDateTimeChange = (
		event: DateTimePickerEvent,
		selectedDate?: Date
	) => {
		if (event.type === "dismissed" || !selectedDate) {
			setShowPicker(false);
			setTempDateHolder(undefined);
			setCurrentPickerTarget(null);
			return;
		}

		if (pickerMode === "date") {
			setTempDateHolder(selectedDate);
			setPickerMode("time");
			// For Android, need to hide and show again to change mode
			if (Platform.OS !== "ios") {
				setShowPicker(false);
				setTimeout(() => setShowPicker(true), 0); // Re-show immediately
			}
		} else if (
			pickerMode === "time" &&
			tempDateHolder &&
			currentPickerTarget
		) {
			const finalDate = new Date(tempDateHolder);
			finalDate.setHours(selectedDate.getHours());
			finalDate.setMinutes(selectedDate.getMinutes());
			finalDate.setSeconds(0);
			finalDate.setMilliseconds(0);

			if (currentPickerTarget === "start") {
				setStartDate(finalDate);
				if (endDate && finalDate >= endDate) {
					setEndDate(null); // Reset end date if it's no longer valid
					Alert.alert(
						"Notice",
						"End date has been cleared as it was before the new start date."
					);
				}
			} else if (currentPickerTarget === "end") {
				if (startDate && finalDate <= startDate) {
					Alert.alert(
						"Invalid Date",
						"End date and time must be after the start date and time."
					);
				} else {
					setEndDate(finalDate);
				}
			}
			setShowPicker(false);
			setTempDateHolder(undefined);
			setCurrentPickerTarget(null);
		}
	};

	const handleBookNow = () => {
		if (!bike || !startDate || !endDate || !(endDate > startDate)) {
			Alert.alert(
				"Missing Information",
				"Please select a valid rental period (start and end date/time)."
			);
			return;
		}
		navigation.navigate("Booking", {
			bikeId: bike._id,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		});
	};

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading bike details...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.error}
				/>
				<Text style={styles.errorText}>Error: {error}</Text>
				<PrimaryButton
					title="Try Again"
					onPress={() =>
						bikeId && dispatch(fetchBikeDetailsById(bikeId))
					}
				/>
			</View>
		);
	}

	if (!bike) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="search-off"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.notFoundText}>Bike not found.</Text>
			</View>
		);
	}

	const displayBike: BikeDetailScreenData = bike;
	const bikeRating =
		typeof displayBike.rating === "number" && !isNaN(displayBike.rating)
			? displayBike.rating
			: (displayBike as any).averageRating; // Fallback for older data structure
	const bikeReviewCount =
		typeof displayBike.reviewCount === "number" &&
		!isNaN(displayBike.reviewCount)
			? displayBike.reviewCount
			: (displayBike as any).numberOfReviews;

	return (
		<>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.contentContainer}>
				<ImageCarousel
					images={displayBike.images?.map((img) => img.url) || []}
				/>

				<View style={styles.detailsSection}>
					<Text style={styles.bikeName}>
						{displayBike.model || "Bike Model N/A"}
					</Text>
					<View style={styles.ratingPriceRow}>
						<View style={styles.ratingContainer}>
							<MaterialIcons
								name="star"
								size={typography.fontSizes.l}
								color={colors.ratingStarColor}
							/>
							<Text style={styles.ratingText}>
								{(typeof bikeRating === "number"
									? bikeRating
									: 0
								).toFixed(1)}
								<Text style={styles.reviewCountText}>
									{" "}
									({bikeReviewCount || 0} reviews)
								</Text>
							</Text>
						</View>
						<Text style={styles.priceText}>
							{displayBike.currencySymbol || "₹"}
							{(displayBike.pricePerHour || 0).toFixed(2)}
							<Text style={styles.priceUnit}>/hr</Text>
						</Text>
					</View>

					{displayBike.category && (
						<View style={styles.tagsContainer}>
							<View style={styles.tag}>
								<Text style={styles.tagText}>
									{displayBike.category}
								</Text>
							</View>
							{/* Add more tags if available, e.g., displayBike.features.map(...) */}
						</View>
					)}

					<Text style={styles.sectionTitle}>About This Bike</Text>
					<Text style={styles.descriptionText}>
						{displayBike.description ||
							"No description available for this bike."}
					</Text>

					<Text style={styles.sectionTitle}>
						Select Rental Period
					</Text>
					<DateTimePickerInputDisplay
						label="Start Date & Time"
						value={startDate}
						onPress={() => showDatePicker("start")}
					/>
					<DateTimePickerInputDisplay
						label="End Date & Time"
						value={endDate}
						onPress={() => showDatePicker("end")}
						placeholder={
							startDate
								? "Select End Date & Time"
								: "Select Start Date first"
						}
					/>

					{startDate && endDate && endDate > startDate && (
						<Text style={styles.totalPriceText}>
							Total: {displayBike.currencySymbol || "₹"}
							{totalPrice} (
							{(
								(endDate.getTime() - startDate.getTime()) /
								(1000 * 60 * 60)
							).toFixed(1)}
							hrs)
						</Text>
					)}
				</View>
			</ScrollView>
			<View style={styles.footer}>
				<PrimaryButton
					title="Proceed to Book"
					onPress={handleBookNow}
					style={styles.bookNowButton}
					disabled={
						!startDate ||
						!endDate ||
						!(endDate > startDate) ||
						!bike.isAvailable
					}
					isLoading={loading} // You might want a separate booking loading state
				/>
				{!bike.isAvailable && (
					<Text style={styles.notAvailableText}>
						This bike is currently unavailable.
					</Text>
				)}
			</View>

			{showPicker && currentPickerTarget && (
				<DateTimePicker
					value={
						tempDateHolder ||
						(currentPickerTarget === "start"
							? startDate
							: endDate) ||
						new Date()
					}
					mode={pickerMode}
					is24Hour={false} // Use AM/PM
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={onDateTimeChange}
					minimumDate={
						currentPickerTarget === "end" && startDate
							? new Date(startDate.getTime() + 5 * 60 * 1000) // End time at least 5 mins after start
							: new Date() // Start date can be from now
					}
					// textColor={Platform.OS === 'ios' ? colors.textPrimary : undefined} // For iOS dark mode picker
					// themeVariant={Platform.OS === 'ios' ? (isDarkMode ? 'dark' : 'light') : undefined} // For iOS dark mode picker
				/>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	contentContainer: {
		paddingBottom: spacing.xxl + spacing.l, // Extra padding for the sticky footer
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain,
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary,
		fontSize: typography.fontSizes.m,
	},
	errorText: {
		color: colors.textError,
		fontSize: typography.fontSizes.m,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	notFoundText: {
		color: colors.textSecondary,
		fontSize: typography.fontSizes.l,
	},
	carouselContainer: {
		backgroundColor: colors.backgroundCard, // Darker background for carousel area
		position: "relative", // For pagination dots
	},
	bikeImage: {
		width: "100%",
		height: Dimensions.get("window").height * 0.35, // Make image larger
	},
	imagePlaceholder: {
		width: "100%",
		height: Dimensions.get("window").height * 0.35,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark placeholder bg
	},
	fallbackImageStyle: {
		width: "80%", // Adjust as needed
		height: "80%",
		// tintColor: colors.textDisabled, // Optional tint for placeholder
	},
	paginationDots: {
		position: "absolute",
		bottom: spacing.m, // Increased bottom spacing
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: borderRadius.circle,
		marginHorizontal: spacing.xs,
	},
	dotActive: { backgroundColor: colors.primary },
	dotInactive: { backgroundColor: colors.textDisabled }, // More muted inactive dot
	detailsSection: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.l,
		backgroundColor: colors.backgroundMain, // Ensure section bg matches screen if needed
	},
	bikeName: {
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.s, // Increased margin
	},
	ratingPriceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.l, // Increased margin
	},
	ratingContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	ratingText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginLeft: spacing.xs,
	},
	reviewCountText: {
		fontSize: typography.fontSizes.s,
		color: colors.textPlaceholder,
	},
	priceText: {
		fontSize: typography.fontSizes.xxl,
		fontFamily: typography.primaryBold,
		color: colors.primary,
	},
	priceUnit: {
		fontSize: typography.fontSizes.m, // Slightly larger unit
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Use secondary for unit
		marginLeft: spacing.xxs,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: spacing.l,
	},
	tag: {
		backgroundColor: colors.backgroundCard, // Use card background for tags
		paddingHorizontal: spacing.m, // More padding
		paddingVertical: spacing.s, // More padding
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		marginBottom: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	tagText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary, // Muted text for tags
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
		marginTop: spacing.l, // Increased margin
		marginBottom: spacing.m,
	},
	descriptionText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		lineHeight: typography.lineHeights.getForSize(
			typography.fontSizes.m,
			"body"
		),
		marginBottom: spacing.l,
	},
	totalPriceText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
		marginTop: spacing.m, // Adjusted margin
		marginBottom: spacing.s,
		textAlign: "right",
	},
	dateTimePickerButton: {
		backgroundColor: colors.backgroundCard, // Dark card background
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		flexDirection: "row", // To align text and icon
		justifyContent: "space-between",
		alignItems: "center",
	},
	dateTimePickerTextContainer: {
		flex: 1, // Allow text to take available space
	},
	dateTimePickerLabel: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // Muted label
		marginBottom: spacing.xs,
	},
	dateTimePickerValue: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
	},
	footer: {
		padding: spacing.m,
		backgroundColor: colors.backgroundCard, // Footer background
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault,
		position: "absolute", // Make footer sticky
		bottom: 0,
		left: 0,
		right: 0,
	},
	bookNowButton: {
		// PrimaryButton handles its own theming.
		// No specific style overrides here unless for layout.
	},
	notAvailableText: {
		color: colors.error,
		textAlign: "center",
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		marginTop: spacing.s,
	},
});

export default BikeDetailsScreen;
