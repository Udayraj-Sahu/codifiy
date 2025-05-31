// src/screens/App/Rentals/RideDetailsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo } from "react";
import {
	ActivityIndicator, // Added
	Alert,
	Image,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Added
import { useDispatch, useSelector } from "react-redux"; // Added
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed themed
import { RentalsStackParamList } from "../../../navigation/types";
import { AppDispatch, RootState } from "../../../store/store"; // Added
import { borderRadius, colors, spacing, typography } from "../../../theme";

// TODO: Replace with your actual rental/booking slice imports
// Example:
// import {
//  fetchRideDetailsByIdThunk,
//  clearCurrentRideDetails,
//  RideDetail, // This type should come from your slice or a shared types file
//  RideStatus
// } from "../../../store/slices/rentalSlice";

// --- Types (Keep these or import from your slice) ---
type RideStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";

interface RideDetail {
	id: string;
	bikeName: string;
	bikeModelYear?: string;
	bikeImageUrl: string;
	rentalStartDate: string; // ISO String
	rentalEndDate: string; // ISO String
	totalPrice: string;
	status: RideStatus;
	bikeGearType?: string;
	pickupLocation?: string;
	dropoffLocation?: string;
	paymentMethod?: string;
	promoApplied?: string;
	priceBreakdown?: {
		subtotal: number;
		discount?: number;
		taxesAndFees: number;
		total: number;
	};
	// Add other fields your API might return
	// e.g., licensePlate, bikeBrand etc.
}
// --- End Types ---

// --- Placeholder Thunk (Replace with actual import) ---
const fetchRideDetailsByIdThunk = (bookingId: string) => ({
	type: "rentals/fetchRideDetailsById/placeholder",
	payload: bookingId,
	asyncThunk: async (dispatch: AppDispatch) => {
		dispatch({
			type: "rentals/fetchRideDetailsById/pending",
			meta: { arg: bookingId },
		});
		console.log(`Simulating fetch for ride details: ${bookingId}`);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Simulate API response based on bookingId
		const DUMMY_RIDE_DETAILS_SOURCE: { [key: string]: RideDetail } = {
			bk101: {
				id: "bk101",
				bikeName: "Mountain Explorer X3",
				bikeModelYear: "2023",
				bikeImageUrl:
					"https://placehold.co/400x250/1A1A1A/F5F5F5?text=Bike+X3+Dark",
				rentalStartDate: new Date(
					Date.now() - 2 * 24 * 60 * 60 * 1000
				).toISOString(),
				rentalEndDate: new Date(
					Date.now() + 1 * 24 * 60 * 60 * 1000
				).toISOString(),
				totalPrice: "₹4500.00",
				status: "Active",
				bikeGearType: "21-Speed",
				pickupLocation: "Main St. Pickup Point",
				dropoffLocation: "City Center Drop Point",
				paymentMethod: "Visa **** 4321",
				promoApplied: "WELCOME10 (-₹100)",
				priceBreakdown: {
					subtotal: 4000,
					discount: 100,
					taxesAndFees: 600,
					total: 4500,
				},
			},
			bk102: {
				id: "bk102",
				bikeName: "City Commuter Bike",
				bikeModelYear: "2022",
				bikeImageUrl:
					"https://placehold.co/400x250/1A1A1A/F5F5F5?text=Commuter+Dark",
				rentalStartDate: new Date(
					Date.now() + 3 * 24 * 60 * 60 * 1000
				).toISOString(),
				rentalEndDate: new Date(
					Date.now() + 5 * 24 * 60 * 60 * 1000
				).toISOString(),
				totalPrice: "₹1200.00",
				status: "Upcoming",
				bikeGearType: "Single-Speed",
				pickupLocation: "Uptown Station",
				paymentMethod: "Mastercard **** 5678",
				priceBreakdown: {
					subtotal: 1000,
					taxesAndFees: 200,
					total: 1200,
				},
			},
		};
		const fetchedData = DUMMY_RIDE_DETAILS_SOURCE[bookingId] || null;
		if (fetchedData) {
			dispatch({
				type: "rentals/fetchRideDetailsById/fulfilled",
				payload: fetchedData,
				meta: { arg: bookingId },
			});
		} else {
			dispatch({
				type: "rentals/fetchRideDetailsById/rejected",
				error: { message: "Ride not found" },
				meta: { arg: bookingId },
			});
		}
		return fetchedData;
	},
});
// const clearCurrentRideDetails = () => ({ type: 'rentals/clearCurrentRideDetails/placeholder' }); // Placeholder
// --- End Placeholder Thunk ---

type RideDetailsScreenRouteProp = RouteProp<
	RentalsStackParamList,
	"RideDetailsScreen"
>;
type RideDetailsScreenNavigationProp = StackNavigationProp<
	RentalsStackParamList,
	"RideDetailsScreen"
>;

interface RideDetailsScreenProps {
	route: RideDetailsScreenRouteProp;
	navigation: RideDetailsScreenNavigationProp;
}

const getStatusTextStyle = (status: RideStatus): StyleProp<TextStyle> => {
	switch (status) {
		case "Active":
			return styles.statusTextActive;
		case "Upcoming":
			return styles.statusTextUpcoming;
		case "Completed":
			return styles.statusTextCompleted;
		case "Cancelled":
			return styles.statusTextCancelled;
		default:
			return styles.detailItemValueBase;
	}
};
const getStatusIcon = (
	status: RideStatus
): { name: keyof typeof MaterialIcons.glyphMap; color: string } => {
	switch (status) {
		case "Active":
			return { name: "play-circle-filled", color: colors.success };
		case "Upcoming":
			return { name: "event", color: colors.info };
		case "Completed":
			return { name: "check-circle", color: colors.textDisabled }; // Muted for completed
		case "Cancelled":
			return { name: "cancel", color: colors.error };
		default:
			return { name: "help-outline", color: colors.textSecondary };
	}
};

const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({
	route,
	navigation,
}) => {
	const { bookingId } = route.params;
	const dispatch = useDispatch<AppDispatch>();

	// TODO: Replace with actual selectors from your rental/booking slice
	const ride = useSelector(
		(state: RootState) =>
			(state as any).rentals?.currentRideDetails as RideDetail | null
	);
	const loading = useSelector(
		(state: RootState) =>
			(state as any).rentals?.isLoadingRideDetails as boolean
	);
	const error = useSelector(
		(state: RootState) =>
			(state as any).rentals?.errorRideDetails as string | null
	);
	// --- End Redux Selectors Placeholder ---

	const bikeImagePlaceholder =
		"https://placehold.co/400x250/1A1A1A/F5F5F5?text=Bike+Image";

	useEffect(() => {
		if (bookingId) {
			// @ts-ignore // Placeholder for actual thunk dispatch
			dispatch(fetchRideDetailsByIdThunk(bookingId).asyncThunk(dispatch));
		}
		// TODO: return () => dispatch(clearCurrentRideDetails()); // On unmount
	}, [bookingId, dispatch]);

	useEffect(() => {
		if (ride) {
			navigation.setOptions({ title: ride.bikeName || "Ride Details" });
		} else if (!loading) {
			navigation.setOptions({ title: "Ride Details" });
		}
	}, [ride, navigation, loading]);

	const startDate = useMemo(
		() => (ride?.rentalStartDate ? new Date(ride.rentalStartDate) : null),
		[ride]
	);
	const endDate = useMemo(
		() => (ride?.rentalEndDate ? new Date(ride.rentalEndDate) : null),
		[ride]
	);

	const formatDate = (
		date: Date | null,
		includeTime: boolean = true
	): string => {
		if (!date) return "N/A";
		try {
			const options: Intl.DateTimeFormatOptions = {
				year: "numeric",
				month: "short",
				day: "numeric",
			};
			if (includeTime) {
				options.hour = "numeric";
				options.minute = "2-digit";
				options.hour12 = true;
			}
			return date.toLocaleDateString(undefined, options);
		} catch {
			return "Invalid Date";
		}
	};

	const handleEndRide = () => {
		if (ride) {
			navigation.navigate("EndRideScreen", {
				bookingId: ride.id,
				bikeName: ride.bikeName,
			});
		}
	};

	const handleCancelBooking = () => {
		// TODO: Implement cancel booking logic (e.g., dispatch a thunk)
		Alert.alert(
			"Cancel Booking",
			`Are you sure you want to cancel booking #${ride?.id}? This action might be irreversible.`,
			[
				{ text: "Keep Booking", style: "cancel" },
				{
					text: "Yes, Cancel",
					style: "destructive",
					onPress: () =>
						console.log(
							"Booking cancellation confirmed for:",
							ride?.id
						),
				},
			]
		);
	};
	const handleRateRide = () => {
		// TODO: Navigate to a dedicated rating screen or show a modal
		Alert.alert(
			"Rate Ride",
			`Navigate to rating screen for booking #${ride?.id}`
		);
	};

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading ride details...</Text>
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
						bookingId &&
						dispatch(
							fetchRideDetailsByIdThunk(bookingId).asyncThunk(
								dispatch
							)
						)
					}
				/>
			</View>
		);
	}

	if (!ride || !startDate || !endDate) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="search-off"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.notFoundText}>Ride details not found.</Text>
				<PrimaryButton
					title="Go Back"
					onPress={() => navigation.goBack()}
				/>
			</View>
		);
	}

	const renderDetailRow = (
		label: string,
		value?: string | number | null,
		valueStyle?: StyleProp<TextStyle>,
		iconName?: keyof typeof MaterialIcons.glyphMap,
		iconColor?: string
	) => {
		if (value === undefined || value === null || value === "") return null;
		return (
			<View style={styles.detailItemRow}>
				{iconName && (
					<MaterialIcons
						name={iconName}
						size={18}
						color={iconColor || colors.textSecondary}
						style={styles.detailItemIcon}
					/>
				)}
				<Text style={styles.detailItemLabel}>{label}</Text>
				<Text style={[styles.detailItemValueBase, valueStyle]}>
					{value}
				</Text>
			</View>
		);
	};
	const statusIcon = getStatusIcon(ride.status);

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.card}>
				<Image
					source={{ uri: ride.bikeImageUrl || bikeImagePlaceholder }}
					style={styles.bikeImage}
				/>
				<Text style={styles.bikeName}>
					{ride.bikeName}
					{ride.bikeModelYear && (
						<Text style={styles.bikeModelYear}>
							{" "}
							({ride.bikeModelYear})
						</Text>
					)}
				</Text>
				{ride.bikeGearType && (
					<View style={styles.specRow}>
						<MaterialIcons
							name="settings"
							size={16}
							color={colors.textSecondary}
							style={styles.specIcon}
						/>
						<Text style={styles.bikeSpecText}>
							Gear: {ride.bikeGearType}
						</Text>
					</View>
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Booking Details</Text>
				{renderDetailRow("Booking ID", `#${ride.id.toUpperCase()}`)}
				{renderDetailRow(
					"Status",
					ride.status,
					getStatusTextStyle(ride.status),
					statusIcon.name,
					statusIcon.color
				)}
				{renderDetailRow(
					"Start Time",
					formatDate(startDate),
					{},
					"event-available"
				)}
				{renderDetailRow(
					"End Time",
					formatDate(endDate),
					{},
					"event-busy"
				)}
				{renderDetailRow("Pickup", ride.pickupLocation, {}, "place")}
				{renderDetailRow("Drop-off", ride.dropoffLocation, {}, "place")}
			</View>

			{ride.priceBreakdown && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Payment Summary</Text>
					{renderDetailRow(
						"Subtotal",
						`₹${ride.priceBreakdown.subtotal.toFixed(2)}`
					)}
					{ride.priceBreakdown.discount &&
						renderDetailRow(
							"Discount",
							`- ₹${ride.priceBreakdown.discount.toFixed(2)}`,
							styles.discountText
						)}
					{renderDetailRow(
						"Taxes & Fees",
						`₹${ride.priceBreakdown.taxesAndFees.toFixed(2)}`
					)}
					<View style={styles.totalDivider} />
					{renderDetailRow(
						"Total Paid",
						`₹${ride.priceBreakdown.total.toFixed(2)}`,
						styles.totalPaidText
					)}
					{renderDetailRow(
						"Payment Method",
						ride.paymentMethod,
						{},
						"credit-card"
					)}
					{ride.promoApplied &&
						renderDetailRow(
							"Promo Applied",
							ride.promoApplied,
							styles.promoText,
							"local-offer"
						)}
				</View>
			)}

			<View style={styles.actionsContainer}>
				{ride.status === "Active" && (
					<PrimaryButton
						title="End This Ride"
						onPress={handleEndRide}
						style={styles.actionButton}
						iconLeft={
							<MaterialIcons
								name="stop-circle"
								size={20}
								color={colors.buttonPrimaryText}
							/>
						}
					/>
				)}
				{ride.status === "Upcoming" && (
					<PrimaryButton
						title="Cancel Booking"
						onPress={handleCancelBooking}
						style={[styles.actionButton, styles.cancelButton]}
						textStyle={styles.cancelButtonText}
						iconLeft={
							<MaterialIcons
								name="cancel"
								size={20}
								color={colors.error}
							/>
						}
					/>
				)}
				{ride.status === "Completed" && (
					<PrimaryButton
						title="Rate This Ride"
						onPress={handleRateRide}
						style={styles.actionButton}
						iconLeft={
							<MaterialIcons
								name="star-outline"
								size={20}
								color={colors.buttonPrimaryText}
							/>
						}
					/>
				)}
			</View>
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
		padding: spacing.l,
		backgroundColor: colors.backgroundMain,
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
	card: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.l, // Increased space between cards
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	bikeImage: {
		width: "100%",
		height: 200,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.borderDefault, // Dark placeholder for image
	},
	bikeName: {
		fontSize: typography.fontSizes.xxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	bikeModelYear: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	specRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	specIcon: {
		marginRight: spacing.xs,
	},
	bikeSpecText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		paddingBottom: spacing.s, // Add padding for under border
		borderBottomWidth: StyleSheet.hairlineWidth, // Thinner border
		borderBottomColor: colors.borderDefault,
	},
	detailItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.s,
		alignItems: "center", // Align icon with text
	},
	detailItemIcon: {
		marginRight: spacing.m,
	},
	detailItemLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		flex: 1, // Allow label to take space
	},
	detailItemValueBase: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
		textAlign: "right",
		flexShrink: 1, // Allow value to shrink if label is long
	},
	statusTextActive: {
		color: colors.success,
		fontFamily: typography.primaryBold,
	},
	statusTextUpcoming: {
		color: colors.info,
		fontFamily: typography.primaryBold,
	},
	statusTextCompleted: {
		color: colors.textDisabled,
		fontFamily: typography.primaryMedium,
	},
	statusTextCancelled: {
		color: colors.error,
		fontFamily: typography.primaryBold,
	},
	discountText: {
		color: colors.success,
		fontFamily: typography.primaryMedium,
	}, // Green for discount
	promoText: { color: colors.info, fontFamily: typography.primaryMedium }, // Info color for promo
	totalDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.borderDefault,
		marginVertical: spacing.s,
	},
	totalPaidText: {
		color: colors.primary,
		fontFamily: typography.primaryBold,
		fontSize: typography.fontSizes.l, // Make total more prominent
	},
	actionsContainer: {
		marginTop: spacing.l,
	},
	actionButton: {
		marginBottom: spacing.m,
		// PrimaryButton handles its own theming
	},
	cancelButton: {
		// Style for PrimaryButton instance when cancelling
		backgroundColor: colors.backgroundCard, // Use card background for less emphasis
		borderColor: colors.error,
		borderWidth: 1.5,
	},
	cancelButtonText: {
		// For text within cancel PrimaryButton instance
		color: colors.error, // Error color text
		fontFamily: typography.primarySemiBold,
	},
});

export default RideDetailsScreen;
