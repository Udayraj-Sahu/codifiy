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
import { useDispatch, useSelector } from "react-redux"; // Added Redux hooks
import PrimaryButton from "../../components/common/PrimaryButton";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { AppDispatch, RootState } from "../../store/store"; // Added
import {
    fetchAdminBikes,
    Bike,
    // deleteAdminBike, // You'd create this thunk for deletion
} from "../../store/slices/adminBikeSlice"; // Added Redux slice and actions
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For actual icons

// Interface for the card, mapping from the Bike interface from Redux store
interface BikeAdminCardData {
    id: string;
    name: string; // Will map from bike.model
    pricePerDay: string;
    status: "Available" | "Rented" | "Under Maintenance" | "Unknown"; // Added Unknown
    location: string;
    imageUrl: string;
}

// API Simulation (deleteAdminBikeAPI would be replaced by a Redux thunk in a full implementation)
// For now, we keep the dummy delete API as its modification is outside the scope of just fetching
const deleteAdminBikeAPI = async (
    bikeId: string
): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Bike ${bikeId} would be deleted. (Simulated)`);
            // In a real app, you'd dispatch an action here:
            // dispatch(deleteAdminBike(bikeId));
            resolve({ success: true, message: "Bike deleted successfully (simulated)." });
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
        Rented: { // This status would likely come from booking data, not directly from bike.availability
            badge: styles.statusBadgeRented,
            text: styles.statusTextRented,
        },
        "Under Maintenance": { // This is a new status not directly in the Bike model, would need logic
            badge: styles.statusBadgeMaintenance,
            text: styles.statusTextMaintenance,
        },
        Unknown: { // Fallback
            badge: styles.statusBadgeMaintenance, // Or a generic grey
            text: styles.statusTextMaintenance,
        }
    };
    const currentStatusStyle = statusStyles[item.status] || statusStyles.Unknown;

    return (
        <TouchableOpacity
            style={styles.bikeCardContainer}
            onPress={() => onPressCard(item.id)}
            activeOpacity={0.9}>
            <Image
                source={item.imageUrl ? { uri: item.imageUrl } : require("../../../assets/images/icon.png")} // Fallback image
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
    const dispatch = useDispatch<AppDispatch>();
    const {
        bikes: bikesFromStore,
        isLoading,
        error,
        pagination
    } = useSelector((state: RootState) => state.adminBikes);

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const bikesLimit = 10; // Or get from pagination?.limit

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => navigation.navigate("AdminBikeForm", {})}
                    style={styles.headerAddButton}>
                    <Text style={styles.headerAddButtonText}>+</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const loadBikes = useCallback(
        (pageToLoad = currentPage, currentQuery = searchQuery) => {
            const params: { page?: number; limit?: number; sortBy?: string; model?: string } = {
                page: pageToLoad,
                limit: bikesLimit,
                sortBy: 'createdAt:desc', // Example sort
            };
            if (currentQuery.trim()) {
                params.model = currentQuery.trim(); // Assuming backend filters by model for search
            }
            dispatch(fetchAdminBikes(params));
        },
        [dispatch, currentPage, searchQuery, bikesLimit]
    );

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            loadBikes(1, searchQuery); // Load first page on focus
            setCurrentPage(1);
        });
        return unsubscribe;
    }, [navigation, loadBikes, searchQuery]);


    useEffect(() => {
        // Debounced search
        const handler = setTimeout(() => {
            setCurrentPage(1); // Reset to first page on new search
            loadBikes(1, searchQuery);
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
                        // In a real app, dispatch a delete thunk:
                        // await dispatch(deleteAdminBike(bikeId)).unwrap();
                        // For now, using the simulation:
                        const result = await deleteAdminBikeAPI(bikeId);
                        if (result.success) {
                            Alert.alert("Success", result.message || "Bike deleted.");
                            loadBikes(1, searchQuery); // Refresh list to first page
                            setCurrentPage(1);
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
    const handleCardPress = (bikeId: string) => handleEditBike(bikeId);

    // Transform bikes from store to BikeAdminCardData
    const transformedBikes: BikeAdminCardData[] = bikesFromStore.map((bike: Bike) => {
        let status: BikeAdminCardData["status"] = "Unknown";
        if (bike.availability === true) {
            status = "Available";
        } else if (bike.availability === false) {
            // This is a simplification. 'Rented' or 'Under Maintenance'
            // would likely be determined by other fields or related data (e.g., active bookings)
            // For now, if not available, let's pick one or add more specific logic if bike model had it.
            status = "Unavailable"; // Or a more specific status if your Bike model has one
        }

        return {
            id: bike._id,
            name: bike.model, // Mapping model to name
            pricePerDay: `₹${bike.pricePerDay}/day`, // Formatting price
            status: status,
            location: bike.location?.address || "Not specified", // Using optional chaining
            imageUrl: bike.images && bike.images.length > 0 ? bike.images[0].url : "", // Use first image
        };
    });

    const handleLoadMore = () => {
        if (pagination && currentPage < pagination.totalPages && !isLoading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            loadBikes(nextPage, searchQuery);
        }
    };

    if (isLoading && transformedBikes.length === 0 && currentPage === 1) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading bikes...</Text>
            </View>
        );
    }
    if (error && transformedBikes.length === 0) {
        return (
            <View style={styles.centered}>
                <Text style={styles.noBikesText}>Error fetching bikes: {error}</Text>
                <PrimaryButton title="Retry" onPress={() => loadBikes(1, searchQuery)} />
            </View>
        )
    }


    return (
        <View style={styles.screenContainer}>
            <View style={styles.searchBarWrapper}>
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIconText}>🔍</Text>
                    <TextInput
                        placeholder="Search bikes by model..."
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
            <View style={styles.addBikeButtonContainer}>
                <PrimaryButton
                    title="Add New Bike"
                    onPress={() => navigation.navigate("AdminBikeForm", {})}
                    iconLeft={
                        <Text
                            style={{
                                color: colors.white,
                                marginRight: spacing.s, // Added margin for icon
                                fontSize: 18,
                            }}>
                            +
                        </Text>
                    }
                />
            </View>
            {transformedBikes.length === 0 && !isLoading ? (
                <View style={styles.centered}>
                    <Text style={styles.noBikesText}>No bikes found.</Text>
                    {!searchQuery && (
                        <Text style={styles.noBikesSubText}>
                            Tap the '+' icon or 'Add New Bike' to add a new bike.
                        </Text>
                    )}
                </View>
            ) : (
                <FlatList
                    data={transformedBikes}
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
                    onRefresh={() => { setCurrentPage(1); loadBikes(1, searchQuery);}}
                    refreshing={isLoading && currentPage === 1} // Show refresh indicator on pull to refresh first page
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isLoading && currentPage > 1 ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.m }} /> : null}
                />
            )}
        </View>
    );
};

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
        backgroundColor: colors.primary,
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
        lineHeight: 22, // Adjust for vertical centering if needed
    },
    searchBarWrapper: {
        paddingHorizontal: spacing.m,
        paddingTop: spacing.m, // Give some space from top
        paddingBottom: spacing.s,
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
        height: 44, // Standard height
    },
    searchIconText: {
        fontSize: 18, // Or use an actual icon component
        color: colors.textPlaceholder,
        marginRight: spacing.s,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSizes.m,
        color: colors.textPrimary,
    },
    addBikeButtonContainer: { // Container for the "Add New Bike" button
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.m, // Add vertical padding
        backgroundColor: colors.white, // Match search bar background or screen bg
        // borderBottomWidth: 1, // Optional: if you want a separator
        // borderBottomColor: colors.borderDefault || "#EEE",
    },
    listContentContainer: { paddingHorizontal: spacing.m, paddingTop: spacing.s },

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
        alignItems: "flex-start", // Changed from center to flex-start
    },
    bikeCardImage: {
        width: 80, // Slightly larger for better detail
        height: 80,
        borderRadius: borderRadius.s,
        marginRight: spacing.m,
        backgroundColor: colors.greyLighter,
    },
    bikeCardDetails: { flex: 1 }, // Removed justifyContent: "center"
    bikeCardName: {
        fontSize: typography.fontSizes.l, // Slightly larger name
        fontWeight: typography.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xxs,
    },
    bikeCardPrice: {
        fontSize: typography.fontSizes.m,
        color: colors.primaryDark || colors.primary, // Darker for better contrast
        fontWeight: typography.fontWeights.semiBold,
        marginBottom: spacing.xs,
    },
    bikeCardStatusBadge: {
        paddingHorizontal: spacing.m, // More padding
        paddingVertical: spacing.xs,  // More padding
        borderRadius: borderRadius.pill,
        alignSelf: "flex-start",
        marginBottom: spacing.s, // Increased margin
    },
    bikeCardStatusText: {
        fontSize: typography.fontSizes.xs,
        fontWeight: typography.fontWeights.bold,
        textTransform: 'capitalize',
    },
    statusBadgeAvailable: { backgroundColor: colors.successLight || "#D4EFDF" },
    statusTextAvailable: { color: colors.successDark || "#196F3D" },
    statusBadgeRented: { backgroundColor: colors.infoLight || "#D6EAF8" }, // Example: if 'Rented' comes from another source
    statusTextRented: { color: colors.infoDark || "#1A5276" },
    statusBadgeMaintenance: {
        backgroundColor: colors.warningLight || "#FDEBD0",
    },
    statusTextMaintenance: { color: colors.warningDark || "#A0522D" },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.s, // Consistent margin
    },
    locationIcon: {
        fontSize: 14, // Adjust if using a real icon
        color: colors.textMedium,
        marginRight: spacing.xs,
    },
    bikeCardLocation: {
        fontSize: typography.fontSizes.s,
        color: colors.textMedium,
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "flex-start", // Align actions to the start
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderDefault || '#E0E0E0',
        paddingTop: spacing.s,
        marginTop: spacing.s,
    },
    actionLink: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: spacing.l, // Space between Edit and Delete
        paddingVertical: spacing.xxs, // Small touch padding
    },
    actionIcon: { fontSize: 16, marginRight: spacing.xs -2 },
    actionLinkText: {
        fontSize: typography.fontSizes.s,
        fontWeight: typography.fontWeights.medium,
    },
    editText: {
        color: colors.primary,
    },
    deleteText: { color: colors.error },
});

export default AdminManageBikesScreen;