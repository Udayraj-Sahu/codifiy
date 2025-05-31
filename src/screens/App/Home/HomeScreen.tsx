// src/screens/App/Home/HomeScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
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
	Bike as StoreBike,
} from "../../../store/slices/homeScreenBikeSlice";
import { AppDispatch, RootState } from "../../../store/store";

// Import from your theme structure
import { borderRadius, spacing, typography } from "../../../theme"; // Assuming general theme structure is here
import { colors } from "../../../constants/colors"; // Corrected import for the separated colors.ts

import * as Location from "expo-location";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// --- Types ---
export interface BikeListItem {
	id: string;
	name: string;
	type: string;
	pricePerHour: number;
	currencySymbol?: string;
	imageUrl: string;
	rating?: number;
	reviewCount?: number;
	distanceInKm?: number;
}
interface BikeTypeFilter {
	id: string;
	name: string;
	iconName: keyof typeof MaterialIcons.glyphMap;
}
interface Promotion {
	id: string;
	title: string;
	description: string;
	imageUrl: string;
	backgroundColor?: string;
	textColor?: string;
	buttonBackgroundColor?: string;
	buttonTextColor?: string;
}

const BIKE_TYPE_FILTERS: BikeTypeFilter[] = [
	{ id: "1", name: "Bike", iconName: "pedal-bike" },
	{ id: "2", name: "Scooter", iconName: "electric-scooter" },
	{ id: "3", name: "Electric", iconName: "electric-bike" },
	{ id: "4", name: "Mountain", iconName: "downhill-skiing" },
];

const PROMOTION_BANNER: Promotion = {
	id: "promo1",
	title: "Your Next Ride Awaits!",
	description: "Save big with our daily deals.",
	imageUrl: "https://via.placeholder.com/300x180.png?text=Ride+With+Bikya",
	backgroundColor: colors.backgroundCard,
	textColor: colors.textPrimary,
	buttonBackgroundColor: colors.primary,
	buttonTextColor: colors.buttonPrimaryText,
};

const PrimaryButton: React.FC<{
	title: string;
	onPress: () => void;
	style?: any;
	textStyle?: any;
}> = ({ title, onPress, style, textStyle }) => (
	<TouchableOpacity style={[styles.primaryButton, style]} onPress={onPress}>
		<Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
	</TouchableOpacity>
);

const FilterChip: React.FC<{
	item: BikeTypeFilter;
	isSelected: boolean;
	onPress: () => void;
}> = ({ item, isSelected, onPress }) => (
	<TouchableOpacity
		style={[
			styles.filterChipBase,
			isSelected
				? styles.filterChipSelectedBase
				: styles.filterChipUnselectedBase,
		]}
		onPress={onPress}>
		<MaterialIcons
			name={item.iconName}
			size={typography.fontSizes.m}
			style={[
				styles.filterChipIconBase,
				isSelected
					? styles.filterChipIconSelected
					: styles.filterChipIconUnselected,
			]}
		/>
		<Text
			style={[
				styles.filterChipTextBase,
				isSelected
					? styles.filterChipTextSelected
					: styles.filterChipTextUnselected,
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
		activeOpacity={0.9}
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
			<View style={styles.popularPickMetaRow}>
				{item.rating && (
					<View style={styles.ratingContainer}>
						<MaterialIcons name="star" style={styles.ratingIcon} />
						<Text style={styles.ratingText}>
							{item.rating.toFixed(1)}
						</Text>
					</View>
				)}
				<Text style={styles.popularPickPrice}>
					{item.currencySymbol || "₹"}
					{item.pricePerHour}
					<Text style={styles.perHourText}>/hr</Text>
				</Text>
			</View>
		</View>
		<TouchableOpacity style={styles.popularPickBookButton} onPress={onBook}>
			<MaterialIcons
				name="arrow-forward-ios"
				size={18}
				color={colors.buttonPrimaryText}
			/>
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
	const [isFetchingLocation, setIsFetchingLocation] = useState(true);
	const [selectedBikeTypeFilter, setSelectedBikeTypeFilter] = useState<
		string | null
	>(null);

	const getLocationAsync = useCallback(async () => {
		setIsFetchingLocation(true);
		setLocationErrorMsg(null);
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			setLocationErrorMsg(
				"Location permission denied. Enable in settings for nearby bikes."
			);
			setCurrentLocationDisplay("Enable Location Access");
			setIsFetchingLocation(false);
			setCurrentCoords(null);
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
			setLocationErrorMsg("Could not fetch location. Ensure GPS is on.");
			setCurrentLocationDisplay("Location Unavailable");
			setCurrentCoords(null);
		}
		setIsFetchingLocation(false);
	}, []);

	useEffect(() => {
		getLocationAsync();
	}, [getLocationAsync]);

	const loadNearbyBikes = useCallback(() => {
		if (currentCoords) {
			dispatch(
				fetchNearbyBikes({
					latitude: currentCoords.latitude,
					longitude: currentCoords.longitude,
					limit: 5,
					maxDistance: 20000,
				})
			);
		} else if (!isFetchingLocation && !locationErrorMsg) {
			console.log("HomeScreen: Coords unavailable for nearby bikes.");
		}
	}, [dispatch, currentCoords, isFetchingLocation, locationErrorMsg]);

	const loadPopularPicks = useCallback(() => {
		dispatch(fetchPopularPicks({ limit: 4, sortBy: "averageRating:desc" }));
	}, [dispatch]);

	useEffect(() => {
		loadPopularPicks();
	}, [loadPopularPicks]);

	useEffect(() => {
		if (!isFetchingLocation) {
			loadNearbyBikes();
		}
	}, [currentCoords, isFetchingLocation, locationErrorMsg, loadNearbyBikes]);

	const handleProfilePress = () =>
		navigation.getParent()?.navigate("ProfileTab");
	const handleNotificationsPress = useCallback(
		() => navigation.navigate("NotificationsScreen"),
		[navigation]
	);
	const handleLocationCardPress = () => getLocationAsync();
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
	const navigateToBikeDetails = (bikeId: string) =>
		navigation.navigate("ExploreTab" as any, {
			screen: "BikeDetails",
			params: { bikeId },
		});

	const transformedNearbyBikes: BikeListItem[] = useMemo(
		() =>
			nearbyBikesFromStore.map((bike: StoreBike) => ({
				id: bike._id,
				name: bike.model,
				type: bike.category,
				pricePerHour: bike.pricePerHour,
				imageUrl: bike.images?.[0]?.url || "",
				rating: (bike as any).averageRating,
				reviewCount: (bike as any).numberOfReviews,
				distanceInKm: (bike as any).distance,
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
				imageUrl: bike.images?.[0]?.url || "",
				rating: (bike as any).averageRating,
				reviewCount: (bike as any).numberOfReviews,
			})),
		[popularPicksFromStore]
	);

	const renderNearbyBikeSection = () => {
		if (isFetchingLocation && !currentCoords) {
			return (
				<View style={styles.messageContainer}>
					<ActivityIndicator size="small" color={colors.primary} />
					<Text style={styles.messageText}>
						Finding rides near you...
					</Text>
				</View>
			);
		}
		if (locationErrorMsg) {
			return (
				<View style={styles.messageContainer}>
					<MaterialIcons
						name="location-off"
						size={40}
						color={colors.textError}
						style={{ marginBottom: spacing.s }}
					/>
					<Text style={styles.errorText}>{locationErrorMsg}</Text>
					<PrimaryButton
						title="Retry Location"
						onPress={getLocationAsync}
						style={styles.retryButton}
						textStyle={styles.retryButtonText}
					/>
				</View>
			);
		}
		if (isLoadingNearby && transformedNearbyBikes.length === 0) {
			return (
				<ActivityIndicator
					size="large"
					color={colors.primary}
					style={styles.fullPageLoader}
				/>
			);
		}
		if (errorNearby) {
			return (
				<View style={styles.messageContainer}>
					<MaterialIcons
						name="error-outline"
						size={40}
						color={colors.textError}
						style={{ marginBottom: spacing.s }}
					/>
					<Text style={styles.errorText}>
						Bikes unavailable: {errorNearby}
					</Text>
					<PrimaryButton
						title="Try Again"
						onPress={loadNearbyBikes}
						style={styles.retryButton}
						textStyle={styles.retryButtonText}
					/>
				</View>
			);
		}
		if (transformedNearbyBikes.length === 0 && !isLoadingNearby) {
			return (
				<View style={styles.messageContainer}>
					<MaterialIcons
						name="sentiment-dissatisfied"
						size={40}
						color={colors.textSecondary}
						style={{ marginBottom: spacing.s }}
					/>
					<Text style={styles.emptyStateText}>
						No bikes currently found nearby.
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
						style={styles.nearbyBikeCardStyle}
					/>
				))}
			</ScrollView>
		);
	};
	const renderPopularPicksSection = () => {
		if (isLoadingPopular && transformedPopularPicks.length === 0) {
			return (
				<ActivityIndicator
					size="large"
					color={colors.primary}
					style={styles.fullPageLoader}
				/>
			);
		}
		if (errorPopular) {
			return (
				<View style={styles.messageContainer}>
					<MaterialIcons
						name="error-outline"
						size={40}
						color={colors.textError}
						style={{ marginBottom: spacing.s }}
					/>
					<Text style={styles.errorText}>
						Picks unavailable: {errorPopular}
					</Text>
					<PrimaryButton
						title="Retry"
						onPress={loadPopularPicks}
						style={styles.retryButton}
						textStyle={styles.retryButtonText}
					/>
				</View>
			);
		}
		if (transformedPopularPicks.length === 0 && !isLoadingPopular) {
			return (
				<View style={styles.messageContainer}>
					<MaterialIcons
						name="star-outline"
						size={40}
						color={colors.textSecondary}
						style={{ marginBottom: spacing.s }}
					/>
					<Text style={styles.emptyStateText}>
						No popular picks to show.
					</Text>
				</View>
			);
		}
		return (
			<View style={styles.popularPicksListContainer}>
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
		<View style={styles.screen}>
			<StatusBar
				barStyle="light-content"
				backgroundColor={colors.backgroundHeader}
			/>
			<View style={styles.headerContainer}>
				<TouchableOpacity
					onPress={handleProfilePress}
					style={styles.headerIconContainer}>
					<MaterialIcons
						name="account-circle"
						size={28}
						color={colors.iconWhite}
					/>
				</TouchableOpacity>
				<Image
					source={require("../../../../assets/images/icon.png")} // Ensure your logo is visible on dark bg
					style={styles.headerLogo}
					resizeMode="contain"
				/>
				<TouchableOpacity
					onPress={handleNotificationsPress}
					style={styles.headerIconContainer}>
					<MaterialIcons
						name="notifications-none"
						size={28}
						color={colors.iconWhite}
					/>
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContentContainer}
				showsVerticalScrollIndicator={false}>
				<TouchableOpacity
					style={styles.locationSelectorCard}
					onPress={handleLocationCardPress}
					activeOpacity={0.8}>
					<MaterialIcons
						name="location-pin"
						size={20}
						color={colors.iconDefault}
					/>
					<Text style={styles.locationSelectorText} numberOfLines={1}>
						{isFetchingLocation
							? "Updating location..."
							: currentLocationDisplay}
					</Text>
					<MaterialIcons
						name="keyboard-arrow-down"
						size={24}
						color={colors.iconDefault}
					/>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.searchBarTouchable}
					onPress={handleSearchPress}
					activeOpacity={0.8}>
					<MaterialIcons
						name="search"
						size={24}
						color={colors.iconPlaceholder}
					/>
					<Text style={styles.searchBarPlaceholderText}>
						Search for bikes, destinations...
					</Text>
				</TouchableOpacity>

				<View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.filterChipsContainer}>
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

				<TouchableOpacity
					activeOpacity={0.9}
					onPress={() => {
						console.log("Promo banner pressed");
					}}>
					<View
						style={[
							styles.promoBannerCard,
							{
								backgroundColor:
									PROMOTION_BANNER.backgroundColor,
							},
						]}>
						<View style={styles.promoBannerTextContent}>
							<Text
								style={[
									styles.promoBannerTitle,
									{ color: PROMOTION_BANNER.textColor },
								]}>
								{PROMOTION_BANNER.title}
							</Text>
							<Text
								style={[
									styles.promoBannerDescription,
									{ color: PROMOTION_BANNER.textColor },
								]}>
								{PROMOTION_BANNER.description}
							</Text>
							<TouchableOpacity
								style={[
									styles.promoButton,
									{
										backgroundColor:
											PROMOTION_BANNER.buttonBackgroundColor,
									},
								]}>
								<Text
									style={[
										styles.promoButtonText,
										{
											color: PROMOTION_BANNER.buttonTextColor,
										},
									]}>
									Grab Offer
								</Text>
								<MaterialIcons
									name="arrow-forward"
									size={16}
									color={PROMOTION_BANNER.buttonTextColor}
									style={{ marginLeft: spacing.xs }}
								/>
							</TouchableOpacity>
						</View>
					</View>
				</TouchableOpacity>

				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Near You</Text>
					<TouchableOpacity
						onPress={() =>
							navigation.navigate("ExploreTab" as any, {
								screen: "Explore",
								params: { initialFocus: "nearby" },
							})
						}>
						<Text style={styles.seeAllText}>View Map</Text>
					</TouchableOpacity>
				</View>
				{renderNearbyBikeSection()}

				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Popular Picks</Text>
					<TouchableOpacity
						onPress={() =>
							navigation.navigate("ExploreTab" as any, {
								screen: "Explore",
								params: { initialFocus: "popular" },
							})
						}>
						<Text style={styles.seeAllText}>More</Text>
					</TouchableOpacity>
				</View>
				{renderPopularPicksSection()}
			</ScrollView>
		</View>
	);
};

const screenPadding = spacing.l;

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	headerContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingTop:
			(Platform.OS === "android" ? StatusBar.currentHeight : 0) ||
			spacing.s + spacing.s,
		paddingBottom: spacing.m,
		paddingHorizontal: screenPadding - spacing.xs,
		backgroundColor: colors.backgroundHeader,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	headerLogo: {
		height: 30,
		width: 80,
	},
	headerTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.bold,
	},
	headerIconContainer: {
		padding: spacing.s,
	},
	scrollView: {
		flex: 1,
	},
	scrollContentContainer: {
		paddingBottom: spacing.xxl,
	},
	locationSelectorCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundCard,
		marginHorizontal: screenPadding,
		marginTop: spacing.m,
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.l,
		elevation: 2,
		shadowColor: colors.shadowColor,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	locationSelectorText: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
		marginLeft: spacing.s,
	},
	searchBarTouchable: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundCard,
		marginHorizontal: screenPadding,
		marginTop: spacing.m,
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m + 2,
		borderRadius: borderRadius.l,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	searchBarPlaceholderText: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
		marginLeft: spacing.s,
	},
	filterChipsContainer: {
		paddingHorizontal: screenPadding,
		paddingTop: spacing.m,
		paddingBottom: spacing.s,
	},
	filterChipBase: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.s,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		borderWidth: 1,
	},
	filterChipUnselectedBase: {
		backgroundColor: colors.backgroundCard,
		borderColor: colors.borderDefault,
	},
	filterChipSelectedBase: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	filterChipIconBase: {
		marginRight: spacing.xs,
	},
	filterChipIconUnselected: {
		color: colors.iconDefault,
	},
	filterChipIconSelected: {
		color: colors.buttonPrimaryText,
	},
	filterChipTextBase: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	filterChipTextUnselected: {
		color: colors.textSecondary,
	},
	filterChipTextSelected: {
		color: colors.buttonPrimaryText,
		fontWeight: typography.fontWeights.semiBold,
	},
	promoBannerCard: {
		flexDirection: "row",
		borderRadius: borderRadius.xl,
		marginHorizontal: screenPadding,
		marginTop: spacing.l,
		marginBottom: spacing.l,
		alignItems: "stretch",
		overflow: "hidden",
		elevation: 4,
		shadowColor: colors.shadowColor,
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		minHeight: 140,
	},
	promoBannerTextContent: {
		flex: 1.5,
		padding: spacing.m,
		justifyContent: "center",
	},
	promoBannerTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		fontWeight: typography.fontWeights.bold,
		marginBottom: spacing.xs,
	},
	promoBannerDescription: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		marginBottom: spacing.m,
		lineHeight: typography.fontSizes.s * 1.5,
	},
	promoButton: {
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.s,
		borderRadius: borderRadius.m,
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
	},
	promoButtonText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryBold,
		fontWeight: typography.fontWeights.bold,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginHorizontal: screenPadding,
		marginTop: spacing.xl,
		marginBottom: spacing.m,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	seeAllText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textLink,
		fontWeight: typography.fontWeights.semiBold,
	},
	horizontalBikeList: {
		paddingLeft: screenPadding,
		paddingRight: screenPadding - spacing.m,
		paddingVertical: spacing.s,
	},
	nearbyBikeCardStyle: {
		width: Dimensions.get("window").width * 0.7,
		marginRight: spacing.m,
		backgroundColor: colors.backgroundCard,
		elevation: 4,
		shadowColor: colors.shadowColor,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		borderRadius: borderRadius.l,
	},
	popularPicksListContainer: {
		paddingHorizontal: screenPadding,
		marginTop: spacing.xs,
	},
	popularPickItemContainer: {
		flexDirection: "row",
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		alignItems: "center",
		elevation: 3,
		shadowColor: colors.shadowColor,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
	},
	popularPickImage: {
		width: 70,
		height: 70,
		borderRadius: borderRadius.m,
		marginRight: spacing.m,
		backgroundColor: colors.backgroundMain,
	},
	popularPickDetails: {
		flex: 1,
		justifyContent: "center",
	},
	popularPickName: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	popularPickType: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	popularPickMetaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	ratingContainer: { flexDirection: "row", alignItems: "center" },
	ratingIcon: {
		fontSize: typography.fontSizes.m,
		color: colors.ratingStarColor,
		marginRight: spacing.xs / 2,
	},
	ratingText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
	},
	popularPickPrice: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	perHourText: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	popularPickBookButton: {
		backgroundColor: colors.primary,
		padding: spacing.s,
		borderRadius: borderRadius.pill,
		marginLeft: spacing.s,
	},
	messageContainer: {
		paddingVertical: spacing.xl,
		alignItems: "center",
		marginHorizontal: screenPadding,
		justifyContent: "center",
		minHeight: 150,
	},
	messageText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.s,
	},
	errorText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
		marginTop: spacing.s,
		marginBottom: spacing.m,
	},
	emptyStateText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.s,
	},
	fullPageLoader: {
		marginVertical: spacing.xxl,
		minHeight: 200,
		justifyContent: "center",
		alignItems: "center",
	},
	retryButton: {
		backgroundColor: colors.buttonPrimaryBackground,
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		marginTop: spacing.m,
	},
	retryButtonText: {
		color: colors.buttonPrimaryText,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryBold,
	},
	primaryButton: {
		backgroundColor: colors.buttonPrimaryBackground,
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.xl, // Matched image's wider "Reserve" button
		borderRadius: borderRadius.l, // Matched image's "Reserve" button radius
		alignItems: "center",
	},
	primaryButtonText: {
		color: colors.buttonPrimaryText,
		fontSize: typography.fontSizes.l, // Matched image's "Reserve" text size
		fontFamily: typography.primaryBold, // Or typography.primarySemiBold
		fontWeight: typography.fontWeights.bold,
	},
});

export default HomeScreen;
