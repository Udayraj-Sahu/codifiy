// utils/notificationManager.js

// In a real app, you would install and use 'expo-server-sdk-node'
// const { Expo } = require('expo-server-sdk');
// let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN }); // If using access token

// For now, we will simulate sending notifications
const sendPushNotification = async (pushToken, title, body, data = {}) => {
    if (!pushToken) {
        console.log("No push token provided for user. Skipping notification.");
        return;
    }

    // Basic check for valid Expo token format (optional)
    if (!Expo.isExpoPushToken(pushToken)) { // Assuming Expo SDK is imported
         console.error(`Push token ${pushToken} is not a valid Expo push token. Skipping.`);
         return;
    }

    const message = {
        to: pushToken,
        sound: 'default', // or null for no sound
        title: title,
        body: body,
        data: data, // e.g., { screen: 'BookingDetails', bookingId: '123' }
        // Other options: badge, ttl, priority, channelId (Android), etc.
    };

    console.log("---- SIMULATING PUSH NOTIFICATION ----");
    console.log("To:", message.to);
    console.log("Title:", message.title);
    console.log("Body:", message.body);
    console.log("Data:", message.data);
    console.log("--------------------------------------");

    // In a real implementation with expo-server-sdk:
    /*
    try {
        // Construct a message (see https://docs.expo.dev/push-notifications/sending-notifications/)
        // let messages = [{
        //     to: pushToken,
        //     sound: 'default',
        //     title: title,
        //     body: body,
        //     data: data,
        // }];

        // The Expo push notification service accepts batches of messages, so you could send multiple.
        // let chunks = expo.chunkPushNotifications(messages);
        // let tickets = [];

        // for (let chunk of chunks) {
        //     try {
        //         let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        //         tickets.push(...ticketChunk);
        //         // NOTE: If a ticket contains an error code in ticket.details.error, you must handle it appropriately.
        //         // Expo docs recommend error handling for tickets.
        //     } catch (error) {
        //         console.error('Error sending push notification chunk:', error);
        //     }
        // }
        // console.log("Push notification tickets:", tickets);
        // You can then check ticket statuses later if needed.

    } catch (error) {
        console.error("Error preparing or sending push notification:", error);
    }
    */
    // For simulation, we just log.
    return Promise.resolve(); // Simulate async operation
};

// Helper function to get user and then send notification
const notifyUser = async (userId, title, body, data = {}) => {
    if (!userId) return;
    try {
        const user = await User.findById(userId).select('expoPushToken');
        if (user && user.expoPushToken) {
            await sendPushNotification(user.expoPushToken, title, body, data);
        } else if (user) {
            console.log(`User ${userId} does not have a push token registered.`);
        } else {
            console.log(`User ${userId} not found for notification.`);
        }
    } catch (error) {
        console.error(`Error fetching user ${userId} for notification:`, error);
    }
};


module.exports = { sendPushNotification, notifyUser };