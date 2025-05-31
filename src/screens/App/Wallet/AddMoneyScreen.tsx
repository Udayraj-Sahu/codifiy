// src/screens/App/Wallet/AddMoneyScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Keyboard,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import StyledTextInput from "../../../components/common/StyledTextInput"; // Assumed to be themed
import { WalletStackParamList } from "../../../navigation/types";
import {
	AddMoneyVerifyParams,
	clearWalletErrors,
	fetchUserWalletThunk,
	initiateAddMoneyThunk,
	resetAddMoneyProcess,
	verifyAddMoneyPaymentThunk,
} from "../../../store/slices/walletSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

type ScreenNavigationProp = StackNavigationProp<
	WalletStackParamList,
	"AddMoneyScreen"
>;

interface AddMoneyScreenProps {
	navigation: ScreenNavigationProp;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const AddMoneyScreen: React.FC<AddMoneyScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const { user: authUser } = useSelector((state: RootState) => state.auth);
	const {
		orderResponse,
		isInitiating,
		isVerifying,
		initiateError,
		verifyError,
	} = useSelector((state: RootState) => state.wallet.addMoneyProcess);
	const currentWalletBalance = useSelector(
		(state: RootState) => state.wallet.walletData?.balance
	);

	const [amount, setAmount] = useState("");
	const [customAmountFocused, setCustomAmountFocused] = useState(false);

	const bikyaLogoForRazorpay =
		"https://placehold.co/100x100/1A1A1A/FFFFFF?text=BKY"; // Dark theme friendly placeholder

	useEffect(() => {
		dispatch(resetAddMoneyProcess());
		dispatch(clearWalletErrors());
		dispatch(fetchUserWalletThunk());

		const keyboardDidHideListener = Keyboard.addListener(
			"keyboardDidHide",
			() => {
				Keyboard.dismiss();
			}
		);
		return () => {
			dispatch(resetAddMoneyProcess());
			keyboardDidHideListener.remove();
		};
	}, [dispatch]);

	useEffect(() => {
		if (
			orderResponse &&
			authUser &&
			orderResponse.razorpayKeyId &&
			!isVerifying
		) {
			const razorpayOptions = {
				description: "Add money to Bikya Wallet",
				image: bikyaLogoForRazorpay,
				currency: orderResponse.currency || "INR",
				key: orderResponse.razorpayKeyId,
				amount: orderResponse.amount.toString(),
				name: "Bikya Wallet Top-up",
				order_id: orderResponse.razorpayOrderId,
				prefill: {
					email: authUser.email,
					contact: authUser.phoneNumber || "", // Ensure phoneNumber is available on authUser
					name: authUser.fullName,
				},
				theme: { color: colors.primary }, // Use theme's primary color
			};

			RazorpayCheckout.open(razorpayOptions)
				.then(async (data: any) => {
					const verifyParams: AddMoneyVerifyParams = {
						razorpay_payment_id: data.razorpay_payment_id,
						razorpay_order_id: data.razorpay_order_id,
						razorpay_signature: data.razorpay_signature,
					};
					const resultAction = await dispatch(
						verifyAddMoneyPaymentThunk(verifyParams)
					);
					if (
						verifyAddMoneyPaymentThunk.fulfilled.match(resultAction)
					) {
						Alert.alert(
							"Success",
							"Money added to your wallet successfully!"
						);
						dispatch(fetchUserWalletThunk()); // Refresh wallet balance
						navigation.goBack();
					} else if (
						verifyAddMoneyPaymentThunk.rejected.match(resultAction)
					) {
						Alert.alert(
							"Payment Verification Failed",
							resultAction.payload || "Could not verify payment."
						);
					}
				})
				.catch((error: any) => {
					if (error.code !== 2) {
						// Code 2: Payment cancelled by user
						Alert.alert(
							"Payment Failed",
							error.description || "Could not complete payment."
						);
					}
					dispatch(resetAddMoneyProcess()); // Reset process on any Razorpay error/cancellation
				});
		}
	}, [
		orderResponse,
		authUser,
		dispatch,
		navigation,
		isVerifying,
		colors.primary,
	]);

	const handleAmountSelect = (selectedAmount: number) => {
		setAmount(String(selectedAmount));
		Keyboard.dismiss();
		setCustomAmountFocused(false);
	};

	const handleAddMoneyPress = () => {
		Keyboard.dismiss();
		const numericAmount = parseFloat(amount);
		if (isNaN(numericAmount) || numericAmount <= 0) {
			Alert.alert(
				"Invalid Amount",
				"Please enter a valid amount greater than zero."
			);
			return;
		}
		if (numericAmount < 10) {
			// Example minimum
			Alert.alert("Minimum Amount", "Minimum amount to add is ₹10.");
			return;
		}
		dispatch(
			initiateAddMoneyThunk({ amount: numericAmount, currency: "INR" })
		);
	};

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.contentContainer}
			keyboardShouldPersistTaps="handled">
			<View style={styles.balanceDisplayCard}>
				<Text style={styles.currentBalanceLabel}>
					Current Wallet Balance
				</Text>
				<Text style={styles.currentBalanceValue}>
					₹
					{currentWalletBalance !== null &&
					currentWalletBalance !== undefined ? (
						(currentWalletBalance / 100).toFixed(2)
					) : (
						<ActivityIndicator
							size="small"
							color={colors.primary}
						/>
					)}
				</Text>
			</View>

			<Text style={styles.sectionTitle}>Choose Amount to Add (INR)</Text>
			<View style={styles.presetAmountsContainer}>
				{PRESET_AMOUNTS.map((preset) => (
					<TouchableOpacity
						key={preset}
						style={[
							styles.amountChip,
							String(preset) === amount &&
								!customAmountFocused &&
								styles.amountChipSelected,
						]}
						onPress={() => handleAmountSelect(preset)}>
						<Text
							style={[
								styles.amountChipText,
								String(preset) === amount &&
									!customAmountFocused &&
									styles.amountChipTextSelected,
							]}>
							₹{preset}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			<StyledTextInput // Assumed themed
				label="Or Enter Custom Amount"
				placeholder="e.g., 1250"
				value={amount}
				onChangeText={(text) => {
					setAmount(text.replace(/[^0-9]/g, ""));
					setCustomAmountFocused(true);
				}}
				keyboardType="number-pad"
				containerStyle={styles.customAmountInput}
				onFocus={() => setCustomAmountFocused(true)}
				returnKeyType="done"
				// Pass themed props if StyledTextInput doesn't get them from context
				// labelTextStyle={{color: colors.textSecondary}}
				// inputStyle={{backgroundColor: colors.backgroundInput, borderColor: colors.borderDefault, color: colors.textPrimary}}
				// placeholderTextColor={colors.textPlaceholder}
			/>

			{(initiateError || verifyError) && (
				<View style={styles.errorContainer}>
					<MaterialIcons
						name="error-outline"
						size={20}
						color={colors.error}
						style={styles.errorIcon}
					/>
					<Text style={styles.errorText}>
						Error: {initiateError || verifyError}
					</Text>
				</View>
			)}

			<PrimaryButton // Assumed themed
				title={
					isInitiating
						? "Processing..."
						: isVerifying
						? "Verifying Payment..."
						: "Proceed to Add Money"
				}
				onPress={handleAddMoneyPress}
				isLoading={isInitiating || isVerifying}
				disabled={
					isInitiating ||
					isVerifying ||
					!amount ||
					parseFloat(amount) <= 0
				}
				style={styles.confirmButton}
				// iconLeft={<MaterialIcons name="account-balance-wallet" size={20} color={colors.buttonPrimaryText} />}
			/>

			<View style={styles.infoNoteContainer}>
				<MaterialIcons
					name="security"
					size={20}
					color={colors.info}
					style={styles.infoIconThemed}
				/>
				<Text style={styles.infoText}>
					You will be redirected to our secure payment gateway
					(Razorpay) to complete the transaction.
				</Text>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain,
	},
	contentContainer: {
		padding: spacing.m,
		paddingBottom: spacing.xxl,
	},
	balanceDisplayCard: {
		backgroundColor: colors.backgroundCard, // Dark card background
		paddingVertical: spacing.l,
		paddingHorizontal: spacing.xl,
		borderRadius: borderRadius.l, // More rounded
		marginBottom: spacing.xl,
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.borderDefault,
	},
	currentBalanceLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
		marginBottom: spacing.xs,
	},
	currentBalanceValue: {
		fontSize: typography.fontSizes.xxxl,
		fontFamily: typography.primaryBold,
		color: colors.primary, // Accent color for balance
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary, // Light text
		marginBottom: spacing.m,
	},
	presetAmountsContainer: {
		flexDirection: "row",
		justifyContent: "space-between", // Keep space-between
		alignItems: "center",
		marginBottom: spacing.l,
		flexWrap: "wrap",
	},
	amountChip: {
		backgroundColor: colors.backgroundCard, // Dark card background for unselected chips
		paddingVertical: spacing.m,
		borderRadius: borderRadius.m, // Standard radius
		borderWidth: 1.5,
		borderColor: colors.borderDefault, // Themed border for unselected
		flexBasis: "48%", // Ensure two chips per row with a small gap
		marginBottom: spacing.s, // Space between rows of chips
		alignItems: "center",
	},
	amountChipSelected: {
		backgroundColor: colors.primary, // Primary color for selected
		borderColor: colors.primary,
	},
	amountChipText: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primarySemiBold,
		color: colors.textPrimary, // Light text for unselected chip
	},
	amountChipTextSelected: {
		color: colors.buttonPrimaryText, // Text color for selected chip (contrasts with primary bg)
		fontFamily: typography.primaryBold,
	},
	customAmountInput: {
		// For StyledTextInput container
		marginBottom: spacing.l,
		// StyledTextInput should use themed colors internally:
		// background: colors.backgroundInput, text: colors.textPrimary, placeholder: colors.textPlaceholder
	},
	confirmButton: {
		// For PrimaryButton instance
		marginTop: spacing.m,
		// PrimaryButton handles its own theming. Using colors.success was an override.
		// If it's the main action, it should use default PrimaryButton style.
	},
	infoNoteContainer: {
		// Themed info box
		flexDirection: "row",
		alignItems: "flex-start",
		backgroundColor: colors.backgroundCard,
		padding: spacing.m,
		borderRadius: borderRadius.m,
		marginTop: spacing.xl,
		borderLeftWidth: 4,
		borderLeftColor: colors.info,
	},
	infoIconThemed: {
		// For MaterialIcons in info box
		marginRight: spacing.s,
		marginTop: spacing.xxs, // Align with first line of text
	},
	infoText: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary, // Muted light text
		textAlign: "left", // Align text properly
		flexShrink: 1, // Allow text to wrap
		lineHeight: typography.lineHeights.getForSize(typography.fontSizes.s),
	},
	errorContainer: {
		// Container for error message + icon
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.errorMuted, // Use a muted error background
		padding: spacing.s,
		borderRadius: borderRadius.m,
		marginBottom: spacing.m,
		marginTop: spacing.s,
	},
	errorIcon: {
		marginRight: spacing.s,
	},
	errorText: {
		color: colors.textError, // Themed error text color
		// textAlign: "center", // Centering might not be needed if in errorContainer
		flex: 1, // Allow text to take space
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
	},
});

export default AddMoneyScreen;
