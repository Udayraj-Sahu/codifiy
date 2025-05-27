// src/screens/Admin/AdminManageBookingsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import {
	Alert,
	FlatList,
	Image,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {
	AdminStackParamList,
	BookingStatusAdmin,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons

// --- Types and Dummy Data ---
interface BookingAdminView {
	id: string;
	userPhotoUrl?: string;
	userName: string;
	status: Exclude<BookingStatusAdmin, "All">; // Card status won't be 'All'
	bikeName: string;
	bikeId: string;
	bookingDates: string; // e.g., "Jan 12 - Jan 14"
	assignedAdminName?: string; // Optional based on prompt
	adminPhotoUrl?: string; // Optional
	price: string; // e.g., "$50"
}

const DUMMY_ADMIN_BOOKINGS: BookingAdminView[] = [
	{
		id: "bk001",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=JD",
		userName: "John Doe",
		status: "Active",
		bikeName: "Mountain X",
		bikeId: "BX2938",
		bookingDates: "Jan 12 - Jan 14, 2025",
		assignedAdminName: "Sarah K",
		price: "$50",
	},
	{
		id: "bk002",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=PS",
		userName: "Priya S",
		status: "Completed",
		bikeName: "Roadster 2K",
		bikeId: "RX2000",
		bookingDates: "Jan 08 - Jan 10, 2025",
		price: "$30",
	},
	{
		id: "bk003",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=MJ",
		userName: "Mike Johnson",
		status: "Cancelled",
		bikeName: "City Cruiser",
		bikeId: "CC100",
		bookingDates: "Jan 05 - Jan 06, 2025",
		price: "$40",
	},
	{
		id: "bk004",
		userPhotoUrl: "https://via.placeholder.com/40x40.png?text=AL",
		userName: "Alice L",
		status: "Active",
		bikeName: "Electric Glide",
		bikeId: "EG500",
		bookingDates: "Jan 13 - Jan 15, 2025",
		assignedAdminName: "Admin Bot",
		price: "$75",
	},
];

const fetchAdminBookingsAPI = async (filters: {
	searchQuery?: string;
	status?: BookingStatusAdmin;
	otherFilters?: any;
}): Promise<BookingAdminView[]> => {
	console.log("Fetching admin bookings with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let bookings = DUMMY_ADMIN_BOOKINGS;
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

const cancelBookingAPI = async (
	bookingId: string
): Promise<{ success: boolean; message?: string }> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Booking ${bookingId} would be cancelled. (Simulated)`);
			const bookingIndex = DUMMY_ADMIN_BOOKINGS.findIndex(
				(b) => b.id === bookingId
			);
			if (bookingIndex !== -1)
				DUMMY_ADMIN_BOOKINGS[bookingIndex].status = "Cancelled";
			resolve({ success: true, message: "Booking cancelled." });
		}, 500);
	});
};
// --- End Dummy Data ---

// --- Reusable Components (Inline) ---
interface FilterTabButtonProps {
	label: string;
	count: number;
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
			{label} ({count})
		</Text>
	</TouchableOpacity>
);

interface AdminBookingCardProps {
	item: BookingAdminView;
	onViewDetails: () => void;
	onCancel?: () => void;
}
const AdminBookingCard: React.FC<AdminBookingCardProps> = ({
	item,
	onViewDetails,
	onCancel,
}) => {
	const statusStyles = {
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
					<Image
						source={
							item.userPhotoUrl
								? { uri: item.userPhotoUrl }
								: require("../../../assets/images/icon.png")
						}
						style={styles.userPhoto}
					/>
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
					{/* <Icon name="calendar-month-outline" size={16} color={colors.textMedium} /> */}
					<Text style={styles.detailIcon}>🗓️</Text>
					<Text style={styles.bikeDetailText}>
						{item.bookingDates}
					</Text>
				</View>
			</View>

			{item.assignedAdminName && (
				<View style={styles.assignedInfoSection}>
					{/* <Image source={item.adminPhotoUrl ? { uri: item.adminPhotoUrl } : require('../../../assets/placeholder_admin.png')} style={styles.adminPhoto} /> */}
					<Text style={styles.detailIcon}>🧑‍💼</Text>
					<Text style={styles.assignedAdminText}>
						Assigned: {item.assignedAdminName}
					</Text>
				</View>
			)}

			<View style={styles.priceAndActionsRow}>
				<Text style={styles.priceText}>{item.price}</Text>
				<View style={styles.actionButtonsContainer}>
					{item.status === "Active" && onCancel && (
						<TouchableOpacity
							style={[styles.actionButton, styles.cancelButton]}
							onPress={onCancel}>
							<Text
								style={[
									styles.actionButtonText,
									styles.cancelButtonText,
								]}>
								Cancel
							</Text>
						</TouchableOpacity>
					)}
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
		</View>
	);
};
// --- End Reusable Components ---

type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminManageBookings"
>;
// type ScreenRouteProp = RouteProp<AdminStackParamList, 'AdminManageBookings'>; // If using initialFilter

interface AdminManageBookingsScreenProps {
	navigation: ScreenNavigationProp;
	// route: ScreenRouteProp;
}

const AdminManageBookingsScreen: React.FC<AdminManageBookingsScreenProps> = ({
	navigation /*, route*/,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<BookingStatusAdmin>("All");
	const [bookings, setBookings] = useState<BookingAdminView[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	// const initialFilterFromRoute = route.params?.initialFilter;

	// Counts for tabs (would come from API in real app)
	const [counts, setCounts] = useState({
		All: 24,
		Active: 12,
		Completed: 8,
		Cancelled: 4,
	});

	const loadBookings = useCallback(
		async (status: BookingStatusAdmin, query: string) => {
			setIsLoading(true);
			const fetchedBookings = await fetchAdminBookingsAPI({
				status,
				searchQuery: query,
			});
			setBookings(fetchedBookings);
			// In a real app, counts would be updated from API response meta or separate call
			const newCounts = { All: 0, Active: 0, Completed: 0, Cancelled: 0 };
			DUMMY_ADMIN_BOOKINGS.forEach((b) => {
				newCounts.All++;
				newCounts[b.status]++;
			});
			setCounts(newCounts);
			setIsLoading(false);
		},
		[]
	);

	useEffect(() => {
		// const initialStatus = initialFilterFromRoute || 'All';
		// setActiveStatusFilter(initialStatus);
		loadBookings(activeStatusFilter, searchQuery);
	}, [
		activeStatusFilter,
		searchQuery,
		loadBookings /*, initialFilterFromRoute*/,
	]);

	const navigateToAdvancedFilters = () => {
		console.log("Navigate to Advanced Booking Filters");
		// navigation.navigate('AdminBookingFilterModal', { currentFilters: { status: activeStatusFilter, query: searchQuery } });
		Alert.alert("Filter", "Advanced filter modal to be implemented.");
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Manage Bookings",
			headerRight: () => (
				<TouchableOpacity
					onPress={navigateToAdvancedFilters}
					style={styles.headerFilterButton}>
					{/* <Icon name="filter-variant" size={22} color={colors.primary} /> */}
					<Text style={styles.headerFilterIcon}>⚖️</Text>
					<Text style={styles.headerFilterLabel}>
						{activeStatusFilter}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter]); // Re-render header if activeStatusFilter changes label

	const handleViewDetails = (bookingId: string) => {
		navigation.navigate("AdminBookingDetails", { bookingId });
	};

	const handleCancelBooking = (bookingId: string) => {
		Alert.alert(
			"Confirm Cancellation",
			"Are you sure you want to cancel this booking?",
			[
				{ text: "No", style: "cancel" },
				{
					text: "Yes, Cancel",
					style: "destructive",
					onPress: async () => {
						const result = await cancelBookingAPI(bookingId);
						if (result.success) {
							Alert.alert(
								"Success",
								result.message || "Booking cancelled."
							);
							loadBookings(activeStatusFilter, searchQuery); // Refresh list
						} else {
							Alert.alert(
								"Error",
								result.message || "Failed to cancel booking."
							);
						}
					},
				},
			]
		);
	};

	const filterTabs: { label: BookingStatusAdmin; count: number }[] = [
		{ label: "All", count: counts.All },
		{ label: "Active", count: counts.Active },
		{ label: "Completed", count: counts.Completed },
		// Add 'Cancelled' if needed based on design for tabs, prompt mentions it for badges
	];

	if (isLoading && bookings.length === 0) {
		return (
			<View style={styles.centered}>
				<Text>Loading bookings...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{/* Search Bar */}
			<View style={styles.searchBarContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search by name, ID or bike..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.textPlaceholder}
					returnKeyType="search"
				/>
			</View>

			{/* Tab Filter Bar */}
			<View style={styles.tabFilterContainer}>
				{filterTabs.map((tab) => (
					<FilterTabButton
						key={tab.label}
						label={tab.label}
						count={tab.count}
						isActive={activeStatusFilter === tab.label}
						onPress={() => setActiveStatusFilter(tab.label)}
					/>
				))}
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
						<AdminBookingCard
							item={item}
							onViewDetails={() => handleViewDetails(item.id)}
							onCancel={
								item.status === "Active"
									? () => handleCancelBooking(item.id)
									: undefined
							}
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

// Define your blue accent color in theme/colors.ts e.g. colors.adminAccentBlue
const adminBlue = colors.primary; // Using primary green for now, change to blue
const adminBlueLight = colors.primaryLight;

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
		color: adminBlue,
		marginRight: spacing.xs,
	},
	headerFilterLabel: {
		fontSize: typography.fontSizes.s,
		color: adminBlue,
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
		paddingHorizontal: spacing.s,
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
	filterTabButtonActive: { backgroundColor: adminBlueLight },
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	filterTabButtonTextActive: {
		color: adminBlue,
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
	// AdminBookingCard Styles
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
	}, // Default, overridden by specific status
	statusBadgeActive: { backgroundColor: "#D4EFDF" },
	statusTextActive: { color: "#1D8348" },
	statusBadgeCompleted: { backgroundColor: "#D6EAF8" },
	statusTextCompleted: { color: "#1A5276" },
	statusBadgeCancelled: { backgroundColor: colors.greyLighter || "#EAECEE" },
	statusTextCancelled: { color: colors.textMedium || "#707B7C" }, // Grey for cancelled
	bikeInfoSection: {
		marginVertical: spacing.s,
		paddingLeft: spacing.s,
		borderLeftWidth: 3,
		borderLeftColor: colors.borderDefault || "#EEE",
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
	adminPhoto: {
		width: 20,
		height: 20,
		borderRadius: 10,
		marginRight: spacing.xs,
		backgroundColor: colors.greyLighter,
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
	actionButtonsContainer: { flexDirection: "row", alignItems: "center" },
	actionButton: {
		borderRadius: borderRadius.s,
		paddingVertical: spacing.s - 2,
		paddingHorizontal: spacing.m,
		marginLeft: spacing.s,
	},
	actionButtonText: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
	},
	viewDetailsButton: { backgroundColor: adminBlue },
	viewDetailsButtonText: { color: colors.white },
	cancelButton: { borderWidth: 1, borderColor: colors.error },
	cancelButtonText: { color: colors.error },
});

export default AdminManageBookingsScreen;
