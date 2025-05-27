// src/screens/Owner/OwnerBookingDetailsScreen.tsx
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
import {
	BookingStatusOwnerView,
	OwnerStackParamList,
} from "../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example for icons

// --- Types and Dummy Data ---
// (Assuming BookingStatusOwnerView is 'Active' | 'Completed' | 'Cancelled' | 'All')
// This interface can be shared or adapted from AdminBookingDetailsScreen if structure is similar
interface OwnerViewBookingDetail {
	id: string;
	bookingPlacedDate: string; // When the booking was made
	rentalStartDate: string; // ISO String
	rentalEndDate: string; // ISO String
	duration?: string; // e.g., "2 days, 3 hours"
	status: Exclude<BookingStatusOwnerView, "All">;

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
	bikeRegistrationNo?: string;
	bikeImageUrl?: string;

	// Payment Details
	priceBreakdown: {
		baseRate?: string;
		discountApplied?: string;
		taxesAndFees?: string;
		totalAmount: string;
	};
	paymentMethod?: string;
	paymentStatus?: "Paid" | "Pending" | "Refunded" | "Failed";
	transactionId?: string;

	// Admin Info (Owner might be interested in who handled it)
	assignedAdminName?: string;
}

// Reusing the dummy data structure
const DUMMY_OWNER_VIEW_BOOKING_DETAILS: {
	[key: string]: OwnerViewBookingDetail;
} = {
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
		userPhotoUrl: "https://via.placeholder.com/60x60.png?text=JD",
		bikeId: "BX2938",
		bikeName: "Mountain X Pro",
		bikeModel: "MX Pro 2024",
		bikeRegistrationNo: "KA01MX2938",
		bikeImageUrl: "https://via.placeholder.com/120x90.png?text=MountainX",
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
		userPhotoUrl: "https://via.placeholder.com/60x60.png?text=PS",
		bikeId: "RX2000",
		bikeName: "Roadster 2K Deluxe",
		bikeModel: "R2000 Deluxe",
		bikeImageUrl: "https://via.placeholder.com/120x90.png?text=Roadster",
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
		userPhotoUrl: "https://via.placeholder.com/60x60.png?text=MJ",
		bikeId: "CC100",
		bikeName: "City Cruiser Ltd",
		bikeModel: "CC Ltd 2022",
		bikeImageUrl: "https://via.placeholder.com/120x90.png?text=Cruiser",
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

const fetchOwnerBookingDetailsAPI = async (
	bookingId: string
): Promise<OwnerViewBookingDetail | null> => {
	console.log(`OWNER: Fetching details for booking ID: ${bookingId}`);
	return new Promise((resolve) =>
		setTimeout(
			() => resolve(DUMMY_OWNER_VIEW_BOOKING_DETAILS[bookingId] || null),
			300
		)
	);
};
// --- End Dummy Data ---

// Helper to render detail rows
const DetailRow: React.FC<{
	label: string;
	value?: string | number | null;
	valueStyle?: object;
	children?: React.ReactNode;
	iconPlaceholder?: string;
}> = ({ label, value, valueStyle, children, iconPlaceholder }) => {
	if (!value && !children) return null;
	return (
		<View style={styles.detailRow}>
			<View style={styles.detailLabelContainer}>
				{iconPlaceholder && (
					<Text style={styles.detailRowIcon}>{iconPlaceholder}</Text>
				)}
				<Text style={styles.detailLabel}>{label}:</Text>
			</View>
			{value && (
				<Text style={[styles.detailValue, valueStyle]}>{value}</Text>
			)}
			{children}
		</View>
	);
};

type ScreenRouteProp = RouteProp<
	OwnerStackParamList,
	"OwnerBookingDetailsScreen"
>;
type ScreenNavigationProp = StackNavigationProp<
	OwnerStackParamList,
	"OwnerBookingDetailsScreen"
>;

interface OwnerBookingDetailsScreenProps {
	route: ScreenRouteProp;
	navigation: ScreenNavigationProp;
}

const OwnerBookingDetailsScreen: React.FC<OwnerBookingDetailsScreenProps> = ({
	route,
	navigation,
}) => {
	const { bookingId } = route.params;
	const [booking, setBooking] = useState<OwnerViewBookingDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useLayoutEffect(() => {
		if (booking) {
			navigation.setOptions({ title: `Booking #${booking.id}` });
		} else if (bookingId) {
			// Set a generic title while loading
			navigation.setOptions({ title: `Booking #${bookingId}` });
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
			const fetchedBooking = await fetchOwnerBookingDetailsAPI(bookingId);
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
		return date.toLocaleString(undefined, options); // Using toLocaleString for better formatting
	};

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={styles.loadingText}>
					Loading booking details...
				</Text>
			</View>
		);
	}

	if (!booking) {
		return (
			<View style={styles.centered}>
				<Text>Booking details could not be loaded.</Text>
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
					value={formatDate(booking.bookingPlacedDate)}
				/>
				<DetailRow
					label="Start Time"
					value={formatDate(booking.rentalStartDate)}
				/>
				<DetailRow
					label="End Time"
					value={formatDate(booking.rentalEndDate)}
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
					<View style={styles.userInfoTextContainer}>
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
				{/* Potential link to full user profile if Owner has access */}
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
				{/* Potential link to bike details/management screen if Owner has access */}
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
									: booking.paymentStatus === "Refunded"
									? colors.info
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

			{/* Admin Information (Managed By) */}
			{booking.assignedAdminName && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Managed By</Text>
					<DetailRow
						label="Admin"
						value={booking.assignedAdminName}
						iconPlaceholder="🧑‍💼"
					/>
				</View>
			)}

			{/* No action buttons as this is view-only for Owner */}
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
		marginBottom: spacing.xs,
	}, // Adjusted margin
	userPhoto: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	userInfoTextContainer: { flex: 1 },
	bikeImage: {
		width: "100%",
		height: 180,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.greyLighter,
		resizeMode: "contain",
	},
	detailRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.m - 2,
		alignItems: "flex-start",
	}, // Adjusted margin
	detailLabelContainer: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1,
		marginRight: spacing.s,
	},
	detailRowIcon: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginRight: spacing.xs,
	},
	detailLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	detailValue: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "right",
		flexShrink: 1,
		marginLeft: spacing.s,
	},
	discountText: { color: "green" },
	totalAmountText: {
		fontWeight: typography.fontWeights.bold,
		color: colors.primary,
	},
});

export default OwnerBookingDetailsScreen;
