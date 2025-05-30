// src/screens/App/Wallet/AddMoneyScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
	Alert,
	Keyboard,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay"; // Import Razorpay
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton";
import StyledTextInput from "../../../components/common/StyledTextInput";
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

const PRESET_AMOUNTS = [500, 1000, 2000, 5000]; // Amounts in primary currency unit (e.g., INR)

const AddMoneyScreen: React.FC<AddMoneyScreenProps> = ({ navigation }) => {
	const dispatch = useDispatch<AppDispatch>();
	const { user: authUser, token } = useSelector(
		(state: RootState) => state.auth
	);
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

	useEffect(() => {
		dispatch(resetAddMoneyProcess());
		dispatch(clearWalletErrors());
		// Fetch current balance when screen loads to show it accurately
		dispatch(fetchUserWalletThunk());

		const keyboardDidHideListener = Keyboard.addListener(
			"keyboardDidHide",
			() => {
				Keyboard.dismiss(); // Ensure keyboard is fully dismissed
			}
		);

		return () => {
			dispatch(resetAddMoneyProcess()); // Clean up on unmount
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
			// Check !isVerifying
			const razorpayOptions = {
				description: "Add money to Bikya Wallet",
				image: "https://via.placeholder.com/100.png?text=Bikya", // Replace with your app logo URL
				currency: orderResponse.currency || "INR",
				key: orderResponse.razorpayKeyId,
				amount: orderResponse.amount.toString(), // Amount in paisa, as string
				name: "Bikya Wallet Top-up",
				order_id: orderResponse.razorpayOrderId,
				prefill: {
					email: authUser.email,
					contact: (authUser as any).phone || "",
					name: authUser.fullName,
				},
				theme: { color: colors.primary },
			};

			console.log("Opening Razorpay with options:", razorpayOptions);
			RazorpayCheckout.open(razorpayOptions)
				.then(async (data: any) => {
					// Razorpay success
					console.log(`Razorpay Success: ${JSON.stringify(data)}`);
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
					// Razorpay error or cancellation
					console.error(
						`Razorpay Error: Code: ${error.code} | Description: ${error.description}`
					);
					// Code 0: Network error, Code 1: Initialization failure, Code 2: Payment cancelled by user
					if (error.code !== 2) {
						// Don't show alert if user just cancelled
						Alert.alert(
							"Payment Failed",
							error.description || "Could not complete payment."
						);
					}
					dispatch(resetAddMoneyProcess());
				});
		}
	}, [orderResponse, authUser, dispatch, navigation, isVerifying]); // isVerifying added to deps

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
					currentWalletBalance !== undefined
						? (currentWalletBalance / 100).toFixed(2)
						: "Loading..."}
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

			<StyledTextInput
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
			/>

			{(initiateError || verifyError) && (
				<Text style={styles.errorText}>
					Error: {initiateError || verifyError}
				</Text>
			)}

			<PrimaryButton
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
			/>

			<Text style={styles.infoText}>
				You will be redirected to our secure payment gateway to complete
				the transaction. All payments are processed by Razorpay.
			</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: { flex: 1, backgroundColor: colors.backgroundMain },
	contentContainer: { padding: spacing.m, paddingBottom: spacing.xl },
	balanceDisplayCard: {
		backgroundColor: colors.white,
		paddingVertical: spacing.l,
		paddingHorizontal: spacing.xl,
		borderRadius: borderRadius.m,
		marginBottom: spacing.xl,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
	},
	currentBalanceLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	currentBalanceValue: {
		fontSize: typography.fontSizes.xxxl,
		fontWeight: typography.fontWeights.bold,
		color: colors.primary,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.textPrimary,
		marginBottom: spacing.m,
	},
	presetAmountsContainer: {
		flexDirection: "row",
		justifyContent: "space-around", // Changed to space-around
		alignItems: "center",
		marginBottom: spacing.l,
		flexWrap: "wrap", // Allow wrapping if many chips
	},
	amountChip: {
		backgroundColor: colors.white,
		paddingVertical: spacing.m,
		borderRadius: borderRadius.pill,
		borderWidth: 1.5,
		borderColor: colors.primaryLight,
		flexGrow: 1, // Allow chips to grow
		margin: spacing.xs,
		alignItems: "center",
		minWidth: "40%", // Ensure at least 2 chips per row
	},
	amountChipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	amountChipText: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
		color: colors.primary,
	},
	amountChipTextSelected: { color: colors.white },
	customAmountInput: { marginBottom: spacing.l },
	confirmButton: { marginTop: spacing.m, backgroundColor: colors.success },
	infoText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		textAlign: "center",
		marginTop: spacing.l,
		paddingHorizontal: spacing.m,
	},
	errorText: {
		color: colors.error,
		textAlign: "center",
		marginBottom: spacing.m,
		fontSize: typography.fontSizes.s,
	},
});

export default AddMoneyScreen;
