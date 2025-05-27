// src/screens/App/Rentals/EndRideScreen.tsx
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"; // For parent tab navigator
import { CommonActions, RouteProp } from "@react-navigation/native"; // Added NavigationProp
import { StackNavigationProp } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import StarRatingInput  from "../../../components/StarRatingInput";
import PrimaryButton from "../../../components/common/PrimaryButton";
import {
	RentalsStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Data & Service (replace with actual API data) ---
interface RideInProgressSummary {
	bookingId: string;
	bikeName: string;
	bikeImageUrl: string;
	elapsedTime: string;
	distanceTravelled: string;
	currentCost: string;
	dropZoneInfo?: string;
	returnStation?: string;
}

interface FinalRideSummary {
	rentalDuration: string;
	baseFare: string;
	extraTimeCharges?: string;
	totalPaid: string;
	paidVia: string;
}

// Centralized dummy data for consistency
const DUMMY_RIDE_INFO = {
	bookingId: "bk101", // Default, will be overridden by route params
	bikeName: "Royal Enfield Classic 350",
	bikeImageUrl: "https://via.placeholder.com/400x200.png?text=Royal+Enfield",
	elapsedTime: "2:34:15",
	distanceTravelled: "12.5 km",
	currentCost: "₹150",
	dropZoneInfo: "Within Drop Zone",
	returnStation: "Koramangala Return Station",
	finalSummary: {
		rentalDuration: "2 hr 34 min",
		baseFare: "₹120",
		extraTimeCharges: "₹30",
		totalPaid: "₹150",
		paidVia: "UPI (Mock)",
	},
};

const fetchRideInProgressSummary = async (
	bookingId: string,
	bikeNameFromParam?: string
): Promise<RideInProgressSummary | null> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				bookingId,
				bikeName: bikeNameFromParam || DUMMY_RIDE_INFO.bikeName,
				bikeImageUrl: DUMMY_RIDE_INFO.bikeImageUrl,
				elapsedTime: DUMMY_RIDE_INFO.elapsedTime,
				distanceTravelled: DUMMY_RIDE_INFO.distanceTravelled,
				currentCost: DUMMY_RIDE_INFO.currentCost,
				dropZoneInfo: DUMMY_RIDE_INFO.dropZoneInfo,
				returnStation: DUMMY_RIDE_INFO.returnStation,
			});
		}, 300);
	});
};
// --- End Dummy Data ---

type EndRideScreenRouteProp = RouteProp<RentalsStackParamList, "EndRideScreen">;
type EndRideScreenNavigationProp = StackNavigationProp<
	RentalsStackParamList,
	"EndRideScreen"
>;

interface EndRideScreenProps {
	route: EndRideScreenRouteProp;
	navigation: EndRideScreenNavigationProp;
}

const EndRideScreen: React.FC<EndRideScreenProps> = ({ route, navigation }) => {
	const { bookingId, bikeName: passedBikeName } = route.params;

	const [rideSummary, setRideSummary] =
		useState<RideInProgressSummary | null>(null);
	// Initialize finalRideCostSummary with dummy data to prevent undefined access in JSX initially
	const [finalRideCostSummary, setFinalRideCostSummary] =
		useState<FinalRideSummary>(DUMMY_RIDE_INFO.finalSummary);
	const [parkedBikePhotoUri, setParkedBikePhotoUri] = useState<string | null>(
		null
	);
	const [rideRating, setRideRating] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const loadSummary = async () => {
			setIsLoading(true);
			const summary = await fetchRideInProgressSummary(
				bookingId,
				passedBikeName
			);
			setRideSummary(summary);
			// In a real app, finalRideCostSummary might also be fetched here or upon ending.
			// For now, we use a static dummy one or could tie it to DUMMY_RIDE_INFO
			setFinalRideCostSummary(DUMMY_RIDE_INFO.finalSummary);
			setIsLoading(false);
		};
		loadSummary();
	}, [bookingId, passedBikeName]);

	const handleTakePhoto = async () => {
		const permissionResult =
			await ImagePicker.requestCameraPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				"Permission Required",
				"Camera access is required to take a photo."
			);
			return;
		}

		const pickerResult = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.5,
		});

		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			setParkedBikePhotoUri(pickerResult.assets[0].uri);
		}
	};

	const handleGoToMyRentalsAfterSuccess = useCallback(() => {
		// Get the parent Tab navigator's navigation prop
		const parentTabNavigator =
			navigation.getParent<BottomTabNavigationProp<UserTabParamList>>();

		if (parentTabNavigator) {
			// Navigate to the 'RentalsTab', and specify 'MyRentalsScreen'
			parentTabNavigator.navigate("RentalsTab", {
				screen: "MyRentalsScreen",
				params: undefined, // No specific params for MyRentalsScreen here
			});
		}

		// Reset the current RentalsStack so "back" doesn't come here.
		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: "MyRentalsScreen" }],
			})
		);
	}, [navigation]);

	const handleConfirmEndRide = async () => {
		if (!parkedBikePhotoUri) {
			Alert.alert(
				"Photo Required",
				"Please take a photo of the parked bike."
			);
			return;
		}
		if (rideRating === 0) {
			Alert.alert("Rating Required", "Please rate your ride experience.");
			return;
		}

		setIsSubmitting(true);
		console.log("Ending ride:", {
			bookingId,
			parkedBikePhotoUri,
			rideRating,
		});

		// Simulate API call to end ride (upload photo, save rating, update backend)
		await new Promise((resolve) => setTimeout(resolve, 2000));
		// Assume success for now
		setIsSubmitting(false);

		Alert.alert(
			"Ride Ended",
			"Your ride has been successfully ended and recorded!",
			[{ text: "OK", onPress: handleGoToMyRentalsAfterSuccess }]
		);
	};

	if (isLoading || !rideSummary) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: spacing.s }}>
					Loading ride information...
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}>
			
			<View style={styles.card}>
				<Image
					source={{ uri: rideSummary.bikeImageUrl }}
					style={styles.bikeImage}
				/>
				<Text style={styles.bikeName}>{rideSummary.bikeName}</Text>
				<View style={styles.rideStatsRow}>
					<Text style={styles.rideStatItem}>
						🕒 {rideSummary.elapsedTime}
					</Text>
					<Text style={styles.rideStatItem}>
						🛣️ {rideSummary.distanceTravelled}
					</Text>
					<Text style={styles.rideStatItem}>
						💰 {rideSummary.currentCost}
					</Text>
				</View>
			</View>

			
			<View style={styles.card}>
				<View style={styles.mapPlaceholder}>
					<Text style={styles.mapPlaceholderText}>
						Map View Placeholder
					</Text>

				</View>
				{rideSummary.dropZoneInfo && (
					<Text style={styles.mapSubText}>
						✓ {rideSummary.dropZoneInfo}
					</Text>
				)}
				{rideSummary.returnStation && (
					<Text style={styles.mapSubText}>
						📍 {rideSummary.returnStation}
					</Text>
				)}
			</View>

		
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Parked Bike Photo</Text>
				{parkedBikePhotoUri ? (
					<View style={styles.photoPreviewContainer}>
						<Image
							source={{ uri: parkedBikePhotoUri }}
							style={styles.parkedBikePhoto}
						/>
						<TouchableOpacity onPress={handleTakePhoto}>
							<Text style={styles.retakePhotoText}>
								Retake Photo
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<Text style={styles.photoInstructions}>
						Take a photo of the parked bike to end your ride.
					</Text>
				)}
				{!parkedBikePhotoUri && (
					<PrimaryButton
						title="Take Photo"
						onPress={handleTakePhoto}
						style={styles.takePhotoButton}
						iconLeft={<Text>📷 </Text>}
					/>
				)}
			</View>

			{finalRideCostSummary && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Final Ride Summary</Text>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Rental Duration</Text>
						<Text style={styles.summaryValue}>
							{finalRideCostSummary.rentalDuration}
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Base Fare</Text>
						<Text style={styles.summaryValue}>
							{finalRideCostSummary.baseFare}
						</Text>
					</View>
					{finalRideCostSummary.extraTimeCharges && (
						<View style={styles.summaryRow}>
							<Text style={styles.summaryLabel}>
								Extra Time Charges
							</Text>
							<Text style={styles.summaryValue}>
								{finalRideCostSummary.extraTimeCharges}
							</Text>
						</View>
					)}
					<View style={[styles.summaryRow, styles.totalSummaryRow]}>
						<Text
							style={[
								styles.summaryLabel,
								styles.totalSummaryLabel,
							]}>
							Total Paid
						</Text>
						<Text
							style={[
								styles.summaryValue,
								styles.totalSummaryValue,
							]}>
							{finalRideCostSummary.totalPaid}
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Paid via</Text>
						<Text style={styles.summaryValue}>
							{finalRideCostSummary.paidVia}
						</Text>
					</View>
				</View>
			)}

			
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>How was your ride?</Text>
				<StarRatingInput
					rating={rideRating}
					onRatingChange={setRideRating}
					starSize={36} // As per design, stars look large
					containerStyle={styles.ratingInputContainer}
				/>
			</View>

			
			<PrimaryButton
				title={isSubmitting ? "Ending Ride..." : "Confirm & End Ride"}
				onPress={handleConfirmEndRide}
				style={styles.confirmButton}
				disabled={
					isSubmitting || !parkedBikePhotoUri || rideRating === 0
				}
				isLoading={isSubmitting}
			/>

			<TouchableOpacity
				style={styles.helpLinkContainer}
				onPress={() => console.log("Help Pressed")}>
				<Text style={styles.helpLinkText}>Need Help?</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.backgroundMain || "#F4F4F4" },
	contentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	card: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
	},
	bikeImage: {
		width: "100%",
		height: 180,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	bikeName: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.s,
	},
	rideStatsRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: spacing.s,
	},
	rideStatItem: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
	},
	mapPlaceholder: {
		height: 150,
		backgroundColor: colors.greyLighter || "#EAEAEA",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: borderRadius.m,
		marginBottom: spacing.s,
	},
	mapPlaceholderText: { color: colors.textMedium },
	mapSubText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginTop: spacing.xs,
		marginLeft: spacing.xs,
	}, // Added margin
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	photoInstructions: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	takePhotoButton: { marginTop: spacing.s },
	photoPreviewContainer: { alignItems: "center", marginBottom: spacing.m },
	parkedBikePhoto: {
		width: "100%",
		height: 200,
		borderRadius: borderRadius.m,
		marginBottom: spacing.s,
		backgroundColor: colors.greyLighter,
	},
	retakePhotoText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		textDecorationLine: "underline",
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.s,
		borderBottomWidth: 0.5,
		borderBottomColor: colors.borderDefault || "#F0F0F0",
	},
	summaryLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	summaryValue: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	totalSummaryRow: {
		borderTopWidth: 1.5,
		borderTopColor: colors.borderDefault || "#DDD",
		marginTop: spacing.s,
		paddingTop: spacing.s,
		borderBottomWidth: 0,
	},
	totalSummaryLabel: {
		fontWeight: typography.fontWeights.bold,
		fontSize: typography.fontSizes.l,
	},
	totalSummaryValue: {
		fontWeight: typography.fontWeights.bold,
		color: colors.primary,
		fontSize: typography.fontSizes.l,
	},
	ratingInputContainer: {
		justifyContent: "center",
		paddingVertical: spacing.s,
		alignItems: "center",
	},
	confirmButton: { marginTop: spacing.l, marginBottom: spacing.m },
	helpLinkContainer: { alignItems: "center", padding: spacing.s },
	helpLinkText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
	},
});

export default EndRideScreen;
