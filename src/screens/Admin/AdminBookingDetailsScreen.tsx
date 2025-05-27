// src/screens/Admin/AdminBookingDetailsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import PrimaryButton from "../../components/common/PrimaryButton"; // Adjust path
import {
	AdminStackParamList,
	BookingStatusAdmin,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Types and Dummy Data ---
interface DetailedBookingAdminView {
	id: string;
	bookingPlacedDate: string; // When the booking was made
	rentalStartDate: string;
	rentalEndDate: string;
	duration?: string; // Calculated or from backend
	status: Exclude<BookingStatusAdmin, "All">;

	// User Details
	userId: string;
	userName: string;
	userEmail: string;
	userPhone?: string;
	userPhotoUrl?: string;

	// Bike Details
	bikeId: string;
	bikeName: string;
	bikeModel?: string;
	bikeRegistrationNo?: string; // Example additional detail
	bikeImageUrl?: string;

	// Payment Details
	priceBreakdown: {
		baseRate?: string; // e.g., "₹200 x 2 days"
		discountApplied?: string; // e.g., "-₹50 (WELCOME50)"
		taxesAndFees?: string; // e.g., "₹45"
		totalAmount: string; // e.g., "₹395"
	};
	paymentMethod?: string; // e.g., "Visa **** 1234"
	paymentStatus?: "Paid" | "Pending" | "Refunded";
	transactionId?: string;

	// Admin Info
	assignedAdminName?: string;
	adminNotes?: string;
}

const DUMMY_BOOKING_DETAIL_DATA: { [key: string]: DetailedBookingAdminView } = {
	bk001: {
		id: "bk001",
		bookingPlacedDate: "Jan 10, 2025, 08:30 PM",
		rentalStartDate: "Jan 12, 2025, 02:00 PM",
		rentalEndDate: "Jan 14, 2025, 02:00 PM",
		duration: "2 days",
		status: "Active",
		userId: "u001",
		userName: "John Doe",
		userEmail: "john.d@example.com",
		userPhone: "+1-555-0101",
		userPhotoUrl: "https://via.placeholder.com/60x60.png?text=JD",
		bikeId: "BX2938",
		bikeName: "Mountain X",
		bikeModel: "MX Pro 2024",
		bikeRegistrationNo: "KA01MX2938",
		bikeImageUrl: "https://via.placeholder.com/100x75.png?text=MountainX",
		priceBreakdown: {
			baseRate: "₹400 x 2 days = ₹800",
			discountApplied: "-₹50 (FIRST10)",
			taxesAndFees: "₹135",
			totalAmount: "₹885",
		},
		paymentMethod: "Visa **** 1234",
		paymentStatus: "Paid",
		transactionId: "txn_abc123xyz",
		assignedAdminName: "Sarah Khan",
		adminNotes: "User requested extra helmet.",
	},
	bk002: {
		id: "bk002",
		bookingPlacedDate: "Jan 07, 2025, 11:00 AM",
		rentalStartDate: "Jan 08, 2025, 10:00 AM",
		rentalEndDate: "Jan 10, 2025, 10:00 AM",
		duration: "2 days",
		status: "Completed",
		userId: "u002",
		userName: "Priya S",
		userEmail: "priya.s@example.com",
		userPhone: "+91-98XXXXXX02",
		userPhotoUrl: "https://via.placeholder.com/60x60.png?text=PS",
		bikeId: "RX2000",
		bikeName: "Roadster 2K",
		bikeModel: "R2000 Deluxe",
		bikeImageUrl: "https://via.placeholder.com/100x75.png?text=Roadster",
		priceBreakdown: {
			baseRate: "₹300 x 2 days = ₹600",
			taxesAndFees: "₹108",
			totalAmount: "₹708",
		},
		paymentMethod: "UPI",
		paymentStatus: "Paid",
		transactionId: "txn_def456uvw",
		assignedAdminName: "Admin Bot",
	},
};

const fetchAdminBookingDetailsAPI = async (
	bookingId: string
): Promise<DetailedBookingAdminView | null> => {
	return new Promise((resolve) =>
		setTimeout(
			() => resolve(DUMMY_BOOKING_DETAIL_DATA[bookingId] || null),
			500
		)
	);
};
// --- End Dummy Data ---

// Helper to render detail rows
const DetailRow: React.FC<{
	label: string;
	value?: string | null;
	valueStyle?: object;
	children?: React.ReactNode;
}> = ({ label, value, valueStyle, children }) => {
	if (!value && !children) return null;
	return (
		<View style={styles.detailRow}>
			<Text style={styles.detailLabel}>{label}:</Text>
			{value && (
				<Text style={[styles.detailValue, valueStyle]}>{value}</Text>
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

	useLayoutEffect(() => {
		if (booking) {
			navigation.setOptions({ title: `Booking #${booking.id}` });
		} else {
			navigation.setOptions({ title: "Booking Details" });
		}
	}, [navigation, booking]);

	useEffect(() => {
		const loadBooking = async () => {
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
						// const result = await cancelBookingAPI(booking.id); // Assuming cancelBookingAPI exists
						// if (result.success) {
						//   Alert.alert("Success", "Booking cancelled.");
						//   navigation.goBack(); // Or refresh previous screen
						// } else { Alert.alert("Error", "Failed to cancel booking."); }
						console.log(
							"Simulating cancellation for booking:",
							booking.id
						);
						Alert.alert(
							"Cancelled",
							"Booking would be cancelled (simulated)."
						);
						navigation.goBack();
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
				<Text>Booking details not found.</Text>
			</View>
		);
	}

	const statusColor =
		booking.status === "Active"
			? colors.success
			: booking.status === "Completed"
			? colors.info
			: booking.status === "Cancelled"
			? colors.textMedium
			: colors.textPrimary;

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			{/* Booking Overview Section */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Booking Overview</Text>
				<DetailRow label="Booking ID" value={booking.id} />
				<DetailRow
					label="Status"
					value={booking.status}
					valueStyle={{ color: statusColor, fontWeight: "bold" }}
				/>
				<DetailRow
					label="Booked On"
					value={booking.bookingPlacedDate}
				/>
				<DetailRow
					label="Rental Period"
					value={`${booking.rentalStartDate} to ${booking.rentalEndDate}`}
				/>
				{booking.duration && (
					<DetailRow label="Duration" value={booking.duration} />
				)}
			</View>

			{/* User Information Section */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>User Information</Text>
				<View style={styles.userHeader}>
					{booking.userPhotoUrl && (
						<Image
							source={{ uri: booking.userPhotoUrl }}
							style={styles.userPhoto}
						/>
					)}
					<View>
						<DetailRow label="Name" value={booking.userName} />
						<DetailRow label="Email" value={booking.userEmail} />
						{booking.userPhone && (
							<DetailRow
								label="Phone"
								value={booking.userPhone}
							/>
						)}
					</View>
				</View>
				{/* Link to full user profile or documents could go here */}
			</View>

			{/* Bike Information Section */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Bike Information</Text>
				{booking.bikeImageUrl && (
					<Image
						source={{ uri: booking.bikeImageUrl }}
						style={styles.bikeImage}
					/>
				)}
				<DetailRow label="Bike Name" value={booking.bikeName} />
				{booking.bikeModel && (
					<DetailRow label="Model" value={booking.bikeModel} />
				)}
				{booking.bikeRegistrationNo && (
					<DetailRow
						label="Reg. No."
						value={booking.bikeRegistrationNo}
					/>
				)}
				{/* Link to full bike details/management screen */}
			</View>

			{/* Payment Information Section */}
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Payment Details</Text>
				{booking.priceBreakdown.baseRate && (
					<DetailRow
						label="Base Rate"
						value={booking.priceBreakdown.baseRate}
					/>
				)}
				{booking.priceBreakdown.discountApplied && (
					<DetailRow
						label="Discount"
						value={booking.priceBreakdown.discountApplied}
						valueStyle={styles.discountText}
					/>
				)}
				{booking.priceBreakdown.taxesAndFees && (
					<DetailRow
						label="Taxes & Fees"
						value={booking.priceBreakdown.taxesAndFees}
					/>
				)}
				<DetailRow
					label="Total Amount"
					value={booking.priceBreakdown.totalAmount}
					valueStyle={styles.totalAmountText}
				/>
				{booking.paymentMethod && (
					<DetailRow
						label="Payment Method"
						value={booking.paymentMethod}
					/>
				)}
				{booking.paymentStatus && (
					<DetailRow
						label="Payment Status"
						value={booking.paymentStatus}
						valueStyle={{
							color:
								booking.paymentStatus === "Paid"
									? colors.success
									: colors.error,
						}}
					/>
				)}
				{booking.transactionId && (
					<DetailRow
						label="Transaction ID"
						value={booking.transactionId}
					/>
				)}
			</View>

			{/* Admin Information */}
			{(booking.assignedAdminName || booking.adminNotes) && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Admin Info</Text>
					{booking.assignedAdminName && (
						<DetailRow
							label="Assigned To"
							value={booking.assignedAdminName}
						/>
					)}
					{booking.adminNotes && (
						<DetailRow label="Notes" value={booking.adminNotes} />
					)}
				</View>
			)}

			{/* Action Buttons */}
			{booking.status === "Active" && (
				<View style={styles.actionButtonContainer}>
					<PrimaryButton
						title="Cancel Booking"
						onPress={handleCancelBooking}
						style={styles.cancelActionButton} // Destructive style
						textStyle={styles.cancelActionButtonText}
					/>
				</View>
			)}
			{/* Add other actions like "Issue Refund", "Contact User" etc. if applicable */}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	scrollContentContainer: { padding: spacing.m, paddingBottom: spacing.xl },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	loadingText: { marginTop: spacing.s, color: colors.textMedium },
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
	sectionTitle: {
		fontSize: typography.fontSizes.l + 1,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault,
		paddingBottom: spacing.s,
	},
	userHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.s,
	},
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	bikeImage: {
		width: "100%",
		height: 150,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.greyLighter,
		resizeMode: "cover",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.s,
		alignItems: "flex-start",
	},
	detailLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginRight: spacing.s,
		flexShrink: 1,
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "right",
		flex: 1,
	},
	discountText: { color: "green" },
	totalAmountText: {
		fontWeight: typography.fontWeights.bold,
		color: colors.primary,
	}, // Or admin blue
	actionButtonContainer: { marginTop: spacing.l },
	cancelActionButton: {
		backgroundColor: colors.errorLight,
		borderColor: colors.error,
		borderWidth: 1,
	},
	cancelActionButtonText: { color: colors.error },
});

export default AdminBookingDetailsScreen;
