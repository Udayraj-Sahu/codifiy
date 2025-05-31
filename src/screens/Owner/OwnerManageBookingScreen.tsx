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
	BookingStatusOwnerView,
	OwnerStackParamList,
} from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
// PrimaryButton is not used directly on this screen in the provided code, but in OwnerBookingCard
// import PrimaryButton from "../../../components/common/PrimaryButton";

// --- Types and Dummy Data (structure remains, placeholders updated for dark theme) ---
interface BookingOwnerView {
	id: string;
	userPhotoUrl?: string;
	userName: string;
	status: Exclude<BookingStatusOwnerView, "All">;
	bikeName: string;
	bikeId: string;
	bookingDates: string;
	assignedAdminName?: string;
	price: string;
}

const DUMMY_OWNER_BOOKINGS_DATA: BookingOwnerView[] = [
	{
		id: "obk001",
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
		id: "obk002",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=PS",
		userName: "Priya Sharma",
		status: "Completed",
		bikeName: "Roadster 2K Deluxe",
		bikeId: "RX2000",
		bookingDates: "May 08 - May 10, 2025",
		price: "₹3000",
	},
	{
		id: "obk003",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=MJ",
		userName: "Mike Johnson",
		status: "Cancelled",
		bikeName: "City Cruiser Ltd",
		bikeId: "CC100",
		bookingDates: "Apr 05 - Apr 06, 2025",
		price: "₹4000",
	},
	{
		id: "obk004",
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
		id: "obk005",
		userPhotoUrl: "https://placehold.co/40x40/1A1A1A/F5F5F5?text=RB",
		userName: "Robert Brown",
		status: "Upcoming",
		bikeName: "Speedster Z",
		bikeId: "SZ700",
		bookingDates: "June 10 - June 12, 2025",
		price: "₹6000",
	},
];

const fetchOwnerBookingsAPI = async (filters: {
	searchQuery?: string;
	status?: BookingStatusOwnerView;
	otherFilters?: any; // This parameter isn't used in the dummy implementation
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
			resolve([...bookings]); // Return a copy
		}, 300);
	});
};
// --- End Dummy Data ---

// --- Reusable Components (Themed) ---
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
			{label} {typeof count === "number" ? `(${count})` : ""}
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
	const userPhotoPlaceholder =
		"https://placehold.co/40x40/1A1A1A/F5F5F5?text=U";

	const getStatusStyleInfo = (
		status: Exclude<BookingStatusOwnerView, "All" | "Upcoming">
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
			// Case for "Upcoming" should be handled if it's a possible status in item.status
			// default: return { badge: {}, text: {}, iconName: 'help-outline' }; // Should not be reached if status is typed
		}
	};
	const currentStatusInfo = getStatusStyleInfo(
		item.status === "Upcoming" ? "Active" : item.status
	); // Map upcoming to active style for now or create separate

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
						name="support-agent"
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
				<TouchableOpacity
					style={styles.viewDetailsButton}
					onPress={onViewDetails}>
					<Text style={styles.viewDetailsButtonText}>
						View Details
					</Text>
					<MaterialIcons
						name="chevron-right"
						size={22}
						color={colors.buttonPrimaryText}
					/>
				</TouchableOpacity>
			</View>
		</TouchableOpacity>
	);
};

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
		Upcoming: 0,
		Completed: 0,
		Cancelled: 0,
	});

	const loadBookings = useCallback(
		async (status: BookingStatusOwnerView, query: string) => {
			setIsLoading(true);
			const fetchedBookings = await fetchOwnerBookingsAPI({
				status,
				searchQuery: query,
			});
			setBookings(fetchedBookings);
			// Update counts based on ALL bookings, not just filtered ones for accurate tab counts
			const allDummyBookings = DUMMY_OWNER_BOOKINGS_DATA; // Use the full source for counts
			const newCounts = {
				All: allDummyBookings.length,
				Active: 0,
				Upcoming: 0,
				Completed: 0,
				Cancelled: 0,
			};
			allDummyBookings.forEach((b) => {
				if (b.status !== "All") newCounts[b.status]++; // Type assertion as BookingStatusOwnerView excludes 'All'
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
		navigation.navigate("OwnerBookingDetailsScreen", { bookingId });
	};

	const filterTabs: {
		label: BookingStatusOwnerView;
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
						<OwnerBookingCard
							item={item}
							onViewDetails={() => handleViewDetails(item.id)}
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
		// Added for active filter display in header
		marginLeft: spacing.xs,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.primary, // Use accent color to show filter is active
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
		borderColor: colors.borderDefault, // Border for inactive tabs
		backgroundColor: colors.backgroundCardOffset, // Slightly different from main card bg
	},
	filterTabButtonActive: {
		backgroundColor: colors.primary, // Primary color for active tab bg
		borderColor: colors.primary,
	},
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary,
	},
	filterTabButtonTextActive: {
		color: colors.buttonPrimaryText, // Text on primary bg
		fontFamily: typography.primarySemiBold,
	},
	listContentContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m, // Add top padding for the list
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
		marginBottom: spacing.m, // Increased margin
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
		// Style for booking ID under user name
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
	},
	statusBadge: {
		paddingHorizontal: spacing.m, // More padding
		paddingVertical: spacing.s - spacing.xxs, // Adjusted padding
		borderRadius: borderRadius.pill,
		flexDirection: "row",
		alignItems: "center",
		minWidth: 90, // Ensure badges have some min width
		justifyContent: "center",
	},
	statusTextBase: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize", // Use capitalize for better readability
	},
	statusBadgeActive: { backgroundColor: colors.successMuted },
	statusBadgeUpcoming: { backgroundColor: colors.infoMuted },
	statusBadgeCompleted: { backgroundColor: colors.backgroundDisabled },
	statusBadgeCancelled: { backgroundColor: colors.errorMuted },
	statusTextSemantic: { color: colors.white }, // For Active, Upcoming, Cancelled with muted semantic bg
	statusTextMuted: { color: colors.textSecondary }, // For Completed

	bikeInfoSection: {
		marginVertical: spacing.s,
		paddingLeft: spacing.xs, // Indent slightly
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
		marginRight: spacing.s, // Consistent icon spacing
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
		color: colors.textPlaceholder, // More muted
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
		color: colors.primary, // Accent for price
	},
	viewDetailsButton: {
		// For TouchableOpacity
		backgroundColor: colors.primary,
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
	},
	viewDetailsButtonText: {
		color: colors.buttonPrimaryText,
		fontFamily: typography.primarySemiBold,
		fontSize: typography.fontSizes.s,
		marginRight: spacing.xs, // Space before chevron
	},
	// Removed ownerAccentColor & ownerAccentColorLight, using theme.colors directly
});

export default OwnerManageBookingsScreen;
