// backend/routes/adminDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
    getAdminDashboardStatistics,
    getAdminRecentActivity,
} = require('../controllers/adminDashboardController'); // You'll create this controller

// GET /api/admin/dashboard/statistics
router.get('/statistics', protect, isAdmin, getAdminDashboardStatistics);

// GET /api/admin/dashboard/recent-activity
router.get('/recent-activity', protect, isAdmin, getAdminRecentActivity);

module.exports = router;