// src/screens/App/Rentals/EndRideScreen.tsx
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CommonActions, RouteProp } from "@react-navigation/native";
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import StarRatingInput from "../../../components/StarRatingInput"; // Assumed to be themed
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import {
	RentalsStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// TODO: Import your actual thunks and types from your ride/booking slice
// Example imports (replace with your actual slice details):
// import {
//  fetchActiveRideSummaryThunk,
//  endRideThunk,
//  clearActiveRideState,
//  RideInProgressSummary, // Define this interface based on your API
//  FinalRideSummary,      // Define this interface based on your API
// } from "../../../store/slices/rideSlice";

// --- Define Interfaces (should match your Redux state/API response) ---
interface RideInProgressSummary {
	bookingId: string;
	bikeName: string;
	bikeImageUrl: string;
	elapsedTime: string; // Consider calculating this on the frontend from a start time
	distanceTravelled: string; // Or number
	currentCost: string; // Or number
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
// --- End Interfaces ---

// --- Placeholder Thunks (Replace with actual imports) ---
const fetchActiveRideSummaryThunk = (bookingId: string) => ({
	type: "ride/fetchActiveSummary/placeholder",
	payload: bookingId,
	// In a real thunk, this would make an API call
	// For now, we'll simulate a delay and then use dummy data structure for the screen
	asyncThunk: async (dispatch: AppDispatch) => {
		dispatch({ type: "ride/fetchActiveSummary/pending" });
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// Simulate fetching data
		const fetchedData: RideInProgressSummary = {
			bookingId,
			bikeName: "Dynamic Explorer Bike",
			bikeImageUrl:
				"https://placehold.co/400x200/1A1A1A/F5F5F5?text=Bike+In+Ride",
			elapsedTime: "1:45:20",
			distanceTravelled: "8.2 km",
			currentCost: "₹120.50",
			dropZoneInfo: "Within Designated Drop Zone",
			returnStation: "Central Park Station A",
		};
		dispatch({
			type: "ride/fetchActiveSummary/fulfilled",
			payload: fetchedData,
		});
		return fetchedData; // For direct use if needed, though selector is preferred
	},
});

const endRideThunk = (payload: {
	bookingId: string;
	photoUri: string;
	rating: number;
}) => ({
	type: "ride/endRide/placeholder",
	payload,
	// This thunk would upload photo, save rating, end ride on backend, and return FinalRideSummary
	asyncThunk: async (dispatch: AppDispatch) => {
		dispatch({ type: "ride/endRide/pending" });
		console.log("Simulating end ride:", payload);
		await new Promise((resolve) => setTimeout(resolve, 2000));
		const finalSummary: FinalRideSummary = {
			// This should come from backend
			rentalDuration: "1 hr 50 min",
			baseFare: "₹100.00",
			extraTimeCharges: "₹25.00",
			totalPaid: "₹125.00",
			paidVia: "Wallet",
		};
		dispatch({ type: "ride/endRide/fulfilled", payload: finalSummary });
		return finalSummary; // Return the final summary
	},
});
// --- End Placeholder Thunks ---

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
	const dispatch = useDispatch<AppDispatch>();

	// TODO: Replace with selectors from your actual ride/booking slice
	const rideSummary = useSelector(
		(state: RootState) =>
			(state as any).ride
				?.activeRideSummary as RideInProgressSummary | null
	);
	const finalRideCostSummary = useSelector(
		(state: RootState) =>
			(state as any).ride?.finalRideSummary as FinalRideSummary | null
	);
	const isLoading = useSelector(
		(state: RootState) => (state as any).ride?.isLoadingSummary as boolean
	);
	const isSubmitting = useSelector(
		(state: RootState) => (state as any).ride?.isEndingRide as boolean
	);
	const error = useSelector(
		(state: RootState) => (state as any).ride?.error as string | null
	);
	// --- End Redux Selectors Placeholder ---

	const [parkedBikePhotoUri, setParkedBikePhotoUri] = useState<string | null>(
		null
	);
	const [rideRating, setRideRating] = useState(0);
	const [showFinalSummary, setShowFinalSummary] = useState(false); // To control when to show final summary

	const bikeImagePlaceholder =
		"https://placehold.co/400x200/1A1A1A/F5F5F5?text=Bike+Image";

	useEffect(() => {
		// @ts-ignore // Placeholder for actual thunk dispatch
		dispatch(fetchActiveRideSummaryThunk(bookingId).asyncThunk(dispatch));
		// TODO: dispatch(clearActiveRideState()); // On unmount if needed
	}, [dispatch, bookingId]);

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
			aspect: [16, 9], // Wider aspect ratio for parked bike photo
			quality: 0.6,
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
		const parentTabNavigator =
			navigation.getParent<BottomTabNavigationProp<UserTabParamList>>();
		if (parentTabNavigator) {
			parentTabNavigator.navigate("RentalsTab" as any, {
				screen: "MyRentalsScreen",
			});
		}
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
			Alert.alert(
				"Rating Required",
				"Please rate your ride experience (1-5 stars)."
			);
			return;
		}

		// @ts-ignore // Placeholder for actual thunk dispatch
		const resultAction = await dispatch(
			endRideThunk({
				bookingId,
				photoUri: parkedBikePhotoUri,
				rating: rideRating,
			}).asyncThunk(dispatch)
		);

		// TODO: Check actual thunk result for success/failure
		// For placeholder, we assume it populates finalRideCostSummary in Redux state
		// and then we set showFinalSummary to true.
		// if (endRideThunk.fulfilled.match(resultAction)) { // If using createAsyncThunk
		if (resultAction) {
			// Placeholder check
			setShowFinalSummary(true);
			// Alert is now shown after final summary is displayed, or removed if not needed.
		} else {
			Alert.alert(
				"End Ride Failed",
				"Could not end your ride. Please try again or contact support."
			);
		}
	};

	if (isLoading && !rideSummary) {
		// Show loader only if no summary yet
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>
					Loading ride information...
				</Text>
			</View>
		);
	}

	if (error) {
		// Display error from Redux
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
						dispatch(
							fetchActiveRideSummaryThunk(bookingId).asyncThunk(
								dispatch
							)
						)
					}
				/>
			</View>
		);
	}

	if (!rideSummary && !isLoading) {
		// If not loading and no summary (e.g. after error or if API returned null)
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="search-off"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.notFoundText}>
					Could not load ride details.
				</Text>
				<PrimaryButton
					title="Go Back"
					onPress={() => navigation.goBack()}
				/>
			</View>
		);
	}

	// If ride ended and final summary is available
	if (showFinalSummary && finalRideCostSummary) {
		return (
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.contentContainer}>
				<View style={styles.iconContainer}>
					<View style={styles.successIconBackground}>
						<MaterialIcons
							name="check-circle"
							size={40}
							color={colors.success}
						/>
					</View>
				</View>
				<Text style={styles.title}>Ride Ended Successfully!</Text>
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Final Bill</Text>
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
				<PrimaryButton
					title="View My Rentals"
					onPress={handleGoToMyRentalsAfterSuccess}
					style={{ marginTop: spacing.l }}
				/>
			</ScrollView>
		);
	}

	// Main content for ending the ride
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled">
			{rideSummary && (
				<View style={styles.card}>
					<Image
						source={{
							uri:
								rideSummary.bikeImageUrl ||
								bikeImagePlaceholder,
						}}
						style={styles.bikeImage}
					/>
					<Text style={styles.bikeName}>
						{rideSummary.bikeName || passedBikeName}
					</Text>
					<View style={styles.rideStatsRow}>
						<View style={styles.rideStatItemContainer}>
							<MaterialIcons
								name="timer"
								size={18}
								color={colors.textSecondary}
								style={styles.rideStatIcon}
							/>
							<Text style={styles.rideStatItem}>
								{rideSummary.elapsedTime}
							</Text>
						</View>
						<View style={styles.rideStatItemContainer}>
							<MaterialIcons
								name="directions-bike"
								size={18}
								color={colors.textSecondary}
								style={styles.rideStatIcon}
							/>
							<Text style={styles.rideStatItem}>
								{rideSummary.distanceTravelled}
							</Text>
						</View>
						<View style={styles.rideStatItemContainer}>
							<MaterialIcons
								name="account-balance-wallet"
								size={18}
								color={colors.textSecondary}
								style={styles.rideStatIcon}
							/>
							<Text style={styles.rideStatItem}>
								{rideSummary.currentCost}
							</Text>
						</View>
					</View>
				</View>
			)}

			{rideSummary?.returnStation && ( // Only show map/dropzone if data exists
				<View style={styles.card}>
					<View style={styles.mapPlaceholder}>
						<MaterialIcons
							name="map"
							size={48}
							color={colors.textPlaceholder}
						/>
						<Text style={styles.mapPlaceholderText}>
							Map View Placeholder
						</Text>
					</View>
					{rideSummary.dropZoneInfo && (
						<Text style={styles.mapSubText}>
							<MaterialIcons
								name="check-circle-outline"
								size={16}
								color={colors.success}
							/>{" "}
							{rideSummary.dropZoneInfo}
						</Text>
					)}
					<Text style={styles.mapSubText}>
						<MaterialIcons
							name="place"
							size={16}
							color={colors.primary}
						/>{" "}
						Return at: {rideSummary.returnStation}
					</Text>
				</View>
			)}

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>
					Upload Parked Bike Photo
				</Text>
				{parkedBikePhotoUri ? (
					<View style={styles.photoPreviewContainer}>
						<Image
							source={{ uri: parkedBikePhotoUri }}
							style={styles.parkedBikePhoto}
						/>
						<TouchableOpacity
							onPress={handleTakePhoto}
							style={styles.retakeButton}>
							<MaterialIcons
								name="camera-alt"
								size={18}
								color={colors.primary}
							/>
							<Text style={styles.retakePhotoText}>
								Retake Photo
							</Text>
						</TouchableOpacity>
					</View>
				) : (
					<Text style={styles.photoInstructions}>
						Please take a clear photo of the bike in its parked
						location to complete your ride.
					</Text>
				)}
				{!parkedBikePhotoUri && (
					<PrimaryButton
						title="Take Photo"
						onPress={handleTakePhoto}
						style={styles.takePhotoButton}
						iconLeft={
							<MaterialIcons
								name="photo-camera"
								size={20}
								color={colors.buttonPrimaryText}
							/>
						}
					/>
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Rate Your Ride</Text>
				<StarRatingInput // Assumed themed or accepts theme props
					rating={rideRating}
					onRatingChange={setRideRating}
					starSize={40} // Larger stars for rating
					containerStyle={styles.ratingInputContainer}
					activeColor={colors.primary}
					inactiveColor={colors.borderDefault}
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
				onPress={() =>
					Alert.alert("Help", "Contact support at support@bikya.com")
				}>
				<MaterialIcons
					name="help-outline"
					size={20}
					color={colors.textLink}
				/>
				<Text style={styles.helpLinkText}>Need Help?</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain,
		paddingHorizontal: spacing.l,
	},
	loadingText: {
		marginTop: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	errorText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	notFoundText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	iconContainer: {
		// For success checkmark after ride ends
		marginBottom: spacing.m,
		marginTop: spacing.xl,
	},
	successIconBackground: {
		width: 80,
		height: 80,
		borderRadius: borderRadius.circle,
		backgroundColor: colors.backgroundCard,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: colors.success,
	},
	title: {
		// For "Ride Ended Successfully"
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.m, // Adjusted margin
	},
	card: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.l, // Increased space between cards
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	bikeImage: {
		width: "100%",
		height: 180,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.borderDefault, // Dark placeholder for image
	},
	bikeName: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.s,
		textAlign: "center",
	},
	rideStatsRow: {
		flexDirection: "row",
		justifyContent: "space-around", // Distribute items evenly
		marginBottom: spacing.s,
		paddingVertical: spacing.s,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: colors.borderDefault,
	},
	rideStatItemContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	rideStatIcon: {
		marginRight: spacing.xs,
	},
	rideStatItem: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	mapPlaceholder: {
		height: 150,
		backgroundColor: colors.backgroundMain, // Slightly different from card for depth
		justifyContent: "center",
		alignItems: "center",
		borderRadius: borderRadius.m,
		marginBottom: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	mapPlaceholderText: {
		color: colors.textPlaceholder, // Muted placeholder text
		fontFamily: typography.primaryRegular,
	},
	mapSubText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginTop: spacing.xs,
		flexDirection: "row",
		alignItems: "center",
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	photoInstructions: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.m,
		paddingHorizontal: spacing.s,
	},
	takePhotoButton: {
		marginTop: spacing.s,
		// PrimaryButton handles its own theme
	},
	photoPreviewContainer: {
		alignItems: "center",
		marginBottom: spacing.m,
	},
	parkedBikePhoto: {
		width: "100%",
		height: 200,
		borderRadius: borderRadius.m,
		marginBottom: spacing.s,
		backgroundColor: colors.borderDefault, // Dark placeholder
	},
	retakeButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.s,
	},
	retakePhotoText: {
		color: colors.textLink, // Use link color
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		marginLeft: spacing.xs,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.s,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
	},
	summaryLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	summaryValue: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
	},
	totalSummaryRow: {
		borderTopWidth: 1.5,
		borderTopColor: colors.borderDefault,
		marginTop: spacing.s,
		paddingTop: spacing.s,
		borderBottomWidth: 0, // No bottom border for the total row
	},
	totalSummaryLabel: {
		fontFamily: typography.primaryBold, // Bold for total label
		fontSize: typography.fontSizes.l,
		color: colors.textPrimary,
	},
	totalSummaryValue: {
		fontFamily: typography.primaryBold, // Bold for total value
		color: colors.primary, // Accent color for total
		fontSize: typography.fontSizes.l,
	},
	ratingInputContainer: {
		justifyContent: "center",
		paddingVertical: spacing.s,
		alignItems: "center",
	},
	confirmButton: {
		marginTop: spacing.l,
		marginBottom: spacing.m,
		// PrimaryButton handles its own theme
	},
	helpLinkContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.s,
		marginTop: spacing.s,
	},
	helpLinkText: {
		color: colors.textLink, // Use theme link color
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		marginLeft: spacing.xs,
	},
});

export default EndRideScreen;
