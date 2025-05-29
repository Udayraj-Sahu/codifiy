// src/screens/App/Profile/ProfileScreen.tsx
import { CompositeNavigationProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
	Alert,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
// Assuming ProfileStackParamList, UserTabParamList, DocumentStackParamList are correctly defined
import PrimaryButton from "../../../components/common/PrimaryButton"; // For "Upload/Update Document" & "Logout"
import { useAuth } from "../../../context/AuthContext"; // To get user data and logout
import {
	ProfileStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example for icons

// --- Types and Dummy Data ---
interface UserProfileData {
	fullName: string;
	email: string;
	profileImageUrl?: string;
	// This would come from a user object, potentially from useAuth()
}

type DocumentVerificationStatus =
	| "Pending Review"
	| "Verified"
	| "Rejected"
	| "Not Uploaded";

interface PastBooking {
	id: string;
	bikeName: string;
	bikeImageUrl: string;
	rentalDates: string; // e.g., "May 20 - May 22, 2025"
	status: "Completed"; // All in this list are completed
}

const DUMMY_USER_PROFILE_DATA: UserProfileData = {
	fullName: "Satoshi Nakamoto",
	email: "satoshi@nakamoto.com",
	profileImageUrl: "https://via.placeholder.com/100x100.png?text=SN",
};

const DUMMY_DOCUMENT_STATUS: DocumentVerificationStatus = "Pending Review";

const DUMMY_PAST_BOOKINGS: PastBooking[] = [
	{
		id: "pb1",
		bikeName: "City Cruiser",
		bikeImageUrl:
			"https://via.placeholder.com/150x100.png?text=City+Cruiser",
		rentalDates: "May 20 - May 21",
		status: "Completed",
	},
	{
		id: "pb2",
		bikeName: "Adventure Pro",
		bikeImageUrl: "https://via.placeholder.com/150x100.png?text=Adv+Pro",
		rentalDates: "Apr 15 - Apr 16",
		status: "Completed",
	},
	{
		id: "pb3",
		bikeName: "Urban Rider",
		bikeImageUrl:
			"https://via.placeholder.com/150x100.png?text=Urban+Rider",
		rentalDates: "Mar 10 - Mar 12",
		status: "Completed",
	},
];
// --- End Dummy Data ---

// --- Past Booking Card Component (Inline or separate) ---
const PastBookingCard: React.FC<{ item: PastBooking; onPress: () => void }> = ({
	item,
	onPress,
}) => (
	<TouchableOpacity
		style={styles.pastBookingCard}
		onPress={onPress}
		activeOpacity={0.8}>
		<Image
			source={{ uri: item.bikeImageUrl }}
			style={styles.pastBookingImage}
		/>
		<Text style={styles.pastBookingBikeName} numberOfLines={1}>
			{item.bikeName}
		</Text>
		<Text style={styles.pastBookingDates} numberOfLines={1}>
			{item.rentalDates}
		</Text>
		<View style={styles.completedBadge}>
			<Text style={styles.completedBadgeText}>{item.status}</Text>
		</View>
	</TouchableOpacity>
);
// --- End Past Booking Card ---

// --- Setting List Item (Inline or separate) ---
interface SettingListItemProps {
	label: string;
	iconPlaceholder?: string;
	onPress: () => void;
}
const SettingListItem: React.FC<SettingListItemProps> = ({
	label,
	iconPlaceholder,
	onPress,
}) => (
	<TouchableOpacity
		style={styles.settingListItem}
		onPress={onPress}
		activeOpacity={0.7}>
		{iconPlaceholder && (
			<Text style={styles.settingListItemIcon}>{iconPlaceholder}</Text>
		)}
		<Text style={styles.settingListItemLabel}>{label}</Text>
		<Text style={styles.settingListItemArrow}>›</Text>
	</TouchableOpacity>
);
// --- End Setting List Item ---

// Navigation Props
type ProfileScreenNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ProfileStackParamList, "Profile">,
	StackNavigationProp<UserTabParamList> // For navigating to other tabs like DocumentsTab
>;

interface ProfileScreenProps {
	navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
	// In a real app, user data and document status would come from useAuth() or fetched
	const { user: authUser, signOut } = useAuth(); // Assuming useAuth provides the user object
	const [userProfile, setUserProfile] = useState<UserProfileData>(
		authUser || DUMMY_USER_PROFILE_DATA
	); // Fallback to dummy if authUser is null initially
	const [documentStatus, setDocumentStatus] =
		useState<DocumentVerificationStatus>(DUMMY_DOCUMENT_STATUS);

	useEffect(() => {
		if (authUser) {
			// Assuming authUser from useAuth has { fullName, email, profileImageUrl }
			setUserProfile({
				fullName: authUser.fullName || "User Name", // Adjust based on your User type from useAuth
				email: authUser.email,
				profileImageUrl:
					(authUser as any).profileImageUrl ||
					DUMMY_USER_PROFILE_DATA.profileImageUrl, // Cast if profileImageUrl is not on your context's User type
			});
		}
		// TODO: Fetch actual document status and past bookings
	}, [authUser]);

	const handleEditProfile = () => {
		navigation.navigate("EditProfile");
	};

	const handleUploadDocument = () => {
		// Navigate to DocumentUploadScreen within the ProfileStack
		navigation.navigate("DocumentUploadScreen", {
			// Assuming it's now in ProfileStack
			isVerificationRequired: true,
		});
	};

	const handleViewAllBookings = () => {
		// Navigate to the MyRentalsScreen (which was previously in RentalsTab)
		// Assuming MyRentalsScreen is now part of ProfileStack or another accessible stack
		// For now, let's assume we'll add it to ProfileStackParamList
		navigation.navigate("MyRentalsScreen");
	};

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: async () => {
					await signOut();
					// AppNavigator will handle redirecting to Auth flow
				},
			},
		]);
	};

	const getStatusIndicatorColor = () => {
		switch (documentStatus) {
			case "Pending Review":
				return colors.warning || "orange";
			case "Verified":
				return colors.success || "green";
			case "Rejected":
				return colors.error || "red";
			default:
				return colors.greyMedium;
		}
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			{/* Profile Header */}
			<View style={styles.profileHeaderSection}>
				<TouchableOpacity
					onPress={handleEditProfile}
					style={styles.profileImageContainer}>
					<Image
						source={
							userProfile.profileImageUrl
								? { uri: userProfile.profileImageUrl }
								: require("../../../../assets/images/icon.png")
						} // Ensure placeholder exists
						style={styles.profileImage}
					/>
					<View style={styles.editIconContainer}>
						<Text style={styles.editIcon}>✏️</Text>
					</View>
				</TouchableOpacity>
				<Text style={styles.userName}>{userProfile.fullName}</Text>
				<Text style={styles.userEmail}>{userProfile.email}</Text>
			</View>

			{/* ID Document Status Card */}
			<View style={styles.cardSection}>
				<Text style={styles.cardTitle}>ID Document Status</Text>
				<View style={styles.statusRow}>
					<View
						style={[
							styles.statusIndicator,
							{ backgroundColor: getStatusIndicatorColor() },
						]}
					/>
					<Text style={styles.statusLabel}>{documentStatus}</Text>
				</View>
				<PrimaryButton
					title="Upload / Update Document"
					onPress={handleUploadDocument}
					style={styles.documentButton}
					textStyle={styles.documentButtonText} // For potentially smaller text
				/>
				<Text style={styles.cardNote}>
					Your ID document is required to book bikes.
				</Text>
			</View>

			{/* Booking History Section */}
			<View style={styles.cardSection}>
				<View style={styles.sectionHeaderRow}>
					<Text style={styles.cardTitle}>Booking History</Text>
					<TouchableOpacity onPress={handleViewAllBookings}>
						<Text style={styles.viewAllLink}>View All</Text>
					</TouchableOpacity>
				</View>
				<FlatList
					horizontal
					data={DUMMY_PAST_BOOKINGS}
					renderItem={({ item }) => (
						<PastBookingCard
							item={item}
							onPress={() => {
								console.log(
									"View past booking details:",
									item.id
								);
								// navigation.navigate('RideDetailsScreen', { bookingId: item.id }); // If RideDetailsScreen is in ProfileStack
							}}
						/>
					)}
					keyExtractor={(item) => item.id}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.horizontalListContent}
				/>
			</View>

			{/* Settings Menu */}
			<View style={styles.settingsMenuSection}>
				<SettingListItem
					label="Settings"
					iconPlaceholder="⚙️"
					onPress={() => navigation.navigate("Settings")}
				/>
				<SettingListItem
					label="Change Password"
					iconPlaceholder="🔒"
					onPress={() =>
						Alert.alert("Navigate", "To Change Password screen")
					}
				/>
				<SettingListItem
					label="Notification Preferences"
					iconPlaceholder="🔔"
					onPress={() =>
						Alert.alert(
							"Navigate",
							"To Notification Preferences screen"
						)
					}
				/>
				<SettingListItem
					label="Help & Support"
					iconPlaceholder="❓"
					onPress={() =>
						Alert.alert("Navigate", "To Help & Support screen")
					}
				/>
			</View>

			{/* Logout Button */}
			<View style={styles.logoutButtonContainer}>
				<PrimaryButton
					title="Logout"
					onPress={handleLogout}
					// You might want a specific style for logout (e.g., red text or different background)
					// style={styles.customLogoutButton}
					// textStyle={styles.customLogoutButtonText}
					iconLeft={
						<Text style={{ marginRight: spacing.s, fontSize: 18 }}>
							🚪
						</Text>
					} // Example icon
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F7F7F7", // Off-white
	},
	contentContainer: {
		paddingBottom: spacing.xxl,
	},
	profileHeaderSection: {
		alignItems: "center",
		paddingVertical: spacing.l,
		backgroundColor: colors.white,
		marginBottom: spacing.m,
	},
	profileImageContainer: {
		position: "relative", // For edit icon positioning
		marginBottom: spacing.s,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.greyLighter,
	},
	editIconContainer: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: colors.white,
		padding: spacing.xs,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#EEE",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	editIcon: {
		fontSize: 16, // Adjust placeholder size
	},
	userName: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginTop: spacing.xs,
	},
	userEmail: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	cardSection: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginHorizontal: spacing.m,
		marginBottom: spacing.m,
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	cardTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	statusIndicator: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: spacing.s,
	},
	statusLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	documentButton: {
		backgroundColor: colors.primary, // Rounded green button
		paddingVertical: spacing.s, // Make it a bit smaller than main primary buttons
	},
	documentButtonText: {
		fontSize: typography.fontSizes.s,
	},
	cardNote: {
		fontSize: typography.fontSizes.xs,
		color: colors.textLight,
		marginTop: spacing.s,
		textAlign: "center",
	},
	sectionHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		// marginBottom: spacing.s, // Already handled by cardTitle margin
	},
	viewAllLink: {
		fontSize: typography.fontSizes.s,
		color: colors.primary,
		fontWeight: typography.fontWeights.medium,
	},
	horizontalListContent: {
		paddingTop: spacing.xs, // Space after title
	},
	pastBookingCard: {
		width: 180, // Adjust for desired size
		marginRight: spacing.m,
		backgroundColor: colors.backgroundLight || "#F5F5F5",
		borderRadius: borderRadius.m,
		padding: spacing.s,
	},
	pastBookingImage: {
		width: "100%",
		height: 100,
		borderRadius: borderRadius.s,
		marginBottom: spacing.s,
		backgroundColor: colors.greyLighter,
	},
	pastBookingBikeName: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
	},
	pastBookingDates: {
		fontSize: typography.fontSizes.xs,
		color: colors.textSecondary,
		marginVertical: spacing.xxs,
	},
	completedBadge: {
		backgroundColor: colors.success || "green",
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs,
		borderRadius: borderRadius.s,
		alignSelf: "flex-start",
		marginTop: spacing.xs,
	},
	completedBadgeText: {
		color: colors.white,
		fontSize: typography.fontSizes.xs - 1,
		fontWeight: typography.fontWeights.bold,
	},
	settingsMenuSection: {
		marginTop: spacing.xs, // Just a bit of space if sections are not carded
		// backgroundColor: colors.white, // if settings items should have white background overall
		// marginHorizontal: spacing.m, // if carded
		// borderRadius: borderRadius.m, // if carded
		// elevation: 1, // if carded
	},
	settingListItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.l - 2, // Slightly less padding for settings
		paddingHorizontal: spacing.m,
		backgroundColor: colors.white,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#F0F0F0",
	},
	settingListItemIcon: {
		fontSize: typography.fontSizes.l,
		marginRight: spacing.m,
		color: colors.textMedium,
		width: 24,
		textAlign: "center",
	},
	settingListItemLabel: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
	},
	settingListItemArrow: {
		fontSize: typography.fontSizes.l,
		color: "#F0F0F0",
	},
	logoutButtonContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.l,
		paddingBottom: spacing.m,
	},
});

export default ProfileScreen;
