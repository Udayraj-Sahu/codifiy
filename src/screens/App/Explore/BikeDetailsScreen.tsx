// src/screens/App/Explore/BikeDetailsScreen.tsx
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { RouteProp, useFocusEffect } from "@react-navigation/native"; // Added useFocusEffect
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState, useCallback } from "react"; // Added useCallback
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux"; // Added
import PrimaryButton from "../../../components/common/PrimaryButton";
import { ExploreStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";
import { AppDispatch, RootState } from "../../../store/store"; // Added
import { fetchBikeDetailsById, clearBikeDetails } from "../../../store/slices/exploreBikeSlice"; // Added
import { Bike as StoreBike } from "../../../store/slices/adminBikeSlice"; // Re-using for structure

// Interface for BikeDetail screen (can be same as StoreBike or adapted)
interface BikeDetailScreenData extends StoreBike {
    // Add any screen-specific transformations if needed, but StoreBike is usually fine
}

const ImageCarousel: React.FC<{ images: string[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    if (!images || images.length === 0) {
        // Provide a fallback local image or a more descriptive placeholder
        return (
            <View style={styles.imagePlaceholder}>
                <Image source={require('../../../../assets/images/icon.png')} style={styles.fallbackImageStyle} />
                <Text>No Image</Text>
            </View>
        );
    }
    // Basic carousel, just shows one image for now
    // TODO: Implement actual carousel logic if multiple images exist
    return (
        <View style={styles.carouselContainer}>
            <Image
                source={{ uri: images[currentIndex] }}
                style={styles.bikeImage}
                resizeMode="cover"
            />
            {images.length > 1 && (
                <View style={styles.paginationDots}>
                    {images.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex
                                    ? styles.dotActive
                                    : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const DateTimePickerInputDisplay: React.FC<{
    label: string;
    value: Date | null;
    onPress: () => void;
    placeholder?: string;
}> = ({ label, value, onPress, placeholder = "Select Date & Time" }) => (
    <TouchableOpacity onPress={onPress} style={styles.dateTimePickerButton}>
        <Text style={styles.dateTimePickerLabel}>{label}</Text>
        <Text style={styles.dateTimePickerValue}>
            {value
                ? value.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : placeholder}
        </Text>
    </TouchableOpacity>
);

type BikeDetailsScreenRouteProp = RouteProp<
    ExploreStackParamList,
    "BikeDetails"
>;
type BikeDetailsScreenNavigationProp = StackNavigationProp<
    ExploreStackParamList,
    "BikeDetails"
>;

interface BikeDetailsScreenProps {
    route: BikeDetailsScreenRouteProp;
    navigation: BikeDetailsScreenNavigationProp;
}

const BikeDetailsScreen: React.FC<BikeDetailsScreenProps> = ({
    route,
    navigation,
}) => {
    const { bikeId } = route.params;
    const dispatch = useDispatch<AppDispatch>();

    const {
        bikeDetails: bike, // Renaming for convenience in this component
        isLoadingDetails: loading,
        errorDetails: error,
    } = useSelector((state: RootState) => state.exploreBikes);

    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [currentPickerTarget, setCurrentPickerTarget] = useState<
        "start" | "end" | null
    >(null);
    const [tempDateHolder, setTempDateHolder] = useState<Date | undefined>(
        undefined
    );

    useEffect(() => {
        if (bikeId) {
            dispatch(fetchBikeDetailsById(bikeId));
        }
        // Clear details when the screen is left
        return () => {
            dispatch(clearBikeDetails());
        };
    }, [dispatch, bikeId]);

    // Update navigation title when bike data is loaded
    useEffect(() => {
        if (bike) {
            navigation.setOptions({ title: bike.model }); // Using bike.model as name
        } else {
            navigation.setOptions({ title: "Bike Details" });
        }
    }, [navigation, bike]);


    const totalPrice = useMemo(() => {
        if (bike && startDate && endDate && endDate > startDate) {
            const hours =
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
            return (hours * bike.pricePerHour).toFixed(2);
        }
        return "0.00";
    }, [bike, startDate, endDate]);

    const showDatePicker = (target: "start" | "end") => {
        setCurrentPickerTarget(target);
        setPickerMode("date");
        const initialDate = target === "start" ? startDate : endDate;
        setTempDateHolder(initialDate || new Date());
        setShowPicker(true);
    };

    const onDateTimeChange = (
        event: DateTimePickerEvent,
        selectedDate?: Date
    ) => {
        if (event.type === "dismissed" || !selectedDate) {
            setShowPicker(false);
            setTempDateHolder(undefined);
            setCurrentPickerTarget(null);
            return;
        }

        if (pickerMode === "date") {
            setTempDateHolder(selectedDate);
            setPickerMode("time");
            if (Platform.OS !== "ios") {
                setShowPicker(false);
                setTimeout(() => setShowPicker(true), 0);
            } else {
                setShowPicker(true);
            }
        } else if (
            pickerMode === "time" &&
            tempDateHolder &&
            currentPickerTarget
        ) {
            const finalDate = new Date(tempDateHolder);
            finalDate.setHours(selectedDate.getHours());
            finalDate.setMinutes(selectedDate.getMinutes());
            finalDate.setSeconds(0);
            finalDate.setMilliseconds(0);

            if (currentPickerTarget === "start") {
                setStartDate(finalDate);
                if (endDate && finalDate >= endDate) setEndDate(null);
            } else if (currentPickerTarget === "end") {
                if (startDate && finalDate <= startDate) {
                    Alert.alert(
                        "Invalid Date",
                        "End date must be after start date."
                    );
                } else {
                    setEndDate(finalDate);
                }
            }
            setShowPicker(false);
            setTempDateHolder(undefined);
            setCurrentPickerTarget(null);
        }
    };

    const handleBookNow = () => {
        if (!bike || !startDate || !endDate || !(endDate > startDate)) {
            Alert.alert(
                "Missing Information",
                "Please select a valid rental period."
            );
            return;
        }
        navigation.navigate("Booking", {
            bikeId: bike._id, // Use _id from StoreBike
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: spacing.s }}>
                    Loading bike details...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <PrimaryButton title="Try Again" onPress={() => bikeId && dispatch(fetchBikeDetailsById(bikeId))} />
            </View>
        );
    }

    if (!bike) {
        return (
            <View style={styles.centered}>
                <Text>Bike not found.</Text>
            </View>
        );
    }

    // Map StoreBike to the structure BikeDetailsScreenData if needed,
    // or directly use bike from store if its structure is suitable.
    // For this example, assuming StoreBike structure is close enough.
    const displayBike: BikeDetailScreenData = bike;

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}>
                <ImageCarousel images={displayBike.images.map(img => img.url)} />

                <View style={styles.detailsSection}>
                    <Text style={styles.bikeName}>{displayBike.model}</Text>
                    <View style={styles.ratingPriceRow}>
                        <Text style={styles.ratingText}>
                            {/* Add rating and review count if available in your Bike model from backend */}
                            {/* ★ {(displayBike as any).averageRating?.toFixed(1) || 'N/A'} ({(displayBike as any).numberOfReviews || 0} reviews) */}
                            ★ {(displayBike.rating || 0).toFixed(1)} ({displayBike.reviewCount || 0} reviews)
                        </Text>
                        <Text style={styles.priceText}>
                            {displayBike.currencySymbol || "₹"}
                            {displayBike.pricePerHour}
                            <Text style={styles.priceUnit}>/hour</Text>
                        </Text>
                    </View>

                    <View style={styles.tagsContainer}>
                        {/* Assuming category can be a tag. Add more tags if bike model has them. */}
                        <View style={styles.tag}><Text style={styles.tagText}>{displayBike.category}</Text></View>
                        {/* {(displayBike.tags || []).map((tag, index) => (
                            <View key={index} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                        ))} */}
                        {/* Add transmission, engine if available */}
                    </View>

                    <Text style={styles.sectionTitle}>About This Bike</Text>
                    <Text style={styles.descriptionText}>
                        {displayBike.description || "No description available."}
                    </Text>

                    <Text style={styles.sectionTitle}>
                        Select Rental Period
                    </Text>
                    <DateTimePickerInputDisplay
                        label="Start Date & Time"
                        value={startDate}
                        onPress={() => showDatePicker("start")}
                    />
                    <DateTimePickerInputDisplay
                        label="End Date & Time"
                        value={endDate}
                        onPress={() => showDatePicker("end")}
                        placeholder={
                            startDate
                                ? "Select End Date & Time"
                                : "Select Start Date first"
                        }
                    />

                    {startDate && endDate && endDate > startDate && (
                        <Text style={styles.totalPriceText}>
                            Total: {displayBike.currencySymbol || "₹"}
                            {totalPrice} (
                            {(
                                (endDate.getTime() - startDate.getTime()) /
                                (1000 * 60 * 60)
                            ).toFixed(1)}
                            hours)
                        </Text>
                    )}
                </View>
                <PrimaryButton
                    title="Book Now"
                    onPress={handleBookNow}
                    style={styles.bookNowButton}
                    disabled={!startDate || !endDate || !(endDate > startDate)}
                />
            </ScrollView>

            {showPicker && currentPickerTarget && (
                <DateTimePicker
                    value={tempDateHolder || new Date()}
                    mode={pickerMode}
                    is24Hour={false}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onDateTimeChange}
                    minimumDate={
                        currentPickerTarget === "end" && startDate
                            ? new Date(
                                startDate.getTime() + (59 * 60 * 1000) // End time at least 59 mins after start
                            )
                            : new Date(Date.now() - (24*60*60*1000)) // Allow picking from yesterday for start
                    }
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundMain || "#FFFFFF" },
    contentContainer: { paddingBottom: spacing.xxl },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.l,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.fontSizes.m,
        textAlign: 'center',
        marginBottom: spacing.m,
    },
    carouselContainer: { backgroundColor: colors.greyLighter || "#E0E0E0" },
    bikeImage: { width: "100%", height: 250 },
    imagePlaceholder: {
        width: "100%",
        height: 250,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.greyLightest,
    },
    fallbackImageStyle: { // Style for the fallback local image
        width: 100,
        height: 100,
        tintColor: colors.greyMedium, // Optionally tint the placeholder
    },
    paginationDots: {
        position: "absolute",
        bottom: spacing.s,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 3 },
    dotActive: { backgroundColor: colors.primary || "green" },
    dotInactive: { backgroundColor: colors.greyMedium || "grey" },
    detailsSection: { paddingHorizontal: spacing.m, paddingTop: spacing.l },
    bikeName: {
        fontSize: typography.fontSizes.xxxl,
        fontWeight: typography.fontWeights.bold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    ratingPriceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.m,
    },
    ratingText: {
        fontSize: typography.fontSizes.m,
        color: colors.textSecondary,
    },
    priceText: {
        fontSize: typography.fontSizes.xxl,
        fontWeight: typography.fontWeights.bold,
        color: colors.primary,
    },
    priceUnit: {
        fontSize: typography.fontSizes.s,
        fontWeight: typography.fontWeights.regular,
        color: colors.textMedium,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: spacing.l,
    },
    tag: {
        backgroundColor: colors.primaryLight || "#E6F7FF",
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.pill || 15,
        marginRight: spacing.s,
        marginBottom: spacing.s,
    },
    tagText: {
        fontSize: typography.fontSizes.s,
        color: colors.primaryDark || colors.primary,
        fontWeight: typography.fontWeights.medium,
    },
    sectionTitle: {
        fontSize: typography.fontSizes.xl,
        fontWeight: typography.fontWeights.semiBold,
        color: colors.textPrimary,
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    descriptionText: {
        fontSize: typography.fontSizes.m,
        color: colors.textSecondary,
        lineHeight: typography.lineHeights?.body || 21,
        marginBottom: spacing.m,
    },
    totalPriceText: {
        fontSize: typography.fontSizes.l,
        fontWeight: typography.fontWeights.semiBold,
        color: colors.textPrimary,
        marginTop: spacing.s,
        marginBottom: spacing.l,
        textAlign: 'right',
    },
    bookNowButton: {
        marginHorizontal: spacing.m,
        marginTop: spacing.m,
        marginBottom: spacing.m,
    },
    dateTimePickerButton: {
        backgroundColor: colors.backgroundLight || "#F0F0F0",
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.borderDefault || "#DDD",
    },
    dateTimePickerLabel: {
        fontSize: typography.fontSizes.s,
        color: colors.textMedium,
        marginBottom: spacing.xs,
    },
    dateTimePickerValue: {
        fontSize: typography.fontSizes.m,
        color: colors.textPrimary, // Ensure this is not transparent
        fontWeight: typography.fontWeights.medium,
    },
});

export default BikeDetailsScreen;