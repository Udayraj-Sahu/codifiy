// src/screens/Admin/AdminDashboardScreen.tsx
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../components/common/PrimaryButton"; // Import PrimaryButton
import { AdminStackParamList } from "../../navigation/types";
import {
	ActivityItemData,
	fetchAdminKpiStatsThunk,
	fetchAdminRecentActivityThunk,
} from "../../store/slices/adminDashboardSlice";
import { logoutUser } from "../../store/slices/authSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Types ---
interface StatisticItemDisplay {
	id: string;
	label: string;
	value: string | number;
	iconName: keyof typeof MaterialIcons.glyphMap;
	backgroundColor?: string;
	iconColor?: string;
}
interface PrimaryActionItem {
	id: string;
	label: string;
	iconName: keyof typeof MaterialIcons.glyphMap;
	onPress: () => void;
	backgroundColor?: string;
	iconBackgroundColor?: string;
	iconColor?: string;
}

const deriveIconDetailsForActivity = (
	type?: string
): { name: keyof typeof MaterialIcons.glyphMap; color: string } => {
	switch (type?.toUpperCase()) {
		case "NEW_USER_REGISTERED":
			return { name: "person-add", color: colors.info };
		case "NEW_BOOKING_CREATED":
			return { name: "event-note", color: colors.primary };
		case "BOOKING_COMPLETED":
			return { name: "check-circle", color: colors.success };
		case "BIKE_ADDED_TO_PLATFORM":
			return { name: "add-circle", color: colors.success };
		case "DOCUMENT_PENDING_APPROVAL":
			return { name: "pending-actions", color: colors.warning };
		case "LOW_RATING_RECEIVED":
			return { name: "star-half", color: colors.warning };
		case "SUPPORT_TICKET_RAISED":
			return { name: "support-agent", color: colors.error };
		default:
			return { name: "notifications", color: colors.textSecondary };
	}
};
const formatActivityTimestampForAdmin = (isoDate?: string): string => {
	if (!isoDate) return "Recently";
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
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch (e) {
		return "A while ago";
	}
};

const StatisticCard: React.FC<{ item: StatisticItemDisplay }> = ({ item }) => (
	<View
		style={[
			styles.statCard,
			{ backgroundColor: item.backgroundColor || colors.backgroundCard },
		]}>
		<MaterialIcons
			name={item.iconName}
			size={28}
			color={item.iconColor || colors.primary}
			style={styles.statIconThemed}
		/>
		<Text style={styles.statValue}>{item.value}</Text>
		<Text style={styles.statLabel}>{item.label}</Text>
	</View>
);

const PrimaryAction: React.FC<{ item: PrimaryActionItem }> = ({ item }) => (
	<TouchableOpacity
		style={[
			styles.primaryActionCard,
			{ backgroundColor: item.backgroundColor || colors.backgroundCard },
		]}
		onPress={item.onPress}
		activeOpacity={0.7}>
		<View
			style={[
				styles.primaryActionIconContainer,
				{
					backgroundColor:
						item.iconBackgroundColor || colors.backgroundMain,
				},
			]}>
			<MaterialIcons
				name={item.iconName}
				size={30}
				color={item.iconColor || colors.primary}
			/>
		</View>
		<Text style={styles.primaryActionLabel}>{item.label}</Text>
	</TouchableOpacity>
);

interface DisplayActivityItemAdmin extends ActivityItemData {
	iconName: keyof typeof MaterialIcons.glyphMap;
	iconColor: string;
	formattedTimestamp: string;
}
const ActivityFeedItem: React.FC<{ item: DisplayActivityItemAdmin }> = ({
	item,
}) => (
	<View style={styles.activityItem}>
		<MaterialIcons
			name={item.iconName}
			size={22}
			color={item.iconColor}
			style={styles.activityIconThemed}
		/>
		<View style={styles.activityTextContainer}>
			<Text style={styles.activityDescription} numberOfLines={2}>
				{item.description}
			</Text>
			<Text style={styles.activityTimestamp}>
				{item.formattedTimestamp}
			</Text>
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
		kpiStats: rawKpiStats,
		recentActivity,
		isLoadingKpis,
		isLoadingActivity,
		errorKpis,
		errorActivity,
	} = useSelector((state: RootState) => state.adminDashboard);
	const authUser = useSelector((state: RootState) => state.auth.user);

	const loadDashboardData = useCallback(
		(isRefreshing = false) => {
			if (
				!isRefreshing &&
				(isLoadingKpis ||
					(isLoadingActivity && recentActivity.length === 0))
			) {
				return;
			}
			dispatch(fetchAdminKpiStatsThunk());
			dispatch(fetchAdminRecentActivityThunk({ limit: 6 }));
		},
		[dispatch, recentActivity.length]
	);

	useEffect(() => {
		loadDashboardData();
		const unsubscribe = navigation.addListener("focus", () => {
			loadDashboardData(true);
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
					<MaterialIcons
						name="account-circle"
						size={28}
						color={colors.iconWhite}
					/>
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
							navigation.navigate("AdminNotifications")
						}
						style={{ paddingHorizontal: spacing.s }}>
						<MaterialIcons
							name="notifications"
							size={24}
							color={colors.iconWhite}
						/>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleLogout}
						style={{
							paddingLeft: spacing.s,
							paddingRight: spacing.xs,
						}}>
						<MaterialIcons
							name="logout"
							size={24}
							color={colors.error}
						/>
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, handleLogout]); // handleLogout is stable due to useCallback or being defined outside

	const displayStats: StatisticItemDisplay[] = useMemo(() => {
		const kpiThemes = {
			totalBikes: {
				icon: "directions-bike" as const,
				bg: colors.infoMuted,
				iconColor: colors.info,
			},
			activeBookings: {
				icon: "event-note" as const,
				bg: colors.successMuted,
				iconColor: colors.success,
			},
			pendingDocs: {
				icon: "pending-actions" as const,
				bg: colors.warningMuted,
				iconColor: colors.warning,
			},
			registeredUsers: {
				icon: "people" as const,
				bg: colors.primaryMuted,
				iconColor: colors.primary,
			},
		};
		return [
			{
				id: "s1",
				label: "Total Bikes",
				value: rawKpiStats.totalBikes ?? "N/A",
				iconName: kpiThemes.totalBikes.icon,
				backgroundColor: kpiThemes.totalBikes.bg,
				iconColor: kpiThemes.totalBikes.iconColor,
			},
			{
				id: "s2",
				label: "Active Bookings",
				value: rawKpiStats.activeBookings ?? "N/A",
				iconName: kpiThemes.activeBookings.icon,
				backgroundColor: kpiThemes.activeBookings.bg,
				iconColor: kpiThemes.activeBookings.iconColor,
			},
			{
				id: "s3",
				label: "Pending Docs",
				value: rawKpiStats.pendingDocuments ?? "N/A",
				iconName: kpiThemes.pendingDocs.icon,
				backgroundColor: kpiThemes.pendingDocs.bg,
				iconColor: kpiThemes.pendingDocs.iconColor,
			},
			{
				id: "s4",
				label: "Users",
				value: rawKpiStats.registeredUsers ?? "N/A",
				iconName: kpiThemes.registeredUsers.icon,
				backgroundColor: kpiThemes.registeredUsers.bg,
				iconColor: kpiThemes.registeredUsers.iconColor,
			},
		];
	}, [rawKpiStats]);

	const primaryActions: PrimaryActionItem[] = useMemo(
		() => [
			{
				id: "pa1",
				label: "Manage Bikes",
				iconName: "two-wheeler",
				onPress: () => navigation.navigate("AdminManageBikes"),
				backgroundColor: colors.backgroundCardOffset,
				iconColor: colors.primary,
			},
			{
				id: "pa2",
				label: "Manage Bookings",
				iconName: "event-note",
				onPress: () => navigation.navigate("AdminManageBookings"),
				backgroundColor: colors.backgroundCardOffset,
				iconColor: colors.primary,
			},
			{
				id: "pa3",
				label: "Verify Documents",
				iconName: "fact-check",
				onPress: () =>
					navigation.navigate("AdminDocumentList", {
						initialStatus: "pending",
					}),
				backgroundColor: colors.backgroundCardOffset,
				iconColor: colors.primary,
			},
			{
				id: "pa4",
				label: "User Roles",
				iconName: "admin-panel-settings",
				onPress: () =>
					navigation.navigate("AdminRoleManagement" as any),
				backgroundColor: colors.backgroundCardOffset,
				iconColor: colors.primary,
			},
		],
		[navigation]
	);

	const displayRecentActivity: DisplayActivityItemAdmin[] = useMemo(() => {
		return recentActivity.map((act) => {
			const iconDetails = deriveIconDetailsForActivity(act.type);
			return {
				...act,
				iconName: iconDetails.name,
				iconColor: iconDetails.color,
				formattedTimestamp: formatActivityTimestampForAdmin(
					act.timestamp
				),
			};
		});
	}, [recentActivity]);

	if (
		(isLoadingKpis && displayStats.every((s) => s.value === "N/A")) ||
		(isLoadingActivity && recentActivity.length === 0 && !authUser)
	) {
		return (
			<View style={styles.centeredLoader}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading Dashboard...</Text>
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
			<Text style={styles.welcomeTitle}>Admin Panel</Text>
			<Text style={styles.welcomeSubtitle}>
				Welcome, {authUser?.fullName?.split(" ")[0] || "Admin"}!
			</Text>

			{isLoadingKpis && displayStats.every((s) => s.value === "N/A") ? (
				<ActivityIndicator
					color={colors.primary}
					style={styles.sectionLoader}
				/>
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

			<Text style={styles.sectionTitle}>Primary Actions</Text>
			<View style={styles.primaryActionsContainer}>
				{primaryActions.map((action) => (
					<PrimaryAction key={action.id} item={action} />
				))}
			</View>

			<Text style={styles.sectionTitle}>Recent Activity</Text>
			{isLoadingActivity && displayRecentActivity.length === 0 ? (
				<ActivityIndicator
					color={colors.primary}
					style={styles.sectionLoader}
				/>
			) : errorActivity ? (
				<Text style={styles.errorText}>
					Failed to load activity: {errorActivity}
				</Text>
			) : (
				<View style={styles.activityListContainer}>
					{displayRecentActivity.length > 0 ? (
						displayRecentActivity.map((activity) => (
							<ActivityFeedItem
								key={activity.id}
								item={activity}
							/>
						))
					) : (
						<View style={styles.noActivityContainer}>
							<MaterialIcons
								name="history-toggle-off"
								size={32}
								color={colors.textDisabled}
							/>
							<Text style={styles.noActivityText}>
								No recent activity to display.
							</Text>
						</View>
					)}
				</View>
			)}

			{/* Added Logout Button Section at the bottom */}
			<View style={styles.bottomActionContainer}>
				<PrimaryButton
					title="Logout"
					onPress={handleLogout}
					style={styles.bottomLogoutButton}
					textStyle={styles.bottomLogoutButtonText}
					iconLeft={
						<MaterialIcons
							name="exit-to-app"
							size={20}
							color={colors.error}
						/>
					}
					variant="outline" // Assuming your PrimaryButton supports variants
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl, // Ensure space for logout button
	},
	centeredLoader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain,
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary,
		fontFamily: typography.primaryRegular,
	},
	errorText: {
		color: colors.textError,
		textAlign: "center",
		marginVertical: spacing.m,
		fontFamily: typography.primaryRegular,
		fontSize: typography.fontSizes.m,
	},
	noDataText: {
		color: colors.textSecondary,
		textAlign: "center",
		marginVertical: spacing.m,
		fontStyle: "italic",
		fontFamily: typography.primaryRegular,
	},
	welcomeTitle: {
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	welcomeSubtitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
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
		width: "48%",
		padding: spacing.m,
		borderRadius: borderRadius.l,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		aspectRatio: 1.1,
	},
	statIconThemed: {
		marginBottom: spacing.s,
	},
	statValue: {
		fontSize: typography.fontSizes.xxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	statLabel: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
	},
	primaryActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "stretch",
		marginBottom: spacing.xl,
		backgroundColor: colors.backgroundCard,
		paddingVertical: spacing.s,
		borderRadius: borderRadius.l,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	primaryActionCard: {
		alignItems: "center",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.xs,
		borderRadius: borderRadius.m,
		flex: 1,
		marginHorizontal: spacing.xs,
		minHeight: 100,
		justifyContent: "center",
	},
	primaryActionIconContainer: {
		width: 50,
		height: 50,
		borderRadius: borderRadius.circle,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	primaryActionLabel: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
		textAlign: "center",
		marginTop: spacing.xs,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		marginTop: spacing.l,
	},
	activityListContainer: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		paddingHorizontal: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
	},
	activityItemLast: {
		// Add this if you want to remove border for last item
		borderBottomWidth: 0,
	},
	activityIconThemed: {
		marginRight: spacing.m,
		width: 24,
		textAlign: "center",
	},
	activityTextContainer: { flex: 1 },
	activityDescription: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary,
	},
	activityTimestamp: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
		marginTop: spacing.xxs,
	},
	noActivityContainer: {
		// For empty activity list
		alignItems: "center",
		paddingVertical: spacing.xl,
	},
	noActivityText: {
		color: colors.textSecondary,
		textAlign: "center",
		fontStyle: "italic",
		fontFamily: typography.primaryRegular,
		fontSize: typography.fontSizes.m,
		marginTop: spacing.s,
	},
	sectionLoader: {
		marginVertical: spacing.l,
		alignSelf: "center",
	},
	bottomActionContainer: {
		// Renamed from logoutContainer for clarity
		marginTop: spacing.xl,
		paddingHorizontal: spacing.m, // Add horizontal padding if button is not fullWidth
		paddingBottom: spacing.m, // Space at the very bottom
	},
	bottomLogoutButton: {
		// Style for PrimaryButton instance
		backgroundColor: colors.backgroundCard, // Or 'transparent' for a true outline
		borderColor: colors.error,
		borderWidth: 1.5,
	},
	bottomLogoutButtonText: {
		// For text within PrimaryButton instance
		color: colors.error,
		fontFamily: typography.primarySemiBold, // Match destructive actions
	},
});

export default AdminDashboardScreen;
