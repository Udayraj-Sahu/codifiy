// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const {
    createReview,
    // getReviewsForBike is usually a public route or on bikeRoutes
    updateUserReview,
    deleteUserReview
} = require('../controllers/reviewController'); // Adjust path
const { protect } = require('../middleware/authMiddleware'); // Adjust path

// @route   POST /api/bookings/:bookingId/reviews  (Creating a review tied to a booking)
// @desc    Create a new review for a specific booking
// @access  Private
// This route is more logically placed with bookings or as a top-level review route
// For now, assuming it's created via a booking context.
// If your controller 'createReview' uses req.params.bookingId, this structure works.
// router.post('/for-booking/:bookingId', protect, createReview);
// OR, a more common pattern might be directly on a review resource:
// POST /api/reviews (with bookingId in the body) - let's adjust createReview controller if so.

// Let's assume createReview expects bookingId in req.body or a specific route.
// If createReview is POST /api/reviews and takes bookingId in body:
router.post('/', protect, createReview); // You'd pass bookingId in req.body for createReview

// @route   PUT /api/reviews/:reviewId
// @desc    Update user's own review
// @access  Private
router.put('/:reviewId', protect, updateUserReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete user's own review
// @access  Private
router.delete('/:reviewId', protect, deleteUserReview);

// Note: GET /api/bikes/:bikeId/reviews (Get reviews for a bike) would typically be in bikeRoutes.js

module.exports = router;