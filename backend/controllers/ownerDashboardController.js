// backend/controllers/ownerDashboardController.js
const asyncHandler = require("express-async-handler");
const Bike = require("../models/Bike");
const User = require("../models/User");
const Booking = require("../models/booking");
const Document = require("../models/Document");
// const ActivityLog = require("../models/ActivityLog"); // If you create this model

/**
 * @desc    Get Owner Dashboard Statistics
 * @route   GET /api/owner/dashboard/statistics
 * @access  Private/Owner
 */
exports.getOwnerDashboardStatistics = asyncHandler(async (req, res) => {
    console.log("--- ownerDashboardController: getOwnerDashboardStatistics HIT ---");
    // Example Stats (Adjust to what an Owner should see)
    // For an owner, stats might be scoped to their bikes or their specific activities
    // This is a simplified example, you'll need to define owner-specific logic.

    // Assuming req.user.id is the owner's ID
    const ownerId = req.user.id;

    // Example: Count bikes added by this owner (if 'addedBy' field exists and is indexed)
    // const totalBikes = await Bike.countDocuments({ addedBy: ownerId });

    // Example: Count bookings related to bikes owned by this owner (more complex query)
    // This requires bikes to have an 'owner' field.
    // const ownerBikes = await Bike.find({ owner: ownerId }).select('_id');
    // const ownerBikeIds = ownerBikes.map(b => b._id);
    // const activeBookings = await Booking.countDocuments({ bike: { $in: ownerBikeIds }, status: { $in: ['confirmed', 'ongoing'] } });

    // Example: Documents submitted to this owner for review (if documents are linked to owners directly)
    // OR total documents related to users interacting with owner's bikes.
    // This example is generic, as 'pendingDocuments' for an owner might mean something different
    // than for an admin.
    // const pendingDocuments = await Document.countDocuments({ status: 'pending' /* additional owner-specific filters */ });

    // These are placeholders; you need to define what an owner's KPIs are.
    const stats = {
        totalBikes: 0, // Replace with actual query
        activeBookings: 0, // Replace with actual query
        pendingDocuments: 0, // Replace with actual query
        // totalUsers: 0, // Unlikely an owner stat unless they manage users directly for their bikes
    };
    console.log("Owner dashboard stats calculated:", stats);
    res.status(200).json({ success: true, data: stats });
});

/**
 * @desc    Get Owner Recent Activity
 * @route   GET /api/owner/dashboard/recent-activity
 * @access  Private/Owner
 */
exports.getOwnerRecentActivity = asyncHandler(async (req, res) => {
    console.log("--- ownerDashboardController: getOwnerRecentActivity HIT ---");
    const limit = parseInt(req.query.limit, 10) || 5;
    const ownerId = req.user.id;

    // Fetch activities relevant to the owner.
    // This highly depends on how you structure your ActivityLog or derive activities.
    // Example: If ActivityLog has an 'owner' field or related entities link back to owner.
    // const activities = await ActivityLog.find({ owner: ownerId /* or other relevant filters */ })
    //     .sort({ timestamp: -1 })
    //     .limit(limit)
    //     .populate('user', 'fullName') // User related to activity
    //     .lean();

    // Placeholder data for now
    const activities = [
        { id: "o_act1", type: "DOC_APPROVED", message: "You approved User X's license.", timestamp: new Date().toISOString(), relatedDetails: { documentId: "doc123"} },
        { id: "o_act2", type: "NEW_BOOKING_ON_YOUR_BIKE", message: "New booking for your Pulsar 150.", timestamp: new Date(Date.now() - 3600000).toISOString(), relatedDetails: { bookingId: "book456" } },
    ];
     console.log(`Owner recent activity fetched (limit ${limit}):`, activities.length);
    res.status(200).json({ success: true, data: activities });
});