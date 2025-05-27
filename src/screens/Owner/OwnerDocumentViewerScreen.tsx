// src/screens/Owner/OwnerDocumentViewerScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
	ActivityIndicator, // To get screen dimensions for image
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
import {
	DocumentStatusOwner,
	OwnerStackParamList,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// For image zoom/pan, consider libraries like 'react-native-image-zoom-viewer' or 'react-native-photo-view'.

// --- Dummy Data / Types (similar to AdminDocumentViewerScreen) ---
interface OwnerViewDocumentDetails {
	id?: string; // May not always have ID if URL is direct
	imageUrl: string;
	userName: string;
	documentType: string;
	submittedDate?: string; // Could be passed or fetched
	status: Exclude<DocumentStatusOwner, "all">;
}

// Simulate fetching if only ID is passed, or if more details are needed
const fetchOwnerDocumentDetailsAPI = async (
	documentId: string
): Promise<OwnerViewDocumentDetails | null> => {
	console.log(`OWNER: Fetching details for document ID: ${documentId}`);
	return new Promise((resolve) => {
		setTimeout(() => {
			// Example: Find in a larger dummy dataset or construct
			if (documentId === "dl123") {
				// Corresponds to Sarah Johnson's DL from DocumentApprovalList
				resolve({
					id: "dl123",
					imageUrl:
						"https://via.placeholder.com/800x600.png?text=Sarah+J+DL",
					userName: "Sarah Johnson",
					documentType: "Driving License",
					submittedDate: "Today, 2:30 PM",
					status: "approved",
				});
			} else if (documentId === "id456") {
				// Corresponds to Michael Chen's ID
				resolve({
					id: "id456",
					imageUrl:
						"https://via.placeholder.com/800x600.png?text=Michael+C+ID",
					userName: "Michael Chen",
					documentType: "ID Proof",
					submittedDate: "Today, 11:45 AM",
					status: "pending",
				});
			} else {
				// Fallback if ID doesn't match specific known ones
				resolve({
					id: documentId,
					imageUrl:
						"https://via.placeholder.com/800x600.png?text=Document+" +
						documentId,
					userName: "Unknown User",
					documentType: "Unknown Document",
					status: "pending", // Default status
				});
			}
		}, 300);
	});
};
// --- End Dummy Data ---

type ScreenRouteProp = RouteProp<
	OwnerStackParamList,
	"OwnerDocumentViewerScreen"
>;
type ScreenNavigationProp = StackNavigationProp<
	OwnerStackParamList,
	"OwnerDocumentViewerScreen"
>;

interface OwnerDocumentViewerScreenProps {
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
}
interface DetailRowProps {
	label: string;
	value?: string | number | null;
	valueStyle?: StyleProp<TextStyle>; // Changed from object to StyleProp<TextStyle>
	children?: React.ReactNode;
	iconPlaceholder?: string;
}
const DetailRow: React.FC<DetailRowProps> = ({
	label,
	value,
	valueStyle,
	children,
	iconPlaceholder,
}) => {
	// Render null if no value and no children to avoid empty rows, unless a label always needs to show.
	if ((value === undefined || value === null || value === "") && !children) {
		// If you always want to show the label even if value is empty, remove this check or adjust.
		// For now, if value and children are absent, don't render the row.
		// return null;
	}
	return (
		<View style={styles.detailRow}>
			<View style={styles.detailLabelContainer}>
				{iconPlaceholder && (
					<Text style={styles.detailRowIcon}>{iconPlaceholder}</Text>
				)}
				<Text style={styles.detailLabel}>{label}:</Text>
			</View>
			{value !== undefined && value !== null && (
				<Text style={[styles.detailValue, valueStyle]}>{value}</Text>
			)}
			{children}
		</View>
	);
};

const OwnerDocumentViewerScreen: React.FC<OwnerDocumentViewerScreenProps> = ({
	route,
	navigation,
}) => {
	const {
		documentId,
		documentImageUrl: passedImageUrl,
		userName: passedUserName,
		documentType: passedDocumentType,
		status: passedStatus,
	} = route.params || {};

	const [docDetails, setDocDetails] =
		useState<OwnerViewDocumentDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageDisplayDimensions, setImageDisplayDimensions] = useState({
		width: Dimensions.get("window").width - spacing.m * 2, // Initial width
		height: 250, // Initial default height
	});

	useLayoutEffect(() => {
		const title = docDetails?.userName
			? `${docDetails.userName}'s ${docDetails.documentType}`
			: passedUserName && passedDocumentType
			? `${passedUserName}'s ${passedDocumentType}`
			: "View Document";
		navigation.setOptions({ title });
	}, [navigation, docDetails, passedUserName, passedDocumentType]);

	useEffect(() => {
		const loadDocument = async () => {
			setIsLoading(true);
			let details: OwnerViewDocumentDetails | null = null;

			if (
				passedImageUrl &&
				passedUserName &&
				passedDocumentType &&
				passedStatus
			) {
				details = {
					id: documentId,
					imageUrl: passedImageUrl,
					userName: passedUserName,
					documentType: passedDocumentType,
					status: passedStatus,
					// submittedDate could also be passed
				};
			} else if (documentId) {
				details = await fetchOwnerDocumentDetailsAPI(documentId);
			}

			if (details) {
				setDocDetails(details);
				if (details.imageUrl) {
					Image.getSize(
						details.imageUrl,
						(width, height) => {
							const screenWidth =
								Dimensions.get("window").width - spacing.m * 2;
							const scaleFactor = width / screenWidth;
							const imageHeight = height / scaleFactor;
							setImageDisplayDimensions({
								width: screenWidth,
								height: imageHeight,
							});
						},
						(error) => {
							console.error(
								"Failed to get image size for OwnerDocumentViewer:",
								error
							);
							// Keep default/initial image dimensions or show placeholder for image
							setImageDisplayDimensions({
								width: screenWidth,
								height: 250,
							}); // Fallback height
						}
					);
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
	]);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading document...</Text>
			</View>
		);
	}

	if (!docDetails) {
		return (
			<View style={styles.centered}>
				<Text style={styles.errorText}>
					Could not display document details.
				</Text>
			</View>
		);
	}

	const statusColor =
		docDetails.status === "approved"
			? colors.success
			: docDetails.status === "pending"
			? colors.warning
			: docDetails.status === "rejected"
			? colors.error
			: colors.textMedium;

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<View style={styles.infoCard}>
				<Text style={styles.infoTitle}>Document Information</Text>
				<DetailRow label="User" value={docDetails.userName} />
				<DetailRow
					label="Document Type"
					value={docDetails.documentType}
				/>
				<DetailRow
					label="Status"
					value={
						docDetails.status.charAt(0).toUpperCase() +
						docDetails.status.slice(1)
					}
					valueStyle={{ color: statusColor, fontWeight: "bold" }}
				/>
				{docDetails.submittedDate && (
					<DetailRow
						label="Submitted"
						value={docDetails.submittedDate}
					/>
				)}
			</View>

			<View style={styles.imageViewerCard}>
				<Text style={styles.imageViewerTitle}>Document Image</Text>
				{docDetails.imageUrl ? (
					<Image
						source={{ uri: docDetails.imageUrl }}
						style={[
							styles.documentImage,
							{
								width: imageDisplayDimensions.width,
								height: imageDisplayDimensions.height,
							},
						]}
						resizeMode="contain"
					/>
				) : (
					<View style={styles.noImageContainer}>
						<Text style={styles.noImageText}>
							Image not available.
						</Text>
					</View>
				)}
			</View>
			{/* This screen is view-only for the Owner as per role separation of concerns.
          Approval/Rejection actions are on the DocumentApprovalListScreen. */}
		</ScrollView>
	);
};

// Styles (can be similar to AdminDocumentViewerScreen)
const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	scrollContentContainer: {
		padding: spacing.m,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: spacing.s,
		color: colors.textMedium,
	},
	errorText: {
		fontSize: typography.fontSizes.m,
		color: colors.error,
	},
	infoCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.l,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	infoTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
		paddingBottom: spacing.s,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.s,
	},
	detailLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginRight: spacing.s,
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "right",
		flexShrink: 1,
	},
	imageViewerCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.s, // Less padding around the image itself
		alignItems: "center", // Center the image if it's smaller than container
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	imageViewerTitle: {
		fontSize: typography.fontSizes.s,
		fontWeight: typography.fontWeights.medium,
		color: colors.textSecondary,
		marginBottom: spacing.m,
		alignSelf: "flex-start",
		paddingHorizontal: spacing.m - spacing.s, // Align with card padding
	},
	documentImage: {
		// width and height are set dynamically
		borderRadius: borderRadius.s, // Optional: if you want rounded image corners
		backgroundColor: colors.greyLighter, // Background while image loads or if transparent
	},
	noImageContainer: {
		width: "100%",
		height: 250, // Default height
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.greyLighter,
		borderRadius: borderRadius.m,
	},
	noImageText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
	},
});

export default OwnerDocumentViewerScreen;
