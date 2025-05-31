// src/screens/App/Rentals/MyRentalsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image, // Added for loading state
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // For potential icons
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks
import PrimaryButton from "../../../components/common/PrimaryButton";
import { RentalsStackParamList } from "../../../navigation/types";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// TODO: Replace with your actual rental slice imports
// Example:
// import {
//  fetchUserRentalsThunk,
//  clearRentals,
//  RentalSummary, // This type should come from your slice or a shared types file
//  RentalStatus,  // This type should come from your slice or a shared types file
// } from "../../../store/slices/rentalSlice";

// --- Types (Keep these or import from your slice) ---
type RentalStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";

interface RentalSummary {
	id: string;
	bikeName: string;
	bikeImageUrl: string;
	rentalStartDate: string; // ISO String
	rentalEndDate: string; // ISO String
	totalPrice: string;
	status: RentalStatus;
	// Potentially add: bookingId (if different from id), bikeModel, etc.
}
// --- End Types ---

// --- Placeholder Thunk (Replace with actual import) ---
const fetchUserRentalsThunk = (filter: RentalStatus | "All") => ({
	type: "rentals/fetchUserRentals/placeholder",
	payload: filter,
	asyncThunk: async (dispatch: AppDispatch) => {
		dispatch({
			type: "rentals/fetchUserRentals/pending",
			meta: { arg: filter },
		});
		console.log(`Simulating fetch for filter: ${filter}`);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// Simulate API response based on filter
		const DUMMY_RENTALS_SOURCE: RentalSummary[] = [
			{
				id: "bk101",
				bikeName: "Mountain Explorer X3",
				bikeImageUrl:
					"https://placehold.co/150x100/1A1A1A/F5F5F5?text=Bike+X3",
				rentalStartDate: new Date(
					Date.now() - 2 * 24 * 60 * 60 * 1000
				).toISOString(),
				rentalEndDate: new Date(
					Date.now() + 1 * 24 * 60 * 60 * 1000
				).toISOString(),
				totalPrice: "₹4500.00",
				status: "Active",
			},
			{
				id: "bk102",
				bikeName: "City Commuter Bike",
				bikeImageUrl:
					"https://placehold.co/150x100/1A1A1A/F5F5F5?text=Commuter",
				rentalStartDate: new Date(
					Date.now() + 3 * 24 * 60 * 60 * 1000
				).toISOString(),
				rentalEndDate: new Date(
					Date.now() + 5 * 24 * 60 * 60 * 1000
				).toISOString(),
				totalPrice: "₹1200.00",
				status: "Upcoming",
			},
			{
				id: "bk103",
				bikeName: "Road Bike Elite",
				bikeImageUrl:
					"https://placehold.co/150x100/1A1A1A/F5F5F5?text=Road+Elite",
				rentalStartDate: new Date(
					Date.now() - 10 * 24 * 60 * 60 * 1000
				).toISOString(),
				rentalEndDate: new Date(
					Date.now() - 8 * 24 * 60 * 60 * 1000
				).toISOString(),
				totalPrice: "₹1800.00",
				status: "Completed",
			},
		];
		const filteredData =
			filter === "All"
				? DUMMY_RENTALS_SOURCE
				: DUMMY_RENTALS_SOURCE.filter((r) => r.status === filter);
		dispatch({
			type: "rentals/fetchUserRentals/fulfilled",
			payload: filteredData,
			meta: { arg: filter },
		});
		return filteredData;
	},
});
const clearRentals = () => ({ type: "rentals/clearRentals/placeholder" }); // Placeholder
// --- End Placeholder Thunk ---

// --- Rental Card Component (Themed) ---
interface RentalCardProps {
	rental: RentalSummary;
	onPressDetails: (bookingId: string) => void;
	onPressEndRide?: (bookingId: string, bikeName: string) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({
	rental,
	onPressDetails,
	onPressEndRide,
}) => {
	const startDate = new Date(rental.rentalStartDate);
	const endDate = new Date(rental.rentalEndDate);
	const bikeImagePlaceholder =
		"https://placehold.co/150x100/1A1A1A/F5F5F5?text=Bike";

	const formatDateRange = () => {
		const options: Intl.DateTimeFormatOptions = {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		};
		try {
			return `${startDate.toLocaleDateString(
				undefined,
				options
			)} - ${endDate.toLocaleDateString(undefined, options)}`;
		} catch (e) {
			return "Invalid Dates";
		}
	};

	const getStatusStyle = (status: RentalStatus) => {
		switch (status) {
			case "Active":
				return styles.statusActive;
			case "Upcoming":
				return styles.statusUpcoming;
			case "Completed":
				return styles.statusCompleted;
			case "Cancelled":
				return styles.statusCancelled;
			default:
				return {};
		}
	};
	const getStatusIcon = (
		status: RentalStatus
	): keyof typeof MaterialIcons.glyphMap | null => {
		switch (status) {
			case "Active":
				return "play-circle-filled";
			case "Upcoming":
				return "event";
			case "Completed":
				return "check-circle";
			case "Cancelled":
				return "cancel";
			default:
				return null;
		}
	};

	return (
		<TouchableOpacity
			style={styles.cardContainer}
			onPress={() => onPressDetails(rental.id)}
			activeOpacity={0.8}>
			<Image
				source={{ uri: rental.bikeImageUrl || bikeImagePlaceholder }}
				style={styles.cardImage}
			/>
			<View style={styles.cardContent}>
				<Text style={styles.cardBikeName} numberOfLines={1}>
					{rental.bikeName}
				</Text>
				<Text style={styles.cardDates}>{formatDateRange()}</Text>
				<View style={styles.cardFooter}>
					<Text style={styles.cardPrice}>{rental.totalPrice}</Text>
					<View
						style={[
							styles.statusBadge,
							getStatusStyle(rental.status),
						]}>
						{getStatusIcon(rental.status) && (
							<MaterialIcons
								name={getStatusIcon(rental.status)!}
								size={12}
								color={colors.white}
								style={{ marginRight: spacing.xs }}
							/>
						)}
						<Text style={styles.statusText}>{rental.status}</Text>
					</View>
				</View>
				{rental.status === "Active" && onPressEndRide && (
					<PrimaryButton // Assumed themed
						title="End Ride"
						onPress={(e: any) => {
							e.stopPropagation();
							onPressEndRide(rental.id, rental.bikeName);
						}}
						style={styles.endRideButton}
						textStyle={styles.endRideButtonText}
						fullWidth={false} // Make it smaller for the card
						size="small" // Use a smaller variant if PrimaryButton supports it
					/>
				)}
			</View>
		</TouchableOpacity>
	);
};
// --- End Rental Card Component ---

type MyRentalsScreenNavigationProp = StackNavigationProp<
	RentalsStackParamList,
	"MyRentalsScreen"
>;

interface MyRentalsScreenProps {
	navigation: MyRentalsScreenNavigationProp;
}

type FilterType = "Active" | "Upcoming" | "Completed" | "All";

const MyRentalsScreen: React.FC<MyRentalsScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();

	// TODO: Replace with actual selectors from your rentalSlice
	const rentals = useSelector(
		(state: RootState) =>
			((state as any).rentals?.items as RentalSummary[]) || []
	);
	const isLoading = useSelector(
		(state: RootState) =>
			(state as any).rentals?.isLoadingRentals as boolean
	);
	const error = useSelector(
		(state: RootState) =>
			(state as any).rentals?.errorRentals as string | null
	);
	// --- End Redux Selectors Placeholder ---

	const [activeFilter, setActiveFilter] = useState<FilterType>("Active");

	const loadRentals = useCallback(
		async (filter: FilterType, isRefreshing = false) => {
			// @ts-ignore // Placeholder for actual thunk dispatch
			dispatch(
				fetchUserRentalsThunk(
					filter === "All" ? "All" : filter
				).asyncThunk(dispatch)
			);
		},
		[dispatch]
	);

	useEffect(() => {
		// dispatch(clearRentals()); // Clear previous rentals on initial load or filter change
		loadRentals(activeFilter, true); // Load with refresh true on filter change
	}, [activeFilter, loadRentals, dispatch]);

	// TODO: Add useFocusEffect if you need to refresh data when screen comes into focus
	// useFocusEffect(
	//  useCallback(() => {
	//    loadRentals(activeFilter, true); // Refresh when screen is focused
	//  }, [activeFilter, loadRentals])
	// );

	const handleViewDetails = (bookingId: string) => {
		navigation.navigate("RideDetailsScreen", { bookingId });
	};

	const handleEndRide = (bookingId: string, bikeName: string) => {
		navigation.navigate("EndRideScreen", { bookingId, bikeName });
	};

	const renderRentalItem = ({ item }: { item: RentalSummary }) => (
		<RentalCard
			rental={item}
			onPressDetails={handleViewDetails}
			onPressEndRide={
				item.status === "Active" ? handleEndRide : undefined
			}
		/>
	);

	const filterOptions: FilterType[] = [
		"Active",
		"Upcoming",
		"Completed",
		"All",
	];

	if (isLoading && rentals.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading your rentals...</Text>
			</View>
		);
	}

	if (error && rentals.length === 0) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.error}
				/>
				<Text style={styles.errorText}>Error: {error}</Text>
				<PrimaryButton
					title="Retry"
					onPress={() => loadRentals(activeFilter, true)}
				/>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			<View style={styles.filterBar}>
				{filterOptions.map((option) => (
					<TouchableOpacity
						key={option}
						style={[
							styles.filterButton,
							activeFilter === option &&
								styles.filterButtonActive,
						]}
						onPress={() => setActiveFilter(option)}>
						<Text
							style={[
								styles.filterButtonText,
								activeFilter === option &&
									styles.filterButtonTextActive,
							]}>
							{option}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{rentals.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<MaterialIcons
						name="format-list-bulleted"
						size={48}
						color={colors.textSecondary}
					/>
					<Text style={styles.noRentalsText}>
						No {activeFilter.toLowerCase()} rentals found.
					</Text>
				</View>
			) : (
				<FlatList
					data={rentals}
					renderItem={renderRentalItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshControl={
						// Added RefreshControl
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() => loadRentals(activeFilter, true)}
							tintColor={colors.primary} // For iOS
							colors={[colors.primary]} // For Android
						/>
					}
					// Add onEndReached for pagination if your API supports it
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	loadingText: {
		// Added style for loading text
		marginTop: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	errorText: {
		// Added style for error text
		marginTop: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	filterBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		backgroundColor: colors.backgroundCard, // Dark card background for filter bar
		paddingVertical: spacing.s,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault, // Themed border
	},
	filterButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.pill, // Pill shape for filter buttons
	},
	filterButtonActive: {
		backgroundColor: colors.primary, // Primary color for active filter
	},
	filterButtonText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text for inactive filters
	},
	filterButtonTextActive: {
		color: colors.buttonPrimaryText, // Contrasting text for active filter
		fontFamily: typography.primarySemiBold,
	},
	listContentContainer: {
		padding: spacing.m,
	},
	noRentalsText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		textAlign: "center",
		marginTop: spacing.s,
	},
	cardContainer: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		marginBottom: spacing.l, // Increased space between cards
		flexDirection: "row",
		padding: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault, // Subtle border for cards
	},
	cardImage: {
		width: 100,
		height: 80,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault, // Dark placeholder for image
	},
	cardContent: {
		flex: 1,
		justifyContent: "space-between",
	},
	cardBikeName: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.xs,
	},
	cardDates: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
		marginBottom: spacing.s,
	},
	cardFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardPrice: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary, // Light text for price
	},
	statusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xs, // Adjusted padding
		borderRadius: borderRadius.m, // Slightly more rounded
		flexDirection: "row",
		alignItems: "center",
	},
	statusActive: { backgroundColor: colors.success }, // Themed success color
	statusUpcoming: { backgroundColor: colors.info }, // Themed info/warning color
	statusCompleted: { backgroundColor: colors.textDisabled }, // Muted grey for completed
	statusCancelled: { backgroundColor: colors.error }, // Themed error color
	statusText: {
		color: colors.white, // White text on colored badges
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold, // Bold status text
		textTransform: "uppercase",
	},
	endRideButton: {
		// For PrimaryButton instance
		marginTop: spacing.s,
		paddingVertical: spacing.xs,
		// backgroundColor is handled by PrimaryButton's variant or default
		// For a specific look, you might create a variant in PrimaryButton
		// or override styles here if PrimaryButton allows.
	},
	endRideButtonText: {
		// For text within PrimaryButton instance
		fontSize: typography.fontSizes.s,
		// Color is handled by PrimaryButton
	},
});

export default MyRentalsScreen;
