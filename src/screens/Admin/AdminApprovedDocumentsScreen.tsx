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
// Redux imports would go here for actual data fetching
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "../../store/store";
// import { fetchAdminDocumentsThunk } from "../../store/slices/documentSlice";

// --- Types and Dummy Data ---
type TimeFilterType = "All" | "Today" | "This Week" | "This Month";
interface ApprovedDocument {
	id: string;
	userName: string;
	userEmail: string;
	documentType: "Driving License" | "ID Proof" | "Passport";
	docIconName: keyof typeof MaterialIcons.glyphMap; // Changed from docIconPlaceholder
	approvalTimestamp: string;
	documentIdToView: string; // For navigating to viewer (should match id usually)
	documentImageUrl?: string; // Added to pass to viewer screen
}

// Helper to get icon name based on document type
const getDocIconNameHelper = (
	docType: ApprovedDocument["documentType"]
): keyof typeof MaterialIcons.glyphMap => {
	if (docType.toLowerCase().includes("license")) return "credit-card";
	if (docType.toLowerCase().includes("id")) return "badge";
	if (docType.toLowerCase().includes("passport")) return "book";
	return "article"; // Default document icon
};

const DUMMY_APPROVED_DOCUMENTS: ApprovedDocument[] = [
	{
		id: "doc1",
		userName: "Sarah Johnson",
		userEmail: "sarah.j@example.com",
		documentType: "Driving License",
		docIconName: getDocIconNameHelper("Driving License"),
		approvalTimestamp: "Today, 2:30 PM",
		documentIdToView: "dl123",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=SJ+DL",
	},
	{
		id: "doc4",
		userName: "David Lee",
		userEmail: "david.l@example.com",
		documentType: "Driving License",
		docIconName: getDocIconNameHelper("Driving License"),
		approvalTimestamp: "This Week, Mon 9:00 AM",
		documentIdToView: "dl012",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=DL+DL",
	},
	{
		id: "doc6",
		userName: "James White",
		userEmail: "james.w@example.com",
		documentType: "Passport",
		docIconName: getDocIconNameHelper("Passport"),
		approvalTimestamp: "Last Week, Fri 10:00 AM",
		documentIdToView: "pp789",
		documentImageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=JW+Pass",
	},
	// Only approved documents for this screen's dummy data
];

const fetchApprovedDocumentsAPI = async (filters: {
	timeFilter: TimeFilterType;
	searchQuery?: string;
}): Promise<ApprovedDocument[]> => {
	console.log("Fetching approved documents with filters:", filters);
	return new Promise((resolve) => {
		setTimeout(() => {
			let docs = DUMMY_APPROVED_DOCUMENTS.filter(
				(d) => d.status === "approved"
			); // Assuming status is part of the full object
			if (filters.searchQuery && filters.searchQuery.trim() !== "") {
				const sq = filters.searchQuery.toLowerCase();
				docs = docs.filter(
					(d) =>
						d.userName.toLowerCase().includes(sq) ||
						d.userEmail.toLowerCase().includes(sq)
				);
			}
			// Simulate time filtering crudely
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
				);
			resolve([
				...docs.map((d) => ({
					...d,
					docIconName: getDocIconNameHelper(d.documentType),
				})),
			]); // Ensure iconName is set
		}, 300);
	});
};
// --- End Dummy Data ---

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

interface ApprovedDocCardProps {
	item: ApprovedDocument;
	onViewDocument: (
		docId: string,
		userName: string,
		documentType: string,
		status: string,
		approvalTimestamp?: string,
		imageUrl?: string
	) => void;
}
const ApprovedDocumentCard: React.FC<ApprovedDocCardProps> = ({
	item,
	onViewDocument,
}) => (
	<TouchableOpacity
		style={styles.documentCard}
		onPress={() =>
			onViewDocument(
				item.documentIdToView,
				item.userName,
				item.documentType,
				item.status,
				item.approvalTimestamp,
				item.documentImageUrl
			)
		}
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
			<View style={[styles.statusBadge, styles.statusBadgeApproved]}>
				<MaterialIcons
					name="check-circle"
					size={12}
					color={colors.success}
					style={{ marginRight: spacing.xs }}
				/>
				<Text
					style={[styles.statusBadgeText, styles.statusTextApproved]}>
					Approved
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
				name="event-available"
				size={16}
				color={colors.iconDefault}
				style={styles.timestampIconThemed}
			/>
			<Text style={styles.timestampText}>
				Approved: {item.approvalTimestamp}
			</Text>
		</View>
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
> = ({ route, navigation }) => {
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
			title: "Approved Documents",
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
	}, [navigation, showSearchInput, colors.iconWhite]);

	const handleViewDocument = (
		docId: string,
		userName: string,
		documentType: string,
		status: string,
		approvalTimestamp?: string,
		imageUrl?: string
	) => {
		navigation.navigate("AdminDocumentViewerScreen", {
			documentId: docId,
			userName,
			documentType,
			status: status as Exclude<DocumentStatusAdmin, "all">, // Ensure status matches type
			submittedDate: approvalTimestamp, // Using approvalTimestamp as submittedDate for viewer
			documentImageUrl: imageUrl,
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
						placeholder="Search by user name or email..."
						value={searchQuery}
						onChangeText={setSearchQuery}
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
					<MaterialIcons
						name="check-circle-outline"
						size={48}
						color={colors.textDisabled}
					/>
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
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() =>
								loadDocuments(activeTimeFilter, searchQuery)
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
	filterTabsContainer: {
		// Renamed from filterTabsRow for clarity
		backgroundColor: colors.backgroundCard,
		paddingVertical: spacing.m, // Consistent padding
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault,
	},
	filterTabsScroll: {
		paddingHorizontal: spacing.m, // Ensure padding for first/last items in scroll
	},
	filterPill: {
		paddingVertical: spacing.s, // Adjusted padding
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.pill,
		marginRight: spacing.s,
		backgroundColor: colors.backgroundInput, // Darker unselected pill
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	filterPillActive: {
		backgroundColor: colors.primaryMuted, // Muted primary for active
		borderColor: colors.primary,
	},
	filterPillText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary,
	},
	filterPillTextActive: {
		color: colors.primary, // Primary color for text
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
		// Generic badge style
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.s - spacing.xxs,
		borderRadius: borderRadius.pill,
		flexDirection: "row",
		alignItems: "center",
	},
	statusBadgeText: {
		// Base for all status texts
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryBold,
		textTransform: "capitalize",
	},
	approvedBadge: {
		// Specific for "Approved" badge in this screen
		backgroundColor: colors.successMuted, // Muted success background
	},
	approvedBadgeText: {
		// Specific for "Approved" text
		color: colors.success, // Bright success text
	},
	documentTypeRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: spacing.xs,
	},
	documentTypeIconThemed: {
		// For MaterialIcons
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
		// For MaterialIcons
		marginRight: spacing.s,
	},
	timestampText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	cardFooterActions: {
		// View prompt for the card
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.borderDefault,
		paddingTop: spacing.s,
		marginTop: spacing.s,
		flexDirection: "row",
		justifyContent: "flex-end",
		alignItems: "center",
	},
	viewDetailsPromptText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegularItalic,
		color: colors.textPlaceholder,
		marginRight: spacing.xs,
	},
	// Removed viewDocumentButton styles as the whole card is pressable
	// and a prompt is added instead.
});

export default AdminApprovedDocumentsScreen;
