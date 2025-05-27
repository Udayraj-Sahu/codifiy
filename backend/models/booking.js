console.log("<<<<< LOADING bookingModel.js - VERSION XYZ >>>>>"); // Or your latest version marker
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		bike: {
			type: Schema.Types.ObjectId,
			ref: "Bike",
			required: true,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			enum: [
				"pending_payment",
				"confirmed",
				"active",
				"completed",
				"cancelled",
				"overdue",
			],
			default: "pending_payment",
		},
		paymentId: { type: String, sparse: true },
		razorpayOrderId: { type: String, sparse: true },
		razorpaySignature: { type: String, sparse: true },
		originalAmount: { type: Number, required: true, min: 0 },
		appliedPromoCode: {
			type: Schema.Types.ObjectId,
			ref: "PromoCode",
			default: null,
		},
		discountAmount: { type: Number, default: 0, min: 0 },
		taxesAndFees: { type: Number, default: 0 },
		finalAmount: { type: Number, required: true, min: 0 },
		actualStartTime: { type: Date },
		actualEndTime: { type: Date },
		overtimeCharges: { type: Number, default: 0, min: 0 },
		endRidePhotoUrl: { type: String, trim: true },
		bookingReference: {
			// Your required field
			type: String,
			unique: true,
			required: true,
			trim: true,
		},
	},
	{ timestamps: true }
);
// Indexes for common queries
bookingSchema.pre("save", function (next) {
	console.log("********************************************");
	console.log(
		"MINIMAL PRE-SAVE HOOK FOR BOOKING IS FIRING! (bookingModel.js)"
	);
	console.log("Document isNew:", this.isNew);
	console.log("Current bookingReference:", this.bookingReference);
	console.log("********************************************");
	if (this.isNew) {
		// Only set if it's a new document and not already set
		this.bookingReference = "HOOK_WORKED_" + Date.now(); // Force a value
	}
	next();
});

// Indexes (keep these)
bookingSchema.index({ user: 1, status: 1, createdAt: -1 });
bookingSchema.index({ bike: 1, startTime: 1, endTime: 1 });
// bookingSchema.index({ bookingReference: 1 }); // This is covered by unique:true on the field definition. Remove this to clear the duplicate index warning.

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
