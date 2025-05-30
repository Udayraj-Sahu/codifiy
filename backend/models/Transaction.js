// backend/models/Transaction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    user: { // User who owns the wallet
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
        index: true,
    },
    type: { // 'credit' (add money, refund), 'debit' (payment for booking, fee)
        type: String,
        required: true,
        enum: ['credit', 'debit'],
    },
    amount: { // Always positive, type determines if it's added or subtracted
        type: Number,
        required: true,
        min: 0, // Amount should be positive
    },
    balanceBefore: { // Wallet balance before this transaction
        type: Number,
        required: true,
    },
    balanceAfter: { // Wallet balance after this transaction
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'INR',
    },
    status: { // Status of the transaction
        type: String,
        required: true,
        enum: ['pending', 'successful', 'failed', 'cancelled', 'refunded'],
        default: 'pending',
    },
    description: { // e.g., "Added to wallet via Card", "Payment for Booking #B123"
        type: String,
        trim: true,
        required: true,
    },
    paymentGateway: {
        type: String, // e.g., 'razorpay', 'stripe'
        required: false,
    },
    paymentGatewayTransactionId: { // From Razorpay, Stripe, etc.
        type: String,
        trim: true,
        index: true,
        sparse: true, // Allows nulls if not a gateway transaction
    },
    razorpayOrderId: { // If initiated via Razorpay for adding funds
        type: String,
        trim: true,
    },
    relatedBooking: { // If transaction is for a booking payment/refund
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: false,
    },
    metadata: { // Any other relevant details
        type: Object,
    }
}, { timestamps: true }); // Uses createdAt for transaction date

transactionSchema.index({ user: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;