// src/screens/App/Profile/ProfileScreen.tsx
import { CompositeNavigationProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed

import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../../store/slices/authSlice";
import { fetchUserDocumentsThunk } from "../../../store/slices/documentSlice";
import { AppDispatch, RootState } from "../../../store/store";

import {
	ProfileStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Using dark theme colors

// --- Types ---
interface UserProfileData {
	fullName: string;
	email: string;
	profileImageUrl?: string;
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
	rentalDates: string;
	status: "Completed"; // Assuming only completed for this example
}

// --- Past Booking Card Component ---
const PastBookingCard: React.FC<{ item: PastBooking; onPress: () => void }> = ({
	item,
	onPress,
}) => (
	<TouchableOpacity
		style={styles.pastBookingCard}
		onPress={onPress}
		activeOpacity={0.8}>
		<Image
			source={
				item.bikeImageUrl
					? { uri: item.bikeImageUrl }
					: require("../../../../assets/images/icon.png") // Ensure this placeholder is dark-theme friendly or adjust bg
			}
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

// --- Setting List Item ---
interface SettingListItemProps {
	label: string;
	iconName?: string;
	iconType?: "material" | "emoji";
	iconPlaceholder?: string;
	iconColor?: string; // Will default to theme color
	iconSize?: number;
	onPress: () => void;
}
const SettingListItem: React.FC<SettingListItemProps> = ({
	label,
	iconName,
	iconType = "material",
	iconPlaceholder,
	iconColor = colors.iconDefault, // Default to theme's icon color
	iconSize = 20,
	onPress,
}) => (
	<TouchableOpacity
		style={styles.settingListItem}
		onPress={onPress}
		activeOpacity={0.7}>
		{iconType === "material" && iconName ? (
			<MaterialIcons
				name={iconName}
				size={iconSize}
				color={iconColor}
				style={styles.settingListItemIcon} // Use specific style for icon in list item
			/>
		) : iconType === "emoji" && iconPlaceholder ? (
			<Text
				style={[
					styles.settingListItemIcon, // Use same layout style
					{ fontSize: iconSize, color: iconColor },
				]}>
				{iconPlaceholder}
			</Text>
		) : (
			<View style={styles.settingListItemIcon} /> // Empty view to maintain alignment if no icon
		)}
		<Text style={styles.settingListItemLabel}>{label}</Text>
		<MaterialIcons
			name="chevron-right"
			size={24}
			color={colors.iconDefault}
		/>
	</TouchableOpacity>
);

type ProfileScreenNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ProfileStackParamList, "Profile">,
	StackNavigationProp<UserTabParamList>
>;

interface ProfileScreenProps {
	navigation: ProfileScreenNavigationProp;
}

// Placeholder for fetching past bookings - implement this in a proper slice
const fetchUserPastBookingsThunkPlaceholder =
	() => async (dispatch: AppDispatch) => {
		dispatch({ type: "userBookings/fetchPast/pending" });
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const DUMMY_PAST_BOOKINGS_FETCHED: PastBooking[] = [
			{
				id: "pb1",
				bikeName: "City Cruiser DB",
				bikeImageUrl:
					"https://placehold.co/300x200/1A1A1A/F5F5F5?text=City+Cruiser", // Dark theme placeholder
				rentalDates: "May 20 - May 21",
				status: "Completed",
			},
			{
				id: "pb2",
				bikeName: "Adventure Pro DB",
				bikeImageUrl:
					"https://placehold.co/300x200/1A1A1A/F5F5F5?text=Adventure+Pro", // Dark theme placeholder
				rentalDates: "Apr 15 - Apr 16",
				status: "Completed",
			},
		];
		dispatch({
			type: "userBookings/fetchPast/fulfilled",
			payload: DUMMY_PAST_BOOKINGS_FETCHED,
		});
		return DUMMY_PAST_BOOKINGS_FETCHED; // Return data for local state update
	};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const authUser = useSelector((state: RootState) => state.auth.user);
	const isRestoringToken = useSelector(
		(state: RootState) => state.auth.isRestoringToken
	);
	const {
		userDocuments,
		isLoading: isLoadingUserDocs,
		error: errorUserDocs,
	} = useSelector((state: RootState) => state.documents);

	const [pastBookings, setPastBookings] = useState<PastBooking[]>([]);
	const [isLoadingPastBookings, setIsLoadingPastBookings] = useState(true);
	const [errorPastBookings, setErrorPastBookings] = useState<string | null>(
		null
	);

	const [userProfile, setUserProfile] = useState<UserProfileData | null>(
		null
	);
	const [documentStatus, setDocumentStatus] =
		useState<DocumentVerificationStatus>("Not Uploaded");

	const profileImagePlaceholder =
		"https://placehold.co/100x100/1A1A1A/F5F5F5?text=User";

	useEffect(() => {
		if (authUser) {
			setUserProfile({
				fullName: authUser.fullName || "User Name",
				email: authUser.email || "user@example.com",
				profileImageUrl: (authUser as any).profileImageUrl,
			});
			dispatch(fetchUserDocumentsThunk());

			const loadPastBookings = async () => {
				setIsLoadingPastBookings(true);
				setErrorPastBookings(null);
				try {
					// Replace with actual thunk dispatch and result handling
					const resultAction = await dispatch(
						fetchUserPastBookingsThunkPlaceholder() as any
					);
					// Assuming the placeholder thunk now returns the data directly for this example
					setPastBookings(resultAction as PastBooking[]);
				} catch (e: any) {
					setErrorPastBookings(
						e.message || "Failed to load past bookings"
					);
				} finally {
					setIsLoadingPastBookings(false);
				}
			};
			loadPastBookings();
		} else if (!isRestoringToken) {
			setUserProfile(null);
			setPastBookings([]);
			// Potentially navigate to Auth flow if user is definitively not logged in
		}
	}, [authUser, dispatch, isRestoringToken]);

	useEffect(() => {
		if (isLoadingUserDocs) return; // Wait for loading to finish

		if (userDocuments && userDocuments.length > 0) {
			const frontLicense = userDocuments.find(
				(doc) =>
					doc.documentType === "drivers_license" &&
					doc.documentSide === "front"
			);
			const backLicense = userDocuments.find(
				(doc) =>
					doc.documentType === "drivers_license" &&
					doc.documentSide === "back"
			);

			if (
				frontLicense?.status === "approved" &&
				backLicense?.status === "approved"
			) {
				setDocumentStatus("Verified");
			} else if (
				frontLicense?.status === "rejected" ||
				backLicense?.status === "rejected"
			) {
				setDocumentStatus("Rejected");
			} else if (
				frontLicense?.status === "pending" ||
				backLicense?.status === "pending"
			) {
				setDocumentStatus("Pending Review");
			} else if (frontLicense || backLicense) {
				// If at least one part is uploaded but not yet fully processed
				setDocumentStatus("Pending Review");
			} else {
				setDocumentStatus("Not Uploaded");
			}
		} else {
			setDocumentStatus("Not Uploaded");
		}
	}, [userDocuments, isLoadingUserDocs]);

	const handleEditProfile = () => navigation.navigate("EditProfile");

	const handleUploadDocument = () => {
		navigation.navigate("DocumentUploadScreen", {
			isVerificationRequired: true,
		});
	};

	const handleViewAllBookings = () => navigation.navigate("MyRentalsScreen");

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to log out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: () => dispatch(logoutUser()),
			},
		]);
	};

	const getStatusIndicatorColor = () => {
		switch (documentStatus) {
			case "Pending Review":
				return colors.warning;
			case "Verified":
				return colors.success;
			case "Rejected":
				return colors.error;
			default:
				return colors.textDisabled; // More neutral for "Not Uploaded"
		}
	};

	if (isRestoringToken || (!authUser && !userProfile)) {
		// Show loader if restoring or if authUser isn't available yet
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (!authUser) {
		// After restore, if still no authUser, prompt login
		return (
			<View style={styles.centered}>
				<Text style={styles.messageText}>
					Please log in to view your profile.
				</Text>
				{/* Optionally a button to navigate to Login, e.g., navigation.navigate('AuthFlow') */}
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.profileHeaderSection}>
				<TouchableOpacity
					onPress={handleEditProfile}
					style={styles.profileImageContainer}>
					<Image
						source={
							userProfile?.profileImageUrl
								? { uri: userProfile.profileImageUrl }
								: { uri: profileImagePlaceholder } // Use placeholder
						}
						style={styles.profileImage}
					/>
					<View style={styles.editIconContainer}>
						<MaterialIcons
							name="edit"
							size={12} // Slightly smaller for the badge
							color={colors.textPrimary} // Icon color matching text on dark bg
						/>
					</View>
				</TouchableOpacity>
				<Text style={styles.userName}>
					{userProfile?.fullName || "User Name"}
				</Text>
				<Text style={styles.userEmail}>
					{userProfile?.email || "user@example.com"}
				</Text>
			</View>

			<View style={styles.cardSection}>
				<Text style={styles.cardTitle}>ID Document Status</Text>
				{isLoadingUserDocs ? (
					<ActivityIndicator
						color={colors.primary}
						style={{
							alignSelf: "center",
							marginVertical: spacing.m,
						}}
					/>
				) : (
					<>
						<View style={styles.statusRow}>
							<View
								style={[
									styles.statusIndicator,
									{
										backgroundColor:
											getStatusIndicatorColor(),
									},
								]}
							/>
							<Text style={styles.statusLabel}>
								{documentStatus}
							</Text>
						</View>
						<PrimaryButton
							title={
								documentStatus === "Verified"
									? "View Documents"
									: "Upload / Update Document"
							}
							onPress={handleUploadDocument}
							style={styles.documentButton} // Uses primary button styles
							textStyle={styles.documentButtonText}
							variant={
								documentStatus === "Verified"
									? "outline"
									: "primary"
							} // Example of using variants
						/>
					</>
				)}
				{errorUserDocs && (
					<Text style={styles.errorText}>
						Error loading documents: {errorUserDocs}
					</Text>
				)}
				<Text style={styles.cardNote}>
					Your ID document is required to book bikes.
				</Text>
			</View>

			<View style={styles.cardSection}>
				<View style={styles.sectionHeaderRow}>
					<Text style={styles.cardTitle}>Booking History</Text>
					<TouchableOpacity onPress={handleViewAllBookings}>
						<Text style={styles.viewAllLink}>View All</Text>
					</TouchableOpacity>
				</View>
				{isLoadingPastBookings ? (
					<ActivityIndicator
						color={colors.primary}
						style={{
							alignSelf: "center",
							marginVertical: spacing.m,
						}}
					/>
				) : errorPastBookings ? (
					<Text style={styles.errorText}>
						Error loading bookings: {errorPastBookings}
					</Text>
				) : pastBookings.length === 0 ? (
					<Text style={styles.noItemsText}>
						No past bookings found.
					</Text>
				) : (
					<FlatList
						horizontal
						data={pastBookings}
						renderItem={({ item }) => (
							<PastBookingCard
								item={item}
								onPress={() =>
									navigation.navigate(
										"RideDetailsScreen" as any,
										{
											// Cast as any if RideDetailsScreen is not in ProfileStackParamList
											bookingId: item.id,
										}
									)
								}
							/>
						)}
						keyExtractor={(item) => item.id}
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.horizontalListContent}
					/>
				)}
			</View>

			<View style={styles.settingsMenuSection}>
				<SettingListItem
					label="Settings"
					iconName="settings"
					onPress={() => navigation.navigate("Settings")}
				/>
				<SettingListItem
					label="Change Password"
					iconName="key" // Material Community Icon, ensure it's available or use 'vpn-key' from MaterialIcons
					onPress={() =>
						navigation.navigate("ChangePasswordScreen" as any)
					}
				/>
				<SettingListItem
					label="Notification Preferences"
					iconName="notifications"
					onPress={() =>
						navigation.navigate(
							"NotificationPreferencesScreen" as any
						)
					}
				/>
				<SettingListItem
					label="Help & Support"
					iconName="help-outline" // Changed from 'info' for MaterialIcons
					onPress={() =>
						navigation.navigate("ContactSupportScreen" as any)
					}
				/>
			</View>

			<View style={styles.logoutButtonContainer}>
				<PrimaryButton
					title="Logout"
					onPress={handleLogout}
					iconLeft={
						<MaterialIcons
							name="logout"
							size={20}
							color={colors.buttonPrimaryText} // Color should match button text
						/>
					}
					// You might want a specific variant for logout, e.g., destructive
					// variant="outline"
					// style={{borderColor: colors.error, }}
					// textStyle={{color: colors.error}}
				/>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	contentContainer: {
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain,
	},
	messageText: {
		// Added for login prompt
		fontSize: typography.fontSizes.l,
		color: colors.textSecondary,
		textAlign: "center",
	},
	errorText: {
		color: colors.textError, // Use theme error color
		textAlign: "center",
		marginTop: spacing.s,
		fontSize: typography.fontSizes.s,
	},
	noItemsText: {
		color: colors.textSecondary, // Use theme secondary text color
		textAlign: "center",
		marginVertical: spacing.m,
		fontFamily: typography.primaryRegular,
		fontSize: typography.fontSizes.m,
	},
	profileHeaderSection: {
		alignItems: "center",
		paddingVertical: spacing.l,
		backgroundColor: colors.backgroundCard, // Dark card background
		marginBottom: spacing.m,
	},
	profileImageContainer: {
		position: "relative",
		marginBottom: spacing.s,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50, // Perfect circle
		backgroundColor: colors.borderDefault, // Placeholder background for image
		borderWidth: 2,
		borderColor: colors.primary, // Accent border
	},
	editIconContainer: {
		position: "absolute",
		bottom: spacing.xs, // Adjusted for better positioning
		right: spacing.xs,
		backgroundColor: colors.backgroundCard, // Match card background
		padding: spacing.xs,
		borderRadius: borderRadius.circle, // Circular badge
		borderWidth: 1,
		borderColor: colors.primary,
	},
	// editIcon style is now handled by MaterialIcons directly
	userName: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginTop: spacing.xs,
	},
	userEmail: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	cardSection: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l, // Use theme border radius
		padding: spacing.m,
		marginHorizontal: spacing.m,
		marginBottom: spacing.m,
		shadowColor: colors.shadowColor, // Use theme shadow color
		shadowOffset: { width: 0, height: 1 }, // Softer shadow for dark theme
		shadowOpacity: 0.2, // Dark themes might need more visible shadows if desired
		shadowRadius: 2,
		elevation: 3, // Keep elevation moderate
	},
	cardTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
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
		borderRadius: borderRadius.circle,
		marginRight: spacing.s,
	},
	statusLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary, // Use theme secondary text
		fontFamily: typography.primaryRegular,
	},
	documentButton: {
		// PrimaryButton will use its own themed styles.
		// We can adjust margin or specific layout here if needed.
		marginTop: spacing.xs,
	},
	documentButtonText: {
		// Text style for this specific button instance if needed,
		// otherwise PrimaryButton's default text style applies.
		// fontSize: typography.fontSizes.s, // Example
	},
	cardNote: {
		fontSize: typography.fontSizes.xs,
		color: colors.textPlaceholder, // More muted color for notes
		marginTop: spacing.s,
		textAlign: "center",
		fontFamily: typography.primaryRegular,
	},
	sectionHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		// marginBottom is handled by cardTitle if it's always present
	},
	viewAllLink: {
		fontSize: typography.fontSizes.m, // Made slightly larger
		color: colors.textLink, // Use theme link color
		fontFamily: typography.primaryMedium,
	},
	horizontalListContent: {
		paddingTop: spacing.xs,
		paddingBottom: spacing.xs, // Add padding if items are close to card edge
	},
	pastBookingCard: {
		width: 180, // Keep width or make dynamic based on screen
		marginRight: spacing.m,
		backgroundColor: colors.backgroundMain, // Slightly different from cardSection for depth
		borderRadius: borderRadius.m,
		padding: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	pastBookingImage: {
		width: "100%",
		height: 100,
		borderRadius: borderRadius.s,
		marginBottom: spacing.s,
		backgroundColor: colors.borderDefault, // Placeholder background
	},
	pastBookingBikeName: {
		fontSize: typography.fontSizes.m, // Slightly larger
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
	},
	pastBookingDates: {
		fontSize: typography.fontSizes.s, // Slightly larger
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginVertical: spacing.xxs,
	},
	completedBadge: {
		backgroundColor: colors.success, // Use theme success color
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs,
		borderRadius: borderRadius.s,
		alignSelf: "flex-start",
		marginTop: spacing.xs,
	},
	completedBadgeText: {
		color: colors.white, // Text on success badge
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
	},
	settingsMenuSection: {
		marginTop: spacing.xs, // Reduced margin if cards have enough
		marginHorizontal: spacing.m, // Add horizontal margin to align with cards
		backgroundColor: colors.backgroundCard, // Background for the whole section
		borderRadius: borderRadius.l, // Rounded corners for the section
		overflow: "hidden", // To clip border radius of list items if needed
	},
	settingListItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m, // Adjusted padding
		paddingHorizontal: spacing.m,
		backgroundColor: colors.backgroundCard, // Use card background
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault, // Theme border color
	},
	settingListItemIcon: {
		// General style for icon container in list item
		marginRight: spacing.m,
		width: 24, // Fixed width for alignment
		alignItems: "center", // Center icon if it's smaller
		// Color is passed as prop to SettingListItem
	},
	settingListItemLabel: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary, // Theme primary text color
	},
	// settingListItemArrow removed, using MaterialIcons chevron-right now
	logoutButtonContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.l,
		paddingBottom: spacing.xl, // More space at the very bottom
	},
});

export default ProfileScreen;
