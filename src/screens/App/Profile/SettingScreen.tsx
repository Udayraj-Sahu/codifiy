// src/screens/App/Profile/SettingsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
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
import PrimaryButton from "../../../components/common/PrimaryButton"; // For Logout button
import { useAuth } from "../../../context/AuthContext"; // To get user data and logout
import { ProfileStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example for icons

// --- Placeholder for User Preferences & Profile ---
interface UserSettings {
	notificationsEnabled: boolean;
	language: string;
	locationAccessEnabled: boolean;
	twoFactorAuthEnabled: boolean;
}
interface UserProfile {
	// Simplified for this screen context
	fullName: string;
	email: string;
	profileImageUrl?: string;
}

const DUMMY_SETTINGS: UserSettings = {
	notificationsEnabled: true,
	language: "English",
	locationAccessEnabled: true,
	twoFactorAuthEnabled: false,
};
const DUMMY_PROFILE: UserProfile = {
	fullName: "Satoshi Nakamoto",
	email: "satoshi@b.com",
	profileImageUrl: "https://via.placeholder.com/60x60.png?text=SN",
};
// --- End Placeholder ---

// --- Reusable Setting Item Component (Enhanced) ---
interface SettingItemProps {
	label: string;
	iconPlaceholder?: string; // For emoji/text placeholder
	onPress?: () => void;
	hasSwitch?: boolean;
	switchValue?: boolean;
	onSwitchValueChange?: (value: boolean) => void;
	currentValue?: string; // e.g., "English" for language
	isDestructive?: boolean;
	isLastItemInSection?: boolean; // To remove bottom border if it's the last
}

const SettingItem: React.FC<SettingItemProps> = ({
	label,
	iconPlaceholder,
	onPress,
	hasSwitch,
	switchValue,
	onSwitchValueChange,
	currentValue,
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
			disabled={!onPress && !hasSwitch}
			activeOpacity={onPress ? 0.7 : 1}>
			{iconPlaceholder && (
				<Text style={styles.settingIcon}>{iconPlaceholder}</Text>
			)}
			<Text
				style={[
					styles.settingLabel,
					isDestructive && styles.destructiveText,
				]}>
				{label}
			</Text>
			{currentValue && !hasSwitch && (
				<Text style={styles.settingValueText}>{currentValue}</Text>
			)}
			{hasSwitch && (
				<Switch
					trackColor={{
						false: colors.greyLightest || "#E0E0E0",
						true: colors.primaryLight || "#D3EAA4",
					}}
					thumbColor={
						switchValue
							? colors.primary
							: Platform.OS === "ios"
							? colors.white
							: colors.greyMedium
					}
					ios_backgroundColor={colors.greyLightest}
					onValueChange={onSwitchValueChange}
					value={switchValue}
				/>
			)}
			{!hasSwitch && onPress && (
				<Text style={styles.settingArrow}>›</Text>
			)}
		</TouchableOpacity>
	);
};
// --- End Setting Item ---

type SettingsScreenNavigationProp = StackNavigationProp<
	ProfileStackParamList,
	"Settings"
>;
// type SettingsScreenRouteProp = RouteProp<ProfileStackParamList, 'Settings'>; // If receiving params

interface SettingsScreenProps {
	navigation: SettingsScreenNavigationProp;
	// route: SettingsScreenRouteProp;
}

const APP_VERSION = "1.0.0 (Build 1)"; // Get this from DeviceInfo or Expo Constants

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
	const { user: authUser, signOut } = useAuth(); // Assuming useAuth provides the basic user
	const [userProfile, setUserProfile] = useState<UserProfile>(DUMMY_PROFILE);
	const [settings, setSettings] = useState<UserSettings>(DUMMY_SETTINGS);
	const [isLoading, setIsLoading] = useState(false); // For fetching settings if needed

	// Set header right icon
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() => console.log("Gear icon pressed!")}
					style={{ marginRight: spacing.m }}>
					{/* <Icon name="cog-outline" size={24} color={colors.textPrimary} /> */}
					<Text style={{ fontSize: 22 }}>⚙️</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	useEffect(() => {
		// Fetch actual settings and profile data if not from context
		if (authUser) {
			setUserProfile({
				fullName: authUser.fullName || DUMMY_PROFILE.fullName,
				email: authUser.email,
				profileImageUrl:
					(authUser as any).profileImageUrl ||
					DUMMY_PROFILE.profileImageUrl,
			});
		}
		// setSettings(fetchedSettings); // Example if fetching settings
	}, [authUser]);

	const handleToggleSetting = async (
		settingKey: keyof UserSettings,
		value: boolean
	) => {
		setSettings((prev) => ({ ...prev, [settingKey]: value }));
		// TODO: Persist setting change via API or local storage
		console.log(`Setting ${settingKey} to ${value}`);
	};

	const navigateTo = (
		screenName: keyof ProfileStackParamList,
		params?: any
	) => {
		// Alert.alert("Navigate", `To ${screenName}`);
		// @ts-ignore // Temporary to allow navigation to conceptual screens
		navigation.navigate(screenName, params);
	};

	const openLink = (url: string) =>
		Linking.openURL(url).catch((err) =>
			Alert.alert("Error", "Could not open link.")
		);

	const handleDeleteAccount = () => {
		Alert.alert(
			"Delete Account",
			"This action is permanent. Are you sure?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						console.log("Deleting account...");
						// await actualDeleteAccountAPI();
						await signOut(); // Then sign out
					},
				},
			]
		);
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			{/* 1. Profile Section Card */}
			<View style={styles.card}>
				<TouchableOpacity
					style={styles.profileCardHeader}
					onPress={() => navigateTo("EditProfile")}>
					<Image
						source={
							userProfile.profileImageUrl
								? { uri: userProfile.profileImageUrl }
								: require("../../../../assets/images/icon.png")
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
					<Text style={styles.settingArrow}>›</Text>
				</TouchableOpacity>
				<View style={styles.divider} />
				<SettingItem
					label="Edit Profile"
					onPress={() => navigateTo("EditProfile")}
					iconPlaceholder="✏️"
				/>
				<SettingItem
					label="Phone Number"
					onPress={() =>
						Alert.alert("Navigate", "To Edit Phone Number")
					}
					iconPlaceholder="📞"
					isLastItemInSection
				/>
			</View>

			{/* 2. App Preferences Section */}
			<Text style={styles.sectionTitle}>App Preferences</Text>
			<View style={styles.card}>
				<SettingItem
					label="Notifications"
					iconPlaceholder="🔔"
					hasSwitch
					switchValue={settings.notificationsEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("notificationsEnabled", val)
					}
				/>
				<SettingItem
					label="Language"
					iconPlaceholder="🌐"
					currentValue={settings.language}
					onPress={() => navigateTo("LanguageSelectionScreen")}
				/>
				<SettingItem
					label="Location Access"
					iconPlaceholder="📍"
					hasSwitch
					switchValue={settings.locationAccessEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("locationAccessEnabled", val)
					}
					isLastItemInSection
				/>
			</View>

			{/* 3. Privacy & Security Section */}
			<Text style={styles.sectionTitle}>Privacy & Security</Text>
			<View style={styles.card}>
				<SettingItem
					label="Change Password"
					iconPlaceholder="🔒"
					onPress={() => navigateTo("ChangePasswordScreen")}
				/>
				<SettingItem
					label="Two-Factor Authentication"
					iconPlaceholder="🛡️" // Using shield for 2FA
					hasSwitch
					switchValue={settings.twoFactorAuthEnabled}
					onSwitchValueChange={(val) =>
						handleToggleSetting("twoFactorAuthEnabled", val)
					}
				/>
				<SettingItem
					label="Data Privacy Settings"
					iconPlaceholder="📄"
					onPress={() => navigateTo("DataPrivacyScreen")}
					isLastItemInSection
				/>
			</View>

			{/* 4. Support & Help Section */}
			<Text style={styles.sectionTitle}>Support & Help</Text>
			<View style={styles.card}>
				<SettingItem
					label="FAQ"
					iconPlaceholder="❓"
					onPress={() => navigateTo("FAQScreen")}
				/>
				<SettingItem
					label="Contact Support"
					iconPlaceholder="💬"
					onPress={() => navigateTo("ContactSupportScreen")}
				/>
				<SettingItem
					label="Terms & Conditions"
					iconPlaceholder="📜"
					onPress={() => openLink("https_bikya_app_terms")}
				/>
				<SettingItem
					label="Privacy Policy"
					iconPlaceholder=" Gavel"
					onPress={() => openLink("https_bikya_app_privacy")}
				/>
				<SettingItem
					label="App Version"
					iconPlaceholder="📱"
					valueText={APP_VERSION}
					isLastItemInSection
				/>
			</View>

			{/* 5. Account Management */}
			<View style={styles.accountManagementSection}>
				<PrimaryButton
					title="Logout"
					onPress={signOut} // Directly use signOut from useAuth
					style={styles.logoutButton}
					textStyle={styles.logoutButtonText}
					// iconLeft={<Icon name="logout" size={18} color={colors.error} />} // Example for actual icon
					fullWidth={true} // Ensure it takes full width of its container
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
		backgroundColor: colors.backgroundLight || "#F7F9FC", // Off-white
	},
	contentContainer: {
		paddingVertical: spacing.s,
		paddingBottom: spacing.xxl,
	},
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	sectionTitle: {
		marginHorizontal: spacing.m + spacing.xs, // Align with card content padding
		marginTop: spacing.l,
		marginBottom: spacing.s,
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
		color: colors.textSecondary,
		textTransform: "uppercase",
	},
	card: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.m,
		marginHorizontal: spacing.m,
		marginBottom: spacing.m,
		overflow: "hidden", // Ensures border radius clips children if needed
		// Soft shadow
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	// Profile Section Card specific styles
	profileCardHeader: {
		flexDirection: "row",
		alignItems: "center",
		padding: spacing.m,
	},
	profileCardImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	profileCardTextContainer: {
		flex: 1,
	},
	profileCardName: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	profileCardEmail: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.borderDefault || "#E0E0E0",
		marginHorizontal: spacing.m, // If SettingItems also have this padding
	},
	// SettingItem Styles (reused from previous definition, adapted)
	settingItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.l - 2, // Adjusted for card layout
		paddingHorizontal: spacing.m,
		backgroundColor: colors.white,
		borderTopWidth: StyleSheet.hairlineWidth, // Use top border for items after the first
		borderTopColor: colors.borderDefault || "#F0F0F0",
	},
	settingItemLast: {
		borderBottomWidth: 0, // Remove border for the last item in a card section
	},
	settingIcon: {
		fontSize: 20,
		marginRight: spacing.m,
		color: colors.textMedium,
		width: 24,
		textAlign: "center",
	},
	settingLabel: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
	},
	settingValueText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginRight: spacing.s,
	},
	settingArrow: {
		fontSize: typography.fontSizes.l + 2,
		color: colors.greyLight,
	},
	destructiveText: { color: colors.error || "red" },
	// Account Management Section
	accountManagementSection: {
		paddingHorizontal: spacing.m,
		marginTop: spacing.l, // Space above logout
	},
	logoutButton: {
		backgroundColor: "transparent", // Outlined style
		borderColor: colors.error || "red",
		borderWidth: 1.5,
		paddingVertical: spacing.m - 2, // Adjust padding for outlined
	},
	logoutButtonText: {
		color: colors.error || "red",
		fontWeight: typography.fontWeights.semiBold,
	},
	deleteAccountButton: {
		marginTop: spacing.m,
		padding: spacing.s,
		alignItems: "center",
	},
	deleteAccountText: {
		color: colors.textMedium, // Muted grey
		fontSize: typography.fontSizes.s,
	},
});

export default SettingsScreen;
