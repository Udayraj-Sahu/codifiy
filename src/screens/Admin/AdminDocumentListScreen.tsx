// src/screens/Admin/AdminDocumentListScreen.tsx
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
	FlatList,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import {
	AdminStackParamList,
	DocumentStatusAdmin,
} from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
// Not using Redux in this version as per "don't change anything" regarding logic
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "../../store/store";
// import { fetchDocumentsForReviewThunk, updateDocumentStatusThunk } from "../../store/slices/documentSlice";

// --- Types and Dummy Data (structure remains, placeholders updated for dark theme & icons) ---
interface AdminDocumentInfo {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	documentType: "Driving License" | "ID Proof" | "Passport";
	docIconName: keyof typeof MaterialIcons.glyphMap; // Changed from docIconPlaceholder
	submittedDate: string;
	status: Exclude<DocumentStatusAdmin, "all">;
	documentImageUrl?: string; // For navigation to viewer
}

const DUMMY_ALL_DOCUMENTS: AdminDocumentInfo[] = [
	{
		id: "doc1",
		userId: "u1",
		userName: "Sarah Johnson",
		userEmail: "sarah.j@example.com",
		documentType: "Driving License",
		docIconName: "credit-card",
		submittedDate: "May 30, 10:30 AM",
		status: "approved",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=SJ+DL",
	},
	{
		id: "doc2",
		userId: "u2",
		userName: "Michael Chen",
		userEmail: "michael.c@example.com",
		documentType: "ID Proof",
		docIconName: "badge",
		submittedDate: "May 30, 09:45 AM",
		status: "pending",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=MC+ID",
	},
	{
		id: "doc3",
		userId: "u3",
		userName: "Emma Wilson",
		userEmail: "emma.w@example.com",
		documentType: "Passport",
		docIconName: "book",
		submittedDate: "May 29, 04:15 PM",
		status: "rejected",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=EW+Pass",
	},
];

const fetchAdminDocumentsAPI = async (filters: {
	status: DocumentStatusAdmin;
	searchQuery?: string;
}): Promise<AdminDocumentInfo[]> => {
	console.log("Fetching documents with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let docs = DUMMY_ALL_DOCUMENTS.map((d) => ({
				...d,
				docIconName: getDocIconNameHelper(d.documentType),
			})); // Ensure iconName is set
			if (filters.status !== "all") {
				docs = docs.filter((d) => d.status === filters.status);
			}
			if (filters.searchQuery && filters.searchQuery.trim() !== "") {
				const sq = filters.searchQuery.toLowerCase();
				docs = docs.filter(
					(d) =>
						d.userName.toLowerCase().includes(sq) ||
						d.userEmail.toLowerCase().includes(sq)
				);
			}
			resolve([...docs]);
		}, 300);
	});
};

// This API might not be used if cards are view-only on this screen
const updateDocumentStatusAPI = async (
	documentId: string,
	newStatus: "approved" | "rejected"
): Promise<{ success: boolean }> => {
	console.log(
		`ADMIN: Updating document ${documentId} to ${newStatus} (Simulated)`
	);
	const docIndex = DUMMY_ALL_DOCUMENTS.findIndex((d) => d.id === documentId);
	if (docIndex > -1) {
		DUMMY_ALL_DOCUMENTS[docIndex].status = newStatus;
		return new Promise((resolve) =>
			setTimeout(() => resolve({ success: true }), 500)
		);
	}
	return new Promise((resolve) =>
		setTimeout(() => resolve({ success: false }), 500)
	);
};
// --- End Dummy Data ---

// Helper for icon names
const getDocIconNameHelper = (
	docType: AdminDocumentInfo["documentType"]
): keyof typeof MaterialIcons.glyphMap => {
	if (docType.toLowerCase().includes("license")) return "credit-card";
	if (docType.toLowerCase().includes("id")) return "badge";
	if (docType.toLowerCase().includes("passport")) return "book";
	return "article";
};

// --- Reusable Components (Themed) ---
interface FilterTabButtonProps {
	label: string;
	isActive: boolean;
	onPress: () => void;
}
const FilterTabButton: React.FC<FilterTabButtonProps> = ({
	label,
	isActive,
	onPress,
}) => (
	<TouchableOpacity
		style={[
			styles.filterTabButton,
			isActive && styles.filterTabButtonActive,
		]}
		onPress={onPress}
		activeOpacity={0.7}>
		<Text
			style={[
				styles.filterTabButtonText,
				isActive && styles.filterTabButtonTextActive,
			]}>
			{label}
		</Text>
	</TouchableOpacity>
);

interface DocumentListItemCardProps {
	item: AdminDocumentInfo;
	onViewDocument: () => void;
	// onApprove and onReject props removed as per "admin only view document"
}
const DocumentListItemCard: React.FC<DocumentListItemCardProps> = ({
	item,
	onViewDocument,
}) => {
	const getStatusStyleInfo = (
		status: Exclude<DocumentStatusAdmin, "all">
	): {
		badge: object;
		text: object;
		iconName: keyof typeof MaterialIcons.glyphMap;
		iconColor: string;
	} => {
		switch (status) {
			case "approved":
				return {
					badge: styles.statusBadgeApproved,
					text: styles.statusTextSemantic,
					iconName: "check-circle",
					iconColor: colors.success,
				};
			case "pending":
				return {
					badge: styles.statusBadgePending,
					text: styles.statusTextSemantic,
					iconName: "hourglass-empty",
					iconColor: colors.warning,
				};
			case "rejected":
				return {
					badge: styles.statusBadgeRejected,
					text: styles.statusTextSemantic,
					iconName: "cancel",
					iconColor: colors.error,
				};
			default:
				return {
					badge: {},
					text: {},
					iconName: "help-outline",
					iconColor: colors.textSecondary,
				};
		}
	};
	const currentStatusInfo = getStatusStyleInfo(item.status);

	return (
		<TouchableOpacity
			style={styles.documentCard}
			onPress={onViewDocument}
			activeOpacity={0.8}>
			<View style={styles.cardHeader}>
				<View style={styles.userInfo}>
					<Text style={styles.userNameText} numberOfLines={1}>
						{item.userName}
					</Text>
					<Text style={styles.userEmailText} numberOfLines={1}>
						{item.userEmail}
					</Text>
				</View>
				<View style={[styles.statusBadge, currentStatusInfo.badge]}>
					<MaterialIcons
						name={currentStatusInfo.iconName}
						size={12}
						color={currentStatusInfo.iconColor}
						style={{ marginRight: spacing.xs }}
					/>
					<Text
						style={[
							styles.statusBadgeText,
							currentStatusInfo.text,
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
			{/* Actions removed for view-only card on this list screen */}
			<View style={styles.cardFooterActions}>
				<Text style={styles.viewDetailsPromptText}>Tap to view</Text>
				<MaterialIcons
					name="arrow-forward-ios"
					size={16}
					color={colors.textPlaceholder}
				/>
			</View>
		</TouchableOpacity>
	);
};

type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminDocumentList"
>;
type ScreenRouteProp = RouteProp<AdminStackParamList, "AdminDocumentList">;

interface AdminDocumentListScreenProps {
	navigation: ScreenNavigationProp;
	route: ScreenRouteProp;
}

const AdminDocumentListScreen: React.FC<AdminDocumentListScreenProps> = ({
	route,
	navigation,
}) => {
	const initialStatusFromRoute = route.params?.initialStatus || "all";
	const [documents, setDocuments] = useState<AdminDocumentInfo[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<DocumentStatusAdmin>(initialStatusFromRoute);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearch, setShowSearch] = useState(false);

	const loadDocuments = useCallback(
		async (status: DocumentStatusAdmin, query: string) => {
			setIsLoading(true);
			const fetchedDocs = await fetchAdminDocumentsAPI({
				status,
				searchQuery: query,
			});
			setDocuments(
				fetchedDocs.map((doc) => ({
					...doc,
					docIconName: getDocIconNameHelper(doc.documentType),
				}))
			); // Ensure iconName is mapped
			setIsLoading(false);
		},
		[]
	);

	useEffect(() => {
		loadDocuments(activeStatusFilter, searchQuery);
	}, [activeStatusFilter, searchQuery, loadDocuments]);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: `${
				activeStatusFilter.charAt(0).toUpperCase() +
				activeStatusFilter.slice(1)
			} Documents`,
			headerRight: () => (
				<TouchableOpacity
					onPress={() => setShowSearch((prev) => !prev)}
					style={{ marginRight: spacing.m }}>
					<MaterialIcons
						name={showSearch ? "close" : "search"}
						size={24}
						color={colors.iconWhite}
					/>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter, showSearch, colors.iconWhite]);

	const handleViewDocument = (item: AdminDocumentInfo) => {
		// Pass the whole item or required fields
		navigation.navigate("AdminDocumentViewerScreen", {
			documentId: item.id,
			documentImageUrl: item.documentImageUrl, // Ensure this property exists or is handled in AdminDocumentInfo
			userName: item.userName,
			documentType: item.documentType,
			status: item.status,
			submittedDate: item.submittedDate,
		});
	};

	const filterTabs: DocumentStatusAdmin[] = [
		"all",
		"pending",
		"approved",
		"rejected",
	];

	if (isLoading && documents.length === 0) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading documents...</Text>
			</View>
		);
	}

	return (
		<View style={styles.screenContainer}>
			{showSearch && (
				<View style={styles.searchBarContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by user name or email..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor={colors.textPlaceholder}
						autoFocus
						returnKeyType="search"
					/>
				</View>
			)}
			<View style={styles.filterTabsRow}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterTabsScroll}>
					{filterTabs.map((tabStatus) => (
						<FilterTabButton
							key={tabStatus}
							label={
								tabStatus.charAt(0).toUpperCase() +
								tabStatus.slice(1)
							}
							isActive={activeStatusFilter === tabStatus}
							onPress={() => setActiveStatusFilter(tabStatus)}
						/>
					))}
				</ScrollView>
			</View>

			{documents.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<MaterialIcons
						name="find-in-page"
						size={48}
						color={colors.textDisabled}
					/>
					<Text style={styles.noResultsText}>
						No documents found for "{activeStatusFilter}" status.
					</Text>
				</View>
			) : (
				<FlatList
					data={documents}
					renderItem={({ item }) => (
						<DocumentListItemCard
							item={item}
							onViewDocument={() => handleViewDocument(item)}
						/>
					)}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() =>
								loadDocuments(activeStatusFilter, searchQuery)
							}
							tintColor={colors.primary}
							colors={[colors.primary]}
						/>
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
	searchBarContainer: {
		paddingHorizontal: spacing.m,
		paddingTop: spacing.s,
		paddingBottom: spacing.m,
		backgroundColor: colors.backgroundCard,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	searchInput: {
		backgroundColor: colors.backgroundInput,
		borderRadius: borderRadius.m,
		paddingHorizontal: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		height: 44,
		color: colors.textPrimary,
	},
	filterTabsRow: {
		backgroundColor: colors.backgroundCard,
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.m,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	filterTabsScroll: {
		paddingHorizontal: spacing.m - spacing.s,
	},
	filterTabButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		backgroundColor: colors.backgroundInput,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	filterTabButtonActive: {
		backgroundColor: colors.primaryMuted,
		borderColor: colors.primary,
	},
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary,
	},
	filterTabButtonTextActive: {
		color: colors.primary,
		fontFamily: typography.primaryBold,
	},
	listContentContainer: {
		padding: spacing.m,
		flexGrow: 1,
	},
	noResultsText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.xl,
	},
	documentCard: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: spacing.m,
	},
	userInfo: { flex: 1, marginRight: spacing.s },
	userNameText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
	},
	userEmailText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	statusBadge: {
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s - spacing.xxs,
		borderRadius: borderRadius.pill,
		flexDirection: "row",
		alignItems: "center",
		minWidth: 90,
		justifyContent: "center",
	},
	statusBadgeText: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize",
	},
	// Themed status badge styles
	statusBadgeApproved: { backgroundColor: colors.successMuted },
	statusTextApproved: { color: colors.success }, // Use bright semantic color for text on muted bg
	statusBadgePending: { backgroundColor: colors.warningMuted },
	statusTextPending: { color: colors.warning },
	statusBadgeRejected: { backgroundColor: colors.errorMuted },
	statusTextRejected: { color: colors.error },

	documentTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.xs,
	},
	documentTypeIconThemed: {
		marginRight: spacing.s,
	},
	documentTypeText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPrimary,
	},
	timestampRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	timestampIconThemed: {
		marginRight: spacing.s,
	},
	timestampText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	cardActions: {
		// Modified for view-only prompt
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.s,
		marginTop: spacing.s,
		flexDirection: "row",
		justifyContent: "flex-end", // Align prompt to the right
		alignItems: "center",
	},
	viewDetailsPromptText: {
		// New style for "Tap to view"
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegularItalic,
		color: colors.textPlaceholder,
		marginRight: spacing.xs,
	},
	// Removed viewButton, approvalActions, and related button styles as card is now view-only via direct tap
});

export default AdminDocumentListScreen;
