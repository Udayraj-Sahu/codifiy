// src/screens/App/Home/HomeScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useState } from "react";
import {
	Image, // Good for "Popular Picks"
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import BikeCard from "../../../components/common/BikeCard";
import { HomeStackParamList } from "../../../navigation/types"; // Adjust path if needed
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/Ionicons'; // Example: for actual icons

// --- Types and Dummy Data ---
interface BikeTypeFilter {
	id: string;
	name: string;
	iconPlaceholder: string; // Emoji or a name for an icon component
}

interface Promotion {
	id: string;
	title: string;
	description: string;
	imageUrl: string; // Image for the banner
}

interface BikeListItem {
	// Could be similar to BikeCard props or a variation
	id: string;
	name: string;
	type: string; // e.g., "Mountain Bike", "Electric Bike"
	pricePerHour: number;
	currencySymbol?: string;
	imageUrl: string;
	rating?: number; // Optional for popular picks if not shown directly in list item
}

const BIKE_TYPE_FILTERS: BikeTypeFilter[] = [
	{ id: "1", name: "Bike", iconPlaceholder: "🚲" },
	{ id: "2", name: "Scooter", iconPlaceholder: "🛴" },
	{ id: "3", name: "Electric", iconPlaceholder: "⚡️" },
	{ id: "4", name: "Mountain", iconPlaceholder: "⛰️" },
];

const PROMOTION_BANNER: Promotion = {
	id: "promo1",
	title: "First Ride Discount!",
	description: "Get 10% off on your first booking",
	imageUrl: "https://via.placeholder.com/300x150.png?text=Rider+Promotion", // Replace with actual image
};

const NEARBY_BIKES: BikeListItem[] = [
	{
		id: "nb1",
		name: "City Cruiser",
		type: "Mountain Bike",
		pricePerHour: 30,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/200x150.png?text=City+Cruiser",
		rating: 4.5,
	},
	{
		id: "nb2",
		name: "Urban Rider",
		type: "Electric Bike",
		pricePerHour: 40,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/200x150.png?text=Urban+Rider",
		rating: 4.7,
	},
	{
		id: "nb3",
		name: "Speedy Go",
		type: "Scooter",
		pricePerHour: 25,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/200x150.png?text=Speedy+Go",
		rating: 4.2,
	},
];

const POPULAR_PICKS: BikeListItem[] = [
	{
		id: "pp1",
		name: "Adventure Pro",
		type: "Mountain Bike",
		pricePerHour: 35,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/100x80.png?text=Adv+Pro",
	},
	{
		id: "pp2",
		name: "City Explorer",
		type: "Electric Bike",
		pricePerHour: 45,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/100x80.png?text=City+Exp",
	},
	{
		id: "pp3",
		name: "Trail Blazer",
		type: "Mountain Bike",
		pricePerHour: 38,
		currencySymbol: "₹",
		imageUrl: "https://via.placeholder.com/100x80.png?text=Trail+Blaz",
	},
];
// --- End Dummy Data ---

// --- Filter Chip Placeholder (refine or replace with actual component) ---
const FilterChip: React.FC<{
	item: BikeTypeFilter;
	isSelected: boolean;
	onPress: () => void;
}> = ({ item, isSelected, onPress }) => (
	<TouchableOpacity
		style={[styles.filterChip, isSelected ? styles.filterChipSelected : {}]}
		onPress={onPress}>
		<Text style={styles.filterChipIcon}>{item.iconPlaceholder}</Text>
		<Text
			style={[
				styles.filterChipText,
				isSelected ? styles.filterChipTextSelected : {},
			]}>
			{item.name}
		</Text>
	</TouchableOpacity>
);
// --- End Filter Chip ---

// --- Popular Pick Item (inline for now, can be extracted) ---
const PopularPickItem: React.FC<{ item: BikeListItem; onBook: () => void }> = ({
	item,
	onBook,
}) => (
	<TouchableOpacity
		style={styles.popularPickItemContainer}
		activeOpacity={0.8}
		onPress={onBook}>
		<Image
			source={{ uri: item.imageUrl }}
			style={styles.popularPickImage}
		/>
		<View style={styles.popularPickDetails}>
			<Text style={styles.popularPickName} numberOfLines={1}>
				{item.name}
			</Text>
			<Text style={styles.popularPickType} numberOfLines={1}>
				{item.type}
			</Text>
			<Text style={styles.popularPickPrice}>
				{item.currencySymbol}
				{item.pricePerHour}/hr
			</Text>
		</View>
		<TouchableOpacity style={styles.popularPickBookButton} onPress={onBook}>
			<Text style={styles.popularPickBookButtonText}>Book</Text>
		</TouchableOpacity>
	</TouchableOpacity>
);
// --- End Popular Pick Item ---

type HomeScreenNavigationProp = StackNavigationProp<
	HomeStackParamList,
	"HomeScreenRoot"
>;

interface HomeScreenProps {
	navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
	const [currentLocation, setCurrentLocation] =
		useState("New York, Downtown"); // Placeholder
	const [selectedBikeTypeFilter, setSelectedBikeTypeFilter] = useState<
		string | null
	>(null); // ID of selected filter

	const handleProfilePress = () => {
		// Navigate to ProfileTab. It's better to use parent navigator to switch tabs.
		navigation.getParent()?.navigate("ProfileTab");
		console.log("Profile icon pressed");
	};

	const handleNotificationsPress = useCallback(() => {
		console.log("Filter icon (now notifications) on search bar pressed");
		// Navigating to NotificationsScreen as requested
		navigation.navigate("NotificationsScreen");
	}, [navigation]);

	const handleLocationPress = () => {
		console.log("Location card pressed");
		// TODO: Navigate to a location selection/map screen
	};

	const handleSearchPress = () => {
		console.log("Search bar pressed");
		// TODO: Navigate to a dedicated search screen or activate search UI
		// navigation.navigate('ExploreTab', { screen: 'Explore', params: { focusSearch: true } }); // Example
	};

	const handleFilterIconPress = () => {
		console.log("Filter icon on search bar pressed");
		// navigation.navigate('ExploreTab', { screen: 'Filter' });
	};

	const handleBikeTypeFilterPress = (filterId: string) => {
		setSelectedBikeTypeFilter((prev) =>
			prev === filterId ? null : filterId
		); // Toggle selection
		// TODO: Apply filter to "Available Near You" or navigate to Explore with filter
		console.log(
			"Filtered by:",
			BIKE_TYPE_FILTERS.find((f) => f.id === filterId)?.name
		);
		// Example: navigation.navigate('ExploreTab', { screen: 'Explore', params: { appliedFilters: { bikeTypes: [BIKE_TYPE_FILTERS.find(f=>f.id === filterId)?.name] } } });
	};

	const handleBookNearbyBike = (bikeId: string) => {
		console.log("Book nearby bike:", bikeId);
		// navigation.navigate('ExploreTab', { screen: 'BikeDetails', params: { bikeId } });
	};

	const handleBookPopularPick = (bikeId: string) => {
		console.log("Book popular pick:", bikeId);
		// navigation.navigate('ExploreTab', { screen: 'BikeDetails', params: { bikeId } });
	};

	return (
		<View style={styles.screenContainer}>
			<View style={styles.topBarContainer}>
				<TouchableOpacity
					onPress={handleProfilePress}
					style={styles.topBarIconTouchable}>
					<Text style={styles.iconPlaceholder}>👤</Text>
				</TouchableOpacity>
				<Text style={styles.appName}>Bikya</Text>
				<TouchableOpacity
					onPress={handleNotificationsPress}
					style={styles.topBarIconTouchable}>
					<Text style={styles.iconPlaceholder}>🔔</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContentContainer}
				showsVerticalScrollIndicator={false}>
				<TouchableOpacity
					style={styles.locationCard}
					onPress={handleLocationPress}
					activeOpacity={0.7}>
					<Text style={styles.iconPlaceholderSmall}>📍</Text>
					<Text style={styles.locationText} numberOfLines={1}>
						Current Location: {currentLocation}
					</Text>

					<Text style={styles.iconPlaceholderSmall}>›</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.searchBarContainer}
					onPress={handleSearchPress}
					activeOpacity={0.8}>
					<Text style={styles.searchBarPlaceholder}>
						Search bikes or locations
					</Text>
					<TouchableOpacity
						onPress={handleFilterIconPress}
						style={styles.filterIconTouchable}>
						<Text
							style={[
								styles.iconPlaceholderSmall,
								{ color: colors.primary },
							]}>
							📊
						</Text>
					</TouchableOpacity>
				</TouchableOpacity>

				<View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.bikeTypeFiltersContainer}>
						{BIKE_TYPE_FILTERS.map((filter) => (
							<FilterChip
								key={filter.id}
								item={filter}
								isSelected={
									selectedBikeTypeFilter === filter.id
								}
								onPress={() =>
									handleBikeTypeFilterPress(filter.id)
								}
							/>
						))}
					</ScrollView>
				</View>

				<View style={styles.promoBanner}>
					<View style={styles.promoTextContainer}>
						<Text style={styles.promoTitle}>
							{PROMOTION_BANNER.title}
						</Text>
						<Text style={styles.promoDescription}>
							{PROMOTION_BANNER.description}
						</Text>
					</View>
					<Image
						source={{ uri: PROMOTION_BANNER.imageUrl }}
						style={styles.promoImage}
					/>
				</View>

				<Text style={styles.sectionTitle}>Available Near You</Text>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.horizontalBikeList}>
					{NEARBY_BIKES.map((bike) => (
						<BikeCard
							key={bike.id}
							imageUrl={bike.imageUrl}
							name={bike.name}
							rating={bike.rating || 0} // BikeCard expects rating
							reviewCount={0} // BikeCard expects reviewCount
							distanceInKm={0} // BikeCard expects distance
							pricePerHour={bike.pricePerHour}
							currencySymbol={bike.currencySymbol}
							onPressCard={() => handleBookNearbyBike(bike.id)}
							onPressBookNow={() => handleBookNearbyBike(bike.id)}
							style={styles.nearbyBikeCard} // Custom style for horizontal cards
						/>
					))}
				</ScrollView>

				<Text style={styles.sectionTitle}>Popular Picks</Text>
				<View style={styles.popularPicksList}>
					{POPULAR_PICKS.map((bike) => (
						<PopularPickItem
							key={bike.id}
							item={bike}
							onBook={() => handleBookPopularPick(bike.id)}
						/>
					))}
				</View>
			</ScrollView>
		</View>
	);
};

// Calculate safe area padding for the top bar
const safeAreaTop =
	Platform.OS === "android"
		? StatusBar.currentHeight || spacing.m
		: spacing.xl;

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.white || "#FFFFFF",
	},
	topBarContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: safeAreaTop + spacing.xs, // Adjusted for status bar
		paddingBottom: spacing.s,
		paddingHorizontal: spacing.m,
		backgroundColor: colors.white, // Or a subtle header color
		// borderBottomWidth: 1, // Optional separator
		// borderBottomColor: colors.borderDefault,
	},
	topBarIconTouchable: {
		padding: spacing.xs,
	},
	appName: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	iconPlaceholder: {
		// For top bar icons
		fontSize: 24,
		color: colors.textPrimary,
	},
	iconPlaceholderSmall: {
		// For location card, search filter
		fontSize: 18,
		color: colors.textSecondary,
	},
	scrollView: {
		flex: 1,
	},
	scrollContentContainer: {
		paddingBottom: spacing.xl, // Space at the very bottom
	},
	locationCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F5F5F5",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s + 2,
		marginHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginTop: spacing.s,
		marginBottom: spacing.m,
	},
	locationText: {
		flex: 1,
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginLeft: spacing.s,
	},
	searchBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m - 2, // Adjust for desired height
		marginHorizontal: spacing.m,
		marginBottom: spacing.l,
	},
	searchBarPlaceholder: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPlaceholder || "#A0A0A0",
	},
	filterIconTouchable: {
		paddingLeft: spacing.s,
	},
	bikeTypeFiltersContainer: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		marginBottom: spacing.m,
	},
	filterChip: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		borderRadius: borderRadius.pill,
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		marginRight: spacing.s,
		borderWidth: 1,
		borderColor: "transparent",
	},
	filterChipSelected: {
		backgroundColor: colors.primaryLight || "#D3EAA4",
		borderColor: colors.primary,
	},
	filterChipIcon: {
		fontSize: typography.fontSizes.m,
		marginRight: spacing.xs,
	},
	filterChipText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
	},
	filterChipTextSelected: {
		color: colors.primaryDark || colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},
	promoBanner: {
		flexDirection: "row",
		backgroundColor: colors.primaryLight || "#E6FFFA", // Example accent color
		borderRadius: borderRadius.l,
		marginHorizontal: spacing.m,
		marginBottom: spacing.l,
		padding: spacing.m,
		alignItems: "center",
		overflow: "hidden", // If image is positioned absolutely or has negative margins
	},
	promoTextContainer: {
		flex: 1,
		marginRight: spacing.s,
	},
	promoTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.primaryDark || colors.primary, // Use a contrasting color
	},
	promoDescription: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium, // Use a contrasting color
		marginTop: spacing.xs,
	},
	promoImage: {
		width: 100,
		height: 80,
		borderRadius: borderRadius.m,
		// resizeMode: 'contain', // Or 'cover'
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl, // e.g. 20
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginHorizontal: spacing.m,
		marginBottom: spacing.s,
		marginTop: spacing.s,
	},
	horizontalBikeList: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
	},
	nearbyBikeCard: {
		// Style for BikeCard in horizontal scroll
		width: 220, // Fixed width for horizontal items
		marginRight: spacing.m,
		// Ensure BikeCard props are fully satisfied or BikeCard is flexible
	},
	popularPicksList: {
		paddingHorizontal: spacing.m,
	},
	popularPickItemContainer: {
		flexDirection: "row",
		backgroundColor: colors.white,
		borderRadius: borderRadius.m,
		padding: spacing.s,
		marginBottom: spacing.m,
		alignItems: "center",
		// Add shadow if desired
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	popularPickImage: {
		width: 70,
		height: 70,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	popularPickDetails: {
		flex: 1,
		justifyContent: "center",
	},
	popularPickName: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
	},
	popularPickType: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	popularPickPrice: {
		fontSize: typography.fontSizes.s,
		color: colors.primary,
		fontWeight: typography.fontWeights.bold,
		marginTop: spacing.xs,
	},
	popularPickBookButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		borderRadius: borderRadius.m,
	},
	popularPickBookButtonText: {
		color: colors.white,
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.bold,
	},
});

export default HomeScreen;
