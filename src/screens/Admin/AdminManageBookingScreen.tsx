// src/screens/Admin/AdminManageBookingsScreen.tsx
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
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // For icons
import {
	AdminStackParamList,
	BookingStatusAdmin,
} from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
// PrimaryButton is not directly used on this screen, but in AdminBookingCard if it had actions
// import PrimaryButton from "../../../components/common/PrimaryButton";

// --- Types and Dummy Data (structure remains, placeholders updated for dark theme) ---
interface BookingAdminView {
	id: string;
	userPhotoUrl?: string;
	userName: string;
	status: Exclude<BookingStatusAdmin, "All">;
	bikeName: string;
	bikeId: string;
	bookingDates: string;
	assignedAdminName?: string;
	price: string;
}

const DUMMY_ADMIN_BOOKINGS: BookingAdminView[] = [
	{
		id: "bk001",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=JD",
		userName: "John Doe",
		status: "Active",
		bikeName: "Mountain X Pro",
		bikeId: "BX2938",
		bookingDates: "May 25 - May 27, 2025",
		assignedAdminName: "Sarah K",
		price: "₹5000",
	},
	{
		id: "bk002",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=PS",
		userName: "Priya S",
		status: "Completed",
		bikeName: "Roadster 2K Deluxe",
		bikeId: "RX2000",
		bookingDates: "May 08 - May 10, 2025",
		price: "₹3000",
	},
	{
		id: "bk003",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=MJ",
		userName: "Mike Johnson",
		status: "Cancelled",
		bikeName: "City Cruiser Ltd",
		bikeId: "CC100",
		bookingDates: "Apr 05 - Apr 06, 2025",
		price: "₹4000",
	},
	{
		id: "bk004",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=AL",
		userName: "Alice L.",
		status: "Active",
		bikeName: "Electric Glide Max",
		bikeId: "EG500",
		bookingDates: "May 26 - May 28, 2025",
		assignedAdminName: "Admin Bot",
		price: "₹7500",
	},
	{
		id: "bk005",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=RB",
		userName: "Robert Brown",
		status: "Upcoming",
		bikeName: "Speedster Z",
		bikeId: "SZ700",
		bookingDates: "June 10 - June 12, 2025",
		price: "₹6000",
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

// --- Reusable Components (Themed) ---
interface FilterTabButtonProps {
	label: string;
	count?: number; // Made count optional as it might not always be available or needed
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
			{label} {typeof count === "number" ? `(${count})` : ""}
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
	const userPhotoPlaceholder =
		"https://placehold.co/40x40/1A1A1A/F5F5F5?text=U";

	const getStatusStyleInfo = (
		status: Exclude<BookingStatusAdmin, "All" | "Upcoming">
	): {
		badge: object;
		text: object;
		iconName: keyof typeof MaterialIcons.glyphMap;
	} => {
		switch (status) {
			case "Active":
				return {
					badge: styles.statusBadgeActive,
					text: styles.statusTextSemantic,
					iconName: "play-circle-filled",
				};
			case "Completed":
				return {
					badge: styles.statusBadgeCompleted,
					text: styles.statusTextMuted,
					iconName: "check-circle",
				};
			case "Cancelled":
				return {
					badge: styles.statusBadgeCancelled,
					text: styles.statusTextSemantic,
					iconName: "cancel",
				};
		}
	};
	const currentStatusInfo = getStatusStyleInfo(
		item.status === "Upcoming" ? "Active" : item.status
	); // Map upcoming to active style for now or create separate for "Upcoming"

	return (
		<TouchableOpacity
			style={styles.bookingCard}
			onPress={onViewDetails}
			activeOpacity={0.8}>
			<View style={styles.cardTopRow}>
				<View style={styles.userDetails}>
					<Image
						source={{
							uri: item.userPhotoUrl || userPhotoPlaceholder,
						}}
						style={styles.userPhoto}
					/>
					<View style={styles.userNameContainer}>
						<Text style={styles.userName} numberOfLines={1}>
							{item.userName}
						</Text>
						<Text style={styles.bookingIdText}>
							ID: #{item.id.slice(-6).toUpperCase()}
						</Text>
					</View>
				</View>
				<View style={[styles.statusBadge, currentStatusInfo.badge]}>
					<MaterialIcons
						name={currentStatusInfo.iconName}
						size={14}
						color={
							item.status === "Completed" ||
							item.status === "Cancelled"
								? colors.textSecondary
								: colors.white
						}
						style={{ marginRight: spacing.xs }}
					/>
					<Text
						style={[styles.statusTextBase, currentStatusInfo.text]}>
						{item.status}
					</Text>
				</View>
			</View>

			<View style={styles.bikeInfoSection}>
				<Text style={styles.bikeName}>
					{item.bikeName}{" "}
					<Text style={styles.bikeIdText}>
						(Bike ID: {item.bikeId})
					</Text>
				</Text>
				<View style={styles.dateRow}>
					<MaterialIcons
						name="date-range"
						size={16}
						color={colors.iconDefault}
						style={styles.detailIconThemed}
					/>
					<Text style={styles.bikeDetailText}>
						{item.bookingDates}
					</Text>
				</View>
			</View>

			{item.assignedAdminName && (
				<View style={styles.assignedInfoSection}>
					<MaterialIcons
						name="admin-panel-settings"
						size={16}
						color={colors.iconDefault}
						style={styles.detailIconThemed}
					/>
					<Text style={styles.assignedAdminText}>
						Managed by: {item.assignedAdminName}
					</Text>
				</View>
			)}

			<View style={styles.priceAndActionsRow}>
				<Text style={styles.priceText}>{item.price}</Text>
				<View style={styles.actionButtonsContainer}>
					{item.status === "Active" && onCancel && (
						<TouchableOpacity
							style={[
								styles.actionButtonSmall,
								styles.cancelButton,
							]}
							onPress={onCancel}>
							<MaterialIcons
								name="cancel"
								size={16}
								color={colors.error}
								style={{ marginRight: spacing.xs }}
							/>
							<Text
								style={[
									styles.actionButtonTextSmall,
									styles.cancelButtonText,
								]}>
								Cancel
							</Text>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={[
							styles.actionButtonSmall,
							styles.viewDetailsButton,
						]}
						onPress={onViewDetails}>
						<Text
							style={[
								styles.actionButtonTextSmall,
								styles.viewDetailsButtonText,
							]}>
							Details
						</Text>
						<MaterialIcons
							name="chevron-right"
							size={20}
							color={colors.buttonPrimaryText}
						/>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);
};

type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminManageBookings"
>;
type ScreenRouteProp = RouteProp<AdminStackParamList, "AdminManageBookings">; // If using initialFilter from route params

interface AdminManageBookingsScreenProps {
	navigation: ScreenNavigationProp /* route: ScreenRouteProp; */;
} // Route prop commented out as not used

const AdminManageBookingsScreen: React.FC<AdminManageBookingsScreenProps> = ({
	navigation /*, route*/,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<BookingStatusAdmin>("All"); // Default to 'All'
	const [bookings, setBookings] = useState<BookingAdminView[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [counts, setCounts] = useState({
		All: 0,
		Active: 0,
		Upcoming: 0,
		Completed: 0,
		Cancelled: 0,
	});

	const loadBookings = useCallback(
		async (status: BookingStatusAdmin, query: string) => {
			setIsLoading(true);
			const fetchedBookings = await fetchAdminBookingsAPI({
				status,
				searchQuery: query,
			});
			setBookings(fetchedBookings);
			const newCounts = {
				All: 0,
				Active: 0,
				Upcoming: 0,
				Completed: 0,
				Cancelled: 0,
			};
			DUMMY_ADMIN_BOOKINGS.forEach((b) => {
				// Counts based on full dummy data
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
			"Advanced booking filter modal to be implemented."
		);
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Manage Bookings",
			headerRight: () => (
				<TouchableOpacity
					onPress={navigateToAdvancedFilters}
					style={styles.headerActionButton}>
					<MaterialIcons
						name="filter-list"
						size={24}
						color={colors.iconWhite}
					/>
					{activeStatusFilter !== "All" && (
						<Text style={styles.headerFilterLabelActive}>
							{activeStatusFilter}
						</Text>
					)}
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter]);

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

	const filterTabs: {
		label: BookingStatusAdmin;
		countKey: keyof typeof counts;
	}[] = [
		{ label: "All", countKey: "All" },
		{ label: "Active", countKey: "Active" },
		{ label: "Upcoming", countKey: "Upcoming" },
		{ label: "Completed", countKey: "Completed" },
		{ label: "Cancelled", countKey: "Cancelled" },
	];

	if (isLoading && bookings.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading bookings...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			<View style={styles.searchBarContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search by User, Booking ID or Bike..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholderTextColor={colors.textPlaceholder}
					returnKeyType="search"
				/>
			</View>
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
					<MaterialIcons
						name="event-busy"
						size={48}
						color={colors.textDisabled}
					/>
					<Text style={styles.noResultsText}>
						No{" "}
						{activeStatusFilter !== "All"
							? activeStatusFilter.toLowerCase()
							: ""}{" "}
						bookings found.
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
								item.status === "Active" ||
								item.status === "Upcoming"
									? () => handleCancelBooking(item.id)
									: undefined
							}
						/>
					)}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() =>
								loadBookings(activeStatusFilter, searchQuery)
							}
							tintColor={colors.primary}
							colors={[colors.primary]}
						/>
					}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
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
	headerActionButton: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: spacing.m,
		padding: spacing.xs,
	},
	headerFilterLabelActive: {
		marginLeft: spacing.xs,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.primary, // Use primary accent for active filter label in header
	},
	searchBarContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.s,
		backgroundColor: colors.backgroundCard,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	searchInput: {
		backgroundColor: colors.backgroundInput,
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		height: 44,
		color: colors.textPrimary,
	},
	tabFilterContainer: {
		flexDirection: "row",
		backgroundColor: colors.backgroundCard,
		paddingVertical: spacing.xs,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	filterTabButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginRight: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		backgroundColor: colors.backgroundCardOffset,
	},
	filterTabButtonActive: {
		backgroundColor: colors.primaryMuted, // Muted primary for active tab
		borderColor: colors.primary,
	},
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary,
	},
	filterTabButtonTextActive: {
		color: colors.primary, // Primary color for active text
		fontFamily: typography.primarySemiBold,
	},
	listContentContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
		paddingBottom: spacing.l,
	},
	noResultsText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.xl,
	},
	bookingCard: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	cardTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.m,
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
		borderRadius: borderRadius.circle,
		marginRight: spacing.s,
		backgroundColor: colors.borderDefault,
	},
	userNameContainer: {
		// To stack name and booking ID
		flex: 1,
	},
	userName: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
	},
	bookingIdText: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
	},
	statusBadge: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s - spacing.xxs,
		borderRadius: borderRadius.pill,
		flexDirection: "row",
		alignItems: "center",
		minWidth: 90,
		justifyContent: "center",
	},
	statusTextBase: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize",
	},
	statusBadgeActive: { backgroundColor: colors.successMuted },
	statusBadgeUpcoming: { backgroundColor: colors.infoMuted }, // Define if not present
	statusBadgeCompleted: { backgroundColor: colors.backgroundDisabled },
	statusBadgeCancelled: { backgroundColor: colors.errorMuted },
	statusTextSemantic: { color: colors.white },
	statusTextMuted: { color: colors.textSecondary },

	bikeInfoSection: {
		marginVertical: spacing.s,
		paddingLeft: spacing.xs,
	},
	bikeName: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	bikeIdText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
	},
	dateRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	detailIconThemed: {
		marginRight: spacing.s,
	},
	bikeDetailText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	assignedInfoSection: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.s,
		paddingTop: spacing.s,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
	},
	assignedAdminText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegularItalic,
		color: colors.textPlaceholder,
	},
	priceAndActionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.m,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.m,
	},
	priceText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.primary,
	},
	actionButtonsContainer: { flexDirection: "row", alignItems: "center" },
	actionButtonSmall: {
		// For smaller buttons like Cancel/Details in card
		borderRadius: borderRadius.m,
		paddingVertical: spacing.xs + 2,
		paddingHorizontal: spacing.m,
		marginLeft: spacing.s,
		flexDirection: "row",
		alignItems: "center",
	},
	actionButtonTextSmall: {
		fontSize: typography.fontSizes.xs, // Smaller text for these actions
		fontFamily: typography.primaryMedium,
	},
	viewDetailsButton: {
		// For TouchableOpacity
		backgroundColor: colors.primary,
	},
	viewDetailsButtonText: {
		color: colors.buttonPrimaryText,
		marginRight: spacing.xxs, // Space before chevron
	},
	cancelButton: {
		// For TouchableOpacity
		borderWidth: 1.5,
		borderColor: colors.error,
		backgroundColor: colors.backgroundCard, // Keep card background for outline
	},
	cancelButtonText: {
		color: colors.error,
	},
	// Removed adminAccentColor and adminAccentColorLight variables
});

export default AdminManageBookingsScreen;
