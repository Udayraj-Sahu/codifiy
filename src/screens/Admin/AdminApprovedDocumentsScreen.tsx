// src/screens/Admin/AdminApprovedDocumentsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, {
	useCallback,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import {
	FlatList, // For search if toggled
	ScrollView,
	StyleSheet,
	Text,
	// Image, // Not directly in card as per description, but document type icon
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // For icons

// --- Types and Dummy Data ---
type TimeFilterType = "All" | "Today" | "This Week" | "This Month";
interface ApprovedDocument {
	id: string;
	userName: string;
	userEmail: string;
	documentType: "Driving License" | "ID Proof" | "Passport"; // Example types
	docIconPlaceholder: string; // e.g., '📄', '💳', '🛂'
	approvalTimestamp: string; // e.g., "Today, 2:30 PM"
	documentIdToView: string; // For navigating to viewer
}

const DUMMY_APPROVED_DOCUMENTS: ApprovedDocument[] = [
	{
		id: "doc1",
		userName: "Sarah Johnson",
		userEmail: "sarah.j@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		approvalTimestamp: "Today, 2:30 PM",
		documentIdToView: "dl123",
	},
	{
		id: "doc2",
		userName: "Michael Chen",
		userEmail: "michael.c@example.com",
		documentType: "ID Proof",
		docIconPlaceholder: "📄",
		approvalTimestamp: "Today, 11:45 AM",
		documentIdToView: "id456",
	},
	{
		id: "doc3",
		userName: "Emma Wilson",
		userEmail: "emma.w@example.com",
		documentType: "Passport",
		docIconPlaceholder: "🛂",
		approvalTimestamp: "Yesterday, 4:15 PM",
		documentIdToView: "pp789",
	},
	{
		id: "doc4",
		userName: "David Lee",
		userEmail: "david.l@example.com",
		documentType: "Driving License",
		docIconPlaceholder: "💳",
		approvalTimestamp: "This Week, Mon 9:00 AM",
		documentIdToView: "dl012",
	},
	{
		id: "doc5",
		userName: "Olivia Brown",
		userEmail: "olivia.b@example.com",
		documentType: "ID Proof",
		docIconPlaceholder: "📄",
		approvalTimestamp: "Last Month, May 15",
		documentIdToView: "id345",
	},
];

const fetchApprovedDocumentsAPI = async (filters: {
	timeFilter: TimeFilterType;
	searchQuery?: string;
}): Promise<ApprovedDocument[]> => {
	console.log("Fetching approved documents with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let docs = DUMMY_APPROVED_DOCUMENTS;
			// Simulate filtering (in a real app, backend handles this)
			if (filters.searchQuery && filters.searchQuery.trim() !== "") {
				const sq = filters.searchQuery.toLowerCase();
				docs = docs.filter(
					(d) =>
						d.userName.toLowerCase().includes(sq) ||
						d.userEmail.toLowerCase().includes(sq)
				);
			}
			// Simulate time filtering very crudely
			if (filters.timeFilter === "Today")
				docs = docs.filter((d) =>
					d.approvalTimestamp.includes("Today")
				);
			else if (filters.timeFilter === "This Week")
				docs = docs.filter(
					(d) =>
						d.approvalTimestamp.includes("Week") ||
						d.approvalTimestamp.includes("Today") ||
						d.approvalTimestamp.includes("Yesterday")
				); // very basic
			// else if (filters.timeFilter === 'This Month') // more complex date logic
			resolve([...docs]);
		}, 300);
	});
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

interface ApprovedDocCardProps {
	item: ApprovedDocument;
	onViewDocument: (docId: string, userName: string) => void;
}
const ApprovedDocumentCard: React.FC<ApprovedDocCardProps> = ({
	item,
	onViewDocument,
}) => (
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
			<View style={styles.approvedBadge}>
				<Text style={styles.approvedBadgeText}>Approved</Text>
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
			<Text style={styles.timestampText}>{item.approvalTimestamp}</Text>
		</View>
		<TouchableOpacity
			style={styles.viewDocumentButton}
			onPress={() =>
				onViewDocument(item.documentIdToView, item.userName)
			}>
			<Text style={styles.viewDocumentButtonText}>View Document</Text>
			<Text style={styles.viewDocumentButtonArrow}> ›</Text>
		</TouchableOpacity>
	</View>
);
// --- End Reusable Components ---

type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminApprovedDocumentsScreen"
>;
type ScreenRouteProp = RouteProp<
	AdminStackParamList,
	"AdminApprovedDocumentsScreen"
>;

interface AdminApprovedDocumentsScreenProps {
	navigation: ScreenNavigationProp;
	route: ScreenRouteProp;
}

const AdminApprovedDocumentsScreen: React.FC<
	AdminApprovedDocumentsScreenProps
> = ({ navigation, route }) => {
	const [documents, setDocuments] = useState<ApprovedDocument[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTimeFilter, setActiveTimeFilter] = useState<TimeFilterType>(
		route.params?.initialFilter || "All"
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearchInput, setShowSearchInput] = useState(false);

	const loadDocuments = useCallback(
		async (filter: TimeFilterType, query: string) => {
			setIsLoading(true);
			const fetchedDocs = await fetchApprovedDocumentsAPI({
				timeFilter: filter,
				searchQuery: query,
			});
			setDocuments(fetchedDocs);
			setIsLoading(false);
		},
		[]
	);

	useEffect(() => {
		loadDocuments(activeTimeFilter, searchQuery);
	}, [activeTimeFilter, searchQuery, loadDocuments]);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: "Approved Documents", // Centered by default if headerLeft is present or title is long
			headerTitleAlign: "center",
			// Back arrow is usually handled by default if this screen is not the first in stack
			headerRight: () => (
				<TouchableOpacity
					onPress={() => setShowSearchInput((prev) => !prev)}
					style={{ marginRight: spacing.m }}>
					{/* <Icon name={showSearchInput ? "close" : "magnify"} size={24} color={colors.textPrimary} /> */}
					<Text style={{ fontSize: 22, color: colors.textPrimary }}>
						{showSearchInput ? "✕" : "🔍"}
					</Text>
				</TouchableOpacity>
			),
		});
	}, [navigation, showSearchInput]);

	const handleViewDocument = (docId: string, userName: string) => {
		navigation.navigate("AdminDocumentViewerScreen", {
			documentId: docId,
			userName,
		});
	};

	const timeFilterTabs: TimeFilterType[] = [
		"All",
		"Today",
		"This Week",
		"This Month",
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
			{showSearchInput && (
				<View style={styles.searchBarContainer}>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by name or email..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholderTextColor={colors.textPlaceholder}
						autoFocus
					/>
				</View>
			)}
			{/* Filter Tabs */}
			<View style={styles.filterTabsContainer}>
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filterTabsScroll}>
					{timeFilterTabs.map((tab) => (
						<FilterPillButton
							key={tab}
							label={tab}
							isActive={activeTimeFilter === tab}
							onPress={() => setActiveTimeFilter(tab)}
						/>
					))}
				</ScrollView>
			</View>

			{documents.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<Text style={styles.noResultsText}>
						No approved documents match your criteria.
					</Text>
				</View>
			) : (
				<FlatList
					data={documents}
					renderItem={({ item }) => (
						<ApprovedDocumentCard
							item={item}
							onViewDocument={handleViewDocument}
						/>
					)}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContentContainer}
					showsVerticalScrollIndicator={false}
					refreshing={isLoading}
					onRefresh={() =>
						loadDocuments(activeTimeFilter, searchQuery)
					}
				/>
			)}
		</View>
	);
};

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
	// ApprovedDocumentCard Styles
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
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	userEmailText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	approvedBadge: {
		backgroundColor: "#D4EFDF",
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs + 1,
		borderRadius: borderRadius.s,
	},
	approvedBadgeText: {
		color: "#1D8348",
		fontSize: typography.fontSizes.xs,
		fontWeight: typography.fontWeights.bold,
	},
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
	viewDocumentButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.primary, // Blue as per prompt, using primary (green) for now
		paddingVertical: spacing.m - 2,
		borderRadius: borderRadius.m,
		marginTop: spacing.s,
	},
	viewDocumentButtonText: {
		color: colors.white,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
	},
	viewDocumentButtonArrow: {
		color: colors.white,
		fontSize: typography.fontSizes.l,
		marginLeft: spacing.xs,
		fontWeight: "bold",
	},
});

export default AdminApprovedDocumentsScreen;
