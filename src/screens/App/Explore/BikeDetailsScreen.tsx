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
	Image,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Adjust path
import { ExploreStackParamList } from "../../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Adjust path

// --- Dummy Bike Data & Service ---
interface BikeDetail {
	id: string;
	name: string;
	images: string[];
	rating: number;
	reviewCount: number;
	pricePerHour: number;
	currencySymbol?: string;
	tags: string[];
	description: string;
	engine?: string;
	transmission?: string;
}
const DUMMY_BIKE_DETAILS: { [key: string]: BikeDetail } = {
	"1": {
		id: "1",
		name: "Trek Mountain Bike",
		images: [
			"https://via.placeholder.com/400x250.png?text=Bike+1+View+1",
			"https://via.placeholder.com/400x250.png?text=Bike+1+View+2",
		],
		rating: 4.5,
		reviewCount: 128,
		pricePerHour: 75,
		currencySymbol: "₹",
		tags: ["Mountain", "21-Speed", "Disc Brakes"],
		description:
			"An excellent mountain bike for all terrains, featuring a lightweight frame and responsive suspension. Perfect for adventure seekers.",
		engine: "N/A",
		transmission: "Manual",
	},
	"3": {
		id: "3",
		name: "Yamaha MT-07",
		images: [
			"https://via.placeholder.com/400x250.png?text=Yamaha+MT-07+Main",
		],
		rating: 4.9,
		reviewCount: 120,
		pricePerHour: 250,
		currencySymbol: "₹",
		tags: ["Sport", "689cc Engine", "Manual Transmission"],
		description:
			"The Yamaha MT-07 offers an exhilarating riding experience with its powerful 689cc engine and agile handling. Features include ABS braking system, LED lighting, and comfortable ergonomics for longer rides.",
		engine: "689cc",
		transmission: "Manual",
	},
};
const fetchBikeDetails = async (bikeId: string): Promise<BikeDetail | null> => {
	return new Promise((resolve) =>
		setTimeout(() => resolve(DUMMY_BIKE_DETAILS[bikeId] || null), 300)
	);
};
// --- End Dummy Data ---

// --- ImageCarousel Placeholder ---
const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	if (!images || images.length === 0)
		return (
			<View style={styles.imagePlaceholder}>
				<Text>No Image</Text>
			</View>
		);
	// Basic carousel, just shows one image for now
	return (
		<View style={styles.carouselContainer}>
			<Image
				source={{ uri: images[currentIndex] }}
				style={styles.bikeImage}
				resizeMode="cover"
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
// --- End ImageCarousel Placeholder ---

// --- DateTimePickerInputDisplay (Touchable Trigger) ---
const DateTimePickerInputDisplay: React.FC<{
	label: string;
	value: Date | null;
	onPress: () => void;
	placeholder?: string;
}> = ({ label, value, onPress, placeholder = "Select Date & Time" }) => (
	<TouchableOpacity onPress={onPress} style={styles.dateTimePickerButton}>
		<Text style={styles.dateTimePickerLabel}>{label}</Text>
		<Text style={styles.dateTimePickerValue}>
			{value
				? value.toLocaleDateString(undefined, {
						year: "numeric",
						month: "short",
						day: "numeric",
						hour: "2-digit",
						minute: "2-digit",
				  })
				: placeholder}
		</Text>
	</TouchableOpacity>
);
// --- End DateTimePickerInputDisplay ---

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
	const [bike, setBike] = useState<BikeDetail | null>(null);
	const [loading, setLoading] = useState(true);
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
		const loadDetails = async () => {
			setLoading(true);
			const details = await fetchBikeDetails(bikeId);
			setBike(details);
			if (details) {
				navigation.setOptions({ title: details.name });
			}
			setLoading(false);
		};
		loadDetails();
	}, [bikeId, navigation]);

	const totalPrice = useMemo(() => {
		if (bike && startDate && endDate && endDate > startDate) {
			// Bike is checked here
			const hours =
				(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
			return (hours * bike.pricePerHour).toFixed(2);
		}
		return "0.00";
	}, [bike, startDate, endDate]);

	const showDatePicker = (target: "start" | "end") => {
		setCurrentPickerTarget(target);
		setPickerMode("date");
		const initialDate = target === "start" ? startDate : endDate;
		setTempDateHolder(initialDate || new Date()); // Ensure tempDateHolder is a Date object
		setShowPicker(true);
	};

	const onDateTimeChange = (
		event: DateTimePickerEvent,
		selectedDate?: Date
	) => {
		const pickerShouldDismiss =
			Platform.OS !== "ios" || pickerMode === "time"; // iOS 'date' spinner doesn't auto-dismiss on change
		if (event.type === "dismissed" || !selectedDate) {
			setShowPicker(false);
			setTempDateHolder(undefined);
			setCurrentPickerTarget(null);
			return;
		}

		if (pickerMode === "date") {
			setTempDateHolder(selectedDate);
			setPickerMode("time");
			if (Platform.OS !== "ios") {
				// On Android, re-show for time
				setShowPicker(false); // Hide date picker
				setTimeout(() => setShowPicker(true), 0); // Show time picker
			} else {
				setShowPicker(true); // For iOS, spinner can stay for time selection
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
				if (endDate && finalDate >= endDate) setEndDate(null);
			} else if (currentPickerTarget === "end") {
				if (startDate && finalDate <= startDate) {
					Alert.alert(
						"Invalid Date",
						"End date must be after start date."
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
			// Bike is checked here
			Alert.alert(
				"Missing Information",
				"Please select a valid rental period."
			);
			return;
		}
		navigation.navigate("Booking", {
			bikeId: bike.id,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		});
	};

	// ----- GUARDS -----
	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: spacing.s }}>
					Loading bike details...
				</Text>
			</View>
		);
	}

	if (!bike) {
		// This guard is crucial. All code below can assume 'bike' is not null.
		return (
			<View style={styles.centered}>
				<Text>Bike not found.</Text>
			</View>
		);
	}
	// ----- END GUARDS -----

	// After the guards, 'bike' is guaranteed to be 'BikeDetail' type
	return (
		<>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.contentContainer}>
				{/* Use bike.images safely here */}
				<ImageCarousel images={bike.images} />

				<View style={styles.detailsSection}>
					<Text style={styles.bikeName}>{bike.name}</Text>
					<View style={styles.ratingPriceRow}>
						<Text style={styles.ratingText}>
							★ {bike.rating.toFixed(1)} ({bike.reviewCount}{" "}
							reviews)
						</Text>
						<Text style={styles.priceText}>
							{bike.currencySymbol || "₹"}
							{bike.pricePerHour}
							<Text style={styles.priceUnit}>/hour</Text>
						</Text>
					</View>

					<View style={styles.tagsContainer}>
						{bike.tags.map((tag, index) => (
							<View key={index} style={styles.tag}>
								<Text style={styles.tagText}>{tag}</Text>
							</View>
						))}
						{bike.transmission && (
							<View style={styles.tag}>
								<Text style={styles.tagText}>
									{bike.transmission}
								</Text>
							</View>
						)}
						{bike.engine && (
							<View style={styles.tag}>
								<Text style={styles.tagText}>
									{bike.engine}
								</Text>
							</View>
						)}
					</View>

					<Text style={styles.sectionTitle}>About This Bike</Text>
					<Text style={styles.descriptionText}>
						{bike.description}
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
							Total: {bike.currencySymbol || "₹"}
							{totalPrice} (
							{(
								(endDate.getTime() - startDate.getTime()) /
								(1000 * 60 * 60)
							).toFixed(1)}{" "}
							hours)
						</Text>
					)}
				</View>
				<PrimaryButton
					title="Book Now"
					onPress={handleBookNow}
					style={styles.bookNowButton}
					disabled={!startDate || !endDate || !(endDate > startDate)}
				/>
			</ScrollView>

			{showPicker && currentPickerTarget && (
				<DateTimePicker
					value={tempDateHolder || new Date()} // Ensure value is always a Date
					mode={pickerMode}
					is24Hour={false}
					display={Platform.OS === "ios" ? "spinner" : "default"}
					onChange={onDateTimeChange}
					minimumDate={
						currentPickerTarget === "end" && startDate
							? new Date(
									startDate.getTime() + (60 * 60 * 1000 - 1)
							  )
							: new Date(Date.now() - 24 * 60 * 60 * 1000)
					} // Min date for end slightly after start; allow picking today for start
					// For minimumDate on 'start', new Date() means user cannot pick past dates.
					// For 'end', it ensures it's after the start time.
				/>
			)}
		</>
	);
};

// --- Styles (remain largely the same as previously provided) ---
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.backgroundMain || "#FFFFFF" },
	contentContainer: { paddingBottom: spacing.xxl },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	carouselContainer: { backgroundColor: colors.greyLighter || "#E0E0E0" },
	bikeImage: { width: "100%", height: 250 },
	imagePlaceholder: {
		height: 250,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.greyLightest,
	},
	paginationDots: {
		position: "absolute",
		bottom: spacing.s,
		left: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},
	dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 3 },
	dotActive: { backgroundColor: colors.primary || "green" },
	dotInactive: { backgroundColor: colors.greyMedium || "grey" },
	detailsSection: { paddingHorizontal: spacing.m, paddingTop: spacing.l },
	bikeName: {
		fontSize: typography.fontSizes.xxxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	ratingPriceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	ratingText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	priceText: {
		fontSize: typography.fontSizes.xxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.primary,
	},
	priceUnit: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.regular,
		color: colors.textMedium,
	},
	tagsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginBottom: spacing.l,
	},
	tag: {
		backgroundColor: colors.primaryLight || "#E6F7FF",
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.pill || 15,
		marginRight: spacing.s,
		marginBottom: spacing.s,
	},
	tagText: {
		fontSize: typography.fontSizes.s,
		color: colors.primaryDark || colors.primary,
		fontWeight: typography.fontWeights.medium,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginTop: spacing.m,
		marginBottom: spacing.s,
	},
	descriptionText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		lineHeight: typography.lineHeights?.body || 21,
		marginBottom: spacing.m,
	},
	totalPriceText: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginTop: spacing.s,
		marginBottom: spacing.l,
	},
	bookNowButton: {
		marginHorizontal: spacing.m,
		marginTop: spacing.m,
		marginBottom: spacing.m,
	},
	dateTimePickerButton: {
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#DDD",
	},
	dateTimePickerLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		marginBottom: spacing.xs,
	},
	dateTimePickerValue: {
		fontSize: typography.fontSizes.m,
		color: "#0000",
		fontWeight: typography.fontWeights.medium,
	},
});

export default BikeDetailsScreen;
