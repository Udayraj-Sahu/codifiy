// backend/models/Wallet.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const walletSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Each user has one wallet
        index: true,
    },
    balance: {
        type: Number, // Store in smallest currency unit (e.g., paisa for INR)
        required: true,
        default: 0,
        min: 0, // Balance cannot be negative through direct updates
    },
    currency: {
        type: String,
        required: true,
        default: 'INR',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // You might add other fields like daily transaction limits, etc.
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;