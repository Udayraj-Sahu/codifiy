// src/screens/Admin/AdminBikeFormScreen.tsx
import { Picker } from "@react-native-picker/picker";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location"; // Import expo-location
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../components/common/PrimaryButton";
import StyledTextInput from "../../components/common/StyledTextInput";
import { AdminStackParamList } from "../../navigation/types";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

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
	bikeName: string;
	model: string;
	category: BikeType;
	hourlyPrice: string;
	dailyPrice: string;
	availability: boolean;
	helmetAvailable: boolean;
	quantity: string;
	bikeImageUri: string | null;
	description?: string;
	longitude: string;
	latitude: string;
	address: string;
	existingImages?: Array<{ url: string; public_id: string; _id?: string }>;
	imagesToDeletePublicIds?: string[];
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
	const existingBikeDetailsFromStore = useSelector(
		(state: RootState) =>
			state.adminBikes.bikes.find((b) => b._id === bikeId) ||
			state.adminBikes.bikeDetails
	);

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
		imagesToDeletePublicIds: [],
	};

	const [formData, setFormData] =
		useState<AdminBikeFormState>(initialFormState);
	const [isLoadingInitialData, setIsLoadingInitialData] =
		useState(isEditMode);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDetectingLocation, setIsDetectingLocation] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null); // For location errors

	const bikeImagePlaceholder =
		"https://placehold.co/600x400/1A1A1A/F5F5F5?text=Bike+Photo";

	useLayoutEffect(() => {
		navigation.setOptions({
			title: isEditMode ? "Edit Bike Details" : "Add New Bike",
		});
	}, [navigation, isEditMode]);

	useEffect(() => {
		if (isEditMode && bikeId) {
			const bikeToEdit = existingBikeDetailsFromStore;
			if (bikeToEdit && bikeToEdit._id === bikeId) {
				setFormData({
					bikeName: bikeToEdit.model || "",
					model: bikeToEdit.version || "",
					category: (bikeToEdit.category as BikeType) || "",
					hourlyPrice: String(bikeToEdit.pricePerHour || ""),
					dailyPrice: String(bikeToEdit.pricePerDay || ""),
					availability:
						bikeToEdit.isAvailable !== undefined
							? bikeToEdit.isAvailable
							: true,
					helmetAvailable: bikeToEdit.helmetAvailable || false,
					quantity: String(bikeToEdit.quantity || "1"),
					bikeImageUri: null,
					description: bikeToEdit.description || "",
					longitude: String(
						bikeToEdit.location?.coordinates?.[0] || ""
					),
					latitude: String(
						bikeToEdit.location?.coordinates?.[1] || ""
					),
					address: bikeToEdit.location?.address || "",
					existingImages: bikeToEdit.images || [],
					imagesToDeletePublicIds: [],
				});
				setIsLoadingInitialData(false);
			} else if (bikeId && !isLoadingInitialData) {
				console.warn(
					`Bike details for ${bikeId} not found in store. Implement fetch by ID.`
				);
				// TODO: dispatch(fetchAdminBikeByIdThunk(bikeId));
			}
		} else {
			setIsLoadingInitialData(false);
		}
	}, [isEditMode, bikeId, existingBikeDetailsFromStore, dispatch]);

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
			Alert.alert(
				"Permission Required",
				"Media library access is needed."
			);
			return;
		}
		const pickerResult = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});
		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			handleInputChange("bikeImageUri", pickerResult.assets[0].uri);
		}
	};
	const handleRemoveExistingImage = (publicIdToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			existingImages: prev.existingImages?.filter(
				(img) => img.public_id !== publicIdToRemove
			),
			imagesToDeletePublicIds: [
				...(prev.imagesToDeletePublicIds || []),
				publicIdToRemove,
			],
		}));
	};

	const handleDetectLocation = async () => {
		setLocationError(null); // Clear previous errors
		setIsDetectingLocation(true);
		let { status } = await Location.requestForegroundPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission Denied",
				"Location permission is needed to auto-detect address."
			);
			setLocationError("Permission to access location was denied.");
			setIsDetectingLocation(false);
			return;
		}

		try {
			let location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			const { latitude, longitude } = location.coords;
			handleInputChange("latitude", String(latitude));
			handleInputChange("longitude", String(longitude));

			let addressResponse = await Location.reverseGeocodeAsync({
				latitude,
				longitude,
			});
			if (addressResponse && addressResponse.length > 0) {
				const addr = addressResponse[0];
				const formattedAddress = [
					addr.streetNumber,
					addr.street,
					addr.subregion,
					addr.city,
					addr.region,
					addr.postalCode,
					addr.country,
				]
					.filter(Boolean)
					.join(", ");
				handleInputChange(
					"address",
					formattedAddress || "Address not found"
				);
			} else {
				handleInputChange("address", "Could not determine address");
				setLocationError(
					"Could not determine address from coordinates."
				);
			}
		} catch (error: any) {
			console.error("Error detecting location:", error);
			Alert.alert(
				"Location Error",
				error.message ||
					"Could not fetch location. Please enter manually."
			);
			setLocationError(error.message || "Failed to get location.");
		} finally {
			setIsDetectingLocation(false);
		}
	};

	const handleResetFields = () => {
		/* ... (same as before, check if initialData needs reset based on authUser logic) ... */
	};
	const handleSubmit = async () => {
		/* ... (same as before, uses formData) ... */
	};

	if (isLoadingInitialData && isEditMode) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading bike details...</Text>
			</View>
		);
	}

	const bikeCategoryOptions: { label: string; value: BikeType }[] = [
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
				{isEditMode &&
					formData.existingImages &&
					formData.existingImages.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.existingImagesContainer}>
							{formData.existingImages.map((img) => (
								<View
									key={img.public_id || img.url}
									style={styles.existingImageWrapper}>
									<Image
										source={{ uri: img.url }}
										style={styles.existingImage}
									/>
									<TouchableOpacity
										style={styles.removeImageButton}
										onPress={() =>
											img.public_id &&
											handleRemoveExistingImage(
												img.public_id
											)
										}>
										<MaterialIcons
											name="delete-forever"
											size={16}
											color={colors.white}
										/>
									</TouchableOpacity>
								</View>
							))}
						</ScrollView>
					)}
				<TouchableOpacity
					style={[
						styles.imageUploadBox,
						formData.bikeImageUri && styles.imageUploadBoxSmall,
					]}
					onPress={handlePickImage}>
					{formData.bikeImageUri ? (
						<Image
							source={{ uri: formData.bikeImageUri }}
							style={styles.bikePreviewImage}
						/>
					) : (
						<>
							<MaterialIcons
								name="add-a-photo"
								size={40}
								color={colors.iconDefault}
							/>
							<Text style={styles.uploadLabel}>
								{isEditMode
									? "Upload New/Replace Main"
									: "Upload Main Bike Photo*"}
							</Text>
						</>
					)}
				</TouchableOpacity>
				{isEditMode && formData.bikeImageUri && (
					<TouchableOpacity
						onPress={() => handleInputChange("bikeImageUri", null)}
						style={styles.clearNewImageButton}>
						<Text style={styles.clearNewImageText}>
							Clear New Image Selection
						</Text>
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
						itemStyle={
							Platform.OS === "ios" ? styles.pickerItemIOS : {}
						}
						dropdownIconColor={colors.iconDefault}
						prompt="Select Bike Category">
						{bikeCategoryOptions.map((opt) => (
							<Picker.Item
								key={opt.value}
								label={opt.label}
								value={opt.value}
							/>
						))}
					</Picker>
				</View>

				<View style={styles.priceRow}>
					<StyledTextInput
						label="Hourly Price (₹)*"
						value={formData.hourlyPrice}
						onChangeText={(t) =>
							handlePriceChange("hourlyPrice", t)
						}
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

				<Text style={styles.sectionHeader}>
					Location & Availability
				</Text>
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
						onChangeText={(t) =>
							handleInputChange(
								"longitude",
								t.replace(/[^0-9.-]/g, "")
							)
						}
						placeholder="e.g., 77.6309"
						keyboardType="numeric"
						containerStyle={styles.priceInput}
					/>
					<StyledTextInput
						label="Latitude*"
						value={formData.latitude}
						onChangeText={(t) =>
							handleInputChange(
								"latitude",
								t.replace(/[^0-9.-]/g, "")
							)
						}
						placeholder="e.g., 12.9352"
						keyboardType="numeric"
						containerStyle={styles.priceInput}
					/>
				</View>
				<TouchableOpacity
					style={styles.detectLocationButton}
					onPress={handleDetectLocation}
					disabled={isDetectingLocation}>
					<MaterialIcons
						name="my-location"
						size={18}
						color={colors.primary}
						style={{ marginRight: spacing.s }}
					/>
					<Text style={styles.detectLocationButtonText}>
						{isDetectingLocation
							? "Detecting..."
							: "Auto-Detect Current Location"}
					</Text>
					{isDetectingLocation && (
						<ActivityIndicator
							size="small"
							color={colors.primary}
							style={{ marginLeft: spacing.s }}
						/>
					)}
				</TouchableOpacity>
				{locationError && (
					<Text style={styles.errorTextSmall}>{locationError}</Text>
				)}

				<View style={styles.toggleRow}>
					<Text style={styles.toggleLabel}>Available for Rent</Text>
					<Switch
						trackColor={{
							false: colors.borderDefault,
							true: colors.primaryMuted,
						}}
						thumbColor={
							formData.availability
								? colors.primary
								: colors.textDisabled
						}
						ios_backgroundColor={colors.borderDefault}
						onValueChange={(v) =>
							handleInputChange("availability", v)
						}
						value={formData.availability}
					/>
				</View>
				<View style={styles.toggleRow}>
					<Text style={styles.toggleLabel}>
						Helmet Available with Bike
					</Text>
					<Switch
						trackColor={{
							false: colors.borderDefault,
							true: colors.primaryMuted,
						}}
						thumbColor={
							formData.helmetAvailable
								? colors.primary
								: colors.textDisabled
						}
						ios_backgroundColor={colors.borderDefault}
						onValueChange={(v) =>
							handleInputChange("helmetAvailable", v)
						}
						value={formData.helmetAvailable}
					/>
				</View>

				<StyledTextInput
					label="Quantity Available*"
					value={formData.quantity}
					onChangeText={(t) =>
						handleInputChange("quantity", t.replace(/[^0-9]/g, ""))
					}
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
							: "Add Bike to Fleet"
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
					<MaterialIcons
						name="refresh"
						size={20}
						color={colors.textSecondary}
						style={{ marginRight: spacing.s }}
					/>
					<Text style={styles.resetButtonText}>Reset Fields</Text>
				</TouchableOpacity>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	keyboardAvoidingContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	container: {
		flex: 1,
	},
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain,
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary,
		fontFamily: typography.primaryRegular,
	},
	sectionHeader: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginTop: spacing.l,
		marginBottom: spacing.m,
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.m,
	},
	imageUploadBox: {
		height: 180,
		borderWidth: 2,
		borderColor: colors.borderDefault,
		borderStyle: "dashed",
		borderRadius: borderRadius.l,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundCard,
		marginBottom: spacing.s,
		overflow: "hidden",
	},
	imageUploadBoxSmall: {
		height: 100,
		marginBottom: spacing.s,
	},
	bikePreviewImage: {
		width: "100%",
		height: "100%",
		resizeMode: "contain",
	},
	existingImagesContainer: {
		flexDirection: "row",
		marginBottom: spacing.m,
	},
	existingImageWrapper: {
		position: "relative",
		marginRight: spacing.s,
	},
	existingImage: {
		width: 80,
		height: 80,
		borderRadius: borderRadius.m,
		backgroundColor: colors.borderDefault,
	},
	removeImageButton: {
		position: "absolute",
		top: -spacing.xs,
		right: -spacing.xs,
		backgroundColor: colors.error,
		borderRadius: borderRadius.circle,
		width: 24,
		height: 24,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1,
	},
	clearNewImageButton: {
		alignSelf: "center",
		marginBottom: spacing.m,
		paddingVertical: spacing.xs, // Make touch area slightly bigger
	},
	clearNewImageText: {
		color: colors.textLink,
		fontFamily: typography.primaryMedium,
		textDecorationLine: "underline",
		fontSize: typography.fontSizes.s,
	},
	uploadLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginTop: spacing.s,
		textAlign: "center",
	},
	inputGroup: {
		marginBottom: spacing.l,
	},
	priceRow: {
		flexDirection: "row",
		marginBottom: spacing.l,
		gap: spacing.m, // Use gap for spacing between price inputs
	},
	priceInput: {
		flex: 1,
		// marginRight (or marginLeft) removed due to gap
	},
	pickerLabel: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	pickerContainer: {
		backgroundColor: colors.backgroundInput,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		marginBottom: spacing.l,
		height: Platform.OS === "ios" ? undefined : 50, // Only for Android if Picker is child
		justifyContent: "center", // For Android
	},
	picker: {
		width: "100%",
		color: colors.textPrimary,
		height: Platform.OS === "ios" ? 180 : 50, // iOS needs explicit height for wheel
	},
	pickerItemIOS: {
		color: colors.textPrimary, // For iOS picker items
		// backgroundColor: colors.backgroundCard, // Not usually needed, system handles
	},
	detectLocationButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.backgroundCardOffset,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
		borderWidth: 1,
		borderColor: colors.primary,
	},
	detectLocationButtonText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
	},
	errorTextSmall: {
		// For location error
		color: colors.textError,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		textAlign: "center",
		marginTop: -spacing.s, // Pull up below detect button
		marginBottom: spacing.m,
	},
	toggleRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.s,
		marginBottom: spacing.m,
		backgroundColor: colors.backgroundInput,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		height: 50,
	},
	toggleLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary,
	},
	submitButton: {
		marginTop: spacing.l,
		// PrimaryButton handles its own theming
	},
	resetButton: {
		flexDirection: "row", // For icon + text
		marginTop: spacing.m,
		paddingVertical: spacing.m,
		alignItems: "center",
		justifyContent: "center", // Center icon and text
		borderRadius: borderRadius.m,
		borderWidth: 1.5,
		borderColor: colors.textSecondary,
	},
	resetButtonText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
		color: colors.textSecondary,
	},
});

export default AdminBikeFormScreen;
