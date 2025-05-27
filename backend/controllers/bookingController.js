const mongoose = require("mongoose");
const Booking = require("../models/booking"); // Adjust path to your booking model
const Bike = require("../models/Bike"); // Adjust path to your bike model
const User = require("../models/User"); // Adjust path to your user model
const PromoCode = require("../models/promoCode"); // Adjust path to your promo code model
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { notifyUser } = require("../utils/pushNotificationManager");

// asyncHandler utility to catch errors from async functions and pass to Express error handler
const asyncHandler = (fn) => (req, res, next) =>
	Promise.resolve(fn(req, res, next)).catch(next);

// Initialize Razorpay instance
// IMPORTANT: Store keys in environment variables (e.g., process.env.RAZORPAY_KEY_ID)
const razorpayInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a new booking (Initiate Payment with Razorpay)
 * @route   POST /api/bookings
 * @access  Private (User)
 */
exports.createBooking = asyncHandler(async (req, res, next) => {
	const userId = req.user.id; // Assuming req.user is populated by your auth middleware
	const { bikeId, startTime, endTime, promoCodeId, finalAmountFromClient } =
		req.body;

	// 1. Validate Input
	if (
		!bikeId ||
		!startTime ||
		!endTime ||
		finalAmountFromClient === undefined
	) {
		res.status(400);
		throw new Error(
			"Missing required fields: bikeId, startTime, endTime, finalAmountFromClient."
		);
	}
	if (
		isNaN(new Date(startTime).getTime()) ||
		isNaN(new Date(endTime).getTime())
	) {
		res.status(400);
		throw new Error("Invalid date format for startTime or endTime.");
	}
	if (new Date(startTime) < new Date(Date.now() - 1000 * 60 * 5)) {
		// Allow 5 min buffer for clock skew
		res.status(400);
		throw new Error("Start time cannot be in the past.");
	}
	if (new Date(endTime) <= new Date(startTime)) {
		res.status(400);
		throw new Error("End time must be after start time.");
	}
	if (
		typeof parseFloat(finalAmountFromClient) !== "number" ||
		parseFloat(finalAmountFromClient) < 0
	) {
		res.status(400);
		throw new Error("Invalid final amount.");
	}

	// 2. Fetch Bike and User details
	const bike = await Bike.findById(bikeId);
	if (!bike) {
		res.status(404);
		throw new Error("Bike not found.");
	}
	if (["maintenance", "unavailable"].includes(bike.availabilityStatus)) {
		res.status(400);
		throw new Error(
			`Bike "${bike.name}" is currently unavailable (${bike.availabilityStatus}).`
		);
	}

	const user = await User.findById(userId);
	if (!user) {
		res.status(404); // Should not happen if auth is working
		throw new Error("User not found.");
	}

	// 3. Check Bike Availability
	const overlappingBooking = await Booking.findOne({
		bike: bikeId,
		status: { $in: ["confirmed", "active", "pending_payment"] }, // Consider pending for short periods
		$or: [
			{
				startTime: { $lt: new Date(endTime) },
				endTime: { $gt: new Date(startTime) },
			},
		],
	});
	if (overlappingBooking) {
		res.status(400);
		throw new Error(
			`Bike "${bike.name}" is not available for the selected time slot.`
		);
	}

	// 4. Recalculate Price Server-Side
	const durationInMilliseconds =
		new Date(endTime).getTime() - new Date(startTime).getTime();
	// This duration calculation logic might need to be more sophisticated based on bike.pricing (perHour, perDay)
	const rentalUnits = Math.ceil(durationInMilliseconds / (1000 * 60 * 60)); // Example: duration in hours
	if (rentalUnits <= 0) {
		res.status(400);
		throw new Error("Invalid rental duration calculated.");
	}
	let originalAmount = rentalUnits * bike.pricePerHour; // Assuming perHour pricing
	let discountAmount = 0;
	let appliedPromoCodeObjectId = null;

	if (promoCodeId && mongoose.Types.ObjectId.isValid(promoCodeId)) {
		const promo = await PromoCode.findById(promoCodeId);
		if (promo) {
			// Check if promo was found
			// ---- ADD DETAILED VALIDATION LOGGING HERE ----
			const now = new Date();
			const userBookingsForThisPromo = await Booking.countDocuments({
				user: userId, // userId from req.user.id
				appliedPromoCode: promo._id,
				status: { $in: ["confirmed", "active", "completed"] },
			});

			let isPromoValidInCreateBooking = true;
			let failureReasonInCreateBooking = "";

			console.log("--- CreateBooking: Promo Validation ---");
			console.log(
				"Promo Code:",
				promo.code,
				"Is Active:",
				promo.isActive
			);
			console.log("Current Time:", now.toISOString());
			console.log(
				"Valid From:",
				promo.validFrom.toISOString(),
				"Valid Till:",
				promo.validTill.toISOString()
			);
			console.log(
				"Date Check:",
				now >= promo.validFrom && now <= promo.validTill
			);
			console.log(
				"Used Count:",
				promo.usedCount,
				"Max Usage:",
				promo.maxUsageCount
			);
			console.log("Usage Check:", promo.usedCount < promo.maxUsageCount);
			console.log(
				"Original Amount for Check:",
				originalAmount,
				"Min Booking Value:",
				promo.minBookingValue
			); // originalAmount is calculated earlier in createBooking
			console.log(
				"Min Value Check:",
				originalAmount >= promo.minBookingValue
			);
			console.log(
				"User Usage for this Promo:",
				userBookingsForThisPromo,
				"User Max Usage:",
				promo.userMaxUsageCount
			);
			console.log(
				"User Usage Check:",
				userBookingsForThisPromo < promo.userMaxUsageCount
			);
			// Add logs for applicableTo checks as well if needed

			if (
				!(
					promo.isActive &&
					now >= promo.validFrom &&
					now <= promo.validTill
				)
			) {
				isPromoValidInCreateBooking = false;
				failureReasonInCreateBooking =
					"Inactive or Date validity failed.";
			} else if (promo.usedCount >= promo.maxUsageCount) {
				isPromoValidInCreateBooking = false;
				failureReasonInCreateBooking = "Overall usage limit reached.";
			} else if (originalAmount < promo.minBookingValue) {
				isPromoValidInCreateBooking = false;
				failureReasonInCreateBooking = `Min booking value not met. Original: ${originalAmount}, MinRequired: ${promo.minBookingValue}`;
			} else if (userBookingsForThisPromo >= promo.userMaxUsageCount) {
				isPromoValidInCreateBooking = false;
				failureReasonInCreateBooking =
					"User-specific usage limit reached.";
			}
			// Add detailed 'applicableTo' checks here as well, similar to calculateBookingPrice...

			console.log(
				"Is Promo Valid in createBooking?:",
				isPromoValidInCreateBooking,
				"Reason:",
				failureReasonInCreateBooking
			);
			console.log("--------------------------------------");

			if (isPromoValidInCreateBooking) {
				if (promo.discountType === "percentage") {
					discountAmount =
						(originalAmount * promo.discountValue) / 100;
					if (
						promo.maxDiscountAmount &&
						discountAmount > promo.maxDiscountAmount
					) {
						discountAmount = promo.maxDiscountAmount;
					}
				} else if (promo.discountType === "fixedAmount") {
					discountAmount = promo.discountValue;
				}
				discountAmount = Math.min(discountAmount, originalAmount);
				appliedPromoCodeObjectId = promo._id; // This was already happening based on your logs
			} else {
				// This else block is likely being hit, keeping discountAmount = 0
				appliedPromoCodeObjectId = null; // Ensure if promo validation fails, we don't link it
			}
		} else {
			console.warn(
				`Promo code ID ${promoCodeId} not found during createBooking.`
			);
			appliedPromoCodeObjectId = null; // Ensure if promo not found, we don't link it
		}
	}

	// Assuming taxesAndFees is 0 for now, implement your logic
	const taxesAndFees = 0;
	const serverCalculatedFinalAmount =
		originalAmount - discountAmount + taxesAndFees;

	console.log("--- CreateBooking Server-Side Calculation ---");
	console.log(
		"Client Sent finalAmountFromClient:",
		parseFloat(finalAmountFromClient)
	);
	console.log("Server Calculated originalAmount:", originalAmount);
	console.log("Server Calculated discountAmount:", discountAmount);
	console.log("Server Calculated promoCodeId used for calc:", promoCodeId); // The ID received in this request
	console.log(
		"Server Calculated appliedPromoCodeObjectId:",
		appliedPromoCodeObjectId
	); // The ID actually used after validation
	console.log("Server Calculated taxesAndFees:", taxesAndFees);
	console.log(
		"Server Calculated serverCalculatedFinalAmount:",
		serverCalculatedFinalAmount
	);
	console.log("---------------------------------------------");
	if (
		Math.abs(
			serverCalculatedFinalAmount - parseFloat(finalAmountFromClient)
		) > 0.01
	) {
		// Tolerance
		console.error(
			`Amount mismatch: Client=${finalAmountFromClient}, Server=${serverCalculatedFinalAmount}, Original=${originalAmount}, Discount=${discountAmount}`
		);
		res.status(400);
		throw new Error(
			"Price mismatch. Please try calculating the price again or contact support."
		);
	}
	const amountToChargeInPaisa = Math.round(serverCalculatedFinalAmount * 100);
	if (amountToChargeInPaisa <= 0 && serverCalculatedFinalAmount > 0) {
		// Safety check if somehow paisa amount becomes 0 for a positive amount
		res.status(400);
		throw new Error(
			"Calculated amount to charge is invalid. Please contact support."
		);
	}
	const preliminaryBookingId = new mongoose.Types.ObjectId();
	// 5. Create Razorpay Order (only if amount > 0, otherwise it's a free booking)
	let razorpayOrderResponse = null;
	if (amountToChargeInPaisa > 0) {
		const razorpayOptions = {
			amount: amountToChargeInPaisa,
			currency: "INR",
			receipt: `rcpt_${preliminaryBookingId.toString()}`,
			payment_capture: 1, // Auto capture
		};
		try {
			razorpayOrderResponse = await razorpayInstance.orders.create(
				razorpayOptions
			);
		} catch (error) {
			console.error(
				"Razorpay order creation failed:",
				error.message,
				error.error
			); // Log Razorpay's error
			res.status(500);
			throw new Error(
				"Failed to initiate payment with payment gateway. Please try again."
			);
		}
	}

	// 6. Create Preliminary Booking Document
	const preliminaryBooking = new Booking({
		// 'Booking' is your imported Mongoose model
		user: userId,
		bike: bikeId,
		startTime,
		endTime,
		originalAmount,
		appliedPromoCode: appliedPromoCodeObjectId, // This should be ObjectId or null
		discountAmount,
		taxesAndFees,
		finalAmount: serverCalculatedFinalAmount,
		status: amountToChargeInPaisa > 0 ? "pending_payment" : "confirmed",
		razorpayOrderId: razorpayOrderResponse
			? razorpayOrderResponse.id
			: null,
		// DO NOT explicitly set bookingReference here to null or an empty string
		// Let the pre-save hook handle it.
	});

	try {
		console.log(
			"Before saving booking, preliminaryBooking is:",
			preliminaryBooking
		); // Debug
		const newBooking = await preliminaryBooking.save(); // This triggers the pre-save hook
		console.log("After saving booking, newBooking is:", newBooking); // Debug

		// ... rest of your response logic ...
		res.status(201).json({
			/* ... your success response ... */
		});
	} catch (saveError) {
		console.error("Error during booking save:", saveError);
		// This catch block might be where your ValidationError is being caught
		// or it might be caught by your asyncHandler
		res.status(500); // Or 400 if it's a validation error
		throw saveError; // Re-throw or handle appropriately
	}
	console.log("--- Checking preliminaryBooking instance before save ---");
	console.log(
		"Is preliminaryBooking an instance of Booking model?",
		preliminaryBooking instanceof Booking
	);
	if (
		preliminaryBooking.schema &&
		preliminaryBooking.schema.s &&
		preliminaryBooking.schema.s.hooks
	) {
		console.log(
			"Schema hooks (pre):",
			preliminaryBooking.schema.s.hooks.pres
		); // Mongoose internal structure, might vary
		console.log(
			"Schema hooks (post):",
			preliminaryBooking.schema.s.hooks.posts
		);
	} else {
		console.log("Could not access preliminaryBooking.schema.s.hooks");
	}
	console.log("Booking model schema statics:", Booking.schema.statics); // Check if model has schema
	console.log("Booking model schema methods:", Booking.schema.methods);
	console.log("-----------------------------------------------------");

	try {
		console.log(
			"Before saving booking, preliminaryBooking is:",
			preliminaryBooking
		);
		const newBooking = await preliminaryBooking.save(); // This triggers the pre-save hook
		console.log("After saving booking, newBooking is:", newBooking);
		// ... rest of your response logic ...
	} catch (saveError) {
		console.error("Error during booking save:", saveError);
		res.status(500);
		throw saveError;
	}
	const newBooking = await preliminaryBooking.save();

	// 7. Send Response
	if (amountToChargeInPaisa > 0 && razorpayOrderResponse) {
		res.status(201).json({
			message: "Booking initiated. Proceed to payment.",
			bookingId: newBooking._id,
			bookingReference: newBooking.bookingReference,
			razorpayOrderId: razorpayOrderResponse.id,
			razorpayKeyId: process.env.RAZORPAY_KEY_ID,
			amount: razorpayOrderResponse.amount,
			currency: razorpayOrderResponse.currency,
			userName: user.name, // For Razorpay prefill
			userEmail: user.email,
			userContact: user.phone || "",
		});
	} else {
		// Free booking scenario (amount was 0)
		// Trigger notifications for free confirmed booking
		// sendBookingConfirmationNotification(user, newBooking); // Conceptual
		res.status(201).json({
			message: "Booking confirmed (free of charge).",
			bookingId: newBooking._id,
			bookingReference: newBooking.bookingReference,
			bookingDetails: newBooking, // Send full details as it's already confirmed
		});
	}
});

/**
 * @desc    Verify Payment and Confirm Booking
 * @route   POST /api/bookings/verify-payment
 * @access  Private (User)
 */
exports.verifyPaymentAndConfirmBooking = asyncHandler(
	async (req, res, next) => {
		const userId = req.user.id;
		const {
			razorpay_payment_id,
			razorpay_order_id,
			razorpay_signature,
			bookingId,
		} = req.body;

		if (
			!razorpay_payment_id ||
			!razorpay_order_id ||
			!razorpay_signature ||
			!bookingId
		) {
			res.status(400);
			throw new Error(
				"Missing required Razorpay payment details or booking ID."
			);
		}

		// It's good to populate bike details here if you need them for the notification
		const booking = await Booking.findById(bookingId).populate(
			"bike",
			"name model"
		);

		if (!booking) {
			res.status(404);
			throw new Error("Booking not found.");
		}
		if (booking.user.toString() !== userId) {
			res.status(403);
			throw new Error("User not authorized to verify this booking.");
		}
		if (booking.razorpayOrderId !== razorpay_order_id) {
			res.status(400);
			throw new Error("Razorpay Order ID mismatch with booking record.");
		}
		if (booking.status === "confirmed") {
			return res.status(200).json({
				status: "success",
				message: "Booking already confirmed.",
				bookingDetails: booking,
			});
		}
		if (booking.status !== "pending_payment") {
			res.status(400);
			throw new Error(
				`Booking cannot be confirmed. Current status: ${booking.status}.`
			);
		}

		// Verify Razorpay Signature
		const bodyToVerify =
			booking.razorpayOrderId + "|" + razorpay_payment_id; // Corrected variable name
		const expectedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
			.update(bodyToVerify.toString()) // Use bodyToVerify
			.digest("hex");

		if (expectedSignature === razorpay_signature) {
			// Signature is valid
			booking.paymentId = razorpay_payment_id;
			booking.razorpaySignature = razorpay_signature; // For reference
			booking.status = "confirmed";
			const confirmedBooking = await booking.save();

			if (booking.appliedPromoCode) {
				try {
					await PromoCode.findByIdAndUpdate(
						booking.appliedPromoCode,
						{ $inc: { usedCount: 1 } }
					);
				} catch (promoError) {
					console.error(
						`Failed to update promo code ${booking.appliedPromoCode} usage count:`,
						promoError
					);
					// Decide how to handle this: log, retry later, or ignore if non-critical.
				}
			}

			// --- Send Push Notification ---
			if (confirmedBooking.user) {
				// The bike details should already be populated if you added .populate('bike', 'name model') above
				const bikeName = confirmedBooking.bike
					? confirmedBooking.bike.name || confirmedBooking.bike.model
					: "your bike";
				const title = "Booking Confirmed!";
				const bodyMessage = `Your booking for ${bikeName} (Ref: ${confirmedBooking.bookingReference}) is confirmed.`;
				const data = {
					screen: "BookingDetails", // Example: screen to navigate to in your app
					bookingId: confirmedBooking._id.toString(),
				};
				// Assuming notifyUser fetches the user's expoPushToken internally
				await notifyUser(
					confirmedBooking.user.toString(),
					title,
					bodyMessage,
					data
				);
			}
			// --- End Push Notification ---

			res.status(200).json({
				status: "success",
				message: "Booking confirmed successfully!",
				bookingDetails: confirmedBooking,
			});
		} else {
			// Signature is invalid
			booking.status = "payment_failed";
			await booking.save();
			res.status(400);
			throw new Error("Payment verification failed. Invalid signature.");
		}
	}
);

/**
 * @desc    User Ends the Ride
 * @route   POST /api/bookings/:bookingId/end-ride
 * @access  Private (User)
 */
exports.endRide = asyncHandler(async (req, res, next) => {
	const userId = req.user.id;
	const { bookingId } = req.params;
	const { endRidePhotoUrl } = req.body; // Optional: URL of photo uploaded via a separate endpoint

	const booking = await Booking.findById(bookingId).populate("bike"); // Populate bike for overtimeChargePerHour
	if (!booking) {
		res.status(404);
		throw new Error("Booking not found.");
	}
	if (booking.user.toString() !== userId) {
		res.status(403);
		throw new Error("User not authorized to end this ride.");
	}

	if (booking.status === "completed") {
		return res.status(200).json({
			message: "Ride already marked as completed.",
			bookingDetails: booking,
		});
	}
	if (booking.status !== "active" && booking.status !== "confirmed") {
		// Allow ending if 'confirmed' but not explicitly 'active' (if no start-ride API is used)
		res.status(400);
		throw new Error(
			`Cannot end ride. Booking status is: ${booking.status}. Ride must be active or confirmed.`
		);
	}

	// Update Booking Details
	booking.actualEndTime = new Date();
	if (endRidePhotoUrl && typeof endRidePhotoUrl === "string") {
		booking.endRidePhotoUrl = endRidePhotoUrl;
	}
	// If actualStartTime was not explicitly set (e.g., no dedicated start-ride API was called or implemented)
	// default it to the booked startTime for duration calculation.
	if (!booking.actualStartTime) {
		booking.actualStartTime = booking.startTime;
	}
	// Ensure actualStartTime is not after actualEndTime (can happen if clocks are way off or bad data)
	if (booking.actualStartTime > booking.actualEndTime) {
		booking.actualStartTime = booking.actualEndTime; // Or handle as an error
	}

	// Calculate Overtime
	let overtimeCharges = 0;
	let overtimeDurationMinutes = 0;
	const bookedEndTime = new Date(booking.endTime);

	if (booking.actualEndTime > bookedEndTime) {
		const overtimeMilliseconds =
			booking.actualEndTime.getTime() - bookedEndTime.getTime();
		overtimeDurationMinutes = Math.ceil(overtimeMilliseconds / (1000 * 60));

		if (
			booking.bike &&
			typeof booking.bike.overtimeChargePerHour === "number" &&
			booking.bike.overtimeChargePerHour > 0
		) {
			const overtimeHours = overtimeDurationMinutes / 60;
			overtimeCharges = parseFloat(
				(overtimeHours * booking.bike.overtimeChargePerHour).toFixed(2)
			);
		}
	}
	booking.overtimeCharges = overtimeCharges;
	booking.status = "completed";
	const completedBooking = await booking.save();

	// Handle Overtime Charges Payment (Business Decision Needed)
	// For now, it's just recorded. If immediate payment is required,
	// this would trigger a new payment flow or use a stored payment method.
	if (overtimeCharges > 0) {
		// sendOvertimeNotification(user, completedBooking, overtimeCharges); // Conceptual
		console.log(
			`Overtime of ${overtimeCharges} INR (duration: ${overtimeDurationMinutes} mins) recorded for booking ${bookingId}.`
		);
	}

	// Prepare summary for response
	const bookedDurationMilliseconds =
		bookedEndTime.getTime() - new Date(booking.startTime).getTime();
	const actualDurationMilliseconds =
		booking.actualEndTime.getTime() -
		new Date(booking.actualStartTime).getTime();

	res.status(200).json({
		message: "Ride ended successfully.",
		bookingDetails: completedBooking,
		summary: {
			bookedDurationHours: (
				bookedDurationMilliseconds /
				(1000 * 60 * 60)
			).toFixed(2),
			actualDurationMinutes: (
				actualDurationMilliseconds /
				(1000 * 60)
			).toFixed(2),
			overtimeDurationMinutes: overtimeDurationMinutes,
			overtimeCharges: overtimeCharges,
			finalAmountPaid: completedBooking.finalAmount, // Initial amount paid
		},
	});
});

/**
 * @desc    Calculate Expected Booking Price
 * @route   POST /api/bookings/calculate-price
 * @access  Private
 */
exports.calculateBookingPrice = asyncHandler(async (req, res, next) => {
	const userId = req.user.id; // From protect middleware
	const { bikeId, startTime, endTime, promoCode: promoCodeString } = req.body;

	// 1. Validate input
	if (!bikeId || !startTime || !endTime) {
		res.status(400);
		throw new Error("Bike ID, start time, and end time are required.");
	}
	if (!mongoose.Types.ObjectId.isValid(bikeId)) {
		res.status(400);
		throw new Error("Invalid Bike ID format.");
	}
	if (
		isNaN(new Date(startTime).getTime()) ||
		isNaN(new Date(endTime).getTime())
	) {
		res.status(400);
		throw new Error("Invalid date format for startTime or endTime.");
	}

	const sTime = new Date(startTime);
	const eTime = new Date(endTime);

	if (sTime < new Date(Date.now() - 1000 * 60 * 5)) {
		// Allow 5 min buffer for clock skew
		res.status(400);
		throw new Error("Start time cannot be in the past.");
	}
	if (eTime <= sTime) {
		res.status(400);
		throw new Error("End time must be after start time.");
	}

	// 2. Fetch the Bike
	const bike = await Bike.findById(bikeId);
	if (!bike) {
		res.status(404);
		throw new Error("Bike not found.");
	}
	if (["maintenance", "unavailable"].includes(bike.availabilityStatus)) {
		res.status(400);
		throw new Error(
			`Bike "${bike.name || bike.model}" is currently unavailable (${
				bike.availabilityStatus
			}).`
		);
	}
	if (typeof bike.pricePerHour !== "number") {
		console.error(`Bike ${bike._id} is missing a valid pricePerHour.`);
		res.status(500);
		throw new Error(
			"Pricing information for this bike is configured incorrectly. Please contact support."
		);
	}

	// 3. Check Bike Availability for the selected period
	const overlappingBooking = await Booking.findOne({
		bike: bikeId,
		status: { $in: ["confirmed", "active"] },
		$or: [{ startTime: { $lt: eTime }, endTime: { $gt: sTime } }],
	});
	if (overlappingBooking) {
		res.status(400);
		throw new Error("Bike is not available for the selected time slot.");
	}

	// 4. Calculate Original Price
	const durationInMilliseconds = eTime.getTime() - sTime.getTime();
	const durationHours = Math.ceil(durationInMilliseconds / (1000 * 60 * 60)); // Duration in hours

	if (durationHours <= 0) {
		res.status(400);
		throw new Error(
			"Calculated rental duration is invalid (must be at least 1 hour)."
		);
	}

	// *** THE KEY FIX IS HERE ***
	// Ensure originalAmount calculation consistently uses bike.pricePerHour for hourly rentals
	let originalAmount = durationHours * bike.pricePerHour;

	// 5. Apply Promo Code (if provided)
	let discountAmount = 0;
	let appliedPromoDetails = null;
	let promoIdForNextStep = null; // To pass to createBooking if a promo is successfully applied

	if (
		promoCodeString &&
		typeof promoCodeString === "string" &&
		promoCodeString.trim() !== ""
	) {
		const promo = await PromoCode.findOne({
			code: promoCodeString.trim().toUpperCase(),
			isActive: true,
		});
		if (promo) {
			const now = new Date();
			const userBookingsForThisPromo = await Booking.countDocuments({
				user: userId,
				appliedPromoCode: promo._id,
				status: { $in: ["confirmed", "active", "completed"] },
			});

			let isPromoValid = true;
			let failureReason = ""; // For server-side logging/debugging

			if (!(now >= promo.validFrom && now <= promo.validTill)) {
				isPromoValid = false;
				failureReason = "Date validity failed.";
			} else if (promo.usedCount >= promo.maxUsageCount) {
				isPromoValid = false;
				failureReason = "Overall usage limit reached.";
			} else if (originalAmount < promo.minBookingValue) {
				isPromoValid = false;
				failureReason = `Minimum booking value of ${promo.minBookingValue} not met. Original amount: ${originalAmount}.`;
			} else if (userBookingsForThisPromo >= promo.userMaxUsageCount) {
				isPromoValid = false;
				failureReason = "User-specific usage limit reached.";
			} else if (promo.applicableTo) {
				switch (promo.applicableTo.type) {
					case "firstRideOnly":
						const completedUserBookings =
							await Booking.countDocuments({
								user: userId,
								status: "completed",
							});
						if (completedUserBookings > 0) {
							isPromoValid = false;
							failureReason = "Applicable to first ride only.";
						}
						break;
					case "specificBikeCategories":
						if (
							!bike ||
							!promo.applicableTo.bikeCategories ||
							!promo.applicableTo.bikeCategories.includes(
								bike.category
							)
						) {
							isPromoValid = false;
							failureReason = `Promo not valid for bike category: ${bike.category}.`;
						}
						break;
					case "specificUsers":
						if (
							!promo.applicableTo.users ||
							!promo.applicableTo.users.some((uid) =>
								uid.equals(userId)
							)
						) {
							isPromoValid = false;
							failureReason =
								"Promo not applicable to this user.";
						}
						break;
				}
			}

			if (isPromoValid) {
				if (promo.discountType === "percentage") {
					discountAmount =
						(originalAmount * promo.discountValue) / 100;
					if (
						promo.maxDiscountAmount &&
						discountAmount > promo.maxDiscountAmount
					) {
						discountAmount = promo.maxDiscountAmount;
					}
				} else if (promo.discountType === "fixedAmount") {
					discountAmount = promo.discountValue;
				}
				discountAmount = Math.min(discountAmount, originalAmount); // Cap discount at original amount
				appliedPromoDetails = {
					code: promo.code,
					description: promo.description,
					discountApplied: parseFloat(discountAmount.toFixed(2)),
				};
				promoIdForNextStep = promo._id.toString(); // Pass the ObjectId as a string
			} else {
				console.log(
					`Promo code "${promoCodeString}" found but not applicable for user ${userId}. Reason: ${failureReason}`
				);
				// Optionally, you could include a message in the response if a promo was attempted but failed.
				// For now, it just results in no discount.
			}
		} else {
			console.log(
				`Promo code "${promoCodeString}" not found or not active.`
			);
			// Optionally, message user about invalid promo code.
		}
	}

	// 6. Calculate Taxes & Fees (Implement your logic if any)
	const taxesAndFees = 0; // Placeholder

	// 7. Calculate Final Amount
	const finalAmount = originalAmount - discountAmount + taxesAndFees;

	res.status(200).json({
		success: true,
		data: {
			bikeId: bike._id.toString(),
			bikeName: bike.name || bike.model, // Use bike name if available, else model
			startTime: sTime.toISOString(),
			endTime: eTime.toISOString(),
			durationHours: durationHours,
			originalAmount: parseFloat(originalAmount.toFixed(2)),
			promoApplied: appliedPromoDetails, // Will be null if no valid promo was applied
			promoIdForNextStep: promoIdForNextStep, // Will be null if no valid promo was applied
			discountAmount: parseFloat(discountAmount.toFixed(2)),
			taxesAndFees: parseFloat(taxesAndFees.toFixed(2)),
			finalAmount: parseFloat(finalAmount.toFixed(2)),
			currency: "INR", // Or your app's currency
		},
	});
});
/**
 * @desc    Get bookings for the logged-in user
 * @route   GET /api/bookings
 * @access  Private
 */
exports.getUserBookings = asyncHandler(async (req, res, next) => {
	const userId = req.user.id; // From protect middleware

	const {
		page = 1,
		limit = 10,
		status,
		sortBy = "createdAt:desc",
	} = req.query;

	const query = { user: userId };
	if (status) {
		query.status = status;
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
			// Populate bike details for each booking
			{ path: "bike", select: "name model images category" }, // Adjust fields as needed
			{ path: "appliedPromoCode", select: "code description" }, // Optional: if you want to show promo details
		],
	};

	// Manual pagination approach:
	const totalBookings = await Booking.countDocuments(query);
	const bookings = await Booking.find(query)
		.populate(options.populate)
		.sort(options.sort)
		.skip((options.page - 1) * options.limit)
		.limit(options.limit)
		.lean(); // Use .lean() for faster queries if you don't need Mongoose documents

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
 * @desc    Get specific booking details for the logged-in user
 * @route   GET /api/bookings/:bookingId
 * @access  Private
 */
exports.getBookingDetails = asyncHandler(async (req, res, next) => {
	const userId = req.user.id;
	const { bookingId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(bookingId)) {
		res.status(400);
		throw new Error("Invalid Booking ID format.");
	}

	const booking = await Booking.findOne({ _id: bookingId, user: userId })
		.populate("user", "-password") // Exclude password
		.populate("bike")
		.populate(
			"appliedPromoCode",
			"code description discountValue discountType"
		); // Populate promo details

	if (!booking) {
		res.status(404);
		// Differentiate error: booking not found vs. not authorized (even if user ID check is in query)
		// For this specific query, findOne would return null if either ID is wrong OR user doesn't match
		throw new Error(
			"Booking not found or you are not authorized to view this booking."
		);
	}

	res.status(200).json({
		success: true,
		data: booking,
	});
});
