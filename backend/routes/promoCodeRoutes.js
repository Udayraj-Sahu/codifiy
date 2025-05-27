// routes/promoCodeRoutes.js
const express = require("express");
const router = express.Router();
const {
	createPromoCode,
	// ... other promo code controller functions

	getAllPromoCodes: getAllPromoCodesAdmin, // <<< This alias means you need 'getAllPromoCodes' in your controller
	getPromoCodeById: getPromoCodeByIdAdmin, // Assuming this is the admin/owner version
	updatePromoCode,
	deletePromoCode,
	getAvailablePromoCodesForUser,
	applyPromoCode,
} = require("../controllers/promoCodeController"); // Adjust path
const { protect } = require("../middleware/authMiddleware"); // Your protect middleware
const { isOwner } = require("../middleware/ownerMiddleware"); // Your isOwner middleware
const { isAdminOrOwner } = require("../middleware/isAdminOrOwnerMiddleware"); // Your isAdminOrOwner middleware
// const { authorize } = require('../middleware/roleMiddleware'); // My generic one, replaced by yours

// --- Admin/Owner Promo Code Routes ---

// @route   POST /api/promocodes
// @desc    Owner: Create a new promo code
// @access  Private (Owner only)
router.post("/", protect, isOwner, createPromoCode); // <<< MODIFIED HERE to use isOwner

// For other admin/owner promo routes, use isAdminOrOwner or isOwner as appropriate
// @route   GET /api/promocodes/admin-all
// @desc    Admin/Owner: Get all promo codes
// @access  Private (Admin/Owner)
router.get("/admin-all", protect, isAdminOrOwner, getAllPromoCodesAdmin);

// @route   GET /api/promocodes/admin/:promoCodeId
// @desc    Admin/Owner: Get a promo code by ID
// @access  Private (Admin/Owner)
router.get(
	"/admin/:promoCodeId",
	protect,
	isAdminOrOwner,
	getPromoCodeByIdAdmin
);

// @route   PUT /api/promocodes/:promoCodeId
// @desc    Admin/Owner: Update a promo code (assuming both can update, or use isOwner if only owner)
// @access  Private (Admin/Owner)
router.put("/:promoCodeId", protect, isAdminOrOwner, updatePromoCode); // Or isOwner

// @route   DELETE /api/promocodes/:promoCodeId
// @desc    Admin/Owner: Delete a promo code (assuming both can delete, or use isOwner if only owner)
// @access  Private (Admin/Owner)
router.delete("/:promoCodeId", protect, isAdminOrOwner, deletePromoCode); // Or isOwner

// --- User Promo Code Routes ---
router.get("/available", protect, getAvailablePromoCodesForUser);
router.post("/apply", protect, applyPromoCode);

module.exports = router;
