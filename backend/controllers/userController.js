// controllers/userController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
// Update a user's role (by Owner)
exports.updateUserRoleByOwner = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { userId } = req.params; // <<< CORRECTED: Use userId
	const { role: newRole } = req.body;
	console.log("--- Attempting to update role ---");
	console.log("Received userId from req.params:", userId); // Now this will log the actual ID
	console.log("Received newRole from req.body:", newRole);
	const ownerId = req.user.id;

	try {
		if (!userId) {
			// Good to add a check if userId is somehow still undefined
			return res
				.status(400)
				.json({ message: "User ID parameter is missing." });
		}

		if (userId === ownerId) {
			// Use userId consistently
			return res.status(403).json({
				message:
					"Owners cannot change their own role via this endpoint.",
			});
		}

		const userToUpdate = await User.findById(userId); // Use userId consistently

		if (!userToUpdate) {
			return res
				.status(404)
				.json({ message: "User to update not found" });
		}

		userToUpdate.role = newRole;
		await userToUpdate.save();

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

exports.getAllUsersForOwnerByOwner = async (req, res) => {
	// Renamed for clarity if in userController
	// ... (Implement logic similar to the Mongoose example I provided for getAllUsersForOwner)
	// This will involve User.find(), User.countDocuments(), pagination, filtering by role/search
	// You'll need to decide if "owner" in this context means filtering by some ownerId or if it's an admin-like view
	// For now, let's assume it's similar to the admin view of users but could be restricted later.
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 15;
	const skip = (page - 1) * limit;
	const filterQuery = {};
	if (req.query.role && req.query.role !== "all") {
		filterQuery.role = req.query.role;
	}
	if (req.query.search) {
		const searchRegex = { $regex: req.query.search, $options: "i" };
		filterQuery.$or = [{ fullName: searchRegex }, { email: searchRegex }];
	}
	let sortOptions = { createdAt: -1 };
	if (req.query.sortBy) {
		/* ... build sortOptions ... */
	}

	try {
		const users = await User.find(filterQuery)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit)
			.select("-password")
			.lean();
		const totalUsers = await User.countDocuments(filterQuery);
		res.status(200).json({
			success: true,
			data: users,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalUsers / limit),
				totalItems: totalUsers,
				limit,
			},
			message: "Users fetched successfully",
		});
	} catch (error) {
		console.error("Error in getAllUsersForOwnerByOwner:", error);
		res.status(500).json({
			success: false,
			message: "Server error fetching users.",
		});
	}
};
