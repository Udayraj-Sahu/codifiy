// backend/routes/walletRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { body, param } = require('express-validator'); // For validation
const {
    getUserWallet,
    initiateAddMoneyToWallet,
    verifyAddMoneyPayment,
    getWalletTransactions,
} = require('../controllers/walletController');

// GET current user's wallet details
// GET /api/wallet/me
router.get('/me', protect, getUserWallet);

// POST to initiate adding money to wallet (creates a payment order)
// POST /api/wallet/me/add-money/initiate
router.post(
    '/me/add-money/initiate',
    [
        protect,
        body('amount')
            .notEmpty().withMessage('Amount is required.')
            .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
            // .toFloat(), // Convert to float after validation
        body('currency').optional().isString().toUpperCase().isIn(['INR']) // Example currency validation
            .withMessage('Unsupported currency. Only INR is supported for now.'),
    ],
    initiateAddMoneyToWallet
);

// POST to verify payment and credit wallet
// POST /api/wallet/me/add-money/verify
router.post(
    '/me/add-money/verify',
    [
        protect,
        body('razorpay_payment_id').notEmpty().isString().withMessage('Razorpay payment ID is required.'),
        body('razorpay_order_id').notEmpty().isString().withMessage('Razorpay order ID is required.'),
        body('razorpay_signature').notEmpty().isString().withMessage('Razorpay signature is required.'),
        // body('transactionId').optional().isMongoId().withMessage('Valid pending transaction ID format required.'), // If you create a pending transaction record first
    ],
    verifyAddMoneyPayment
);

// GET user's wallet transactions (paginated)
// GET /api/wallet/me/transactions
router.get(
    '/me/transactions',
    [
        protect,
        // Optional query validations for pagination
        param('page').optional().isInt({ min: 1 }).toInt(),
        param('limit').optional().isInt({ min: 1, max: 50 }).toInt(), // Max 50 per page
    ],
    getWalletTransactions
);

module.exports = router;