// routes/adminBookingRoutes.js
const express = require('express');
const router = express.Router();
const {
    getAllBookings,
    getBookingById,
    updateBookingStatus
} = require('../controllers/adminBookingController'); // Adjust path
const { protect } = require('../middleware/authMiddleware'); // Your protect middleware
const { isAdminOrOwner } = require('../middleware/isAdminOrOwnerMiddleware'); // Your isAdminOrOwner middleware

// @route   GET /api/admin/bookings
// @desc    Admin/Owner: Get all bookings
// @access  Private (Admin/Owner)
router.get('/', protect, isAdminOrOwner, getAllBookings); // <<< This already allows both as intended

// @route   GET /api/admin/bookings/:bookingId
// @desc    Admin/Owner: Get a specific booking by ID
// @access  Private (Admin/Owner)
router.get('/:bookingId', protect, isAdminOrOwner, getBookingById);

// @route   PUT /api/admin/bookings/:bookingId/status
// @desc    Admin/Owner: Update the status of a booking
// @access  Private (Admin/Owner)
router.put('/:bookingId/status', protect, isAdminOrOwner, updateBookingStatus);

module.exports = router;