// src/screens/Admin/AdminDashboardScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react"; // Added useEffect, useCallback
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AdminStackParamList } from "../../navigation/types";
import {
	ActivityItemData,
	fetchAdminKpiStatsThunk,
	fetchAdminRecentActivityThunk,
} from "../../store/slices/adminDashboardSlice"; // Corrected import
import { logoutUser } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Types (StatisticItem is now for display, mapped from KpiStatsData) ---
interface StatisticItemDisplay {
	id: string;
	label: string;
	value: string | number;
	iconPlaceholder: string;
	color?: string;
}
// PrimaryActionItem can remain as is, as it's for navigation
interface PrimaryActionItem {
	id: string;
	label: string;
	iconPlaceholder: string;
	onPress: () => void;
}
// ActivityItemData is imported from slice

// --- Reusable Components (Keep as is, ensure props match new types) ---
const StatisticCard: React.FC<{ item: StatisticItemDisplay }> = ({ item }) => (
	<View style={styles.statCard}>
		<Text
			style={[styles.statIcon, { color: item.color || colors.primary }]}>
			{item.iconPlaceholder}
		</Text>
		<Text style={styles.statValue}>{item.value}</Text>
		<Text style={styles.statLabel}>{item.label}</Text>
	</View>
);
const PrimaryAction: React.FC<{ item: PrimaryActionItem }> = ({ item }) => (
	/* ... as before ... */ <TouchableOpacity
		style={styles.primaryActionCard}
		onPress={item.onPress}
		activeOpacity={0.7}>
		<Text style={styles.primaryActionIcon}>{item.iconPlaceholder}</Text>
		<Text style={styles.primaryActionLabel}>{item.label}</Text>
	</TouchableOpacity>
);
const ActivityFeedItem: React.FC<{ item: ActivityItemData }> = ({ item }) => (
	<View style={styles.activityItem}>
		<Text style={styles.activityIcon}>{item.iconPlaceholder}</Text>
		<View style={styles.activityTextContainer}>
			<Text style={styles.activityDescription} numberOfLines={2}>
				{item.description}
			</Text>
			<Text style={styles.activityTimestamp}>{item.timestamp}</Text>
		</View>
	</View>
);

type AdminDashboardScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminDashboard"
>;
interface AdminDashboardScreenProps {
	navigation: AdminDashboardScreenNavigationProp;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		kpiStats: rawKpiStats, // This will be an object like { totalBikes: 10, ... }
		recentActivity,
		isLoadingKpis,
		isLoadingActivity,
		errorKpis,
		errorActivity,
	} = useSelector((state: RootState) => state.adminDashboard);
	const authUser = useSelector((state: RootState) => state.auth.user);

	const [searchQuery, setSearchQuery] = useState(""); // Local state for search input

	const loadDashboardData = useCallback(
		(isRefreshing = false) => {
			if (!isRefreshing && (isLoadingKpis || isLoadingActivity)) return; // Prevent multiple simultaneous fetches
			dispatch(fetchAdminKpiStatsThunk());
			dispatch(fetchAdminRecentActivityThunk({ limit: 6 })); // Fetch 6 recent activities
		},
		[dispatch, isLoadingKpis, isLoadingActivity]
	);

	useEffect(() => {
		loadDashboardData();
		const unsubscribe = navigation.addListener("focus", () => {
			loadDashboardData(true); // Refresh data on focus
		});
		return unsubscribe;
	}, [navigation, loadDashboardData]);

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: () => dispatch(logoutUser()),
			},
		]);
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity
					onPress={() => navigation.navigate("AdminProfile")}
					style={{ marginLeft: spacing.m }}>
					<Text style={{ fontSize: 22, color: colors.primary }}>
						👤
					</Text>
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity
					onPress={() => navigation.navigate("AdminNotifications")}
					style={{ marginRight: spacing.m }}>
					<Text style={{ fontSize: 22, color: colors.primary }}>
						🔔
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	// Transform rawKpiStats from Redux store into the array format needed by StatisticCard
	const displayStats: StatisticItemDisplay[] = React.useMemo(() => {
		return [
			{
				id: "s1",
				label: "Total Bikes",
				value: rawKpiStats.totalBikes ?? "N/A",
				iconPlaceholder: "🚲",
				color: colors.info,
			},
			{
				id: "s2",
				label: "Active Bookings",
				value: rawKpiStats.activeBookings ?? "N/A",
				iconPlaceholder: "🗓️",
				color: colors.success,
			},
			{
				id: "s3",
				label: "Pending Docs",
				value: rawKpiStats.pendingDocuments ?? "N/A",
				iconPlaceholder: "📄",
				color: colors.warning,
			},
			{
				id: "s4",
				label: "Registered Users",
				value: rawKpiStats.registeredUsers ?? "N/A",
				iconPlaceholder: "👥",
				color: (colors as any).purple || colors.primaryDark,
			},
		];
	}, [rawKpiStats]);

	const primaryActions: PrimaryActionItem[] = [
		{
			id: "pa1",
			label: "Manage Bikes",
			iconPlaceholder: "🚲",
			onPress: () => navigation.navigate("AdminManageBikes"),
		},
		{
			id: "pa2",
			label: "Manage Bookings",
			iconPlaceholder: "📅",
			onPress: () => navigation.navigate("AdminManageBookings"),
		},
		{
			id: "pa3",
			label: "View Documents",
			iconPlaceholder: "📄",
			onPress: () =>
				navigation.navigate("AdminDocumentList", {
					initialStatus: "approved",
				}),
		}, // Admin sees approved by default
	];

	const handleSearch = (query: string) => {
		/* TODO: Implement if dashboard search is needed */
	};

	if (
		(isLoadingKpis && displayStats.every((s) => s.value === "N/A")) ||
		(isLoadingActivity && recentActivity.length === 0 && !authUser)
	) {
		return (
			<View style={styles.centeredLoader}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: spacing.s }}>
					Loading Dashboard...
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}
			refreshControl={
				<RefreshControl
					refreshing={isLoadingKpis || isLoadingActivity}
					onRefresh={() => loadDashboardData(true)}
					colors={[colors.primary]}
					tintColor={colors.primary}
				/>
			}>
			<Text style={styles.welcomeTitle}>
				Welcome back, {authUser?.fullName || "Admin"}!
			</Text>
			<Text style={styles.welcomeSubtitle}>
				Here's what's happening with Bikya today.
			</Text>

			{isLoadingKpis && displayStats.every((s) => s.value === "N/A") ? (
				<ActivityIndicator color={colors.primary} />
			) : errorKpis ? (
				<Text style={styles.errorText}>
					Failed to load stats: {errorKpis}
				</Text>
			) : (
				<View style={styles.statsGrid}>
					{displayStats.map((stat) => (
						<StatisticCard key={stat.id} item={stat} />
					))}
				</View>
			)}

			<View style={styles.primaryActionsContainer}>
				{primaryActions.map((action) => (
					<PrimaryAction key={action.id} item={action} />
				))}
			</View>

			{/* Search Bar - Optional */}
			{/* <View style={styles.searchBarContainer}> ... </View> */}

			<Text style={styles.sectionTitle}>Recent Activity</Text>
			{isLoadingActivity && recentActivity.length === 0 ? (
				<ActivityIndicator color={colors.primary} />
			) : errorActivity ? (
				<Text style={styles.errorText}>
					Failed to load activity: {errorActivity}
				</Text>
			) : (
				<View style={styles.activityListContainer}>
					{recentActivity.length > 0 ? (
						recentActivity.map((activity) => (
							<ActivityFeedItem
								key={activity.id}
								item={activity}
							/>
						))
					) : (
						<Text style={styles.noActivityText}>
							No recent activity.
						</Text>
					)}
				</View>
			)}

			<View style={styles.logoutContainer}>
				<TouchableOpacity
					style={styles.logoutButton}
					onPress={handleLogout}>
					<Text style={styles.logoutButtonIcon}>🚪</Text>
					<Text style={styles.logoutButtonText}>Logout</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

// Styles (Ensure they are complete and correct, added centeredLoader, errorText, noDataText)
const adminAccentColor = colors.info || "#A0D2DB";
const adminAccentLightColor = colors.infoLight || "#E0F3FF";

const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white },
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xl },
	centeredLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
	errorText: {
		color: colors.error,
		textAlign: "center",
		marginVertical: spacing.m,
	},
	noDataText: {
		color: colors.textMedium,
		textAlign: "center",
		marginVertical: spacing.m,
		fontStyle: "italic",
	},
	welcomeTitle: {
		fontSize: typography.fontSizes.xxxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	welcomeSubtitle: {
		fontSize: typography.fontSizes.l,
		color: colors.textSecondary,
		marginBottom: spacing.xl,
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: spacing.l,
	},
	statCard: {
		backgroundColor: colors.backgroundLight || "#F5F9FC",
		width: "48%",
		padding: spacing.m,
		borderRadius: borderRadius.l,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
		aspectRatio: 1.1,
	},
	statIcon: { fontSize: 28, marginBottom: spacing.s },
	statValue: {
		fontSize: typography.fontSizes.xxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	statLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		textAlign: "center",
	},
	primaryActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "stretch",
		marginBottom: spacing.l,
		backgroundColor: adminAccentLightColor,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.l,
	},
	primaryActionCard: {
		alignItems: "center",
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.xs,
		borderRadius: borderRadius.m,
		flex: 1,
		marginHorizontal: spacing.xs,
	},
	primaryActionIcon: {
		fontSize: 30,
		color: adminAccentColor,
		marginBottom: spacing.s,
	},
	primaryActionLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "center",
	},
	searchBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		marginBottom: spacing.l,
		height: 48,
	},
	searchIcon: {
		fontSize: 20,
		color: colors.textMedium,
		marginRight: spacing.s,
	},
	searchInput: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		height: "100%",
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		marginTop: spacing.s,
	},
	activityListContainer: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		paddingHorizontal: spacing.s,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	activityItemIcon: {
		fontSize: 18,
		color: colors.textMedium,
		marginRight: spacing.m,
		width: 24,
		textAlign: "center",
	},
	activityItemTextContainer: { flex: 1 },
	activityItemMessage: {
		fontSize: typography.fontSizes.s,
		color: colors.textPrimary,
	},
	activityItemTimestamp: {
		fontSize: typography.fontSizes.xs,
		color: colors.textLight,
		marginTop: spacing.xxs,
	},
	noActivityText: {
		color: colors.textMedium,
		textAlign: "center",
		paddingVertical: spacing.l,
		fontStyle: "italic",
	},
	logoutContainer: { marginTop: spacing.xl, alignItems: "center" },
	logoutButton: {
		flexDirection: "row",
		backgroundColor: colors.errorLight,
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.xl,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.error,
	},
	logoutButtonIcon: {
		marginRight: spacing.s,
		fontSize: 18,
		color: colors.error,
	},
	logoutButtonText: {
		color: colors.error,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
	},
});

export default AdminDashboardScreen;
