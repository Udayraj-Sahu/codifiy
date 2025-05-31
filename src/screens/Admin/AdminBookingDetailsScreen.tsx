// src/screens/Admin/AdminBookingDetailsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text,
	TextStyle,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import PrimaryButton from "../../components/common/PrimaryButton"; // Assumed themed
import {
	AdminStackParamList,
	BookingStatusAdmin, // Ensure this includes 'Upcoming' if used in status
} from "../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../theme";
// Redux imports would go here when you integrate
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "../../store/store";
// import { fetchAdminBookingDetailsByIdThunk } from "../../store/slices/adminBookingSlice"; // Example

// --- Types and Dummy Data (structure remains, placeholders updated for dark theme) ---
type RideStatus = Exclude<BookingStatusAdmin, "All">;

interface DetailedBookingAdminView {
	id: string;
	bookingPlacedDate: string;
	rentalStartDate: string;
	rentalEndDate: string;
	duration?: string;
	status: RideStatus;
	userId: string;
	userName: string;
	userEmail: string;
	userPhone?: string;
	userPhotoUrl?: string;
	bikeId: string;
	bikeName: string;
	bikeModel?: string;
	bikeRegistrationNo?: string;
	bikeImageUrl?: string;
	priceBreakdown: {
		baseRate?: string;
		discountApplied?: string;
		taxesAndFees?: string;
		totalAmount: string;
	};
	paymentMethod?: string;
	paymentStatus?: "Paid" | "Pending" | "Refunded" | "Failed";
	transactionId?: string;
	assignedAdminName?: string;
	adminNotes?: string;
}

const DUMMY_BOOKING_DETAIL_DATA: { [key: string]: DetailedBookingAdminView } = {
	bk001: {
		id: "bk001",
		bookingPlacedDate: "Jan 10, 2025, 08:30 PM",
		rentalStartDate: "2025-01-12T14:00:00Z",
		rentalEndDate: "2025-01-14T14:00:00Z",
		duration: "2 days",
		status: "Active",
		userId: "u001",
		userName: "John Doe",
		userEmail: "john.d@example.com",
		userPhone: "+1-555-0101",
		userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=JD",
		bikeId: "BX2938",
		bikeName: "Mountain X Pro",
		bikeModel: "MX Pro 2024",
		bikeRegistrationNo: "KA01MX2938",
		bikeImageUrl:
			"https://placehold.co/120x90/1A1A1A/F5F5F5?text=MountainX",
		priceBreakdown: {
			baseRate: "₹400 x 2 days = ₹800",
			discountApplied: "-₹50 (FIRST10)",
			taxesAndFees: "₹135",
			totalAmount: "₹885.00",
		},
		paymentMethod: "Visa **** 1234",
		paymentStatus: "Paid",
		transactionId: "txn_abc123xyz",
		assignedAdminName: "Sarah Khan",
		adminNotes: "User requested early check-in if possible.",
	},
	bk002: {
		id: "bk002",
		bookingPlacedDate: "Jan 07, 2025, 11:00 AM",
		rentalStartDate: "2025-01-08T10:00:00Z",
		rentalEndDate: "2025-01-10T10:00:00Z",
		duration: "2 days",
		status: "Completed",
		userId: "u002",
		userName: "Priya Sharma",
		userEmail: "priya.s@example.com",
		userPhone: "+91-98XXXXXX02",
		userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=PS",
		bikeId: "RX2000",
		bikeName: "Roadster 2K Deluxe",
		bikeModel: "R2000 Deluxe",
		bikeImageUrl: "https://placehold.co/120x90/1A1A1A/F5F5F5?text=Roadster",
		priceBreakdown: {
			baseRate: "₹300 x 2 days = ₹600",
			taxesAndFees: "₹108",
			totalAmount: "₹708.00",
		},
		paymentMethod: "UPI",
		paymentStatus: "Paid",
		transactionId: "txn_def456uvw",
		assignedAdminName: "Admin Bot",
	},
	bk003: {
		id: "bk003",
		bookingPlacedDate: "Jan 04, 2025, 09:30 AM",
		rentalStartDate: "2025-01-05T10:00:00Z",
		rentalEndDate: "2025-01-06T17:00:00Z",
		duration: "1 day, 7 hours",
		status: "Cancelled",
		userId: "u003",
		userName: "Mike Johnson",
		userEmail: "mike.j@example.com",
		userPhone: "+1-555-0102",
		userPhotoUrl: "https://placehold.co/60x60/1A1A1A/F5F5F5?text=MJ",
		bikeId: "CC100",
		bikeName: "City Cruiser Ltd",
		bikeModel: "CC Ltd 2022",
		bikeImageUrl: "https://placehold.co/120x90/1A1A1A/F5F5F5?text=Cruiser",
		priceBreakdown: {
			baseRate: "₹150 x 1 day = ₹150",
			taxesAndFees: "₹27",
			totalAmount: "₹177.00 (Cancelled)",
		},
		paymentMethod: "Visa **** 6789",
		paymentStatus: "Refunded",
		transactionId: "txn_ghi789jkl",
		assignedAdminName: "System",
	},
};

const fetchAdminBookingDetailsAPI = async (
	bookingId: string
): Promise<DetailedBookingAdminView | null> => {
	console.log(`ADMIN: Fetching details for booking ID: ${bookingId}`);
	return new Promise((resolve) =>
		setTimeout(
			() => resolve(DUMMY_BOOKING_DETAIL_DATA[bookingId] || null),
			300
		)
	);
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
	if (
		(value === undefined ||
			value === null ||
			String(value).trim() === "") &&
		!children
	)
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

type ScreenRouteProp = RouteProp<AdminStackParamList, "AdminBookingDetails">;
type ScreenNavigationProp = StackNavigationProp<
	AdminStackParamList,
	"AdminBookingDetails"
>;

interface AdminBookingDetailsScreenProps {
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
}

const AdminBookingDetailsScreen: React.FC<AdminBookingDetailsScreenProps> = ({
	route,
	navigation,
}) => {
	const { bookingId } = route.params;
	const [booking, setBooking] = useState<DetailedBookingAdminView | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(true);

	const bikeImagePlaceholder =
		"https://placehold.co/400x250/1A1A1A/F5F5F5?text=Bike";
	const userPhotoPlaceholder =
		"https://placehold.co/60x60/1A1A1A/F5F5F5?text=User";

	useLayoutEffect(() => {
		if (booking) {
			navigation.setOptions({
				title: `Booking #${booking.id.slice(-6).toUpperCase()}`,
			});
		} else if (bookingId) {
			navigation.setOptions({
				title: `Booking #${bookingId.slice(-6).toUpperCase()}`,
			});
		} else {
			navigation.setOptions({ title: "Booking Details" });
		}
	}, [navigation, booking, bookingId]);

	useEffect(() => {
		const loadBooking = async () => {
			if (!bookingId) {
				Alert.alert("Error", "Booking ID missing.", [
					{ text: "OK", onPress: () => navigation.goBack() },
				]);
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			const fetchedBooking = await fetchAdminBookingDetailsAPI(bookingId);
			setBooking(fetchedBooking);
			setIsLoading(false);
			if (!fetchedBooking) {
				Alert.alert("Error", "Booking not found.", [
					{ text: "OK", onPress: () => navigation.goBack() },
				]);
			}
		};
		loadBooking();
	}, [bookingId, navigation]);

	const formatDate = (
		dateString?: string,
		includeTime: boolean = true
	): string => {
		if (!dateString) return "N/A";
		try {
			const date = new Date(dateString);
			const options: Intl.DateTimeFormatOptions = {
				year: "numeric",
				month: "short",
				day: "numeric",
			};
			if (includeTime) {
				options.hour = "numeric";
				options.minute = "2-digit";
				options.hour12 = true;
			}
			return date.toLocaleString(undefined, options);
		} catch {
			return "Invalid Date";
		}
	};

	const handleCancelBooking = () => {
		if (!booking) return;
		Alert.alert(
			"Confirm Cancellation",
			"Are you sure you want to cancel this booking for the user?",
			[
				{ text: "No", style: "cancel" },
				{
					text: "Yes, Cancel Booking",
					style: "destructive",
					onPress: async () => {
						// TODO: Replace with actual API call via Redux Thunk
						// const result = await dispatch(cancelAdminBookingThunk(booking.id)).unwrap();
						console.log(
							"Simulating cancellation for booking:",
							booking.id
						);
						Alert.alert(
							"Cancelled",
							"Booking would be cancelled (simulated)."
						);
						navigation.goBack(); // Or refresh previous screen data
					},
				},
			]
		);
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>Loading details...</Text>
			</View>
		);
	}

	if (!booking) {
		return (
			<View style={styles.centered}>
				<MaterialIcons
					name="error-outline"
					size={48}
					color={colors.textDisabled}
				/>
				<Text style={styles.errorText}>
					Booking details could not be loaded.
				</Text>
				<PrimaryButton
					title="Go Back"
					onPress={() => navigation.goBack()}
					style={{ marginTop: spacing.m }}
				/>
			</View>
		);
	}

	const getStatusDisplay = (
		status: RideStatus
	): { color: string; iconName: keyof typeof MaterialIcons.glyphMap } => {
		switch (status) {
			case "Active":
				return {
					color: colors.success,
					iconName: "play-circle-filled",
				};
			case "Upcoming":
				return { color: colors.info, iconName: "event" };
			case "Completed":
				return { color: colors.textDisabled, iconName: "check-circle" };
			case "Cancelled":
				return { color: colors.error, iconName: "cancel" };
			default:
				return {
					color: colors.textSecondary,
					iconName: "help-outline",
				};
		}
	};
	const statusDisplayInfo = getStatusDisplay(booking.status);

	const getPaymentStatusDisplay = (
		status?: "Paid" | "Pending" | "Refunded" | "Failed"
	): { color: string; iconName: keyof typeof MaterialIcons.glyphMap } => {
		switch (status) {
			case "Paid":
				return {
					color: colors.success,
					iconName: "check-circle-outline",
				};
			case "Pending":
				return { color: colors.warning, iconName: "hourglass-empty" };
			case "Refunded":
				return { color: colors.info, iconName: "replay-circle-filled" };
			case "Failed":
				return { color: colors.error, iconName: "error-outline" };
			default:
				return {
					color: colors.textSecondary,
					iconName: "help-outline",
				};
		}
	};
	const paymentStatusDisplayInfo = getPaymentStatusDisplay(
		booking.paymentStatus
	);

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Booking Overview</Text>
				<DetailRow
					label="Booking ID"
					value={`#${booking.id.toUpperCase()}`}
					iconName="confirmation-number"
				/>
				<DetailRow
					label="Status"
					value={booking.status}
					valueStyle={{
						color: statusDisplayInfo.color,
						fontFamily: typography.primaryBold,
					}}
					iconName={statusDisplayInfo.iconName}
				/>
				<DetailRow
					label="Booked On"
					value={formatDate(booking.bookingPlacedDate, true)}
					iconName="today"
				/>
				<DetailRow
					label="Rental Start"
					value={formatDate(booking.rentalStartDate)}
					iconName="event-available"
				/>
				<DetailRow
					label="Rental End"
					value={formatDate(booking.rentalEndDate)}
					iconName="event-busy"
				/>
				{booking.duration && (
					<DetailRow
						label="Duration"
						value={booking.duration}
						iconName="hourglass-empty"
					/>
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>User Information</Text>
				<View style={styles.userHeader}>
					<Image
						source={{
							uri: booking.userPhotoUrl || userPhotoPlaceholder,
						}}
						style={styles.userPhoto}
					/>
					<View style={styles.userInfoTextContainer}>
						<DetailRow
							label="Name"
							value={booking.userName}
							iconName="person"
						/>
						<DetailRow
							label="Email"
							value={booking.userEmail}
							iconName="email"
						/>
						{booking.userPhone && (
							<DetailRow
								label="Phone"
								value={booking.userPhone}
								iconName="phone"
							/>
						)}
					</View>
				</View>
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Bike Information</Text>
				{booking.bikeImageUrl && (
					<Image
						source={{
							uri: booking.bikeImageUrl || bikeImagePlaceholder,
						}}
						style={styles.bikeImage}
					/>
				)}
				<DetailRow
					label="Bike Name"
					value={booking.bikeName}
					iconName="directions-bike"
				/>
				{booking.bikeModel && (
					<DetailRow
						label="Model"
						value={booking.bikeModel}
						iconName="info-outline"
					/>
				)}
				{booking.bikeRegistrationNo && (
					<DetailRow
						label="Reg. No."
						value={booking.bikeRegistrationNo}
						iconName="article"
					/>
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Payment Details</Text>
				{booking.priceBreakdown.baseRate && (
					<DetailRow
						label="Base Rate"
						value={booking.priceBreakdown.baseRate}
						iconName="payments"
					/>
				)}
				{booking.priceBreakdown.discountApplied && (
					<DetailRow
						label="Discount"
						value={booking.priceBreakdown.discountApplied}
						valueStyle={styles.discountText}
						iconName="local-offer"
					/>
				)}
				{booking.priceBreakdown.taxesAndFees && (
					<DetailRow
						label="Taxes & Fees"
						value={booking.priceBreakdown.taxesAndFees}
						iconName="receipt-long"
					/>
				)}
				<View style={styles.totalDivider} />
				<DetailRow
					label="Total Amount"
					value={booking.priceBreakdown.totalAmount}
					valueStyle={styles.totalAmountText}
					iconName="monetization-on"
				/>
				{booking.paymentMethod && (
					<DetailRow
						label="Method"
						value={booking.paymentMethod}
						iconName="credit-card"
					/>
				)}
				{booking.paymentStatus && (
					<DetailRow
						label="Pay Status"
						value={booking.paymentStatus}
						valueStyle={{
							color: paymentStatusDisplayInfo.color,
							fontFamily: typography.primarySemiBold,
						}}
						iconName={paymentStatusDisplayInfo.iconName}
					/>
				)}
				{booking.transactionId && (
					<DetailRow
						label="Transaction ID"
						value={booking.transactionId}
						iconName="vpn-key"
					/>
				)}
			</View>

			{(booking.assignedAdminName || booking.adminNotes) && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Admin Context</Text>
					{booking.assignedAdminName && (
						<DetailRow
							label="Managed By"
							value={booking.assignedAdminName}
							iconName="admin-panel-settings"
						/>
					)}
					{booking.adminNotes && (
						<DetailRow
							label="Admin Notes"
							value={booking.adminNotes}
							iconName="speaker-notes"
						/>
					)}
				</View>
			)}

			{booking.status === "Active" || booking.status === "Upcoming" ? ( // Allow cancel for Active or Upcoming
				<View style={styles.actionButtonContainer}>
					<PrimaryButton // Assumed themed
						title="Cancel This Booking"
						onPress={handleCancelBooking}
						style={styles.cancelActionButton}
						textStyle={styles.cancelActionButtonText}
						iconLeft={
							<MaterialIcons
								name="cancel"
								size={20}
								color={colors.error}
							/>
						}
					/>
				</View>
			) : null}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	scrollContentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xl,
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
		fontSize: typography.fontSizes.m,
	},
	errorText: {
		marginTop: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError,
		textAlign: "center",
	},
	notFoundText: {
		// Added for when booking is not found
		marginTop: spacing.s,
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
	},
	card: {
		backgroundColor: colors.backgroundCard,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.l,
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		paddingBottom: spacing.s,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
	},
	userHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: borderRadius.circle,
		marginRight: spacing.m,
		backgroundColor: colors.borderDefault,
	},
	userInfoTextContainer: { flex: 1 }, // Ensures text rows within user section take available width
	bikeImage: {
		width: "100%",
		height: 180,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.borderDefault,
		resizeMode: "cover",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.s - 2,
		alignItems: "flex-start",
	},
	detailLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 0.45, // Give label consistent space
		marginRight: spacing.s,
	},
	detailRowIconThemed: {
		// For MaterialIcons
		marginRight: spacing.s,
		marginTop: spacing.xxs, // Align with text
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
		textAlign: "right",
		flex: 0.55, // Allow value to take remaining space
	},
	discountText: {
		color: colors.success, // Themed success color
		fontFamily: typography.primaryMedium,
	},
	totalDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.borderDefault,
		marginVertical: spacing.s,
	},
	totalAmountText: {
		fontFamily: typography.primaryBold,
		color: colors.primary, // Themed primary accent
		fontSize: typography.fontSizes.l,
	},
	actionButtonContainer: {
		marginTop: spacing.l,
	},
	cancelActionButton: {
		// For PrimaryButton instance
		backgroundColor: colors.backgroundCard, // Use card background for less emphasis
		borderColor: colors.error,
		borderWidth: 1.5,
	},
	cancelActionButtonText: {
		// For text within cancel PrimaryButton instance
		color: colors.error, // Error color for text
		fontFamily: typography.primarySemiBold,
	},
});

export default AdminBookingDetailsScreen;
