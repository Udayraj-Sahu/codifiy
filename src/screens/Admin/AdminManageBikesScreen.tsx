// src/screens/Admin/AdminManageBikesScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../components/common/PrimaryButton";
import { AdminStackParamList } from "../../navigation/types";
import { Bike, fetchAdminBikes } from "../../store/slices/adminBikeSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

interface BikeAdminCardData {
	id: string;
	name: string;
	pricePerDay: string;
	status:
		| "Available"
		| "Rented"
		| "Under Maintenance"
		| "Unavailable"
		| "Unknown";
	location: string;
	imageUrl: string;
}

// Dummy API for delete, replace with Redux thunk
const deleteAdminBikeAPI = async (
	bikeId: string
): Promise<{ success: boolean; message?: string }> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log(`Bike ${bikeId} would be deleted. (Simulated)`);
			resolve({ success: true, message: "Bike deleted (simulated)." });
		}, 500);
	});
};

const AdminBikeCard: React.FC<{
	item: BikeAdminCardData;
	onEdit: (bikeId: string) => void;
	onDelete: (bikeId: string) => void;
	onPressCard: (bikeId: string) => void;
}> = ({ item, onEdit, onDelete, onPressCard }) => {
	const bikeImagePlaceholder =
		"https://placehold.co/80x80/1A1A1A/F5F5F5?text=Bike";
	const getStatusStyleInfo = (
		status: BikeAdminCardData["status"]
	): {
		badge: object;
		text: object;
		iconName: keyof typeof MaterialIcons.glyphMap;
	} => {
		switch (status) {
			case "Available":
				return {
					badge: styles.statusBadgeAvailable,
					text: styles.statusTextSemantic,
					iconName: "event-available",
				};
			case "Rented":
				return {
					badge: styles.statusBadgeRented,
					text: styles.statusTextSemantic,
					iconName: "lock-clock",
				};
			case "Under Maintenance":
				return {
					badge: styles.statusBadgeMaintenance,
					text: styles.statusTextSemantic,
					iconName: "build",
				};
			case "Unavailable":
				return {
					badge: styles.statusBadgeUnavailable,
					text: styles.statusTextSemantic,
					iconName: "event-busy",
				};
			default:
				return {
					badge: styles.statusBadgeUnknown,
					text: styles.statusTextMuted,
					iconName: "help-outline",
				};
		}
	};
	const currentStatusInfo = getStatusStyleInfo(item.status);

	return (
		<TouchableOpacity
			style={styles.bikeCardContainer}
			onPress={() => onPressCard(item.id)}
			activeOpacity={0.8}>
			<Image
				source={
					item.imageUrl
						? { uri: item.imageUrl }
						: { uri: bikeImagePlaceholder }
				}
				style={styles.bikeCardImage}
			/>
			<View style={styles.bikeCardDetails}>
				<Text style={styles.bikeCardName} numberOfLines={2}>
					{item.name}
				</Text>
				<Text style={styles.bikeCardPrice}>{item.pricePerDay}</Text>
				<View
					style={[
						styles.bikeCardStatusBadge,
						currentStatusInfo.badge,
					]}>
					<MaterialIcons
						name={currentStatusInfo.iconName}
						size={12}
						color={
							item.status === "Unknown"
								? colors.textSecondary
								: colors.white
						}
						style={{ marginRight: spacing.xs }}
					/>
					<Text
						style={[
							styles.bikeCardStatusText,
							currentStatusInfo.text,
						]}>
						{item.status}
					</Text>
				</View>
				<View style={styles.locationRow}>
					<MaterialIcons
						name="location-pin"
						size={14}
						color={colors.iconDefault}
						style={styles.locationIconThemed}
					/>
					<Text style={styles.bikeCardLocation} numberOfLines={1}>
						{item.location}
					</Text>
				</View>
				<View style={styles.actionsRow}>
					<TouchableOpacity
						onPress={() => onEdit(item.id)}
						style={styles.actionLink}>
						<MaterialIcons
							name="edit"
							size={18}
							color={colors.primary}
							style={styles.actionIconThemed}
						/>
						<Text style={[styles.actionLinkText, styles.editText]}>
							Edit
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => onDelete(item.id)}
						style={styles.actionLink}>
						<MaterialIcons
							name="delete-forever"
							size={18}
							color={colors.error}
							style={styles.actionIconThemed}
						/>
						<Text
							style={[styles.actionLinkText, styles.deleteText]}>
							Delete
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	);
};

type AdminManageBikesScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminManageBikes"
>;
interface AdminManageBikesScreenProps {
	navigation: AdminManageBikesScreenNavigationProp;
}

const AdminManageBikesScreen: React.FC<AdminManageBikesScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		bikes: bikesFromStore,
		isLoading,
		error,
		pagination,
	} = useSelector((state: RootState) => state.adminBikes);

	const [searchQueryInput, setSearchQueryInput] = useState(""); // For the TextInput
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const bikesLimit = 10;

	// Debounce search input
	useEffect(() => {
		const handler = setTimeout(() => {
			if (searchQueryInput !== debouncedSearchQuery) {
				setDebouncedSearchQuery(searchQueryInput);
				setCurrentPage(1); // Reset to page 1 on new search
			}
		}, 500);
		return () => clearTimeout(handler);
	}, [searchQueryInput, debouncedSearchQuery]);

	// Fetch data when debouncedSearchQuery or currentPage changes
	useEffect(() => {
		// This check helps prevent re-fetching if already loading, especially for pagination.
		// For initial load (currentPage=1) or search change (which resets to page 1),
		// we might want to proceed even if isLoading is true to ensure data reflects the new query/filter.
		if (isLoading && currentPage > 1) {
			console.log(
				"AdminManageBikes: Fetch skipped, already loading subsequent page."
			);
			return;
		}

		const params: {
			page: number;
			limit: number;
			sortBy: string;
			model?: string;
		} = {
			page: currentPage,
			limit: bikesLimit,
			sortBy: "createdAt:desc",
		};
		if (debouncedSearchQuery.trim()) {
			params.model = debouncedSearchQuery.trim();
		}
		console.log(
			"AdminManageBikes: Dispatching fetchAdminBikes with params:",
			params
		);
		dispatch(fetchAdminBikes(params));
	}, [dispatch, debouncedSearchQuery, currentPage, bikesLimit]); // isLoading removed from here

	// Handle screen focus to refresh data
	useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			console.log(
				"AdminManageBikes: Screen focused, refreshing to page 1."
			);
			// To ensure a fresh fetch, especially if search query hasn't changed but data might have:
			// Setting currentPage to 1 will trigger the data fetching useEffect if other deps are met.
			// A direct dispatch is more robust for focus refresh.
			setCurrentPage(1); // This should trigger the above useEffect if debouncedSearchQuery is stable
			const params = {
				page: 1,
				limit: bikesLimit,
				sortBy: "createdAt:desc",
				model: debouncedSearchQuery.trim() || undefined,
			};
			dispatch(fetchAdminBikes(params));
		});
		return unsubscribe;
	}, [navigation, dispatch, bikesLimit, debouncedSearchQuery]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					onPress={() => navigation.navigate("AdminBikeForm", {})}
					style={styles.headerAddButton}>
					<MaterialIcons
						name="add"
						size={24}
						color={colors.buttonPrimaryText}
					/>
				</TouchableOpacity>
			),
		});
	}, [navigation]);

	const handleEditBike = (bikeId: string) =>
		navigation.navigate("AdminBikeForm", { bikeId });

	const handleDeleteBike = (bikeId: string) => {
		Alert.alert(
			"Confirm Delete",
			"Are you sure you want to delete this bike?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						// TODO: dispatch(deleteAdminBikeThunk(bikeId)).unwrap();
						const result = await deleteAdminBikeAPI(bikeId);
						if (result.success) {
							Alert.alert(
								"Success",
								result.message || "Bike deleted."
							);
							setCurrentPage(1); // Reset to page 1
							// The useEffect for currentPage/debouncedSearchQuery should trigger a refresh
							// Or explicitly dispatch here if needed:
							dispatch(
								fetchAdminBikes({
									page: 1,
									limit: bikesLimit,
									sortBy: "createdAt:desc",
									model:
										debouncedSearchQuery.trim() ||
										undefined,
								})
							);
						} else {
							Alert.alert(
								"Error",
								result.message || "Failed to delete bike."
							);
						}
					},
				},
			]
		);
	};
	const handleCardPress = (bikeId: string) => handleEditBike(bikeId);

	const transformedBikes: BikeAdminCardData[] = useMemo(
		() =>
			bikesFromStore.map((bike: Bike) => {
				let status: BikeAdminCardData["status"];
				if (bike.isAvailable === true) {
					status = "Available";
				} else if (bike.isUnderMaintenance === true) {
					status = "Under Maintenance";
				} else if (
					bike.isAvailable === false &&
					!bike.isUnderMaintenance
				) {
					status = "Unavailable"; // Or "Rented" if you have that info
				} else {
					status = "Unknown";
				}
				return {
					id: bike._id,
					name: bike.model,
					pricePerDay: `₹${bike.pricePerDay}/day`,
					status: status,
					location: bike.location?.address || "Location N/A",
					imageUrl:
						bike.images && bike.images.length > 0
							? bike.images[0].url
							: "",
				};
			}),
		[bikesFromStore]
	);

	const handleLoadMore = () => {
		if (pagination && currentPage < pagination.totalPages && !isLoading) {
			console.log(
				"AdminManageBikes: Loading more, next page:",
				currentPage + 1
			);
			setCurrentPage((prevPage) => prevPage + 1);
		}
	};

	const onRefresh = () => {
		console.log("AdminManageBikes: Pull to refresh, fetching page 1.");
		setCurrentPage(1); // This will trigger the data fetching useEffect
		// Explicit dispatch for refresh if needed, though the useEffect should handle it.
		// dispatch(fetchAdminBikes({ page: 1, limit: bikesLimit, sortBy: 'createdAt:desc', model: debouncedSearchQuery.trim() || undefined }));
	};

	if (isLoading && transformedBikes.length === 0 && currentPage === 1) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading bikes...</Text>
			</View>
		);
	}
	if (error && transformedBikes.length === 0) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.error}
				/>
				<Text style={styles.errorText}>
					Error fetching bikes: {error}
				</Text>
				<PrimaryButton title="Retry" onPress={onRefresh} />
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			<View style={styles.searchBarWrapper}>
				<View style={styles.searchContainer}>
					<MaterialIcons
						name="search"
						size={22}
						color={colors.iconDefault}
						style={styles.searchIconThemed}
					/>
					<TextInput
						placeholder="Search bikes by model or ID..."
						placeholderTextColor={colors.textPlaceholder}
						style={styles.searchInput}
						value={searchQueryInput} // Use input state here
						onChangeText={setSearchQueryInput} // Update input state
						returnKeyType="search"
					/>
				</View>
			</View>
			<View style={styles.addBikeButtonContainer}>
				<PrimaryButton
					title="Add New Bike"
					onPress={() => navigation.navigate("AdminBikeForm", {})}
					iconLeft={
						<MaterialIcons
							name="add-circle-outline"
							size={20}
							color={colors.buttonPrimaryText}
						/>
					}
				/>
			</View>
			{transformedBikes.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<MaterialIcons
						name="directions-bike"
						size={48}
						color={colors.textDisabled}
					/>
					<Text style={styles.noBikesText}>No bikes found.</Text>
					{!debouncedSearchQuery && ( // Show prompt only if not searching
						<Text style={styles.noBikesSubText}>
							Tap the '+' button or 'Add New Bike' to add bikes.
						</Text>
					)}
				</View>
			) : (
				<FlatList
					data={transformedBikes}
					renderItem={({ item }) => (
						<AdminBikeCard
							item={item}
							onEdit={handleEditBike}
							onDelete={handleDeleteBike}
							onPressCard={handleCardPress}
						/>
					)}
					keyExtractor={(item) => item._id} // Use _id from Bike type
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					onRefresh={onRefresh}
					refreshing={isLoading && currentPage === 1}
					onEndReached={handleLoadMore}
					onEndReachedThreshold={0.5}
					ListFooterComponent={
						isLoading && currentPage > 1 ? (
							<ActivityIndicator
								size="small"
								color={colors.primary}
								style={{ marginVertical: spacing.m }}
							/>
						) : null
					}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain,
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary,
		fontFamily: typography.primaryRegular,
	},
	errorText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	noBikesText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
	},
	noBikesSubText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
		textAlign: "center",
		marginTop: spacing.s,
	},
	headerAddButton: {
		backgroundColor: colors.primary,
		width: 36,
		height: 36,
		borderRadius: borderRadius.circle,
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
	},
	searchBarWrapper: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
		paddingBottom: spacing.xs,
		backgroundColor: colors.backgroundCard,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundInput,
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.s,
		height: 44,
	},
	searchIconThemed: {
		marginRight: spacing.s,
	},
	searchInput: {
		flex: 1,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary,
	},
	addBikeButtonContainer: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		backgroundColor: colors.backgroundCard,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	listContentContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.m,
	},
	bikeCardContainer: {
		flexDirection: "row",
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		alignItems: "flex-start",
	},
	bikeCardImage: {
		width: 80,
		height: 80,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault,
	},
	bikeCardDetails: {
		flex: 1,
	},
	bikeCardName: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.xxs,
	},
	bikeCardPrice: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
		color: colors.primary,
		marginBottom: spacing.xs,
	},
	bikeCardStatusBadge: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.xs,
		borderRadius: borderRadius.pill,
		alignSelf: "flex-start",
		marginBottom: spacing.s,
		flexDirection: "row",
		alignItems: "center",
	},
	bikeCardStatusText: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize",
	},
	statusBadgeAvailable: { backgroundColor: colors.successMuted },
	statusTextAvailable: { color: colors.success },
	statusBadgeRented: { backgroundColor: colors.infoMuted },
	statusTextRented: { color: colors.info },
	statusBadgeMaintenance: { backgroundColor: colors.warningMuted },
	statusTextMaintenance: { color: colors.warning },
	statusBadgeUnavailable: { backgroundColor: colors.errorMuted },
	statusBadgeUnknown: { backgroundColor: colors.backgroundDisabled },
	statusTextMuted: { color: colors.textSecondary },
	statusTextSemantic: { color: colors.white }, // For badges with semantic (non-muted) backgrounds

	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	locationIconThemed: {
		marginRight: spacing.xs,
	},
	bikeCardLocation: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	actionsRow: {
		flexDirection: "row",
		justifyContent: "flex-start",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.s,
		marginTop: spacing.xs,
	},
	actionLink: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: spacing.l,
		paddingVertical: spacing.xxs,
	},
	actionIconThemed: {
		marginRight: spacing.xs - 2,
	},
	actionLinkText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	editText: { color: colors.primary },
	deleteText: { color: colors.error },
});

export default AdminManageBikesScreen;
