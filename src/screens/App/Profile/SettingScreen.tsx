// src/screens/App/Profile/SettingsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Linking,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux"; // Import Redux hooks
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import { ProfileStackParamList } from "../../../navigation/types";
import { logoutUser } from "../../../store/slices/authSlice"; // Import logout action
import { AppDispatch, RootState } from "../../../store/store"; // Import Redux types
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- User Preferences & Profile (Data will come from Redux/State) ---
interface UserSettings {
	notificationsEnabled: boolean;
	language: string; // This would ideally be managed via i18n and user preferences
	locationAccessEnabled: boolean; // This might reflect actual system permission status
	twoFactorAuthEnabled: boolean;
}
interface UserProfileDisplay {
	fullName: string;
	email: string;
	profileImageUrl?: string | null;
}

// --- Reusable Setting Item Component (Enhanced for Dark Theme & MaterialIcons) ---
interface SettingItemProps {
	label: string;
	iconName?: keyof typeof MaterialIcons.glyphMap; // Use MaterialIcons names
	onPress?: () => void;
	hasSwitch?: boolean;
	switchValue?: boolean;
	onSwitchValueChange?: (value: boolean) => void;
	currentValueText?: string; // e.g., "English" for language
	isDestructive?: boolean;
	isLastItemInSection?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
	label,
	iconName,
	onPress,
	hasSwitch,
	switchValue,
	onSwitchValueChange,
	currentValueText,
	isDestructive,
	isLastItemInSection,
}) => {
	return (
		<TouchableOpacity
			style={[
				styles.settingItem,
				isLastItemInSection && styles.settingItemLast,
			]}
			onPress={onPress}
			disabled={!onPress && !hasSwitch} // Disable if no action
			activeOpacity={onPress ? 0.7 : 1}>
			{iconName && (
				<MaterialIcons
					name={iconName}
					size={22} // Standardized icon size
					color={isDestructive ? colors.error : colors.iconDefault} // Themed icon color
					style={styles.settingIcon}
				/>
			)}
			{
				!iconName && (
					<View style={styles.settingIconPlaceholder} />
				) /* For alignment if no icon */
			}
			<Text
				style={[
					styles.settingLabel,
					isDestructive && styles.destructiveText,
				]}>
				{label}
			</Text>
			{currentValueText && !hasSwitch && (
				<Text style={styles.settingValueText}>{currentValueText}</Text>
			)}
			{hasSwitch && (
				<Switch
					trackColor={{
						false: colors.borderDefault, // Darker track for off state
						true: colors.primaryLight, // Lighter primary for on state track
					}}
					thumbColor={
						switchValue
							? colors.primary
							: Platform.OS === "ios"
							? colors.backgroundCard // iOS thumb often matches background when off
							: colors.textDisabled // Muted thumb for Android when off
					}
					ios_backgroundColor={colors.borderDefault} // Background of the track on iOS
					onValueChange={onSwitchValueChange}
					value={switchValue}
				/>
			)}
			{!hasSwitch && onPress && (
				<MaterialIcons
					name="chevron-right"
					size={24}
					color={colors.iconDefault}
				/>
			)}
		</TouchableOpacity>
	);
};
// --- End Setting Item ---

type SettingsScreenNavigationProp = StackNavigationProp<
	ProfileStackParamList,
	"Settings"
>;

interface SettingsScreenProps {
	navigation: SettingsScreenNavigationProp;
}

const APP_VERSION = "1.0.1 (Build 2)"; // Example, get from DeviceInfo or Expo Constants

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const authUser = useSelector((state: RootState) => state.auth.user);

	const [userProfile, setUserProfile] = useState<UserProfileDisplay | null>(
		null
	);
	// Settings would ideally be fetched or come from a user preferences slice
	const [settings, setSettings] = useState<UserSettings>({
		notificationsEnabled: true,
		language: "English", // Placeholder
		locationAccessEnabled: true, // Placeholder, should reflect actual permission
		twoFactorAuthEnabled: false, // Placeholder
	});
	const [isLoading, setIsLoading] = useState(false); // For any async settings operations

	const profileImagePlaceholder =
		"https://placehold.co/60x60/1A1A1A/F5F5F5?text=User";

	// Removed useLayoutEffect for headerRight, assuming header is standard from stack navigator
	// If custom headerRight is needed, it should be themed.

	useEffect(() => {
		if (authUser) {
			setUserProfile({
				fullName: authUser.fullName || "User Name",
				email: authUser.email || "user@example.com",
				profileImageUrl: authUser.profileImageUrl,
			});
			// TODO: Fetch actual user settings if they are stored on backend/redux
			// e.g., dispatch(fetchUserSettingsThunk());
		} else {
			// Handle case where user is not authenticated (should ideally not reach this screen)
			navigation.goBack(); // Or navigate to Auth flow
		}
	}, [authUser, navigation]);

	const handleToggleSetting = async (
		settingKey: keyof UserSettings,
		value: boolean
	) => {
		setSettings((prev) => ({ ...prev, [settingKey]: value }));
		// TODO: Persist setting change via API call and update Redux store
		console.log(`Setting ${settingKey} to ${value}`);
		// Example: dispatch(updateUserSettingThunk({ [settingKey]: value }));
	};

	const navigateTo = (
		screenName: keyof ProfileStackParamList, // Ensure screenName is a valid key
		params?: any
	) => {
		try {
			navigation.navigate(screenName, params);
		} catch (e) {
			console.error("Navigation error in SettingsScreen:", e);
			Alert.alert(
				"Navigation Error",
				`Could not navigate to ${screenName}.`
			);
		}
	};

	const openLink = async (url: string) => {
		const supported = await Linking.canOpenURL(url);
		if (supported) {
			await Linking.openURL(url);
		} else {
			Alert.alert("Error", `Could not open this link: ${url}`);
		}
	};

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: () => dispatch(logoutUser()), // Dispatch Redux logout action
			},
		]);
	};

	const handleDeleteAccount = () => {
		Alert.alert(
			"Delete Account",
			"This action is permanent and cannot be undone. All your data will be erased. Are you absolutely sure?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete My Account",
					style: "destructive",
					onPress: async () => {
						console.log("Initiating account deletion...");
						// TODO: dispatch(deleteAccountThunk());
						// After successful deletion from backend, the thunk should also call logoutUser.
						// For now, just simulating logout:
						// await dispatch(logoutUser());
						Alert.alert(
							"Request Submitted",
							"Your account deletion request has been submitted. It may take some time to process."
						);
					},
				},
			]
		);
	};
	if (!userProfile) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.card}>
				<TouchableOpacity
					style={styles.profileCardHeader}
					onPress={() => navigateTo("EditProfile")}>
					<Image
						source={
							userProfile.profileImageUrl
								? { uri: userProfile.profileImageUrl }
								: { uri: profileImagePlaceholder }
						}
						style={styles.profileCardImage}
					/>
					<View style={styles.profileCardTextContainer}>
						<Text style={styles.profileCardName}>
							{userProfile.fullName}
						</Text>
						<Text style={styles.profileCardEmail}>
							{userProfile.email}
						</Text>
					</View>
					<MaterialIcons
						name="chevron-right"
						size={24}
						color={colors.iconDefault}
					/>
				</TouchableOpacity>
			</View>

			<Text style={styles.sectionTitle}>App Preferences</Text>
			<View style={styles.card}>
				<SettingItem
					label="Notifications"
					iconName="notifications-none"
					hasSwitch
					switchValue={settings.notificationsEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("notificationsEnabled", val)
					}
				/>
				<SettingItem
					label="Language"
					iconName="language"
					currentValueText={settings.language}
					onPress={() => navigateTo("LanguageSelectionScreen" as any)} // Cast if not in ProfileStackParamList
				/>
				<SettingItem
					label="Location Access"
					iconName="location-pin"
					hasSwitch
					switchValue={settings.locationAccessEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("locationAccessEnabled", val)
					}
					isLastItemInSection
				/>
			</View>

			<Text style={styles.sectionTitle}>Privacy & Security</Text>
			<View style={styles.card}>
				<SettingItem
					label="Change Password"
					iconName="lock-outline" // More appropriate for password
					onPress={() => navigateTo("ChangePasswordScreen" as any)}
				/>
				<SettingItem
					label="Two-Factor Authentication"
					iconName="security" // Using shield for 2FA
					hasSwitch
					switchValue={settings.twoFactorAuthEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("twoFactorAuthEnabled", val)
					}
				/>
				<SettingItem
					label="Data Privacy Settings"
					iconName="shield-account-outline" // Example from MaterialCommunity, use 'privacy-tip' from MaterialIcons
					onPress={() => navigateTo("DataPrivacyScreen" as any)}
					isLastItemInSection
				/>
			</View>

			<Text style={styles.sectionTitle}>Support & Help</Text>
			<View style={styles.card}>
				<SettingItem
					label="FAQ"
					iconName="help-outline"
					onPress={() => navigateTo("FAQScreen" as any)}
				/>
				<SettingItem
					label="Contact Support"
					iconName="support-agent"
					onPress={() => navigateTo("ContactSupportScreen" as any)}
				/>
				<SettingItem
					label="Terms & Conditions"
					iconName="article"
					onPress={() => openLink("https://your-app.com/terms")}
				/>
				<SettingItem
					label="Privacy Policy"
					iconName="gavel"
					onPress={() => openLink("https://your-app.com/privacy")}
				/>
				<SettingItem
					label="App Version"
					iconName="info-outline"
					currentValueText={APP_VERSION}
					isLastItemInSection
				/>
			</View>

			<View style={styles.accountManagementSection}>
				<PrimaryButton // Assumed themed
					title="Logout"
					onPress={handleLogout}
					style={styles.logoutButton}
					textStyle={styles.logoutButtonText}
					iconLeft={
						<MaterialIcons
							name="logout"
							size={20}
							color={colors.error}
						/>
					}
					fullWidth={true}
				/>
				<TouchableOpacity
					onPress={handleDeleteAccount}
					style={styles.deleteAccountButton}>
					<Text style={styles.deleteAccountText}>Delete Account</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	contentContainer: {
		paddingVertical: spacing.s,
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain,
	},
	sectionTitle: {
		marginHorizontal: spacing.m + spacing.xs,
		marginTop: spacing.l,
		marginBottom: spacing.s,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium, // Use themed font family
		color: colors.textSecondary, // Muted text for section titles
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	card: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l, // More rounded cards
		marginHorizontal: spacing.m,
		marginBottom: spacing.l, // Increased space between cards
		overflow: "hidden",
		borderWidth: 1, // Optional: subtle border for cards
		borderColor: colors.borderDefault, // Optional: subtle border for cards
	},
	profileCardHeader: {
		flexDirection: "row",
		alignItems: "center",
		padding: spacing.m,
	},
	profileCardImage: {
		width: 60,
		height: 60,
		borderRadius: borderRadius.circle, // Circular image
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault, // Placeholder background
	},
	profileCardTextContainer: {
		flex: 1,
	},
	profileCardName: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
	},
	profileCardEmail: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	divider: {
		// No longer used as items have top borders
		// height: StyleSheet.hairlineWidth,
		// backgroundColor: colors.borderDefault,
		// marginHorizontal: spacing.m,
	},
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m + spacing.xxs, // Slightly more padding
		paddingHorizontal: spacing.m,
		backgroundColor: colors.backgroundCard, // Card background for items
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault, // Themed border
	},
	settingItemFirst: {
		// Apply this to the first item in a card if no header like profileCardHeader
		borderTopWidth: 0,
	},
	settingItemLast: {
		// No bottom border needed if card has overflow:hidden and items have top borders
	},
	settingIcon: {
		marginRight: spacing.m,
		width: 24, // Ensure consistent width for icon area
		textAlign: "center",
		// Color is passed as prop or defaults
	},
	settingIconPlaceholder: {
		// For alignment when no icon is present
		width: 24,
		marginRight: spacing.m,
	},
	settingLabel: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary, // Light text
	},
	settingValueText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text for current value
		marginRight: spacing.s,
	},
	// settingArrow: { // Replaced by MaterialIcons chevron-right
	//  fontSize: typography.fontSizes.l + 2,
	//  color: colors.iconDefault,
	// },
	destructiveText: {
		color: colors.error, // Themed error color for destructive actions
	},
	accountManagementSection: {
		paddingHorizontal: spacing.m,
		marginTop: spacing.l,
	},
	logoutButton: {
		// Style for PrimaryButton instance
		backgroundColor: "transparent",
		borderColor: colors.error, // Error color border for logout
		borderWidth: 1.5,
	},
	logoutButtonText: {
		// For text within PrimaryButton instance
		color: colors.error, // Error color text for logout
		fontFamily: typography.primarySemiBold,
	},
	deleteAccountButton: {
		marginTop: spacing.m,
		padding: spacing.s,
		alignItems: "center",
	},
	deleteAccountText: {
		color: colors.textPlaceholder, // Very muted for less prominent action
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
	},
});

export default SettingsScreen;
