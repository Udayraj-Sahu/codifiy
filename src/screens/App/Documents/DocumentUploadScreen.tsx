// src/screens/App/Documents/DocumentUploadScreen.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react"; // Added useCallback
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux"; // Ensure useSelector is imported
import PrimaryButton from "../../../components/common/PrimaryButton";
import { DocumentUploadScreenProps } from "../../../navigation/types";
import {
	clearUploadError,
	fetchUserDocumentsThunk,
	Document as StoreDocument,
	uploadUserDocumentThunk,
} from "../../../store/slices/documentSlice";
import { AppDispatch, RootState } from "../../../store/store"; // Ensure RootState is imported

import { borderRadius, colors, spacing, typography } from "../../../theme";

interface UploadedDocFile {
	uri: string;
	fileName: string;
	fileSize?: number;
	type?: string;
}

interface DocumentSlotProps {
	label: string;
	docFile: UploadedDocFile | null; // Local selection
	onPickDocument: () => void;
	onRemoveDocument: () => void;
	onUploadDocument: () => void; // New: specific upload for this slot
	isUploading: boolean;
	uploadError?: string | null;
	existingDocument?: StoreDocument | null; // Document from backend
}

const DocumentSlot: React.FC<DocumentSlotProps> = ({
	label,
	docFile,
	onPickDocument,
	onRemoveDocument,
	onUploadDocument,
	isUploading,
	uploadError,
	existingDocument,
}) => {
	const canPick =
		!isUploading &&
		(!existingDocument || existingDocument.status === "rejected");
	const canUpload =
		docFile &&
		!isUploading &&
		(!existingDocument || existingDocument.status === "rejected");

	return (
		<View style={styles.documentSlotContainer}>
			<Text style={styles.slotLabel}>{label}</Text>
			{(!docFile && !existingDocument) ||
			(existingDocument && existingDocument.status === "rejected")
				? canPick && (
						<TouchableOpacity
							style={styles.uploadArea}
							onPress={onPickDocument}
							disabled={isUploading}>
							<Text style={styles.uploadIconPlaceholder}>☁️</Text>
							<Text style={styles.uploadAreaText}>
								Tap to select {label.toLowerCase()}
							</Text>
						</TouchableOpacity>
				  )
				: null}

			{docFile && ( // Display locally selected file if present
				<View style={styles.uploadedFileContainer}>
					<Image
						source={{ uri: docFile.uri }}
						style={styles.fileThumbnail}
					/>
					<View style={styles.fileInfo}>
						<Text style={styles.fileName} numberOfLines={1}>
							{docFile.fileName}
						</Text>
						{docFile.fileSize && (
							<Text style={styles.fileSize}>
								{(docFile.fileSize / (1024 * 1024)).toFixed(2)}{" "}
								MB
							</Text>
						)}
					</View>
					{canPick &&
						!isUploading && ( // Allow removal if not approved/pending and not uploading
							<TouchableOpacity
								onPress={onRemoveDocument}
								style={styles.deleteButton}>
								<Text style={styles.deleteIconPlaceholder}>
									✕
								</Text>
							</TouchableOpacity>
						)}
				</View>
			)}

			{/* Display existing document from backend if no local file selected */}
			{existingDocument && !docFile && (
				<View
					style={[
						styles.uploadedFileContainer,
						styles.existingDocInfo,
					]}>
					<Image
						source={{ uri: existingDocument.fileUrl }}
						style={styles.fileThumbnail}
					/>
					<View style={styles.fileInfo}>
						<Text style={styles.fileName} numberOfLines={1}>
							Uploaded:{" "}
							{new Date(
								existingDocument.uploadedAt
							).toLocaleDateString()}
						</Text>
						<Text
							style={[
								styles.statusText,
								existingDocument.status === "approved"
									? styles.statusApproved
									: existingDocument.status === "pending"
									? styles.statusPending
									: styles.statusRejected,
							]}>
							Status:{" "}
							{existingDocument.status.charAt(0).toUpperCase() +
								existingDocument.status.slice(1)}
						</Text>
						{existingDocument.status === "rejected" &&
							existingDocument.reviewComments && (
								<Text style={styles.errorTextSmall}>
									Reason: {existingDocument.reviewComments}
								</Text>
							)}
					</View>
					{existingDocument.status === "rejected" && (
						<TouchableOpacity
							onPress={onPickDocument}
							style={styles.reUploadButton}>
							<Text style={styles.reUploadButtonText}>
								Re-upload
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			{isUploading && (
				<ActivityIndicator
					style={{ marginTop: spacing.s }}
					color={colors.primary}
				/>
			)}
			{uploadError && (
				<Text
					style={[
						styles.errorText,
						{ textAlign: "center", marginTop: spacing.xs },
					]}>
					{uploadError}
				</Text>
			)}

			{canUpload && (
				<PrimaryButton
					title={`Upload ${label.split(" ")[0]} Side`}
					onPress={onUploadDocument}
					isLoading={isUploading}
					disabled={isUploading}
					style={styles.individualUploadButton}
				/>
			)}
		</View>
	);
};

const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
	navigation,
	route,
}) => {
	const dispatch = useDispatch<AppDispatch>();

	const {
		userDocuments,
		isUploading, // This is the global 'isUploading' from the slice for any document operation
		uploadError: globalUploadError, // This is the global 'uploadError' from the slice
		// You might also have specific loading/error states for fetching userDocuments if needed
	} = useSelector((state: RootState) => state.documents);

	const { user } = useSelector((state: RootState) => state.auth);

	const [docFrontFile, setDocFrontFile] = useState<UploadedDocFile | null>(
		null
	);
	const [docBackFile, setDocBackFile] = useState<UploadedDocFile | null>(
		null
	);

	// State for individual upload attempts for better UI feedback
	const [isUploadingFront, setIsUploadingFront] = useState(false);
	const [isUploadingBack, setIsUploadingBack] = useState(false);
	const [frontUploadError, setFrontUploadError] = useState<string | null>(
		null
	);
	const [backUploadError, setBackUploadError] = useState<string | null>(null);

	useEffect(() => {
		// Fetch user's existing documents when the screen loads or focuses
		if (user?._id) {
			// Ensure user is available
			dispatch(fetchUserDocumentsThunk());
		}
		dispatch(clearUploadError()); // Clear any global upload error on screen load
	}, [dispatch, user?._id]);

	const existingFrontDoc = useMemo(
		() =>
			userDocuments.find(
				(doc) =>
					doc.documentType === "drivers_license" &&
					doc.documentSide === "front"
			),
		[userDocuments]
	);
	const existingBackDoc = useMemo(
		() =>
			userDocuments.find(
				(doc) =>
					doc.documentType === "drivers_license" &&
					doc.documentSide === "back"
			),
		[userDocuments]
	);

	const pickDocument = async (
		setFile: React.Dispatch<React.SetStateAction<UploadedDocFile | null>>,
		docSide: "front" | "back"
	) => {
		const existingDoc =
			docSide === "front" ? existingFrontDoc : existingBackDoc;
		if (
			existingDoc &&
			(existingDoc.status === "approved" ||
				existingDoc.status === "pending")
		) {
			Alert.alert(
				"Info",
				`Your document (${docSide}) is already ${existingDoc.status}. No further action needed unless it was rejected.`
			);
			return;
		}

		const permissionResult =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permissionResult.granted) {
			Alert.alert(
				"Permission Required",
				"Media library access is required."
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
			setFile({
				// setDocFrontFile or setDocBackFile
				uri: asset.uri,
				fileName:
					asset.fileName ||
					`doc_${docSide}_${Date.now()}.${asset.uri
						.split(".")
						.pop()}`,
				fileSize: asset.fileSize,
				type:
					asset.mimeType ||
					(asset.uri.endsWith(".png") ? "image/png" : "image/jpeg"), // Use mimeType, fallback to inferring
			});
			if (docSide === "front") setFrontUploadError(null);
			else setBackUploadError(null);
		}
	};

	const handleUpload = async (
		docFile: UploadedDocFile | null,
		docSide: "front" | "back",
		setIsSubmittingSpecific: React.Dispatch<React.SetStateAction<boolean>>,
		setSpecificError: React.Dispatch<React.SetStateAction<string | null>>
	) => {
		if (!docFile) {
			Alert.alert("No Document", `Please select the ${docSide} side.`);
			return;
		}
		console.log(
			"DocumentUploadScreen: Uploading this file object:",
			JSON.stringify(docFile, null, 2)
		); // <<< ADD THIS LOG
		if (!user) {
			Alert.alert("Error", "User not authenticated.");
			return;
		}

		setIsSubmittingSpecific(true);
		setSpecificError(null);

		try {
			const resultAction = await dispatch(
				uploadUserDocumentThunk({
					documentFile: {
						uri: docFile.uri,
						name: docFile.fileName,
						type: docFile.type || "image/jpeg",
					},
					documentType: "drivers_license", // Or from a picker if you have multiple types
					documentSide: docSide,
				})
			).unwrap(); // unwrap to catch rejected promise here

			// On successful individual upload, resultAction is the new Document object
			Alert.alert(
				"Upload Successful",
				`${
					docSide.charAt(0).toUpperCase() + docSide.slice(1)
				} side submitted.`
			);
			if (docSide === "front") setDocFrontFile(null); // Clear local file
			else setDocBackFile(null);
			// fetchUserDocumentsThunk is dispatched inside uploadUserDocumentThunk on success
		} catch (rejectedValueOrSerializedError: any) {
			// rejectedValueOrSerializedError is the string from rejectWithValue
			setSpecificError(
				rejectedValueOrSerializedError || "Upload failed."
			);
			Alert.alert(
				"Upload Failed",
				rejectedValueOrSerializedError ||
					`Could not upload ${docSide} side.`
			);
		} finally {
			setIsSubmittingSpecific(false);
		}
	};

	// Determine overall screen status based on existing docs
	let overallScreenStatusMessage =
		"Please upload both front and back of your ID.";
	if (
		existingFrontDoc?.status === "pending" ||
		existingBackDoc?.status === "pending"
	) {
		overallScreenStatusMessage = "Your document(s) are pending review.";
	} else if (
		existingFrontDoc?.status === "approved" &&
		existingBackDoc?.status === "approved"
	) {
		overallScreenStatusMessage =
			"Your documents are verified! You're all set.";
	} else if (
		existingFrontDoc?.status === "rejected" ||
		existingBackDoc?.status === "rejected"
	) {
		overallScreenStatusMessage =
			"One or more documents were rejected. Please re-upload.";
	}

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<Text style={styles.title}>Verify Your ID</Text>
			<Text style={styles.subtitle}>
				Upload clear images of the front and back of your Driver's
				License or Government ID.
			</Text>

			<DocumentSlot
				label="Front Side of ID/License"
				docFile={docFrontFile}
				onPickDocument={() => pickDocument(setDocFrontFile, "front")}
				onRemoveDocument={() => {
					setDocFrontFile(null);
					setFrontUploadError(null);
				}}
				onUploadDocument={() =>
					handleUpload(
						docFrontFile,
						"front",
						setIsUploadingFront,
						setFrontUploadError
					)
				}
				isUploading={isUploadingFront}
				// Ensure 'globalUploadError' is used here as destructured from useSelector
				uploadError={
					frontUploadError ||
					(globalUploadError && docFrontFile
						? globalUploadError
						: null)
				}
				existingDocument={existingFrontDoc}
			/>

			<DocumentSlot
				label="Back Side of ID/License"
				docFile={docBackFile}
				onPickDocument={() => pickDocument(setDocBackFile, "back")}
				onRemoveDocument={() => {
					setDocBackFile(null);
					setBackUploadError(null);
				}}
				onUploadDocument={() =>
					handleUpload(
						docBackFile,
						"back",
						setIsUploadingBack,
						setBackUploadError
					)
				}
				isUploading={isUploadingBack}
				// Ensure 'globalUploadError' is used here as destructured from useSelector
				uploadError={
					backUploadError ||
					(globalUploadError && docBackFile
						? globalUploadError
						: null)
				}
				existingDocument={existingBackDoc}
			/>

			<View style={styles.overallStatusBox}>
				<Text style={styles.overallStatusText}>
					{overallScreenStatusMessage}
				</Text>
			</View>

			<View style={styles.tipsContainer}>
				<Text style={styles.tipsIconPlaceholder}>💡</Text>
				<View style={styles.tipsTextContainer}>
					<Text style={styles.tipsTitle}>
						Tips for quick approval:
					</Text>
					<Text style={styles.tipItem}>
						• Ensure all corners are visible.
					</Text>
					<Text style={styles.tipItem}>
						• Good lighting, no blur, no glare.
					</Text>
					<Text style={styles.tipItem}>
						• Use original, valid documents.
					</Text>
				</View>
			</View>

			<TouchableOpacity
				style={styles.helpLinkContainer}
				onPress={() =>
					navigation.navigate("ProfileTab" as any, {
						screen: "ContactSupportScreen",
					})
				}>
				<Text style={styles.helpLinkText}>Help & Support</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

// Styles
const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.white },
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
	title: {
		fontSize: typography.fontSizes.xxxl - 2,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
		textAlign: "center",
	},
	subtitle: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.xl,
		textAlign: "center",
	},
	documentSlotContainer: {
		marginBottom: spacing.xl, // More space between slots
		padding: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
		borderRadius: borderRadius.m,
	},
	slotLabel: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	uploadArea: {
		borderWidth: 2,
		borderColor: colors.primary,
		borderStyle: "dashed",
		borderRadius: borderRadius.l,
		paddingVertical: spacing.xl,
		paddingHorizontal: spacing.l,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.primaryVeryLight || "#F0FFF0",
		minHeight: 150,
	},
	uploadIconPlaceholder: {
		fontSize: 36,
		color: colors.primary,
		marginBottom: spacing.s,
	},
	uploadAreaText: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		color: colors.primaryDark || colors.primary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	uploadedFileContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		borderRadius: borderRadius.m,
		padding: spacing.s, // Reduced padding for a tighter look
	},
	existingDocInfo: {
		// Slightly different style for already uploaded docs
		backgroundColor: colors.greyLightest,
		padding: spacing.m,
	},
	fileThumbnail: {
		width: 80,
		height: 60,
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
	deleteButton: {
		padding: spacing.s,
		marginLeft: spacing.s,
		backgroundColor: colors.errorLight,
		borderRadius: borderRadius.pill,
	},
	deleteIconPlaceholder: { fontSize: 18, color: colors.error },
	reUploadButton: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.s,
		backgroundColor: colors.warningLight,
		borderRadius: borderRadius.s,
		marginLeft: spacing.s,
	},
	reUploadButtonText: {
		color: colors.warningDark,
		fontSize: typography.fontSizes.xs,
	},
	individualUploadButton: {
		marginTop: spacing.m,
		backgroundColor: colors.primary,
	},
	overallStatusBox: {
		marginVertical: spacing.l,
		padding: spacing.m,
		backgroundColor: colors.infoLight,
		borderRadius: borderRadius.m,
		alignItems: "center",
	},
	overallStatusText: {
		fontSize: typography.fontSizes.m,
		color: colors.infoDark,
		textAlign: "center",
		fontWeight: typography.fontWeights.medium,
	},
	statusText: { fontSize: typography.fontSizes.s, marginTop: spacing.xxs },
	statusApproved: { color: colors.successDark, fontWeight: "bold" },
	statusPending: { color: colors.warningDark, fontWeight: "bold" },
	statusRejected: { color: colors.errorDark, fontWeight: "bold" },
	errorText: {
		color: colors.error,
		fontSize: typography.fontSizes.s,
		marginTop: spacing.xs,
	},
	errorTextSmall: {
		color: colors.error,
		fontSize: typography.fontSizes.xs,
		marginTop: spacing.xxs,
	},
	infoText: {
		color: colors.infoDark,
		fontSize: typography.fontSizes.s,
		fontStyle: "italic",
		marginTop: spacing.xs,
	},
	successText: {
		color: colors.successDark,
		fontSize: typography.fontSizes.s,
		fontWeight: "bold",
		marginTop: spacing.xs,
	},
	tipsContainer: {
		flexDirection: "row",
		backgroundColor: colors.warningLight || "#FFF9E6",
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.xl,
		marginTop: spacing.m,
	},
	tipsIconPlaceholder: {
		fontSize: 20,
		color: colors.warningDark || colors.warning,
		marginRight: spacing.m,
		marginTop: spacing.xxs,
	},
	tipsTextContainer: { flex: 1 },
	tipsTitle: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
		color: colors.warningDark || colors.warning,
		marginBottom: spacing.xs,
	},
	tipItem: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		lineHeight: typography.fontSizes.s * 1.5,
		marginBottom: spacing.xxs,
	},
	helpLinkContainer: {
		alignItems: "center",
		paddingVertical: spacing.m,
		marginTop: spacing.s,
	},
	helpLinkText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.medium,
		textDecorationLine: "underline",
	},
});

export default DocumentUploadScreen;
