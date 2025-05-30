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
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../components/common/PrimaryButton";
import { User } from "../../store/slices/authSlice"; // This is the TYPE import
import {
	FetchUsersParamsOwner,
	clearOwnerUserManagementErrors,
	fetchUsersForOwnerThunk,
	setCurrentFilters,
	updateUserRoleByOwnerThunk,
} from "../../store/slices/ownerUserManagementSlice"; // Ensure this path is correct
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

// ... (UserCard component definition) ...
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
						{item.fullName.substring(0, 1).toUpperCase()}
					</Text>
				</View>
				<View style={styles.userDetails}>
					<Text style={styles.userName} numberOfLines={1}>
						{item.fullName}
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
					<Text style={styles.actionButtonText}>Edit Role</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const RoleManagementScreen: React.FC<RoleManagementScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		users, // <<< THIS MUST BE 'users' (lowercase)
		pagination,
		isLoading,
		error,
		isUpdatingRole,
		updateRoleError,
		currentFilters,
	} = useSelector((state: RootState) => state.ownerUserManagement); // Ensure this slice exists in RootState

	// ... (rest of your component logic from the previous correct version)
	const [localSearchQuery, setLocalSearchQuery] = useState(
		currentFilters?.search || "" // Add nullish coalescing for safety if currentFilters can be undefined initially
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

	// Debounce search query
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchQuery(localSearchQuery);
		}, 500);
		return () => clearTimeout(handler);
	}, [localSearchQuery]);

	// Effect to update filters in Redux store
	useEffect(() => {
		const newFilters: FetchUsersParamsOwner = {
			page: 1,
			limit: currentFilters?.limit || 15,
			search: debouncedSearchQuery.trim() || undefined,
			role: selectedRoleFilter === "all" ? undefined : selectedRoleFilter,
		};
		// Only dispatch if filters actually change to avoid potential loops
		if (
			JSON.stringify(newFilters) !==
			JSON.stringify({
				...(currentFilters || {}),
				page: 1,
				limit: currentFilters?.limit || 15,
			})
		) {
			dispatch(setCurrentFilters(newFilters));
		}
	}, [
		debouncedSearchQuery,
		selectedRoleFilter,
		dispatch,
		currentFilters?.limit,
	]);

	const loadUsers = useCallback(
		(pageToLoad: number) => {
			// Ensure currentFilters is defined before spreading
			if (currentFilters) {
				dispatch(
					fetchUsersForOwnerThunk({
						...currentFilters,
						page: pageToLoad,
					})
				);
			} else {
				// Fallback or initial fetch if currentFilters is not yet set (should be set by setCurrentFilters)
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
		[dispatch, currentFilters, selectedRoleFilter, debouncedSearchQuery]
	); // currentFilters will change, triggering the next useEffect

	// Effect to fetch users whenever currentFilters from Redux changes
	useEffect(() => {
		if (currentFilters) {
			// Ensure currentFilters is defined
			loadUsers(currentFilters.page || 1);
		}
	}, [currentFilters, loadUsers]); // loadUsers is memoized

	useLayoutEffect(() => {
		navigation.setOptions({ title: "User Role Management" });
		return () => {
			dispatch(clearOwnerUserManagementErrors());
		};
	}, [navigation, dispatch]);

	const handleEditRolePress = (user: UserListItemDisplay) => {
		setSelectedUserForRoleChange(user);
		setNewRoleForSelectedUser(user.role as "User" | "Owner" | "Admin");
		setIsRoleModalVisible(true);
	};

	const handleConfirmRoleChange = async () => {
		if (!selectedUserForRoleChange || !newRoleForSelectedUser) return;
		if (selectedUserForRoleChange.role === newRoleForSelectedUser) {
			setIsRoleModalVisible(false);
			return;
		}
		Keyboard.dismiss();
		try {
			await dispatch(
				updateUserRoleByOwnerThunk({
					userId: selectedUserForRoleChange.id,
					newRole: newRoleForSelectedUser,
				})
			).unwrap();
			Alert.alert(
				"Success",
				`Role for ${selectedUserForRoleChange.fullName} updated to ${newRoleForSelectedUser}.`
			);
			setIsRoleModalVisible(false);
			setSelectedUserForRoleChange(null);
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
			// Add optional chaining for users
			...user,
			registrationDateFormatted: user.createdAt
				? new Date(user.createdAt).toLocaleDateString()
				: "N/A",
		})) || []; // Default to empty array if users is undefined

	const handleLoadMore = () => {
		if (
			pagination &&
			currentFilters?.page &&
			currentFilters.page < pagination.totalPages &&
			!isLoading
		) {
			const nextPage = currentFilters.page + 1;
			dispatch(setCurrentFilters({ ...currentFilters, page: nextPage }));
		}
	};
	const onRefresh = () => {
		if (currentFilters) {
			dispatch(setCurrentFilters({ ...currentFilters, page: 1 }));
		} else {
			// Fallback if currentFilters somehow not set
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
					placeholderTextColor={colors.textPlaceholder}
					returnKeyType="search"
					onBlur={() => setDebouncedSearchQuery(localSearchQuery)}
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
						prompt="Filter by Role">
						<Picker.Item label="All Roles" value="all" />
						<Picker.Item label="Regular Users" value="User" />
						<Picker.Item label="Owners" value="Owner" />
						<Picker.Item label="Administrators" value="Admin" />
					</Picker>
				</View>
			</View>

			{error && (
				<Text style={styles.errorText}>
					Error fetching users: {error}
				</Text>
			)}

			<FlatList
				data={mappedUsers}
				renderItem={({ item }) => (
					<UserCard item={item} onEditRole={handleEditRolePress} />
				)}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContentContainer}
				showsVerticalScrollIndicator={false}
				onRefresh={onRefresh}
				refreshing={isLoading && (currentFilters?.page || 1) === 1}
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
							<Text style={styles.emptyListText}>
								No users found.
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
					onPress={() => setIsRoleModalVisible(false)}>
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
							<PrimaryButton
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
								textStyle={styles.modalButtonText}
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

// Styles (Keep your existing styles)
const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F4F6F8",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	loadingText: { marginTop: spacing.s, color: colors.textMedium },
	filterContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
		paddingBottom: spacing.s,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#E0E0E0",
	},
	searchInput: {
		backgroundColor: colors.backgroundLight,
		paddingHorizontal: spacing.m,
		paddingVertical: Platform.OS === "ios" ? spacing.m - 2 : spacing.s,
		borderRadius: borderRadius.m,
		fontSize: typography.fontSizes.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#DDD",
		color: colors.textPrimary,
	},
	pickerWrapper: {
		backgroundColor: colors.backgroundLight,
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#DDD",
		height: Platform.OS === "ios" ? undefined : 50,
		justifyContent: "center",
	},
	rolePicker: {
		height: Platform.OS === "ios" ? 120 : 50,
		width: "100%",
		color: colors.textPrimary,
	},
	listContentContainer: { padding: spacing.m, flexGrow: 1 },
	userCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 3,
	},
	userInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	avatarPlaceholder: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.primaryVeryLight,
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
	},
	avatarText: {
		fontSize: typography.fontSizes.l,
		color: colors.primary,
		fontWeight: "bold",
	},
	userDetails: { flex: 1 },
	userName: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	userEmail: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	userMeta: { fontSize: typography.fontSizes.xs, color: colors.textMedium },
	userRoleText: {
		fontWeight: typography.fontWeights.semiBold,
		color: colors.primaryDark,
	},
	userActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		borderTopWidth: 1,
		borderTopColor: colors.borderLight || "#EEEEEE",
		paddingTop: spacing.m,
		marginTop: spacing.m,
	},
	actionButton: {
		paddingVertical: spacing.xs + 2,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		backgroundColor: colors.primary,
	},
	actionButtonText: {
		color: colors.white,
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
	},
	errorText: {
		color: colors.error,
		textAlign: "center",
		margin: spacing.m,
		fontSize: typography.fontSizes.m,
	},
	errorTextModal: {
		color: colors.error,
		textAlign: "center",
		marginTop: spacing.s,
		fontSize: typography.fontSizes.s,
	},
	emptyListText: {
		textAlign: "center",
		color: colors.textMedium,
		marginTop: spacing.xl,
		fontSize: typography.fontSizes.m,
		fontStyle: "italic",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	modalContent: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.xl,
		padding: spacing.l,
		width: "90%",
		maxWidth: 400,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		marginBottom: spacing.s,
		textAlign: "center",
		color: colors.textPrimary,
	},
	modalCurrentRole: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	modalPickerContainer: {
		borderWidth: 1,
		borderColor: colors.borderDefault,
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
		height: Platform.OS === "ios" ? undefined : 50,
		justifyContent: "center",
	},
	modalPicker: {
		height: Platform.OS === "ios" ? 150 : 50,
		width: "100%",
		color: colors.textPrimary,
	},
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: spacing.s,
	},
	modalButtonBase: {
		flex: 1,
		borderRadius: borderRadius.m,
		paddingVertical: spacing.m,
		alignItems: "center",
	},
	modalButtonCancel: {
		backgroundColor: colors.greyLight,
		marginRight: spacing.s,
		borderWidth: 1,
		borderColor: colors.greyMedium,
	},
	modalButtonSave: { backgroundColor: colors.primary, marginLeft: spacing.s },
	modalButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeights.bold,
		fontSize: typography.fontSizes.m,
	},
	modalButtonTextCancel: {
		color: colors.textSecondary,
		fontWeight: typography.fontWeights.bold,
		fontSize: typography.fontSizes.m,
	},
});

export default RoleManagementScreen;
