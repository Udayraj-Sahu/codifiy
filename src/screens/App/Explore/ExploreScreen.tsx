// src/screens/App/Explore/ExploreScreen.tsx
import { RouteProp, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import BikeCard from "../../../components/common/BikeCard"; // Assumed to be theme-aware
import StyledTextInput from "../../../components/common/StyledTextInput"; // Assumed to be theme-aware
import {
    AppliedFilters,
    ExploreStackParamList,
} from "../../../navigation/types";
import { Bike as StoreBike } from "../../../store/slices/adminBikeSlice";
import {
    fetchExploreBikes,
    FetchExploreBikesParams,
    setExploreFilters,
} from "../../../store/slices/exploreBikeSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Using dark theme colors now

// PrimaryButton (local or imported, assumed to use theme colors)
const PrimaryButton: React.FC<{
    title: string;
    onPress: () => void;
    style?: any;
    textStyle?: any;
}> = ({ title, onPress, style, textStyle }) => (
    <TouchableOpacity
        style={[localStyles.primaryButtonBase, style]}
        onPress={onPress}>
        <Text style={[localStyles.primaryButtonTextBase, textStyle]}>
            {title}
        </Text>
    </TouchableOpacity>
);
// Local styles for PrimaryButton if not imported and styled globally
const localStyles = StyleSheet.create({
    primaryButtonBase: {
        backgroundColor: colors.buttonPrimaryBackground,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.l,
        alignItems: "center",
        marginTop: spacing.m,
    },
    primaryButtonTextBase: {
        color: colors.buttonPrimaryText,
        fontSize: typography.fontSizes.m,
        fontFamily: typography.primaryBold,
        fontWeight: typography.fontWeights.bold,
    },
});

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
    const [selectedCategory, setSelectedCategory] = useState(
        currentFilters.category || "All Bikes"
    );

    const categories = [
        "All Bikes",
        "Scooter",
        "Electric",
        "Mountain",
        "Cruiser",
        "Road",
    ];

    const loadBikes = useCallback(
        (pageToLoad = 1, filtersToApply?: Partial<FetchExploreBikesParams>) => {
            const effectiveFilters = { ...currentFilters, ...filtersToApply };
            const params: FetchExploreBikesParams = {
                ...effectiveFilters,
                page: pageToLoad,
                limit: currentFilters.limit || 10,
                search: searchQuery.trim() || undefined,
                category:
                    selectedCategory === "All Bikes"
                        ? undefined
                        : selectedCategory,
            };
            dispatch(fetchExploreBikes(params));
        },
        [dispatch, currentFilters, searchQuery, selectedCategory]
    );

    useEffect(() => {
        if (route.params?.appliedFilters) {
            const filtersFromRoute = route.params
                .appliedFilters as AppliedFilters;
            const newFilters: Partial<FetchExploreBikesParams> = {
                priceMin: filtersFromRoute.pricePerHourMin,
                priceMax: filtersFromRoute.pricePerHourMax,
                minRating: filtersFromRoute.minRating,
                availability:
                    filtersFromRoute.availability === "now" ? true : undefined,
                page: 1,
            };
            const updatedFullFilters = {
                ...currentFilters,
                ...newFilters,
                search: searchQuery, // Keep current search
                category: // Keep current category
                    selectedCategory === "All Bikes"
                        ? undefined
                        : selectedCategory,
            };
            dispatch(
                setExploreFilters(updatedFullFilters as FetchExploreBikesParams)
            );
            navigation.setParams({ appliedFilters: undefined } as any);
        }
    }, [
        route.params?.appliedFilters,
        dispatch,
        currentFilters,
        searchQuery,
        selectedCategory,
        navigation,
    ]);

    useEffect(() => {
        loadBikes(currentFilters.page || 1);
    }, [currentFilters]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== (currentFilters.search || "")) {
                dispatch(
                    setExploreFilters({
                        ...currentFilters,
                        search: searchQuery.trim() || undefined,
                        page: 1,
                    } as FetchExploreBikesParams)
                );
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery, dispatch, currentFilters]);

    const handleSelectCategory = (category: string) => {
        setSelectedCategory(category);
        dispatch(
            setExploreFilters({
                ...currentFilters,
                category: category === "All Bikes" ? undefined : category,
                page: 1,
            } as FetchExploreBikesParams)
        );
    };

    const navigateToBikeDetails = (bikeId: string) => {
        navigation.navigate("BikeDetails", { bikeId });
    };

    const navigateToFilters = () => {
        navigation.navigate("Filter");
    };

    interface BikeListItem {
        id: string;
        name: string;
        type: string;
        pricePerHour: number;
        imageUrl: string;
        rating: number;
        reviewCount: number;
        currencySymbol: string;
        distanceInKm?: number;
    }

    const transformedBikes: BikeListItem[] = bikesFromStore.map(
        (bike: StoreBike): BikeListItem => ({
            id: bike._id,
            name: bike.model || "N/A",
            type: bike.category || "N/A",
            pricePerHour: typeof bike.pricePerHour === 'number' && !isNaN(bike.pricePerHour) ? bike.pricePerHour : 0,
            imageUrl:
                bike.images && bike.images.length > 0 ? bike.images[0].url : "",
            rating: typeof (bike as any).averageRating === 'number' && !isNaN((bike as any).averageRating) ? (bike as any).averageRating : 0,
            reviewCount: typeof (bike as any).numberOfReviews === 'number' && !isNaN((bike as any).numberOfReviews) ? (bike as any).numberOfReviews : 0,
            currencySymbol: "₹",
        })
    );

    const handleLoadMore = () => {
        if (
            pagination &&
            currentFilters.page &&
            currentFilters.page < pagination.totalPages &&
            !isLoading
        ) {
            loadBikes((currentFilters.page || 1) + 1);
        }
    };

    const renderBikeItem = ({ item }: { item: BikeListItem }) => (
        <View style={styles.bikeCardContainer}> {/* Added a container for padding/margin */}
            <BikeCard
                imageUrl={
                    item.imageUrl ||
                    "https://via.placeholder.com/300x200.png?text=No+Image"
                }
                name={item.name}
                rating={item.rating}
                reviewCount={item.reviewCount}
                distanceInKm={item.distanceInKm}
                pricePerHour={item.pricePerHour}
                currencySymbol={item.currencySymbol}
                onPressCard={() => navigateToBikeDetails(item.id)}
                onPressBookNow={() => navigateToBikeDetails(item.id)}
                style={styles.bikeCard} // BikeCard style itself might not need width: '100%' if parent handles it
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchSortContainer}>
                <StyledTextInput
                    placeholder="Search bikes or brands"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerStyle={styles.searchBarContainer}
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

            {isLoading &&
                transformedBikes.length === 0 &&
                (currentFilters.page || 1) === 1 && (
                    <View style={styles.centeredMessage}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                        <Text style={styles.messageText}>Loading bikes...</Text>
                    </View>
                )}
            {error && transformedBikes.length === 0 && (
                <View style={styles.centeredMessage}>
                    <Text
                        style={[
                            styles.messageText,
                            { color: colors.textError },
                        ]}>
                        Error: {error}
                    </Text>
                    <PrimaryButton title="Retry" onPress={() => loadBikes(1)} />
                </View>
            )}
            {!isLoading && !error && transformedBikes.length === 0 && (
                <View style={styles.centeredMessage}>
                    <Text style={styles.messageText}>
                        No bikes found matching your criteria.
                    </Text>
                </View>
            )}

            <FlatList
                data={transformedBikes}
                renderItem={renderBikeItem}
                keyExtractor={(item) => item.id}
                // numColumns={2} // REMOVED for single column
                // columnWrapperStyle={styles.row} // REMOVED
                contentContainerStyle={styles.bikeListContent}
                showsVerticalScrollIndicator={false}
                onRefresh={() => {
                    dispatch(
                        setExploreFilters({
                            ...currentFilters,
                            page: 1,
                        } as FetchExploreBikesParams)
                    );
                }}
                refreshing={isLoading && (currentFilters.page || 1) === 1}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoading && (currentFilters.page || 1) > 1 ? (
                        <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={{ marginVertical: spacing.m }}
                        />
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundMain,
    },
    searchSortContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: colors.backgroundCard,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDefault,
    },
    searchBarContainer: {
        flex: 1,
        marginRight: spacing.s,
    },
    sortButton: {
        padding: spacing.s,
    },
    sortButtonText: {
        color: colors.primary,
        fontFamily: typography.primaryMedium,
        fontSize: typography.fontSizes.m,
    },
    filterChipsContainer: {
        paddingVertical: spacing.s,
        paddingLeft: spacing.m,
        backgroundColor: colors.backgroundCard,
    },
    filterChipsScroll: {
        paddingRight: spacing.m,
    },
    chip: {
        paddingVertical: spacing.s - 2,
        paddingHorizontal: spacing.m + 2,
        borderRadius: borderRadius.pill,
        marginRight: spacing.s,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipNotSelected: {
        backgroundColor: colors.backgroundCard,
        borderColor: colors.borderDefault,
    },
    chipTextSelected: {
        color: colors.buttonPrimaryText,
        fontFamily: typography.primaryMedium,
        fontSize: typography.fontSizes.s,
    },
    chipTextNotSelected: {
        color: colors.textSecondary,
        fontFamily: typography.primaryRegular,
        fontSize: typography.fontSizes.s,
    },
    // row: { // This style was for columnWrapperStyle, no longer needed for single column list items
    //     justifyContent: "space-between",
    //     paddingHorizontal: spacing.m - spacing.s / 2,
    // },
    bikeCardContainer: { // New container for each card to handle horizontal padding
        paddingHorizontal: spacing.m, // Add horizontal padding here for each card row
        // marginBottom: spacing.m, // If BikeCard itself doesn't have marginBottom
    },
    bikeCard: {
        // width: "48%", // REMOVED: BikeCard will now take full width of its parent (bikeCardContainer)
        marginBottom: spacing.m, // Keep marginBottom on the card itself
    },
    bikeListContent: {
        paddingTop: spacing.s,
        paddingBottom: spacing.l,
        // Horizontal padding is now handled by bikeCardContainer for each item
    },
    centeredMessage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.l,
        marginTop: Dimensions.get("window").height / 5,
    },
    messageText: {
        fontSize: typography.fontSizes.m,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: spacing.m,
        marginTop: spacing.s,
    },
});

export default ExploreScreen;
