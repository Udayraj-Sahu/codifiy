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
import PrimaryButton from "../../components/common/PrimaryButton";
import StyledTextInput from "../../components/common/StyledTextInput";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import { Picker } from '@react-native-picker/picker'; // For a native picker experience

// --- Types (redefined inline for clarity based on new prompt) ---
type BikeType =
	| "Road"
	| "Mountain"
	| "Hybrid"
	| "Electric"
	| "Scooter"
	| "Cruiser"
	| "";
type BikeStatus = "Available" | "Unavailable" | "Maintenance" | "";
type BikeLocation =
	| "Koramangala"
	| "Indiranagar"
	| "Whitefield"
	| "HSR Layout"
	| "";

interface AdminBikeFormState {
	bikeName: string;
	model: string;
	category: BikeType;
	hourlyPrice: string;
	dailyPrice: string;
	location: BikeLocation;
	initialStatus: BikeStatus;
	helmetAvailable: boolean;
	quantity: string;
	bikeImageUri: string | null;
}


// --- Dummy Data/Service (Updated for new form fields) ---
const fetchBikeDetailsForAdminAPI = async (
	bikeId: string
): Promise<Partial<AdminBikeFormState> | null> => {
	// Simulate fetching data for an existing bike if in edit mode
	const DUMMY_BIKE_TO_EDIT: AdminBikeFormState = {
		bikeName: "Bajaj Pulsar 150",
		model: "BS6",
		category: "Motorcycle", // Add Motorcycle to BikeType if needed
		hourlyPrice: "50.00",
		dailyPrice: "300.00",
		location: "Koramangala",
		initialStatus: "Available",
		helmetAvailable: true,
		quantity: "3",
		bikeImageUri:
			"https://via.placeholder.com/300x200.png?text=Pulsar+Edit",
	};
	return new Promise((resolve) => {
		setTimeout(() => {
			if (bikeId === "bike001_edit_example") {
				// Replace with actual ID check
				resolve(DUMMY_BIKE_TO_EDIT);
			} else {
				resolve(null);
			}
		}, 300);
	});
};

const saveBikeAPI = async (
	bikeId: string | undefined,
	data: AdminBikeFormState
): Promise<{ success: boolean; message?: string; bikeId?: string }> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			const submissionData = {
				...data,
				// Convert prices and quantity to numbers if your backend expects that
				hourlyPriceNum:
					parseFloat(data.hourlyPrice.replace("$", "")) || 0,
				dailyPriceNum:
					parseFloat(data.dailyPrice.replace("$", "")) || 0,
				quantityNum: parseInt(data.quantity, 10) || 0,
			};
			if (bikeId) {
				console.log(`UPDATING bike ${bikeId}:`, submissionData);
			} else {
				const newBikeId = `bike${Date.now()}`;
				console.log(`ADDING new bike ${newBikeId}:`, submissionData);
				bikeId = newBikeId;
			}
			resolve({
				success: true,
				message: `Bike ${bikeId ? "updated" : "added"} successfully.`,
				bikeId,
			});
		}, 1000);
	});
};
// --- End Dummy Data/Service ---

// --- Simple Picker Placeholder (as used before) ---
interface PickerItem {
	label: string;
	value: string;
}
interface SimplePickerProps {
	selectedValue: string;
	onValueChange: (itemValue: string) => void;
	items: PickerItem[];
	prompt?: string;
	style?: object;
	iconPlaceholder?: string;
}
const SimplePicker: React.FC<SimplePickerProps> = ({
	selectedValue,
	onValueChange,
	items,
	prompt,
	style,
	iconPlaceholder,
}) => (
	<View style={[styles.pickerOuterContainer, style]}>
		{prompt && <Text style={styles.pickerPromptText}>{prompt}</Text>}
		<TouchableOpacity
			style={styles.pickerTouchable}
			onPress={() =>
				Alert.alert(
					"Picker",
					"Use @react-native-picker/picker or custom modal."
				)
			}>
			{iconPlaceholder && (
				<Text style={styles.pickerIcon}>{iconPlaceholder}</Text>
			)}
			<Text style={styles.pickerValueText}>
				{items.find((i) => i.value === selectedValue)?.label ||
					`Select ${prompt?.toLowerCase()}`}
			</Text>
			<Text style={styles.pickerArrow}>▼</Text>
		</TouchableOpacity>
		{/* Actual <Picker> would be used or a modal would open from onPress */}
	</View>
);
// --- End Picker Placeholder ---

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

	const initialFormState: AdminBikeFormState = {
		bikeName: "",
		model: "",
		type: "",
		hourlyPrice: "0.00",
		dailyPrice: "0.00",
		location: "",
		initialStatus: "",
		helmetAvailable: false,
		quantity: "1",
		bikeImageUri: null,
	};

	const [formData, setFormData] =
		useState<AdminBikeFormState>(initialFormState);
	const [isLoading, setIsLoading] = useState(isEditMode);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: isEditMode ? "Edit Bike Details" : "Add New Bike",
		});
	}, [navigation, isEditMode]);

	useEffect(() => {
		if (isEditMode && bikeId) {
			const loadBikeData = async () => {
				setIsLoading(true);
				const fetchedBike = await fetchBikeDetailsForAdminAPI(bikeId);
				if (fetchedBike) {
					// Ensure all fields in AdminBikeFormState are covered by fetchedBike or defaults
					setFormData((prev) => ({ ...prev, ...fetchedBike }));
				} else {
					Alert.alert("Error", "Bike details not found.", [
						{ text: "OK", onPress: () => navigation.goBack() },
					]);
				}
				setIsLoading(false);
			};
			loadBikeData();
		}
	}, [bikeId, isEditMode, navigation]);

	const handleInputChange = (field: keyof AdminBikeFormState, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handlePriceChange = (
		field: "hourlyPrice" | "dailyPrice",
		text: string
	) => {
		// Allow only numbers and one decimal point, ensure $ is at the start
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

	const handleResetFields = () => {
		Alert.alert(
			"Reset Fields",
			"Are you sure you want to clear all fields?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Reset",
					style: "destructive",
					onPress: () => setFormData(initialFormState),
				},
			]
		);
	};

	const handleSubmit = async () => {
		// Basic Validation
		if (
			!formData.bikeName.trim() ||
			!formData.model.trim() ||
			!formData.category ||
			!formData.location ||
			!formData.initialStatus ||
			!formData.hourlyPrice.trim() ||
			!formData.dailyPrice.trim() ||
			!formData.quantity.trim()
		) {
			Alert.alert(
				"Validation Error",
				"Please fill in all required fields marked with *."
			);
			return;
		}
		// Further specific validations (e.g., price > 0) can be added

		setIsSubmitting(true);
		// TODO: If bikeImageUri is a local file URI and it changed, upload it first
		const result = await saveBikeAPI(bikeId, formData);
		setIsSubmitting(false);

		if (result.success) {
			Alert.alert(
				"Success",
				result.message || `Bike ${isEditMode ? "updated" : "added"}.`,
				[{ text: "OK", onPress: () => navigation.goBack() }]
			);
		} else {
			Alert.alert(
				"Error",
				result.message || "Failed to save bike details."
			);
		}
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text>Loading...</Text>
			</View>
		);
	}

	const bikeTypeOptions: PickerItem[] = [
		{ label: "Select bike type", value: "" },
		{ label: "Road", value: "Road" },
		{ label: "Mountain", value: "Mountain" },
		{ label: "Hybrid", value: "Hybrid" },
		{ label: "Electric", value: "Electric" },
		{ label: "Scooter", value: "Scooter" },
		{ label: "Cruiser", value: "Cruiser" },
	];
	const locationOptions: PickerItem[] = [
		{ label: "Select location", value: "" },
		{ label: "Koramangala", value: "Koramangala" },
		{ label: "Indiranagar", value: "Indiranagar" },
		{ label: "Whitefield", value: "Whitefield" },
		{ label: "HSR Layout", value: "HSR Layout" },
	];
	const statusOptions: PickerItem[] = [
		{ label: "Select status", value: "" },
		{ label: "Available", value: "Available" },
		{ label: "Unavailable", value: "Unavailable" },
		{ label: "Maintenance", value: "Maintenance" },
	];

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			style={styles.keyboardAvoidingContainer}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContentContainer}
				keyboardShouldPersistTaps="handled">
				{/* Image Upload Area */}
				<TouchableOpacity
					style={styles.imageUploadBox}
					onPress={handlePickImage}>
					{formData.bikeImageUri ? (
						<Image
							source={{ uri: formData.bikeImageUri }}
							style={styles.bikePreviewImage}
						/>
					) : (
						<>
							{/* <Icon name="camera-plus-outline" size={40} color={colors.textMedium} /> */}
							<Text style={styles.uploadIconPlaceholder}>📷</Text>
							<Text style={styles.uploadLabel}>Upload Photo</Text>
						</>
					)}
				</TouchableOpacity>

				{/* Input Fields */}
				<StyledTextInput
					label="Bike Name*"
					value={formData.bikeName}
					onChangeText={(t) => handleInputChange("bikeName", t)}
					placeholder="Enter bike name"
					containerStyle={styles.inputGroup}
				/>
				<StyledTextInput
					label="Model*"
					value={formData.model}
					onChangeText={(t) => handleInputChange("model", t)}
					placeholder="Enter bike model"
					containerStyle={styles.inputGroup}
				/>
				<SimplePicker
					prompt="Type*"
					selectedValue={formData.category}
					onValueChange={(v) =>
						handleInputChange("type", v as BikeType)
					}
					items={bikeTypeOptions}
					style={styles.inputGroup}
				/>

				<View style={styles.priceRow}>
					<StyledTextInput
						label="Hourly Price*"
						value={`$${formData.hourlyPrice.replace("$", "")}`}
						onChangeText={(t) =>
							handlePriceChange("hourlyPrice", t)
						}
						placeholder="$0.00"
						keyboardType="numeric"
						containerStyle={styles.priceInput}
					/>
					<StyledTextInput
						label="Daily Price*"
						value={`$${formData.dailyPrice.replace("$", "")}`}
						onChangeText={(t) => handlePriceChange("dailyPrice", t)}
						placeholder="$0.00"
						keyboardType="numeric"
						containerStyle={styles.priceInput}
					/>
				</View>

				<SimplePicker
					prompt="Location*"
					iconPlaceholder="📍"
					selectedValue={formData.location}
					onValueChange={(v) =>
						handleInputChange("location", v as BikeLocation)
					}
					items={locationOptions}
					style={styles.inputGroup}
				/>
				<SimplePicker
					prompt="Initial Status*"
					selectedValue={formData.initialStatus}
					onValueChange={(v) =>
						handleInputChange("initialStatus", v as BikeStatus)
					}
					items={statusOptions}
					style={styles.inputGroup}
				/>

				<View style={styles.toggleRow}>
					<Text style={styles.toggleLabel}>Helmet Available</Text>
					<Switch
						trackColor={{
							false: colors.greyLighter,
							true: colors.primaryLight,
						}}
						thumbColor={
							formData.helmetAvailable
								? colors.primary
								: Platform.OS === "ios"
								? colors.white
								: colors.greyMedium
						}
						ios_backgroundColor={colors.greyLighter}
						onValueChange={(v) =>
							handleInputChange("helmetAvailable", v)
						}
						value={formData.helmetAvailable}
					/>
				</View>

				<StyledTextInput
					label="Quantity*"
					value={formData.quantity}
					onChangeText={(t) =>
						handleInputChange("quantity", t.replace(/[^0-9]/g, ""))
					}
					placeholder="e.g., 5"
					keyboardType="number-pad"
					containerStyle={styles.inputGroup}
				/>

				{/* Action Buttons */}
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
		marginBottom: spacing.l,
		overflow: "hidden", // To clip the image preview
	},
	bikePreviewImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	uploadIconPlaceholder: {
		fontSize: 48, // Larger camera icon
		color: colors.textMedium,
	},
	uploadLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		marginTop: spacing.s,
	},
	inputGroup: {
		marginBottom: spacing.l,
	},
	priceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	priceInput: {
		flex: 1, // Each takes half the space
		// Add marginRight to the first one if needed
	},
	// Picker styles
	pickerOuterContainer: { marginBottom: spacing.l },
	pickerPromptText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
		marginLeft: spacing.xxs,
	},
	pickerTouchable: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#DDD",
		justifyContent: "space-between",
	},
	pickerIcon: {
		fontSize: 18,
		color: colors.textMedium,
		marginRight: spacing.s,
	},
	pickerValueText: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
	},
	pickerArrow: { fontSize: typography.fontSizes.s, color: colors.textMedium },

	toggleRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: spacing.s,
		marginBottom: spacing.l,
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		padding: spacing.m,
		borderRadius: borderRadius.m,
	},
	toggleLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	submitButton: {
		marginTop: spacing.l,
		backgroundColor: colors.success || "green", // Green "Add Bike" button
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
