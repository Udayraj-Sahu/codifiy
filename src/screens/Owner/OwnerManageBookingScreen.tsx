// src/screens/Owner/OwnerManageBookingsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {
	BookingStatusOwnerView,
	OwnerStackParamList,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons

// --- Types and Dummy Data ---
interface BookingOwnerView {
	id: string;
	userPhotoUrl?: string;
	userName: string;
	status: Exclude<BookingStatusOwnerView, "All">;
	bikeName: string;
	bikeId: string;
	bookingDates: string; // e.g., "Jan 12 - Jan 14, 2025"
	assignedAdminName?: string; // Owner might see who managed it
	price: string; // e.g., "$50"
}

const DUMMY_OWNER_BOOKINGS_DATA: BookingOwnerView[] = [
	{
		id: "obk001",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=JD",
		userName: "John Doe",
		status: "Active",
		bikeName: "Mountain X Pro",
		bikeId: "BX2938",
		bookingDates: "May 25 - May 27, 2025",
		assignedAdminName: "Sarah K",
		price: "$50",
	},
	{
		id: "obk002",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=PS",
		userName: "Priya Sharma",
		status: "Completed",
		bikeName: "Roadster 2K Deluxe",
		bikeId: "RX2000",
		bookingDates: "May 08 - May 10, 2025",
		price: "$30",
	},
	{
		id: "obk003",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=MJ",
		userName: "Mike Johnson",
		status: "Cancelled",
		bikeName: "City Cruiser Ltd",
		bikeId: "CC100",
		bookingDates: "Apr 05 - Apr 06, 2025",
		price: "$40",
	},
	{
		id: "obk004",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=AL",
		userName: "Alice L.",
		status: "Active",
		bikeName: "Electric Glide Max",
		bikeId: "EG500",
		bookingDates: "May 26 - May 28, 2025",
		assignedAdminName: "Admin Bot",
		price: "$75",
	},
];

const fetchOwnerBookingsAPI = async (filters: {
	searchQuery?: string;
	status?: BookingStatusOwnerView;
	otherFilters?: any;
}): Promise<BookingOwnerView[]> => {
	console.log("Fetching owner bookings with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let bookings = DUMMY_OWNER_BOOKINGS_DATA;
			if (filters.searchQuery && filters.searchQuery.trim() !== "") {
				const sq = filters.searchQuery.toLowerCase();
				bookings = bookings.filter(
					(b) =>
						b.userName.toLowerCase().includes(sq) ||
						b.id.toLowerCase().includes(sq) ||
						b.bikeName.toLowerCase().includes(sq) ||
						b.bikeId.toLowerCase().includes(sq)
				);
			}
			if (filters.status && filters.status !== "All") {
				bookings = bookings.filter((b) => b.status === filters.status);
			}
			// TODO: Implement otherFilters (from header filter icon)
			resolve([...bookings]);
		}, 300);
	});
};
// --- End Dummy Data ---

// --- Reusable Components (Inline) ---
interface FilterTabButtonProps {
	label: string;
	count?: number;
	isActive: boolean;
	onPress: () => void;
}
const FilterTabButton: React.FC<FilterTabButtonProps> = ({
	label,
	count,
	isActive,
	onPress,
}) => (
	<TouchableOpacity
		style={[
			styles.filterTabButton,
			isActive && styles.filterTabButtonActive,
		]}
		onPress={onPress}
		activeOpacity={0.7}>
		<Text
			style={[
				styles.filterTabButtonText,
				isActive && styles.filterTabButtonTextActive,
			]}>
			{label} {count !== undefined ? `(${count})` : ""}
		</Text>
	</TouchableOpacity>
);

interface OwnerBookingCardProps {
	item: BookingOwnerView;
	onViewDetails: () => void;
}
const OwnerBookingCard: React.FC<OwnerBookingCardProps> = ({
	item,
	onViewDetails,
}) => {
	const statusStyles = {
		// As defined in AdminManageBookingsScreen, ensure colors are in theme
		Active: {
			badge: styles.statusBadgeActive,
			text: styles.statusTextActive,
		},
		Completed: {
			badge: styles.statusBadgeCompleted,
			text: styles.statusTextCompleted,
		},
		Cancelled: {
			badge: styles.statusBadgeCancelled,
			text: styles.statusTextCancelled,
		},
	};
	const currentStatusStyle = statusStyles[item.status] || {
		badge: {},
		text: {},
	};

	return (
		<View style={styles.bookingCard}>
			<View style={styles.cardTopRow}>
				<View style={styles.userDetails}>
					{item.userPhotoUrl && (
						<Image
							source={{ uri: item.userPhotoUrl }}
							style={styles.userPhoto}
						/>
					)}
					<Text style={styles.userName} numberOfLines={1}>
						{item.userName}
					</Text>
				</View>
				<View style={[styles.statusBadge, currentStatusStyle.badge]}>
					<Text style={[styles.statusText, currentStatusStyle.text]}>
						{item.status}
					</Text>
				</View>
			</View>

			<View style={styles.bikeInfoSection}>
				<Text style={styles.bikeName}>
					{item.bikeName}{" "}
					<Text style={styles.bikeIdText}>({item.bikeId})</Text>
				</Text>
				<View style={styles.dateRow}>
					<Text style={styles.detailIcon}>🗓️</Text>
					<Text style={styles.bikeDetailText}>
						{item.bookingDates}
					</Text>
				</View>
			</View>

			{item.assignedAdminName && (
				<View style={styles.assignedInfoSection}>
					<Text style={styles.detailIcon}>🧑‍💼</Text>
					<Text style={styles.assignedAdminText}>
						Managed by: {item.assignedAdminName}
					</Text>
				</View>
			)}

			<View style={styles.priceAndActionsRow}>
				<Text style={styles.priceText}>{item.price}</Text>
				<TouchableOpacity
					style={[styles.actionButton, styles.viewDetailsButton]}
					onPress={onViewDetails}>
					<Text
						style={[
							styles.actionButtonText,
							styles.viewDetailsButtonText,
						]}>
						View Details
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};
// --- End Reusable Components ---

type ScreenNavigationProp = StackNavigationProp<
	OwnerStackParamList,
	"OwnerManageBookingsScreen"
>;
type ScreenRouteProp = RouteProp<
	OwnerStackParamList,
	"OwnerManageBookingsScreen"
>;

interface OwnerManageBookingsScreenProps {
	navigation: ScreenNavigationProp;
	route: ScreenRouteProp;
}

const OwnerManageBookingsScreen: React.FC<OwnerManageBookingsScreenProps> = ({
	navigation,
	route,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<BookingStatusOwnerView>(route.params?.initialFilter || "All");
	const [bookings, setBookings] = useState<BookingOwnerView[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [counts, setCounts] = useState({
		All: 0,
		Active: 0,
		Completed: 0,
		Cancelled: 0,
	}); // Dummy counts

	const loadBookings = useCallback(
		async (status: BookingStatusOwnerView, query: string) => {
			setIsLoading(true);
			const fetchedBookings = await fetchOwnerBookingsAPI({
				status,
				searchQuery: query,
			});
			setBookings(fetchedBookings);
			// Update counts based on fetched data (or from API if available)
			const newCounts = { All: 0, Active: 0, Completed: 0, Cancelled: 0 };
			DUMMY_OWNER_BOOKINGS_DATA.forEach((b) => {
				newCounts.All++;
				if (b.status !== "All") newCounts[b.status]++;
			});
			setCounts(newCounts);
			setIsLoading(false);
		},
		[]
	);

	useEffect(() => {
		loadBookings(activeStatusFilter, searchQuery);
	}, [activeStatusFilter, searchQuery, loadBookings]);

	const navigateToAdvancedFilters = () => {
		Alert.alert(
			"Filter Bookings",
			"Advanced booking filter modal for Owner to be implemented."
		);
		// navigation.navigate('OwnerBookingFilterModal', { currentFilters: { status: activeStatusFilter, query: searchQuery } });
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Manage Bookings", // Or just "Bookings"
			headerRight: () => (
				<TouchableOpacity
					onPress={navigateToAdvancedFilters}
					style={styles.headerFilterButton}>
					<Text style={styles.headerFilterIcon}>⚖️</Text>
					<Text style={styles.headerFilterLabel}>
						{activeStatusFilter === "All"
							? "All"
							: activeStatusFilter}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter]); // Update header when filter changes

	const handleViewDetails = (bookingId: string) => {
		navigation.navigate("OwnerBookingDetailsScreen", { bookingId });
	};

	const filterTabs: {
		label: BookingStatusOwnerView;
		countKey: keyof typeof counts;
	}[] = [
		{ label: "All", countKey: "All" },
		{ label: "Active", countKey: "Active" },
		{ label: "Completed", countKey: "Completed" },
		{ label: "Cancelled", countKey: "Cancelled" },
	];

	if (isLoading && bookings.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: spacing.s }}>
					Loading bookings...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{/* Search Bar */}
			<View style={styles.searchBarContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search by user, ID or bike..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.textPlaceholder}
					returnKeyType="search"
				/>
			</View>

			{/* Tab Filter Bar */}
			<View style={styles.tabFilterContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ paddingHorizontal: spacing.m }}>
					{filterTabs.map((tab) => (
						<FilterTabButton
							key={tab.label}
							label={tab.label}
							count={counts[tab.countKey]}
							isActive={activeStatusFilter === tab.label}
							onPress={() => setActiveStatusFilter(tab.label)}
						/>
					))}
				</ScrollView>
			</View>

			{bookings.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<Text style={styles.noResultsText}>
						No bookings match your criteria.
					</Text>
				</View>
			) : (
				<FlatList
					data={bookings}
					renderItem={({ item }) => (
						<OwnerBookingCard
							item={item}
							onViewDetails={() => handleViewDetails(item.id)}
						/>
					)}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshing={isLoading}
					onRefresh={() =>
						loadBookings(activeStatusFilter, searchQuery)
					}
				/>
			)}
		</View>
	);
};

// Styles will be very similar to AdminManageBookingsScreen, with minor tweaks if needed
// Ensure you have ownerBlue and ownerBlueLight in your theme or use existing colors
const ownerAccentColor =  "#1A5276"; // Example blue for Owner section accents
const ownerAccentColorLight =  "#D6EAF8";

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	headerFilterButton: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: spacing.m,
		padding: spacing.xs,
	},
	headerFilterIcon: {
		fontSize: 18,
		color: ownerAccentColor,
		marginRight: spacing.xs,
	},
	headerFilterLabel: {
		fontSize: typography.fontSizes.s,
		color: ownerAccentColor,
		fontWeight: typography.fontWeights.medium,
	},
	searchBarContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
		paddingBottom: spacing.s,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	searchInput: {
		backgroundColor: colors.backgroundLight || "#F0F3F7",
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		fontSize: typography.fontSizes.m,
		height: 44,
		color: colors.textPrimary,
	},
	tabFilterContainer: {
		flexDirection: "row",
		backgroundColor: colors.white,
		paddingVertical: spacing.s,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
		marginBottom: spacing.xs,
	},
	filterTabButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
	},
	filterTabButtonActive: { backgroundColor: ownerAccentColorLight },
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	filterTabButtonTextActive: {
		color: ownerAccentColor,
		fontWeight: typography.fontWeights.bold,
	},
	listContentContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.l,
	},
	noResultsText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
	},
	// OwnerBookingCard Styles
	bookingCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	cardTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.s,
	},
	userDetails: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
		marginRight: spacing.s,
	},
	userPhoto: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: spacing.s,
		backgroundColor: colors.greyLighter,
	},
	userName: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	statusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs + 1,
		borderRadius: borderRadius.pill,
	},
	statusText: {
		fontSize: typography.fontSizes.xs,
		fontWeight: typography.fontWeights.bold,
		color: colors.white,
	}, // Default, specific styles will override for text color too
	statusBadgeActive: { backgroundColor: colors.successLight || "#D4EFDF" },
	statusTextActive: { color: colors.successDark || "#1D8348" }, // Green
	statusBadgeCompleted: { backgroundColor: ownerAccentColorLight },
	statusTextCompleted: { color: ownerAccentColor }, // Blue
	statusBadgeCancelled: { backgroundColor: colors.greyLighter || "#EAECEE" },
	statusTextCancelled: { color: colors.textMedium || "#707B7C" }, // Gray
	bikeInfoSection: {
		marginVertical: spacing.s,
		paddingLeft:
			spacing.s /*borderLeftWidth: 3, borderLeftColor: colors.borderDefault || '#EEE'*/,
	},
	bikeName: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		color: colors.textPrimary,
	},
	bikeIdText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	dateRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	detailIcon: {
		fontSize: 14,
		color: colors.textMedium,
		marginRight: spacing.xs,
	},
	bikeDetailText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
	},
	assignedInfoSection: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.s,
		paddingLeft: spacing.s,
	},
	assignedAdminText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		fontStyle: "italic",
	},
	priceAndActionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.m,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault || "#F0F0F0",
		paddingTop: spacing.m,
	},
	priceText: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	actionButton: {
		borderRadius: borderRadius.m,
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
	},
	actionButtonText: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.semiBold,
	},
	viewDetailsButton: { backgroundColor: ownerAccentColor }, // Prominent blue button
	viewDetailsButtonText: { color: colors.white },
});

export default OwnerManageBookingsScreen;
