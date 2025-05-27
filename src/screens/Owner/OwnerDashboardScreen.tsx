// src/screens/Owner/OwnerDashboardScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useLayoutEffect } from "react";
import {
	// Image, // If icons are images
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useAuth } from "../../context/AuthContext"; // For logout
import { OwnerStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For actual icons

// --- Types and Dummy Data ---
interface KpiCardData {
	id: string;
	label: string;
	value: string | number;
	iconPlaceholder: string;
	backgroundColor: string; // Light blue, green, purple, peach
	iconColor?: string;
}
interface ActivityItemData {
	id: string;
	iconPlaceholder: string;
	message: string;
	timestamp: string;
	onPress?: () => void;
}
interface QuickActionData {
	id: string;
	label: string;
	iconPlaceholder: string;
	onPress: () => void;
}

const KPI_DATA: KpiCardData[] = [
	{
		id: "kpi1",
		label: "Total Bikes",
		value: 120,
		iconPlaceholder: "🚲",
		backgroundColor:  "#E0F3FF",
		iconColor: colors.infoDark,
	},
	{
		id: "kpi2",
		label: "Total Users",
		value: 1450,
		iconPlaceholder: "👥",
		backgroundColor: colors.successLight || "#D4EFDF",
		iconColor: colors.successDark,
	},
	{
		id: "kpi3",
		label: "Total Bookings",
		value: 3250,
		iconPlaceholder: "🗓️",
		backgroundColor: colors.purpleLight || "#E8DAEF",
		iconColor: colors.purpleDark,
	}, // Add purple to theme
	{
		id: "kpi4",
		label: "Pending Docs",
		value: 15,
		iconPlaceholder: "📄",
		backgroundColor: colors.peachLight || "#FFE9D4",
		iconColor: colors.peachDark,
	}, // Add peach to theme
];

const RECENT_ACTIVITY_DATA: ActivityItemData[] = [
	{
		id: "act1",
		iconPlaceholder: "📄",
		message: "John Doe submitted ID document",
		timestamp: "5 mins ago",
		onPress: () => Alert.alert("Activity", "View John Doe's document"),
	},
	{
		id: "act2",
		iconPlaceholder: "✔️",
		message: "Booking #1234 confirmed by Jane Smith",
		timestamp: "10 mins ago",
	},
	{
		id: "act3",
		iconPlaceholder: "➕👤",
		message: "New user Mike joined",
		timestamp: "1 hour ago",
	},
	{
		id: "act4",
		iconPlaceholder: "➕🚲",
		message: "New bike registration completed",
		timestamp: "2 hours ago",
	},
];
// --- End Dummy Data ---

// --- Reusable Components (Inline for brevity) ---
const KpiCard: React.FC<{ item: KpiCardData }> = ({ item }) => (
	<View style={[styles.kpiCard, { backgroundColor: item.backgroundColor }]}>
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

const ActivityListItem: React.FC<{ item: ActivityItemData }> = ({ item }) => (
	<TouchableOpacity
		style={styles.activityItem}
		onPress={item.onPress}
		disabled={!item.onPress}
		activeOpacity={item.onPress ? 0.7 : 1}>
		<Text style={styles.activityItemIcon}>{item.iconPlaceholder}</Text>
		<View style={styles.activityItemTextContainer}>
			<Text style={styles.activityItemMessage} numberOfLines={2}>
				{item.message}
			</Text>
			<Text style={styles.activityItemTimestamp}>{item.timestamp}</Text>
		</View>
		{item.onPress && <Text style={styles.activityItemArrow}>›</Text>}
	</TouchableOpacity>
);

const QuickActionTile: React.FC<{ item: QuickActionData }> = ({ item }) => (
	<TouchableOpacity
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
// --- End Reusable ---

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
	const { signOut } = useAuth(); // For logout

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: async () => {
					await signOut();
				},
			},
		]);
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Owner Dashboard", // Centered by default with headerLeft/Right
			headerTitleAlign: "center",
			headerLeft: () => (
				// Placeholder for Profile/Settings icon
				<TouchableOpacity
					onPress={() => navigation.navigate("OwnerProfileScreen")}
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
							navigation.navigate("OwnerSettingsScreen")
						}
						style={{ paddingHorizontal: spacing.s }}>
						{/* Replace with actual settings icon */}
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
						{/* Replace with actual logout icon or use text */}
						<Text style={{ fontSize: 22, color: colors.error }}>
							🚪
						</Text>
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, handleLogout]); // Added handleLogout to dependencies

	const QUICK_ACTIONS: QuickActionData[] = [
		{
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

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			{/* KPI Summary Cards */}
			<View style={styles.kpiGrid}>
				{KPI_DATA.map((kpi) => (
					<KpiCard key={kpi.id} item={kpi} />
				))}
			</View>

			{/* Quick Actions Section */}
			<Text style={styles.sectionHeaderTitle}>Quick Actions</Text>
			<View style={styles.quickActionsContainer}>
				{QUICK_ACTIONS.map((action) => (
					<QuickActionTile key={action.id} item={action} />
				))}
			</View>

			{/* Recent Activity Section */}
			<Text style={styles.sectionHeaderTitle}>Recent Activity</Text>
			<View style={styles.activityListContainer}>
				{RECENT_ACTIVITY_DATA.map((activity) => (
					<ActivityListItem key={activity.id} item={activity} />
				))}
				{/* Use FlatList if activity list can be very long */}
			</View>

			{/* Bottom safe area spacing is handled by scrollContentContainer paddingBottom */}
		</ScrollView>
	);
};

// Define placeholder colors in your theme if they don't exist
// colors.purpleLight, colors.purpleDark, colors.peachLight, colors.peachDark

const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white },
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xl + spacing.l,
	}, // Extra for bottom safe area

	// KPI Cards
	kpiGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: spacing.l,
	},
	kpiCard: {
		width: "48%",
		aspectRatio: 1.1,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 3,
	},
	kpiIcon: { fontSize: 30, marginBottom: spacing.s },
	kpiValue: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	kpiLabel: {
		fontSize: typography.fontSizes.xs,
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

	// Quick Actions
	quickActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginBottom: spacing.l,
	},
	quickActionTile: {
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F5F9FC",
		borderRadius: borderRadius.l,
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.s,
		width: "30%", // Adjust for spacing
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
	quickActionTileIcon: { fontSize: 24, color: colors.primary }, // Assuming primary for icon color
	quickActionTileLabel: {
		fontSize: typography.fontSizes.xs,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "center",
	},

	// Recent Activity
	activityListContainer: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		paddingHorizontal: spacing.s, // Inner padding for items
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
});

export default OwnerDashboardScreen;
