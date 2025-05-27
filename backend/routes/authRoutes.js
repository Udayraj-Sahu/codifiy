// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator"); // For input validation

// We'll import controller functions once they are created
const {
	signupUser,
	loginUser,
	getUserProfile,
	updateUserProfile,
	changeUserPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
	"/signup",
	[
		// Validation middleware using express-validator
		body("fullName", "Full name is required").not().isEmpty().trim(),
		body("email", "Please include a valid email")
			.isEmail()
			.normalizeEmail(),
		body(
			"password",
			"Password must be at least 6 characters long"
		).isLength({ min: 6 }),
	],
	signupUser // This controller function will handle the request
);

router.put(
	"/change-password",
	protect,
	/* validateChangePassword, */ changeUserPassword
);
router.put(
	"/me/update",
	protect,
	/* validateProfileUpdate, */ updateUserProfile
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token (login)
// @access  Public
router.post(
	"/login",
	[
		// Validation middleware
		body("email", "Please include a valid email")
			.isEmail()
			.normalizeEmail(),
		body("password", "Password is required").exists(), // or not().isEmpty()
	],
	loginUser // This controller function will handle the request
);
router.get(
	"/me",
	protect, // Apply the protect middleware here
	getUserProfile
);

module.exports = router;
