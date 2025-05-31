// src/screens/App/Booking/ApplyPromoCodeScreen.tsx
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react"; // Added useEffect
import {
	ActivityIndicator,
	FlatList,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import PromoCard from "../../../components/common/PromoCard"; // Assumed to be theme-aware
import StyledTextInput from "../../../components/common/StyledTextInput"; // Assumed to be theme-aware
import { ExploreStackParamList } from "../../../navigation/types";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Dummy Promo Data ---
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
	const [manualPromoCode, setManualPromoCode] = useState("");
	const [availablePromos, setAvailablePromos] =
		useState<PromoOffer[]>(DUMMY_PROMOS);
	const [appliedPromo, setAppliedPromo] = useState<PromoOffer | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null); // For manual apply errors
	const [loading, setLoading] = useState(false);

	// Example: If onApplyPromo callback is passed from BookingScreen
	const onApplyPromoCallback = route.params?.onApplyPromo;

	const handleApplyManualCode = () => {
		if (!manualPromoCode.trim()) return;
		setLoading(true);
		setSuccessMessage(null);
		setErrorMessage(null);

		// Simulate API call
		setTimeout(() => {
			const foundPromo = DUMMY_PROMOS.find(
				(p) =>
					p.promoCode.toUpperCase() ===
					manualPromoCode.trim().toUpperCase()
			);
			if (foundPromo) {
				applyPromo(foundPromo);
			} else {
				setErrorMessage(
					`Invalid Code: "${manualPromoCode.trim()}" is not a valid promo code.`
				);
				setAppliedPromo(null); // Clear any previously applied promo
			}
			setLoading(false);
		}, 700);
	};

	const applyPromo = (promo: PromoOffer) => {
		setAppliedPromo(promo);
		setSuccessMessage(`Promo "${promo.promoCode}" Applied Successfully!`);
		setErrorMessage(null); // Clear any previous error
		setManualPromoCode("");

		// Call the callback if it exists to pass data back to BookingScreen
		if (onApplyPromoCallback) {
			onApplyPromoCallback({
				promoCode: promo.promoCode,
				description: promo.description,
				// Pass discountValue, discountType if available from promo object
			});
		}
		// Optionally navigate back after a short delay
		setTimeout(() => {
			if (navigation.canGoBack()) navigation.goBack();
		}, 1500); // Delay for user to see success message
	};

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			keyboardShouldPersistTaps="handled">
			<View style={styles.inputSection}>
				<StyledTextInput // Assumed themed: dark bg, light text/placeholder
					placeholder="Enter promo code"
					value={manualPromoCode}
					onChangeText={(text) => {
						setManualPromoCode(text);
						if (errorMessage) setErrorMessage(null); // Clear error on typing
						if (successMessage) setSuccessMessage(null); // Clear success on typing
					}}
					containerStyle={styles.promoInputContainer}
					autoCapitalize="characters"
				/>
				<TouchableOpacity
					style={[
						styles.applyManualButton,
						(manualPromoCode.trim() === "" || loading) &&
							styles.applyManualButtonDisabled,
					]}
					onPress={handleApplyManualCode}
					disabled={manualPromoCode.trim() === "" || loading}>
					{loading ? (
						<ActivityIndicator
							size="small"
							color={colors.buttonPrimaryText}
						/>
					) : (
						<Text style={styles.applyManualButtonText}>Apply</Text>
					)}
				</TouchableOpacity>
			</View>

			{errorMessage && (
				<View style={styles.messageContainerError}>
					<MaterialIcons
						name="error-outline"
						size={20}
						color={colors.error}
						style={styles.messageIcon}
					/>
					<Text style={styles.messageTextError}>{errorMessage}</Text>
				</View>
			)}

			{successMessage && (
				<View style={styles.messageContainerSuccess}>
					<MaterialIcons
						name="check-circle-outline"
						size={20}
						color={colors.success}
						style={styles.messageIcon}
					/>
					<Text style={styles.messageTextSuccess}>
						{successMessage}
					</Text>
				</View>
			)}

			<Text style={styles.sectionTitle}>Available Offers</Text>
			{availablePromos.length > 0 ? (
				<FlatList
					data={availablePromos}
					renderItem={({ item }) => (
						<PromoCard // This component needs to be themed for dark mode
							promoCode={item.promoCode}
							description={item.description}
							validityText={item.validityText}
							onApply={() => applyPromo(item)}
							isApplied={appliedPromo?.id === item.id} // Pass if it's the currently applied one
							// style={appliedPromo?.id === item.id ? styles.appliedPromoCard : {}}
						/>
					)}
					keyExtractor={(item) => item.id}
					scrollEnabled={false} // ScrollView is the parent
					ItemSeparatorComponent={() => (
						<View style={{ height: spacing.s }} />
					)}
				/>
			) : (
				<Text style={styles.noPromosText}>
					No offers available at the moment.
				</Text>
			)}

			<View style={styles.infoNoteContainer}>
				<MaterialIcons
					name="info-outline"
					size={20}
					color={colors.info}
					style={styles.messageIcon}
				/>
				<Text style={styles.infoNoteText}>
					Only one promo code can be applied per booking. Terms and
					conditions apply.
				</Text>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl, // Ensure space at bottom
	},
	inputSection: {
		flexDirection: "row",
		alignItems: "center", // Center items vertically if input and button have same height
		marginBottom: spacing.l,
	},
	promoInputContainer: {
		// For StyledTextInput wrapper
		flex: 1,
		marginRight: spacing.s,
		marginBottom: 0,
		// StyledTextInput should internally use colors.backgroundCard, colors.textPrimary, colors.textPlaceholder
	},
	applyManualButton: {
		backgroundColor: colors.primary, // Themed primary button color
		paddingVertical: spacing.m, // Consistent padding
		paddingHorizontal: spacing.l,
		borderRadius: borderRadius.m,
		justifyContent: "center",
		alignItems: "center",
		minHeight: 48, // Good tap height
	},
	applyManualButtonDisabled: {
		backgroundColor: colors.buttonPrimaryDisabledBackground, // Themed disabled color
	},
	applyManualButtonText: {
		color: colors.buttonPrimaryText, // Text color for primary button
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
	},
	messageContainerSuccess: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark card background
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
		borderLeftWidth: 4,
		borderLeftColor: colors.success, // Success indicator
	},
	messageContainerError: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark card background
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.l,
		borderLeftWidth: 4,
		borderLeftColor: colors.error, // Error indicator
	},
	messageIcon: {
		marginRight: spacing.s,
	},
	messageTextSuccess: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.success, // Success text color
		flexShrink: 1,
	},
	messageTextError: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textError, // Error text color
		flexShrink: 1,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary, // Light text for titles
		marginBottom: spacing.m,
	},
	noPromosText: {
		textAlign: "center",
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text
		marginVertical: spacing.l,
		fontSize: typography.fontSizes.m,
	},
	// appliedPromoCard: { // Example if PromoCard needs specific styling when applied
	//  borderColor: colors.primary,
	//  borderWidth: 2,
	// },
	infoNoteContainer: {
		flexDirection: "row",
		alignItems: "flex-start", // Align icon to top of text if text wraps
		backgroundColor: colors.backgroundCard, // Dark card background
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginTop: spacing.xl, // More space before this note
		borderLeftWidth: 4,
		borderLeftColor: colors.info, // Info indicator
	},
	infoNoteText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted text for notes
		flexShrink: 1,
		lineHeight: typography.lineHeights.getForSize(typography.fontSizes.s),
	},
});

export default ApplyPromoCodeScreen;
