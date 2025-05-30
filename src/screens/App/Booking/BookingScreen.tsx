// src/screens/App/Booking/BookingScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
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
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton";
import StyledTextInput from "../../../components/common/StyledTextInput";
import { ExploreStackParamList } from "../../../navigation/types";
import * as bookingService from "../../../services/bookingService"; // For verifyPaymentAPI
import {
	calculateBookingPriceThunk,
	clearBookingState,
	createBookingThunk,
	fetchBikeSummaryForBooking,
	PriceCalculationResponse,
	setPriceDetails,
} from "../../../store/slices/bookingSlice";
import { fetchUserDocumentsThunk } from "../../../store/slices/documentSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Checkbox Placeholder ---
const Checkbox: React.FC<{
	label: React.ReactNode;
	checked: boolean;
	onPress: () => void;
}> = ({ label, checked, onPress }) => (
	<TouchableOpacity
		onPress={onPress}
		style={styles.checkboxContainer}
		accessibilityState={{ checked }}>
		<View style={[styles.checkbox, checked && styles.checkboxChecked]}>
			{checked && <Text style={styles.checkboxCheckmark}>✓</Text>}
		</View>
		{typeof label === "string" ? (
			<Text style={styles.checkboxLabelText}>{label}</Text>
		) : (
			label
		)}
	</TouchableOpacity>
);
// --- End Checkbox Placeholder ---

type BookingScreenRouteProp = RouteProp<ExploreStackParamList, "Booking">;
type BookingScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"Booking"
>;

interface BookingScreenProps {
	route: BookingScreenRouteProp;
	navigation: BookingScreenNavigationProp;
}

const BookingScreen: React.FC<BookingScreenProps> = ({ route, navigation }) => {
	const {
		bikeId,
		startDate: startDateISO,
		endDate: endDateISO,
	} = route.params as any;

	const dispatch = useDispatch<AppDispatch>();
	const {
		bikeSummary: bike,
		priceDetails,
		isLoadingBike,
		isCalculatingPrice,
		isCreatingBooking,
		errorBike,
		errorPrice,
		errorBooking,
	} = useSelector((state: RootState) => state.bookingProcess);

	const { user: authUser, token } = useSelector(
		(state: RootState) => state.auth
	);
	const { userDocuments, isLoadingUserDocs } = useSelector(
		(state: RootState) => state.documents
	);

	const [promoCodeInput, setPromoCodeInput] = useState(
		route.params?.appliedPromoCodeDetails?.promoApplied?.code || ""
	);
	const [agreedToTerms, setAgreedToTerms] = useState(false);

	const rentalStartDate = useMemo(
		() => (startDateISO ? new Date(startDateISO) : null),
		[startDateISO]
	);
	const rentalEndDate = useMemo(
		() => (endDateISO ? new Date(endDateISO) : null),
		[endDateISO]
	);

	const isUserDocumentVerified = useMemo(() => {
		if (isLoadingUserDocs || !userDocuments || userDocuments.length === 0)
			return false; // Assume not verified if loading or no docs
		const frontLicense = userDocuments.find(
			(doc) =>
				doc.documentType === "drivers_license" &&
				doc.documentSide === "front"
		);
		const backLicense = userDocuments.find(
			(doc) =>
				doc.documentType === "drivers_license" &&
				doc.documentSide === "back"
		);
		return (
			frontLicense?.status === "approved" &&
			backLicense?.status === "approved"
		);
	}, [userDocuments, isLoadingUserDocs]);

	useEffect(() => {
		dispatch(clearBookingState());
		console.log("BookingScreen: bikeId received:", bikeId);
		if (bikeId) {
			console.log(
				"BookingScreen: Dispatching fetchBikeSummaryForBooking with bikeId:",
				bikeId
			);
			dispatch(fetchBikeSummaryForBooking(bikeId));
		} else {
			console.error("BookingScreen: bikeId is missing!");
			Alert.alert(
				"Error",
				"Bike information is missing. Please go back and try again.",
				[{ text: "OK", onPress: () => navigation.goBack() }]
			);
		}
		if (authUser?._id) {
			console.log(
				"BookingScreen: Dispatching fetchUserDocumentsThunk for user:",
				authUser._id
			);
			dispatch(fetchUserDocumentsThunk());
		}
	}, [dispatch, bikeId, authUser?._id]);

	useEffect(() => {
		if (
			bike &&
			rentalStartDate &&
			rentalEndDate &&
			rentalEndDate > rentalStartDate &&
			token
		) {
			const params = {
				bikeId: bike._id,
				startTime: rentalStartDate.toISOString(),
				endTime: rentalEndDate.toISOString(),
				promoCode:
					route.params?.appliedPromoCodeDetails?.promoApplied?.code ||
					promoCodeInput.trim() ||
					undefined,
				token: token,
			};
			console.log(
				"BookingScreen: Dispatching calculateBookingPriceThunk with params:",
				params
			);
			dispatch(calculateBookingPriceThunk(params));
		} else {
			if (
				bike &&
				rentalStartDate &&
				rentalEndDate &&
				rentalEndDate > rentalStartDate &&
				!token &&
				authUser
			) {
				// Added authUser check to avoid warning before auth state is ready
				console.warn(
					"BookingScreen: Token is missing for price calculation, but user is present."
				);
			}
			dispatch(setPriceDetails(null));
		}
	}, [
		dispatch,
		bike,
		rentalStartDate,
		rentalEndDate,
		promoCodeInput,
		route.params?.appliedPromoCodeDetails,
		token,
		authUser,
	]); // Added authUser to deps

	useEffect(() => {
		if (route.params?.appliedPromoCodeDetails) {
			console.log(
				"BookingScreen: Received appliedPromoCodeDetails from route:",
				route.params.appliedPromoCodeDetails
			);
			dispatch(
				setPriceDetails(
					route.params
						.appliedPromoCodeDetails as PriceCalculationResponse
				)
			);
			setPromoCodeInput(
				route.params.appliedPromoCodeDetails.promoApplied?.code || ""
			);
			navigation.setParams({ appliedPromoCodeDetails: undefined } as any);
		}
	}, [route.params?.appliedPromoCodeDetails, dispatch, navigation]);

	const handleEditUserInfo = () =>
		navigation.navigate("ProfileTab" as any, { screen: "EditProfile" });

	const handleNavigateToApplyPromo = () => {
		if (!bike || !rentalStartDate || !rentalEndDate) {
			Alert.alert("Error", "Please select rental dates first.");
			return;
		}
		navigation.navigate("ApplyPromoCode", {
			currentBikeId: bike._id,
			currentSubtotal:
				priceDetails?.originalAmount ||
				bike.pricePerHour *
					((rentalEndDate.getTime() - rentalStartDate.getTime()) /
						(1000 * 60 * 60)),
			startDate: rentalStartDate.toISOString(), // Pass dates to ApplyPromoCode
			endDate: rentalEndDate.toISOString(),
		});
	};

	const handleConfirmBooking = async () => {
		if (!agreedToTerms) {
			Alert.alert(
				"Agreement Required",
				"Please agree to Bikya's Terms & Conditions."
			);
			return;
		}
		if (
			!bike ||
			!rentalStartDate ||
			!rentalEndDate ||
			!priceDetails ||
			!token ||
			!authUser
		) {
			Alert.alert(
				"Error",
				"Booking details are incomplete or session expired. Please try again."
			);
			console.error("Missing data for booking:", {
				bike,
				rentalStartDate,
				rentalEndDate,
				priceDetails,
				token,
				authUser,
			});
			return;
		}

		console.log(
			"BookingScreen: Checking document verification status. Verified:",
			isUserDocumentVerified
		);
		if (!isUserDocumentVerified) {
			Alert.alert(
				"ID Verification Required",
				"Please upload and verify your ID documents before confirming your booking.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Upload Documents",
						onPress: () =>
							navigation.navigate(
								"DocumentUploadScreen_FromExplore",
								{
									fromBooking: true,
									bookingAttemptDetails: {
										bikeId: bike._id,
										startDate:
											rentalStartDate.toISOString(),
										endDate: rentalEndDate.toISOString(),
									},
								}
							),
					},
				]
			);
			return;
		}

		const params = {
			bikeId: bike._id,
			startTime: rentalStartDate.toISOString(),
			endTime: rentalEndDate.toISOString(),
			promoCodeId: priceDetails.promoIdForNextStep,
			finalAmountFromClient: priceDetails.finalAmount,
			token: token,
		};
		console.log(
			"BookingScreen: Dispatching createBookingThunk with params:",
			params
		);
		const resultAction = await dispatch(createBookingThunk(params));

		if (createBookingThunk.fulfilled.match(resultAction)) {
			const bookingResponse = resultAction.payload;
			console.log(
				"BookingScreen: createBookingThunk fulfilled, response:",
				bookingResponse
			);
			if (
				bookingResponse.razorpayOrderId &&
				bookingResponse.razorpayKeyId &&
				authUser
			) {
				const options = {
					description: `Booking for ${bike.model}`,
					image:
						bike.images[0]?.url ||
						"https://via.placeholder.com/100",
					currency: bookingResponse.currency || "INR",
					key: bookingResponse.razorpayKeyId,
					amount: bookingResponse.amount,
					name: "Bikya Bike Rentals",
					order_id: bookingResponse.razorpayOrderId,
					prefill: {
						email: authUser.email,
						contact: (authUser as any).phone || "",
						name: authUser.fullName,
					},
					theme: { color: colors.primary },
					handler: async (response: any) => {
						console.log("Razorpay success response:", response);
						try {
							await bookingService.verifyPaymentAPI(
								{
									razorpay_payment_id:
										response.razorpay_payment_id,
									razorpay_order_id:
										response.razorpay_order_id,
									razorpay_signature:
										response.razorpay_signature,
									bookingId: bookingResponse.bookingId,
								},
								token
							);
							navigation.navigate("BookingConfirmation", {
								bookingId: bookingResponse.bookingId,
							});
						} catch (verificationError: any) {
							console.error(
								"Payment verification error:",
								verificationError
							);
							Alert.alert(
								"Payment Verification Failed",
								verificationError.message ||
									"Could not verify payment."
							);
						}
					},
					modal: {
						ondismiss: () => {
							Alert.alert(
								"Payment Cancelled",
								"You have cancelled the payment process."
							);
						},
					},
				};
				console.log(
					"RAZORPAY CHECKOUT SIMULATION (Opening...):",
					options
				);
				Alert.alert(
					"Payment Simulation",
					"Razorpay checkout would open here. Simulating success to proceed.",
					[
						{
							text: "OK",
							onPress: () =>
								navigation.navigate("BookingConfirmation", {
									bookingId: bookingResponse.bookingId,
								}),
						},
					]
				);
			} else if (bookingResponse.bookingDetails) {
				// Free booking or already confirmed
				navigation.navigate("BookingConfirmation", {
					bookingId: bookingResponse.bookingId,
				});
			}
		} else if (createBookingThunk.rejected.match(resultAction)) {
			console.error(
				"BookingScreen: createBookingThunk rejected, error:",
				resultAction.payload
			);
			Alert.alert(
				"Booking Failed",
				resultAction.payload || "Could not create your booking."
			);
		}
	};

	console.log("BookingScreen State Check (before loading return):", {
		isLoadingBike,
		isBikeNull: bike === null,
		isAuthUserNull: authUser === null,
		isRentalStartDateNull: rentalStartDate === null,
		isRentalEndDateNull: rentalEndDate === null,
		isLoadingUserDocs,
		isUserDocumentVerified,
		errorBike,
	});

	if (
		isLoadingBike ||
		!authUser ||
		!rentalStartDate ||
		!rentalEndDate ||
		isLoadingUserDocs ||
		(bikeId && !bike)
	) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingMessage}>
					Loading booking summary...
				</Text>
				{isLoadingBike && (
					<Text style={styles.smallLoadingText}>
						Fetching bike details...
					</Text>
				)}
				{!authUser && (
					<Text style={styles.smallLoadingText}>
						Waiting for user session...
					</Text>
				)}
				{isLoadingUserDocs && (
					<Text style={styles.smallLoadingText}>
						Checking verification status...
					</Text>
				)}
				{errorBike && (
					<Text style={styles.errorText}>Error: {errorBike}</Text>
				)}
			</View>
		);
	}
	// This specific error check might be redundant if !bike is already in the main loading condition
	// if (errorBike && !bike) { ... }

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			{/* Bike Info Card */}
			<View style={styles.card}>
				<Image
					source={
						bike.images[0]?.url
							? { uri: bike.images[0].url }
							: require("../../../../assets/images/icon.png")
					}
					style={styles.bikeImage}
				/>
				<View style={styles.bikeInfoContainer}>
					<Text style={styles.bikeName}>{bike.model} </Text>
				</View>
			</View>

			{/* Dates Card */}
			<View style={styles.card}>
				<View style={styles.dateTimeRow}>
					<View>
						<Text style={styles.dateTimeLabel}>Start Date</Text>
						<Text style={styles.dateTimeValue}>
							{rentalStartDate.toLocaleDateString()} •{" "}
							{rentalStartDate.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</View>
					<View>
						<Text style={styles.dateTimeLabel}>End Date</Text>
						<Text style={styles.dateTimeValue}>
							{rentalEndDate.toLocaleDateString()} •{" "}
							{rentalEndDate.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</View>
				</View>
			</View>

			{/* Price Details Card */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Price Details</Text>
				{isCalculatingPrice && !priceDetails && (
					<ActivityIndicator
						color={colors.primary}
						style={{ marginVertical: spacing.m }}
					/>
				)}
				{errorPrice && (
					<Text style={styles.errorText}>
						Error calculating price: {errorPrice}
					</Text>
				)}
				{priceDetails ? (
					<>
						<View style={styles.priceRow}>
							<Text style={styles.priceLabel}>
								Subtotal (
								{priceDetails.durationHours.toFixed(1)} hours)
							</Text>
							<Text style={styles.priceValue}>
								₹{priceDetails.originalAmount.toFixed(2)}
							</Text>
						</View>
						{priceDetails.promoApplied && (
							<View style={styles.priceRow}>
								<Text
									style={[
										styles.priceLabel,
										styles.promoText,
									]}>
									Promo ({priceDetails.promoApplied.code})
								</Text>
								<Text
									style={[
										styles.priceValue,
										styles.promoText,
									]}>
									- ₹{priceDetails.discountAmount.toFixed(2)}
								</Text>
							</View>
						)}
						<View style={styles.priceRow}>
							<Text style={styles.priceLabel}>Taxes & Fees</Text>
							<Text style={styles.priceValue}>
								₹{priceDetails.taxesAndFees.toFixed(2)}
							</Text>
						</View>
						<View style={[styles.priceRow, styles.totalRow]}>
							<Text style={[styles.priceLabel, styles.totalText]}>
								Total Amount
							</Text>
							<Text
								style={[
									styles.priceValue,
									styles.totalText,
									styles.totalAmountValue,
								]}>
								₹{priceDetails.finalAmount.toFixed(2)}
							</Text>
						</View>
					</>
				) : (
					!isCalculatingPrice && (
						<Text style={styles.infoText}>
							Enter dates to see price.
						</Text>
					)
				)}
			</View>

			{/* Promo Code Card */}
			<View style={[styles.card, styles.promoInputCard]}>
				<StyledTextInput
					label="Promo Code"
					placeholder="Enter code or tap Offers"
					value={promoCodeInput}
					onChangeText={setPromoCodeInput}
					containerStyle={{ flex: 1, marginBottom: 0 }}
					editable={!isCalculatingPrice && !isCreatingBooking}
				/>
				<TouchableOpacity
					onPress={handleNavigateToApplyPromo}
					style={styles.applyPromoButton}
					disabled={
						isCalculatingPrice ||
						isCreatingBooking ||
						!bike ||
						!rentalStartDate ||
						!rentalEndDate
					}>
					<Text style={styles.applyPromoButtonText}>
						{priceDetails?.promoApplied ? "Change" : "Offers"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* User Info Card */}
			<View style={styles.card}>
				<View style={styles.userInfoHeader}>
					<Text style={styles.sectionTitle}>User Information</Text>
					<TouchableOpacity onPress={handleEditUserInfo}>
						<Text style={styles.editText}>Edit</Text>
					</TouchableOpacity>
				</View>
				<Text style={styles.userInfoText}>{authUser.fullName}</Text>
				<Text style={styles.userInfoText}>
					{(authUser as any).phone || "Phone not set"}
				</Text>
				<Text style={styles.userInfoText}>{authUser.email}</Text>
			</View>

			{/* Terms & Conditions */}
			<View style={styles.termsContainer}>
				<Checkbox
					label={
						<Text style={styles.checkboxLabelText}>
							I agree to Bikya's{" "}
							<Text style={styles.linkText}>
								Terms & Conditions
							</Text>
						</Text>
					}
					checked={agreedToTerms}
					onPress={() => setAgreedToTerms(!agreedToTerms)}
				/>
			</View>

			{/* Confirm Button */}
			<PrimaryButton
				title={
					isCreatingBooking ? "Processing..." : "Confirm & Proceed"
				}
				onPress={handleConfirmBooking}
				style={styles.confirmButton}
				disabled={
					!agreedToTerms ||
					isCreatingBooking ||
					!priceDetails ||
					isCalculatingPrice ||
					isLoadingUserDocs
				}
				isLoading={
					isCreatingBooking ||
					isLoadingUserDocs /* Show loading for doc check too */
				}
			/>
			{errorBooking && (
				<Text
					style={[
						styles.errorText,
						{ marginTop: spacing.s, textAlign: "center" },
					]}>
					{errorBooking}
				</Text>
			)}
			<TouchableOpacity
				onPress={() =>
					navigation.navigate("ProfileTab" as any, {
						screen: "ContactSupportScreen",
					})
				}>
				<Text style={styles.helpText}>Need help? Contact support</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

// Styles
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.backgroundMain || "#F4F4F4" },
	contentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	loadingMessage: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		marginTop: spacing.s,
	},
	smallLoadingText: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		marginTop: spacing.s,
	},
	errorText: {
		color: colors.error,
		fontSize: typography.fontSizes.s,
		textAlign: "center",
		marginVertical: spacing.s,
	},
	infoText: {
		color: colors.textMedium,
		fontSize: typography.fontSizes.s,
		textAlign: "center",
		marginVertical: spacing.m,
	},
	card: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	bikeImage: {
		width: "100%",
		height: 150,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	bikeInfoContainer: {},
	bikeName: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	bikeModelYear: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.regular,
		color: colors.textSecondary,
	},
	bikeSpecsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: spacing.xs,
	},
	bikeSpec: {
		fontSize: typography.fontSizes.s,
		color: colors.primaryLight,
		marginRight: spacing.m,
		backgroundColor: colors.backgroundLight || "#F0F0F0",
		paddingHorizontal: spacing.s,
		paddingVertical: spacing.xxs,
		borderRadius: borderRadius.s,
		overflow: "hidden",
		marginTop: spacing.xs,
	},
	dateTimeRow: { flexDirection: "row", justifyContent: "space-between" },
	dateTimeLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	dateTimeValue: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.s,
	},
	priceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.s,
		paddingVertical: spacing.xs,
	},
	priceLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	priceValue: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	promoText: { color: colors.success || "green" },
	totalRow: {
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault,
		marginTop: spacing.s,
		paddingTop: spacing.m,
	},
	totalText: {
		fontWeight: typography.fontWeights.bold,
		fontSize: typography.fontSizes.l,
	},
	totalAmountValue: { color: colors.primary },
	promoInputCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.xs,
		paddingLeft: spacing.m,
		paddingRight: spacing.xs,
	},
	applyPromoButton: {
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.m - 1,
		backgroundColor: colors.primary,
		borderRadius: borderRadius.m,
		marginLeft: spacing.s,
		height: 50,
		justifyContent: "center",
	},
	applyPromoButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeights.semiBold,
		fontSize: typography.fontSizes.s,
	},
	userInfoHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	editText: {
		fontSize: typography.fontSizes.m,
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},
	userInfoText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		lineHeight: typography.fontSizes.m * 1.5,
		marginBottom: spacing.xxs,
	},
	termsContainer: { marginVertical: spacing.l, alignItems: "flex-start" },
	checkboxContainer: { flexDirection: "row", alignItems: "center" },
	checkbox: {
		width: 22,
		height: 22,
		borderWidth: 1.5,
		borderColor: colors.primary,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxChecked: { backgroundColor: colors.primary },
	checkboxCheckmark: {
		color: colors.white,
		fontSize: 14,
		fontWeight: "bold",
	},
	checkboxLabelText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		flexShrink: 1,
	},
	linkText: {
		color: colors.primary,
		textDecorationLine: "underline",
		fontWeight: typography.fontWeights.medium,
	},
	confirmButton: { marginTop: spacing.m },
	helpText: {
		textAlign: "center",
		color: colors.textSecondary,
		fontSize: typography.fontSizes.s,
		marginTop: spacing.l,
		textDecorationLine: "underline",
	},
});

export default BookingScreen;
