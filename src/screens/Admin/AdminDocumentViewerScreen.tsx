// src/screens/Admin/AdminDocumentViewerScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Dimensions,
	Image,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Added for icons
import {
	AdminStackParamList,
	DocumentStatusOwner,
} from "../../navigation/types"; // Assuming DocumentStatusOwner is relevant here too
import { borderRadius, colors, spacing, typography } from "../../theme";

// --- Dummy Data / Types ---
interface DocumentDetails {
	id: string;
	imageUrl: string;
	userName: string;
	documentType: string;
	submittedDate?: string;
	status: Exclude<DocumentStatusOwner, "all">; // Use the more specific status type
}

const DUMMY_DOCUMENT_DETAILS_SOURCE: { [key: string]: DocumentDetails } = {
	dl123: {
		id: "dl123",
		imageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=Driving+License+Dark",
		userName: "Sarah Johnson",
		documentType: "Driving License",
		submittedDate: "May 30, 2025, 2:30 PM",
		status: "approved",
	},
	id456: {
		id: "id456",
		imageUrl:
			"https://placehold.co/800x600/1A1A1A/F5F5F5?text=ID+Proof+Dark",
		userName: "Michael Chen",
		documentType: "ID Proof",
		submittedDate: "May 30, 2025, 11:45 AM",
		status: "pending",
	},
};

const fetchDocumentDetailsAPI = async (
	documentId: string
): Promise<DocumentDetails | null> => {
	console.log(`ADMIN: Fetching details for document ID: ${documentId}`);
	return new Promise((resolve) => {
		setTimeout(() => {
			const detail = DUMMY_DOCUMENT_DETAILS_SOURCE[documentId];
			if (detail) {
				resolve(detail);
			} else {
				// Fallback for unknown ID, using passed ID if available
				resolve({
					id: documentId,
					imageUrl: `https://placehold.co/800x600/1A1A1A/F5F5F5?text=Doc+${documentId.slice(
						-4
					)}`,
					userName: "Unknown User",
					documentType: "Unknown Document",
					status: "pending", // Default status
					submittedDate: new Date().toLocaleDateString(),
				});
			}
		}, 300);
	});
};
// --- End Dummy Data ---

// Helper to render detail rows (Themed)
const DetailRow: React.FC<{
	label: string;
	value?: string | number | null;
	valueStyle?: StyleProp<TextStyle>;
	children?: React.ReactNode;
	iconName?: keyof typeof MaterialIcons.glyphMap; // Changed from iconPlaceholder
}> = ({ label, value, valueStyle, children, iconName }) => {
	if ((value === undefined || value === null || value === "") && !children)
		return null;
	return (
		<View style={styles.detailRow}>
			<View style={styles.detailLabelContainer}>
				{iconName && (
					<MaterialIcons
						name={iconName}
						size={18}
						color={colors.iconDefault}
						style={styles.detailRowIconThemed}
					/>
				)}
				<Text style={styles.detailLabel}>{label}:</Text>
			</View>
			{value !== undefined && value !== null && (
				<Text style={[styles.detailValue, valueStyle]}>
					{String(value)}
				</Text>
			)}
			{children}
		</View>
	);
};

type ScreenRouteProp = RouteProp<
	AdminStackParamList,
	"AdminDocumentViewerScreen"
>;
type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminDocumentViewerScreen"
>;

interface AdminDocumentViewerScreenProps {
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
}

const AdminDocumentViewerScreen: React.FC<AdminDocumentViewerScreenProps> = ({
	route,
	navigation,
}) => {
	const {
		documentId,
		documentImageUrl: passedImageUrl,
		userName: passedUserName,
		documentType: passedDocumentType,
		status: passedStatus,
		// submittedDate: passedSubmittedDate, // Add if passed
	} = route.params || {};

	const [documentDetails, setDocumentDetails] =
		useState<DocumentDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageDimensions, setImageDimensions] = useState({
		width: Dimensions.get("window").width - spacing.m * 2,
		height: 250, // Default height
	});
	const screenWidth = Dimensions.get("window").width - spacing.m * 2;
	const imagePlaceholderUri =
		"https://placehold.co/800x600/1A1A1A/F5F5F5?text=Document";

	useLayoutEffect(() => {
		const title = documentDetails?.userName
			? `${documentDetails.userName}'s ${documentDetails.documentType}`
			: passedUserName && passedDocumentType
			? `${passedUserName}'s ${passedDocumentType}`
			: "View Document";
		navigation.setOptions({ title });
	}, [navigation, documentDetails, passedUserName, passedDocumentType]);

	useEffect(() => {
		const loadDocument = async () => {
			setIsLoading(true);
			let details: DocumentDetails | null = null;

			if (
				passedImageUrl &&
				passedUserName &&
				passedDocumentType &&
				passedStatus
			) {
				details = {
					id: documentId || "N/A_PASSED",
					imageUrl: passedImageUrl,
					userName: passedUserName,
					documentType: passedDocumentType,
					status: passedStatus,
					submittedDate: route.params?.submittedDate, // Use passed submittedDate
				};
			} else if (documentId) {
				details = await fetchDocumentDetailsAPI(documentId);
			}

			if (details) {
				setDocumentDetails(details);
				if (details.imageUrl) {
					Image.getSize(
						details.imageUrl,
						(width, height) => {
							const aspectRatio = width / height || 1; // Prevent division by zero
							setImageDimensions({
								width: screenWidth,
								height: screenWidth / aspectRatio,
							});
						},
						(error) => {
							console.error("Failed to get image size:", error);
							setImageDimensions({
								width: screenWidth,
								height: 250,
							}); // Fallback
						}
					);
				} else {
					setImageDimensions({ width: screenWidth, height: 250 }); // Fallback if no image URL
				}
			} else {
				Alert.alert(
					"Error",
					"Document information incomplete or not found.",
					[{ text: "OK", onPress: () => navigation.goBack() }]
				);
			}
			setIsLoading(false);
		};
		loadDocument();
	}, [
		documentId,
		passedImageUrl,
		passedUserName,
		passedDocumentType,
		passedStatus,
		navigation,
		screenWidth,
		route.params?.submittedDate,
	]);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading document...</Text>
			</View>
		);
	}

	if (!documentDetails) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="find-in-page"
					size={48}
					color={colors.textDisabled}
				/>
				<Text style={styles.errorText}>
					Could not display document details.
				</Text>
				{/* Optional: Add a button to go back */}
			</View>
		);
	}

	const getStatusDisplay = (
		status: Exclude<DocumentStatusOwner, "all">
	): { color: string; iconName: keyof typeof MaterialIcons.glyphMap } => {
		switch (status) {
			case "approved":
				return { color: colors.success, iconName: "check-circle" };
			case "pending":
				return { color: colors.warning, iconName: "hourglass-empty" };
			case "rejected":
				return { color: colors.error, iconName: "cancel" };
			default:
				return {
					color: colors.textSecondary,
					iconName: "help-outline",
				};
		}
	};
	const statusDisplay = getStatusDisplay(documentDetails.status);

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<View style={styles.infoCard}>
				<Text style={styles.infoTitle}>Document Information</Text>
				<DetailRow
					label="User"
					value={documentDetails.userName}
					iconName="person-outline"
				/>
				<DetailRow
					label="Document Type"
					value={documentDetails.documentType}
					iconName="article"
				/>
				<DetailRow
					label="Status"
					value={
						documentDetails.status.charAt(0).toUpperCase() +
						documentDetails.status.slice(1)
					}
					valueStyle={{
						color: statusDisplay.color,
						fontFamily: typography.primaryBold,
					}}
					iconName={statusDisplay.iconName}
				/>
				{documentDetails.submittedDate && (
					<DetailRow
						label="Submitted"
						value={documentDetails.submittedDate}
						iconName="today"
					/>
				)}
			</View>

			<View style={styles.imageViewerCard}>
				<Text style={styles.imageViewerTitle}>Document Image</Text>
				{documentDetails.imageUrl ? (
					<Image
						source={{ uri: documentDetails.imageUrl }}
						style={[
							styles.documentImage,
							{
								width: imageDimensions.width,
								height: imageDimensions.height,
							},
						]}
						resizeMode="contain"
					/>
				) : (
					<View
						style={[
							styles.noImageContainer,
							{ height: imageDimensions.height },
						]}>
						<MaterialIcons
							name="broken-image"
							size={48}
							color={colors.textDisabled}
						/>
						<Text style={styles.noImageText}>
							Image not available.
						</Text>
					</View>
				)}
			</View>
			{/* Admin viewing screen is typically read-only. Approval actions are on the list screen. */}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme
	},
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain, // Dark theme
		padding: spacing.l,
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textSecondary, // Light text on dark
		fontFamily: typography.primaryRegular,
		fontSize: typography.fontSizes.m,
	},
	errorText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError, // Themed error color
		textAlign: "center",
		marginTop: spacing.s,
	},
	infoCard: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.l,
		borderWidth: 1,
		borderColor: colors.borderDefault, // Subtle border
	},
	infoTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
		paddingBottom: spacing.s,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.s,
		alignItems: "flex-start",
	},
	detailLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 0.4,
		marginRight: spacing.s,
	},
	detailRowIconThemed: {
		// For MaterialIcons in DetailRow
		marginRight: spacing.s,
		marginTop: spacing.xxs, // Align icon better
	},
	// detailRowIcon removed, using MaterialIcons now
	detailLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary, // Light text
		textAlign: "right",
		flex: 0.6,
	},
	imageViewerCard: {
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.l,
		padding: spacing.s,
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	imageViewerTitle: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
		color: colors.textSecondary,
		marginBottom: spacing.m,
		alignSelf: "flex-start",
		paddingHorizontal: spacing.m - spacing.s,
	},
	documentImage: {
		borderRadius: borderRadius.s,
		backgroundColor: colors.backgroundMain, // Darker background for image loading
	},
	noImageContainer: {
		width: "100%",
		// height is dynamic
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundInput, // Slightly different dark for placeholder
		borderRadius: borderRadius.m,
		paddingVertical: spacing.xl,
	},
	noImageText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // Muted placeholder text
		marginTop: spacing.s,
	},
	// Actions section removed as this is view-only for Admin
});

export default AdminDocumentViewerScreen;
