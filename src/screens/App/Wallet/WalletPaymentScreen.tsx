// src/screens/App/Wallet/WalletPaymentsScreen.tsx
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import PrimaryButton from "../../../components/common/PrimaryButton"; // Adjust path
import { WalletStackParamList } from "../../../navigation/types"; // Adjust path
import { borderRadius, colors, spacing, typography } from "../../../theme"; // Adjust path
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Example for icons

// --- Types and Dummy Data ---
interface Transaction {
	id: string;
	type: string; // e.g., "Wallet Top-up", "Payment for Booking #1234"
	dateTime: string; // e.g., "Today, 2:30 PM" or "May 25, 2025"
	amount: string; // e.g., "+₹500", "-₹250"
	amountColor: string; // 'green' for credit, 'red' for debit
	statusIconPlaceholder: string; // '✓', '✕', '⏳'
}

interface PaymentMethod {
	id: string;
	type: "Visa" | "Mastercard" | "UPI" | "Other"; // Example types
	iconPlaceholder?: string; // For card logos
	last4: string;
	expiry?: string; // e.g., "08/28"
	name?: string; // e.g., 'My Bank UPI'
}

const DUMMY_BALANCE = "₹1,250.00";
const DUMMY_TRANSACTIONS: Transaction[] = [
	{
		id: "t1",
		type: "Wallet Top-up",
		dateTime: "Today, 2:30 PM",
		amount: "+₹500",
		amountColor: colors.success || "green",
		statusIconPlaceholder: "✓",
	},
	{
		id: "t2",
		type: "Payment for Booking #BKY123",
		dateTime: "Yesterday, 10:15 AM",
		amount: "-₹250",
		amountColor: colors.error || "red",
		statusIconPlaceholder: "✓",
	},
	{
		id: "t3",
		type: "Refund for Booking #BKY098",
		dateTime: "May 23, 2025",
		amount: "+₹180",
		amountColor: colors.success || "green",
		statusIconPlaceholder: "✓",
	},
	{
		id: "t4",
		type: "Pending Ride Authorization",
		dateTime: "Just Now",
		amount: "-₹180",
		amountColor: colors.warning || "orange",
		statusIconPlaceholder: "⏳",
	},
];
const DUMMY_PAYMENT_METHODS: PaymentMethod[] = [
	{
		id: "pm1",
		type: "Visa",
		last4: "1234",
		expiry: "08/28",
		iconPlaceholder: "💳",
	},
	{
		id: "pm2",
		type: "Mastercard",
		last4: "5678",
		expiry: "11/26",
		iconPlaceholder: "💳",
	},
];
// --- End Dummy Data ---

// --- Reusable Components (Inline for brevity) ---
interface QuickActionProps {
	label: string;
	iconPlaceholder: string;
	onPress: () => void;
}
const QuickActionButton: React.FC<QuickActionProps> = ({
	label,
	iconPlaceholder,
	onPress,
}) => (
	<TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
		<View style={styles.quickActionIconContainer}>
			<Text style={styles.quickActionIcon}>{iconPlaceholder}</Text>
		</View>
		<Text style={styles.quickActionLabel}>{label}</Text>
	</TouchableOpacity>
);

interface TransactionItemProps {
	item: Transaction;
	onPress: () => void;
}
const TransactionItem: React.FC<TransactionItemProps> = ({ item, onPress }) => (
	<TouchableOpacity
		style={styles.transactionItemCard}
		onPress={onPress}
		activeOpacity={0.7}>
		<Text style={styles.transactionStatusIcon}>
			{item.statusIconPlaceholder}
		</Text>
		<View style={styles.transactionDetails}>
			<Text style={styles.transactionType} numberOfLines={1}>
				{item.type}
			</Text>
			<Text style={styles.transactionDateTime}>{item.dateTime}</Text>
		</View>
		<Text style={[styles.transactionAmount, { color: item.amountColor }]}>
			{item.amount}
		</Text>
	</TouchableOpacity>
);

interface PaymentMethodItemProps {
	item: PaymentMethod;
	onPress?: () => void;
} // onPress for future "Manage"
const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
	item,
	onPress,
}) => (
	<View style={styles.paymentMethodCard}>
		<Text style={styles.paymentMethodIcon}>
			{item.iconPlaceholder || "💳"}
		</Text>
		<View style={styles.paymentMethodDetails}>
			<Text style={styles.paymentMethodType}>
				{item.type} •••• {item.last4}
			</Text>
			{item.expiry && (
				<Text style={styles.paymentMethodExpiry}>
					Expires: {item.expiry}
				</Text>
			)}
		</View>
		{/* <TouchableOpacity onPress={onPress}><Text>Manage</Text></TouchableOpacity> */}
	</View>
);
// --- End Reusable ---

type WalletScreenNavigationProp = StackNavigationProp<
	WalletStackParamList,
	"WalletPaymentsScreen"
>;

interface WalletPaymentsScreenProps {
	navigation: WalletScreenNavigationProp;
}

const WalletPaymentsScreen: React.FC<WalletPaymentsScreenProps> = ({
	navigation,
}) => {
	const [balance, setBalance] = useState(DUMMY_BALANCE);
	const [recentTransactions, setRecentTransactions] = useState(
		DUMMY_TRANSACTIONS.slice(0, 3)
	); // Show initial few
	const [paymentMethods, setPaymentMethods] = useState(DUMMY_PAYMENT_METHODS);

	// The header with "Wallet & Payments" and back arrow is handled by WalletStackNavigator
	// using customStackScreenOptions.

	const handleAddMoney = () => navigation.navigate("AddMoneyScreen");
	const handleSendMoney = () => Alert.alert("Action", "Send Money Pressed");
	const handleRequestMoney = () =>
		Alert.alert("Action", "Request Money Pressed");
	const handleViewTransactionHistory = () =>
		navigation.navigate("TransactionHistoryScreen");
	const handleAddPaymentMethod = () =>
		navigation.navigate("AddPaymentMethodScreen");
	const handleContactSupport = () =>
		Alert.alert("Support", "Contact Support Pressed");

	return (
		<ScrollView
			style={styles.screenContainer}
			contentContainerStyle={styles.scrollContentContainer}>
			{/* Wallet Balance Section */}
			<View style={styles.balanceSection}>
				<Text style={styles.availableBalanceLabel}>
					Available Balance
				</Text>
				<Text style={styles.balanceAmount}>{balance}</Text>
				<PrimaryButton
					title="Add Money"
					onPress={handleAddMoney}
					style={styles.addMoneyButton}
					// iconLeft={<Text style={{color: colors.white, marginRight: spacing.s, fontSize: 18}}>+</Text>}
				/>
			</View>

			{/* Quick Actions */}
			<View style={styles.quickActionsContainer}>
				<QuickActionButton
					label="Send Money"
					iconPlaceholder="💸"
					onPress={handleSendMoney}
				/>
				<QuickActionButton
					label="Request Money"
					iconPlaceholder="📨"
					onPress={handleRequestMoney}
				/>
				<QuickActionButton
					label="History"
					iconPlaceholder="📜"
					onPress={handleViewTransactionHistory}
				/>
			</View>

			{/* Recent Transactions */}
			<View style={styles.sectionCard}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Recent Transactions</Text>
					<TouchableOpacity onPress={handleViewTransactionHistory}>
						<Text style={styles.viewAllLink}>View All</Text>
					</TouchableOpacity>
				</View>
				{recentTransactions.map((item) => (
					<TransactionItem
						key={item.id}
						item={item}
						onPress={() => console.log("View tx:", item.id)}
					/>
				))}
			</View>

			{/* Payment Methods */}
			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Payment Methods</Text>
				{paymentMethods.map((item) => (
					<PaymentMethodItem key={item.id} item={item} />
				))}
				<TouchableOpacity
					style={styles.addPaymentButton}
					onPress={handleAddPaymentMethod}>
					<Text style={styles.addPaymentButtonIcon}>+</Text>
					<Text style={styles.addPaymentButtonText}>
						Add Payment Method
					</Text>
				</TouchableOpacity>
			</View>

			{/* Support Section */}
			<View style={styles.supportSection}>
				<Text style={styles.supportText}>
					Need Help? Contact our support team
				</Text>
				<TouchableOpacity
					style={styles.contactSupportButton}
					onPress={handleContactSupport}>
					<Text style={styles.contactSupportButtonText}>
						Contact Support
					</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screenContainer: {
		flex: 1,
		backgroundColor: colors.backgroundLight || "#F7F9FC",
	},
	scrollContentContainer: { paddingBottom: spacing.xl },
	balanceSection: {
		backgroundColor: colors.white,
		padding: spacing.l,
		alignItems: "center",
		borderBottomLeftRadius: borderRadius.xl,
		borderBottomRightRadius: borderRadius.xl,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 3,
		marginBottom: spacing.m,
	},
	availableBalanceLabel: {
		fontSize: typography.fontSizes.m,
		color: colors.textSecondary,
		marginBottom: spacing.xs,
	},
	balanceAmount: {
		fontSize: typography.fontSizes.xxxl + 4,
		fontWeight: typography.fontWeights.bold,
		color: colors.textPrimary,
		marginBottom: spacing.l,
	},
	addMoneyButton: {
		backgroundColor: colors.primary,
		paddingHorizontal: spacing.xl,
	}, // Green button

	quickActionsContainer: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: spacing.m,
		paddingHorizontal: spacing.s,
		backgroundColor: colors.white,
		marginHorizontal: spacing.m,
		borderRadius: borderRadius.l,
		marginBottom: spacing.m,
		elevation: 2,
	},
	quickActionButton: { alignItems: "center", flex: 1 },
	quickActionIconContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: colors.primaryLight || "#E6F7FF",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.xs,
	},
	quickActionIcon: { fontSize: 22, color: colors.primary },
	quickActionLabel: {
		fontSize: typography.fontSizes.s,
		color: colors.textMedium,
		fontWeight: typography.fontWeights.medium,
	},

	sectionCard: {
		backgroundColor: colors.white,
		borderRadius: borderRadius.l,
		padding: spacing.m,
		marginHorizontal: spacing.m,
		marginBottom: spacing.m,
		elevation: 2,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
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
		fontWeight: typography.fontWeights.medium,
	},

	transactionItemCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	// Last item should remove borderBottomWidth if preferred styles.transactionItemCardLast: { borderBottomWidth: 0 },
	transactionStatusIcon: {
		fontSize: 18,
		marginRight: spacing.m,
		width: 20,
		textAlign: "center",
	},
	transactionDetails: { flex: 1, marginRight: spacing.s },
	transactionType: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	transactionDateTime: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginTop: spacing.xxs,
	},
	transactionAmount: {
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.bold,
	},

	paymentMethodCard: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: spacing.m,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.borderDefault || "#EEE",
	},
	paymentMethodIcon: {
		fontSize: 24,
		marginRight: spacing.m,
		color: colors.textPrimary,
		width: 30,
		textAlign: "center",
	}, // Placeholder size
	paymentMethodDetails: { flex: 1 },
	paymentMethodType: {
		fontSize: typography.fontSizes.m,
		color: colors.textPrimary,
		fontWeight: typography.fontWeights.medium,
	},
	paymentMethodExpiry: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
	},
	addPaymentButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: spacing.m,
		marginTop: spacing.s,
		borderRadius: borderRadius.m,
		borderWidth: 1.5,
		borderColor: colors.primary,
		borderStyle: "dashed",
	},
	addPaymentButtonIcon: {
		fontSize: typography.fontSizes.l,
		color: colors.primary,
		marginRight: spacing.s,
		fontWeight: "bold",
	},
	addPaymentButtonText: {
		fontSize: typography.fontSizes.m,
		color: colors.primary,
		fontWeight: typography.fontWeights.semiBold,
	},

	supportSection: {
		alignItems: "center",
		padding: spacing.l,
		backgroundColor: colors.white,
		marginHorizontal: spacing.m,
		borderRadius: borderRadius.l,
		marginTop: spacing.m,
		elevation: 2,
	},
	supportText: {
		fontSize: typography.fontSizes.s,
		color: colors.textSecondary,
		marginBottom: spacing.m,
		textAlign: "center",
	},
	contactSupportButton: {
		paddingVertical: spacing.s + 2,
		paddingHorizontal: spacing.xl,
		borderRadius: borderRadius.pill,
		borderWidth: 1.5,
		borderColor: colors.primary,
	},
	contactSupportButtonText: {
		color: colors.primary,
		fontSize: typography.fontSizes.m,
		fontWeight: typography.fontWeights.semiBold,
	},
});

export default WalletPaymentsScreen;
