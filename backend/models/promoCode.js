const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promoCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true, // Ensures promo code is stored in uppercase
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixedAmount'] // Can only be one of these values
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0 // Discount value cannot be negative
    },
    minBookingValue: { // Minimum booking amount for the promo to be applicable
        type: Number,
        default: 0
    },
    maxDiscountAmount: { // For percentage discounts, a cap on the discount amount
        type: Number,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true,
        default: Date.now
    },
    validTill: {
        type: Date,
        required: true
    },
    maxUsageCount: { // Total times this promo can be used across all users
        type: Number,
        required: true,
        min: 1
    },
    userMaxUsageCount: { // How many times a single user can use this promo
        type: Number,
        default: 1,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableTo: {
        type: { // e.g., 'allUsers', 'firstRideOnly', 'specificBikeCategories', 'specificUsers'
            type: String,
            required: true,
            enum: ['allUsers', 'firstRideOnly', 'specificBikeCategories', 'specificUsers']
        },
        bikeCategories: [{ // Applicable if type is 'specificBikeCategories'
            type: String // e.g., 'Scooter', 'Mountain Bike'
        }],
        users: [{ // Applicable if type is 'specificUsers'
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    createdBy: { // To track who created the promo code (Admin/Owner)
        type: Schema.Types.ObjectId,
        ref: 'User' // Assuming your User model is named 'User'
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Index for frequently queried fields
promoCodeSchema.index({ code: 1, isActive: 1, validTill: 1 });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
module.exports = PromoCode;