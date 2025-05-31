// src/screens/App/Booking/BookingConfirmationScreen.tsx
import { CommonActions, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect } from "react";
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useDispatch, useSelector } from "react-redux"; // Added
import PrimaryButton from "../../../components/common/PrimaryButton";
import {
	ExploreStackParamList,
	UserTabParamList,
} from "../../../navigation/types";
import { AppDispatch, RootState } from "../../../store/store"; // Added
import { borderRadius, colors, spacing, typography } from "../../../theme";

// ***** TODO: Replace with your actual booking slice imports *****
import { fetchConfirmedBookingByIdThunk } from "../../../store/slices/bookingSlice"; // Replace 'bookingSlice' with your actual slice name

// Keep this interface, or import it if defined in your slice/shared types
interface ConfirmedBookingDetails {
	bookingId: string; // Should match the _id from your backend booking object
	bikeName: string;
	bikeImageUrl: string;
	rentalPeriod: string;
	totalAmount: string;
	pickupInstructions?: string;
	// Add other relevant fields like bikeModel, bikeBrand, locationAddress, etc.
}
// ***** END TODO *****

type BookingConfirmationScreenRouteProp = RouteProp<
	ExploreStackParamList,
	"BookingConfirmation"
>;
type BookingConfirmationScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"BookingConfirmation"
>;

interface BookingConfirmationScreenProps {
	route: BookingConfirmationScreenRouteProp;
	navigation: BookingConfirmationScreenNavigationProp;
}

const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
	route,
	navigation,
}) => {
	const { bookingId } = route.params;
	const dispatch = useDispatch<AppDispatch>();

	// ***** TODO: Select from your actual booking slice state *****
	const {
		confirmedBooking: bookingDetails, // Renamed for consistency with previous dummy data structure
		isLoadingConfirmation: loading, // Use loading state from your slice
		errorConfirmation: error, // Use error state from your slice
	} = useSelector((state: RootState) => state.booking); // Replace 'booking' with your slice name
	// ***** END TODO *****

	useEffect(() => {
		if (bookingId) {
			dispatch(fetchConfirmedBookingByIdThunk(bookingId));
		}
		// Clear details when the screen is unmounted
		return () => {
			// dispatch(clearConfirmedBooking()); // Uncomment if you have this action
		};
	}, [dispatch, bookingId]);

	const handleGoToMyRentals = () => {
		navigation
			.getParent<StackNavigationProp<UserTabParamList>>()
			?.navigate("RentalsTab" as any);
		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: "Explore" }],
			})
		);
	};

	const handleBookAnotherBike = () => {
		navigation.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name: "Explore" }],
			})
		);
	};

	if (loading) {
		// Use loading state from Redux
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading confirmation...</Text>
			</View>
		);
	}

	if (error) {
		// Use error state from Redux
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.error}
				/>
				<Text style={styles.errorText}>
					Error loading confirmation: {error}
				</Text>
				<PrimaryButton
					title="Try Again"
					onPress={() =>
						bookingId &&
						dispatch(fetchConfirmedBookingByIdThunk(bookingId))
					}
				/>
			</View>
		);
	}

	if (!bookingDetails) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="search-off"
					size={48}
					color={colors.textSecondary}
				/>
				<Text style={styles.notFoundText}>
					Booking details not found.
				</Text>
				<PrimaryButton
					title="Go Home"
					onPress={handleBookAnotherBike}
				/>
			</View>
		);
	}

	// Helper to format rental period if details are structured differently
	const formatRentalPeriod = (
		startDateStr?: string,
		endDateStr?: string
	): string => {
		if (!startDateStr || !endDateStr) return "N/A";
		try {
			const startDate = new Date(startDateStr);
			const endDate = new Date(endDateStr);
			const options: Intl.DateTimeFormatOptions = {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				hour12: true,
			};
			return `${startDate.toLocaleDateString(
				undefined,
				options
			)} - ${endDate.toLocaleDateString(undefined, options)}`;
		} catch (e) {
			return "Invalid date format";
		}
	};

	// Assuming bookingDetails from Redux might have bike.model, bike.images, etc.
	// You'll need to map these to the ConfirmedBookingDetails structure if they differ.
	// For this example, I'll assume bookingDetails matches ConfirmedBookingDetails.
	// If not, you'd do a mapping here, perhaps with useMemo.

	// Example: If your Redux bookingDetails has a nested bike object
	// const bikeName = bookingDetails.bike?.model || 'Bike Name N/A';
	// const bikeImageUrl = bookingDetails.bike?.images?.[0]?.url || 'https://placehold.co/100x80/1A1A1A/F5F5F5?text=Bike';
	// const rentalPeriodDisplay = formatRentalPeriod(bookingDetails.startDate, bookingDetails.endDate);
	// const totalAmountDisplay = `₹${(bookingDetails.totalPrice || 0).toFixed(2)}`;

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.iconContainer}>
				<View style={styles.successIconBackground}>
					<MaterialIcons
						name="check-circle"
						size={40}
						color={colors.success}
					/>
				</View>
			</View>

			<Text style={styles.title}>Booking Confirmed!</Text>
			<Text style={styles.subtitle}>
				Your bike rental is all set. Enjoy your ride!
			</Text>

			<View style={styles.summaryCard}>
				<View style={styles.bikeInfoRow}>
					<Image
						source={{ uri: bookingDetails.bikeImageUrl }}
						style={styles.bikeImage}
					/>
					<View style={styles.bikeTextContainer}>
						<Text style={styles.bikeName}>
							{bookingDetails.bikeName}
						</Text>
						<Text style={styles.rentalPeriod}>
							{bookingDetails.rentalPeriod}
						</Text>
					</View>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Total Amount</Text>
					<Text style={styles.detailValueAmount}>
						{bookingDetails.totalAmount}
					</Text>
				</View>
				<View style={styles.detailRow}>
					<Text style={styles.detailLabel}>Booking Reference</Text>
					<Text style={styles.detailValue}>
						#{bookingDetails.bookingId.toUpperCase()}
					</Text>
				</View>
			</View>

			{bookingDetails.pickupInstructions && (
				<View style={styles.infoNoteContainer}>
					<MaterialIcons
						name="info-outline"
						size={24}
						color={colors.info}
						style={styles.infoIconThemed}
					/>
					<Text style={styles.infoNoteText}>
						{bookingDetails.pickupInstructions}
					</Text>
				</View>
			)}

			<PrimaryButton
				title="Go to My Rentals"
				onPress={handleGoToMyRentals}
				style={styles.actionButton}
			/>

			<TouchableOpacity
				style={[styles.actionButton, styles.secondaryButton]}
				onPress={handleBookAnotherBike}>
				<Text style={styles.secondaryButtonText}>
					Book Another Bike
				</Text>
			</TouchableOpacity>

			<Text style={styles.footerText}>
				You can view your booking details anytime in 'My Rentals'.
			</Text>
		</ScrollView>
	);
};

// Styles (assuming they are already themed from previous step)
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	contentContainer: {
		padding: spacing.l,
		alignItems: "center",
		paddingBottom: spacing.xxl,
	},
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.backgroundMain,
		paddingHorizontal: spacing.l,
	},
	loadingText: {
		marginTop: spacing.m,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	errorText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	notFoundText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.m,
	},
	iconContainer: {
		marginBottom: spacing.m,
		marginTop: spacing.xl,
	},
	successIconBackground: {
		width: 80,
		height: 80,
		borderRadius: borderRadius.circle,
		backgroundColor: colors.backgroundCard,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: colors.success,
	},
	title: {
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.xl,
	},
	summaryCard: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		width: "100%",
		marginBottom: spacing.l,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	bikeInfoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.m,
	},
	bikeImage: {
		width: 80,
		height: 60,
		borderRadius: borderRadius.s,
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault,
	},
	bikeTextContainer: {
		flex: 1,
	},
	bikeName: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary,
	},
	rentalPeriod: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
	},
	detailLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
	},
	detailValueAmount: {
		fontSize: typography.fontSizes.m,
		color: colors.primary,
		fontFamily: typography.primaryBold,
	},
	infoNoteContainer: {
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: colors.backgroundCard,
		padding: spacing.m,
		borderRadius: borderRadius.m,
		width: "100%",
		marginBottom: spacing.xl,
		borderLeftWidth: 4,
		borderLeftColor: colors.info,
	},
	infoIconThemed: {
		marginRight: spacing.s,
		marginTop: spacing.xxs,
	},
	infoNoteText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		flexShrink: 1,
		lineHeight: typography.lineHeights.getForSize(typography.fontSizes.s),
	},
	actionButton: {
		width: "100%",
		marginBottom: spacing.m,
	},
	secondaryButton: {
		backgroundColor: "transparent",
		borderColor: colors.primary,
		borderWidth: 1.5,
	},
	secondaryButtonText: {
		color: colors.primary,
		fontFamily: typography.primarySemiBold,
		fontSize: typography.fontSizes.m,
	},
	footerText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.m,
	},
});

export default BookingConfirmationScreen;
