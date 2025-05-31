// src/screens/App/Documents/DocumentUploadScreen.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import { DocumentUploadScreenProps } from "../../../navigation/types";
import {
	clearUploadError,
	fetchUserDocumentsThunk,
	Document as StoreDocument,
	uploadUserDocumentThunk,
} from "../../../store/slices/documentSlice";
import { AppDispatch, RootState } from "../../../store/store";

import { borderRadius, colors, spacing, typography } from "../../../theme";

interface UploadedDocFile {
	uri: string;
	fileName: string;
	fileSize?: number;
	type?: string;
}

interface DocumentSlotProps {
	label: string;
	docFile: UploadedDocFile | null;
	onPickDocument: () => void;
	onRemoveDocument: () => void;
	onUploadDocument: () => void;
	isUploading: boolean;
	uploadError?: string | null;
	existingDocument?: StoreDocument | null;
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

	const placeholderImageUri =
		"https://placehold.co/100x75/1A1A1A/F5F5F5?text=Doc"; // Dark theme placeholder

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
							<MaterialIcons
								name="cloud-upload"
								size={36}
								color={colors.primary}
								style={{ marginBottom: spacing.s }}
							/>
							<Text style={styles.uploadAreaText}>
								Tap to select{" "}
								{label
									.toLowerCase()
									.replace(" side of id/license", "")}
							</Text>
						</TouchableOpacity>
				  )
				: null}

			{docFile && (
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
					{canPick && !isUploading && (
						<TouchableOpacity
							onPress={onRemoveDocument}
							style={styles.deleteButton}>
							<MaterialIcons
								name="close"
								size={18}
								color={colors.error}
							/>
						</TouchableOpacity>
					)}
				</View>
			)}

			{existingDocument && !docFile && (
				<View
					style={[
						styles.uploadedFileContainer,
						styles.existingDocInfo,
					]}>
					<Image
						source={{
							uri:
								existingDocument.fileUrl || placeholderImageUri,
						}}
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
					{existingDocument.status === "rejected" && canPick && (
						<TouchableOpacity
							onPress={onPickDocument}
							style={styles.reUploadButton}>
							<MaterialIcons
								name="file-upload"
								size={16}
								color={colors.warning}
								style={{ marginRight: spacing.xs }}
							/>
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
						{ textAlign: "center", marginTop: spacing.s },
					]}>
					{uploadError}
				</Text>
			)}

			{canUpload && (
				<PrimaryButton
					title={`Upload ${label.split(" ")[0]}`}
					onPress={onUploadDocument}
					isLoading={isUploading}
					disabled={isUploading}
					style={styles.individualUploadButton}
					// PrimaryButton uses its own themed styles
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
	const { userDocuments, uploadError: globalUploadError } = useSelector(
		(state: RootState) => state.documents
	);
	const { user } = useSelector((state: RootState) => state.auth);

	const [docFrontFile, setDocFrontFile] = useState<UploadedDocFile | null>(
		null
	);
	const [docBackFile, setDocBackFile] = useState<UploadedDocFile | null>(
		null
	);
	const [isUploadingFront, setIsUploadingFront] = useState(false);
	const [isUploadingBack, setIsUploadingBack] = useState(false);
	const [frontUploadError, setFrontUploadError] = useState<string | null>(
		null
	);
	const [backUploadError, setBackUploadError] = useState<string | null>(null);

	useEffect(() => {
		if (user?._id) {
			dispatch(fetchUserDocumentsThunk());
		}
		dispatch(clearUploadError());
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
				`Your document (${docSide}) is already ${existingDoc.status}.`
			);
			return;
		}

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
			allowsEditing: true, // Consider allowing crop/edit
			aspect: [16, 10], // Aspect ratio for driver's license might be closer to this
			quality: 0.8, // Slightly higher quality
		});

		if (
			!pickerResult.canceled &&
			pickerResult.assets &&
			pickerResult.assets.length > 0
		) {
			const asset = pickerResult.assets[0];
			setFile({
				uri: asset.uri,
				fileName:
					asset.fileName ||
					`doc_${docSide}_${Date.now()}.${asset.uri
						.split(".")
						.pop()}`,
				fileSize: asset.fileSize,
				type:
					asset.mimeType ||
					(asset.uri.endsWith(".png") ? "image/png" : "image/jpeg"),
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
			Alert.alert(
				"No Document",
				`Please select the ${docSide} side to upload.`
			);
			return;
		}
		if (!user) {
			Alert.alert(
				"Authentication Error",
				"User not found. Please log in again."
			);
			return;
		}

		setIsSubmittingSpecific(true);
		setSpecificError(null);
		dispatch(clearUploadError()); // Clear global error before new attempt

		try {
			await dispatch(
				uploadUserDocumentThunk({
					documentFile: {
						uri: docFile.uri,
						name: docFile.fileName,
						type: docFile.type || "image/jpeg",
					},
					documentType: "drivers_license",
					documentSide: docSide,
				})
			).unwrap();

			Alert.alert(
				"Upload Successful",
				`${
					docSide.charAt(0).toUpperCase() + docSide.slice(1)
				} side submitted for review.`
			);
			if (docSide === "front") setDocFrontFile(null);
			else setDocBackFile(null);
			// fetchUserDocumentsThunk is dispatched inside uploadUserDocumentThunk on success
		} catch (rejectedValueOrSerializedError: any) {
			const errorMessage =
				rejectedValueOrSerializedError?.message ||
				rejectedValueOrSerializedError ||
				"Upload failed. Please try again.";
			setSpecificError(errorMessage);
			Alert.alert("Upload Failed", errorMessage);
		} finally {
			setIsSubmittingSpecific(false);
		}
	};

	let overallScreenStatusMessage =
		"Please upload clear images of both front and back of your ID/License.";
	const frontStatus = existingFrontDoc?.status;
	const backStatus = existingBackDoc?.status;

	if (frontStatus === "approved" && backStatus === "approved") {
		overallScreenStatusMessage =
			"Your documents are verified! You're all set.";
	} else if (frontStatus === "pending" || backStatus === "pending") {
		overallScreenStatusMessage =
			"Your document(s) are under review. This may take some time.";
	} else if (frontStatus === "rejected" || backStatus === "rejected") {
		overallScreenStatusMessage =
			"One or both documents were rejected. Please review the reason and re-upload.";
	} else if (existingFrontDoc || existingBackDoc) {
		overallScreenStatusMessage =
			"Please complete uploading both sides of your document for review.";
	}

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<Text style={styles.title}>Verify Your ID</Text>
			<Text style={styles.subtitle}>
				Upload clear images of the front and back of your Driver's
				License or other Government ID.
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
				uploadError={
					backUploadError ||
					(globalUploadError && docBackFile
						? globalUploadError
						: null)
				}
				existingDocument={existingBackDoc}
			/>

			<View style={styles.overallStatusBox}>
				<MaterialIcons
					name={
						frontStatus === "approved" && backStatus === "approved"
							? "check-circle"
							: frontStatus === "rejected" ||
							  backStatus === "rejected"
							? "error"
							: frontStatus === "pending" ||
							  backStatus === "pending"
							? "hourglass-empty"
							: "info"
					}
					size={24}
					color={
						frontStatus === "approved" && backStatus === "approved"
							? colors.success
							: frontStatus === "rejected" ||
							  backStatus === "rejected"
							? colors.error
							: frontStatus === "pending" ||
							  backStatus === "pending"
							? colors.warning
							: colors.info
					}
					style={{ marginBottom: spacing.s }}
				/>
				<Text style={styles.overallStatusText}>
					{overallScreenStatusMessage}
				</Text>
			</View>

			<View style={styles.tipsContainer}>
				<MaterialIcons
					name="lightbulb-outline"
					size={24}
					color={colors.warning}
					style={styles.tipsIcon}
				/>
				<View style={styles.tipsTextContainer}>
					<Text style={styles.tipsTitle}>
						Tips for quick approval:
					</Text>
					<Text style={styles.tipItem}>
						• Ensure all document corners are visible.
					</Text>
					<Text style={styles.tipItem}>
						• Use good lighting, avoid blur and glare.
					</Text>
					<Text style={styles.tipItem}>
						• Upload original, valid, and clear documents.
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
				<Text style={styles.helpLinkText}>
					Need Help? Contact Support
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	title: {
		fontSize: typography.fontSizes.xxxl, // Kept large as it's a primary screen title
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.s, // Adjusted margin
		textAlign: "center",
	},
	subtitle: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		marginBottom: spacing.xl,
		textAlign: "center",
		paddingHorizontal: spacing.s, // Add some horizontal padding for multi-line text
	},
	documentSlotContainer: {
		marginBottom: spacing.xl,
		padding: spacing.m, // Increased padding for the slot
		borderWidth: 1,
		borderColor: colors.borderDefault, // Themed border
		borderRadius: borderRadius.l, // Larger radius for distinct slots
		backgroundColor: colors.backgroundCard, // Dark card background
	},
	slotLabel: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	uploadArea: {
		borderWidth: 2,
		borderColor: colors.primary, // Accent color border
		borderStyle: "dashed",
		borderRadius: borderRadius.m, // Standard radius
		paddingVertical: spacing.xl,
		paddingHorizontal: spacing.l,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.backgroundMain, // Slightly different from card for depth
		minHeight: 150,
	},
	uploadAreaText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		textAlign: "center",
		marginTop: spacing.xs, // Spacing from icon
	},
	uploadedFileContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundMain, // Darker inner area
		borderRadius: borderRadius.m,
		padding: spacing.s,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	existingDocInfo: {
		backgroundColor: colors.backgroundCard, // Consistent card background
		padding: spacing.m, // More padding for existing docs
	},
	fileThumbnail: {
		width: 80,
		height: 60,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault, // Placeholder bg for thumbnail
	},
	fileInfo: { flex: 1 },
	fileName: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
	},
	fileSize: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	deleteButton: {
		padding: spacing.s,
		marginLeft: spacing.s,
		// backgroundColor: 'transparent', // No background, just icon
		borderRadius: borderRadius.circle,
	},
	// deleteIconPlaceholder removed, using MaterialIcons now
	reUploadButton: {
		paddingVertical: spacing.s,
		paddingHorizontal: spacing.m,
		backgroundColor: colors.backgroundCard, // Use card bg for less emphasis
		borderRadius: borderRadius.m,
		borderWidth: 1,
		borderColor: colors.warning, // Warning color border
		marginLeft: "auto", // Push to the right if space allows, or use flex end on parent
		marginTop: spacing.s,
		flexDirection: "row",
		alignItems: "center",
	},
	reUploadButtonText: {
		color: colors.warning, // Warning color text
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
	individualUploadButton: {
		// This is for the PrimaryButton instance
		marginTop: spacing.m,
		// PrimaryButton handles its own theming (bg, text color)
	},
	overallStatusBox: {
		marginVertical: spacing.l,
		padding: spacing.m,
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.m,
		alignItems: "center",
		borderLeftWidth: 4, // Add a colored indicator border
		// Border color set dynamically below based on status
	},
	overallStatusText: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary, // Primary text color
		textAlign: "center",
		fontFamily: typography.primaryRegular,
	},
	statusText: {
		// For specific status text inside DocumentSlot for existing docs
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular, // Regular weight for status
		marginTop: spacing.xxs,
	},
	statusApproved: { color: colors.success }, // Light green on dark theme
	statusPending: { color: colors.warning }, // Light yellow/orange on dark theme
	statusRejected: { color: colors.error }, // Light red on dark theme
	errorText: {
		color: colors.textError, // Use theme error color
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		marginTop: spacing.xs,
	},
	errorTextSmall: {
		color: colors.textError,
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		marginTop: spacing.xxs,
	},
	tipsContainer: {
		flexDirection: "row",
		backgroundColor: colors.backgroundCard, // Dark card background
		borderRadius: borderRadius.m,
		padding: spacing.m,
		marginBottom: spacing.xl,
		marginTop: spacing.m,
		borderLeftWidth: 4,
		borderLeftColor: colors.info, // Info color for tips
	},
	tipsIcon: {
		// Replaced emoji placeholder
		marginRight: spacing.m,
		marginTop: spacing.xxs,
	},
	tipsTextContainer: { flex: 1 },
	tipsTitle: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Use primary text, icon provides semantic color
		marginBottom: spacing.xs,
	},
	tipItem: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text for tips
		lineHeight: typography.lineHeights.getForSize(
			typography.fontSizes.s,
			"body"
		),
		marginBottom: spacing.xxs,
	},
	helpLinkContainer: {
		alignItems: "center",
		paddingVertical: spacing.m,
		marginTop: spacing.s,
	},
	helpLinkText: {
		color: colors.textLink, // Use theme link color
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		textDecorationLine: "underline",
	},
});

export default DocumentUploadScreen;
