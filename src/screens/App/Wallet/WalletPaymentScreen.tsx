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
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from "../../../components/common/PrimaryButton";
import { WalletStackParamList } from "../../../navigation/types";
import {
	fetchUserWalletThunk,
	fetchWalletTransactionsThunk,
	TransactionData,
} from "../../../store/slices/walletSlice";
import { AppDispatch, RootState } from "../../../store/store";
import { borderRadius, colors, spacing, typography } from "../../../theme";

// --- Transaction Item Component ---
interface TransactionItemProps {
	item: TransactionData;
	onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ item, onPress }) => {
	const isCredit = item.type === "credit";
	const amountColor = isCredit ? colors.successDark : colors.errorDark;
	const sign = isCredit ? "+" : "-";
	const icon = isCredit ? "↓" : "↑"; // Arrow down for credit (money in), arrow up for debit (money out)

	return (
		<TouchableOpacity
			style={styles.transactionItem}
			onPress={onPress}
			activeOpacity={0.7}>
			<View
				style={[
					styles.transactionIconContainer,
					{
						backgroundColor: isCredit
							? colors.successLight
							: colors.errorLight,
					},
				]}>
				<Text style={[styles.transactionIcon, { color: amountColor }]}>
					{icon}
				</Text>
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
			// The check for isLoadingWallet/isLoadingTransactions is inside the function,
			// so it doesn't strictly need to be a dependency for the callback's identity.
			if (!isRefreshing && (isLoadingWallet || isLoadingTransactions)) {
				return;
			}
			console.log(
				"WalletPaymentsScreen: Fetching wallet data and initial transactions..."
			);
			dispatch(fetchUserWalletThunk());
			dispatch(fetchWalletTransactionsThunk({ page: 1, limit: 5 }));
		},
		[dispatch]
	);
	useEffect(() => {
		const unsubscribeFocus = navigation.addListener("focus", () => {
			console.log("WalletPaymentsScreen: Focused. Reloading data.");
			loadData(true);
		});
		// loadData(); // Initial load is handled by the focus listener the first time too
		return unsubscribeFocus;
	}, [navigation, loadData]);

	const handleAddMoney = () => {
		navigation.navigate("AddMoneyScreen");
	};

	const handleViewAllTransactions = () => {
		navigation.navigate("TransactionHistoryScreen");
	};

	const handleTransactionPress = (transaction: TransactionData) => {
		// For now, just an alert. Later, can navigate to a TransactionDetailScreen.
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
					<Text style={styles.balanceAmount}>₹0.00</Text> // Fallback if no data and not loading/error
				)}
				<PrimaryButton
					title="Add Money"
					onPress={handleAddMoney}
					style={styles.addMoneyButton}
					iconLeft={<Text style={styles.addMoneyIcon}>💰</Text>}
				/>
			</View>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>Recent Transactions</Text>
				{transactions.length > 0 &&
					pagination &&
					pagination.totalTransactions > (pagination.limit || 5) && (
						<TouchableOpacity onPress={handleViewAllTransactions}>
							<Text style={styles.viewAllLink}>View All</Text>
						</TouchableOpacity>
					)}
			</View>
		</>
	);

	const ListEmptyComponentContent = () => {
		if (isLoadingTransactions) return null; // Loader handled by main FlatList refreshControl or header for initial
		if (errorTransactions) {
			return (
				<View style={styles.emptyStateContainer}>
					<Text style={styles.errorText}>
						Error: {errorTransactions}
					</Text>
					<PrimaryButton
						title="Retry Transactions"
						onPress={() =>
							dispatch(
								fetchWalletTransactionsThunk({
									page: 1,
									limit: 5,
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
				<Text style={styles.emptyStateIcon}>🧾</Text>
				<Text style={styles.emptyStateText}>No transactions yet.</Text>
				<Text style={styles.emptyStateSubtext}>
					Your recent wallet activity will appear here.
				</Text>
			</View>
		);
	};

	return (
		<FlatList
			ListHeaderComponent={renderHeader}
			data={transactions} // Display only the first few transactions fetched initially
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
					} // Show when either is loading initially
					onRefresh={() => loadData(true)}
					colors={[colors.primary]}
					tintColor={colors.primary}
				/>
			}
			// Pagination for recent transactions on this screen is not implemented yet.
			// For full history, user goes to TransactionHistoryScreen.
		/>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundMain || "#F4F6F8",
	},
	listContentContainer: {
		paddingBottom: spacing.xl,
		flexGrow: 1 /* Ensure empty component can center */,
	},
	balanceCard: {
		backgroundColor: colors.primaryDark,
		paddingHorizontal: spacing.l,
		paddingVertical: spacing.xl,
		marginHorizontal: spacing.m,
		marginTop: spacing.m,
		marginBottom: spacing.l,
		borderRadius: borderRadius.xl,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 6,
	},
	balanceLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.whiteAlpha70 || "rgba(255,255,255,0.7)",
		marginBottom: spacing.xs,
		fontWeight: typography.fontWeights.medium,
	},
	balanceAmount: {
		fontSize: typography.fontSizes.xxxl + 12,
		fontWeight: typography.fontWeights.bold,
		color: colors.white,
		marginBottom: spacing.l,
	},
	addMoneyButton: { backgroundColor: colors.primary, width: "90%" },
	addMoneyIcon: { color: colors.white, marginRight: spacing.s, fontSize: 18 },
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.m + spacing.xs,
		marginTop: spacing.s,
		marginBottom: spacing.s,
	},
	sectionTitle: {
		fontSize: typography.fontSizes.l,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
	},
	viewAllLink: {
		fontSize: typography.fontSizes.s,
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},
	transactionItem: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.white,
		paddingHorizontal: spacing.m,
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EAEAEA",
		marginHorizontal: spacing.m,
		borderRadius: borderRadius.m,
		marginBottom: spacing.xs,
	},
	transactionIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		marginRight: spacing.m,
	},
	transactionIcon: { fontSize: 18, fontWeight: "bold" },
	transactionDetails: { flex: 1 },
	transactionDescription: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	transactionDate: {
		fontSize: typography.fontSizes.xs,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	transactionStatus: {
		fontSize: typography.fontSizes.xs,
		fontStyle: "italic",
		marginTop: spacing.xxs,
	},
	statusPending: { color: colors.warningDark },
	statusFailed: { color: colors.errorDark },
	statusCancelled: { color: colors.greyDark },
	transactionAmount: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
	},
	centeredLoader: {
		flex: 1,
		justifyContent: "flex-start",
		alignItems: "center",
		paddingTop: spacing.l,
	}, // Changed to flex-start for header
	loadingText: { marginTop: spacing.s, color: colors.textMedium },
	emptyStateContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: spacing.xl,
		minHeight: 200,
	},
	emptyStateIcon: {
		fontSize: 48,
		color: colors.greyMedium,
		marginBottom: spacing.m,
	},
	emptyStateText: {
		fontSize: typography.fontSizes.l,
		color: colors.textMedium,
		textAlign: "center",
		marginBottom: spacing.xs,
	},
	emptyStateSubtext: {
		fontSize: typography.fontSizes.s,
		color: colors.textLight,
		textAlign: "center",
	},
	errorText: {
		color: colors.error,
		textAlign: "center",
		marginVertical: spacing.s,
		fontSize: typography.fontSizes.m,
	},
	errorTextSmall: {
		color: colors.whiteAlpha70,
		textAlign: "center",
		fontSize: typography.fontSizes.s,
	},
	retryButtonSmall: {
		marginTop: spacing.xs,
		paddingVertical: spacing.xxs,
		paddingHorizontal: spacing.s,
		borderRadius: borderRadius.s,
		borderColor: colors.whiteAlpha70,
		borderWidth: 1,
	},
	retryTextSmall: { color: colors.white, fontSize: typography.fontSizes.xs },
});

export default WalletPaymentsScreen;
