// src/screens/App/Rentals/RideDetailsScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState } from "react";
import {
	Image,
	ScrollView,
	StyleProp,
	StyleSheet,
	Text, // Import StyleProp
	TextStyle,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton";
import { RentalsStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Data (RideDetail and DUMMY_RIDE_DETAILS, fetchRideDetail remain the same) ---
type RideStatus = "Upcoming" | "Active" | "Completed" | "Cancelled";

interface RideDetail {
	id: string;
	bikeName: string;
	bikeModelYear?: string;
	bikeImageUrl: string;
	rentalStartDate: string;
	rentalEndDate: string;
	totalPrice: string;
	status: RideStatus;
	bikeGearType?: string;
	pickupLocation?: string;
	dropoffLocation?: string;
	paymentMethod?: string;
	promoApplied?: string;
	priceBreakdown?: {
		subtotal: number;
		discount?: number;
		taxesAndFees: number;
		total: number;
	};
}

const DUMMY_RIDE_DETAILS: { [key: string]: RideDetail } = {
	bk101: {
		id: "bk101",
		bikeName: "Mountain Explorer X3",
		bikeModelYear: "2023",
		bikeImageUrl: "https://via.placeholder.com/400x250.png?text=Bike+X3",
		rentalStartDate: new Date(
			Date.now() - 2 * 24 * 60 * 60 * 1000
		).toISOString(),
		rentalEndDate: new Date(
			Date.now() + 1 * 24 * 60 * 60 * 1000
		).toISOString(),
		totalPrice: "₹4500.00",
		status: "Active",
		bikeGearType: "21-Speed",
		pickupLocation: "Main St. Pickup Point",
		dropoffLocation: "City Center Drop Point",
		paymentMethod: "Visa **** 4321",
		promoApplied: "WELCOME10 (-₹100)",
		priceBreakdown: {
			subtotal: 4000,
			discount: 100,
			taxesAndFees: 600,
			total: 4500,
		},
	},
	bk102: {
		id: "bk102",
		bikeName: "City Commuter Bike",
		bikeModelYear: "2022",
		bikeImageUrl: "https://via.placeholder.com/400x250.png?text=Commuter",
		rentalStartDate: new Date(
			Date.now() + 3 * 24 * 60 * 60 * 1000
		).toISOString(),
		rentalEndDate: new Date(
			Date.now() + 5 * 24 * 60 * 60 * 1000
		).toISOString(),
		totalPrice: "₹1200.00",
		status: "Upcoming",
		bikeGearType: "Single-Speed",
		pickupLocation: "Uptown Station",
		paymentMethod: "Mastercard **** 5678",
		priceBreakdown: { subtotal: 1000, taxesAndFees: 200, total: 1200 },
	},
	bk103: {
		id: "bk103",
		bikeName: "Road Bike Elite",
		bikeModelYear: "2023",
		bikeImageUrl: "https://via.placeholder.com/400x250.png?text=Road+Elite",
		rentalStartDate: new Date(
			Date.now() - 10 * 24 * 60 * 60 * 1000
		).toISOString(),
		rentalEndDate: new Date(
			Date.now() - 8 * 24 * 60 * 60 * 1000
		).toISOString(),
		totalPrice: "₹1800.00",
		status: "Completed",
		bikeGearType: "18-Speed",
		pickupLocation: "Main St. Pickup Point",
		dropoffLocation: "Main St. Pickup Point",
		paymentMethod: "UPI",
		priceBreakdown: { subtotal: 1500, taxesAndFees: 300, total: 1800 },
	},
};

const fetchRideDetail = async (
	bookingId: string
): Promise<RideDetail | null> => {
	return new Promise((resolve) =>
		setTimeout(() => resolve(DUMMY_RIDE_DETAILS[bookingId] || null), 300)
	);
};
// --- End Dummy Data ---

type RideDetailsScreenRouteProp = RouteProp<
	RentalsStackParamList,
	"RideDetailsScreen"
>;
type RideDetailsScreenNavigationProp = StackNavigationProp<
	RentalsStackParamList,
	"RideDetailsScreen"
>;

interface RideDetailsScreenProps {
	route: RideDetailsScreenRouteProp;
	navigation: RideDetailsScreenNavigationProp;
}

// Helper function to get status text style
const getStatusTextStyle = (status: RideStatus): StyleProp<TextStyle> => {
	switch (status) {
		case "Active":
			return styles.statusTextActive;
		case "Upcoming":
			return styles.statusTextUpcoming;
		case "Completed":
			return styles.statusTextCompleted;
		case "Cancelled":
			return styles.statusTextCancelled;
		default:
			// Fallback style, or undefined if you want default text style
			return styles.detailItemValueBase; // Or simply undefined
	}
};

const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({
	route,
	navigation,
}) => {
	const { bookingId } = route.params;
	const [ride, setRide] = useState<RideDetail | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadRideDetails = async () => {
			setLoading(true);
			const details = await fetchRideDetail(bookingId);
			setRide(details);
			if (details) {
				navigation.setOptions({ title: details.bikeName });
			}
			setLoading(false);
		};
		loadRideDetails();
	}, [bookingId, navigation]);

	const startDate = useMemo(
		() => (ride ? new Date(ride.rentalStartDate) : null),
		[ride]
	);
	const endDate = useMemo(
		() => (ride ? new Date(ride.rentalEndDate) : null),
		[ride]
	);

	const formatDate = (
		date: Date | null,
		includeTime: boolean = true
	): string => {
		if (!date) return "N/A";
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
		return date.toLocaleDateString(undefined, options);
	};

	const handleEndRide = () => {
		if (ride) {
			navigation.navigate("EndRideScreen", {
				bookingId: ride.id,
				bikeName: ride.bikeName,
			});
		}
	};

	const handleCancelBooking = () => {
		console.log("Cancel booking:", ride?.id);
	};
	const handleRateRide = () => {
		console.log("Rate ride:", ride?.id);
	};

	if (loading) {
		return (
			<View style={styles.centered}>
				<Text>Loading ride details...</Text>
			</View>
		);
	}

	if (!ride || !startDate || !endDate) {
		return (
			<View style={styles.centered}>
				<Text>Ride details not found.</Text>
			</View>
		);
	}

	const renderDetailRow = (
		label: string,
		value?: string | number | null,
		valueStyle?: StyleProp<TextStyle>
	) => {
		if (value === undefined || value === null) return null;
		return (
			<View style={styles.detailItemRow}>
				<Text style={styles.detailItemLabel}>{label}</Text>
				<Text style={[styles.detailItemValueBase, valueStyle]}>
					{value}
				</Text>
			</View>
		);
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.card}>
				<Image
					source={{ uri: ride.bikeImageUrl }}
					style={styles.bikeImage}
				/>
				<Text style={styles.bikeName}>
					{ride.bikeName}{" "}
					<Text style={styles.bikeModelYear}>
						({ride.bikeModelYear || "N/A"})
					</Text>
				</Text>
				{ride.bikeGearType && (
					<Text style={styles.bikeSpecText}>
						Gear: {ride.bikeGearType}
					</Text>
				)}
			</View>

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Booking Details</Text>
				{renderDetailRow("Booking ID", ride.id)}
				{renderDetailRow(
					"Status",
					ride.status,
					getStatusTextStyle(ride.status)
				)}
				{renderDetailRow("Start Time", formatDate(startDate))}
				{renderDetailRow("End Time", formatDate(endDate))}
				{ride.pickupLocation &&
					renderDetailRow("Pickup Location", ride.pickupLocation)}
				{ride.dropoffLocation &&
					renderDetailRow("Drop-off Location", ride.dropoffLocation)}
			</View>

			{ride.priceBreakdown && (
				<View style={styles.card}>
					<Text style={styles.sectionTitle}>Payment Summary</Text>
					{renderDetailRow(
						"Subtotal",
						`₹${ride.priceBreakdown.subtotal.toFixed(2)}`
					)}
					{ride.priceBreakdown.discount &&
						renderDetailRow(
							"Discount",
							`- ₹${ride.priceBreakdown.discount.toFixed(2)}`,
							styles.discountText
						)}
					{renderDetailRow(
						"Taxes & Fees",
						`₹${ride.priceBreakdown.taxesAndFees.toFixed(2)}`
					)}
					{renderDetailRow(
						"Total Paid",
						`₹${ride.priceBreakdown.total.toFixed(2)}`,
						styles.totalPaidText
					)}
					{ride.paymentMethod &&
						renderDetailRow("Payment Method", ride.paymentMethod)}
				</View>
			)}

			<View style={styles.actionsContainer}>
				{ride.status === "Active" && (
					<PrimaryButton
						title="End Ride"
						onPress={handleEndRide}
						style={styles.actionButton}
					/>
				)}
				{ride.status === "Upcoming" && (
					<PrimaryButton
						title="Cancel Booking"
						onPress={handleCancelBooking}
						style={[styles.actionButton, styles.cancelButton]}
						textStyle={styles.cancelButtonText}
					/>
				)}
				{ride.status === "Completed" && (
					<PrimaryButton
						title="Rate This Ride"
						onPress={handleRateRide}
						style={styles.actionButton}
					/>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.backgroundMain || "#F4F4F4" },
	contentContainer: { padding: spacing.m, paddingBottom: spacing.xxl },
	centered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
	},
	card: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
	},
	bikeImage: {
		width: "100%",
		height: 200,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		backgroundColor: colors.greyLighter,
	},
	bikeName: {
		fontSize: typography.fontSizes.xxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	bikeModelYear: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.regular,
		color: colors.textSecondary,
	},
	bikeSpecText: {
		fontSize: typography.fontSizes.m,
		color: colors.textMedium,
		marginBottom: spacing.xxs,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.xl,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
		paddingBottom: spacing.xs,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	detailItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: spacing.s,
	},
	detailItemLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		flexShrink: 1,
	},
	detailItemValueBase: {
		// Base style for all values
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
		textAlign: "right",
		marginLeft: spacing.s,
	},
	// Specific status text styles
	statusTextActive: {
		color: colors.success || "green",
		fontWeight: typography.fontWeights.bold,
	},
	statusTextUpcoming: {
		color: colors.info || "blue",
		fontWeight: typography.fontWeights.bold,
	},
	statusTextCompleted: {
		color: colors.textMedium,
		fontWeight: typography.fontWeights.bold,
	}, // Using textMedium for completed
	statusTextCancelled: {
		color: colors.error || "red",
		fontWeight: typography.fontWeights.bold,
	},
	// Other value-specific styles
	discountText: { color: colors.success || "green" },
	totalPaidText: {
		color: colors.primary,
		fontWeight: typography.fontWeights.bold,
		fontSize: typography.fontSizes.l,
	},
	actionsContainer: { marginTop: spacing.l },
	actionButton: { marginBottom: spacing.m },
	cancelButton: { backgroundColor: colors.error || "red" },
	cancelButtonText: {
		/* Assuming PrimaryButton's textStyle prop handles this or default white is fine */
	},
});

export default RideDetailsScreen;
