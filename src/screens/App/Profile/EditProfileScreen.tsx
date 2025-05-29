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
import PrimaryButton from "../../../components/common/PrimaryButton";
import StyledTextInput from "../../../components/common/StyledTextInput";
import { ProfileStackParamList } from "../../../navigation/types";
import { colors, spacing, typography } from "../../../theme";

// --- Dummy User Data & Service (Replace with actual API/Auth Context) ---
interface UserProfileEditableData {
	name: string;
	email: string; // Changing email often has security implications
	phone?: string; // Changing phone often has security implications
	profileImageUrl?: string | null;
	// Add other editable fields like bio, location, etc. if needed
}

const DUMMY_CURRENT_USER_PROFILE: UserProfileEditableData = {
	name: "Satoshi Nakamoto",
	email: "satoshi@nakamoto.com",
	phone: "+1234567890",
	profileImageUrl: "https://via.placeholder.com/150x150.png?text=SN",
};

const fetchCurrentUserProfile =
	async (): Promise<UserProfileEditableData | null> => {
		// Simulate API call
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve(JSON.parse(JSON.stringify(DUMMY_CURRENT_USER_PROFILE))); // Return a copy
			}, 300);
		});
	};

const updateCurrentUserProfile = async (
	updatedData: UserProfileEditableData
): Promise<{
	success: boolean;
	data?: UserProfileEditableData;
	message?: string;
}> => {
	// Simulate API call
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log("Updating profile with:", updatedData);
			// In a real app, update backend and then update local auth context/store
			DUMMY_CURRENT_USER_PROFILE.name = updatedData.name;
			DUMMY_CURRENT_USER_PROFILE.email = updatedData.email;
			DUMMY_CURRENT_USER_PROFILE.phone = updatedData.phone;
			DUMMY_CURRENT_USER_PROFILE.profileImageUrl =
				updatedData.profileImageUrl;
			resolve({ success: true, data: { ...DUMMY_CURRENT_USER_PROFILE } });
		}, 1000);
	});
};
// --- End Dummy Data ---

type EditProfileScreenNavigationProp = StackNavigationProp<
	ProfileStackParamList,
	"EditProfile"
>;
type EditProfileScreenRouteProp = RouteProp<
	ProfileStackParamList,
	"EditProfile"
>; // If any params were passed

interface EditProfileScreenProps {
	navigation: EditProfileScreenNavigationProp;
	route: EditProfileScreenRouteProp;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
	navigation /*, route*/,
}) => {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [profileImageUri, setProfileImageUri] = useState<
		string | null | undefined
	>(undefined); // undefined: not loaded, null: no image, string: image uri
	const [initialData, setInitialData] =
		useState<UserProfileEditableData | null>(null);

	const [isLoading, setIsLoading] = useState(true); // For fetching initial data
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const loadProfile = async () => {
			setIsLoading(true);
			const profileData = await fetchCurrentUserProfile();
			if (profileData) {
				setName(profileData.name);
				setEmail(profileData.email);
				setPhone(profileData.phone || "");
				setProfileImageUri(profileData.profileImageUrl);
				setInitialData(profileData); // Store initial data to check for changes
			} else {
				Alert.alert("Error", "Could not load profile data.");
				navigation.goBack();
			}
			setIsLoading(false);
		};
		loadProfile();
	}, [navigation]);

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
			aspect: [1, 1], // Square for profile pictures
			quality: 0.7,
		});

		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			setProfileImageUri(pickerResult.assets[0].uri);
		}
	};

	const hasChanges = useMemo(() => {
		if (!initialData) return false;
		return (
			initialData.name !== name ||
			initialData.email !== email ||
			initialData.phone !== phone ||
			initialData.profileImageUrl !== profileImageUri
		);
	}, [initialData, name, email, phone, profileImageUri]);

	const handleSaveChanges = async () => {
		if (!name.trim()) {
			Alert.alert("Validation Error", "Name cannot be empty.");
			return;
		}
		// Add more validation as needed (e.g., email format)

		setIsSubmitting(true);
		const updatedProfileData: UserProfileEditableData = {
			name,
			email, // Note: Changing email/phone usually requires a verification step.
			phone,
			profileImageUrl: profileImageUri,
		};

		// TODO: If profileImageUri is a local file URI, upload it first to get a remote URL
		// For now, we assume profileImageUri would be the URL if already remote or updated local URI
		// if the backend handles direct local URI uploads (less common for mobile)

		const result = await updateCurrentUserProfile(updatedProfileData);
		setIsSubmitting(false);

		if (result.success) {
			Alert.alert(
				"Profile Updated",
				"Your profile has been successfully updated.",
				[
					{ text: "OK", onPress: () => navigation.goBack() }, // Go back to ProfileScreen
				]
			);
			// TODO: Update global state/auth context with new profile data
		} else {
			Alert.alert(
				"Update Failed",
				result.message || "Could not update profile. Please try again."
			);
		}
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: spacing.s }}>Loading profile...</Text>
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
							: require("../../../../assets/images/icon.png")
					} // Fallback to a local placeholder
					style={styles.profileImage}
				/>
				<TouchableOpacity onPress={handleChooseProfilePicture}>
					<Text style={styles.changePictureText}>
						Change Profile Picture
					</Text>
				</TouchableOpacity>
			</View>

			<StyledTextInput
				label="Full Name"
				value={name}
				onChangeText={setName}
				placeholder="Enter your full name"
				containerStyle={styles.inputContainer}
			/>
			<StyledTextInput
				label="Email Address"
				value={email}
				onChangeText={setEmail}
				placeholder="Enter your email"
				keyboardType="email-address"
				autoCapitalize="none"
				containerStyle={styles.inputContainer}
				// editable={false} // Email change often involves verification
			/>
			<Text style={styles.fieldNoteText}>
				Changing email might require re-verification.
			</Text>

			<StyledTextInput
				label="Phone Number"
				value={phone}
				onChangeText={setPhone}
				placeholder="Enter your phone number"
				keyboardType="phone-pad"
				containerStyle={styles.inputContainer}
			/>

			<PrimaryButton
				title={isSubmitting ? "Saving..." : "Save Changes"}
				onPress={handleSaveChanges}
				style={styles.saveButton}
				disabled={isSubmitting || !hasChanges} // Disable if no changes or submitting
				isLoading={isSubmitting}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#FFFFFF",
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	profilePictureSection: {
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: colors.greyLighter,
		marginBottom: spacing.m,
	},
	changePictureText: {
		fontSize: typography.fontSizes.m,
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},
	inputContainer: {
		marginBottom: spacing.s, // Less margin between input and its note
	},
	fieldNoteText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		marginBottom: spacing.l, // Margin after the note
		marginLeft: spacing.xs, // Slight indent
	},
	saveButton: {
		marginTop: spacing.xl,
	},
});

export default EditProfileScreen;
