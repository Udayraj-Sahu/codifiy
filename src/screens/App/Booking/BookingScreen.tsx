// src/screens/App/Booking/BookingScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useMemo, useState } from "react";
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton";
import StyledTextInput from "../../../components/common/StyledTextInput";
import { ExploreStackParamList } from "../../../navigation/types"; // Assuming this screen is part of ExploreStack
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Data & Services (replace with actual API data later) ---
interface BikeSummary {
	id: string;
	name: string;
	modelYear?: string;
	imageUrl: string;
	gearType?: string;
	mileage?: string; // Or number
	rating?: number;
	pricePerHour: number; // Needed for price calculation if not passed directly
}

interface UserInfo {
	name: string;
	phone: string;
	email: string;
}

// Re-using DUMMY_BIKE_DETAILS structure for simplicity
const DUMMY_BIKE_DETAILS_BOOKING: { [key: string]: BikeSummary } = {
	"1": {
		id: "1",
		name: "Trek Mountain Bike",
		modelYear: "2023 Model",
		imageUrl: "https://via.placeholder.com/400x200.png?text=Bike+1",
		gearType: "21-Speed",
		mileage: "1,234 km",
		rating: 4.5,
		pricePerHour: 75,
	},
	"3": {
		id: "3",
		name: "Yamaha MT-07",
		modelYear: "2024 Model",
		imageUrl: "https://via.placeholder.com/400x200.png?text=Yamaha+MT-07",
		gearType: "6-Speed",
		mileage: "550 km",
		rating: 4.9,
		pricePerHour: 250,
	},
	// Add other bike details
};

const DUMMY_USER_INFO: UserInfo = {
	name: "John Doe",
	phone: "+1 (555) 123-4567",
	email: "john.doe@example.com",
};

const fetchBikeSummary = async (
	bikeId: string
): Promise<BikeSummary | null> => {
	return new Promise((resolve) => {
		setTimeout(
			() => resolve(DUMMY_BIKE_DETAILS_BOOKING[bikeId] || null),
			300
		);
	});
};

const fetchUserInfo = async (): Promise<UserInfo | null> => {
	return new Promise((resolve) => {
		setTimeout(() => resolve(DUMMY_USER_INFO), 300);
	});
};
// --- End Dummy Data ---

// --- Checkbox Placeholder (same as in SignupScreen) ---
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
	const { bikeId, startDate, endDate } = route.params; // Dates are expected as ISO strings or Timestamps

	const [bike, setBike] = useState<BikeSummary | null>(null);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [promoCode, setPromoCode] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [appliedPromoDiscount, setAppliedPromoDiscount] = useState(0); // Example

	const rentalStartDate = useMemo(
		() => (startDate ? new Date(startDate) : null),
		[startDate]
	);
	const rentalEndDate = useMemo(
		() => (endDate ? new Date(endDate) : null),
		[endDate]
	);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			const [bikeData, userData] = await Promise.all([
				fetchBikeSummary(bikeId),
				fetchUserInfo(),
			]);
			setBike(bikeData);
			setUserInfo(userData);
			setLoading(false);
		};
		loadData();
	}, [bikeId]);

	const rentalDurationHours = useMemo(() => {
		if (
			rentalStartDate &&
			rentalEndDate &&
			rentalEndDate > rentalStartDate
		) {
			return (
				(rentalEndDate.getTime() - rentalStartDate.getTime()) /
				(1000 * 60 * 60)
			);
		}
		return 0;
	}, [rentalStartDate, rentalEndDate]);

	const subtotal = useMemo(() => {
		if (bike && rentalDurationHours > 0) {
			return rentalDurationHours * bike.pricePerHour;
		}
		return 0;
	}, [bike, rentalDurationHours]);

	// These would typically come from backend or a config
	const taxesAndFees = useMemo(() => subtotal * 0.18, [subtotal]); // Example 18% tax
	const totalAmount = useMemo(
		() => subtotal + taxesAndFees - appliedPromoDiscount,
		[subtotal, taxesAndFees, appliedPromoDiscount]
	);

	const handleEditUserInfo = () => {
		console.log("Navigate to Edit User Info");
		// navigation.navigate('EditProfile'); // Assuming an EditProfile screen
	};

	const handleApplyPromoCode = () => {
		// This would typically pass current booking details or subtotal to promo screen
		navigation.navigate("ApplyPromoCode", {
			/* currentBookingId or other context */
		});
		// After returning from ApplyPromoCodeScreen, you might update `appliedPromoDiscount`
		// For now, let's simulate a discount if a code is entered.
		if (promoCode.toUpperCase() === "BIKYA50") {
			setAppliedPromoDiscount(50);
		} else {
			setAppliedPromoDiscount(0);
		}
	};

	const handleConfirmBooking = () => {
		if (!agreedToTerms) {
			console.warn("Please agree to terms and conditions.");
			return;
		}
		// TODO: Implement Razorpay payment flow
		console.log("Proceeding to payment...");
		// On successful payment:
		navigation.navigate("BookingConfirmation", {
			bookingId: `BK${Date.now()}`,
		}); // Dummy booking ID
	};

	if (loading || !bike || !userInfo || !rentalStartDate || !rentalEndDate) {
		return (
			<View style={styles.centered}>
				<Text>Loading summary...</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
		
			<View style={styles.card}>
				<Image
					source={{ uri: bike.imageUrl }}
					style={styles.bikeImage}
				/>
				<View style={styles.bikeInfoContainer}>
					<Text style={styles.bikeName}>
						{bike.name}{" "}
						<Text style={styles.bikeModelYear}>
							• {bike.modelYear}
						</Text>
					</Text>
					<View style={styles.bikeSpecsRow}>
						{bike.gearType && (
							<Text style={styles.bikeSpec}>{bike.gearType}</Text>
						)}
						{bike.mileage && (
							<Text style={styles.bikeSpec}>
								Mileage: {bike.mileage}
							</Text>
						)}
						{bike.rating && (
							<Text style={styles.bikeSpec}>★ {bike.rating}</Text>
						)}
					</View>
				</View>
			</View>

		
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

			
			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Price Details</Text>
				<View style={styles.priceRow}>
					<Text style={styles.priceLabel}>
						Subtotal ({rentalDurationHours.toFixed(1)} days/hours)
					</Text>
					<Text style={styles.priceValue}>
						₹{subtotal.toFixed(2)}
					</Text>
				</View>
				{appliedPromoDiscount > 0 && (
					<View style={styles.priceRow}>
						<Text style={[styles.priceLabel, styles.promoText]}>
							Promo Discount
						</Text>
						<Text style={[styles.priceValue, styles.promoText]}>
							- ₹{appliedPromoDiscount.toFixed(2)}
						</Text>
					</View>
				)}
				<View style={styles.priceRow}>
					<Text style={styles.priceLabel}>Taxes & Fees</Text>
					<Text style={styles.priceValue}>
						₹{taxesAndFees.toFixed(2)}
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
						₹{totalAmount.toFixed(2)}
					</Text>
				</View>
			</View>

		
			<View style={[styles.card, styles.promoInputCard]}>
				<StyledTextInput
					placeholder="Enter promo code"
					value={promoCode}
					onChangeText={setPromoCode}
					containerStyle={{ flex: 1, marginBottom: 0 }}
					// inputStyle={{height: 40}} // Adjust height if needed
				/>
				<TouchableOpacity
					onPress={handleApplyPromoCode}
					style={styles.applyPromoButton}>
					<Text style={styles.applyPromoButtonText}>Apply</Text>
				</TouchableOpacity>
			</View>

			
			<View style={styles.card}>
				<View style={styles.userInfoHeader}>
					<Text style={styles.sectionTitle}>User Information</Text>
					<TouchableOpacity onPress={handleEditUserInfo}>
					
						<Text style={styles.editText}>Edit</Text>
					</TouchableOpacity>
				</View>
				<Text style={styles.userInfoText}>{userInfo.name}</Text>
				<Text style={styles.userInfoText}>{userInfo.phone}</Text>
				<Text style={styles.userInfoText}>{userInfo.email}</Text>
			</View>

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

			
			<PrimaryButton
				title="Confirm Booking"
				onPress={handleConfirmBooking}
				style={styles.confirmButton}
				disabled={!agreedToTerms}
			/>
			<Text style={styles.helpText}>Need help? Contact support</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F4F4F4",
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	centered: { flex: 1, justifyContent: "center", alignItems: "center" },
	card: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginBottom: spacing.m,
		// shadow
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	bikeImage: {
		width: "100%",
		height: 150, // Or aspect ratio
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
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
		overflow: "hidden", // for rounded corners on background
		marginTop: spacing.xs,
	},
	dateTimeRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	dateTimeLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.primaryLight,
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
		marginBottom: spacing.xs,
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
	promoText: {
		color: colors.success || "green",
	},
	totalRow: {
		borderTopWidth: 1,
		borderTopColor: colors.borderDefault,
		marginTop: spacing.s,
		paddingTop: spacing.s,
	},
	totalText: {
		fontWeight: typography.fontWeights.bold,
	},
	totalAmountValue: {
		color: colors.primary, // Highlight total amount
	},
	promoInputCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 0, // Adjust padding for button
	},
	applyPromoButton: {
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.m + 2, // To match input height
		backgroundColor: colors.primary, // As per design, this button has bg
		borderRadius: borderRadius.m, // Match input
		marginLeft: spacing.s,
	},
	applyPromoButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeights.semiBold,
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
	},
	termsContainer: {
		marginVertical: spacing.m,
		alignItems: "flex-start", // align checkbox to the left
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1.5,
		borderColor: colors.primary,
		borderRadius: 3,
		marginRight: spacing.s,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxChecked: { backgroundColor: colors.primary },
	checkboxCheckmark: {
		color: colors.white,
		fontSize: 12,
		fontWeight: "bold",
	},
	checkboxLabelText: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
	},
	linkText: {
		color: colors.primary,
		textDecorationLine: "underline",
	},
	confirmButton: {
		marginTop: spacing.m,
	},
	helpText: {
		textAlign: "center",
		color: colors.primaryLight,
		fontSize: typography.fontSizes.s,
		marginTop: spacing.l,
	},
});

export default BookingScreen;
