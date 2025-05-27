const mongoose = require('mongoose');
const Review = require('../models/review');     // Adjust path to your review model
const Booking = require('../models/booking');   // Adjust path to your booking model
const Bike = require('../models/Bike');         // Adjust path to your bike model
// const User = require('../models/userModel'); // May not be needed if req.user is sufficient

// asyncHandler utility to catch errors from async functions
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * @desc    Create a new review for a booking
 * @route   POST /api/bookings/:bookingId/reviews
 * @access  Private (User)
 */
exports.createReview = asyncHandler(async (req, res, next) => {
    const userId = req.user.id; // Assuming req.user is populated by your auth middleware
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    // 1. Validate input
    if (rating === undefined || rating === null) {
        res.status(400);
        throw new Error('Rating is required.');
    }
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        res.status(400);
        throw new Error('Rating must be a number between 1 and 5.');
    }
    if (comment && typeof comment !== 'string') {
        res.status(400);
        throw new Error('Comment must be a string.');
    }
    if (comment && comment.length > 1000) { // Optional: Max length for comment
        res.status(400);
        throw new Error('Comment cannot exceed 1000 characters.');
    }

    // 2. Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
        res.status(404);
        throw new Error('Booking not found.');
    }

    // 3. Verify booking ownership and status
    if (booking.user.toString() !== userId) {
        res.status(403); // Forbidden
        throw new Error('User not authorized to review this booking.');
    }
    if (booking.status !== 'completed') {
        res.status(400);
        throw new Error('Booking must be completed to leave a review.');
    }

    // 4. Check if a review for this booking already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
        res.status(400);
        throw new Error('A review for this booking already exists. You can update your existing review.');
    }

    // 5. Create and save the review
    const review = await Review.create({
        user: userId,
        bike: booking.bike, // Get bikeId from the booking
        booking: bookingId,
        rating: numericRating,
        comment: comment || '', // Ensure comment is at least an empty string if undefined
    });
    // The post('save') hook on the Review model should automatically update Bike's averageRating.

    res.status(201).json({
        success: true,
        data: review,
    });
});

/**
 * @desc    Get all reviews for a specific bike
 * @route   GET /api/bikes/:bikeId/reviews
 * @access  Public (or Private if you choose)
 */
exports.getReviewsForBike = asyncHandler(async (req, res, next) => {
    const { bikeId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10; // Default 10 reviews per page
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(bikeId)) {
        res.status(400);
        throw new Error('Invalid Bike ID format.');
    }

    // Check if bike exists (optional, but good for a 404 if bike is invalid)
    const bikeExists = await Bike.findById(bikeId);
    if (!bikeExists) {
        res.status(404);
        throw new Error('Bike not found.');
    }

    const reviews = await Review.find({ bike: bikeId })
        .populate('user', 'name profileImage') // Populate user's name and a profile image field if you have one
        .sort({ createdAt: -1 }) // Newest reviews first
        .skip(skip)
        .limit(limit);

    const totalReviews = await Review.countDocuments({ bike: bikeId });

    res.status(200).json({
        success: true,
        count: reviews.length,
        total: totalReviews,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            limit,
        },
        data: reviews,
    });
});

/**
 * @desc    Update user's own review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (User)
 */
exports.updateUserReview = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(400);
        throw new Error('Invalid Review ID format.');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found.');
    }

    if (review.user.toString() !== userId) {
        res.status(403);
        throw new Error('User not authorized to update this review.');
    }

    // Validate and update fields
    if (rating !== undefined) {
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            res.status(400);
            throw new Error('Rating must be a number between 1 and 5.');
        }
        review.rating = numericRating;
    }

    if (comment !== undefined) { // Allow empty string to clear comment
        if (typeof comment !== 'string') {
            res.status(400);
            throw new Error('Comment must be a string.');
        }
         if (comment.length > 1000) {
            res.status(400);
            throw new Error('Comment cannot exceed 1000 characters.');
        }
        review.comment = comment;
    }

    const updatedReview = await review.save();
    // The post('save') hook on Review model should handle updating Bike's averageRating.

    res.status(200).json({
        success: true,
        data: updatedReview,
    });
});

/**
 * @desc    Delete user's own review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (User)
 */
exports.deleteUserReview = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(400);
        throw new Error('Invalid Review ID format.');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found.');
    }

    if (review.user.toString() !== userId) {
        res.status(403);
        throw new Error('User not authorized to delete this review.');
    }

    // Important: Ensure your Review model's pre/post 'remove' or 'findOneAndDelete' hook
    // correctly captures the bikeId to trigger calculateAverageRating.
    // If using review.remove(), a document middleware hook for 'remove' is best.
    await review.remove();
    // The hook in Review model should handle updating Bike's averageRating.

    res.status(200).json({
        success: true,
        message: 'Review removed successfully.',
    });
});