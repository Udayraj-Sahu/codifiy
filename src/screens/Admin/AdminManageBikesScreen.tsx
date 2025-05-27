// src/screens/Admin/AdminManageBikesScreen.tsx
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
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../components/common/PrimaryButton";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For actual icons

// --- Types and Dummy Data ---
interface BikeAdminCardData {
	id: string;
	name: string;
	pricePerDay: string; // e.g., "₹300/day"
	status: "Available" | "Rented" | "Under Maintenance";
	location: string;
	imageUrl: string;
}

const DUMMY_BIKES_FOR_ADMIN_LIST: BikeAdminCardData[] = [
	{
		id: "bike001",
		name: "Bajaj Pulsar 150",
		pricePerDay: "₹300/day",
		status: "Available",
		location: "Delhi",
		imageUrl: "https://via.placeholder.com/100x75.png?text=Pulsar",
	},
	{
		id: "bike002",
		name: "Honda Activa",
		pricePerDay: "₹200/day",
		status: "Rented",
		location: "Mumbai",
		imageUrl: "https://via.placeholder.com/100x75.png?text=Activa",
	},
	{
		id: "bike003",
		name: "Royal Enfield Classic",
		pricePerDay: "₹450/day",
		status: "Under Maintenance",
		location: "Bangalore",
		imageUrl: "https://via.placeholder.com/100x75.png?text=RE+Classic",
	},
	{
		id: "bike004",
		name: "Yamaha FZ-S",
		pricePerDay: "₹280/day",
		status: "Available",
		location: "Pune",
		imageUrl: "https://via.placeholder.com/100x75.png?text=FZ-S",
	},
];

// API Simulation (remains similar, just using new dummy data)
const fetchAdminBikesAPI = async (
	query?: string
): Promise<BikeAdminCardData[]> => {
	console.log("Fetching admin bikes with query:", query);
	return new Promise((resolve) => {
		setTimeout(() => {
			let bikes = DUMMY_BIKES_FOR_ADMIN_LIST;
			if (query && query.trim() !== "") {
				bikes = bikes.filter((bike) =>
					bike.name.toLowerCase().includes(query.toLowerCase())
				);
			}
			resolve([...bikes]);
		}, 300);
	});
};
const deleteAdminBikeAPI = async (
	bikeId: string
): Promise<{ success: boolean; message?: string }> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Bike ${bikeId} would be deleted. (Simulated)`);
			resolve({ success: true });
		}, 500);
	});
};
// --- End Dummy Data ---

// --- Admin Bike List Item Card Component (New Design) ---
interface AdminBikeCardProps {
	item: BikeAdminCardData;
	onEdit: (bikeId: string) => void;
	onDelete: (bikeId: string) => void;
	onPressCard: (bikeId: string) => void;
}

const AdminBikeCard: React.FC<AdminBikeCardProps> = ({
	item,
	onEdit,
	onDelete,
	onPressCard,
}) => {
	const statusStyles = {
		Available: {
			badge: styles.statusBadgeAvailable,
			text: styles.statusTextAvailable,
		},
		Rented: {
			badge: styles.statusBadgeRented,
			text: styles.statusTextRented,
		},
		"Under Maintenance": {
			badge: styles.statusBadgeMaintenance,
			text: styles.statusTextMaintenance,
		},
	};
	const currentStatusStyle = statusStyles[item.status] || {
		badge: {},
		text: {},
	};

	return (
		<TouchableOpacity
			style={styles.bikeCardContainer}
			onPress={() => onPressCard(item.id)}
			activeOpacity={0.9}>
			<Image
				source={{ uri: item.imageUrl }}
				style={styles.bikeCardImage}
			/>
			<View style={styles.bikeCardDetails}>
				<Text style={styles.bikeCardName} numberOfLines={2}>
					{item.name}
				</Text>
				<Text style={styles.bikeCardPrice}>{item.pricePerDay}</Text>
				<View
					style={[
						styles.bikeCardStatusBadge,
						currentStatusStyle.badge,
					]}>
					<Text
						style={[
							styles.bikeCardStatusText,
							currentStatusStyle.text,
						]}>
						{item.status}
					</Text>
				</View>
				<View style={styles.locationRow}>
					<Text style={styles.locationIcon}>📍</Text>
					<Text style={styles.bikeCardLocation} numberOfLines={1}>
						{item.location}
					</Text>
				</View>
				<View style={styles.actionsRow}>
					<TouchableOpacity
						onPress={() => onEdit(item.id)}
						style={styles.actionLink}>
						<Text style={styles.actionIcon}>✏️</Text>
						<Text style={[styles.actionLinkText, styles.editText]}>
							Edit
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => onDelete(item.id)}
						style={styles.actionLink}>
						<Text style={styles.actionIcon}>🗑️</Text>
						<Text
							style={[styles.actionLinkText, styles.deleteText]}>
							Delete
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);
};
// --- End Admin Bike List Item Card ---

type AdminManageBikesScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminManageBikes"
>;

interface AdminManageBikesScreenProps {
	navigation: AdminManageBikesScreenNavigationProp;
}

const AdminManageBikesScreen: React.FC<AdminManageBikesScreenProps> = ({
	navigation,
}) => {
	const [bikes, setBikes] = useState<BikeAdminCardData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useLayoutEffect(() => {
		navigation.setOptions({
			// title: 'Manage Bikes', // Already set in AdminAppNavigator
			// headerTitleAlign: 'left', // Already set in AdminAppNavigator
			headerRight: () => (
				<TouchableOpacity
					onPress={() => navigation.navigate("AdminBikeForm", {})} // Navigates to add new bike
					style={styles.headerAddButton}>
					<Text style={styles.headerAddButtonText}>+</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	const loadBikes = useCallback(
		async (currentQuery = searchQuery) => {
			setIsLoading(true);
			const fetchedBikes = await fetchAdminBikesAPI(currentQuery);
			setBikes(fetchedBikes);
			setIsLoading(false);
		},
		[searchQuery]
	); // Include searchQuery if API call uses it

	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			loadBikes(searchQuery);
		});
		return unsubscribe;
	}, [navigation, loadBikes, searchQuery]);

	useEffect(() => {
		const handler = setTimeout(() => {
			if (searchQuery.length === 0 || searchQuery.length > 1) {
				// Search on empty or >1 char
				loadBikes(searchQuery);
			}
		}, 500);
		return () => clearTimeout(handler);
	}, [searchQuery, loadBikes]);

	const handleEditBike = (bikeId: string) =>
		navigation.navigate("AdminBikeForm", { bikeId });
	const handleDeleteBike = (bikeId: string) => {
		Alert.alert(
			"Confirm Delete",
			"Are you sure you want to delete this bike?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						const result = await deleteAdminBikeAPI(bikeId);
						if (result.success) {
							Alert.alert("Success", "Bike deleted.");
							loadBikes(searchQuery);
						} else {
							Alert.alert(
								"Error",
								result.message || "Failed to delete."
							);
						}
					},
				},
			]
		);
	};
	const handleCardPress = (bikeId: string) => handleEditBike(bikeId); // Or navigate to a detail view

	if (isLoading && bikes.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading bikes...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{/* Search Bar (No Sort/Filter buttons as per previous simplification) */}
			<View style={styles.searchBarWrapper}>
				<View style={styles.searchContainer}>
					<Text style={styles.searchIconText}>🔍</Text>
					<TextInput
						placeholder="Search bikes..."
						placeholderTextColor={
							colors.textPlaceholder || "#A0A0A0"
						}
						style={styles.searchInput}
						value={searchQuery}
						onChangeText={setSearchQuery}
						returnKeyType="search"
					/>
				</View>
			</View>
			{/* ADDED: Add New Bike Button below search bar */}
			<View style={styles.addBikeButtonContainer}>
				<PrimaryButton
					title="Add New Bike"
					onPress={() => navigation.navigate("AdminBikeForm", {})}
					iconLeft={
						<Text
							style={{
								color: colors.white,
								margin:0,
                                padding:0,
								fontSize: 18,
							}}>
							+
						</Text>
					} // Or your preferred icon
				/>
			</View>
			{bikes.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<Text style={styles.noBikesText}>No bikes found.</Text>
					{!searchQuery && (
						<Text style={styles.noBikesSubText}>
							Tap the '+' icon to add a new bike.
						</Text>
					)}
				</View>
			) : (
				<FlatList
					data={bikes}
					renderItem={({ item }) => (
						<AdminBikeCard
							item={item}
							onEdit={handleEditBike}
							onDelete={handleDeleteBike}
							onPressCard={handleCardPress}
						/>
					)}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshing={isLoading}
					onRefresh={() => loadBikes(searchQuery)}
				/>
			)}
		</View>
	);
};

// Define your blue accent color in theme/colors.ts
// const adminAccentBlue = colors.info || '#007AFF'; // Example blue
// const adminAccentBlueLight = colors.infoLight || '#D6EAF8';

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F7F9FC",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	loadingText: { marginTop: spacing.s, color: colors.textMedium },
	noBikesText: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
		textAlign: "center",
	},
	noBikesSubText: {
		fontSize: typography.fontSizes.m,
		color: colors.textLight,
		textAlign: "center",
		marginTop: spacing.s,
	},
	headerAddButton: {
		// For the blue circular "+"
		backgroundColor: colors.primary, // Or your adminAccentBlue
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
	},
	headerAddButtonText: {
		color: colors.white,
		fontSize: 20,
		fontWeight: "bold",
		lineHeight: 22,
	},
	searchBarWrapper: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F3F7",
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.s,
		height: 44,
	},
	searchIconText: {
		fontSize: 18,
		color: colors.textPlaceholder,
		marginRight: spacing.s,
	},
	searchInput: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
	},
	listContentContainer: { padding: spacing.m, paddingTop: spacing.s }, // Less top padding if search bar is there

	// AdminBikeCard Styles
	bikeCardContainer: {
		flexDirection: "row",
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
		alignItems: "flex-start",
	},
	bikeCardImage: {
		width: 75,
		height: 75,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	bikeCardDetails: { flex: 1, justifyContent: "center" },
	bikeCardName: {
		fontSize: typography.fontSizes.m + 1,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	bikeCardPrice: {
		fontSize: typography.fontSizes.m,
		color: colors.primary,
		/* Blue in design, use colors.adminAccentBlue */ fontWeight:
			typography.fontWeights.semiBold,
		marginBottom: spacing.xs,
	},
	bikeCardStatusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs + 2,
		borderRadius: borderRadius.pill,
		alignSelf: "flex-start",
		marginBottom: spacing.xs,
	},
	bikeCardStatusText: {
		fontSize: typography.fontSizes.xs,
		fontWeight: typography.fontWeights.bold,
	},
	statusBadgeAvailable: { backgroundColor: "#D4EFDF" }, // Light Green
	statusTextAvailable: { color: "#196F3D" }, // Dark Green
	statusBadgeRented: { backgroundColor: "#D6EAF8" }, // Light Blue
	statusTextRented: { color: "#1A5276" }, // Dark Blue
	statusBadgeMaintenance: {
		backgroundColor: "#FDEBD0",
	}, // Light Orange
	statusTextMaintenance: { color: "#A0522D" }, // Dark Orange
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	locationIcon: {
		fontSize: 14,
		color: colors.textMedium,
		marginRight: spacing.xs - 2,
	},
	bikeCardLocation: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-start",
		marginTop: spacing.xs,
		alignItems: "center",
	},
	actionLink: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: spacing.l,
		paddingVertical: spacing.xxs,
	},
	actionIcon: { fontSize: 16, marginRight: spacing.xxs }, // Icons before text
	actionLinkText: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
	},
	editText: {
		color: colors.primary /* Blue in design, use colors.adminAccentBlue */,
	},
	deleteText: { color: colors.error },
});

export default AdminManageBikesScreen;
