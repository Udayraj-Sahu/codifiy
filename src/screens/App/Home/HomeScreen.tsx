// src/screens/App/Home/HomeScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import BikeCard from "../../../components/common/BikeCard";
import { HomeStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";
import { AppDispatch, RootState } from "../../../store/store";
import {
    fetchNearbyBikes,
    fetchPopularPicks,
    // Bike as StoreBike, // Using Bike from adminBikeSlice for now
} from "../../../store/slices/homeScreenBikeSlice";
import { Bike as StoreBike } from "../../../store/slices/adminBikeSlice"; // Re-using for structure

// Interface for the card, mapping from the Bike interface from Redux store
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
            source={item.imageUrl ? { uri: item.imageUrl } : require("../../../../assets/images/icon.png")}
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
        errorNearby, // You might want to display these errors
        errorPopular,
    } = useSelector((state: RootState) => state.homeScreenBikes);

    const [currentLocation, setCurrentLocation] =
        useState("New York, Downtown"); // Placeholder, ideally from GPS
    const [currentCoords, setCurrentCoords] = useState({ latitude: 40.7128, longitude: -74.0060 }); // Placeholder
    const [selectedBikeTypeFilter, setSelectedBikeTypeFilter] = useState<string | null>(null);

    const loadNearbyBikes = useCallback(() => {
        // TODO: Get actual current coordinates from device location service
        dispatch(fetchNearbyBikes({
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            limit: 5, // Or some other limit
            maxDistance: 10000 // 10km, adjust as needed
        }));
    }, [dispatch, currentCoords.latitude, currentCoords.longitude]);

    const loadPopularPicks = useCallback(() => {
        dispatch(fetchPopularPicks({ limit: 3, sortBy: "averageRating:desc" })); // Example: fetch top 3 by rating
    }, [dispatch]);

    useEffect(() => {
        // TODO: Add permission checks and get actual device location
        // For now, we use placeholder coordinates
        loadNearbyBikes();
        loadPopularPicks();
    }, [loadNearbyBikes, loadPopularPicks]);

    const handleProfilePress = () => {
        navigation.getParent()?.navigate("ProfileTab");
    };

    const handleNotificationsPress = useCallback(() => {
        navigation.navigate("NotificationsScreen");
    }, [navigation]);

    const handleLocationPress = () => {
        console.log("Location card pressed - implement location selection and update currentCoords");
        // After updating currentCoords, you might want to re-trigger loadNearbyBikes
    };

    const handleSearchPress = () => {
        navigation.navigate("ExploreTab" as any, { screen: 'Explore', params: { focusSearch: true } });
    };

    const handleFilterIconPress = () => {
        navigation.navigate("ExploreTab" as any, { screen: 'Filter' });
    };

    const handleBikeTypeFilterPress = (filterId: string) => {
        const newFilter = selectedBikeTypeFilter === filterId ? null : filterId;
        setSelectedBikeTypeFilter(newFilter);
        const filterName = BIKE_TYPE_FILTERS.find((f) => f.id === newFilter)?.name;
        console.log("Selected bike type filter:", filterName || "All");
        // Navigate to explore with this filter or refetch with this category
        navigation.navigate("ExploreTab" as any, {
            screen: 'Explore',
            params: { appliedFilters: { bikeTypes: filterName ? [filterName] : [] } }
        });
    };

    const navigateToBikeDetails = (bikeId: string) => {
        navigation.navigate("ExploreTab" as any, { screen: 'BikeDetails', params: { bikeId } });
    };

    // Transform bikes from store to BikeListItem
    const transformedNearbyBikes: BikeListItem[] = nearbyBikesFromStore.map((bike: StoreBike) => ({
        id: bike._id,
        name: bike.model,
        type: bike.category,
        pricePerHour: bike.pricePerHour,
        imageUrl: bike.images && bike.images.length > 0 ? bike.images[0].url : "",
        // rating, reviewCount, distanceInKm would ideally come from backend for nearby/popular specific queries
        // or be calculated. For now, they are optional in BikeListItem.
        // rating: bike.averageRating, // If your Bike model has this
        // reviewCount: bike.numberOfReviews, // If your Bike model has this
    }));

    const transformedPopularPicks: BikeListItem[] = popularPicksFromStore.map((bike: StoreBike) => ({
        id: bike._id,
        name: bike.model,
        type: bike.category,
        pricePerHour: bike.pricePerHour,
        imageUrl: bike.images && bike.images.length > 0 ? bike.images[0].url : "",
        // rating: bike.averageRating,
        // reviewCount: bike.numberOfReviews,
    }));


    const renderNearbyBikeSection = () => {
        if (isLoadingNearby && nearbyBikesFromStore.length === 0) {
            return <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />;
        }
        if (errorNearby) {
             return <Text style={styles.noBikesText}>Error loading nearby bikes: {errorNearby}</Text>;
        }
        if (transformedNearbyBikes.length === 0) {
            return <Text style={styles.noBikesText}>No bikes found nearby. Try adjusting location.</Text>;
        }
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalBikeList}>
                {transformedNearbyBikes.map((bike) => (
                    <BikeCard
                        key={bike.id}
                        imageUrl={bike.imageUrl || "https://via.placeholder.com/200x150.png?text=No+Image"}
                        name={bike.name}
                        rating={bike.rating || 0}
                        reviewCount={bike.reviewCount || 0}
                        distanceInKm={bike.distanceInKm || 0}
                        pricePerHour={bike.pricePerHour}
                        currencySymbol={bike.currencySymbol}
                        onPressCard={() => navigateToBikeDetails(bike.id)}
                        onPressBookNow={() => navigateToBikeDetails(bike.id)}
                        style={styles.nearbyBikeCard}
                    />
                ))}
            </ScrollView>
        );
    };

    const renderPopularPicksSection = () => {
        if (isLoadingPopular && popularPicksFromStore.length === 0) {
            return <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />;
        }
         if (errorPopular) {
             return <Text style={styles.noBikesText}>Error loading popular bikes: {errorPopular}</Text>;
        }
        if (transformedPopularPicks.length === 0) {
            return <Text style={styles.noBikesText}>No popular bikes to show right now.</Text>;
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
                {renderNearbyBikeSection()}


                <Text style={styles.sectionTitle}>Popular Picks</Text>
                {renderPopularPicksSection()}

            </ScrollView>
        </View>
    );
};

const safeAreaTop =
    Platform.OS === "android"
        ? StatusBar.currentHeight || spacing.m
        : spacing.xl;

// Styles remain largely the same, with addition of loadingIndicator and noBikesText
const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: colors.white || "#FFFFFF",
    },
    topBarContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: safeAreaTop + spacing.xs,
        paddingBottom: spacing.s,
        paddingHorizontal: spacing.m,
        backgroundColor: colors.white,
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
        fontSize: 24,
        color: colors.textPrimary,
    },
    iconPlaceholderSmall: {
        fontSize: 18,
        color: colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: spacing.xl,
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
        paddingVertical: spacing.m - 2,
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
        backgroundColor: colors.primaryLight || "#E6FFFA",
        borderRadius: borderRadius.l,
        marginHorizontal: spacing.m,
        marginBottom: spacing.l,
        padding: spacing.m,
        alignItems: "center",
        overflow: "hidden",
    },
    promoTextContainer: {
        flex: 1,
        marginRight: spacing.s,
    },
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
    promoImage: {
        width: 100,
        height: 80,
        borderRadius: borderRadius.m,
    },
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
    nearbyBikeCard: {
        width: 220,
        marginRight: spacing.m,
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
    loadingIndicator: {
        marginVertical: spacing.xl,
    },
    noBikesText: {
        textAlign: 'center',
        color: colors.textMedium,
        marginVertical: spacing.l,
        marginHorizontal: spacing.m,
        fontSize: typography.fontSizes.m,
    }
});

export default HomeScreen;