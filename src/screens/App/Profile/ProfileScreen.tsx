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
import PrimaryButton from "../../../components/common/PrimaryButton";
// import { useAuth } from "../../../context/AuthContext"; // Using Redux for auth state primarily now
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { useDispatch, useSelector } from "react-redux"; // <<< ADDED
import { logoutUser } from "../../../store/slices/authSlice"; // <<< ADDED logoutUser
import { fetchUserDocumentsThunk } from "../../../store/slices/documentSlice"; // <<< ADDED
import { AppDispatch, RootState } from "../../../store/store"; // <<< ADDED
// Placeholder for a new thunk for user bookings
// import { fetchUserPastBookingsThunk, BookingSummary } from '../../../store/slices/userBookingsSlice';

import {
	ProfileStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

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

// This would come from your new userBookingsSlice or bookingSlice
interface PastBooking {
	id: string; // booking._id
	bikeName: string; // bike.model
	bikeImageUrl: string; // bike.images[0].url
	rentalDates: string;
	status: "Completed";
}
const iconColor = "#FFFFFF"; // IMPORTANT: Change this to match your button's text color or design
const iconSize = 20;
// --- Past Booking Card Component (Keep as is) ---
const PastBookingCard: React.FC<{ item: PastBooking; onPress: () => void }> = ({
	/* ... */ item,
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
					: require("../../../../assets/images/icon.png")
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

// --- Setting List Item (Keep as is) ---
interface SettingListItemProps {
	label: string;
	iconName?: string; // Name of the MaterialIcon
	iconType?: "material" | "emoji"; // Example if you want to support both
	iconPlaceholder?: string; // For emoji
	iconColor?: string;
	iconSize?: number;
	onPress: () => void;
}
const SettingListItem: React.FC<SettingListItemProps> = ({
	/* ... */ label,
	iconName,
	iconType = "material",
	iconPlaceholder,
	iconColor = "black",
	iconSize = 20,
	onPress,
}) => (
	<TouchableOpacity
		style={styles.settingListItem}
		onPress={onPress}
		activeOpacity={0.7}>
		{/* Corrected Icon Logic */}
		{iconType === "material" && iconName ? (
			<MaterialIcons
				name={iconName}
				size={iconSize}
				color={iconColor}
				style={styles.iconStyle}
			/>
		) : iconType === "emoji" && iconPlaceholder ? (
			<Text
				style={[
					styles.editIcon,
					{ fontSize: iconSize, color: iconColor },
				]}>
				{iconPlaceholder}
			</Text>
		) : null}
		{/* Fallback: If you want a default icon when none is specified or if only iconName is given without iconType */}
		{/* {!iconType && iconName && (
                <MaterialIcons name={iconName} size={iconSize} color={iconColor} style={styles.iconStyle} />
            )} */}

		<Text style={styles.settingListItemLabel}>{label}</Text>
		<Text style={styles.settingListItemArrow}>›</Text>
	</TouchableOpacity>
);

type ProfileScreenNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ProfileStackParamList, "Profile">,
	StackNavigationProp<UserTabParamList> // For navigating to other tabs
>;

interface ProfileScreenProps {
	navigation: ProfileScreenNavigationProp;
}

// Placeholder for fetching past bookings - implement this in a proper slice
const fetchUserPastBookingsThunkPlaceholder =
	() => async (dispatch: AppDispatch) => {
		console.log("Placeholder: Dispatching fetchUserPastBookingsThunk");
		dispatch({ type: "userBookings/fetchPast/pending" });
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// Simulate some data or an empty array
		const DUMMY_PAST_BOOKINGS_FETCHED: PastBooking[] = [
			{
				id: "pb1",
				bikeName: "City Cruiser DB",
				bikeImageUrl:
					"https://via.placeholder.com/150x100.png?text=City+Cruiser+DB",
				rentalDates: "May 20 - May 21",
				status: "Completed",
			},
			{
				id: "pb2",
				bikeName: "Adventure Pro DB",
				bikeImageUrl:
					"https://via.placeholder.com/150x100.png?text=Adv+Pro+DB",
				rentalDates: "Apr 15 - Apr 16",
				status: "Completed",
			},
		];
		dispatch({
			type: "userBookings/fetchPast/fulfilled",
			payload: DUMMY_PAST_BOOKINGS_FETCHED,
		});
	};
// End Placeholder

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const authUser = useSelector((state: RootState) => state.auth.user);
	const { userDocuments, isLoadingUserDocs, errorUserDocs } = useSelector(
		(state: RootState) => state.documents
	);

	// Placeholder state for past bookings (replace with selector from a real slice)
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

	useEffect(() => {
		if (authUser) {
			setUserProfile({
				fullName: authUser.fullName,
				email: authUser.email,
				profileImageUrl: (authUser as any).profileImageUrl, // Assuming your Redux User type might have this
			});
			dispatch(fetchUserDocumentsThunk());

			// Simulate dispatching and handling for past bookings
			const loadPastBookings = async () => {
				setIsLoadingPastBookings(true);
				setErrorPastBookings(null);
				// This is where you would dispatch your actual thunk
				// const resultAction = await dispatch(fetchUserPastBookingsThunk());
				// if (fetchUserPastBookingsThunk.fulfilled.match(resultAction)) {
				// setPastBookings(resultAction.payload as PastBooking[]); // Adjust payload structure
				// } else if (fetchUserPastBookingsThunk.rejected.match(resultAction)) {
				// setErrorPastBookings(resultAction.payload as string);
				// }
				// Using placeholder:
				await dispatch(fetchUserPastBookingsThunkPlaceholder() as any);
				// Simulate getting data from a hypothetical slice:
				// For now, directly setting based on placeholder thunk simulation
				const DUMMY_PAST_BOOKINGS_FETCHED: PastBooking[] = [
					{
						id: "pb1",
						bikeName: "City Cruiser DB",
						bikeImageUrl:
							"https://via.placeholder.com/150x100.png?text=City+Cruiser+DB",
						rentalDates: "May 20 - May 21",
						status: "Completed",
					},
					{
						id: "pb2",
						bikeName: "Adventure Pro DB",
						bikeImageUrl:
							"https://via.placeholder.com/150x100.png?text=Adv+Pro+DB",
						rentalDates: "Apr 15 - Apr 16",
						status: "Completed",
					},
				];
				setPastBookings(DUMMY_PAST_BOOKINGS_FETCHED);

				setIsLoadingPastBookings(false);
			};
			loadPastBookings();
		} else {
			// Handle user not being authenticated (e.g., redirect or show limited profile)
			setUserProfile(null);
			setPastBookings([]);
		}
	}, [authUser, dispatch]);

	useEffect(() => {
		// Derive document status from fetched userDocuments
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
				setDocumentStatus("Pending Review"); // If one side is there but not yet reviewed fully
			} else {
				setDocumentStatus("Not Uploaded");
			}
		} else if (!isLoadingUserDocs && userDocuments.length === 0) {
			setDocumentStatus("Not Uploaded");
		}
	}, [userDocuments, isLoadingUserDocs]);

	const handleEditProfile = () => navigation.navigate("EditProfile");

	const handleUploadDocument = () => {
		// Navigate to DocumentUploadScreen within the ProfileStack
		navigation.navigate("DocumentUploadScreen", {
			isVerificationRequired: true, // Example param
		});
	};

	const handleViewAllBookings = () => navigation.navigate("MyRentalsScreen");

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

	const getStatusIndicatorColor = () => {
		// ... (keep as is)
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

	if (
		!authUser &&
		!useSelector((state: RootState) => state.auth.isRestoringToken)
	) {
		// This case might be hit if restoreToken finishes and finds no user,
		// AppNavigator should ideally handle redirect to Auth flow.
		// For safety, can show a minimal message or redirect.
		return (
			<View style={styles.centered}>
				<Text>Please log in to view your profile.</Text>
				{/* Optionally a button to navigate to Login */}
			</View>
		);
	}
	if (!userProfile) {
		// Still waiting for authUser to populate from Redux
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
			<View style={styles.profileHeaderSection}>
				<TouchableOpacity
					onPress={handleEditProfile}
					style={styles.profileImageContainer}>
					<Image
						source={
							userProfile.profileImageUrl
								? { uri: userProfile.profileImageUrl }
								: require("../../../../assets/images/icon.png")
						}
						style={styles.profileImage}
					/>
					<View style={styles.editIconContainer}>
						<Text style={styles.editIcon}>
							<MaterialIcons
								name="edit"
								size={10}
								color="black"
							/>
						</Text>
					</View>
				</TouchableOpacity>
				<Text style={styles.userName}>{userProfile.fullName}</Text>
				<Text style={styles.userEmail}>{userProfile.email}</Text>
			</View>

			<View style={styles.cardSection}>
				<Text style={styles.cardTitle}>ID Document Status</Text>
				{isLoadingUserDocs ? (
					<ActivityIndicator color={colors.primary} />
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
							style={styles.documentButton}
							textStyle={styles.documentButtonText}
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
					<ActivityIndicator color={colors.primary} />
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
									navigation.navigate("RideDetailsScreen", {
										bookingId: item.id,
									})
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
					iconName="key"
					onPress={() => navigation.navigate("ChangePasswordScreen")}
				/>
				<SettingListItem
					label="Notification Preferences"
					iconName="notifications"
					onPress={() =>
						navigation.navigate("NotificationPreferencesScreen")
					}
				/>
				<SettingListItem
					label="Help & Support"
					iconName="info"
					onPress={() => navigation.navigate("ContactSupportScreen")}
				/>
			</View>

			<View style={styles.logoutButtonContainer}>
				<PrimaryButton
					title="Logout"
					onPress={handleLogout}
					iconLeft={
						<MaterialIcons
							name="logout" // Or "exit-to-app"
							size={iconSize}
							color={iconColor}
							style={{ marginRight: spacing.s }} // Keep or adjust marginRight as needed
						/>
					}
				/>
			</View>
		</ScrollView>
	);
};

// Styles
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.backgroundMain || "#F7F7F7" },
	contentContainer: { paddingBottom: spacing.xxl },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	errorText: {
		color: colors.error,
		textAlign: "center",
		marginTop: spacing.s,
	},
	noItemsText: {
		color: colors.textMedium,
		textAlign: "center",
		marginVertical: spacing.m,
	},
	profileHeaderSection: {
		alignItems: "center",
		paddingVertical: spacing.l,
		backgroundColor: colors.white,
		marginBottom: spacing.m,
	},
	profileImageContainer: { position: "relative", marginBottom: spacing.s },
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
	editIcon: { fontSize: 16 },
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
		backgroundColor: colors.primary,
		paddingVertical: spacing.s,
	},
	documentButtonText: { fontSize: typography.fontSizes.s },
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
	},
	viewAllLink: {
		fontSize: typography.fontSizes.s,
		color: colors.primary,
		fontWeight: typography.fontWeights.medium,
	},
	horizontalListContent: { paddingTop: spacing.xs },
	pastBookingCard: {
		width: 180,
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
	settingsMenuSection: { marginTop: spacing.xs },
	settingListItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.l - 2,
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
		color: colors.borderDefault,
	},
	logoutButtonContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.l,
		paddingBottom: spacing.m,
	},
});

export default ProfileScreen;
