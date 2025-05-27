// src/screens/App/Rentals/MyRentalsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
	FlatList,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton"; // For "End Ride" if applicable directly on card
import { RentalsStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Data (replace with actual API data) ---
type RentalStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";

interface RentalSummary {
	id: string;
	bikeName: string;
	bikeImageUrl: string;
	rentalStartDate: string; // ISO String
	rentalEndDate: string; // ISO String
	totalPrice: string; // e.g., "₹4500.00"
	status: RentalStatus;
}

const DUMMY_RENTALS: RentalSummary[] = [
	{
		id: "bk101",
		bikeName: "Mountain Explorer X3",
		bikeImageUrl: "https://via.placeholder.com/150x100.png?text=Bike+X3",
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
		bikeImageUrl: "https://via.placeholder.com/150x100.png?text=Commuter",
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
		bikeImageUrl: "https://via.placeholder.com/150x100.png?text=Road+Elite",
		rentalStartDate: new Date(
			Date.now() - 10 * 24 * 60 * 60 * 1000
		).toISOString(),
		rentalEndDate: new Date(
			Date.now() - 8 * 24 * 60 * 60 * 1000
		).toISOString(),
		totalPrice: "₹1800.00",
		status: "Completed",
	},
	{
		id: "bk104",
		bikeName: "Electric Scooter Pro",
		bikeImageUrl:
			"https://via.placeholder.com/150x100.png?text=Scooter+Pro",
		rentalStartDate: new Date(
			Date.now() - 5 * 24 * 60 * 60 * 1000
		).toISOString(),
		rentalEndDate: new Date(
			Date.now() - 4 * 24 * 60 * 60 * 1000
		).toISOString(),
		totalPrice: "₹900.00",
		status: "Completed",
	},
];

const fetchUserRentals = async (
	filter: RentalStatus | "All" = "All"
): Promise<RentalSummary[]> => {
	// Simulate API call
	return new Promise((resolve) => {
		setTimeout(() => {
			if (filter === "All") {
				resolve(DUMMY_RENTALS);
			} else {
				resolve(DUMMY_RENTALS.filter((r) => r.status === filter));
			}
		}, 500);
	});
};
// --- End Dummy Data ---

// --- Rental Card Component (defined inline for now, could be a separate component) ---
interface RentalCardProps {
	rental: RentalSummary;
	onPressDetails: (bookingId: string) => void;
	onPressEndRide?: (bookingId: string, bikeName: string) => void; // Optional, only for active rides
}

const RentalCard: React.FC<RentalCardProps> = ({
	rental,
	onPressDetails,
	onPressEndRide,
}) => {
	const startDate = new Date(rental.rentalStartDate);
	const endDate = new Date(rental.rentalEndDate);

	const formatDateRange = () => {
		const options: Intl.DateTimeFormatOptions = {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		};
		return `${startDate.toLocaleDateString(
			undefined,
			options
		)} - ${endDate.toLocaleDateString(undefined, options)}`;
	};

	return (
		<TouchableOpacity
			style={styles.cardContainer}
			onPress={() => onPressDetails(rental.id)}
			activeOpacity={0.8}>
			<Image
				source={{ uri: rental.bikeImageUrl }}
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
							styles[`status${rental.status}`],
						]}>
						<Text style={styles.statusText}>{rental.status}</Text>
					</View>
				</View>
				{rental.status === "Active" && onPressEndRide && (
					<PrimaryButton
						title="End Ride"
						onPress={(e: any) => {
							// PrimaryButton now expects event
							e.stopPropagation(); // Prevent card press
							onPressEndRide(rental.id, rental.bikeName);
						}}
						style={styles.endRideButton}
						textStyle={styles.endRideButtonText}
						fullWidth={false}
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

type FilterType = "Active" | "Upcoming" | "Completed" | "All"; // Added 'All'

const MyRentalsScreen: React.FC<MyRentalsScreenProps> = ({ navigation }) => {
	const [rentals, setRentals] = useState<RentalSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeFilter, setActiveFilter] = useState<FilterType>("Active");

	const loadRentals = useCallback(async (filter: FilterType) => {
		setLoading(true);
		// Map FilterType to RentalStatus or 'All'
		const apiFilter = filter === "All" ? "All" : (filter as RentalStatus);
		const fetchedRentals = await fetchUserRentals(apiFilter);
		setRentals(fetchedRentals);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadRentals(activeFilter);
	}, [activeFilter, loadRentals]);

	// Reload rentals when the screen comes into focus (e.g., after ending a ride)
	// useFocusEffect(
	//   useCallback(() => {
	//     loadRentals(activeFilter);
	//   }, [activeFilter, loadRentals])
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

	if (loading && rentals.length === 0) {
		// Show loader only on initial load or if list is empty
		return (
			<View style={styles.centered}>
				<Text>Loading rentals...</Text>
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

			{rentals.length === 0 && !loading ? (
				<View style={styles.centered}>
					<Text style={styles.noRentalsText}>
						No{" "}
						{activeFilter !== "All"
							? activeFilter.toLowerCase()
							: ""}{" "}
						rentals found.
					</Text>
				</View>
			) : (
				<FlatList
					data={rentals}
					renderItem={renderRentalItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshing={loading} // Show refresh indicator while loading new filter data
					onRefresh={() => loadRentals(activeFilter)} // Pull to refresh
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F4F4F4",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	filterBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		backgroundColor: colors.white,
		paddingVertical: spacing.s,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#E0E0E0",
	},
	filterButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.pill,
	},
	filterButtonActive: {
		backgroundColor: colors.primaryLight || "#D3EAA4",
	},
	filterButtonText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	filterButtonTextActive: {
		color: colors.primaryDark || colors.primary,
		fontWeight: typography.fontWeights.bold,
	},
	listContentContainer: {
		padding: spacing.m,
	},
	noRentalsText: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
		textAlign: "center",
	},
	// Rental Card Styles
	cardContainer: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		marginBottom: spacing.m,
		flexDirection: "row",
		padding: spacing.m,
		// shadow
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	cardImage: {
		width: 100,
		height: 80,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	cardContent: {
		flex: 1,
		justifyContent: "space-between",
	},
	cardBikeName: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	cardDates: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		marginBottom: spacing.s,
	},
	cardFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	cardPrice: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
	},
	statusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xs / 2,
		borderRadius: borderRadius.s,
	},
	statusActive: { backgroundColor: colors.success || "green" },
	statusUpcoming: { backgroundColor: colors.info || "blue" },
	statusCompleted: { backgroundColor: colors.greyMedium },
	statusCancelled: { backgroundColor: colors.error || "red" },
	statusText: {
		color: colors.white,
		fontSize: typography.fontSizes.xs,
		fontWeight: typography.fontWeights.bold,
		textTransform: "uppercase",
	},
	endRideButton: {
		marginTop: spacing.s,
		paddingVertical: spacing.xs, // Smaller button
		backgroundColor: colors.primary, // Or an accent color like error red
	},
	endRideButtonText: {
		fontSize: typography.fontSizes.s,
	},
});

export default MyRentalsScreen;
