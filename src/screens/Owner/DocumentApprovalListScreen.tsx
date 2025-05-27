// src/screens/Owner/DocumentApprovalListScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react"; // Correct React import
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
import {
	DocumentStatusOwner,
	OwnerStackParamList,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Types and Dummy Data ---
interface DocumentForApproval {
	id: string;
	userId: string;
	userName: string;
	userEmail: string;
	documentType: "Driving License" | "ID Proof" | "Passport";
	docIconPlaceholder: string;
	submittedDate: string;
	status: Exclude<DocumentStatusOwner, "all">;
	documentImageUrl?: string;
}

const DUMMY_DOCUMENTS_FOR_APPROVAL: DocumentForApproval[] = [
	{
		id: "doc_u2_dl",
		userId: "u2",
		userName: "Michael Chen",
		userEmail: "michael.c@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		submittedDate: "Today, 11:45 AM",
		status: "pending",
		documentImageUrl:
			"https://via.placeholder.com/600x400.png?text=Chen+DL",
	},
	{
		id: "doc_u5_id",
		userId: "u5",
		userName: "Olivia Brown",
		userEmail: "olivia.b@example.com",
		documentType: "ID Proof",
		docIconPlaceholder: "📄",
		submittedDate: "This Week, Tue 1:00 PM",
		status: "pending",
		documentImageUrl:
			"https://via.placeholder.com/600x400.png?text=Brown+ID",
	},
	{
		id: "doc_u1_dl",
		userId: "u1",
		userName: "Sarah Johnson",
		userEmail: "sarah.j@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		submittedDate: "Today, 2:30 PM",
		status: "approved",
		documentImageUrl:
			"https://via.placeholder.com/600x400.png?text=Johnson+DL",
	},
	{
		id: "doc_u3_pp",
		userId: "u3",
		userName: "Emma Wilson",
		userEmail: "emma.w@example.com",
		documentType: "Passport",
		docIconPlaceholder: "🛂",
		submittedDate: "Yesterday, 4:15 PM",
		status: "rejected",
		documentImageUrl:
			"https://via.placeholder.com/600x400.png?text=Wilson+Passport",
	},
];

const fetchDocumentsForApprovalAPI = async (filters: {
	status: DocumentStatusOwner;
	searchQuery?: string;
}): Promise<DocumentForApproval[]> => {
	console.log("Fetching documents for owner with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let docs = DUMMY_DOCUMENTS_FOR_APPROVAL;
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

const updateDocumentStatusAPI_Owner = async (
	documentId: string,
	newStatus: "approved" | "rejected",
	reason?: string
): Promise<{ success: boolean }> => {
	console.log(
		`OWNER: Updating document ${documentId} to ${newStatus}. Reason: ${
			reason || "N/A"
		}`
	);
	const docIndex = DUMMY_DOCUMENTS_FOR_APPROVAL.findIndex(
		(d) => d.id === documentId
	);
	if (docIndex > -1) {
		DUMMY_DOCUMENTS_FOR_APPROVAL[docIndex].status = newStatus; // Mutating dummy data for simulation
		return new Promise((resolve) =>
			setTimeout(() => resolve({ success: true }), 500)
		);
	}
	return new Promise((resolve) =>
		setTimeout(() => resolve({ success: false }), 500)
	);
};
// --- End Dummy Data ---

// --- Reusable Components (Inline) ---
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
	item: DocumentForApproval;
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
	const statusStyles = {
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
	const initialFilterFromRoute = route.params?.filter || "pending";
	const [documents, setDocuments] = useState<DocumentForApproval[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeStatusFilter, setActiveStatusFilter] =
		useState<DocumentStatusOwner>(initialFilterFromRoute);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchInput, setShowSearchInput] = useState(false);

	const loadDocuments = useCallback(
		async (status: DocumentStatusOwner, query: string) => {
			setIsLoading(true);
			const fetchedDocs = await fetchDocumentsForApprovalAPI({
				status,
				searchQuery: query,
			});
			setDocuments(fetchedDocs);
			setIsLoading(false);
		},
		[]
	);

	useEffect(() => {
		loadDocuments(activeStatusFilter, searchQuery);
	}, [activeStatusFilter, searchQuery, loadDocuments]);

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
		(item: DocumentForApproval) => {
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
			const confirmMessage = `Are you sure you want to ${newStatus} this document?`;
			Alert.alert(
				`Confirm ${
					newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
				}`,
				confirmMessage,
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
							setIsLoading(true);
							const result = await updateDocumentStatusAPI_Owner(
								docId,
								newStatus
							);
							if (result.success) {
								Alert.alert(
									"Success",
									`Document status updated to ${newStatus}.`
								);
								loadDocuments(activeStatusFilter, searchQuery); // Refresh list
							} else {
								Alert.alert(
									"Error",
									`Failed to update document status.`
								);
								setIsLoading(false); // Only set loading false on error if not refreshing
							}
						},
					},
				]
			);
		},
		[loadDocuments, activeStatusFilter, searchQuery]
	); // Added dependencies

	const renderDocumentItem = ({ item }: { item: DocumentForApproval }) => (
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

	if (isLoading && documents.length === 0) {
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
						onChangeText={setSearchQuery}
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
							onPress={() => setActiveStatusFilter(tabStatus)}
						/>
					))}
				</ScrollView>
			</View>

			{documents.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<Text style={styles.noResultsText}>
						No documents found for "{activeStatusFilter}" status.
					</Text>
				</View>
			) : (
				<FlatList
					data={documents}
					renderItem={renderDocumentItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshing={isLoading}
					onRefresh={() =>
						loadDocuments(activeStatusFilter, searchQuery)
					}
				/>
			)}
		</View>
	);
};

// --- Styles (ensure these are complete and correct as per previous definition) ---
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
