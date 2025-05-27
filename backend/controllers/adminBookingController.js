const mongoose = require("mongoose");
const Booking = require("../models/booking"); // Adjust path to your booking model
const User = require("../models/User"); // Adjust path to your user model
const Bike = require("../models/Bike"); // Adjust path to your bike model
const PromoCode = require("../models/promoCode"); // Adjust path to your promo code model

// asyncHandler utility to catch errors from async functions
const asyncHandler = (fn) => (req, res, next) =>
	Promise.resolve(fn(req, res, next)).catch(next);

/**
 * @desc    Get all bookings (Admin View)
 * @route   GET /api/admin/bookings
 * @access  Private (Admin/Owner)
 */
exports.getAllBookings = asyncHandler(async (req, res, next) => {
	const {
		page = 1,
		limit = 10,
		status,
		userId,
		bikeId,
		startDate,
		endDate,
		sortBy = "createdAt:desc", // Default sort
		bookingReference,
		paymentId,
	} = req.query;

	const query = {};

	if (status) query.status = status;
	if (userId && mongoose.Types.ObjectId.isValid(userId)) query.user = userId;
	if (bikeId && mongoose.Types.ObjectId.isValid(bikeId)) query.bike = bikeId;
	if (bookingReference)
		query.bookingReference = { $regex: bookingReference, $options: "i" };
	if (paymentId) query.paymentId = { $regex: paymentId, $options: "i" };

	if (startDate && endDate) {
		query.startTime = {
			$gte: new Date(startDate),
			$lte: new Date(endDate),
		};
	} else if (startDate) {
		query.startTime = { $gte: new Date(startDate) };
	} else if (endDate) {
		query.startTime = { $lte: new Date(endDate) };
	}

	const sortParams = {};
	if (sortBy) {
		const parts = sortBy.split(":");
		sortParams[parts[0]] = parts[1] === "desc" ? -1 : 1;
	}

	const options = {
		page: parseInt(page, 10),
		limit: parseInt(limit, 10),
		sort: sortParams,
		populate: [
			{ path: "user", select: "fullName email phone" }, // Select specific user fields
			{ path: "bike", select: "name model category" }, // Select specific bike fields
		],
	};

	// Using mongoose-paginate-v2 style if available, or a manual approach:
	// Manual approach for pagination:
	const totalBookings = await Booking.countDocuments(query);
	const bookings = await Booking.find(query)
		.populate(options.populate)
		.sort(options.sort)
		.skip((options.page - 1) * options.limit)
		.limit(options.limit);

	res.status(200).json({
		success: true,
		count: bookings.length,
		total: totalBookings,
		pagination: {
			currentPage: options.page,
			totalPages: Math.ceil(totalBookings / options.limit),
			limit: options.limit,
		},
		data: bookings,
	});
});

/**
 * @desc    Get specific booking details (Admin View)
 * @route   GET /api/admin/bookings/:bookingId
 * @access  Private (Admin/Owner)
 */
exports.getBookingById = asyncHandler(async (req, res, next) => {
	const { bookingId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(bookingId)) {
		res.status(400);
		throw new Error("Invalid Booking ID format.");
	}

	const booking = await Booking.findById(bookingId)
		.populate("user", "-password") // Populate user details, exclude password
		.populate("bike")
		.populate("appliedPromoCode"); // Populate promo code details if applied

	if (!booking) {
		res.status(404);
		throw new Error("Booking not found.");
	}

	res.status(200).json({
		success: true,
		data: booking,
	});
});

/**
 * @desc    Update booking status (Admin Intervention)
 * @route   PUT /api/admin/bookings/:bookingId/status
 * @access  Private (Admin/Owner)
 */
exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
	const { bookingId } = req.params;
	const { status, reason } = req.body; // `reason` is optional for logging the change

	if (!mongoose.Types.ObjectId.isValid(bookingId)) {
		res.status(400);
		throw new Error("Invalid Booking ID format.");
	}

	if (!status) {
		res.status(400);
		throw new Error("New status is required.");
	}

	// Validate the status against the schema's enum values
	const allowedStatuses = Booking.schema.path("status").enumValues;
	if (!allowedStatuses.includes(status)) {
		res.status(400);
		throw new Error(
			`Invalid status value. Allowed statuses are: ${allowedStatuses.join(
				", "
			)}.`
		);
	}

	const booking = await Booking.findById(bookingId)
		.populate("user")
		.populate("bike");
	if (!booking) {
		res.status(404);
		throw new Error("Booking not found.");
	}

	const oldStatus = booking.status;
	booking.status = status;

	// --- CRITICAL: Implement Business Logic for Status Changes ---
	// The following are conceptual placeholders. You MUST define the actual business rules.
	console.log(
		`Admin ${req.user.id} attempting to change booking ${
			booking._id
		} status from ${oldStatus} to ${status}. Reason: ${
			reason || "Not provided"
		}`
	);

	if (oldStatus !== status) {
		// Example: If admin cancels a confirmed booking
		if (
			status === "cancelled" &&
			(oldStatus === "confirmed" ||
				oldStatus === "active" ||
				oldStatus === "pending_payment")
		) {
			// 1. Process Refund?
			//    - Check if payment was made (booking.paymentId exists).
			//    - Call Razorpay refund API if applicable (this is a complex operation).
			//    - `await razorpayInstance.payments.refund(booking.paymentId, { amount: booking.finalAmount * 100 /* or partial */, speed: 'optimum' });`
			//    - Handle potential refund failures.
			console.warn(
				`TODO: Process refund for booking ${booking._id} if applicable.`
			);

			// 2. Revert Promo Code Usage?
			//    if (booking.appliedPromoCode) {
			//        await PromoCode.findByIdAndUpdate(booking.appliedPromoCode, { $inc: { usedCount: -1 } });
			//        console.warn(`TODO: Decremented usage for promo ${booking.appliedPromoCode} on booking ${booking._id}. Ensure this is correct.`);
			//    }

			// 3. Update Bike Availability? (e.g., if it was marked as 'rented' implicitly)
			//    - This depends on how you manage bike availability.
			//    console.warn(`TODO: Update bike ${booking.bike._id} availability if necessary.`);
		}

		// Example: If admin manually confirms a booking
		if (status === "confirmed" && oldStatus === "pending_payment") {
			// 1. Update Promo Code Usage (if not already done)
			//    if (booking.appliedPromoCode) {
			//        const promo = await PromoCode.findById(booking.appliedPromoCode);
			//        // Check if promo is still valid before incrementing (or if payment was made)
			//        if (promo && promo.usedCount < promo.maxUsageCount) {
			//             await PromoCode.findByIdAndUpdate(booking.appliedPromoCode, { $inc: { usedCount: 1 } });
			//        }
			//    }
			console.warn(
				`TODO: Ensure promo code usage is correctly handled for manual confirmation of booking ${booking._id}.`
			);
		}

		// Add a log entry for the admin action (consider a separate audit log collection)
		// booking.adminActionsLog.push({ adminId: req.user.id, action: `Status changed from ${oldStatus} to ${status}`, reason, timestamp: new Date() });
	}
	// --- End Critical Business Logic Section ---

	const updatedBooking = await booking.save();

	// Trigger notifications to the user about the admin-initiated status change
	// sendAdminBookingStatusChangeNotification(booking.user, updatedBooking, oldStatus, reason); // Conceptual

	res.status(200).json({
		success: true,
		message: `Booking status updated to '${status}'.`,
		data: updatedBooking,
	});
});
