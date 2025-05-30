// src/screens/Owner/OwnerDashboardScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
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
import { OwnerStackParamList } from "../../navigation/types";
import { logoutUser } from "../../store/slices/authSlice";
import {
	ActivityItemData,
	fetchOwnerKpiStatsThunk,
	fetchOwnerRecentActivityThunk, // For selecting from store
	KpiCardDisplayData,
} from "../../store/slices/ownerDashboardSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Helper Functions (can be moved to a utils file) ---
const deriveIconFromActivityType = (type?: string): string => {
	switch (
		type?.toUpperCase() // Normalize type for comparison
	) {
		case "NEW_USER":
			return "👤";
		case "NEW_BOOKING":
			return "➕🗓️";
		case "BOOKING_CONFIRMED":
			return "✔️🗓️";
		case "BOOKING_CANCELLED":
			return "❌🗓️";
		case "DOC_SUBMITTED":
			return "📄⬆️";
		case "DOC_APPROVED":
			return "✔️📄";
		case "DOC_REJECTED":
			return "❌📄";
		case "BIKE_ADDED":
			return "➕🚲";
		default:
			return "ℹ️";
	}
};

const formatActivityTimestamp = (isoDate?: string): string => {
	if (!isoDate) return "Some time ago";
	try {
		const date = new Date(isoDate);
		const now = new Date();
		const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

		if (diffSeconds < 5) return "Just now";
		if (diffSeconds < 60) return `${diffSeconds}s ago`;
		const diffMinutes = Math.round(diffSeconds / 60);
		if (diffMinutes < 60) return `${diffMinutes}m ago`;
		const diffHours = Math.round(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffHours < 168) return `${Math.round(diffHours / 24)}d ago`; // Up to 7 days
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	} catch (e) {
		return "A while ago";
	}
};

// --- Reusable Components ---
const KpiCard: React.FC<{ item: KpiCardDisplayData }> = ({ item }) => (
	/* ... as before ... */ <View
		style={[
			styles.kpiCard,
			{ backgroundColor: item.backgroundColor || colors.backgroundLight },
		]}>
		<Text
			style={[
				styles.kpiIcon,
				{ color: item.iconColor || colors.textPrimary },
			]}>
			{item.iconPlaceholder}
		</Text>
		<Text style={styles.kpiValue}>{item.value}</Text>
		<Text style={styles.kpiLabel}>{item.label}</Text>
	</View>
);

interface DisplayActivityItem extends ActivityItemData {
	icon: string;
	formattedTimestamp: string;
	action?: () => void; // For navigation
}
const ActivityListItem: React.FC<{ item: DisplayActivityItem }> = ({
	item,
}) => (
	<TouchableOpacity
		style={styles.activityItem}
		onPress={item.action}
		disabled={!item.action}
		activeOpacity={item.action ? 0.7 : 1}>
		<Text style={styles.activityItemIcon}>{item.icon}</Text>
		<View style={styles.activityItemTextContainer}>
			<Text style={styles.activityItemMessage} numberOfLines={2}>
				{item.message}
			</Text>
			<Text style={styles.activityItemTimestamp}>
				{item.formattedTimestamp}
			</Text>
		</View>
		{item.action && <Text style={styles.activityItemArrow}>›</Text>}
	</TouchableOpacity>
);

interface QuickActionData {
	id: string;
	label: string;
	iconPlaceholder: string;
	onPress: () => void;
}
const QuickActionTile: React.FC<{ item: QuickActionData }> = ({ item }) => (
	/* ... as before ... */ <TouchableOpacity
		style={styles.quickActionTile}
		onPress={item.onPress}
		activeOpacity={0.7}>
		<View style={styles.quickActionTileIconContainer}>
			<Text style={styles.quickActionTileIcon}>
				{item.iconPlaceholder}
			</Text>
		</View>
		<Text style={styles.quickActionTileLabel}>{item.label}</Text>
	</TouchableOpacity>
);

type ScreenNavigationProp = StackNavigationProp<
	OwnerStackParamList,
	"OwnerDashboard"
>;
interface OwnerDashboardScreenProps {
	navigation: ScreenNavigationProp;
}

const OwnerDashboardScreen: React.FC<OwnerDashboardScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		kpiStats: rawKpiStats,
		recentActivity: rawRecentActivity,
		isLoadingKpis,
		isLoadingActivity,
		errorKpis,
		errorActivity,
	} = useSelector((state: RootState) => state.ownerDashboard);
	const authUser = useSelector((state: RootState) => state.auth.user);

	const loadDashboardData = useCallback(
		(isRefreshing = false) => {
			if (!isRefreshing && (isLoadingKpis || isLoadingActivity)) return;
			dispatch(fetchOwnerKpiStatsThunk());
			dispatch(fetchOwnerRecentActivityThunk({ limit: 6 }));
		},
		[dispatch, isLoadingKpis, isLoadingActivity]
	);

	useEffect(() => {
		loadDashboardData();
		const unsubscribe = navigation.addListener("focus", () => {
			loadDashboardData(true);
		});
		return unsubscribe;
	}, [navigation, loadDashboardData]);

	const handleLogout = () => {
		/* ... as before, using Redux logoutUser ... */ Alert.alert(
			"Logout",
			"Are you sure you want to logout?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Logout",
					style: "destructive",
					onPress: () => dispatch(logoutUser()),
				},
			]
		);
	};

	useLayoutEffect(() => {
		/* ... as before ... */ navigation.setOptions({
			title: "Owner Dashboard",
			headerTitleAlign: "center",
			headerLeft: () => (
				<TouchableOpacity
					onPress={() =>
						navigation.navigate("OwnerProfileScreen" as any)
					}
					style={{ marginLeft: spacing.m }}>
					<Text style={{ fontSize: 22, color: colors.textPrimary }}>
						👤
					</Text>
				</TouchableOpacity>
			),
			headerRight: () => (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginRight: spacing.s,
					}}>
					<TouchableOpacity
						onPress={() =>
							navigation.navigate("OwnerSettingsScreen" as any)
						}
						style={{ paddingHorizontal: spacing.s }}>
						<Text
							style={{ fontSize: 22, color: colors.textPrimary }}>
							⚙️
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleLogout}
						style={{
							paddingLeft: spacing.s,
							paddingRight: spacing.xs,
						}}>
						<Text style={{ fontSize: 22, color: colors.error }}>
							🚪
						</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, handleLogout]);

	const displayKpis: KpiCardDisplayData[] = useMemo(() => {
		return [
			{
				id: "s1",
				label: "Total Bikes",
				value: rawKpiStats.totalBikes ?? "N/A",
				iconPlaceholder: "🚲",
				backgroundColor: colors.infoLight,
				iconColor: colors.infoDark,
			},
			{
				id: "s2",
				label: "Total Users",
				value: rawKpiStats.registeredUsers ?? "N/A",
				iconPlaceholder: "👥",
				backgroundColor: colors.successLight,
				iconColor: colors.successDark,
			},
			{
				id: "s3",
				label: "Active Bookings",
				value: rawKpiStats.activeBookings ?? "N/A",
				iconPlaceholder: "🗓️",
				backgroundColor: (colors as any).purpleLight || "#E8DAEF",
				iconColor: (colors as any).purpleDark,
			}, // Assuming activeBookings comes from backend
			{
				id: "s4",
				label: "Pending Docs",
				value: rawKpiStats.pendingDocuments ?? "N/A",
				iconPlaceholder: "📄",
				backgroundColor: (colors as any).peachLight || "#FFE9D4",
				iconColor: (colors as any).peachDark,
			},
		];
	}, [rawKpiStats]);

	const displayRecentActivity: DisplayActivityItem[] = useMemo(() => {
		return rawRecentActivity.map((act) => ({
			...act,
			icon: deriveIconFromActivityType(act.type),
			formattedTimestamp: formatActivityTimestamp(act.timestamp),
			action: () => {
				// Define navigation actions based on activity type
				if (
					act.type === "DOC_SUBMITTED" &&
					act.relatedDetails?.documentId
				) {
					navigation.navigate("DocumentApprovalListScreen", {
						filter: "pending",
					}); // Or to specific document
				} else if (
					act.type === "NEW_BOOKING" &&
					act.relatedDetails?.bookingId
				) {
					navigation.navigate("OwnerManageBookingsScreen", {
						initialFilter: "Active",
					}); // Or to specific booking
				} else if (
					act.type === "NEW_USER" &&
					act.relatedDetails?.userId
				) {
					navigation.navigate("RoleManagementScreen"); // Or to specific user
				}
				// Add more navigation cases as needed
			},
		}));
	}, [rawRecentActivity, navigation]);

	const QUICK_ACTIONS: QuickActionData[] = [
		/* ... as before ... */ {
			id: "qa1",
			label: "User Management",
			iconPlaceholder: "🛠️👤",
			onPress: () => navigation.navigate("RoleManagementScreen"),
		},
		{
			id: "qa2",
			label: "Manage Bookings",
			iconPlaceholder: "📅",
			onPress: () => navigation.navigate("OwnerManageBookingsScreen"),
		},
		{
			id: "qa3",
			label: "Document Verification",
			iconPlaceholder: "✔️📄",
			onPress: () =>
				navigation.navigate("DocumentApprovalListScreen", {
					filter: "pending",
				}),
		},
	];

	const renderKpiSection = () => {
		/* ... as before, using displayKpis ... */ if (
			isLoadingKpis &&
			displayKpis.every((s) => s.value === "N/A")
		)
			return (
				<ActivityIndicator
					color={colors.primary}
					style={styles.sectionLoader}
				/>
			);
		if (errorKpis)
			return (
				<Text style={styles.errorText}>
					Error loading stats: {errorKpis}
				</Text>
			);
		if (
			displayKpis.length === 0 ||
			displayKpis.every((s) => s.value === "N/A" && !isLoadingKpis)
		)
			return (
				<Text style={styles.noDataText}>No statistics available.</Text>
			);
		return (
			<View style={styles.statsGrid}>
				{displayKpis.map((kpi) => (
					<KpiCard key={kpi.id} item={kpi} />
				))}
			</View>
		);
	};
	const renderActivitySection = () => {
		/* ... as before, using displayRecentActivity ... */ if (
			isLoadingActivity &&
			displayRecentActivity.length === 0
		)
			return (
				<ActivityIndicator
					color={colors.primary}
					style={styles.sectionLoader}
				/>
			);
		if (errorActivity)
			return (
				<Text style={styles.errorText}>
					Error loading activity: {errorActivity}
				</Text>
			);
		if (displayRecentActivity.length === 0 && !isLoadingActivity)
			return <Text style={styles.noDataText}>No recent activity.</Text>;
		return (
			<View style={styles.activityListContainer}>
				{displayRecentActivity.map((activity) => (
					<ActivityListItem key={activity.id} item={activity} />
				))}
			</View>
		);
	};

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
				Welcome, {authUser?.fullName || "Owner"}!
			</Text>
			<Text style={styles.welcomeSubtitle}>
				Overview of your Bikya platform.
			</Text>
			{renderKpiSection()}
			<Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
			<View style={styles.quickActionsContainer}>
				{QUICK_ACTIONS.map((action) => (
					<QuickActionTile key={action.id} item={action} />
				))}
			</View>
			<Text style={styles.sectionHeaderTitle}>Recent Activity</Text>
			{renderActivitySection()}
		</ScrollView>
	);
};

// Styles (Keep your existing styles, ensure sectionLoader, errorText, noDataText are defined)
const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white },
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xl },
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
	kpiCard: {
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
	kpiIcon: { fontSize: 28, marginBottom: spacing.s },
	kpiValue: {
		fontSize: typography.fontSizes.xxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	kpiLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		textAlign: "center",
	},
	sectionHeaderTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		marginTop: spacing.s,
	},
	quickActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: spacing.l,
		backgroundColor: colors.infoLight,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.l,
	},
	quickActionTile: {
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F5F9FC",
		borderRadius: borderRadius.l,
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.s,
		width: "30%",
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	quickActionTileIconContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: colors.white,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.s,
		elevation: 1,
		shadowColor: colors.greyMedium,
	},
	quickActionTileIcon: { fontSize: 24, color: colors.primary },
	quickActionTileLabel: {
		fontSize: typography.fontSizes.xs,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "center",
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
	activityItemTextContainer: { flex: 1, marginRight: spacing.s },
	activityItemMessage: {
		fontSize: typography.fontSizes.s,
		color: colors.textPrimary,
	},
	activityItemTimestamp: {
		fontSize: typography.fontSizes.xs,
		color: colors.textLight,
		marginTop: spacing.xxs,
	},
	activityItemArrow: {
		fontSize: typography.fontSizes.l,
		color: colors.textLight,
	},
	sectionLoader: { marginVertical: spacing.l },
	errorText: {
		color: colors.error,
		textAlign: "center",
		paddingVertical: spacing.l,
		fontSize: typography.fontSizes.m,
	},
	noDataText: {
		color: colors.textMedium,
		textAlign: "center",
		paddingVertical: spacing.l,
		fontStyle: "italic",
		fontSize: typography.fontSizes.m,
	},
});

export default OwnerDashboardScreen;
