// src/screens/Owner/DocumentApprovalListScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
	RefreshControl, // Added for pull-to-refresh
	ScrollView,
	// ScrollView, // ScrollView for filter tabs is still used
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux";
import {
	DocumentStatusOwner,
	OwnerStackParamList,
} from "../../navigation/types";
import {
	fetchDocumentsForReviewThunk,
	FetchDocumentsParamsAdminOwner,
	Document as StoreDocument,
	updateDocumentStatusThunk,
} from "../../store/slices/documentSlice";
import { AppDispatch, RootState } from "../../store/store";
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Types ---
interface DocumentForApprovalItem {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	documentType: string;
	docIconName: keyof typeof MaterialIcons.glyphMap; // For MaterialIcons
	submittedDate: string;
	status: Exclude<DocumentStatusOwner, "all">;
	documentImageUrl?: string;
}

// --- Reusable Components (Themed) ---
interface FilterPillButtonProps {
	label: string;
	isActive: boolean;
	onPress: () => void;
}
const FilterPillButton: React.FC<FilterPillButtonProps> = ({
	label,
	isActive,
	onPress,
}) => (
	<TouchableOpacity
		style={[styles.filterPill, isActive && styles.filterPillActive]}
		onPress={onPress}
		activeOpacity={0.7}>
		<Text
			style={[
				styles.filterPillText,
				isActive && styles.filterPillTextActive,
			]}>
			{label}
		</Text>
	</TouchableOpacity>
);

interface OwnerDocumentCardProps {
	item: DocumentForApprovalItem;
	onView: () => void;
	onApprove: () => void;
	onReject: () => void;
}
const OwnerDocumentCard: React.FC<OwnerDocumentCardProps> = ({
	item,
	onView,
	onApprove,
	onReject,
}) => {
	const statusStylesConfig: Record<
		Exclude<DocumentStatusOwner, "all">,
		{
			badge: object;
			text: object;
			iconName: keyof typeof MaterialIcons.glyphMap;
			iconColor: string;
		}
	> = {
		approved: {
			badge: styles.statusBadgeApproved,
			text: styles.statusTextApproved,
			iconName: "check-circle",
			iconColor: colors.success,
		},
		pending: {
			badge: styles.statusBadgePending,
			text: styles.statusTextPending,
			iconName: "hourglass-empty",
			iconColor: colors.warning,
		},
		rejected: {
			badge: styles.statusBadgeRejected,
			text: styles.statusTextRejected,
			iconName: "cancel",
			iconColor: colors.error,
		},
	};
	const currentStatusStyle = statusStylesConfig[item.status] || {
		badge: {},
		text: {},
		iconName: "help-outline",
		iconColor: colors.textSecondary,
	};

	return (
		<View style={styles.documentCard}>
			<View style={styles.cardHeader}>
				<View style={styles.userInfo}>
					<Text style={styles.userNameText} numberOfLines={1}>
						{item.userName}
					</Text>
					<Text style={styles.userEmailText} numberOfLines={1}>
						{item.userEmail}
					</Text>
				</View>
				<View style={[styles.statusBadge, currentStatusStyle.badge]}>
					<MaterialIcons
						name={currentStatusStyle.iconName}
						size={12}
						color={currentStatusStyle.iconColor}
						style={{ marginRight: spacing.xs }}
					/>
					<Text
						style={[
							styles.statusBadgeText,
							currentStatusStyle.text,
						]}>
						{item.status.charAt(0).toUpperCase() +
							item.status.slice(1)}
					</Text>
				</View>
			</View>
			<View style={styles.documentTypeRow}>
				<MaterialIcons
					name={item.docIconName}
					size={20}
					color={colors.iconDefault}
					style={styles.documentTypeIconThemed}
				/>
				<Text style={styles.documentTypeText}>{item.documentType}</Text>
			</View>
			<View style={styles.timestampRow}>
				<MaterialIcons
					name="schedule"
					size={16}
					color={colors.iconDefault}
					style={styles.timestampIconThemed}
				/>
				<Text style={styles.timestampText}>{item.submittedDate}</Text>
			</View>
			<View style={styles.cardActions}>
				<TouchableOpacity style={styles.viewButton} onPress={onView}>
					<MaterialIcons
						name="visibility"
						size={16}
						color={colors.buttonPrimaryText}
						style={{ marginRight: spacing.xs }}
					/>
					<Text style={styles.viewButtonText}>View</Text>
				</TouchableOpacity>
				{item.status === "pending" && (
					<View style={styles.approvalActions}>
						<TouchableOpacity
							style={[
								styles.actionButtonBase,
								styles.rejectButton,
							]}
							onPress={onReject}>
							<MaterialIcons
								name="thumb-down-alt"
								size={16}
								color={colors.error}
								style={{ marginRight: spacing.xs }}
							/>
							<Text
								style={[
									styles.actionButtonTextBase,
									styles.rejectButtonText,
								]}>
								Reject
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.actionButtonBase,
								styles.approveButton,
							]}
							onPress={onApprove}>
							<MaterialIcons
								name="thumb-up-alt"
								size={16}
								color={colors.success}
								style={{ marginRight: spacing.xs }}
							/>
							<Text
								style={[
									styles.actionButtonTextBase,
									styles.approveButtonText,
								]}>
								Approve
							</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</View>
	);
};

type ScreenNavigationProp = StackNavigationProp<
	OwnerStackParamList,
	"DocumentApprovalListScreen"
>;
type ScreenRouteProp = RouteProp<
	OwnerStackParamList,
	"DocumentApprovalListScreen"
>;

interface DocumentApprovalListScreenProps {
	navigation: ScreenNavigationProp;
	route: ScreenRouteProp;
}

const DocumentApprovalListScreen: React.FC<DocumentApprovalListScreenProps> = ({
	route,
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		reviewDocuments,
		isLoadingReviewDocs: isLoading,
		pagination,
		errorReviewDocs: error,
	} = useSelector((state: RootState) => state.documents);

	const initialFilterFromRoute = route.params?.filter || "pending";
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<DocumentStatusOwner>(initialFilterFromRoute);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchInput, setShowSearchInput] = useState(false);
	const [currentPage, setCurrentPage] = useState(1); // Local page state for fetching

	const loadDocuments = useCallback(
		(page = 1, isRefreshing = false) => {
			const params: FetchDocumentsParamsAdminOwner = {
				status:
					activeStatusFilter === "all"
						? undefined
						: activeStatusFilter,
				search: searchQuery.trim() || undefined,
				page,
				limit: 10,
			};
			// Prevent re-fetch if already loading the same page unless it's a refresh
			if (!isRefreshing && isLoading && pagination?.currentPage === page)
				return;
			dispatch(fetchDocumentsForReviewThunk(params));
		},
		[dispatch, activeStatusFilter, searchQuery, isLoading, pagination]
	);

	useEffect(() => {
		setCurrentPage(1);
		loadDocuments(1, true); // Force refresh on filter/search change
	}, [activeStatusFilter, searchQuery]); // Removed loadDocuments from deps here

	const handleLoadMore = () => {
		if (pagination && currentPage < pagination.totalPages && !isLoading) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			loadDocuments(nextPage);
		}
	};

	useLayoutEffect(() => {
		const title = `${
			activeStatusFilter.charAt(0).toUpperCase() +
			activeStatusFilter.slice(1)
		} Documents`;
		navigation.setOptions({
			title: title,
			headerTitleAlign: "center",
			headerRight: () => (
				<TouchableOpacity
					onPress={() => setShowSearchInput((prev) => !prev)}
					style={{ marginRight: spacing.m }}>
					<MaterialIcons
						name={showSearchInput ? "close" : "search"}
						size={24}
						color={colors.iconWhite}
					/>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter, showSearchInput, colors.iconWhite]); // Added colors.iconWhite to deps

	const handleViewDocument = useCallback(
		(item: DocumentForApprovalItem) => {
			navigation.navigate("OwnerDocumentViewerScreen", {
				documentId: item.id,
				documentImageUrl: item.documentImageUrl,
				userName: item.userName,
				documentType: item.documentType,
				status: item.status,
			});
		},
		[navigation]
	);

	const handleUpdateStatus = useCallback(
		async (docId: string, newStatus: "approved" | "rejected") => {
			let reasonInput = "";
			if (newStatus === "rejected") {
				const reason = await new Promise<string | undefined>(
					(resolve) => {
						Alert.prompt(
							"Rejection Reason",
							"Please provide a reason for rejection (optional):",
							(text) => resolve(text),
							"plain-text",
							"", // Default value for input
							Platform.OS === "ios" ? undefined : "default" // Keyboard type for Android
						);
					}
				);
				reasonInput = reason || "No reason provided."; // Default reason if none entered
			}

			Alert.alert(
				`Confirm ${
					newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
				}`,
				`Are you sure you want to ${newStatus} this document?${
					newStatus === "rejected" && reasonInput
						? "\nReason: " + reasonInput
						: ""
				}`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text:
							newStatus.charAt(0).toUpperCase() +
							newStatus.slice(1),
						style:
							newStatus === "rejected"
								? "destructive"
								: "default",
						onPress: async () => {
							try {
								await dispatch(
									updateDocumentStatusThunk({
										docId,
										status: newStatus,
										reviewComments: reasonInput,
									})
								).unwrap();
								Alert.alert(
									"Success",
									`Document status updated to ${newStatus}.`
								);
								setCurrentPage(1); // Reset to first page
								loadDocuments(1, true); // Refresh the list
							} catch (updateError: any) {
								Alert.alert(
									"Error",
									updateError ||
										`Failed to update document status.`
								);
							}
						},
					},
				]
			);
		},
		[dispatch, loadDocuments]
	); // loadDocuments is stable due to its own useCallback deps

	const getDocIconName = (
		docType: string
	): keyof typeof MaterialIcons.glyphMap => {
		if (docType.toLowerCase().includes("license")) return "credit-card";
		if (docType.toLowerCase().includes("id_card")) return "badge"; // Example for ID Card
		if (docType.toLowerCase().includes("passport")) return "book"; // Example for Passport
		return "article"; // Default document icon
	};

	const mappedDocuments: DocumentForApprovalItem[] = reviewDocuments.map(
		(doc: StoreDocument): DocumentForApprovalItem => ({
			id: doc._id,
			userId: typeof doc.user === "string" ? doc.user : doc.user._id,
			userName:
				typeof doc.user === "string"
					? "N/A"
					: doc.user.fullName || "N/A",
			userEmail:
				typeof doc.user === "string" ? "N/A" : doc.user.email || "N/A",
			documentType: doc.documentType
				.replace("_", " ")
				.split(" ")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" "),
			docIconName: getDocIconName(doc.documentType),
			submittedDate: new Date(
				doc.uploadedAt || doc.createdAt
			).toLocaleDateString("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}),
			status: doc.status as Exclude<DocumentStatusOwner, "all">, // Assuming status from backend matches
			documentImageUrl: doc.fileUrl,
		})
	);

	const renderDocumentItem = ({
		item,
	}: {
		item: DocumentForApprovalItem;
	}) => (
		<OwnerDocumentCard
			item={item}
			onView={() => handleViewDocument(item)}
			onApprove={() => handleUpdateStatus(item.id, "approved")}
			onReject={() => handleUpdateStatus(item.id, "rejected")}
		/>
	);

	const filterTabs: DocumentStatusOwner[] = [
		"pending",
		"approved",
		"rejected",
		"all",
	];

	if (isLoading && mappedDocuments.length === 0 && currentPage === 1) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading documents...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{showSearchInput && (
				<View style={styles.searchBarContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by user name, email, or doc type..."
						value={searchQuery}
						onChangeText={(text) => {
							setSearchQuery(
								text
							); /* Debounced search in useEffect */
						}}
						placeholderTextColor={colors.textPlaceholder}
						autoFocus
						returnKeyType="search"
					/>
				</View>
			)}
			<View style={styles.filterTabsContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterTabsScroll}>
					{filterTabs.map((tabStatus) => (
						<FilterPillButton
							key={tabStatus}
							label={
								tabStatus.charAt(0).toUpperCase() +
								tabStatus.slice(1)
							}
							isActive={activeStatusFilter === tabStatus}
							onPress={() => {
								setActiveStatusFilter(tabStatus);
							}}
						/>
					))}
				</ScrollView>
			</View>

			{error &&
				!isLoading &&
				mappedDocuments.length === 0 && ( // Show general error if list is empty
					<View style={styles.centered}>
						<MaterialIcons
							name="error-outline"
							size={48}
							color={colors.error}
						/>
						<Text style={styles.errorText}>{error}</Text>
						<PrimaryButton
							title="Retry"
							onPress={() => loadDocuments(1, true)}
						/>
					</View>
				)}

			{!isLoading && mappedDocuments.length === 0 && !error ? (
				<View style={styles.centered}>
					<MaterialIcons
						name="find-in-page"
						size={48}
						color={colors.textDisabled}
					/>
					<Text style={styles.noResultsText}>
						No documents found for "{activeStatusFilter}" status{" "}
						{searchQuery ? `matching "${searchQuery}"` : ""}.
					</Text>
				</View>
			) : (
				<FlatList
					data={mappedDocuments}
					renderItem={renderDocumentItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isLoading && currentPage === 1}
							onRefresh={() => loadDocuments(1, true)}
							tintColor={colors.primary}
							colors={[colors.primary]}
						/>
					}
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
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain, // Dark theme background for centered content
	},
	loadingText: {
		// Added for loading text
		marginTop: spacing.s,
		color: colors.textSecondary,
		fontFamily: typography.primaryRegular,
	},
	errorText: {
		color: colors.textError, // Themed error color
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	searchBarContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.m,
		backgroundColor: colors.backgroundCard, // Dark card background for search
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	searchInput: {
		backgroundColor: colors.backgroundInput, // Specific input background
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		height: 44,
		color: colors.textPrimary, // Light text for input
	},
	filterTabsContainer: {
		paddingLeft: spacing.m, // Only left padding for scroll start
		paddingVertical: spacing.m,
		backgroundColor: colors.backgroundCard, // Dark card background for filters
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	filterTabsScroll: {
		paddingRight: spacing.m, // Ensure last pill has padding
	},
	filterPill: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		backgroundColor: colors.backgroundInput, // Darker unselected pill
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	filterPillActive: {
		backgroundColor: colors.primary, // Primary color for active pill
		borderColor: colors.primary,
	},
	filterPillText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary, // Muted text for inactive
	},
	filterPillTextActive: {
		color: colors.buttonPrimaryText, // Contrasting text for active pill
		fontFamily: typography.primaryBold,
	},
	listContentContainer: {
		padding: spacing.m,
		flexGrow: 1, // Allow empty component to center
	},
	noResultsText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		textAlign: "center",
		marginTop: spacing.xl,
	},
	documentCard: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault, // Subtle border
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start", // Align status badge properly if text wraps
		marginBottom: spacing.s,
	},
	userInfo: { flex: 1, marginRight: spacing.s },
	userNameText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
	},
	userEmailText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	statusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xs, // Adjusted padding
		borderRadius: borderRadius.m, // More rounded
		flexDirection: "row",
		alignItems: "center",
	},
	statusBadgeText: {
		// Base text style for all badges
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize",
	},
	statusBadgeApproved: { backgroundColor: colors.successMuted }, // Muted background
	statusTextApproved: { color: colors.success }, // Bright text
	statusBadgePending: { backgroundColor: colors.warningMuted },
	statusTextPending: { color: colors.warning },
	statusBadgeRejected: { backgroundColor: colors.errorMuted },
	statusTextRejected: { color: colors.error },
	documentTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.s,
	},
	documentTypeIconThemed: {
		// For MaterialIcons
		marginRight: spacing.s,
	},
	// documentTypeIcon removed, using MaterialIcons now
	documentTypeText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary,
	},
	timestampRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	timestampIconThemed: {
		// For MaterialIcons
		marginRight: spacing.s,
	},
	// timestampIcon removed, using MaterialIcons now
	timestampText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	cardActions: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.m,
		marginTop: spacing.s,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	viewButton: {
		// For TouchableOpacity acting as primary-like button
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.primary, // Primary button color
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
	},
	viewButtonText: {
		color: colors.buttonPrimaryText, // Text on primary button
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primarySemiBold,
	},
	// viewButtonArrow removed, using MaterialIcons now
	approvalActions: {
		flexDirection: "row",
	},
	actionButtonBase: {
		// Base for Approve/Reject TouchableOpacity
		borderRadius: borderRadius.m,
		paddingVertical: spacing.s - 1,
		paddingHorizontal: spacing.m,
		marginLeft: spacing.s,
		borderWidth: 1.5,
		flexDirection: "row",
		alignItems: "center",
	},
	actionButtonTextBase: {
		fontFamily: typography.primarySemiBold,
		fontSize: typography.fontSizes.s,
	},
	approveButton: {
		backgroundColor: colors.backgroundCard, // Outline style
		borderColor: colors.success,
	},
	approveButtonText: { color: colors.success },
	rejectButton: {
		backgroundColor: colors.backgroundCard, // Outline style
		borderColor: colors.error,
	},
	rejectButtonText: { color: colors.error },
});

export default DocumentApprovalListScreen;
