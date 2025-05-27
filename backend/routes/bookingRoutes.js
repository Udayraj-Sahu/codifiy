// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { createReview } = require("../controllers/reviewController"); // Add this import
const {
	createBooking,
	verifyPaymentAndConfirmBooking,
	getUserBookings, // Assuming you have this or will add it
	getBookingDetails, // Assuming you have this or will add it
	endRide,
	calculateBookingPrice, // Assuming you have this or will add it
} = require("../controllers/bookingController"); // Adjust path
const { protect } = require("../middleware/authMiddleware");
// Adjust path

// @route   POST /api/bookings/calculate-price
// @desc    Calculate expected booking price
// @access  Private
router.post("/calculate-price", protect, calculateBookingPrice); // We outlined this logic

// @route   POST /api/bookings
// @desc    Create a new booking (Initiate Payment)
// @access  Private
router.post("/", protect, createBooking);

// @route   POST /api/bookings/verify-payment
// @desc    Verify payment and confirm booking
// @access  Private
router.post("/verify-payment", protect, verifyPaymentAndConfirmBooking);

// @route   GET /api/bookings
// @desc    Get bookings for the logged-in user
// @access  Private
router.get("/", protect, getUserBookings); // You'll need to create this controller function

// @route   GET /api/bookings/:bookingId
// @desc    Get specific booking details for the logged-in user
// @access  Private
router.get("/:bookingId", protect, getBookingDetails); // You'll need to create this controller function

// @route   POST /api/bookings/:bookingId/end-ride
// @desc    User ends the ride
// @access  Private
router.post("/:bookingId/end-ride", protect, endRide);

// You might also add a route for POST /api/bookings/:bookingId/start-ride if needed
// And a POST /api/bookings/:bookingId/cancel route
// ... inside bookingRoutes.js

// @route   POST /api/bookings/:bookingId/reviews
// @desc    Create a review for a specific booking
// @access  Private
router.post("/:bookingId/reviews", protect, createReview);

module.exports = router;
