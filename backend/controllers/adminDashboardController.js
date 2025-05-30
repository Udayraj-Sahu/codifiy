// backend/controllers/adminDashboardController.js
const asyncHandler = require("express-async-handler");
const Bike = require("../models/Bike");
const User = require("../models/User");
const Booking = require("../models/booking");
const Document = require("../models/Document");
// const ActivityLog = require("../models/ActivityLog"); // If you implement a dedicated ActivityLog model

/**
 * @desc    Get Admin Dashboard Statistics
 * @route   GET /api/admin/dashboard/statistics
 * @access  Private/Admin
 */
exports.getAdminDashboardStatistics = asyncHandler(async (req, res) => {
    console.log("--- adminDashboardController: getAdminDashboardStatistics ---");
    const totalBikes = await Bike.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['confirmed', 'ongoing', 'upcoming'] } }); // Define what 'active' means
    const pendingDocuments = await Document.countDocuments({ status: 'pending' });
    const registeredUsers = await User.countDocuments(); // Or filter by role if needed

    const stats = {
        totalBikes,
        activeBookings,
        pendingDocuments,
        registeredUsers,
    };

    res.status(200).json({ success: true, data: stats });
});

/**
 * @desc    Get Admin Recent Activity
 * @route   GET /api/admin/dashboard/recent-activity
 * @access  Private/Admin
 */
exports.getAdminRecentActivity = asyncHandler(async (req, res) => {
    console.log("--- adminDashboardController: getAdminRecentActivity ---");
    const limit = parseInt(req.query.limit, 10) || 5; // Default to 5 items

    // Option 1: If you have a dedicated ActivityLog model
    // const activities = await ActivityLog.find({}) // Add filters if needed, e.g., { isOwnerActivity: false } for admin-relevant logs
    //     .sort({ timestamp: -1 }) // or createdAt: -1
    //     .limit(limit)
    //     .populate('user', 'fullName email') // If user is associated
    //     .lean();

    // Option 2: Derive from recent changes in other collections (more complex)
    // This is a simplified example, real implementation would be more involved.
    const recentBookings = await Booking.find({}).sort({ createdAt: -1 }).limit(2).populate('user', 'fullName').populate('bike', 'model').lean();
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(2).select('fullName email createdAt').lean();
    const recentDocs = await Document.find({ status: 'pending' }).sort({ uploadedAt: -1 }).limit(2).populate('user', 'fullName').lean();

    const activities = [];

    recentBookings.forEach(b => activities.push({
        id: `booking-${b._id}`,
        type: 'NEW_BOOKING',
        description: `New booking for ${b.bike?.model || 'a bike'} by ${b.user?.fullName || 'a user'}.`,
        timestamp: b.createdAt,
        relatedInfo: { bookingId: b._id, userName: b.user?.fullName }
    }));
    recentUsers.forEach(u => activities.push({
        id: `user-${u._id}`,
        type: 'NEW_USER',
        description: `New user registered: ${u.fullName || u.email}.`,
        timestamp: u.createdAt,
        relatedInfo: { userId: u._id, userName: u.fullName }
    }));
     recentDocs.forEach(d => activities.push({
        id: `doc-${d._id}`,
        type: 'DOC_SUBMITTED',
        description: `Document (${d.documentType} ${d.documentSide || ''}) submitted by ${d.user?.fullName || 'a user'}.`,
        timestamp: d.uploadedAt || d.createdAt,
        relatedInfo: { documentId: d._id, userName: d.user?.fullName }
    }));

    // Sort all collected activities by timestamp and take the limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);


    res.status(200).json({ success: true, data: limitedActivities });
});