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
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux"; // <<< ADDED
import {
	DocumentStatusOwner,
	OwnerStackParamList,
} from "../../navigation/types";
import {
	fetchDocumentsForReviewThunk, // Use the Document type from your slice
	FetchDocumentsParamsAdminOwner,
	updateDocumentStatusThunk,
} from "../../store/slices/documentSlice"; // <<< ADDED
import { AppDispatch, RootState } from "../../store/store"; // <<< ADDED
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Types ---
// DocumentForApproval can now be mapped from StoreDocument
interface DocumentForApprovalItem {
	// Renamed to avoid conflict if needed
	id: string; // maps to _id
	userId: string;
	userName: string;
	userEmail: string;
	documentType: string; // Was more specific before, now from StoreDocument
	docIconPlaceholder: string; // You might need to derive this based on documentType
	submittedDate: string;
	status: Exclude<DocumentStatusOwner, "all">;
	documentImageUrl?: string; // For navigation to viewer
}

// --- DUMMY DATA REMOVED ---
// const DUMMY_DOCUMENTS_FOR_APPROVAL: DocumentForApproval[] = [ ... ];
// const fetchDocumentsForApprovalAPI = async ( ... ): Promise<DocumentForApproval[]> => { ... };
// const updateDocumentStatusAPI_Owner = async ( ... ): Promise<{ success: boolean }> => { ... };

// --- Reusable Components (FilterPillButton, OwnerDocumentCard - ensure props match DocumentForApprovalItem) ---
interface FilterPillButtonProps {
	/* ... */ label: string;
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
	item: DocumentForApprovalItem; // Use the mapped type
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
	// ... (Card JSX remains similar, ensure it uses fields from DocumentForApprovalItem) ...
	// For status styles, make sure item.status matches the keys in statusStyles
	const statusStyles: Record<
		Exclude<DocumentStatusOwner, "all">,
		{ badge: object; text: object }
	> = {
		approved: {
			badge: styles.statusBadgeApproved,
			text: styles.statusTextApproved,
		},
		pending: {
			badge: styles.statusBadgePending,
			text: styles.statusTextPending,
		},
		rejected: {
			badge: styles.statusBadgeRejected,
			text: styles.statusTextRejected,
		},
	};
	const currentStatusStyle = statusStyles[item.status] || {
		badge: {},
		text: {},
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
				<Text style={styles.documentTypeIcon}>
					{item.docIconPlaceholder}
				</Text>
				<Text style={styles.documentTypeText}>{item.documentType}</Text>
			</View>
			<View style={styles.timestampRow}>
				<Text style={styles.timestampIcon}>🕒</Text>
				<Text style={styles.timestampText}>{item.submittedDate}</Text>
			</View>
			<View style={styles.cardActions}>
				<TouchableOpacity style={styles.viewButton} onPress={onView}>
					<Text style={styles.viewButtonText}>View Document</Text>
					<Text style={styles.viewButtonArrow}> ›</Text>
				</TouchableOpacity>
				{item.status === "pending" && (
					<View style={styles.approvalActions}>
						<TouchableOpacity
							style={[
								styles.actionButtonBase,
								styles.rejectButton,
							]}
							onPress={onReject}>
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
// --- End Reusable ---

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
		reviewDocuments, // This will hold the documents fetched for review
		isLoadingReviewDocs: isLoading, // Use this for loading state
		pagination,
		errorReviewDocs: error,
	} = useSelector((state: RootState) => state.documents);

	const initialFilterFromRoute = route.params?.filter || "pending";
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<DocumentStatusOwner>(initialFilterFromRoute);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchInput, setShowSearchInput] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	const loadDocuments = useCallback(
		(page = 1) => {
			const params: FetchDocumentsParamsAdminOwner = {
				status:
					activeStatusFilter === "all"
						? undefined
						: activeStatusFilter,
				search: searchQuery.trim() || undefined,
				page,
				limit: 10, // Or your desired limit
			};
			dispatch(fetchDocumentsForReviewThunk(params));
		},
		[dispatch, activeStatusFilter, searchQuery]
	);

	useEffect(() => {
		setCurrentPage(1); // Reset to first page on filter change
		loadDocuments(1);
	}, [activeStatusFilter, searchQuery, loadDocuments]); // loadDocuments dependency can be removed if params are directly used

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
					<Text style={{ fontSize: 22, color: colors.textPrimary }}>
						{showSearchInput ? "✕" : "🔍"}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter, showSearchInput]);

	const handleViewDocument = useCallback(
		(item: DocumentForApprovalItem) => {
			navigation.navigate("OwnerDocumentViewerScreen", {
				documentId: item.id, // Pass the actual document ID (_id from MongoDB)
				documentImageUrl: item.documentImageUrl, // This might be item.fileUrl from StoreDocument
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
				// Simple prompt for reason, replace with a proper input modal in a real app
				const reason = await new Promise<string | undefined>(
					(resolve) => {
						Alert.prompt(
							"Rejection Reason",
							"Please provide a reason for rejection (optional):",
							(text) => resolve(text),
							"plain-text"
						);
					}
				);
				reasonInput = reason || "";
			}

			Alert.alert(
				`Confirm ${
					newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
				}`,
				`Are you sure you want to ${newStatus} this document? ${
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
								// The list will refresh because updateDocumentStatusThunk dispatches fetchDocumentsForReviewThunk
								// Or you can explicitly call loadDocuments(1) here if that's preferred.
								setCurrentPage(1); // Go back to first page after status update
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
		[dispatch, activeStatusFilter, searchQuery]
	); // Removed loadDocuments from deps as thunk handles refresh

	// Map StoreDocument from Redux to DocumentForApprovalItem for the card
	const mappedDocuments: DocumentForApprovalItem[] = reviewDocuments.map(
		(doc) => ({
			id: doc._id,
			userId: typeof doc.user === "string" ? doc.user : doc.user._id, // Handle populated vs. non-populated user
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
			docIconPlaceholder:
				doc.documentType === "drivers_license"
					? "💳"
					: doc.documentType === "id_card"
					? "📄"
					: "🛂",
			submittedDate: new Date(
				doc.uploadedAt || doc.createdAt
			).toLocaleDateString(),
			status: doc.status as Exclude<DocumentStatusOwner, "all">,
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
				<Text style={{ marginTop: spacing.s }}>
					Loading documents...
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{showSearchInput && (
				<View style={styles.searchBarContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by user name or email..."
						value={searchQuery}
						onChangeText={(text) => {
							setSearchQuery(text);
							setCurrentPage(1); /* Trigger fetch in useEffect */
						}}
						placeholderTextColor={colors.textPlaceholder}
						autoFocus
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
								setCurrentPage(
									1
								); /* Trigger fetch in useEffect */
							}}
						/>
					))}
				</ScrollView>
			</View>

			{error && (
				<View style={styles.centered}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			)}

			{!isLoading && mappedDocuments.length === 0 && !error ? (
				<View style={styles.centered}>
					<Text style={styles.noResultsText}>
						No documents found for "{activeStatusFilter}" status.
					</Text>
				</View>
			) : (
				<FlatList
					data={mappedDocuments}
					renderItem={renderDocumentItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					onRefresh={() => {
						setCurrentPage(1);
						loadDocuments(1);
					}}
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

// Styles (ensure these are defined as per your project)
const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	errorText: {
		color: colors.error,
		fontSize: typography.fontSizes.m,
		textAlign: "center",
	},
	searchBarContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.m,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	searchInput: {
		backgroundColor: colors.backgroundLight || "#F0F3F7",
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		fontSize: typography.fontSizes.m,
		height: 44,
		color: colors.textPrimary,
	},
	filterTabsContainer: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		backgroundColor: colors.white,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	filterTabsScroll: {},
	filterPill: {
		paddingVertical: spacing.s - 2,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		backgroundColor: colors.greyLighter,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	filterPillActive: {
		backgroundColor: colors.primaryLight,
		borderColor: colors.primary,
	},
	filterPillText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	filterPillTextActive: {
		color: colors.primaryDark || colors.primary,
		fontWeight: typography.fontWeights.bold,
	},
	listContentContainer: { padding: spacing.m },
	noResultsText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		textAlign: "center",
	},
	documentCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.07,
		shadowRadius: 3,
		elevation: 2,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.s,
	},
	userInfo: { flex: 1, marginRight: spacing.s },
	userNameText: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	userEmailText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	statusBadge: {
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs + 1,
		borderRadius: borderRadius.s,
		alignSelf: "flex-start",
	},
	statusBadgeText: {
		fontSize: typography.fontSizes.xs,
		fontWeight: typography.fontWeights.bold,
	},
	statusBadgeApproved: { backgroundColor: colors.successLight || "#D4EFDF" },
	statusTextApproved: { color: colors.successDark || "#1D8348" },
	statusBadgePending: { backgroundColor: colors.warningLight || "#FDEBD0" },
	statusTextPending: { color: colors.warningDark || "#A0522D" },
	statusBadgeRejected: { backgroundColor: colors.errorLight || "#FFD6D6" },
	statusTextRejected: { color: colors.errorDark || "#A93226" },
	documentTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.s,
	},
	documentTypeIcon: {
		fontSize: 18,
		color: colors.textMedium,
		marginRight: spacing.s,
	},
	documentTypeText: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
	},
	timestampRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	timestampIcon: {
		fontSize: 14,
		color: colors.textMedium,
		marginRight: spacing.s,
	},
	timestampText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	cardActions: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault || "#F0F0F0",
		paddingTop: spacing.m,
		marginTop: spacing.s,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	viewButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.primary,
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.m,
	},
	viewButtonText: {
		color: colors.white,
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.semiBold,
	},
	viewButtonArrow: {
		color: colors.white,
		fontSize: typography.fontSizes.m,
		marginLeft: spacing.xs,
		fontWeight: "bold",
	},
	approvalActions: { flexDirection: "row" },
	actionButtonBase: {
		borderRadius: borderRadius.m,
		paddingVertical: spacing.s - 1,
		paddingHorizontal: spacing.m,
		marginLeft: spacing.s,
		borderWidth: 1.5,
	},
	actionButtonTextBase: {
		fontWeight: typography.fontWeights.semiBold,
		fontSize: typography.fontSizes.s,
	},
	approveButton: {
		backgroundColor: colors.successLight,
		borderColor: colors.successDark,
	},
	approveButtonText: { color: colors.successDark },
	rejectButton: {
		backgroundColor: colors.errorLight,
		borderColor: colors.errorDark,
	},
	rejectButtonText: { color: colors.errorDark },
});

export default DocumentApprovalListScreen;
