// src/screens/Admin/AdminDocumentViewerScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
	ActivityIndicator, // To get screen dimensions for image
	Alert,
	Dimensions,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { AdminStackParamList } from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// For image zoom/pan, you might use a library like 'react-native-image-zoom-viewer'
// or 'react-native-photo-view'. For this example, we'll use a basic Image component.

// --- Dummy Data / Types ---
interface DocumentDetails {
	id: string;
	imageUrl: string;
	userName: string;
	documentType: string;
	submittedDate?: string;
	status: string;
}

const fetchDocumentDetailsAPI = async (
	documentId: string
): Promise<DocumentDetails | null> => {
	// Simulate API call to fetch full details if only ID is passed
	console.log(`Workspaceing details for document ID: ${documentId}`);
	return new Promise((resolve) => {
		setTimeout(() => {
			// Example: Find in a larger dummy dataset or construct
			if (documentId === "dl123") {
				resolve({
					id: "dl123",
					imageUrl:
						"https://via.placeholder.com/600x400.png?text=Driving+License+DL123",
					userName: "Sarah Johnson",
					documentType: "Driving License",
					submittedDate: "Today, 2:30 PM",
					status: "Approved",
				});
			} else if (documentId === "id456") {
				resolve({
					id: "id456",
					imageUrl:
						"https://via.placeholder.com/600x400.png?text=ID+Proof+ID456",
					userName: "Michael Chen",
					documentType: "ID Proof",
					submittedDate: "Today, 11:45 AM",
					status: "Pending",
				});
			} else {
				resolve(null);
			}
		}, 500);
	});
};
// --- End Dummy Data ---

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
	} = route.params || {};

	const [documentDetails, setDocumentDetails] =
		useState<DocumentDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageDimensions, setImageDimensions] = useState({
		width: Dimensions.get("window").width - spacing.m * 2,
		height: 200,
	});

	useLayoutEffect(() => {
		const title = passedUserName
			? `${passedUserName}'s Document`
			: "View Document";
		navigation.setOptions({
			title: title,
		});
	}, [navigation, passedUserName]);

	useEffect(() => {
		const loadDocument = async () => {
			setIsLoading(true);
			if (passedImageUrl && passedUserName && passedDocumentType) {
				// If essential details are passed, use them directly
				setDocumentDetails({
					id: documentId || "N/A", // Use passed ID or a placeholder
					imageUrl: passedImageUrl,
					userName: passedUserName,
					documentType: passedDocumentType,
					status: passedStatus || "Unknown",
					// submittedDate: could be passed too or fetched
				});
				setIsLoading(false);
			} else if (documentId) {
				// If only ID is passed, fetch details
				const details = await fetchDocumentDetailsAPI(documentId);
				if (details) {
					setDocumentDetails(details);
					// Update title again if userName was fetched
					if (details.userName) {
						navigation.setOptions({
							title: `${details.userName}'s Document`,
						});
					}
				} else {
					Alert.alert("Error", "Could not load document details.");
				}
				setIsLoading(false);
			} else {
				// Not enough information to display
				Alert.alert("Error", "Document information missing.", [
					{ text: "OK", onPress: () => navigation.goBack() },
				]);
				setIsLoading(false);
			}
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

	// Handle image loading to get its aspect ratio for better display
	useEffect(() => {
		if (documentDetails?.imageUrl) {
			Image.getSize(
				documentDetails.imageUrl,
				(width, height) => {
					const screenWidth =
						Dimensions.get("window").width - spacing.m * 2;
					const aspectRatio = width / height;
					setImageDimensions({
						width: screenWidth,
						height: screenWidth / aspectRatio,
					});
				},
				(error) => {
					console.error("Failed to get image size:", error);
					// Keep default image dimensions or show placeholder
				}
			);
		}
	}, [documentDetails?.imageUrl]);

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text>Loading document...</Text>
			</View>
		);
	}

	if (!documentDetails) {
		return (
			<View style={styles.centered}>
				<Text>Could not display document.</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<Text style={styles.title}>
				Document: {documentDetails.documentType}
			</Text>
			<Text style={styles.userInfoText}>
				User: {documentDetails.userName}
			</Text>
			<Text style={styles.userInfoText}>
				Status: {documentDetails.status}
			</Text>
			{documentDetails.submittedDate && (
				<Text style={styles.userInfoText}>
					Submitted: {documentDetails.submittedDate}
				</Text>
			)}

			<View style={styles.imageContainer}>
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
			</View>
			{/* No action buttons for Approve/Reject for Admin */}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	contentContainer: {
		padding: spacing.m,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.s,
	},
	userInfoText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	imageContainer: {
		marginTop: spacing.m,
		marginBottom: spacing.l,
		borderWidth: 1,
		borderColor: colors.borderDefault || "#EEE",
		borderRadius: borderRadius.m,
		backgroundColor: colors.white, // Background for the image container
		alignSelf: "center", // Center the image container if its width is less than screen
		// shadow for the image container
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 3,
	},
	documentImage: {
		// Width and height are set dynamically by imageDimensions state
		borderRadius: borderRadius.m - 1, // Slightly less if container has border
	},
	actionsSection: {
		marginTop: spacing.l,
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault || "#EEE",
		paddingTop: spacing.l,
	},
});

export default AdminDocumentViewerScreen;
