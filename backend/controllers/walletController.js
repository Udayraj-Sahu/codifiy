// backend/controllers/walletController.js
const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto"); // For signature verification

const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User"); // To ensure user exists

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Helper function to get or create a wallet for a user
 * @param   userId - The ID of the user
 * @param   session - Optional Mongoose session for transactions
 * @returns Wallet document
 */
const getOrCreateWalletForUser = async (userId, session = null) => {
	let wallet = await Wallet.findOne({ user: userId }).session(session);
	if (!wallet) {
		console.warn(
			`CRITICAL: Wallet not found for user ${userId} during getOrCreate. Attempting to create.`
		);
		const userExists = await User.findById(userId).lean().session(session);
		if (!userExists) {
			throw new Error("User does not exist, cannot create wallet.");
		}
		wallet = new Wallet({ user: userId, balance: 0, currency: "INR" });
		try {
			await wallet.save({ session });
			console.log(`Wallet created on-demand for user ${userId}.`);
		} catch (createError) {
			// If it still fails with a duplicate error here, it's a race condition
			if (createError.code === 11000) {
				// E11000
				console.warn(
					`Race condition: Wallet for ${userId} was created by another process. Fetching it.`
				);
				wallet = await Wallet.findOne({ user: userId }).session(
					session
				);
				if (!wallet)
					throw new Error(
						`Failed to create or find wallet for user ${userId} after race condition.`
					);
			} else {
				throw createError;
			}
		}
	}
	return wallet;
};

/**
 * @desc    Get current user's wallet details
 * @route   GET /api/wallet/me
 * @access  Private
 */
exports.getUserWallet = asyncHandler(async (req, res) => {
	console.log("--- walletController: getUserWallet ---");
	const wallet = await getOrCreateWalletForUser(req.user.id);
	res.status(200).json({ success: true, data: wallet });
});

/**
 * @desc    Initiate adding money to wallet (creates a Razorpay payment order)
 * @route   POST /api/wallet/me/add-money/initiate
 * @access  Private
 */
exports.initiateAddMoneyToWallet = asyncHandler(async (req, res) => {
	console.log("--- walletController: initiateAddMoneyToWallet ---");
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}

	const { amount, currency = "INR" } = req.body; // Amount from frontend is in primary currency unit (e.g., 100 for ₹100)
	const userId = req.user.id;

	const amountInPaisa = Math.round(parseFloat(amount) * 100); // Convert to smallest unit for Razorpay

	if (isNaN(amountInPaisa) || amountInPaisa <= 5000) {
		// Razorpay minimum is typically ₹1, let's enforce a higher minimum for sanity like ₹50
		res.status(400);
		throw new Error("Invalid amount. Minimum amount to add is ₹50.");
	}

	const options = {
		amount: amountInPaisa,
		currency: currency,
		receipt: `rcpt_${userId.toString().substring(0, 8)}_${Date.now()
			.toString()
			.slice(-8)}`,
		payment_capture: 1, // Auto capture payment
		notes: {
			userId: userId.toString(),
			purpose: "Add money to Bikya wallet",
		},
	};

	try {
		const order = await razorpayInstance.orders.create(options);
		if (!order) {
			res.status(500);
			throw new Error(
				"Razorpay order creation failed. Please try again."
			);
		}

		// OPTIONAL: Create a 'pending' Transaction record here if you want to track the initiation.
		// This helps if users drop off and you want to see initiated but uncompleted attempts.
		// const wallet = await getOrCreateWalletForUser(userId);
		// const pendingTransaction = new Transaction({
		//     user: userId,
		//     wallet: wallet._id,
		//     type: 'credit',
		//     amount: amountInPaisa,
		//     balanceBefore: wallet.balance,
		//     balanceAfter: wallet.balance, // Not updated yet
		//     currency: currency,
		//     status: 'pending',
		//     description: `Attempting to add ₹${amount} to wallet`,
		//     paymentGateway: 'razorpay',
		//     razorpayOrderId: order.id,
		// });
		// await pendingTransaction.save();

		res.status(201).json({
			success: true,
			data: {
				razorpayKeyId: process.env.RAZORPAY_KEY_ID,
				razorpayOrderId: order.id,
				amount: order.amount, // Amount in paisa
				currency: order.currency,
				// transactionId: pendingTransaction?._id.toString() // if you created one
			},
		});
	} catch (error) {
		console.error("Razorpay order creation error in controller:", error);
		res.status(500);
		// Check if error from Razorpay has details
		const rzpErrorMessage =
			error.error?.description ||
			error.message ||
			"Payment gateway error.";
		throw new Error(`Failed to create payment order: ${rzpErrorMessage}`);
	}
});

/**
 * @desc    Verify payment from Razorpay and credit wallet
 * @route   POST /api/wallet/me/add-money/verify
 * @access  Private
 */
exports.verifyAddMoneyPayment = asyncHandler(async (req, res) => {
	console.log("--- walletController: verifyAddMoneyPayment ---");
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ success: false, errors: errors.array() });
	}

	const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
		req.body;
	const userId = req.user.id;

	// Step 1: Verify Razorpay Signature
	const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;
	const expectedSignature = crypto
		.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
		.update(bodyToSign.toString())
		.digest("hex");

	if (expectedSignature !== razorpay_signature) {
		res.status(400);
		throw new Error("Payment verification failed: Invalid signature.");
	}

	// Step 2: Fetch order details from Razorpay to confirm amount and status
	let razorpayOrderDetails;
	try {
		razorpayOrderDetails = await razorpayInstance.orders.fetch(
			razorpay_order_id
		);
		if (!razorpayOrderDetails) {
			res.status(404);
			throw new Error("Razorpay order not found.");
		}
		// Ensure order status is 'paid' or 'attempted' if capture is manual later
		// For payment_capture: 1, status should be 'paid'
		if (razorpayOrderDetails.status !== "paid") {
			// You might also want to check razorpayOrderDetails.amount_paid
			console.warn(
				`Razorpay order ${razorpay_order_id} status is ${razorpayOrderDetails.status}, expected 'paid'. Amount paid: ${razorpayOrderDetails.amount_paid}`
			);
			// Depending on strictness, you might allow if amount_paid matches amount, even if status is 'attempted'
			// For this example, we'll be strict on 'paid'.
			if (
				razorpayOrderDetails.amount_paid !== razorpayOrderDetails.amount
			) {
				res.status(400);
				throw new Error(
					`Payment not fully completed for order ${razorpay_order_id}. Amount paid mismatch.`
				);
			}
			// If status is not 'paid' but amount_paid matches amount, it might be an edge case or webhook delay.
			// For simplicity, we expect 'paid'. If not, consider it an issue.
			// You can also fetch payment details: await razorpayInstance.payments.fetch(razorpay_payment_id);
		}
	} catch (error) {
		console.error(
			"Error fetching Razorpay order details for verification:",
			error
		);
		res.status(500);
		throw new Error(
			"Failed to verify payment with gateway. " + error.message
		);
	}

	const amountCredited = razorpayOrderDetails.amount; // Amount in paisa from Razorpay order
	const currency = razorpayOrderDetails.currency;

	// Step 3: Check if this payment has already been processed to prevent double-crediting
	const existingTransaction = await Transaction.findOne({
		paymentGateway: "razorpay",
		paymentGatewayTransactionId: razorpay_payment_id,
		status: "successful",
	});

	if (existingTransaction) {
		console.log(
			`Payment ${razorpay_payment_id} already processed and credited for transaction ${existingTransaction._id}.`
		);
		const wallet = await Wallet.findOne({ user: userId }); // Get current balance
		return res.status(200).json({
			success: true,
			data: {
				message: "Money already added to wallet for this payment.",
				updatedBalance: wallet ? wallet.balance : 0,
				transactionId: existingTransaction._id,
			},
		});
	}

	// Step 4: Update wallet and create transaction using Mongoose session for atomicity
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const wallet = await getOrCreateWalletForUser(userId, session); // Ensure wallet is fetched/created within session

		const balanceBefore = wallet.balance;
		wallet.balance += amountCredited;
		const balanceAfter = wallet.balance;

		await wallet.save({ session });

		const transaction = new Transaction({
			user: userId,
			wallet: wallet._id,
			type: "credit",
			amount: amountCredited,
			balanceBefore,
			balanceAfter,
			currency: currency,
			status: "successful",
			description: `Added ₹${(amountCredited / 100).toFixed(
				2
			)} to wallet`,
			paymentGateway: "razorpay",
			paymentGatewayTransactionId: razorpay_payment_id,
			razorpayOrderId: razorpay_order_id,
		});
		await transaction.save({ session });

		await session.commitTransaction();

		console.log(
			`Successfully credited ${amountCredited} ${currency} to wallet ${wallet._id} for user ${userId}. New balance: ${wallet.balance}. Transaction: ${transaction._id}`
		);
		res.status(200).json({
			success: true,
			data: {
				message: "Money added to wallet successfully.",
				updatedBalance: wallet.balance,
				transactionId: transaction._id,
			},
		});
	} catch (error) {
		await session.abortTransaction();
		console.error(
			"Error during wallet update or transaction logging after Razorpay verification:",
			error
		);
		res.status(500);
		// Provide a generic error to client, specific error is logged
		throw new Error(
			"Failed to update wallet after payment. Please contact support if amount was debited."
		);
	} finally {
		session.endSession();
	}
});

/**
 * @desc    Get user's wallet transactions (paginated)
 * @route   GET /api/wallet/me/transactions
 * @access  Private
 */
exports.getWalletTransactions = asyncHandler(async (req, res) => {
	console.log("--- walletController: getWalletTransactions ---");
	const userId = req.user.id;
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 transactions per page
	const skip = (page - 1) * limit;

	const wallet = await Wallet.findOne({ user: userId });
	if (!wallet) {
		return res.status(200).json({
			success: true,
			count: 0,
			total: 0,
			pagination: { currentPage: page, totalPages: 0, limit },
			data: [],
		});
	}

	const query = { user: userId, wallet: wallet._id };

	const transactions = await Transaction.find(query)
		.sort({ createdAt: -1 }) // Newest first
		.skip(skip)
		.limit(limit)
		.populate("relatedBooking", "bookingReference bike status") // Example population
		.lean();

	const totalTransactions = await Transaction.countDocuments(query);
	const totalPages = Math.ceil(totalTransactions / limit);

	res.status(200).json({
		success: true,
		count: transactions.length,
		total: totalTransactions,
		pagination: {
			currentPage: page,
			totalPages,
			limit,
		},
		data: transactions,
	});
});
