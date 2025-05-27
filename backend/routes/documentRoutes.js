// routes/documentRoutes.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator"); // For future validation

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const { isOwner } = require("../middleware/ownerMiddleware");
const { isAdminOrOwner } = require("../middleware/isAdminOrOwnerMiddleware");
// const upload = require('../middleware/uploadMiddleware'); // We'll need a multer instance for document uploads

// Placeholder for multer setup for document uploads
const multer = require("multer");
const uploadDocument = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 1024 * 1024 * 5 },
}); // Example

// Import controller function shells (we'll create these next)
const {
	uploadUserDocument,
	getUserDocuments,
	getAllDocumentsForReview,
	getDocumentByIdForReview,
	updateDocumentStatusByOwner,
} = require("../controllers/documentController");

// --- User Document Routes ---
// User uploads their own document
// POST /api/documents/me
router.post(
	"/me",
	[protect, uploadDocument.single("documentFile")], // 'documentFile' is the field name for the file
	uploadUserDocument
);

// User views their own documents
// GET /api/documents/me
router.get("/me", protect, getUserDocuments);

// --- Admin/Owner Document Management Routes ---
// Admin/Owner lists documents (Admins see only 'approved')
// GET /api/documents/
router.get("/", [protect, isAdminOrOwner], getAllDocumentsForReview);

// Admin/Owner views a specific document (Admins see only if 'approved')
// GET /api/documents/:docId
router.get(
	"/:docId",
	[protect, isAdminOrOwner, param("docId").isMongoId()],
	getDocumentByIdForReview
);

// Owner updates document status (approve/reject)
// PUT /api/documents/:docId/status
router.put(
	"/:docId/status",
	[
		protect,
		isOwner,
		param("docId").isMongoId(),
		body("status")
			.isIn(["approved", "rejected"])
			.withMessage("Status must be 'approved' or 'rejected'"),
		body("reviewComments").optional().isString().trim(),
	],
	updateDocumentStatusByOwner
);
router.post(
	"/me",
	[
		protect,
		uploadDocument.single("documentFile"), // 'documentFile' is the field name for the file
		// Add validation for documentType and documentSide from req.body
		body("documentType")
			.not()
			.isEmpty()
			.withMessage("Document type is required.")
			.isIn(["drivers_license", "id_card", "passport", "other"]) // Use the enum from your Document schema
			.withMessage("Invalid document type."),
		body("documentSide")
			.optional()
			.isIn(["front", "back", ""]) // Allow empty string if sent, will be treated as null by controller
			.withMessage("Invalid document side."),
	],
	uploadUserDocument
);

module.exports = router;
