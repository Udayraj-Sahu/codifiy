// controllers/userController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");
const asyncHandler = require('express-async-handler');
// Update a user's role (by Owner)
exports.updateUserRoleByOwner = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { targetUserId } = req.params;
	const { role: newRole } = req.body; // newRole will be 'User' or 'Admin' due to validator

	// The user performing the action (the Owner) is req.user
	const ownerId = req.user.id;

	try {
		// Prevent Owner from changing their own role via this endpoint to avoid self-lockout
		// (especially if they are the only Owner - more complex logic for "last owner" not included here)
		if (targetUserId === ownerId) {
			return res.status(403).json({
				message:
					"Owners cannot change their own role via this endpoint.",
			});
		}

		const userToUpdate = await User.findById(targetUserId);

		if (!userToUpdate) {
			return res
				.status(404)
				.json({ message: "User to update not found" });
		}

		// Additional safety: Prevent changing another Owner's role to something else
		// if (userToUpdate.role === 'Owner' && userToUpdate.id !== ownerId) {
		//   return res.status(403).json({ message: "Cannot change another Owner's role." });
		// }
		// For now, the isIn(['User', 'Admin']) validator prevents setting role to 'Owner' anyway.

		userToUpdate.role = newRole;
		await userToUpdate.save();

		// Return the updated user (excluding password)
		const userResponse = {
			id: userToUpdate._id,
			fullName: userToUpdate.fullName,
			email: userToUpdate.email,
			role: userToUpdate.role,
		};

		res.status(200).json(userResponse);
	} catch (err) {
		console.error("Error updating user role:", err.message);
		if (err.kind === "ObjectId") {
			return res.status(404).json({
				message: "User to update not found (invalid ID format)",
			});
		}
		res.status(500).send("Server error");
	}
};
exports.updateUserPushToken = asyncHandler(async (req, res, next) => {
	const { token } = req.body; // The push token sent from the client
	const userId = req.user.id; // From 'protect' middleware

	// Validate that token is provided
	// express-validator in the route definition already checks if 'token' is not empty and is a string
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	// Optional: Basic validation for Expo token format (can be more robust)
	// Expo tokens usually start with ExponentPushToken[...] or ExpoPushToken[...]
	if (
		token &&
		!token.startsWith("ExponentPushToken[") &&
		!token.startsWith("ExpoPushToken[")
	) {
		console.warn(
			`Received a push token with an unexpected format: ${token} for user ${userId}`
		);
		// Depending on your requirements, you might choose to reject it or accept it.
		// For now, we'll accept it but log a warning.
	}

	const user = await User.findById(userId);

	if (!user) {
		// This case should ideally be caught by the 'protect' middleware,
		// but it's a good safeguard.
		res.status(404);
		throw new Error("User not found.");
	}

	// Update the user's push token
	// If you decide to support multiple tokens per user, this logic would change
	// to add the token to an array, ensuring no duplicates, etc.
	user.expoPushToken = token; // Assuming 'expoPushToken' is a field in your User model
	await user.save();

	res.status(200).json({
		success: true,
		message: "Push token updated successfully.",
		expoPushToken: user.expoPushToken, // Send back the saved token
	});
});
