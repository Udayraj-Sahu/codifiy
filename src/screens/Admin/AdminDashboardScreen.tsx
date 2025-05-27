// src/screens/Admin/AdminDashboardScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useLayoutEffect, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Alert,
} from "react-native";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For actual icons
import { useAuth } from '../../context/AuthContext';
// --- Types and Dummy Data ---
interface StatisticItem {
	id: string;
	label: string;
	value: string | number;
	iconPlaceholder: string; // Emoji or icon name
	color?: string; // Optional specific color for this stat card text/icon
}

interface PrimaryActionItem {
	id: string;
	label: string;
	iconPlaceholder: string;
	onPress: () => void;
}

interface ActivityItem {
	id: string;
	iconPlaceholder: string;
	description: string;
	timestamp: string;
}

const DUMMY_STATS: StatisticItem[] = [
	{ id: "s1", label: "Total Bikes", value: 120, iconPlaceholder: "🚲" }, // Using infoDark for blueish
	{ id: "s2", label: "Active Bookings", value: 15, iconPlaceholder: "🗓️" },
	{ id: "s3", label: "Pending Bookings", value: 4, iconPlaceholder: "⏳" },
	{ id: "s4", label: "Registered Users", value: 350, iconPlaceholder: "👥" },
];

const DUMMY_RECENT_ACTIVITY: ActivityItem[] = [
	{
		id: "a1",
		iconPlaceholder: "➕",
		description: "Mountain X bike added",
		timestamp: "2 minutes ago",
	},
	{
		id: "a2",
		iconPlaceholder: "✔️",
		description: "Booking #12345 confirmed",
		timestamp: "15 minutes ago",
	},
	{
		id: "a3",
		iconPlaceholder: "👤",
		description: "John Doe registered",
		timestamp: "1 hour ago",
	},
	{
		id: "a4",
		iconPlaceholder: "❌",
		description: "Booking #12344 cancelled",
		timestamp: "2 hours ago",
	},
	{
		id: "a5",
		iconPlaceholder: "🛠️",
		description: "Road Bike maintenance completed",
		timestamp: "3 hours ago",
	},
	{
		id: "a6",
		iconPlaceholder: "📊",
		description: "New report generated",
		timestamp: "4 hours ago",
	},
];
// --- End Dummy Data ---

// --- Reusable Components (Inline for this screen, can be extracted) ---
const StatisticCard: React.FC<{ item: StatisticItem }> = ({ item }) => (
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
	<TouchableOpacity
		style={styles.primaryActionCard}
		onPress={item.onPress}
		activeOpacity={0.7}>
		<Text style={styles.primaryActionIcon}>{item.iconPlaceholder}</Text>
		<Text style={styles.primaryActionLabel}>{item.label}</Text>
	</TouchableOpacity>
);

const ActivityFeedItem: React.FC<{ item: ActivityItem }> = ({ item }) => (
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
// --- End Reusable ---

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
	const { signOut, user } = useAuth();
	const [searchQuery, setSearchQuery] = useState("");
	const [stats, setStats] = useState<StatisticItem[]>(DUMMY_STATS);
	const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(
		DUMMY_RECENT_ACTIVITY
	);

	// Configure header icons
	useLayoutEffect(() => {
		navigation.setOptions({
			// Title "Dashboard" is set in AdminAppNavigator's screen options
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
				navigation.navigate("AdminDocumentList", { status: "pending" }),
		}, // Example param
	];

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// TODO: Implement actual search logic or navigate to a search results screen
		if (query.length > 2) {
			console.log("Searching for:", query);
			// navigation.navigate('AdminSearchResults', { query });
		}
	};
	const handleLogout = () => {
		Alert.alert(
			"Logout",
			"Are you sure you want to log out of the admin panel?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Logout",
					style: "destructive",
					onPress: async () => {
						console.log("Admin logging out...");
						await signOut();
						// AppNavigator will automatically redirect to Auth flow
					},
				},
			]
		);
	};

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			{/* Statistics Section */}
			<View style={styles.statsGrid}>
				{stats.map((stat) => (
					<StatisticCard key={stat.id} item={stat} />
				))}
			</View>

			{/* Primary Actions Section */}
			<View style={styles.primaryActionsContainer}>
				{primaryActions.map((action) => (
					<PrimaryAction key={action.id} item={action} />
				))}
			</View>

			{/* Search Bar */}
			<View style={styles.searchBarContainer}>
				{/* <Icon name="magnify" size={20} color={colors.textMedium} style={styles.searchIcon} /> */}
				<Text style={styles.searchIcon}>🔍</Text>
				<TextInput
					placeholder="Search bikes, users or bookings"
					placeholderTextColor={colors.textPlaceholder}
					style={styles.searchInput}
					value={searchQuery}
					onChangeText={setSearchQuery}
					onSubmitEditing={() => handleSearch(searchQuery)} // Or trigger search on text change
					returnKeyType="search"
				/>
			</View>

			{/* Recent Activity Section */}
			<Text style={styles.sectionTitle}>Recent Activity</Text>
			<View style={styles.activityListContainer}>
				{recentActivity.length > 0 ? (
					recentActivity.map((activity) => (
						<ActivityFeedItem key={activity.id} item={activity} />
					))
				) : (
					<Text style={styles.noActivityText}>
						No recent activity.
					</Text>
				)}
			</View>
			<View style={styles.logoutContainer}>
				<TouchableOpacity
					style={styles.logoutButton}
					onPress={handleLogout}>
					{/* <Icon name="logout" size={18} color={colors.error} style={{marginRight: spacing.s}} /> */}
					<Text style={styles.logoutButtonIcon}>🚪</Text>
					<Text style={styles.logoutButtonText}>Logout</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

// Using soft blue highlights as per prompt - let's assume colors.adminAccent is a soft blue
// If not, we can use colors.info or colors.primaryLight and adjust.
const adminAccentColor = colors.info || "#A0D2DB"; // Soft blue
const adminAccentLightColor = "#E0F3FF";

const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white },
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xl },
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		marginBottom: spacing.l,
	},
	statCard: {
		backgroundColor: colors.backgroundLight || "#F5F9FC", // Off-white or very light blue
		width: "48%", // For 2x2 grid
		padding: spacing.m,
		borderRadius: borderRadius.l,
		alignItems: "center",
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
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
		marginBottom: spacing.l,
	},
	primaryActionCard: {
		alignItems: "center",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.s,
		// backgroundColor: adminAccentLightColor,
		borderRadius: borderRadius.m,
		minWidth: 100, // Ensure touchable area
	},
	primaryActionIcon: {
		fontSize: 30,
		color: adminAccentColor,
		marginBottom: spacing.xs,
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
	},
	activityListContainer: {
		// Could be a FlatList if items are many
	},
	activityItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.s,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	activityIcon: {
		fontSize: 18,
		color: colors.textMedium,
		marginRight: spacing.m,
		width: 24,
		textAlign: "center",
	},
	activityTextContainer: { flex: 1 },
	activityDescription: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	activityTimestamp: { fontSize: typography.fontSizes.xs },
	noActivityText: {
		color: colors.textMedium,
		textAlign: "center",
		paddingVertical: spacing.l,
	},
});

export default AdminDashboardScreen;
