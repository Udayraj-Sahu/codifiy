// backend/models/Notification.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: { // The user who receives the notification
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: { // The main message content
        type: String,
        required: true,
        trim: true,
    },
    data: { // Optional data for deep linking or context
        type: Object, // e.g., { screen: 'BookingDetails', bookingId: '123' }
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
    type: { // Optional: To categorize notifications (e.g., 'booking', 'promo', 'system')
        type: String,
        trim: true,
    },
    // You might also want an icon or image URL associated with the notification type
    // iconUrl: String,
}, { timestamps: true }); // Adds createdAt and updatedAt

notificationSchema.index({ user: 1, createdAt: -1 }); // Efficient querying for a user's notifications

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;