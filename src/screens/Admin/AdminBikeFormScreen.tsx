// src/screens/Admin/AdminBikeFormScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from "react-redux"; // Added for Redux
import PrimaryButton from "../../components/common/PrimaryButton";
import StyledTextInput from "../../components/common/StyledTextInput";
import { AdminStackParamList } from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
import { AppDispatch, RootState } from "../../store/store"; // Added for Redux
import {
    addAdminBike,
    updateAdminBike,
    // fetchAdminBikeById, // You might need this for loading existing bike data
    // setBikeDetailsForEdit, // If you fetch and then set to form
    Bike as StoreBike
} from "../../store/slices/adminBikeSlice"; // Added for Redux

// --- Types ---
type BikeType =
    | "Road"
    | "Mountain"
    | "Hybrid"
    | "Electric"
    | "Scooter"
    | "Cruiser"
    | "Motorcycle"
    | "";

interface AdminBikeFormState {
    bikeName: string; // Maps to backend 'model'
    model: string;    // Maps to backend 'version' or part of description for backend 'model'
    category: BikeType;
    hourlyPrice: string;
    dailyPrice: string;
    availability: boolean;
    helmetAvailable: boolean;
    quantity: string;
    bikeImageUri: string | null; // For new/updated local image URI
    description?: string;
    longitude: string;
    latitude: string;
    address: string;
    // For edit mode
    existingImages?: Array<{ url: string; public_id: string; _id?: string }>; // To display existing images
    imagesToDeletePublicIds?: string[]; // Store public_ids of images marked for deletion
}

type AdminBikeFormScreenRouteProp = RouteProp<
    AdminStackParamList,
    "AdminBikeForm"
>;
type AdminBikeFormScreenNavigationProp = StackNavigationProp<
    AdminStackParamList,
    "AdminBikeForm"
>;

interface AdminBikeFormScreenProps {
    route: AdminBikeFormScreenRouteProp;
    navigation: AdminBikeFormScreenNavigationProp;
}

const AdminBikeFormScreen: React.FC<AdminBikeFormScreenProps> = ({
    route,
    navigation,
}) => {
    const bikeId = route.params?.bikeId;
    const isEditMode = !!bikeId;

    const dispatch = useDispatch<AppDispatch>();
    // Selector to get existing bike details if in edit mode
    const existingBikeDetailsFromStore = useSelector((state: RootState) => state.adminBikes.bikeDetails);


    const initialFormState: AdminBikeFormState = {
        bikeName: "",
        model: "",
        category: "",
        hourlyPrice: "",
        dailyPrice: "",
        availability: true,
        helmetAvailable: false,
        quantity: "1",
        bikeImageUri: null,
        description: "",
        longitude: "",
        latitude: "",
        address: "",
        existingImages: [],
        imagesToDeletePublicIds: []
    };

    const [formData, setFormData] =
        useState<AdminBikeFormState>(initialFormState);
    const [isLoading, setIsLoading] = useState(false); // For initial load in edit mode
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);


    useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditMode ? "Edit Bike Details" : "Add New Bike",
        });
    }, [navigation, isEditMode]);

    // Effect to populate form if in edit mode and bikeId is provided
    useEffect(() => {
        if (isEditMode && bikeId) {
            // TODO: Dispatch an action to fetch bike details by ID if not already in store
            // For example: dispatch(fetchAdminBikeById(bikeId));
            // For now, we'll assume existingBikeDetailsFromStore might be populated
            // by selecting a bike from AdminManageBikesScreen that sets it.
            // If existingBikeDetailsFromStore is null, it means we need to fetch it.
            // This part needs a robust way to get details for the bikeId.
            // Let's simulate fetching or using a pre-loaded detail for now.

            const bikeToEdit = existingBikeDetailsFromStore; // This should be populated before navigating here or fetched

            if (bikeToEdit && bikeToEdit._id === bikeId) {
                setFormData({
                    bikeName: bikeToEdit.model, // Assuming backend model is bikeName in form
                    model: bikeToEdit.description?.split(' ')[0] || "", // Simplified model extraction
                    category: bikeToEdit.category as BikeType,
                    hourlyPrice: String(bikeToEdit.pricePerHour),
                    dailyPrice: String(bikeToEdit.pricePerDay),
                    availability: bikeToEdit.availability,
                    helmetAvailable: (bikeToEdit as any).helmetAvailable || false, // Assuming this field might exist
                    quantity: String((bikeToEdit as any).quantity || 1), // Assuming this field might exist
                    bikeImageUri: null, // Don't prefill with URL for local URI state
                    description: bikeToEdit.description || "",
                    longitude: String(bikeToEdit.location.coordinates[0]),
                    latitude: String(bikeToEdit.location.coordinates[1]),
                    address: bikeToEdit.location.address || "",
                    existingImages: bikeToEdit.images || [],
                    imagesToDeletePublicIds: [],
                });
            } else if (bikeId) {
                 // If details not in store, ideally dispatch a fetch action
                console.warn(`Bike details for ${bikeId} not found in store. Implement fetch by ID.`);
                // As a fallback for the example:
                // fetchBikeDetailsForAdminAPI(bikeId).then(fetchedBike => { // Using your dummy fetch
                //     if (fetchedBike) setFormData(prev => ({...prev, ...fetchedBike, hourlyPrice: String(fetchedBike.hourlyPrice || ""), dailyPrice: String(fetchedBike.dailyPrice || ""), quantity: String(fetchedBike.quantity || "1")}));
                // });
            }
        }
    }, [isEditMode, bikeId, existingBikeDetailsFromStore]);


    const handleInputChange = (field: keyof AdminBikeFormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePriceChange = (
        field: "hourlyPrice" | "dailyPrice",
        text: string
    ) => {
        const numericValue = text.replace(/[^0-9.]/g, "");
        handleInputChange(field, numericValue);
    };

    const handlePickImage = async () => {
        const permissionResult =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "Media library access is needed.");
            return;
        }
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
            handleInputChange("bikeImageUri", pickerResult.assets[0].uri);
            // If you allow multiple new images, manage an array of URIs
        }
    };
    const handleRemoveExistingImage = (publicIdToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            existingImages: prev.existingImages?.filter(img => img.public_id !== publicIdToRemove),
            imagesToDeletePublicIds: [...(prev.imagesToDeletePublicIds || []), publicIdToRemove]
        }));
    };

    const handleDetectLocation = async () => {
        setIsDetectingLocation(true);
        Alert.alert("Detect Location", "Location auto-detection would be implemented here using expo-location and a geocoding service. For now, using placeholder data.");
        setTimeout(() => {
            handleInputChange("latitude", "12.9716");
            handleInputChange("longitude", "77.5946");
            handleInputChange("address", "Simulated Address from Detect, Bangalore");
            setIsDetectingLocation(false);
        }, 1500);
    };

    const handleResetFields = () => {
        Alert.alert("Reset Fields", "Are you sure you want to clear all fields?",
            [{ text: "Cancel", style: "cancel" },
             {
                text: "Reset",
                style: "destructive",
                onPress: () => {
                    setFormData(initialFormState);
                    // If in edit mode, you might want to reset to original fetched details instead of blank
                    // if (isEditMode && existingBikeDetailsFromStore) {
                    //     // Re-populate with existingBikeDetailsFromStore logic
                    // }
                }
            },
            ]
        );
    };

    const handleSubmit = async () => {
        if (
            !formData.bikeName.trim() ||
            !formData.category ||
            !formData.address.trim() ||
            !formData.hourlyPrice.trim() ||
            !formData.dailyPrice.trim() ||
            !formData.quantity.trim() ||
            !formData.longitude.trim() ||
            !formData.latitude.trim()
        ) {
            Alert.alert("Validation Error", "Please fill in all required fields marked with *.");
            return;
        }
        if (!isEditMode && !formData.bikeImageUri) {
            Alert.alert("Validation Error", "Please upload at least one bike image.");
            return;
        }


        setIsSubmitting(true);
        const submissionFormData = new FormData();
        submissionFormData.append("model", formData.bikeName); // Backend 'model' matches this
        submissionFormData.append("category", formData.category);
        submissionFormData.append("pricePerHour", formData.hourlyPrice);
        submissionFormData.append("pricePerDay", formData.dailyPrice);
        submissionFormData.append("longitude", formData.longitude);
        submissionFormData.append("latitude", formData.latitude);
        submissionFormData.append("address", formData.address);
        submissionFormData.append("availability", String(formData.availability));
        if (formData.description) {
            submissionFormData.append("description", formData.description);
        }
        submissionFormData.append("helmetAvailable", String(formData.helmetAvailable));
        submissionFormData.append("quantity", formData.quantity);

        // Handle new image if one was picked
        if (formData.bikeImageUri && formData.bikeImageUri.startsWith("file://")) {
            const uriParts = formData.bikeImageUri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            submissionFormData.append('bikeImages', { // For add mode, backend expects 'bikeImages'
                uri: formData.bikeImageUri,
                name: `photo_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            } as any);
        }

        // For edit mode, handle new images and images to delete
        if (isEditMode) {
            if (formData.bikeImageUri && formData.bikeImageUri.startsWith("file://")) {
                // If a new image is selected in edit mode, it's sent as 'newBikeImages'
                 const uriParts = formData.bikeImageUri.split('.');
                 const fileType = uriParts[uriParts.length - 1];
                 submissionFormData.append('newBikeImages', {
                    uri: formData.bikeImageUri,
                    name: `new_photo_${Date.now()}.${fileType}`,
                    type: `image/${fileType}`,
                } as any);
            }
            if (formData.imagesToDeletePublicIds && formData.imagesToDeletePublicIds.length > 0) {
                submissionFormData.append('imagesToDeletePublicIds', JSON.stringify(formData.imagesToDeletePublicIds));
            }
        }


        let resultAction;
        try {
            if (isEditMode && bikeId) {
                resultAction = await dispatch(updateAdminBike({ bikeId, bikeFormData: submissionFormData })).unwrap();
            } else {
                resultAction = await dispatch(addAdminBike(submissionFormData)).unwrap();
            }
            // resultAction here is the fulfilled payload (the bike object)
            Alert.alert(
                "Success",
                `Bike ${isEditMode ? "updated" : "added"} successfully.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            // The error here is what's returned by rejectWithValue
            console.error("Submit error:", error);
            Alert.alert("Error", error || `Failed to ${isEditMode ? "update" : "add"} bike.`);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading && isEditMode) { // Show loading only for edit mode initial fetch
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text>Loading bike details...</Text>
            </View>
        );
    }

    const bikeCategoryOptions: { label: string, value: BikeType }[] = [
        { label: "Select Bike Category*", value: "" },
        { label: "Road", value: "Road" },
        { label: "Mountain", value: "Mountain" },
        { label: "Hybrid", value: "Hybrid" },
        { label: "Electric", value: "Electric" },
        { label: "Scooter", value: "Scooter" },
        { label: "Cruiser", value: "Cruiser" },
        { label: "Motorcycle", value: "Motorcycle" },
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContentContainer}
                keyboardShouldPersistTaps="handled">

                <Text style={styles.sectionHeader}>Bike Images</Text>
                {/* Display Existing Images for Edit Mode */}
                {isEditMode && formData.existingImages && formData.existingImages.length > 0 && (
                    <View style={styles.existingImagesContainer}>
                        {formData.existingImages.map((img, index) => (
                            <View key={img.public_id || index} style={styles.existingImageWrapper}>
                                <Image source={{ uri: img.url }} style={styles.existingImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => img.public_id && handleRemoveExistingImage(img.public_id)}>
                                    <Text style={styles.removeImageButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.imageUploadBox, formData.bikeImageUri && styles.imageUploadBoxSmall]}
                    onPress={handlePickImage}>
                    {formData.bikeImageUri ? (
                        <Image
                            source={{ uri: formData.bikeImageUri }}
                            style={styles.bikePreviewImage}
                        />
                    ) : (
                        <>
                            <Text style={styles.uploadIconPlaceholder}>📷</Text>
                            <Text style={styles.uploadLabel}>
                                {isEditMode ? "Upload New/Replacement Photo" : "Upload Bike Photo*"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
                {isEditMode && formData.bikeImageUri && (
                     <TouchableOpacity onPress={() => handleInputChange("bikeImageUri", null)}>
                        <Text style={styles.clearNewImageText}>Clear new image</Text>
                    </TouchableOpacity>
                )}


                <Text style={styles.sectionHeader}>Bike Details</Text>
                <StyledTextInput
                    label="Bike Name/Brand*"
                    value={formData.bikeName}
                    onChangeText={(t) => handleInputChange("bikeName", t)}
                    placeholder="e.g., Bajaj Pulsar, Honda Activa"
                    containerStyle={styles.inputGroup}
                />
                <StyledTextInput
                    label="Specific Model/Variant*"
                    value={formData.model}
                    onChangeText={(t) => handleInputChange("model", t)}
                    placeholder="e.g., 150, 6G, BS6, ABS"
                    containerStyle={styles.inputGroup}
                />

                <Text style={styles.pickerLabel}>Category*</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={formData.category}
                        onValueChange={(itemValue) =>
                            handleInputChange("category", itemValue as BikeType)
                        }
                        style={styles.picker}
                        prompt="Select Bike Category">
                        {bikeCategoryOptions.map(opt => (
                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                        ))}
                    </Picker>
                </View>


                <View style={styles.priceRow}>
                    <StyledTextInput
                        label="Hourly Price (₹)*"
                        value={formData.hourlyPrice}
                        onChangeText={(t) => handlePriceChange("hourlyPrice", t)}
                        placeholder="e.g., 50"
                        keyboardType="numeric"
                        containerStyle={styles.priceInput}
                    />
                    <StyledTextInput
                        label="Daily Price (₹)*"
                        value={formData.dailyPrice}
                        onChangeText={(t) => handlePriceChange("dailyPrice", t)}
                        placeholder="e.g., 300"
                        keyboardType="numeric"
                        containerStyle={styles.priceInput}
                    />
                </View>

                <Text style={styles.sectionHeader}>Location & Availability</Text>
                <StyledTextInput
                    label="Full Address*"
                    value={formData.address}
                    onChangeText={(t) => handleInputChange("address", t)}
                    placeholder="e.g., 123 Bike St, Near Landmark, City"
                    containerStyle={styles.inputGroup}
                    multiline
                    numberOfLines={3}
                />
                <View style={styles.priceRow}>
                    <StyledTextInput
                        label="Longitude*"
                        value={formData.longitude}
                        onChangeText={(t) => handleInputChange("longitude", t.replace(/[^0-9.-]/g, ""))}
                        placeholder="e.g., 77.6309"
                        keyboardType="numeric"
                        containerStyle={styles.priceInput}
                    />
                    <StyledTextInput
                        label="Latitude*"
                        value={formData.latitude}
                        onChangeText={(t) => handleInputChange("latitude", t.replace(/[^0-9.-]/g, ""))}
                        placeholder="e.g., 12.9352"
                        keyboardType="numeric"
                        containerStyle={styles.priceInput}
                    />
                </View>
                <TouchableOpacity style={styles.detectLocationButton} onPress={handleDetectLocation} disabled={isDetectingLocation}>
                    <Text style={styles.detectLocationButtonText}>
                        {isDetectingLocation ? "Detecting..." : "📍 Auto-Detect Current Location"}
                    </Text>
                    {isDetectingLocation && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: spacing.s }} />}
                </TouchableOpacity>


                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Available for Rent</Text>
                    <Switch
                        trackColor={{ false: colors.greyLighter, true: colors.primaryLight }}
                        thumbColor={formData.availability ? colors.primary : Platform.OS === "ios" ? colors.white : colors.greyMedium}
                        ios_backgroundColor={colors.greyLighter}
                        onValueChange={(v) => handleInputChange("availability", v)}
                        value={formData.availability}
                    />
                </View>

                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Helmet Available with Bike</Text>
                    <Switch
                        trackColor={{ false: colors.greyLighter, true: colors.primaryLight }}
                        thumbColor={formData.helmetAvailable ? colors.primary : Platform.OS === "ios" ? colors.white : colors.greyMedium}
                        ios_backgroundColor={colors.greyLighter}
                        onValueChange={(v) => handleInputChange("helmetAvailable", v)}
                        value={formData.helmetAvailable}
                    />
                </View>

                <StyledTextInput
                    label="Quantity Available*"
                    value={formData.quantity}
                    onChangeText={(t) => handleInputChange("quantity", t.replace(/[^0-9]/g, ""))}
                    placeholder="e.g., 5"
                    keyboardType="number-pad"
                    containerStyle={styles.inputGroup}
                />
                <StyledTextInput
                    label="Description (Optional)"
                    value={formData.description}
                    onChangeText={(t) => handleInputChange("description", t)}
                    placeholder="e.g., Well-maintained, good for city rides..."
                    containerStyle={styles.inputGroup}
                    multiline
                    numberOfLines={4}
                />

                <PrimaryButton
                    title={
                        isSubmitting
                            ? isEditMode
                                ? "Updating Bike..."
                                : "Adding Bike..."
                            : isEditMode
                                ? "Save Changes"
                                : "Add Bike"
                    }
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.submitButton}
                />
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetFields}
                    disabled={isSubmitting}>
                    <Text style={styles.resetButtonText}>Reset Fields</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardAvoidingContainer: { flex: 1, backgroundColor: colors.white },
    container: { flex: 1 },
    scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    imageUploadBox: {
        height: 180,
        borderWidth: 2,
        borderColor: colors.borderDefault || "#D0D0D0",
        borderStyle: "dashed",
        borderRadius: borderRadius.l,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.backgroundLight || "#F7F9FC",
        marginBottom: spacing.s, // Reduced margin if new image is shown below
        overflow: "hidden",
    },
    imageUploadBoxSmall: { // Style when a new image is picked, for the "Upload New" box
        height: 100,
        marginBottom: spacing.s,
    },
    bikePreviewImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    existingImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.m,
    },
    existingImageWrapper: {
        position: 'relative',
        marginRight: spacing.s,
        marginBottom: spacing.s,
    },
    existingImage: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.m,
        backgroundColor: colors.greyLighter,
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: colors.error,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    removeImageButtonText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    clearNewImageText: {
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.m,
        textDecorationLine: 'underline'
    },
    uploadIconPlaceholder: {
        fontSize: 40, // Adjusted size
        color: colors.textMedium,
    },
    uploadLabel: {
        fontSize: typography.fontSizes.m,
        color: colors.textMedium,
        marginTop: spacing.s,
    },
    inputGroup: {
        marginBottom: spacing.m,
    },
    priceRow: {
        flexDirection: "row",
        // justifyContent: "space-between", // Let flex:1 handle spacing
        marginBottom: spacing.m,
    },
    priceInput: {
        flex: 1,
        // Add marginHorizontal if you want space between them
    },
    pickerLabel: {
        fontSize: typography.fontSizes.s,
        color: colors.textSecondary, // Consistent with StyledTextInput label
        marginBottom: spacing.xs,
        // marginLeft: spacing.xxs, // If StyledTextInput label has this
    },
    pickerContainer: {
        backgroundColor: colors.backgroundLight || "#F0F0F0",
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.borderDefault || "#DDD",
        marginBottom: spacing.m,
        height: 50, // Match StyledTextInput height for consistency
        justifyContent: 'center', // Vertically center picker content
    },
    picker: {
        width: "100%",
        height: "100%", // Make picker fill container
        color: colors.textPrimary,
    },
    sectionHeader: {
        fontSize: typography.fontSizes.l,
        fontWeight: typography.fontWeights.semiBold,
        color: colors.textPrimary,
        marginTop: spacing.l,
        marginBottom: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.borderDefault,
        paddingTop: spacing.m,
    },
    detectLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        paddingVertical: spacing.m,
        borderRadius: borderRadius.m,
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.primary
    },
    detectLocationButtonText: {
        color: colors.primaryDark || colors.primary,
        fontSize: typography.fontSizes.m,
        fontWeight: typography.fontWeights.medium,
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.s, // Reduced padding for a tighter look
        marginBottom: spacing.m,
        backgroundColor: colors.backgroundLight || "#F0F0F0",
        paddingHorizontal: spacing.m,
        borderRadius: borderRadius.m,
        borderWidth: 1,
        borderColor: colors.borderDefault || "#DDD",
        height: 50, // Match input height
    },
    toggleLabel: {
        fontSize: typography.fontSizes.m,
        color: colors.textPrimary,
        fontWeight: typography.fontWeights.medium,
    },
    submitButton: {
        marginTop: spacing.l,
        backgroundColor: colors.success || "green",
    },
    resetButton: {
        marginTop: spacing.m,
        paddingVertical: spacing.m,
        alignItems: "center",
        borderRadius: borderRadius.m,
        borderWidth: 1.5,
        borderColor: colors.textMedium,
    },
    resetButtonText: {
        fontSize: typography.fontSizes.m,
        color: colors.textMedium,
        fontWeight: typography.fontWeights.semiBold,
    },
});

export default AdminBikeFormScreen;