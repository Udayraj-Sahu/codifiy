// src/screens/App/Profile/EditProfileScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import StyledTextInput from "../../../components/common/StyledTextInput"; // Assumed to be themed
import { ProfileStackParamList } from "../../../navigation/types";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// TODO: Import your updateUserProfileThunk and UserProfileUpdateData interface
// Example: import { updateUserProfileThunk, UserProfileUpdateData } from '../../../store/slices/authSlice'; // Or userProfileSlice
// For now, defining a placeholder for the thunk and interface
interface UserProfileUpdateData {
	fullName?: string;
	phoneNumber?: string;
	profileImageFile?: { uri: string; type: string; name: string }; // For sending file to thunk
	profileImageUrl?: string | null; // For sending existing or new URL
}
// Placeholder thunk - replace with your actual import
const updateUserProfileThunk = (data: any) => ({
	type: "USER/UPDATE_PROFILE_PLACEHOLDER",
	payload: data,
});

type EditProfileScreenNavigationProp = StackNavigationProp<
	ProfileStackParamList,
	"EditProfile"
>;
type EditProfileScreenRouteProp = RouteProp<
	ProfileStackParamList,
	"EditProfile"
>;

interface EditProfileScreenProps {
	navigation: EditProfileScreenNavigationProp;
	route: EditProfileScreenRouteProp;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const authUser = useSelector((state: RootState) => state.auth.user);
	// Assuming your authSlice has loading/error states for profile updates
	const isAuthLoading = useSelector(
		(state: RootState) => state.auth.isLoading
	); // General auth loading
	const authError = useSelector((state: RootState) => state.auth.error); // General auth error

	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState(""); // Email is usually not directly editable without verification
	const [phoneNumber, setPhoneNumber] = useState("");
	const [profileImageUri, setProfileImageUri] = useState<
		string | null | undefined
	>(undefined); // Local URI for new image, or remote URL
	const [initialData, setInitialData] =
		useState<UserProfileUpdateData | null>(null);

	const [isLoadingScreen, setIsLoadingScreen] = useState(true); // For initial data load from authUser
	const [isSubmitting, setIsSubmitting] = useState(false); // For profile update submission

	const profileImagePlaceholder =
		"https://placehold.co/150x150/1A1A1A/F5F5F5?text=No+Pic";

	useEffect(() => {
		if (authUser) {
			setFullName(authUser.fullName || "");
			setEmail(authUser.email || "");
			setPhoneNumber(authUser.phoneNumber || "");
			setProfileImageUri(authUser.profileImageUrl || null); // Use null if no image, undefined means not yet checked
			setInitialData({
				fullName: authUser.fullName || "",
				// email: authUser.email || "", // Not typically part of 'changed' check if not editable
				phoneNumber: authUser.phoneNumber || "",
				profileImageUrl: authUser.profileImageUrl || null,
			});
			setIsLoadingScreen(false);
		} else {
			// If authUser is null and not just loading, something is wrong, or user logged out.
			// This screen should ideally not be reachable if not authenticated.
			Alert.alert(
				"Error",
				"User data not found. Please try logging in again."
			);
			navigation.goBack();
		}
	}, [authUser, navigation]);

	const handleChooseProfilePicture = async () => {
		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				"Permission Required",
				"Media library access is required to select a profile picture."
			);
			return;
		}

		const pickerResult = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});

		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			setProfileImageUri(pickerResult.assets[0].uri); // Store local URI
		}
	};

	const hasChanges = useMemo(() => {
		if (!initialData) return false; // No initial data to compare against
		// Check if the new local image URI is different from the initial remote URL
		const imageChanged =
			initialData.profileImageUrl !== profileImageUri &&
			(initialData.profileImageUrl || profileImageUri); // True if one exists and they are different, or if new one is set and old was null

		return (
			initialData.fullName !== fullName ||
			initialData.phoneNumber !== phoneNumber ||
			imageChanged
		);
	}, [initialData, fullName, phoneNumber, profileImageUri]);

	const handleSaveChanges = async () => {
		if (!fullName.trim()) {
			Alert.alert("Validation Error", "Full name cannot be empty.");
			return;
		}
		// Add more validation (e.g., phone number format)

		setIsSubmitting(true);

		const updatePayload: UserProfileUpdateData = {
			fullName: fullName.trim(),
			phoneNumber: phoneNumber.trim(),
		};

		// If profileImageUri is a local file URI, prepare it for upload
		if (profileImageUri && profileImageUri.startsWith("file://")) {
			const filename =
				profileImageUri.split("/").pop() || `profile-${Date.now()}.jpg`;
			const match = /\.(\w+)$/.exec(filename);
			const type = match ? `image/${match[1]}` : `image/jpeg`;
			updatePayload.profileImageFile = {
				uri: profileImageUri,
				name: filename,
				type,
			};
			updatePayload.profileImageUrl = null; // Indicate new file upload, backend should handle this
		} else if (profileImageUri === null && initialData?.profileImageUrl) {
			// User explicitly removed the image
			updatePayload.profileImageUrl = null;
		} else if (
			profileImageUri &&
			profileImageUri !== initialData?.profileImageUrl
		) {
			// This case is tricky: if profileImageUri is a new remote URL (e.g. from a 3rd party service)
			// For now, we assume it's either a local file (handled above) or the existing URL.
			// If it's a local file, it's handled by profileImageFile.
			// If it's the *same* remote URL, no change. If it's a *different* remote URL, it's not handled by this simple setup.
		}

		try {
			// TODO: Replace placeholder with actual thunk dispatch
			// Ensure your thunk takes an object like { userId: string, data: UserProfileUpdateData, token: string }
			// const token = useSelector((state: RootState) => state.auth.token); // Get token if needed by thunk
			// await dispatch(updateUserProfileThunk({ userId: authUser!._id, data: updatePayload, token })).unwrap();

			// Simulating the dispatch and its outcome for now:
			console.log(
				"Dispatching updateUserProfileThunk with payload:",
				updatePayload
			);
			// Assuming your thunk updates the auth.user in Redux store upon success
			// For this placeholder, we'll just simulate success
			// In a real app, the thunk's .fulfilled action would update the Redux store,
			// which would then cause `authUser` to update, and this screen would reflect changes.

			// Placeholder for actual thunk call
			const result = await new Promise<{
				success: boolean;
				message?: string;
			}>((res) => setTimeout(() => res({ success: true }), 1000));

			if (result.success) {
				Alert.alert(
					"Profile Updated",
					"Your profile has been successfully updated.",
					[{ text: "OK", onPress: () => navigation.goBack() }]
				);
			} else {
				Alert.alert(
					"Update Failed",
					result.message || "Could not update profile."
				);
			}
		} catch (error: any) {
			Alert.alert(
				"Update Error",
				error.message || "An unexpected error occurred."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoadingScreen) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading profile...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			keyboardShouldPersistTaps="handled">
			<View style={styles.profilePictureSection}>
				<Image
					source={
						profileImageUri
							? { uri: profileImageUri }
							: { uri: profileImagePlaceholder }
					}
					style={styles.profileImage}
				/>
				<TouchableOpacity
					onPress={handleChooseProfilePicture}
					style={styles.changePictureButton}>
					<MaterialIcons
						name="photo-camera"
						size={18}
						color={colors.primary}
					/>
					<Text style={styles.changePictureText}>Change Picture</Text>
				</TouchableOpacity>
			</View>

			<StyledTextInput // Assumed themed
				label="Full Name"
				value={fullName}
				onChangeText={setFullName}
				placeholder="Enter your full name"
				containerStyle={styles.inputContainer}
				// Pass theme colors if StyledTextInput doesn't get them from context
				// labelTextStyle={{color: colors.textSecondary}}
				// inputStyle={{color: colors.textPrimary, borderColor: colors.borderDefault}}
				// placeholderTextColor={colors.textPlaceholder}
			/>
			<StyledTextInput
				label="Email Address"
				value={email}
				// onChangeText={setEmail} // Email usually not directly editable
				placeholder="your.email@example.com"
				keyboardType="email-address"
				autoCapitalize="none"
				containerStyle={styles.inputContainer}
				editable={false} // Make email non-editable
				inputStyle={styles.disabledInput}
			/>
			<Text style={styles.fieldNoteText}>
				Email address cannot be changed here. Contact support for
				assistance.
			</Text>

			<StyledTextInput
				label="Phone Number"
				value={phoneNumber}
				onChangeText={setPhoneNumber}
				placeholder="Enter your phone number"
				keyboardType="phone-pad"
				containerStyle={styles.inputContainer}
			/>

			<PrimaryButton // Assumed themed
				title={isSubmitting ? "Saving..." : "Save Changes"}
				onPress={handleSaveChanges}
				style={styles.saveButton}
				disabled={isSubmitting || !hasChanges}
				isLoading={isSubmitting}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary, // Muted text on dark background
		fontFamily: typography.primaryRegular,
	},
	profilePictureSection: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: borderRadius.circle, // Circular image
		backgroundColor: colors.backgroundCard, // Placeholder bg for image
		marginBottom: spacing.m,
		borderWidth: 2,
		borderColor: colors.primary, // Accent border
	},
	changePictureButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		// backgroundColor: colors.backgroundCard, // Optional subtle background
	},
	changePictureText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textLink, // Use link color for this action
		marginLeft: spacing.xs,
	},
	inputContainer: {
		marginBottom: spacing.s,
	},
	disabledInput: {
		// Style for non-editable inputs
		backgroundColor: colors.backgroundDisabled, // Slightly different background for disabled
		color: colors.textDisabled, // Muted text for disabled
	},
	fieldNoteText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // Muted placeholder color for notes
		marginBottom: spacing.l,
		marginLeft: spacing.xs, // Align with input label if StyledTextInput has similar padding
	},
	saveButton: {
		marginTop: spacing.xl,
		// PrimaryButton handles its own theming
	},
});

export default EditProfileScreen;
