const mongoose = require("mongoose");

const PromoCode = require("../models/promoCode"); // Adjust path to your promo code model
const Booking = require("../models/booking"); // Adjust path to your booking model
const User = require("../models/User"); // Adjust path to your user model
const Bike = require("../models/Bike"); // Adjust path to your bike model (for category-specific promos)

// asyncHandler utility to catch errors from async functions
const asyncHandler = (fn) => (req, res, next) =>
	Promise.resolve(fn(req, res, next)).catch(next);

// --- Admin Controllers ---

/**
 * @desc    Create a new promo code
 * @route   POST /api/promocodes
 * @access  Private (Admin/Owner) - Assuming role check middleware is applied to the route
 */
exports.createPromoCode = asyncHandler(async (req, res, next) => {
	const {
		code,
		description,
		discountType,
		discountValue,
		minBookingValue,
		maxDiscountAmount,
		validFrom,
		validTill,
		maxUsageCount,
		userMaxUsageCount,
		isActive,
		applicableTo, // { type: 'allUsers' | 'firstRideOnly' | 'specificBikeCategories' | 'specificUsers', bikeCategories: [], users: [] }
	} = req.body;

	const createdBy = req.user.id; // Assuming req.user is populated by auth middleware

	// Basic Validations
	if (
		!code ||
		!description ||
		!discountType ||
		!discountValue ||
		!validTill ||
		!maxUsageCount
	) {
		res.status(400);
		throw new Error("Missing required fields for promo code creation.");
	}
	if (new Date(validTill) < new Date(validFrom || Date.now())) {
		res.status(400);
		throw new Error(
			"validTill date must be after validFrom date (or current date if validFrom is not set)."
		);
	}

	const upperCaseCode = code.toUpperCase();
	const existingCode = await PromoCode.findOne({ code: upperCaseCode });
	if (existingCode) {
		res.status(400);
		throw new Error(
			`Promo code with code '${upperCaseCode}' already exists.`
		);
	}

	const promoCode = new PromoCode({
		code: upperCaseCode,
		description,
		discountType,
		discountValue,
		minBookingValue: minBookingValue || 0,
		maxDiscountAmount,
		validFrom: validFrom ? new Date(validFrom) : new Date(),
		validTill: new Date(validTill),
		maxUsageCount,
		userMaxUsageCount: userMaxUsageCount || 1,
		isActive: isActive !== undefined ? isActive : true,
		applicableTo: applicableTo || { type: "allUsers" },
		createdBy,
	});

	const createdPromoCode = await promoCode.save();
	res.status(201).json({ success: true, data: createdPromoCode });
});

/**
 * @desc    Get all promo codes (Admin view)
 * @route   GET /api/promocodes
 * @access  Private (Admin/Owner)
 */
exports.getAllPromoCodes = asyncHandler(async (req, res, next) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 20;
	const skip = (page - 1) * limit;

	const filter = {};
	if (req.query.isActive) {
		filter.isActive = req.query.isActive === "true";
	}
	if (req.query.code) {
		filter.code = { $regex: req.query.code, $options: "i" };
	}

	const promoCodes = await PromoCode.find(filter)
		.populate("createdBy", "name email")
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit);

	const totalPromoCodes = await PromoCode.countDocuments(filter);

	res.status(200).json({
		success: true,
		count: promoCodes.length,
		total: totalPromoCodes,
		pagination: {
			currentPage: page,
			totalPages: Math.ceil(totalPromoCodes / limit),
			limit,
		},
		data: promoCodes,
	});
});

/**
 * @desc    Get a single promo code by ID (Admin view)
 * @route   GET /api/promocodes/:promoCodeId
 * @access  Private (Admin/Owner)
 */
exports.getPromoCodeById = asyncHandler(async (req, res, next) => {
	const { promoCodeId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(promoCodeId)) {
		res.status(400);
		throw new Error("Invalid Promo Code ID format.");
	}

	const promoCode = await PromoCode.findById(promoCodeId).populate(
		"createdBy",
		"name email"
	);
	if (!promoCode) {
		res.status(404);
		throw new Error("Promo code not found.");
	}
	res.status(200).json({ success: true, data: promoCode });
});

/**
 * @desc    Update a promo code
 * @route   PUT /api/promocodes/:promoCodeId
 * @access  Private (Admin/Owner)
 */
exports.updatePromoCode = asyncHandler(async (req, res, next) => {
	const { promoCodeId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(promoCodeId)) {
		res.status(400);
		throw new Error("Invalid Promo Code ID format.");
	}

	let promoCode = await PromoCode.findById(promoCodeId);
	if (!promoCode) {
		res.status(404);
		throw new Error("Promo code not found.");
	}

	// Fields that can be updated by admin
	const {
		code,
		description,
		discountType,
		discountValue,
		minBookingValue,
		maxDiscountAmount,
		validFrom,
		validTill,
		maxUsageCount,
		userMaxUsageCount,
		isActive,
		applicableTo,
	} = req.body;

	if (code && code.toUpperCase() !== promoCode.code) {
		const existingCode = await PromoCode.findOne({
			code: code.toUpperCase(),
		});
		if (existingCode) {
			res.status(400);
			throw new Error(
				`Promo code with code '${code.toUpperCase()}' already exists.`
			);
		}
		promoCode.code = code.toUpperCase();
	}

	if (description !== undefined) promoCode.description = description;
	if (discountType !== undefined) promoCode.discountType = discountType;
	if (discountValue !== undefined) promoCode.discountValue = discountValue;
	if (minBookingValue !== undefined)
		promoCode.minBookingValue = minBookingValue;
	if (maxDiscountAmount !== undefined)
		promoCode.maxDiscountAmount = maxDiscountAmount;
	if (validFrom !== undefined) promoCode.validFrom = new Date(validFrom);
	if (validTill !== undefined) promoCode.validTill = new Date(validTill);
	if (maxUsageCount !== undefined) promoCode.maxUsageCount = maxUsageCount;
	if (userMaxUsageCount !== undefined)
		promoCode.userMaxUsageCount = userMaxUsageCount;
	if (isActive !== undefined) promoCode.isActive = isActive;
	if (applicableTo !== undefined) promoCode.applicableTo = applicableTo;

	if (promoCode.validTill < (promoCode.validFrom || Date.now())) {
		res.status(400);
		throw new Error("validTill date must be after validFrom date.");
	}

	const updatedPromoCode = await promoCode.save();
	res.status(200).json({ success: true, data: updatedPromoCode });
});

/**
 * @desc    Delete a promo code (soft delete by default)
 * @route   DELETE /api/promocodes/:promoCodeId
 * @access  Private (Admin/Owner)
 */
exports.deletePromoCode = asyncHandler(async (req, res, next) => {
	const { promoCodeId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(promoCodeId)) {
		res.status(400);
		throw new Error("Invalid Promo Code ID format.");
	}

	const promoCode = await PromoCode.findById(promoCodeId);
	if (!promoCode) {
		res.status(404);
		throw new Error("Promo code not found.");
	}

	// Soft delete by default: set isActive to false
	// This preserves the promo code for historical booking records.
	promoCode.isActive = false;
	await promoCode.save();
	res.status(200).json({
		success: true,
		message: "Promo code deactivated successfully.",
	});

	// // To implement hard delete (use with caution):
	// // await promoCode.remove();
	// // res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
});

// --- User Controllers ---

/**
 * @desc    Get available promo codes for the current user
 * @route   GET /api/promocodes/available
 * @access  Private (User) - Assuming auth middleware provides req.user
 */
exports.getAvailablePromoCodesForUser = asyncHandler(async (req, res, next) => {
	const userId = req.user.id;
	const now = new Date();

	const queryConditions = {
		isActive: true,
		validFrom: { $lte: now },
		validTill: { $gte: now },
		$expr: { $lt: ["$usedCount", "$maxUsageCount"] }, // Ensure overall usage is not exceeded
	};

	let potentialPromos = await PromoCode.find(queryConditions).select(
		"code description discountType discountValue applicableTo userMaxUsageCount minBookingValue maxDiscountAmount"
	); // Select only needed fields

	const userBookingsCount = await Booking.countDocuments({
		user: userId,
		status: "completed",
	});
	const userSpecificPromos = [];

	for (const promo of potentialPromos) {
		let isApplicable = true;

		// 1. Check user-specific usage count for this promo
		const userUsageForThisPromo = await Booking.countDocuments({
			user: userId,
			appliedPromoCode: promo._id,
			status: { $in: ["confirmed", "active", "completed"] },
		});
		if (userUsageForThisPromo >= promo.userMaxUsageCount) {
			isApplicable = false;
		}

		// 2. Check 'applicableTo' criteria
		if (isApplicable && promo.applicableTo) {
			switch (promo.applicableTo.type) {
				case "firstRideOnly":
					if (userBookingsCount > 0) isApplicable = false;
					break;
				case "specificUsers":
					if (
						!promo.applicableTo.users ||
						!promo.applicableTo.users.some((uid) =>
							uid.equals(userId)
						)
					) {
						isApplicable = false;
					}
					break;
				// 'specificBikeCategories' would typically be checked during 'apply' phase with bike context
				// but if we want to pre-filter here, we'd need more context or broader assumptions.
				// For now, leaving this to be fully validated at `applyPromoCode`.
			}
		}

		if (isApplicable) {
			// Return a simplified version or necessary details for display
			userSpecificPromos.push({
				code: promo.code,
				description: promo.description,
				discountType: promo.discountType,
				discountValue: promo.discountValue,
				minBookingValue: promo.minBookingValue,
				maxDiscountAmount: promo.maxDiscountAmount,
				// Add any other fields the UI needs to display "Available Offers"
			});
		}
	}

	res.status(200).json({ success: true, data: userSpecificPromos });
});

/**
 * @desc    Apply a promo code to a potential booking (validate and get discount)
 * @route   POST /api/promocodes/apply
 * @access  Private (User)
 */
exports.applyPromoCode = asyncHandler(async (req, res, next) => {
	const userId = req.user.id;
	const { code, bookingDetails } = req.body; // bookingDetails: { originalBookingAmount, bikeId (optional for category) }

	if (
		!code ||
		!bookingDetails ||
		bookingDetails.originalBookingAmount === undefined
	) {
		res.status(400);
		throw new Error(
			"Promo code and booking details (including originalBookingAmount) are required."
		);
	}
	const originalAmount = parseFloat(bookingDetails.originalBookingAmount);
	if (isNaN(originalAmount) || originalAmount < 0) {
		res.status(400);
		throw new Error("Invalid originalBookingAmount.");
	}

	const promo = await PromoCode.findOne({
		code: code.toUpperCase(),
		isActive: true,
	});
	if (!promo) {
		res.status(404);
		throw new Error("Invalid or inactive promo code.");
	}

	// --- Start Comprehensive Validation ---
	const now = new Date();
	let errorMessage = null;

	if (!(now >= promo.validFrom && now <= promo.validTill)) {
		errorMessage = "Promo code is expired or not yet active.";
	} else if (promo.usedCount >= promo.maxUsageCount) {
		errorMessage = "Promo code has reached its maximum usage limit.";
	} else if (originalAmount < promo.minBookingValue) {
		errorMessage = `Minimum booking value of ${promo.minBookingValue} is required for this promo.`;
	} else {
		const userUsageForThisPromo = await Booking.countDocuments({
			user: userId,
			appliedPromoCode: promo._id,
			status: { $in: ["confirmed", "active", "completed"] },
		});
		if (userUsageForThisPromo >= promo.userMaxUsageCount) {
			errorMessage =
				"You have already used this promo code the maximum number of times.";
		} else if (promo.applicableTo) {
			switch (promo.applicableTo.type) {
				case "firstRideOnly":
					const userBookingsCount = await Booking.countDocuments({
						user: userId,
						status: "completed",
					});
					if (userBookingsCount > 0)
						errorMessage =
							"This promo code is valid for the first ride only.";
					break;
				case "specificUsers":
					if (
						!promo.applicableTo.users ||
						!promo.applicableTo.users.some((uid) =>
							uid.equals(userId)
						)
					) {
						errorMessage =
							"This promo code is not applicable to your account.";
					}
					break;
				case "specificBikeCategories":
					if (
						!bookingDetails.bikeId ||
						!promo.applicableTo.bikeCategories ||
						promo.applicableTo.bikeCategories.length === 0
					) {
						errorMessage =
							"Bike information required or promo categories not set for this bike category specific promo.";
					} else {
						const bike = await Bike.findById(
							bookingDetails.bikeId
						).select("category");
						if (!bike)
							errorMessage =
								"Bike not found for category validation.";
						else if (
							!promo.applicableTo.bikeCategories.includes(
								bike.category
							)
						) {
							errorMessage = `This promo code is not valid for the selected bike category (${bike.category}).`;
						}
					}
					break;
			}
		}
	}

	if (errorMessage) {
		res.status(400);
		throw new Error(errorMessage);
	}
	// --- End Comprehensive Validation ---

	let discountApplied = 0;
	if (promo.discountType === "percentage") {
		discountApplied = (originalAmount * promo.discountValue) / 100;
		if (
			promo.maxDiscountAmount &&
			discountApplied > promo.maxDiscountAmount
		) {
			discountApplied = promo.maxDiscountAmount;
		}
	} else if (promo.discountType === "fixedAmount") {
		discountApplied = promo.discountValue;
	}
	discountApplied = Math.min(discountApplied, originalAmount); // Discount cannot exceed original amount
	const finalAmount = originalAmount - discountApplied;

	res.status(200).json({
		success: true,
		message: "Promo code applied successfully!",
		promoId: promo._id, // Send promoId to be used in createBooking if needed
		promoCode: promo.code,
		originalAmount: parseFloat(originalAmount.toFixed(2)),
		discountApplied: parseFloat(discountApplied.toFixed(2)),
		finalAmount: parseFloat(finalAmount.toFixed(2)),
		description: promo.description,
	});
});


exports.getPromoCodeByIdAdmin = asyncHandler(async (req, res, next) => {
    const { promoCodeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(promoCodeId)) { // <<< This check or similar Mongoose internal check
        res.status(400);
        throw new Error('Invalid Promo Code ID format.'); // <<< This is your error
    }

    const promoCode = await PromoCode.findById(promoCodeId).populate('createdBy', 'name email');
    // ...
});
