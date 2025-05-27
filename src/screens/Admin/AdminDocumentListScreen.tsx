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
	FlatList,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {
	AdminStackParamList,
	DocumentStatusAdmin,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Types and Dummy Data ---
interface AdminDocumentInfo {
	id: string; // Document ID
	userId: string;
	userName: string;
	userEmail: string;
	documentType: "Driving License" | "ID Proof" | "Passport";
	docIconPlaceholder: string;
	submittedDate: string; // e.g., "Today, 2:30 PM" or full date
	status: Exclude<DocumentStatusAdmin, "all">; // Individual doc status
	// documentImageUrl?: string; // For viewing
}

const DUMMY_ALL_DOCUMENTS: AdminDocumentInfo[] = [
	{
		id: "doc1",
		userId: "u1",
		userName: "Sarah Johnson",
		userEmail: "sarah.j@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		submittedDate: "Today, 2:30 PM",
		status: "approved",
	},
	{
		id: "doc2",
		userId: "u2",
		userName: "Michael Chen",
		userEmail: "michael.c@example.com",
		documentType: "ID Proof",
		docIconPlaceholder: "📄",
		submittedDate: "Today, 11:45 AM",
		status: "pending",
	},
	{
		id: "doc3",
		userId: "u3",
		userName: "Emma Wilson",
		userEmail: "emma.w@example.com",
		documentType: "Passport",
		docIconPlaceholder: "🛂",
		submittedDate: "Yesterday, 4:15 PM",
		status: "rejected",
	},
	{
		id: "doc4",
		userId: "u4",
		userName: "David Lee",
		userEmail: "david.l@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		submittedDate: "This Week, Mon 9:00 AM",
		status: "approved",
	},
	{
		id: "doc5",
		userId: "u5",
		userName: "Olivia Brown",
		userEmail: "olivia.b@example.com",
		documentType: "ID Proof",
		docIconPlaceholder: "📄",
		submittedDate: "This Week, Tue 1:00 PM",
		status: "pending",
	},
	{
		id: "doc6",
		userId: "u6",
		userName: "James White",
		userEmail: "james.w@example.com",
		documentType: "Passport",
		docIconPlaceholder: "🛂",
		submittedDate: "Last Week, Fri 10:00 AM",
		status: "approved",
	},
];

// Simulate API call
const fetchAdminDocumentsAPI = async (filters: {
	status: DocumentStatusAdmin;
	searchQuery?: string;
}): Promise<AdminDocumentInfo[]> => {
	console.log("Fetching documents with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let docs = DUMMY_ALL_DOCUMENTS;
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

// Simulate Approve/Reject API
const updateDocumentStatusAPI = async (
	documentId: string,
	newStatus: "approved" | "rejected"
): Promise<{ success: boolean }> => {
	console.log(`Updating document ${documentId} to ${newStatus}`);
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

// --- Reusable Components (Inline) ---
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
	onApprove?: () => void;
	onReject?: () => void;
}
const DocumentListItemCard: React.FC<DocumentListItemCardProps> = ({
	item,
	onViewDocument,
	onApprove,
	onReject,
}) => {
	const statusStyles: Record<
		Exclude<DocumentStatusAdmin, "all">,
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
				<TouchableOpacity
					style={styles.viewButton}
					onPress={onViewDocument}>
					<Text style={styles.viewButtonText}>View Document</Text>
				</TouchableOpacity>
				{/* Approve/Reject buttons removed for Admin role */}
			</View>
		</View>
	);
};
// --- End Reusable ---

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
	const [searchQuery, setSearchQuery] = useState(""); // For potential future search bar
	const [showSearch, setShowSearch] = useState(false);

	const loadDocuments = useCallback(
		async (status: DocumentStatusAdmin, query: string) => {
			setIsLoading(true);
			const fetchedDocs = await fetchAdminDocumentsAPI({
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

	// Update header title and add search icon
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
					<Text style={{ fontSize: 22, color: colors.textPrimary }}>
						{showSearch ? "✕" : "🔍"}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, activeStatusFilter, showSearch]);

	const handleViewDocument = (docId: string, userName: string) => {
		navigation.navigate("AdminDocumentViewerScreen", {
			documentId: docId,
			userName,
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
				<Text>Loading documents...</Text>
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
					/>
				</View>
			)}
			{/* Filter Tabs */}
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
							onViewDocument={() =>
								handleViewDocument(item.id, item.userName)
							}
						/>
					)}
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

// Define your blue accent color in theme/colors.ts e.g. colors.adminAccentBlue
const adminBlue = colors.primary; // Using primary green for now, change to blue

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
	filterTabsRow: {
		backgroundColor: colors.white,
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.m,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	filterTabsScroll: {
		paddingHorizontal: spacing.m - spacing.s /* Align with list padding */,
	},
	filterTabButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		backgroundColor: colors.greyLighter,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	filterTabButtonActive: {
		backgroundColor: colors.primaryLight,
		borderColor: colors.primary,
	},
	filterTabButtonText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},
	filterTabButtonTextActive: {
		color: colors.primaryDark || colors.primary,
		fontWeight: typography.fontWeights.bold,
	},
	listContentContainer: { padding: spacing.m },
	noResultsText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		textAlign: "center",
	},

	// DocumentListItemCard Styles
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
		marginBottom: spacing.m,
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
	statusBadgeApproved: { backgroundColor: "#D4EFDF" },
	statusTextApproved: { color: "#1D8348" },
	statusBadgePending: { backgroundColor: "#FDEBD0" },
	statusTextPending: { color: "#A0522D" },
	statusBadgeRejected: { backgroundColor: "#FFD6D6" },
	statusTextRejected: { color: "#A93226" },
	documentTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.xs,
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
		marginBottom: spacing.s,
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
		backgroundColor: adminBlue,
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		flexShrink: 1,
		marginRight: spacing.s,
	},
	viewButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeights.semiBold,
	},
	approvalActions: { flexDirection: "row" },
	approvalButton: {
		borderRadius: borderRadius.m,
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		marginLeft: spacing.s,
		borderWidth: 1,
	},
	approvalButtonText: {
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

export default AdminDocumentListScreen;
