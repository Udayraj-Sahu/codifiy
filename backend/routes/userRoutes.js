// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const { isOwner } = require("../middleware/ownerMiddleware"); // Our new middleware
// const { isAdmin } = require('../middleware/adminMiddleware'); // Could be used for other user routes

// Import controller functions (we'll create this controller and function next)
const {
	updateUserRoleByOwner,
	updateUserPushToken,
} = require("../controllers/userController");

// @route   PUT /api/users/:targetUserId/role
// @desc    Update a user's role (Owner only)
// @access  Private/Owner
router.put(
	"/:targetUserId/role", // <<< If line 33 is here, the problem is with 'updateUserRoleByOwner'
	[
		protect,
		isOwner,
		param("targetUserId", "Valid User ID is required").isMongoId(),
		body("role", "Role must be 'User' or 'Admin'")
			.isString()
			.isIn(["User", "Admin"]),
	],
	updateUserRoleByOwner
);
router.put(
	"/me/push-token",
	protect,
	[body("token", "Push token is required").not().isEmpty().isString().trim()],
	updateUserPushToken // Use it here
);

// You could add other user management routes here later, e.g.,
// GET /api/users (for Admin/Owner to list users)
// DELETE /api/users/:targetUserId (for Admin/Owner to delete a user)

module.exports = router;
