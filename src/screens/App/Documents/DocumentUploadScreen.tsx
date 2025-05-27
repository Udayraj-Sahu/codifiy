// src/screens/App/Documents/DocumentUploadScreen.tsx
import React, { useEffect, useState } from "react"; // Standard React import
import {
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
// Correctly import the props from your types file
import * as ImagePicker from "expo-image-picker";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Using your specified path
import { DocumentUploadScreenProps } from "../../../navigation/types"; // Adjust this path if types.ts is elsewhere relative to this file
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Using your specified path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example for icons

// --- Dummy Data & Types (as defined previously) ---
type DocumentStatus =
	| "not_uploaded"
	| "uploaded"
	| "uploading"
	| "in_progress"
	| "verified"
	| "rejected";
interface UploadedDocument {
	uri: string;
	fileName: string;
	fileSize?: number;
	type?: string;
}

const DUMMY_EXISTING_UPLOADED_FILE: UploadedDocument | null = {
	uri: "https://via.placeholder.com/150x100.png?text=LicenseFront.jpg",
	fileName: "drivers_license.jpg",
	fileSize: 2400000,
	type: "image/jpeg",
};
// --- End Dummy Data ---

// --- StepperDots Placeholder (as defined previously) ---
const StepperDots: React.FC<{ currentStep: number; totalSteps: number }> = ({
	currentStep,
	totalSteps,
}) => {
	return (
		<View style={styles.stepperContainer}>
			{Array.from({ length: totalSteps }).map((_, index) => (
				<View
					key={index}
					style={[
						styles.stepperDot,
						index === currentStep
							? styles.stepperDotActive
							: styles.stepperDotInactive,
					]}
				/>
			))}
		</View>
	);
};
// --- End Stepper Placeholder ---

const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
	navigation,
	route,
}) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [documentImage, setDocumentImage] = useState<UploadedDocument | null>(
		null
	);
	const [documentStatus, setDocumentStatus] =
		useState<DocumentStatus>("not_uploaded");
	const [isUploading, setIsUploading] = useState(false);

	// Example of how to access route-specific params using type guards or checking route.name
	useEffect(() => {
		// console.log('Route Name:', route.name);
		// console.log('Route Params:', route.params);

		if (route.name === "DocumentUploadScreen_FromExplore") {
			const params = route.params; // Typed as ExploreStackParamList['DocumentUploadScreen_FromExplore']
			if (params?.fromBooking) {
				// console.log('Document upload initiated from booking flow.');
			}
		} else if (route.name === "DocumentUploadScreen") {
			const params = route.params; // Typed as DocumentStackParamList['DocumentUploadScreen']
			if (params?.documentType) {
				// console.log('Uploading specific document type:', params.documentType);
			}
		}

		// Simulate fetching current document status (as before)
		if (DUMMY_EXISTING_UPLOADED_FILE && !documentImage) {
			// Only set if not already set by user action
			setDocumentImage(DUMMY_EXISTING_UPLOADED_FILE);
			setDocumentStatus("in_progress");
			setCurrentStep(1); // Assuming first step was upload, now it's verifying
		}
	}, [route.name, route.params, documentImage]); // Add documentImage to dependencies to avoid resetting if user picks one

	const handlePickDocument = async () => {
		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				"Permission Required",
				"Media library access is required to select a document."
			);
			return;
		}
		const pickerResult = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.7,
		});
		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			const asset = pickerResult.assets[0];
			setDocumentImage({
				uri: asset.uri,
				fileName:
					asset.fileName ||
					`document_${Date.now()}.${asset.uri.split(".").pop()}`,
				fileSize: asset.fileSize,
				type: asset.type,
			});
			setDocumentStatus("uploaded");
		}
	};

	const handleRemoveDocument = () => {
		setDocumentImage(null);
		setDocumentStatus("not_uploaded");
	};

	const handleUploadDocument = async () => {
		if (!documentImage) {
			Alert.alert("No Document", "Please select a document to upload.");
			return;
		}
		setIsUploading(true);
		setDocumentStatus("uploading");
		console.log("Uploading document:", documentImage.fileName);
		await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate upload
		setIsUploading(false);
		setDocumentStatus("in_progress");
		Alert.alert(
			"Upload Successful",
			"Your document has been uploaded and is pending verification."
		);
	};

	const getUploadButtonText = () => {
		if (documentStatus === "in_progress" || documentStatus === "verified")
			return "Document Submitted";
		if (isUploading) return "Uploading...";
		return "Upload Document";
	};

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<Text style={styles.title}>Document Upload</Text>
			<Text style={styles.subtitle}>
				Upload your ID documents to verify your account for bike
				rentals.
			</Text>

			<StepperDots currentStep={currentStep} totalSteps={3} />

			{!documentImage && documentStatus !== "in_progress" && (
				<TouchableOpacity
					style={styles.uploadArea}
					onPress={handlePickDocument}>
					<Text style={styles.uploadIconPlaceholder}>☁️</Text>
					<Text style={styles.uploadAreaText}>
						Tap to upload your Driver's License or ID
					</Text>
					<Text style={styles.uploadAreaHint}>
						JPG, PNG or PDF up to 10MB
					</Text>
				</TouchableOpacity>
			)}

			{documentImage && (
				<View style={styles.uploadedFileContainer}>
					<Image
						source={{ uri: documentImage.uri }}
						style={styles.fileThumbnail}
					/>
					<View style={styles.fileInfo}>
						<Text style={styles.fileName} numberOfLines={1}>
							{documentImage.fileName}
						</Text>
						{documentImage.fileSize && (
							<Text style={styles.fileSize}>
								{(
									documentImage.fileSize /
									(1024 * 1024)
								).toFixed(2)}{" "}
								MB
							</Text>
						)}
					</View>
					{documentStatus !== "in_progress" &&
						documentStatus !== "verified" &&
						!isUploading && (
							<TouchableOpacity
								onPress={handleRemoveDocument}
								style={styles.deleteButton}>
								<Text style={styles.deleteIconPlaceholder}>
									🗑️
								</Text>
							</TouchableOpacity>
						)}
				</View>
			)}

			{documentStatus === "in_progress" && (
				<View style={styles.statusMessageContainer}>
					<Text style={styles.statusIconPlaceholder}>🕒</Text>
					<View>
						<Text style={styles.statusMessageTitle}>
							Verification in progress
						</Text>
						<Text style={styles.statusMessageSubtitle}>
							We're reviewing your documents. This usually takes
							1-2 minutes.
						</Text>
					</View>
				</View>
			)}

			<View style={styles.tipsContainer}>
				<Text style={styles.tipsIconPlaceholder}>💡</Text>
				<View style={styles.tipsTextContainer}>
					<Text style={styles.tipsTitle}>
						Tips for quick approval:
					</Text>
					<Text style={styles.tipItem}>
						• Ensure all corners are visible
					</Text>
					<Text style={styles.tipItem}>
						• Good lighting conditions
					</Text>
					<Text style={styles.tipItem}>• No blurry images</Text>
					<Text style={styles.tipItem}>• Original document only</Text>
				</View>
			</View>

			<PrimaryButton
				title={getUploadButtonText()}
				onPress={handleUploadDocument}
				style={styles.uploadButton}
				disabled={
					!documentImage ||
					documentStatus === "uploading" ||
					documentStatus === "in_progress" ||
					documentStatus === "verified" ||
					isUploading
				}
				isLoading={isUploading}
			/>

			<TouchableOpacity
				style={styles.helpLinkContainer}
				onPress={() => console.log("Help & Support pressed")}>
				<Text style={styles.helpLinkText}>Help & Support</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

// --- Styles (ensure these match what was provided before or are correctly defined) ---
const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#FFFFFF",
	},
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
	title: {
		fontSize: typography.fontSizes.xxxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.l,
	},
	stepperContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.xl,
	},
	stepperDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginHorizontal: spacing.xs,
	},
	stepperDotActive: { backgroundColor: colors.primary },
	stepperDotInactive: { backgroundColor: colors.greyLight },
	uploadArea: {
		borderWidth: 2,
		borderColor: colors.primary,
		borderStyle: "dashed",
		borderRadius: borderRadius.l,
		padding: spacing.xl,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.primaryLight || "#E6F7FF",
		minHeight: 180,
		marginBottom: spacing.l,
	},
	uploadIconPlaceholder: {
		fontSize: 40,
		color: colors.primary,
		marginBottom: spacing.s,
	},
	uploadAreaText: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.primaryDark || colors.primary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	uploadAreaHint: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		textAlign: "center",
	},
	uploadedFileContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.l,
	},
	fileThumbnail: {
		width: 60,
		height: 45,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	fileInfo: { flex: 1 },
	fileName: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		color: colors.textPrimary,
	},
	fileSize: { fontSize: typography.fontSizes.s, color: colors.textSecondary },
	deleteButton: { padding: spacing.s },
	deleteIconPlaceholder: { fontSize: 24, color: colors.error },
	statusMessageContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor:  "#E0F3FF",
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.l,
	},
	statusIconPlaceholder: {
		fontSize: 20,
		color: colors.info || "blue",
		marginRight: spacing.s,
	},
	statusMessageTitle: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
		color:  colors.info,
	},
	statusMessageSubtitle: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
	},
	tipsContainer: {
		flexDirection: "row",
		backgroundColor: "#FFF9E6",
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.xl,
	},
	tipsIconPlaceholder: {
		fontSize: 20,
		color: colors.warning || "orange",
		marginRight: spacing.m,
		marginTop: spacing.xxs,
	},
	tipsTextContainer: { flex: 1 },
	tipsTitle: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
		color:  colors.warning,
		marginBottom: spacing.xs,
	},
	tipItem: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		lineHeight: typography.fontSizes.s * 1.5,
	},
	uploadButton: { marginTop: spacing.s },
	helpLinkContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.m,
		marginTop: spacing.s,
	},
	helpLinkText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		marginLeft: spacing.xs,
	},
});

export default DocumentUploadScreen;
