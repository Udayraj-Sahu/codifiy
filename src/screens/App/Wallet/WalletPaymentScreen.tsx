// src/screens/App/Wallet/WalletPaymentScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"; // Import MaterialIcons
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Assumed to be themed
import { WalletStackParamList } from "../../../navigation/types";
import {
	fetchUserWalletThunk,
	fetchWalletTransactionsThunk,
	TransactionData,
} from "../../../store/slices/walletSlice"; // Assuming these are correctly implemented
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Transaction Item Component ---
interface TransactionItemProps {
	item: TransactionData;
	onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ item, onPress }) => {
	const isCredit = item.type === "credit";
	// For dark theme, success/error colors for text should be light/bright
	const amountColor = isCredit ? colors.success : colors.error;
	const sign = isCredit ? "+" : "-";
	// Use MaterialIcons
	const iconName = isCredit ? "arrow-downward" : "arrow-upward";
	const iconBackgroundColor = isCredit
		? colors.successMuted
		: colors.errorMuted; // Define these in theme (e.g., dark green/red bg)

	return (
		<TouchableOpacity
			style={styles.transactionItem}
			onPress={onPress}
			activeOpacity={0.7}>
			<View
				style={[
					styles.transactionIconContainer,
					{ backgroundColor: iconBackgroundColor },
				]}>
				<MaterialIcons name={iconName} size={20} color={amountColor} />
			</View>
			<View style={styles.transactionDetails}>
				<Text style={styles.transactionDescription} numberOfLines={1}>
					{item.description || "Transaction"}
				</Text>
				<Text style={styles.transactionDate}>
					{new Date(item.createdAt).toLocaleDateString(undefined, {
						day: "numeric",
						month: "short",
						year: "numeric",
					})}{" "}
					-{" "}
					{new Date(item.createdAt).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
						hour12: true,
					})}
				</Text>
				{item.status !== "successful" && (
					<Text
						style={[
							styles.transactionStatus,
							styles[
								`status${
									item.status.charAt(0).toUpperCase() +
									item.status.slice(1)
								}` as keyof typeof styles
							],
						]}>
						Status: {item.status}
					</Text>
				)}
			</View>
			<Text style={[styles.transactionAmount, { color: amountColor }]}>
				{sign}₹{(item.amount / 100).toFixed(2)}
			</Text>
		</TouchableOpacity>
	);
};
// --- End Transaction Item ---

type ScreenNavigationProp = StackNavigationProp<
	WalletStackParamList,
	"WalletPaymentsScreen"
>;

interface WalletPaymentsScreenProps {
	navigation: ScreenNavigationProp;
}

const WalletPaymentsScreen: React.FC<WalletPaymentsScreenProps> = ({
	navigation,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const {
		walletData,
		transactions,
		pagination,
		isLoadingWallet,
		isLoadingTransactions,
		errorWallet,
		errorTransactions,
	} = useSelector((state: RootState) => state.wallet);

	const loadData = useCallback(
		(isRefreshing = false) => {
			if (
				!isRefreshing &&
				(isLoadingWallet ||
					(isLoadingTransactions && transactions.length === 0))
			) {
				return;
			}
			dispatch(fetchUserWalletThunk());
			dispatch(fetchWalletTransactionsThunk({ page: 1, limit: 10 })); // Fetch more items for initial view
		},
		[dispatch, isLoadingWallet, isLoadingTransactions, transactions.length]
	); // Added transactions.length

	useEffect(() => {
		const unsubscribeFocus = navigation.addListener("focus", () => {
			loadData(true); // Refresh on focus
		});
		return unsubscribeFocus;
	}, [navigation, loadData]);

	const handleAddMoney = () => {
		navigation.navigate("AddMoneyScreen");
	};

	const handleViewAllTransactions = () => {
		navigation.navigate("TransactionHistoryScreen");
	};

	const handleTransactionPress = (transaction: TransactionData) => {
		Alert.alert(
			`Transaction: ${transaction._id}`,
			`Type: ${transaction.type}\nAmount: ${(
				transaction.amount / 100
			).toFixed(2)}\nStatus: ${transaction.status}\nDescription: ${
				transaction.description
			}\nDate: ${new Date(transaction.createdAt).toLocaleString()}`
		);
	};

	const renderHeader = () => (
		<>
			<View style={styles.balanceCard}>
				<Text style={styles.balanceLabel}>Current Wallet Balance</Text>
				{isLoadingWallet && !walletData ? (
					<ActivityIndicator
						color={colors.white}
						style={{ marginVertical: spacing.m }}
					/>
				) : errorWallet ? (
					<View style={styles.errorContainer}>
						<MaterialIcons
							name="error-outline"
							size={20}
							color={colors.textDisabled}
							style={{ marginRight: spacing.xs }}
						/>
						<Text style={styles.errorTextSmall}>
							Error: {errorWallet}
						</Text>
						<TouchableOpacity
							onPress={() => dispatch(fetchUserWalletThunk())}
							style={styles.retryButtonSmall}>
							<Text style={styles.retryTextSmall}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : walletData ? (
					<Text style={styles.balanceAmount}>
						₹{(walletData.balance / 100).toFixed(2)}
					</Text>
				) : (
					<Text style={styles.balanceAmount}>₹0.00</Text>
				)}
				<PrimaryButton // Assumed themed
					title="Add Money"
					onPress={handleAddMoney}
					style={styles.addMoneyButton}
					textStyle={styles.addMoneyButtonText} // Ensure text contrasts with button bg
					iconLeft={
						<MaterialIcons
							name="add-circle-outline"
							size={20}
							color={colors.buttonPrimaryText}
						/>
					}
				/>
			</View>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Recent Transactions</Text>
				{transactions.length > 0 &&
					pagination &&
					pagination.totalTransactions > (pagination.limit || 10) && (
						<TouchableOpacity onPress={handleViewAllTransactions}>
							<Text style={styles.viewAllLink}>View All</Text>
						</TouchableOpacity>
					)}
			</View>
		</>
	);

	const ListEmptyComponentContent = () => {
		if (isLoadingTransactions && transactions.length === 0) return null; // Initial loading handled by RefreshControl
		if (errorTransactions) {
			return (
				<View style={styles.emptyStateContainer}>
					<MaterialIcons
						name="error-outline"
						size={48}
						color={colors.error}
					/>
					<Text style={styles.errorText}>
						Error: {errorTransactions}
					</Text>
					<PrimaryButton
						title="Retry Transactions"
						onPress={() =>
							dispatch(
								fetchWalletTransactionsThunk({
									page: 1,
									limit: 10,
								})
							)
						}
						style={{ marginTop: spacing.m }}
					/>
				</View>
			);
		}
		return (
			<View style={styles.emptyStateContainer}>
				<MaterialIcons
					name="receipt-long"
					size={48}
					color={colors.textDisabled}
					style={styles.emptyStateIconThemed}
				/>
				<Text style={styles.emptyStateText}>No transactions yet.</Text>
				<Text style={styles.emptyStateSubtext}>
					Your recent wallet activity will appear here once you make a
					transaction.
				</Text>
			</View>
		);
	};

	return (
		<FlatList
			ListHeaderComponent={renderHeader}
			data={transactions}
			renderItem={({ item }) => (
				<TransactionItem
					item={item}
					onPress={() => handleTransactionPress(item)}
				/>
			)}
			keyExtractor={(item) => item._id}
			style={styles.screenContainer}
			contentContainerStyle={styles.listContentContainer}
			showsVerticalScrollIndicator={false}
			ListEmptyComponent={ListEmptyComponentContent}
			refreshControl={
				<RefreshControl
					refreshing={
						isLoadingWallet ||
						(isLoadingTransactions && transactions.length === 0)
					}
					onRefresh={() => loadData(true)}
					colors={[colors.primary]} // For Android
					tintColor={colors.primary} // For iOS
				/>
			}
			// TODO: Add onEndReached for pagination if needed for "Recent Transactions"
		/>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain, // Dark theme background
	},
	listContentContainer: {
		paddingBottom: spacing.xl,
		flexGrow: 1,
	},
	balanceCard: {
		backgroundColor: colors.primaryDark, // Darker primary for balance card
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.xl,
		marginHorizontal: spacing.m,
		marginTop: spacing.m,
		marginBottom: spacing.l,
		borderRadius: borderRadius.xl,
		alignItems: "center",
		shadowColor: colors.shadowColor, // Use themed shadow color
		shadowOffset: { width: 0, height: 4 }, // Adjusted shadow
		shadowOpacity: 0.3,
		shadowRadius: 6,
		elevation: 8,
	},
	balanceLabel: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
		color: colors.textWhite, // White or very light text on dark primary
		marginBottom: spacing.xs,
	},
	balanceAmount: {
		fontSize: typography.fontSizes.xxxl + 12,
		fontFamily: typography.primaryBold,
		color: colors.textWhite, // White or very light text
		marginBottom: spacing.l,
	},
	addMoneyButton: {
		// For PrimaryButton instance
		backgroundColor: colors.primary, // Standard primary color for button
		width: "90%",
		// PrimaryButton should handle its text color internally (e.g. colors.buttonPrimaryText)
	},
	addMoneyButtonText: {
		// If PrimaryButton needs explicit text style prop
		// color: colors.buttonPrimaryText, // Example
	},
	// addMoneyIcon removed, using MaterialIcons in iconLeft prop
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.m + spacing.xs,
		marginTop: spacing.s,
		marginBottom: spacing.m, // Increased margin
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryBold,
		color: colors.textPrimary, // Light text for section titles
	},
	viewAllLink: {
		fontSize: typography.fontSizes.m, // Slightly larger
		fontFamily: typography.primaryMedium,
		color: colors.textLink, // Themed link color
	},
	transactionItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.backgroundCard, // Dark card background for items
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault, // Themed border
		marginHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.s, // Spacing between items
	},
	transactionIconContainer: {
		width: 40,
		height: 40,
		borderRadius: borderRadius.circle, // Circular
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
		// backgroundColor is set dynamically
	},
	// transactionIcon removed, using MaterialIcons now
	transactionDetails: { flex: 1 },
	transactionDescription: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryMedium,
		color: colors.textPrimary,
	},
	transactionDate: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	transactionStatus: {
		fontSize: typography.fontSizes.xs,
		fontFamily: typography.primaryItalic, // Using italic for status
		marginTop: spacing.xxs,
	},
	statusPending: { color: colors.warning }, // Themed status colors
	statusFailed: { color: colors.error },
	statusCancelled: { color: colors.textDisabled },
	transactionAmount: {
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryBold,
		// color is set dynamically
	},
	centered: {
		// For full screen loaders/empty states
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.backgroundMain,
	},
	emptyStateContainer: {
		// For ListEmptyComponent
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.xl,
		minHeight: 200, // Ensure it takes some space
	},
	emptyStateIconThemed: {
		// For MaterialIcons in empty state
		marginBottom: spacing.m,
	},
	// emptyStateIcon removed, using MaterialIcons now
	emptyStateText: {
		fontSize: typography.fontSizes.l,
		fontFamily: typography.primaryRegular,
		color: colors.textSecondary,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	emptyStateSubtext: {
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
		color: colors.textPlaceholder,
		textAlign: "center",
	},
	errorContainer: {
		// For errors within balance card
		alignItems: "center",
		paddingVertical: spacing.s,
	},
	errorText: {
		// For general error messages in list or centered
		color: colors.textError,
		textAlign: "center",
		marginVertical: spacing.s,
		fontSize: typography.fontSizes.m,
		fontFamily: typography.primaryRegular,
	},
	errorTextSmall: {
		// For errors within balance card
		color: colors.textWhite, // White text on dark primary background
		opacity: 0.8,
		textAlign: "center",
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryRegular,
	},
	retryButtonSmall: {
		marginTop: spacing.s,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.m,
		borderRadius: borderRadius.s,
		borderColor: colors.textWhite, // White border
		borderWidth: 1,
	},
	retryTextSmall: {
		color: colors.textWhite, // White text
		fontSize: typography.fontSizes.s,
		fontFamily: typography.primaryMedium,
	},
});

export default WalletPaymentsScreen;
