// backend/routes/ownerDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Assuming generic protect
const { isOwner } = require('../middleware/ownerMiddleware'); // Specific middleware for owner role
const {
    getOwnerDashboardStatistics,
    getOwnerRecentActivity,
} = require('../controllers/ownerDashboardController'); // Path to your new controller

// GET /api/owner/dashboard/statistics
router.get('/statistics', protect, isOwner, getOwnerDashboardStatistics);

// GET /api/owner/dashboard/recent-activity
router.get('/recent-activity', protect, isOwner, getOwnerRecentActivity);

module.exports = router;