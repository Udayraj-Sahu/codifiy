// src/screens/Owner/OwnerDocumentViewerScreen.tsx
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
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Added
import { useDispatch, useSelector } from "react-redux"; // Added
import {
	DocumentStatusOwner,
	OwnerStackParamList,
} from "../../navigation/types";
import { AppDispatch, RootState } from "../../store/store"; // Added
import { borderRadius, colors, spacing, typography } from "../../theme";

// TODO: Replace with your actual document slice imports
// Example:
// import {
//  fetchOwnerDocumentDetailsByIdThunk,
//  clearCurrentOwnerDocumentDetail,
//  OwnerViewDocumentDetails // This type should come from your slice or a shared types file
// } from "../../../store/slices/ownerDocumentSlice"; // Or your existing documentSlice

// --- Types (Keep or import from your slice) ---
interface OwnerViewDocumentDetails {
	id?: string;
	imageUrl: string;
	userName: string;
	documentType: string;
	submittedDate?: string;
	status: Exclude<DocumentStatusOwner, "all">;
	// Add other fields like userEmail, documentSide if needed for display
}
// --- End Types ---

// --- Placeholder Thunk (Replace with actual import) ---
const fetchOwnerDocumentDetailsByIdThunk = (documentId: string) => ({
	type: "ownerDocuments/fetchDetailsById/placeholder",
	payload: documentId,
	asyncThunk: async (dispatch: AppDispatch) => {
		dispatch({
			type: "ownerDocuments/fetchDetailsById/pending",
			meta: { arg: documentId },
		});
		console.log(
			`Simulating fetch for owner document details: ${documentId}`
		);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// Simulate API response
		const DUMMY_DETAILS_SOURCE: {
			[key: string]: OwnerViewDocumentDetails;
		} = {
			dl123: {
				id: "dl123",
				imageUrl:
					"https://placehold.co/800x600/1A1A1A/F5F5F5?text=Sarah+J+DL+Dark",
				userName: "Sarah Johnson",
				documentType: "Driving License",
				submittedDate: "May 30, 2025, 2:30 PM",
				status: "approved",
			},
			id456: {
				id: "id456",
				imageUrl:
					"https://placehold.co/800x600/1A1A1A/F5F5F5?text=Michael+C+ID+Dark",
				userName: "Michael Chen",
				documentType: "ID Proof",
				submittedDate: "May 30, 2025, 11:45 AM",
				status: "pending",
			},
		};
		const fetchedData = DUMMY_DETAILS_SOURCE[documentId] || null;
		if (fetchedData) {
			dispatch({
				type: "ownerDocuments/fetchDetailsById/fulfilled",
				payload: fetchedData,
				meta: { arg: documentId },
			});
		} else {
			dispatch({
				type: "ownerDocuments/fetchDetailsById/rejected",
				error: {
					message: "Document details not found for owner view.",
				},
				meta: { arg: documentId },
			});
		}
		return fetchedData;
	},
});
// const clearCurrentOwnerDocumentDetail = () => ({ type: 'ownerDocuments/clearCurrentDetails/placeholder' });
// --- End Placeholder Thunk ---

// Helper to render detail rows with icons
const DetailRow: React.FC<{
	label: string;
	value?: string | number | null;
	valueStyle?: StyleProp<TextStyle>;
	children?: React.ReactNode;
	iconName?: keyof typeof MaterialIcons.glyphMap; // Use MaterialIcons names
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
						style={styles.detailRowIcon}
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

const OwnerDocumentViewerScreen: React.FC<OwnerDocumentViewerScreenProps> = ({
	route,
	navigation,
}) => {
	const {
		documentId, // This ID should be used to fetch details if not all data is passed
		documentImageUrl: passedImageUrl,
		userName: passedUserName,
		documentType: passedDocumentType,
		status: passedStatus,
	} = route.params || {};

	const dispatch = useDispatch<AppDispatch>();

	// TODO: Replace with actual selectors from your document/ownerDocument slice
	const docDetailsFromState = useSelector(
		(state: RootState) =>
			(state as any).documents
				?.currentOwnerDocumentDetail as OwnerViewDocumentDetails | null
	);
	const isLoadingFromState = useSelector(
		(state: RootState) =>
			(state as any).documents?.isLoadingOwnerDocumentDetail as boolean
	);
	const errorFromState = useSelector(
		(state: RootState) =>
			(state as any).documents?.errorOwnerDocumentDetail as string | null
	);
	// --- End Redux Selectors Placeholder ---

	const [docDetails, setDocDetails] =
		useState<OwnerViewDocumentDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [imageDisplayDimensions, setImageDisplayDimensions] = useState({
		width: Dimensions.get("window").width - spacing.m * 2,
		height: 250, // Default height
	});
	const screenWidth = Dimensions.get("window").width - spacing.m * 2; // For image sizing
	const imagePlaceholderUri =
		"https://placehold.co/800x600/1A1A1A/F5F5F5?text=Document";

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
				// If all necessary details are passed via route params, use them directly
				details = {
					id: documentId, // documentId might still be useful for other actions
					imageUrl: passedImageUrl,
					userName: passedUserName,
					documentType: passedDocumentType,
					status: passedStatus,
					submittedDate: route.params?.submittedDate, // If passed
				};
				setDocDetails(details);
				if (details.imageUrl) {
					Image.getSize(
						details.imageUrl,
						(width, height) => {
							const scaleFactor = width / screenWidth;
							const imageHeight = height / scaleFactor;
							setImageDisplayDimensions({
								width: screenWidth,
								height: imageHeight,
							});
						},
						(error) => {
							console.error(
								"Failed to get image size (passed URL):",
								error
							);
							setImageDisplayDimensions({
								width: screenWidth,
								height: 250,
							}); // Fallback
						}
					);
				}
				setIsLoading(false);
			} else if (documentId) {
				// If only documentId is passed, fetch details using thunk
				// @ts-ignore // Placeholder for actual thunk dispatch
				const actionResult = await dispatch(
					fetchOwnerDocumentDetailsByIdThunk(documentId).asyncThunk(
						dispatch
					)
				);
				// TODO: Replace placeholder with actual thunk result handling:
				// const actionResult = await dispatch(fetchOwnerDocumentDetailsByIdThunk(documentId));
				// if (fetchOwnerDocumentDetailsByIdThunk.fulfilled.match(actionResult)) {
				//  const fetchedData = actionResult.payload as OwnerViewDocumentDetails;
				//  setDocDetails(fetchedData);
				//  if (fetchedData.imageUrl) Image.getSize(...);
				// } else {
				//  Alert.alert("Error", "Could not load document details.");
				// }
				// For placeholder:
				if (actionResult) {
					setDocDetails(actionResult as OwnerViewDocumentDetails);
					if ((actionResult as OwnerViewDocumentDetails).imageUrl) {
						Image.getSize(
							(actionResult as OwnerViewDocumentDetails).imageUrl,
							(width, height) => {
								const scaleFactor = width / screenWidth;
								const imageHeight = height / scaleFactor;
								setImageDisplayDimensions({
									width: screenWidth,
									height: imageHeight,
								});
							},
							(error) => {
								console.error(
									"Failed to get image size (fetched URL):",
									error
								);
								setImageDisplayDimensions({
									width: screenWidth,
									height: 250,
								});
							}
						);
					}
				} else {
					Alert.alert("Error", "Document not found.", [
						{ text: "OK", onPress: () => navigation.goBack() },
					]);
				}
				setIsLoading(false);
			} else {
				Alert.alert("Error", "Document information incomplete.", [
					{ text: "OK", onPress: () => navigation.goBack() },
				]);
				setIsLoading(false);
			}
		};

		loadDocument();
		// TODO: return () => dispatch(clearCurrentOwnerDocumentDetail()); // On unmount
	}, [
		documentId,
		passedImageUrl,
		passedUserName,
		passedDocumentType,
		passedStatus,
		navigation,
		dispatch,
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

	// Use errorFromState if you integrate Redux loading/error states fully
	// if (errorFromState) { ... }

	if (!docDetails) {
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
				<PrimaryButton
					title="Go Back"
					onPress={() => navigation.goBack()}
				/>
			</View>
		);
	}

	const getStatusColor = (status: RideStatus): string => {
		switch (status) {
			case "Active": // Assuming 'approved' for documents
			case "approved":
				return colors.success;
			case "Upcoming": // Assuming 'pending' for documents
			case "pending":
				return colors.warning;
			case "Cancelled": // Assuming 'rejected' for documents
			case "rejected":
				return colors.error;
			default:
				return colors.textSecondary;
		}
	};
	const statusIconName =
		docDetails.status === "approved"
			? "check-circle"
			: docDetails.status === "pending"
			? "hourglass-empty"
			: docDetails.status === "rejected"
			? "cancel"
			: "help-outline";

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<View style={styles.infoCard}>
				<Text style={styles.infoTitle}>Document Information</Text>
				<DetailRow
					label="User"
					value={docDetails.userName}
					iconName="person-outline"
				/>
				<DetailRow
					label="Document Type"
					value={docDetails.documentType}
					iconName="article"
				/>
				<DetailRow
					label="Status"
					value={
						docDetails.status.charAt(0).toUpperCase() +
						docDetails.status.slice(1)
					}
					valueStyle={{
						color: getStatusColor(docDetails.status as RideStatus),
						fontFamily: typography.primaryBold,
					}}
					iconName={statusIconName}
				/>
				{docDetails.submittedDate && (
					<DetailRow
						label="Submitted"
						value={docDetails.submittedDate}
						iconName="today"
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
					<View
						style={[
							styles.noImageContainer,
							{ height: imageDisplayDimensions.height },
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
			{/* Owner view is typically read-only for a single document. Actions are on the list screen. */}
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
		paddingBottom: spacing.xl, // Ensure space at bottom
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
		marginBottom: spacing.m,
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
		marginBottom: spacing.s, // Consistent spacing
		alignItems: "flex-start",
	},
	detailLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 0.4, // Adjust flex for label part
		marginRight: spacing.s,
	},
	detailRowIcon: {
		marginRight: spacing.s,
		marginTop: spacing.xxs, // Align icon better with text
	},
	detailLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text for labels
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary, // Light text for values
		textAlign: "right",
		flex: 0.6, // Adjust flex for value part
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
		color: colors.textSecondary, // Muted light text
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
		backgroundColor: colors.backgroundInput, // Slightly different dark for placeholder area
		borderRadius: borderRadius.m,
		paddingVertical: spacing.xl, // Add padding if image is missing
	},
	noImageText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder, // Muted placeholder text
		marginTop: spacing.s,
	},
});

export default OwnerDocumentViewerScreen;
