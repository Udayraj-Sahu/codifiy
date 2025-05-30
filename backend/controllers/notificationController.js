// backend/controllers/notificationController.js
const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification"); // Adjust path if your model is elsewhere
const mongoose = require("mongoose");

/**
 * @desc    Get notifications for the logged-in user
 * @route   GET /api/notifications/me
 * @access  Private
 */
exports.getUserNotifications = asyncHandler(async (req, res) => {
	  console.log("--- !!! REACHED backend/controllers/notificationController.js -> getUserNotifications !!! ---"); // <<< ADD THIS
    const userId = req.user.id;
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 15; // Default to 15 notifications per page
	const skip = (page - 1) * limit;

	const query = { user: userId };

	const notifications = await Notification.find(query)
		.sort({ createdAt: -1 }) // Newest first
		.skip(skip)
		.limit(limit)
		.lean(); // Use lean for faster reads if you don't need Mongoose document methods

	const totalNotifications = await Notification.countDocuments(query);
	const unreadCount = await Notification.countDocuments({
		user: userId,
		isRead: false,
	});
	const totalPages = Math.ceil(totalNotifications / limit);

	res.status(200).json({
		success: true,
		count: notifications.length,
		total: totalNotifications,
		unreadCount,
		pagination: {
			currentPage: page,
			totalPages,
			limit,
		},
		data: notifications,
	});
});

/**
 * @desc    Mark a specific notification as read
 * @route   PUT /api/notifications/:notificationId/read
 * @access  Private
 */
exports.markNotificationAsRead = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const { notificationId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(notificationId)) {
		res.status(400);
		throw new Error("Invalid Notification ID format.");
	}

	const notification = await Notification.findOne({
		_id: notificationId,
		user: userId,
	});

	if (!notification) {
		res.status(404);
		throw new Error("Notification not found or user not authorized.");
	}

	if (notification.isRead) {
		return res.status(200).json({
			success: true,
			message: "Notification was already marked as read.",
			data: notification,
		});
	}

	notification.isRead = true;
	notification.readAt = new Date();
	const updatedNotification = await notification.save();

	res.status(200).json({
		success: true,
		message: "Notification marked as read.",
		data: updatedNotification,
	});
});

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllNotificationsAsRead = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const result = await Notification.updateMany(
		{ user: userId, isRead: false },
		{ $set: { isRead: true, readAt: new Date() } }
	);

	res.status(200).json({
		success: true,
		message: `${result.modifiedCount} notifications marked as read.`,
		data: {
			acknowledged: result.acknowledged,
			modifiedCount: result.modifiedCount,
		},
	});
});

/**
 * @desc    (Optional) Delete a specific notification
 * @route   DELETE /api/notifications/:notificationId
 * @access  Private
 */
// exports.deleteNotification = asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const { notificationId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(notificationId)) {
//         res.status(400);
//         throw new Error("Invalid Notification ID format.");
//     }

//     const notification = await Notification.findOne({ _id: notificationId, user: userId });

//     if (!notification) {
//         res.status(404);
//         throw new Error("Notification not found or user not authorized.");
//     }

//     await notification.remove(); // Or findByIdAndDelete

//     res.status(200).json({
//         success: true,
//         message: "Notification deleted successfully.",
//     });
// });

// --- Helper for creating notifications internally (call this from other controllers) ---
// This is not an API endpoint itself but a utility function
exports.createNotificationForUser = async (
	userId,
	title,
	body,
	data = {},
	type = "general"
) => {
	if (!userId || !title || !body) {
		console.error(
			"Cannot create notification: userId, title, and body are required."
		);
		return null;
	}
	try {
		const notification = new Notification({
			user: userId,
			title,
			body,
			data,
			type,
		});
		await notification.save();
		console.log(`Notification created for user ${userId}: ${title}`);

		// Here, you would also trigger a push notification
		// const user = await User.findById(userId).select('expoPushToken');
		// if (user && user.expoPushToken) {
		//   await sendPushNotification(user.expoPushToken, title, body, data);
		// }

		return notification;
	} catch (error) {
		console.error("Error creating notification internally:", error);
		return null;
	}
};
