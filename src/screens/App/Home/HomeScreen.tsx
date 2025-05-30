// src/screens/App/Home/HomeScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useMemo, useState } from "react"; // Added useMemo
import {
	ActivityIndicator,
	Image,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import BikeCard from "../../../components/common/BikeCard";
import { HomeStackParamList } from "../../../navigation/types";
import {
	fetchNearbyBikes,
	fetchPopularPicks,
	Bike as StoreBike, // Use the Bike type from your slice
} from "../../../store/slices/homeScreenBikeSlice"; // Assuming you have this slice
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

import * as Location from "expo-location"; // <<< IMPORT EXPO-LOCATION
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// --- Types (BikeListItem, BikeTypeFilter, Promotion - can remain as they were or be refined) ---
export interface BikeListItem {
	// This should align with what your thunks/selectors provide
	id: string;
	name: string;
	type: string; // category
	pricePerHour: number;
	currencySymbol?: string;
	imageUrl: string;
	rating?: number;
	reviewCount?: number;
	distanceInKm?: number; // This will be more relevant with live location
}
interface BikeTypeFilter {
	id: string;
	name: string;
	iconPlaceholder: string;
}
interface Promotion {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
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
	imageUrl: "https://via.placeholder.com/300x150.png?text=Rider+Promotion",
};

// --- Components (FilterChip, PopularPickItem - can remain as they were) ---
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
const PopularPickItem: React.FC<{ item: BikeListItem; onBook: () => void }> = ({
	item,
	onBook,
}) => (
	<TouchableOpacity
		style={styles.popularPickItemContainer}
		activeOpacity={0.8}
		onPress={onBook}>
		<Image
			source={
				item.imageUrl
					? { uri: item.imageUrl }
					: require("../../../../assets/images/icon.png")
			}
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
				{item.currencySymbol || "₹"}
				{item.pricePerHour}/hr
			</Text>
		</View>
		<TouchableOpacity style={styles.popularPickBookButton} onPress={onBook}>
			<Text style={styles.popularPickBookButtonText}>Book</Text>
		</TouchableOpacity>
	</TouchableOpacity>
);

type HomeScreenNavigationProp = StackNavigationProp<
	HomeStackParamList,
	"HomeScreenRoot"
>;
interface HomeScreenProps {
	navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		nearbyBikes: nearbyBikesFromStore,
		popularPicks: popularPicksFromStore,
		isLoadingNearby,
		isLoadingPopular,
		errorNearby,
		errorPopular,
	} = useSelector((state: RootState) => state.homeScreenBikes);

	const [currentLocationDisplay, setCurrentLocationDisplay] =
		useState<string>("Detecting location...");
	const [currentCoords, setCurrentCoords] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(
		null
	);
	const [isFetchingLocation, setIsFetchingLocation] = useState(true); // For initial location fetch

	const [selectedBikeTypeFilter, setSelectedBikeTypeFilter] = useState<
		string | null
	>(null);

	// Function to get location and address
	const getLocationAsync = useCallback(async () => {
		setIsFetchingLocation(true);
		setLocationErrorMsg(null);
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setLocationErrorMsg(
				"Permission to access location was denied. Please enable it in settings to see nearby bikes."
			);
			setCurrentLocationDisplay("Location permission denied");
			setIsFetchingLocation(false);
			setCurrentCoords(null); // Clear coords if permission denied
			return;
		}

		try {
			let location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			const { latitude, longitude } = location.coords;
			setCurrentCoords({ latitude, longitude });

			let addressResponse = await Location.reverseGeocodeAsync({
				latitude,
				longitude,
			});
			if (addressResponse && addressResponse.length > 0) {
				const addr = addressResponse[0];
				const displayAddress = `${addr.street || ""}${
					addr.street && (addr.subregion || addr.city) ? ", " : ""
				}${addr.subregion || addr.city || ""}`;
				setCurrentLocationDisplay(displayAddress || "Current Location");
			} else {
				setCurrentLocationDisplay(
					"Current Location (address not found)"
				);
			}
		} catch (error: any) {
			console.error("Error getting location or geocoding:", error);
			setLocationErrorMsg(
				"Could not fetch location. Make sure GPS is enabled."
			);
			setCurrentLocationDisplay("Location unavailable");
			setCurrentCoords(null); // Clear coords on error
		}
		setIsFetchingLocation(false);
	}, []);

	// Initial location fetch
	useEffect(() => {
		getLocationAsync();
	}, [getLocationAsync]);

	// Fetch nearby bikes when coordinates are available or change
	const loadNearbyBikes = useCallback(() => {
		if (currentCoords) {
			console.log(
				"HomeScreen: Dispatching fetchNearbyBikes with coords:",
				currentCoords
			);
			dispatch(
				fetchNearbyBikes({
					latitude: currentCoords.latitude,
					longitude: currentCoords.longitude,
					limit: 5, // Or your desired limit
					maxDistance: 20000, // e.g. 20km search radius in meters
				})
			);
		} else if (!isFetchingLocation && !locationErrorMsg) {
			// Only if not fetching and no perm error
			// Handle case where coords are null but no error (e.g. couldn't geocode but got coords)
			// Or if user explicitly denies location after initial prompt.
			// dispatch(fetchNearbyBikes({})); // Fetch without location, or show a message
			console.log(
				"HomeScreen: Cannot fetch nearby bikes, coordinates unavailable."
			);
		}
	}, [dispatch, currentCoords, isFetchingLocation, locationErrorMsg]);

	// Fetch popular picks (doesn't depend on location)
	const loadPopularPicks = useCallback(() => {
		console.log("HomeScreen: Dispatching fetchPopularPicks");
		dispatch(fetchPopularPicks({ limit: 3, sortBy: "averageRating:desc" })); // Example sort
	}, [dispatch]);

	useEffect(() => {
		loadPopularPicks(); // Load popular picks once
	}, [loadPopularPicks]);

	useEffect(() => {
		// This effect will run when currentCoords changes (after location is fetched/updated)
		// or if locationErrorMsg changes (e.g., permission denied after initially being null)
		if (!isFetchingLocation) {
			// Only fetch if not currently in the process of getting location
			loadNearbyBikes();
		}
	}, [currentCoords, isFetchingLocation, locationErrorMsg, loadNearbyBikes]);

	const handleProfilePress = () =>
		navigation.getParent()?.navigate("ProfileTab");
	const handleNotificationsPress = useCallback(
		() => navigation.navigate("NotificationsScreen"),
		[navigation]
	);
	const handleLocationCardPress = () => getLocationAsync(); // Refresh location on press
	const handleSearchPress = () =>
		navigation.navigate("ExploreTab" as any, {
			screen: "Explore",
			params: { focusSearch: true },
		});
	const handleBikeTypeFilterPress = (filterId: string) => {
		const newFilter = selectedBikeTypeFilter === filterId ? null : filterId;
		setSelectedBikeTypeFilter(newFilter);
		const filterName = BIKE_TYPE_FILTERS.find(
			(f) => f.id === newFilter
		)?.name;
		navigation.navigate("ExploreTab" as any, {
			screen: "Explore",
			params: {
				appliedFilters: { bikeTypes: filterName ? [filterName] : [] },
			},
		});
	};

	const navigateToBikeDetails = (bikeId: string) => {
		navigation.navigate("ExploreTab" as any, {
			screen: "BikeDetails",
			params: { bikeId },
		});
	};

	const transformedNearbyBikes: BikeListItem[] = useMemo(
		() =>
			nearbyBikesFromStore.map((bike: StoreBike) => ({
				id: bike._id,
				name: bike.model,
				type: bike.category,
				pricePerHour: bike.pricePerHour,
				imageUrl:
					bike.images && bike.images.length > 0
						? bike.images[0].url
						: "",
				rating: (bike as any).averageRating, // Assuming these exist or are calculated
				reviewCount: (bike as any).numberOfReviews,
				// distanceInKm could be calculated if backend returns coordinates for each bike
				// or if the /nearby endpoint already calculates and returns it.
			})),
		[nearbyBikesFromStore]
	);

	const transformedPopularPicks: BikeListItem[] = useMemo(
		() =>
			popularPicksFromStore.map((bike: StoreBike) => ({
				id: bike._id,
				name: bike.model,
				type: bike.category,
				pricePerHour: bike.pricePerHour,
				imageUrl:
					bike.images && bike.images.length > 0
						? bike.images[0].url
						: "",
				rating: (bike as any).averageRating,
				reviewCount: (bike as any).numberOfReviews,
			})),
		[popularPicksFromStore]
	);

	const renderNearbyBikeSection = () => {
		if (isFetchingLocation && !currentCoords) {
			// Show location fetching loader first
			return (
				<View style={styles.centeredMessage}>
					<ActivityIndicator size="small" color={colors.primary} />
					<Text style={styles.messageText}>
						Fetching your location...
					</Text>
				</View>
			);
		}
		if (locationErrorMsg) {
			return (
				<View style={styles.centeredMessage}>
					<Text style={styles.errorText}>{locationErrorMsg}</Text>
					<PrimaryButton
						title="Retry Location"
						onPress={getLocationAsync}
					/>
				</View>
			);
		}
		if (isLoadingNearby && transformedNearbyBikes.length === 0) {
			return (
				<ActivityIndicator
					size="large"
					color={colors.primary}
					style={styles.loadingIndicator}
				/>
			);
		}
		if (errorNearby) {
			return (
				<View style={styles.centeredMessage}>
					<Text style={styles.errorText}>
						Error loading nearby bikes: {errorNearby}
					</Text>
					<PrimaryButton title="Retry" onPress={loadNearbyBikes} />
				</View>
			);
		}
		if (transformedNearbyBikes.length === 0 && !isLoadingNearby) {
			// Check !isLoadingNearby here
			return (
				<View style={styles.centeredMessage}>
					<Text style={styles.noBikesText}>
						No bikes currently found near you. Try expanding search
						in Explore.
					</Text>
				</View>
			);
		}
		return (
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.horizontalBikeList}>
				{transformedNearbyBikes.map((bike) => (
					<BikeCard
						key={bike.id}
						{...bike}
						onPressCard={() => navigateToBikeDetails(bike.id)}
						onPressBookNow={() => navigateToBikeDetails(bike.id)}
						style={styles.nearbyBikeCard}
					/>
				))}
			</ScrollView>
		);
	};

	const renderPopularPicksSection = () => {
		// ... (renderPopularPicksSection remains similar, using transformedPopularPicks)
		if (isLoadingPopular && transformedPopularPicks.length === 0) {
			return (
				<ActivityIndicator
					size="large"
					color={colors.primary}
					style={styles.loadingIndicator}
				/>
			);
		}
		if (errorPopular) {
			return (
				<View style={styles.centeredMessage}>
					<Text style={styles.errorText}>
						Error loading popular bikes: {errorPopular}
					</Text>
					<PrimaryButton title="Retry" onPress={loadPopularPicks} />
				</View>
			);
		}
		if (transformedPopularPicks.length === 0 && !isLoadingPopular) {
			return (
				<View style={styles.centeredMessage}>
					<Text style={styles.noBikesText}>
						No popular bikes to show.
					</Text>
				</View>
			);
		}
		return (
			<View style={styles.popularPicksList}>
				{transformedPopularPicks.map((bike) => (
					<PopularPickItem
						key={bike.id}
						item={bike}
						onBook={() => navigateToBikeDetails(bike.id)}
					/>
				))}
			</View>
		);
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
					<Text style={styles.iconPlaceholder}>
						<MaterialIcons
							name="notifications"
							size={30}
							color="black"
						/>
					</Text>
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContentContainer}
				showsVerticalScrollIndicator={false}>
				<TouchableOpacity
					style={styles.locationCard}
					onPress={handleLocationCardPress}
					activeOpacity={0.7}>
					<Text style={styles.iconPlaceholderSmall}><MaterialIcons
							name="place"
							size={30}
							color="black"
						/></Text>
					<Text style={styles.locationText} numberOfLines={1}>
						{isFetchingLocation
							? "Updating location..."
							: currentLocationDisplay}
					</Text>
					<Text style={styles.iconPlaceholderSmall}>›</Text>
				</TouchableOpacity>

				{/* Search, Filters, Promo Banner as before */}
				<TouchableOpacity
					style={styles.searchBarContainer}
					onPress={handleSearchPress}
					activeOpacity={0.8}>
					<Text style={styles.searchBarPlaceholder}>
						Search bikes or locations
					</Text>
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
				{renderNearbyBikeSection()}

				<Text style={styles.sectionTitle}>Popular Picks</Text>
				{renderPopularPicksSection()}
			</ScrollView>
		</View>
	);
};

// Styles (Keep existing styles, add styles for error/message text if needed)
const safeAreaTop =
	Platform.OS === "android"
		? StatusBar.currentHeight || spacing.m
		: spacing.xl;
const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white || "#FFFFFF" },
	topBarContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop: safeAreaTop + spacing.xs,
		paddingBottom: spacing.s,
		paddingHorizontal: spacing.m,
		backgroundColor: colors.white,
	},
	topBarIconTouchable: { padding: spacing.xs },
	appName: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	iconPlaceholder: { fontSize: 24, color: colors.textPrimary },
	iconPlaceholderSmall: { fontSize: 18, color: colors.textSecondary },
	scrollView: { flex: 1 },
	scrollContentContainer: { paddingBottom: spacing.xl },
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
		paddingVertical: spacing.m - 2,
		marginHorizontal: spacing.m,
		marginBottom: spacing.l,
	},
	searchBarPlaceholder: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPlaceholder || "#A0A0A0",
	},
	filterIconTouchable: { paddingLeft: spacing.s },
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
		backgroundColor: colors.primaryLight || "#E6FFFA",
		borderRadius: borderRadius.l,
		marginHorizontal: spacing.m,
		marginBottom: spacing.l,
		padding: spacing.m,
		alignItems: "center",
		overflow: "hidden",
	},
	promoTextContainer: { flex: 1, marginRight: spacing.s },
	promoTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.primaryDark || colors.primary,
	},
	promoDescription: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		marginTop: spacing.xs,
	},
	promoImage: { width: 100, height: 80, borderRadius: borderRadius.m },
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
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
	nearbyBikeCard: { width: 220, marginRight: spacing.m },
	popularPicksList: { paddingHorizontal: spacing.m },
	popularPickItemContainer: {
		flexDirection: "row",
		backgroundColor: colors.white,
		borderRadius: borderRadius.m,
		padding: spacing.s,
		marginBottom: spacing.m,
		alignItems: "center",
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
	popularPickDetails: { flex: 1, justifyContent: "center" },
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
	loadingIndicator: { marginVertical: spacing.xl },
	centeredMessage: {
		paddingVertical: spacing.xl,
		alignItems: "center",
		marginHorizontal: spacing.m,
	},
	messageText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		textAlign: "center",
		marginBottom: spacing.s,
	},
	errorText: {
		fontSize: typography.fontSizes.m,
		color: colors.error,
		textAlign: "center",
		marginBottom: spacing.s,
	},
	noBikesText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		textAlign: "center",
	},
});

export default HomeScreen;
