// src/screens/App/Explore/ExploreScreen.tsx
import { RouteProp, useRoute, useFocusEffect } from "@react-navigation/native"; // Added useRoute, useFocusEffect
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState, useCallback, useEffect } from "react";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import BikeCard from "../../../components/common/BikeCard";
import StyledTextInput from "../../../components/common/StyledTextInput";
import { ExploreStackParamList, AppliedFilters } from "../../../navigation/types";
import { colors, spacing, typography, borderRadius } from "../../../theme";
import { AppDispatch, RootState } from "../../../store/store";
import {
    fetchExploreBikes,
    setExploreFilters,
    // resetExploreFilters // If you add a reset button
    FetchExploreBikesParams,
} from "../../../store/slices/exploreBikeSlice";
import { Bike as StoreBike } from "../../../store/slices/adminBikeSlice"; // Re-using for structure

interface FilterChipProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
}
const FilterChip: React.FC<FilterChipProps> = ({
    label,
    isSelected,
    onPress,
}) => (
    <TouchableOpacity
        style={[
            styles.chip,
            isSelected ? styles.chipSelected : styles.chipNotSelected,
        ]}
        onPress={onPress}>
        <Text
            style={
                isSelected
                    ? styles.chipTextSelected
                    : styles.chipTextNotSelected
            }>
            {label}
        </Text>
    </TouchableOpacity>
);

type ExploreScreenNavigationProp = StackNavigationProp<
    ExploreStackParamList,
    "Explore"
>;
type ExploreScreenRouteProp = RouteProp<ExploreStackParamList, "Explore">;


interface ExploreScreenProps {
    navigation: ExploreScreenNavigationProp;
    // route prop is implicitly available via useRoute()
}

const ExploreScreen: React.FC<ExploreScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch<AppDispatch>();
    const route = useRoute<ExploreScreenRouteProp>();

    const {
        bikes: bikesFromStore,
        pagination,
        isLoading,
        error,
        currentFilters,
    } = useSelector((state: RootState) => state.exploreBikes);

    const [searchQuery, setSearchQuery] = useState(currentFilters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(currentFilters.category || "All Bikes");

    const categories = [
        "All Bikes", "Scooter", "Electric", "Mountain", "Cruiser", "Road", // Match BikeType in AdminBikeForm
        // Price filters could be handled by the FilterScreen
    ];

    const loadBikes = useCallback((pageToLoad = 1, filtersToApply?: FetchExploreBikesParams) => {
        const effectiveFilters = filtersToApply || currentFilters;
        const params: FetchExploreBikesParams = {
            ...effectiveFilters,
            page: pageToLoad,
            limit: 10, // Or from state.currentFilters.limit
            search: searchQuery.trim() || undefined, // Use 'search' for generic search
            category: selectedCategory === "All Bikes" ? undefined : selectedCategory,
        };
        dispatch(fetchExploreBikes(params));
    }, [dispatch, currentFilters, searchQuery, selectedCategory]);

    // Handle applied filters from FilterScreen
    useEffect(() => {
        if (route.params?.appliedFilters) {
            const filtersFromRoute = route.params.appliedFilters as AppliedFilters;
            // Map AppliedFilters to FetchExploreBikesParams
            const newFilters: FetchExploreBikesParams = {
                page: 1, // Reset to page 1 when new filters are applied
                limit: currentFilters.limit || 10,
                search: searchQuery, // Keep current search query
                category: selectedCategory === "All Bikes" ? undefined : selectedCategory, // Keep current category
                priceMin: filtersFromRoute.pricePerHourMin,
                priceMax: filtersFromRoute.pricePerHourMax,
                minRating: filtersFromRoute.minRating,
                availability: filtersFromRoute.availability === 'now' || filtersFromRoute.availability === 'today'
                                ? (filtersFromRoute.availability === 'now' ? true : undefined) // Example mapping
                                : undefined,
                // Add other filter mappings
            };
            dispatch(setExploreFilters(newFilters));
            // loadBikes will be triggered by currentFilters change
        }
    }, [route.params?.appliedFilters, dispatch, searchQuery, selectedCategory, currentFilters.limit]);


    // Fetch on initial mount and when filters/search/category change
    useEffect(() => {
        loadBikes(1); // Load first page
    }, [currentFilters]); // Removed loadBikes from here to avoid loop, loadBikes will be called by filter changes


    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            dispatch(setExploreFilters({ ...currentFilters, search: searchQuery.trim(), page: 1 }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, dispatch]);


    const handleSelectCategory = (category: string) => {
        setSelectedCategory(category);
        dispatch(setExploreFilters({
            ...currentFilters,
            category: category === "All Bikes" ? undefined : category,
            page: 1
        }));
    };

    const navigateToBikeDetails = (bikeId: string) => {
        navigation.navigate("BikeDetails", { bikeId });
    };

    const navigateToFilters = () => {
        navigation.navigate("Filter");
    };

    const transformedBikes: BikeListItem[] = bikesFromStore.map((bike: StoreBike) => ({
        id: bike._id,
        name: bike.model,
        type: bike.category,
        pricePerHour: bike.pricePerHour,
        imageUrl: bike.images && bike.images.length > 0 ? bike.images[0].url : "",
        rating: (bike as any).averageRating, // Assuming backend provides these, otherwise remove or calculate
        reviewCount: (bike as any).numberOfReviews,
        currencySymbol: "₹", // Or from config
    }));

    const handleLoadMore = () => {
        if (pagination && currentFilters.page && currentFilters.page < pagination.totalPages && !isLoading) {
            loadBikes((currentFilters.page || 1) + 1);
        }
    };

    const renderBikeItem = ({ item }: { item: BikeListItem }) => (
        <BikeCard
            imageUrl={item.imageUrl || "https://via.placeholder.com/300x200.png?text=No+Image"}
            name={item.name}
            rating={item.rating || 0}
            reviewCount={item.reviewCount || 0}
            distanceInKm={item.distanceInKm || 0} // distanceInKm is not in StoreBike, will be 0
            pricePerHour={item.pricePerHour}
            currencySymbol={item.currencySymbol}
            onPressCard={() => navigateToBikeDetails(item.id)}
            onPressBookNow={() => navigateToBikeDetails(item.id)}
            style={styles.bikeCard}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchSortContainer}>
                <StyledTextInput
                    placeholder="Search bikes, brands, or location"
                    value={searchQuery}
                    onChangeText={setSearchQuery} // Let useEffect handle dispatching
                    containerStyle={styles.searchBarContainer}
                    inputStyle={styles.searchInput}
                />
                <TouchableOpacity
                    onPress={navigateToFilters}
                    style={styles.sortButton}>
                    <Text style={styles.sortButtonText}>Filters</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterChipsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipsScroll}>
                    {categories.map((category) => (
                        <FilterChip
                            key={category}
                            label={category}
                            isSelected={selectedCategory === category}
                            onPress={() => handleSelectCategory(category)}
                        />
                    ))}
                </ScrollView>
            </View>

            {isLoading && transformedBikes.length === 0 && currentFilters.page === 1 && (
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.messageText}>Loading bikes...</Text>
                </View>
            )}
            {error && transformedBikes.length === 0 && (
                 <View style={styles.centeredMessage}>
                    <Text style={styles.messageText}>Error: {error}</Text>
                    <PrimaryButton title="Retry" onPress={() => loadBikes(1)} />
                </View>
            )}
            {!isLoading && transformedBikes.length === 0 && (
                <View style={styles.centeredMessage}>
                    <Text style={styles.messageText}>No bikes found matching your criteria.</Text>
                </View>
            )}

            <FlatList
                data={transformedBikes}
                renderItem={renderBikeItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.bikeListContent}
                showsVerticalScrollIndicator={false}
                onRefresh={() => loadBikes(1)} // Reset to page 1 on pull to refresh
                refreshing={isLoading && currentFilters.page === 1}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isLoading && (currentFilters.page || 1) > 1 ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.m }}/> : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundMain || "#F7F7F7",
    },
    searchSortContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: colors.white,
    },
    searchBarContainer: {
        flex: 1,
        marginBottom: 0,
    },
    searchInput: {
        paddingVertical: spacing.s,
    },
    sortButton: {
        marginLeft: spacing.s,
        padding: spacing.s,
    },
    sortButtonText: {
        color: colors.primary,
        fontWeight: typography.fontWeights.medium,
    },
    filterChipsContainer: {
        paddingVertical: spacing.s,
        paddingLeft: spacing.m,
        backgroundColor: colors.white,
    },
    filterChipsScroll: {
        paddingRight: spacing.m,
    },
    chip: {
        paddingVertical: spacing.s - 2,
        paddingHorizontal: spacing.m + 2,
        borderRadius: 20,
        marginRight: spacing.s,
        borderWidth: 1,
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipNotSelected: {
        backgroundColor: colors.white,
        borderColor: colors.borderDefault,
    },
    chipTextSelected: {
        color: colors.white,
        fontWeight: typography.fontWeights.medium,
        fontSize: typography.fontSizes.s,
    },
    chipTextNotSelected: {
        color: colors.textSecondary,
        fontWeight: typography.fontWeights.regular,
        fontSize: typography.fontSizes.s,
    },
    row: {
        justifyContent: "space-between",
        paddingHorizontal: spacing.m - spacing.s / 2,
    },
    bikeCard: {
        width: "48%",
        marginBottom: spacing.m,
    },
    bikeListContent: {
        paddingTop: spacing.m,
        paddingHorizontal: spacing.s / 2,
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.l,
    },
    messageText: {
        fontSize: typography.fontSizes.m,
        color: colors.textMedium,
        textAlign: 'center',
        marginBottom: spacing.m,
    }
});

export default ExploreScreen;