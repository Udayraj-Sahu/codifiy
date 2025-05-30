// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    // deleteNotification // Optional
} = require('../controllers/notificationController'); // You'll create this controller

// Get notifications for the logged-in user (paginated)
router.get('/me', protect, getUserNotifications);

// Mark a specific notification as read
router.put('/:notificationId/read', protect, markNotificationAsRead);

// Mark all notifications as read for the logged-in user
router.put('/mark-all-read', protect, markAllNotificationsAsRead);

// Optional: Delete a notification
// router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;