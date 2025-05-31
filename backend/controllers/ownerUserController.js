// routes/ownerUserRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // Assuming 'protect' is correctly defined and exported

// Option A: If you intend to use userController.js for owner-specific user actions
// const { updateUserRoleByOwner, /* you still need a function here for GET / */ } = require("../controllers/userController");
// const getAllUsersForOwnerHandler = /* ... define or import this ... */;
// const updateUserRoleHandler = updateUserRoleByOwner; // Alias if needed

// Option B: If you are creating a dedicated ownerUserController.js (as per previous suggestions)
// This is generally cleaner for separating owner-specific logic.
const { getAllUsersForOwner, updateUserRole } = require("../controllers/ownerUserController"); // Ensure this file and functions exist

// @desc   Get all users for an owner (with filters/pagination)
// @route  GET /
// @access Private/Owner (Protection via 'protect', specific owner check inside controller if needed)
router.route("/").get(
    protect,
    // authorizeOwner, // REMOVED - as it's not defined
    getAllUsersForOwner // This function must be correctly defined and exported
);

// @desc   Update a user's role by an owner
// @route  PUT /:userId/role
// @access Private/Owner
router.route("/:userId/role").put(
    protect,
    // authorizeOwner, // REMOVED
    updateUserRole // This function must be correctly defined and exported. Could be an alias for updateUserRoleByOwner.
);

module.exports = router;