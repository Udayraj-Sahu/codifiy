// controllers/authController.js
const User = require("../models/User"); // Import the User model
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const asyncHandler = require('express-async-handler');

// Helper function to generate JWT
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d", // Token expires in 30 days
	});
};

// Controller for User Signup
exports.signupUser = async (req, res) => {
	// 1. Check for validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { fullName, email, password, role } = req.body; // Role is optional, defaults in schema

	try {
		// 2. Check if user already exists
		let user = await User.findOne({ email });
		if (user) {
			return res
				.status(400)
				.json({ errors: [{ msg: "User already exists" }] });
		}

		// 3. Create new user instance (password will be hashed by pre-save hook in User model)
		user = new User({
			fullName,
			email,
			password,
			role, // If role is not provided, it will use the default from the schema
		});

		// 4. Save user to database
		await user.save();

		// 5. Generate JWT
		const token = generateToken(user._id);

		// 6. Send response
		res.status(201).json({
			token,
			user: {
				id: user._id,
				fullName: user.fullName,
				email: user.email,
				role: user.role,
			},
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error during signup");
	}
};
exports.updateUserPushToken = asyncHandler(async (req, res, next) => {
    const { token } = req.body;
    const userId = req.user.id; // From protect middleware

    if (!token || typeof token !== 'string') {
        res.status(400);
        throw new Error('Push token is required and must be a string.');
    }

    // Basic validation for Expo token format (optional but good)
    // Expo tokens usually start with ExponentPushToken[...] or similar
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        // Note: Format might vary or other services might be used. This is a basic check.
        // Consider if you need to support other token types or be less strict.
        console.warn(`Received potentially invalid push token format: ${token}`);
        // Depending on strictness, you might throw an error or just proceed.
        // For now, let's proceed but log a warning.
    }

    const user = await User.findById(userId);

    if (!user) {
        res.status(404); // Should not happen if protect middleware works
        throw new Error('User not found.');
    }

    // If you are storing multiple tokens, the logic here would be to add to an array
    // and ensure no duplicates, or manage a list of devices.
    // For a single token:
    user.expoPushToken = token;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Push token updated successfully.',
        expoPushToken: user.expoPushToken
    });
});

exports.updateUserProfile = asyncHandler(async (req, res, next) => {
	const { fullName, phone } = req.body; // Define what fields are updatable

	// Find the user by ID from the token (populated by 'protect' middleware)
	// req.user is already selected excluding password by your 'protect' middleware
	const user = await User.findById(req.user.id);

	if (!user) {
		res.status(404); // Should not be reached if protect middleware works
		throw new Error("User not found.");
	}

	// Update allowed fields
	if (fullName !== undefined) {
		if (typeof fullName !== "string" || fullName.trim() === "") {
			res.status(400);
			throw new Error("Full name must be a non-empty string.");
		}
		user.fullName = fullName.trim();
	}

	if (phone !== undefined) {
		// Add more specific phone validation as needed
		if (typeof phone !== "string" && phone !== null && phone !== "") {
			// Allow empty string or null to clear
			res.status(400);
			throw new Error(
				"Phone must be a string, an empty string, or null."
			);
		}
		user.phone =
			phone === null || phone.trim() === "" ? undefined : phone.trim(); // Store as undefined if cleared
	}

	// Ensure email and role are not updated here
	// For password updates, create a separate dedicated endpoint

	const updatedUser = await user.save();

	res.status(200).json({
		success: true,
		message: "Profile updated successfully.",
		user: {
			id: updatedUser._id,
			fullName: updatedUser.fullName,
			email: updatedUser.email,
			role: updatedUser.role,
			phone: updatedUser.phone,
			// Add any other fields from your User model you want to return (excluding password)
		},
	});
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
	const { currentPassword, newPassword, confirmNewPassword } = req.body;

	// 1. Validate input
	if (!currentPassword || !newPassword || !confirmNewPassword) {
		res.status(400);
		throw new Error(
			"Please provide current password, new password, and confirm new password."
		);
	}

	if (newPassword !== confirmNewPassword) {
		res.status(400);
		throw new Error("New password and confirm new password do not match.");
	}

	// Add complexity/length validation for newPassword (align with your User model schema)
	if (newPassword.length < 8) {
		// Example: Assuming minlength is 8 from your User schema
		res.status(400);
		throw new Error("New password must be at least 8 characters long.");
	}
	// You can add more complexity rules here (e.g., regex for uppercase, lowercase, number, special char)

	// 2. Get user from DB (including password, as 'protect' middleware normally excludes it)
	const user = await User.findById(req.user.id).select("+password");

	if (!user) {
		// This should ideally not happen if 'protect' middleware is working
		res.status(404);
		throw new Error("User not found.");
	}

	// 3. Check if currentPassword is correct
	const isMatch = await user.matchPassword(currentPassword); // Assumes matchPassword method exists on User model

	if (!isMatch) {
		res.status(401); // Unauthorized or 400 Bad Request for incorrect current password
		throw new Error("Incorrect current password.");
	}

	// 4. Set new password (pre-save hook in User model should hash it)
	user.password = newPassword;
	await user.save();

	// It's good practice NOT to send back a new token or user object on password change.
	// The existing token remains valid until it expires.
	// You might consider invalidating other sessions/tokens here if you have such a mechanism.
	res.status(200).json({
		success: true,
		message: "Password changed successfully.",
	});
});

// Controller for User Login
exports.loginUser = async (req, res) => {
	// 1. Check for validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { email, password } = req.body;

	try {
		// 2. Find user by email (and explicitly select password for comparison)
		const user = await User.findOne({ email }).select("+password");

		// 3. Check if user exists and if password matches
		if (!user || !(await user.matchPassword(password))) {
			return res
				.status(401)
				.json({ errors: [{ msg: "Invalid credentials" }] });
		}

		// 4. Generate JWT
		const token = generateToken(user._id);

		// 5. Send response
		res.status(200).json({
			token,
			user: {
				id: user._id,
				fullName: user.fullName,
				email: user.email,
				role: user.role,
			},
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send("Server error during login");
	}
};
// controllers/authController.js
// ... (existing User, jwt, validationResult imports and generateToken, signupUser, loginUser functions)

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getUserProfile = async (req, res) => {
	// req.user is attached by the 'protect' middleware
	if (req.user) {
		res.status(200).json({
			id: req.user._id,
			fullName: req.user.fullName,
			email: req.user.email,
			role: req.user.role,
			// Add any other fields you want to return for the user profile
		});
	} else {
		// This case should ideally be caught by the protect middleware itself
		res.status(404).json({ message: "User not found" });
	}
};
