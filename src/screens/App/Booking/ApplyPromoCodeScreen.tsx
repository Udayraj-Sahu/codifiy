// src/screens/App/Booking/ApplyPromoCodeScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
	FlatList,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PromoCard from "../../../components/common/PromoCard";
import StyledTextInput from "../../../components/common/StyledTextInput";
import { ExploreStackParamList } from "../../../navigation/types"; // Assuming it's part of ExploreStack
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Promo Data (replace with actual API data later) ---
interface PromoOffer {
	id: string;
	promoCode: string;
	description: string;
	validityText: string;
	// Potentially other details like discountType, discountValue
}

const DUMMY_PROMOS: PromoOffer[] = [
	{
		id: "1",
		promoCode: "BIKYA50",
		description: "Get ₹50 off on your first ride",
		validityText: "Valid till 31 Dec 2025",
	},
	{
		id: "2",
		promoCode: "WEEKEND20",
		description: "20% off on weekend rides",
		validityText: "Valid till 30 Nov 2025",
	},
	{
		id: "3",
		promoCode: "REFERRAL100",
		description: "₹100 off on your first ride with referral code",
		validityText: "Valid till 15 Nov 2025",
	},
];
// --- End Dummy Data ---

type ApplyPromoCodeScreenRouteProp = RouteProp<
	ExploreStackParamList,
	"ApplyPromoCode"
>;
type ApplyPromoCodeScreenNavigationProp = StackNavigationProp<
	ExploreStackParamList,
	"ApplyPromoCode"
>;

interface ApplyPromoCodeScreenProps {
	route: ApplyPromoCodeScreenRouteProp;
	navigation: ApplyPromoCodeScreenNavigationProp;
}

const ApplyPromoCodeScreen: React.FC<ApplyPromoCodeScreenProps> = ({
	route,
	navigation,
}) => {
	// const { currentBookingId, subtotal } = route.params || {}; // Params from BookingScreen
	const [manualPromoCode, setManualPromoCode] = useState("");
	const [availablePromos, setAvailablePromos] =
		useState<PromoOffer[]>(DUMMY_PROMOS);
	const [appliedPromo, setAppliedPromo] = useState<PromoOffer | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// In a real app, you might fetch available promos based on user/booking context
	// useEffect(() => {
	//   fetchAvailablePromos(currentBookingId, subtotal).then(setAvailablePromos);
	// }, [currentBookingId, subtotal]);

	const handleApplyManualCode = () => {
		if (!manualPromoCode.trim()) return;
		setLoading(true);
		// TODO: Validate manualPromoCode via API
		// For now, simulate: check if it exists in our dummy list
		const foundPromo = DUMMY_PROMOS.find(
			(p) =>
				p.promoCode.toUpperCase() ===
				manualPromoCode.trim().toUpperCase()
		);
		setTimeout(() => {
			if (foundPromo) {
				applyPromo(foundPromo);
			} else {
				// Alert.alert("Invalid Code", "The promo code entered is not valid.");
				console.warn("Invalid Code: ", manualPromoCode);
				setSuccessMessage(null); // Clear any previous success message
			}
			setLoading(false);
		}, 500);
	};

	const applyPromo = (promo: PromoOffer) => {
		setAppliedPromo(promo);
		setSuccessMessage(`Promo "${promo.promoCode}" Applied Successfully!`);
		setManualPromoCode(""); // Clear input

		// TODO: Navigate back to BookingScreen and pass the applied promo details
		// This is often done by updating a shared state (Redux/Context) or by
		// using navigation.navigate with params to update the previous screen if possible,
		// or a callback function passed via route params.
		// For simplicity here, we'll assume BookingScreen refetches or uses context.
		// Or, if BookingScreen can listen to focus events, it can refresh.
		// A common pattern is `navigation.navigate('Booking', { appliedPromoCode: promo.promoCode, discount: ... });`
		// This will update params of Booking screen if it's already in stack, then goBack could be called.
		// OR: navigation.goBack(); and BookingScreen uses a listener or context.

		// For now, just show message and user can manually go back or we can auto goBack.
		// Alert.alert("Promo Applied!", `"${promo.promoCode}" has been applied.`);
		// navigation.goBack(); // Could go back automatically
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}>
			<View style={styles.inputSection}>
				<StyledTextInput
					placeholder="Enter code here"
					value={manualPromoCode}
					onChangeText={setManualPromoCode}
					containerStyle={styles.promoInputContainer}
					// inputStyle={{height: 48}} // Match button height
					autoCapitalize="characters"
				/>
			
				<TouchableOpacity
					style={[
						styles.applyManualButton,
						manualPromoCode.trim() === "" &&
							styles.applyManualButtonDisabled,
					]}
					onPress={handleApplyManualCode}
					disabled={manualPromoCode.trim() === "" || loading}>
					<Text style={styles.applyManualButtonText}>
						{loading ? "Applying..." : "Apply"}
					</Text>
				</TouchableOpacity>
			</View>

			{successMessage && (
				<View style={styles.successMessageContainer}>
					<Text style={styles.successIcon}>✓</Text>
					<Text style={styles.successMessageText}>
						{successMessage}
					</Text>
				</View>
			)}

			<Text style={styles.sectionTitle}>Available Offers for You</Text>
			{availablePromos.length > 0 ? (
				<FlatList
					data={availablePromos}
					renderItem={({ item }) => (
						<PromoCard
							promoCode={item.promoCode}
							description={item.description}
							validityText={item.validityText}
							onApply={() => applyPromo(item)}
							// style={appliedPromo?.id === item.id ? styles.appliedPromoCard : {}} // Example style for applied
						/>
					)}
					keyExtractor={(item) => item.id}
					scrollEnabled={false} // If ScrollView is the parent
				/>
			) : (
				<Text style={styles.noPromosText}>
					No available offers at the moment.
				</Text>
			)}

			<View style={styles.infoNoteContainer}>
				<Text style={styles.infoIcon}>ⓘ</Text>
				<Text style={styles.infoNoteText}>
					Only one promo can be used per booking.
				</Text>
			</View>
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
	},
	inputSection: {
		flexDirection: "row",
		alignItems: "flex-start", // Align items to top if input grows
		marginBottom: spacing.l,
	},
	promoInputContainer: {
		flex: 1,
		marginRight: spacing.s,
		marginBottom: 0, // Reset default from StyledTextInput
	},
	applyManualButton: {
		backgroundColor: "#5E6E2A", // Darker olive green from design (approximate)
		paddingVertical: spacing.m + 2, // Match typical input height
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 48, // Ensure good tap height
	},
	applyManualButtonDisabled: {
		backgroundColor: colors.greyMedium, // Or a lighter shade of the olive green
	},
	applyManualButtonText: {
		color: colors.white,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
	},
	successMessageContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.primaryLight || "#E6F7FF", // Light green tint
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
	},
	successIcon: {
		fontSize: typography.fontSizes.l,
		color: colors.primary || "green", // Or a success green
		marginRight: spacing.s,
		fontWeight: "bold",
	},
	successMessageText: {
		fontSize: typography.fontSizes.m,
		color: colors.primaryDark || colors.primary, // Darker shade of primary
		flexShrink: 1,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	noPromosText: {
		textAlign: "center",
		color: colors.primaryLight,
		marginVertical: spacing.l,
	},
	// appliedPromoCard: { // Example
	//   opacity: 0.6,
	// },
	infoNoteContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundLight || "#F0F0F0", // Light grey tint
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginTop: spacing.l,
	},
	infoIcon: {
		fontSize: typography.fontSizes.l,
		color: colors.primaryLight,
		marginRight: spacing.s,
	},
	infoNoteText: {
		fontSize: typography.fontSizes.s,
		color: colors.primaryLight,
		flexShrink: 1,
	},
});

export default ApplyPromoCodeScreen;
