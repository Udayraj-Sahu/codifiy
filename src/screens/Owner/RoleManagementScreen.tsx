// src/screens/Owner/RoleManagementScreen.tsx
import { Picker } from "@react-native-picker/picker";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Keyboard,
	Modal,
	Platform,
	RefreshControl,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // For icons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../components/common/PrimaryButton"; // Assumed themed
import { User } from "../../store/slices/authSlice";
import {
	FetchUsersParamsOwner,
	clearOwnerUserManagementErrors,
	fetchUsersForOwnerThunk,
	setCurrentFilters,
	updateUserRoleByOwnerThunk,
} from "../../store/slices/ownerUserManagementSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

interface UserListItemDisplay extends User {
	registrationDateFormatted: string;
}

const UserCard: React.FC<{
	item: UserListItemDisplay;
	onEditRole: (user: UserListItemDisplay) => void;
}> = ({ item, onEditRole }) => {
	return (
		<View style={styles.userCard}>
			<View style={styles.userInfoRow}>
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>
						{item.fullName
							? item.fullName.substring(0, 1).toUpperCase()
							: "U"}
					</Text>
				</View>
				<View style={styles.userDetails}>
					<Text style={styles.userName} numberOfLines={1}>
						{item.fullName || "N/A"}
					</Text>
					<Text style={styles.userEmail} numberOfLines={1}>
						{item.email}
					</Text>
					<Text style={styles.userMeta}>
						Role:{" "}
						<Text style={styles.userRoleText}>{item.role}</Text>
					</Text>
					<Text style={styles.userMeta}>
						Joined: {item.registrationDateFormatted}
					</Text>
				</View>
			</View>
			<View style={styles.userActions}>
				<TouchableOpacity
					style={styles.actionButton}
					onPress={() => onEditRole(item)}>
					<MaterialIcons
						name="edit"
						size={16}
						color={colors.buttonPrimaryText}
						style={{ marginRight: spacing.xs }}
					/>
					<Text style={styles.actionButtonText}>Edit Role</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

// Props for RoleManagementScreen are not explicitly defined, assuming navigation is passed
interface RoleManagementScreenProps {
	navigation: any; // Replace 'any' with specific navigation prop type if available
}

const RoleManagementScreen: React.FC<RoleManagementScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		users,
		pagination,
		isLoading,
		error,
		isUpdatingRole,
		updateRoleError,
		currentFilters,
	} = useSelector((state: RootState) => state.ownerUserManagement);

	const [localSearchQuery, setLocalSearchQuery] = useState(
		currentFilters?.search || ""
	);
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
		currentFilters?.search || ""
	);
	const [selectedRoleFilter, setSelectedRoleFilter] = useState<
		"all" | "User" | "Owner" | "Admin"
	>(currentFilters?.role || "all");
	const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
	const [selectedUserForRoleChange, setSelectedUserForRoleChange] =
		useState<UserListItemDisplay | null>(null);
	const [newRoleForSelectedUser, setNewRoleForSelectedUser] = useState<
		"User" | "Owner" | "Admin"
	>("User");

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchQuery(localSearchQuery);
		}, 500);
		return () => clearTimeout(handler);
	}, [localSearchQuery]);

	useEffect(() => {
		const newFilters: FetchUsersParamsOwner = {
			page: 1, // Always reset to page 1 when filters change
			limit: currentFilters?.limit || 15,
			search: debouncedSearchQuery.trim() || undefined,
			role: selectedRoleFilter === "all" ? undefined : selectedRoleFilter,
		};
		// Only dispatch if filters actually change to avoid potential loops
		if (
			JSON.stringify(newFilters) !==
			JSON.stringify({ ...currentFilters, page: 1 })
		) {
			dispatch(setCurrentFilters(newFilters));
		}
	}, [debouncedSearchQuery, selectedRoleFilter, dispatch, currentFilters]);

	const loadUsers = useCallback(
		(pageToLoad: number, isRefreshing = false) => {
			if (currentFilters) {
				if (
					!isRefreshing &&
					isLoading &&
					(currentFilters.page || 1) === pageToLoad
				)
					return; // Avoid re-fetch if already loading same page
				dispatch(
					fetchUsersForOwnerThunk({
						...currentFilters,
						page: pageToLoad,
					})
				);
			} else {
				// Fallback if currentFilters is somehow not set (should be initialized)
				dispatch(
					fetchUsersForOwnerThunk({
						page: pageToLoad,
						limit: 15,
						role:
							selectedRoleFilter === "all"
								? undefined
								: selectedRoleFilter,
						search: debouncedSearchQuery.trim() || undefined,
					})
				);
			}
		},
		[
			dispatch,
			currentFilters,
			isLoading,
			selectedRoleFilter,
			debouncedSearchQuery,
		]
	); // Added isLoading to deps

	useEffect(() => {
		if (currentFilters) {
			loadUsers(currentFilters.page || 1);
		}
	}, [currentFilters]); // Removed loadUsers from here to break potential loop

	useLayoutEffect(() => {
		navigation.setOptions({ title: "User Role Management" });
		return () => {
			dispatch(clearOwnerUserManagementErrors());
		};
	}, [navigation, dispatch]);

	const handleEditRolePress = (user: UserListItemDisplay) => {
		setSelectedUserForRoleChange(user);
		setNewRoleForSelectedUser(user.role as "User" | "Owner" | "Admin"); // Pre-fill with current role
		setIsRoleModalVisible(true);
	};

	const handleConfirmRoleChange = async () => {
		if (!selectedUserForRoleChange || !newRoleForSelectedUser) return;
		if (selectedUserForRoleChange.role === newRoleForSelectedUser) {
			setIsRoleModalVisible(false);
			return;
		}
		Keyboard.dismiss();
		console.log("--- Frontend: Preparing to change role ---");
		console.log(
			"Selected User Object:",
			JSON.stringify(selectedUserForRoleChange, null, 2)
		);
		console.log(
			"User ID being sent to thunk:",
			selectedUserForRoleChange._id
		); // <<< CHECK THIS ID (should be _id from Mongoose)
		try {
			await dispatch(
				updateUserRoleByOwnerThunk({
					userId: selectedUserForRoleChange._id, // Use _id from User type
					newRole: newRoleForSelectedUser,
				})
			).unwrap();
			Alert.alert(
				"Success",
				`Role for ${selectedUserForRoleChange.fullName} updated to ${newRoleForSelectedUser}.`
			);
			setIsRoleModalVisible(false);
			setSelectedUserForRoleChange(null);
			// The list will refresh due to `fetchUsersForOwnerThunk` being called on success inside `updateUserRoleByOwnerThunk`
		} catch (rejectedValueOrSerializedError) {
			Alert.alert(
				"Error",
				(rejectedValueOrSerializedError as string) ||
					"Failed to update role."
			);
		}
	};

	const mappedUsers: UserListItemDisplay[] =
		users?.map((user) => ({
			...user,
			registrationDateFormatted: user.createdAt
				? new Date(user.createdAt).toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "short",
						year: "numeric",
				  })
				: "N/A",
		})) || [];

	const handleLoadMore = () => {
		if (
			pagination &&
			currentFilters?.page &&
			currentFilters.page < pagination.totalPages &&
			!isLoading
		) {
			const nextPage = currentFilters.page + 1;
			dispatch(setCurrentFilters({ ...currentFilters, page: nextPage })); // This will trigger useEffect for loadUsers
		}
	};
	const onRefresh = () => {
		if (currentFilters) {
			dispatch(setCurrentFilters({ ...currentFilters, page: 1 }));
		} else {
			dispatch(
				setCurrentFilters({
					page: 1,
					limit: 15,
					role:
						selectedRoleFilter === "all"
							? undefined
							: selectedRoleFilter,
					search: debouncedSearchQuery.trim() || undefined,
				})
			);
		}
	};

	if (
		isLoading &&
		mappedUsers.length === 0 &&
		(currentFilters?.page || 1) === 1
	) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading users...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			<View style={styles.filterContainer}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search by name or email..."
					value={localSearchQuery}
					onChangeText={setLocalSearchQuery}
					placeholderTextColor={colors.textPlaceholder} // Themed placeholder
					returnKeyType="search"
					// onBlur={() => setDebouncedSearchQuery(localSearchQuery)} // Debounce handles this
				/>
				<View style={styles.pickerWrapper}>
					<Picker
						selectedValue={selectedRoleFilter}
						onValueChange={(itemValue) =>
							setSelectedRoleFilter(
								itemValue as "all" | "User" | "Owner" | "Admin"
							)
						}
						style={styles.rolePicker}
						dropdownIconColor={colors.iconDefault} // For Android dropdown arrow
						prompt="Filter by Role">
						<Picker.Item
							label="All Roles"
							value="all"
							color={
								Platform.OS === "ios"
									? colors.textPrimary
									: undefined
							}
						/>
						<Picker.Item
							label="Regular Users"
							value="User"
							color={
								Platform.OS === "ios"
									? colors.textPrimary
									: undefined
							}
						/>
						<Picker.Item
							label="Owners"
							value="Owner"
							color={
								Platform.OS === "ios"
									? colors.textPrimary
									: undefined
							}
						/>
						<Picker.Item
							label="Administrators"
							value="Admin"
							color={
								Platform.OS === "ios"
									? colors.textPrimary
									: undefined
							}
						/>
					</Picker>
				</View>
			</View>

			{error && (
				<View style={styles.errorContainer}>
					<MaterialIcons
						name="error-outline"
						size={20}
						color={colors.error}
						style={{ marginRight: spacing.s }}
					/>
					<Text style={styles.errorText}>
						Error fetching users: {error}
					</Text>
				</View>
			)}

			<FlatList
				data={mappedUsers}
				renderItem={({ item }) => (
					<UserCard item={item} onEditRole={handleEditRolePress} />
				)}
				keyExtractor={(item) => item._id} // Use _id from User type
				contentContainerStyle={styles.listContentContainer}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={
							isLoading && (currentFilters?.page || 1) === 1
						}
						onRefresh={onRefresh}
						tintColor={colors.primary} // For iOS
						colors={[colors.primary]} // For Android
					/>
				}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					isLoading && (currentFilters?.page || 1) > 1 ? (
						<ActivityIndicator
							style={{ marginVertical: spacing.m }}
							color={colors.primary}
						/>
					) : null
				}
				ListEmptyComponent={
					!isLoading && !error ? (
						<View style={styles.centered}>
							<MaterialIcons
								name="people-outline"
								size={48}
								color={colors.textDisabled}
							/>
							<Text style={styles.emptyListText}>
								No users found matching your criteria.
							</Text>
						</View>
					) : null
				}
			/>

			<Modal
				animationType="fade"
				transparent={true}
				visible={isRoleModalVisible}
				onRequestClose={() => {
					setIsRoleModalVisible(false);
					setSelectedUserForRoleChange(null);
				}}>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPressOut={() => setIsRoleModalVisible(false)}>
					<TouchableOpacity
						style={styles.modalContent}
						activeOpacity={1}
						onPress={Keyboard.dismiss}>
						<Text style={styles.modalTitle}>
							Change Role: {selectedUserForRoleChange?.fullName}
						</Text>
						<Text style={styles.modalCurrentRole}>
							Current: {selectedUserForRoleChange?.role}
						</Text>
						<View style={styles.modalPickerContainer}>
							<Picker
								selectedValue={newRoleForSelectedUser}
								onValueChange={(itemValue) =>
									setNewRoleForSelectedUser(
										itemValue as "User" | "Owner" | "Admin"
									)
								}
								style={styles.modalPicker}
								itemStyle={
									Platform.OS === "ios"
										? styles.modalPickerItemIOS
										: {}
								} // For iOS item text color
								dropdownIconColor={colors.iconDefault}
								prompt="Select New Role">
								<Picker.Item label="Set as User" value="User" />
								<Picker.Item
									label="Set as Owner"
									value="Owner"
								/>
								<Picker.Item
									label="Set as Admin"
									value="Admin"
								/>
							</Picker>
						</View>
						<View style={styles.modalButtonRow}>
							<TouchableOpacity
								style={[
									styles.modalButtonBase,
									styles.modalButtonCancel,
								]}
								onPress={() => {
									setIsRoleModalVisible(false);
									setSelectedUserForRoleChange(null);
								}}>
								<Text style={styles.modalButtonTextCancel}>
									Cancel
								</Text>
							</TouchableOpacity>
							<PrimaryButton // Assumed themed
								title={
									isUpdatingRole ? "Saving..." : "Save Role"
								}
								onPress={handleConfirmRoleChange}
								isLoading={isUpdatingRole}
								disabled={
									isUpdatingRole ||
									selectedUserForRoleChange?.role ===
										newRoleForSelectedUser
								}
								style={[
									styles.modalButtonBase,
									styles.modalButtonSave,
								]}
								textStyle={styles.modalButtonTextSave} // Ensure this contrasts with primary bg
							/>
						</View>
						{updateRoleError && (
							<Text style={styles.errorTextModal}>
								Error: {updateRoleError}
							</Text>
						)}
					</TouchableOpacity>
				</TouchableOpacity>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary, // Muted light text
		fontFamily: typography.primaryRegular,
	},
	filterContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
		paddingBottom: spacing.s,
		backgroundColor: colors.backgroundCard, // Dark card background for filters
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault, // Themed border
	},
	searchInput: {
		backgroundColor: colors.backgroundInput, // Specific input background
		paddingHorizontal: spacing.m,
		paddingVertical: Platform.OS === "ios" ? spacing.m - 2 : spacing.s + 2,
		borderRadius: borderRadius.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		color: colors.textPrimary, // Light text for input
	},
	pickerWrapper: {
		backgroundColor: colors.backgroundInput, // Specific input background
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		height: Platform.OS === "ios" ? undefined : 50, // Android needs explicit height for Picker parent
		justifyContent: "center",
	},
	rolePicker: {
		// For both iOS and Android Picker style
		height: Platform.OS === "ios" ? 120 : 50, // iOS picker needs more height for wheel
		width: "100%",
		color: colors.textPrimary, // Light text for selected item
	},
	listContentContainer: {
		padding: spacing.m,
		flexGrow: 1,
	},
	userCard: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		borderWidth: 1, // Optional subtle border
		borderColor: colors.borderDefault,
	},
	userInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	avatarPlaceholder: {
		width: 48,
		height: 48,
		borderRadius: borderRadius.circle, // Circular
		backgroundColor: colors.primaryMuted, // Muted primary for avatar bg
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
	},
	avatarText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.primary, // Brighter primary for avatar text
	},
	userDetails: { flex: 1 },
	userName: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
	},
	userEmail: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	userMeta: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // More muted for meta info
	},
	userRoleText: {
		fontFamily: typography.primarySemiBold,
		color: colors.primary, // Accent color for role
	},
	userActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		borderTopWidth: StyleSheet.hairlineWidth, // Thinner border
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.m,
		marginTop: spacing.m,
	},
	actionButton: {
		// For TouchableOpacity acting as a button
		paddingVertical: spacing.s, // Smaller padding
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		backgroundColor: colors.primary, // Themed primary color
		flexDirection: "row",
		alignItems: "center",
	},
	actionButtonText: {
		color: colors.buttonPrimaryText, // Text color for primary button
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	errorContainer: {
		// Container for error message + icon
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s,
		// backgroundColor: colors.errorMuted, // Optional background for error section
		// borderRadius: borderRadius.m,
		// marginVertical: spacing.s,
	},
	errorText: {
		color: colors.textError,
		// textAlign: "center", // Not needed if in flex row
		// margin: spacing.m,
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
	},
	errorTextModal: {
		color: colors.textError,
		textAlign: "center",
		marginTop: spacing.s,
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
	},
	emptyListText: {
		textAlign: "center",
		color: colors.textSecondary, // Muted light text
		marginTop: spacing.xl,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.7)", // Darker overlay
	},
	modalContent: {
		backgroundColor: colors.backgroundCard, // Dark card background for modal
		borderRadius: borderRadius.xl,
		padding: spacing.l,
		width: "90%",
		maxWidth: 400,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	modalTitle: {
		fontSize: typography.fontSizes.xl,
		fontFamily: typography.primaryBold,
		marginBottom: spacing.s,
		textAlign: "center",
		color: colors.textPrimary, // Light text
	},
	modalCurrentRole: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
		textAlign: "center",
		marginBottom: spacing.m,
	},
	modalPickerContainer: {
		borderWidth: 1,
		borderColor: colors.borderDefault, // Themed border
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
		backgroundColor: colors.backgroundInput, // Input background for picker container
		height: Platform.OS === "ios" ? undefined : 50,
		justifyContent: "center",
	},
	modalPicker: {
		// For both iOS and Android Picker style
		height: Platform.OS === "ios" ? 180 : 50, // iOS picker needs more height
		width: "100%",
		color: colors.textPrimary, // Light text for selected item
	},
	modalPickerItemIOS: {
		// Specific style for iOS Picker items
		color: colors.textPrimary, // Ensure iOS picker items are light
		// backgroundColor: colors.backgroundCard, // This might not work as expected for item bg
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: spacing.s,
	},
	modalButtonBase: {
		// Base for PrimaryButton and TouchableOpacity
		flex: 1,
		borderRadius: borderRadius.m,
		paddingVertical: spacing.m,
		alignItems: "center",
	},
	modalButtonCancel: {
		// For TouchableOpacity
		backgroundColor: colors.backgroundCardOffset, // Slightly different dark shade for cancel
		marginRight: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	modalButtonSave: {
		// For PrimaryButton instance
		backgroundColor: colors.primary, // PrimaryButton handles its own color
		marginLeft: spacing.s,
	},
	modalButtonTextSave: {
		// For text within PrimaryButton if it accepts textStyle prop
		color: colors.buttonPrimaryText,
		fontFamily: typography.primaryBold,
		fontSize: typography.fontSizes.m,
	},
	modalButtonTextCancel: {
		color: colors.textSecondary, // Muted light text for cancel
		fontFamily: typography.primaryBold,
		fontSize: typography.fontSizes.m,
	},
});

export default RoleManagementScreen;
