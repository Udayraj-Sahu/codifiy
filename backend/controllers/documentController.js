// controllers/documentController.js
const Document = require("../models/Document");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const {
	uploadToCloudinary,
	deleteFromCloudinary,
} = require("../utils/fileUploadUtils"); // Will be needed
const { notifyUser } = require("../utils/pushNotificationManager");
exports.uploadUserDocument = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	if (!req.file) {
		return res
			.status(400)
			.json({ errors: [{ msg: "Document file is required." }] });
	}

	const { documentType, documentSide } = req.body;
	const userId = req.user.id; // From 'protect' middleware

	try {
		// 1. Upload file to Cloudinary
		const uniqueFilename = `${userId}_${documentType}_${
			documentSide || "single"
		}_${Date.now()}`;
		const uploadResult = await uploadToCloudinary(
			req.file.buffer,
			`bikya/user_documents/${userId}`,
			uniqueFilename
		);

		// 2. Create new Document record
		const newDocument = new Document({
			user: userId,
			documentType,
			documentSide: documentSide || null, // Set to null if empty string or undefined
			fileUrl: uploadResult.url,
			public_id: uploadResult.public_id,
			status: "pending", // Default status
			uploadedAt: new Date(),
		});

		await newDocument.save();

		// 3. Add Document reference to User's documents array
		//    (Ensure User model has 'documents' array: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }])
		const user = await User.findById(userId);
		if (!user) {
			// This should not happen if 'protect' middleware works, but good check
			return res
				.status(404)
				.json({
					message: "User not found while trying to link document.",
				});
		}
		user.documents.push(newDocument._id);
		await user.save();

		res.status(201).json(newDocument);
	} catch (err) {
		console.error("Error uploading user document:", err.message);
		// Handle specific errors like Cloudinary upload failure if needed
		if (err.message && err.message.includes("Cloudinary")) {
			return res
				.status(500)
				.send("Error uploading document to cloud storage.");
		}
		if (err.name === "ValidationError") {
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		// Handle multer errors specifically if needed (e.g., file too large from route's multer config)
		if (
			err.code === "LIMIT_FILE_SIZE" ||
			(err.message && err.message.includes("Not an image"))
		) {
			// Adjust if docs aren't images
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		res.status(500).send("Server error");
	}
};

exports.getUserDocuments = async (req, res) => {
	res.status(501).json({ message: "Get user documents not implemented yet" });
	// Logic: Find documents where user: req.user._id
};

exports.getUserDocuments = async (req, res) => {
	try {
		// req.user.id is available from the 'protect' middleware
		const documents = await Document.find({ user: req.user.id }).sort({
			uploadedAt: -1,
		}); // Sort by newest first

		if (!documents) {
			// This case is unlikely with find(), it would return an empty array if no docs.
			// But good to have a check if needed for other similar queries.
			return res
				.status(404)
				.json({ message: "No documents found for this user." });
		}

		res.status(200).json(documents);
	} catch (err) {
		console.error("Error fetching user documents:", err.message);
		res.status(500).send("Server error");
	}
};

exports.getAllDocumentsForReview = async (req, res) => {
	res.status(501).json({
		message: "Get all documents for review not implemented yet",
	});
	// Logic:
	// 1. Check req.user.role
	// 2. If Owner, find all/pending documents (with pagination/filters)
	// 3. If Admin, find only 'approved' documents (with pagination/filters)
};

exports.getDocumentByIdForReview = async (req, res) => {
	const errors = validationResult(req); // Handles param('docId').isMongoId() from route
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { role } = req.user;
		const document = await Document.findById(req.params.docId)
			.populate("user", "fullName email")
			.populate("reviewedBy", "fullName email");

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		// Apply role-based access control
		if (role === "Admin" && document.status !== "approved") {
			// Admins can only view 'approved' documents.
			// Return 403 (Forbidden) or 404 (Not Found) to obscure existence from Admin.
			// Let's use 403 for clarity that the resource exists but they can't access it in this state.
			return res
				.status(403)
				.json({ message: "Admins can only view approved documents." });
		}

		// Owners can view documents regardless of status (already checked by isAdminOrOwner middleware)
		res.status(200).json(document);
	} catch (err) {
		console.error("Error fetching document by ID for review:", err.message);
		// isMongoId validator should catch invalid ID formats before this,
		// but this handles other potential errors.
		if (err.kind === "ObjectId") {
			// Should be caught by validator, but as a fallback
			return res
				.status(404)
				.json({ message: "Document not found (invalid ID format)" });
		}
		res.status(500).send("Server error");
	}
};
exports.updateDocumentStatusByOwner = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { docId } = req.params;
	const { status, reviewComments } = req.body; // status is 'approved' or 'rejected'

	try {
		const document = await Document.findById(docId);

		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}

		// Optional: Add business logic, e.g., only 'pending' documents can be updated.
		if (document.status !== "pending") {
			return res.status(400).json({
				message: `Document is already '${document.status}' and cannot be updated. Only pending documents can be reviewed.`,
			});
		}

		document.status = status;
		document.reviewedBy = req.user._id; // req.user is the authenticated Owner
		document.reviewTimestamp = new Date();

		if (reviewComments) {
			document.reviewComments = reviewComments;
		} else {
			// If you want to clear comments if none are provided in an update
			document.reviewComments = undefined;
		}

		const updatedDocument = await document.save();
		res.status(200).json(updatedDocument);

		if (updatedDocument.user) {
			const title = `Document ${
				updatedDocument.status.charAt(0).toUpperCase() +
				updatedDocument.status.slice(1)
			}!`;
			let body = `Your ${updatedDocument.documentType.replace(
				"_",
				" "
			)} has been ${updatedDocument.status}.`;
			if (
				updatedDocument.status === "rejected" &&
				updatedDocument.reviewComments
			) {
				body += ` Reason: ${updatedDocument.reviewComments}`;
			}
			const data = {
				screen: "MyDocuments",
				documentId: updatedDocument._id.toString(),
			};
			await notifyUser(updatedDocument.user, title, body, data);
		}

		res.status(200).json(updatedDocument);
	} catch (err) {
		console.error("Error updating document status:", err.message);
		if (err.kind === "ObjectId") {
			return res
				.status(404)
				.json({ message: "Document not found (invalid ID format)" });
		}
		res.status(500).send("Server error");
	}
};
exports.getAllDocumentsForReview = async (req, res) => {
	try {
		const { role } = req.user; // From 'protect' middleware

		// Basic query options (can be extended with req.query for pagination, status filter for Owner, etc.)
		const query = {};
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 10;
		const skip = (page - 1) * limit;

		let statusFilter = req.query.status;

		if (role === "Admin") {
			// Admins can only see 'approved' documents, regardless of query filter.
			query.status = "approved";
			// If admin specifically queries for a status other than approved, they get nothing for that filter
			if (statusFilter && statusFilter !== "approved") {
				// Or, you could choose to ignore admin's statusFilter if it's not 'approved'
				// For now, let's say admin can only ever see approved, so other status filters yield no results for them
				return res.status(200).json({
					data: [],
					pagination: {
						currentPage: 1,
						totalPages: 0,
						totalDocuments: 0,
						limit,
					},
				});
			}
		} else if (role === "Owner") {
			// Owners can filter by status if provided, otherwise see all
			if (
				statusFilter &&
				["pending", "approved", "rejected"].includes(statusFilter)
			) {
				query.status = statusFilter;
			}
		}
		// If any other role somehow gets here (should be blocked by isAdminOrOwner middleware),
		// they see nothing, or you could throw a 403, but middleware should handle.

		const documents = await Document.find(query)
			.populate("user", "fullName email") // Populate user who uploaded
			.populate("reviewedBy", "fullName email") // Populate user who reviewed
			.sort({ createdAt: -1 }) // Sort by newest first, or make configurable
			.skip(skip)
			.limit(limit);

		const totalDocuments = await Document.countDocuments(query);
		const totalPages = Math.ceil(totalDocuments / limit);

		res.status(200).json({
			data: documents,
			pagination: {
				currentPage: page,
				totalPages,
				totalDocuments,
				limit,
			},
		});
	} catch (err) {
		console.error("Error fetching all documents for review:", err.message);
		res.status(500).send("Server error");
	}
};
exports.updateDocumentStatusByOwner = async (req, res) => {
	// ... (previously implemented code) ...
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	const { docId } = req.params;
	const { status, reviewComments } = req.body;
	try {
		const document = await Document.findById(docId);
		if (!document) {
			return res.status(404).json({ message: "Document not found" });
		}
		if (document.status !== "pending") {
			return res
				.status(400)
				.json({
					message: `Document is already '${document.status}' and cannot be updated. Only pending documents can be reviewed.`,
				});
		}
		document.status = status;
		document.reviewedBy = req.user._id;
		document.reviewTimestamp = new Date();
		if (reviewComments) {
			document.reviewComments = reviewComments;
		} else {
			document.reviewComments = undefined;
		}
		const updatedDocument = await document.save();
		res.status(200).json(updatedDocument);
	} catch (err) {
		console.error("Error updating document status:", err.message);
		if (err.kind === "ObjectId") {
			return res
				.status(404)
				.json({ message: "Document not found (invalid ID format)" });
		}
		res.status(500).send("Server error");
	}
};
exports.getUserDocuments = async (req, res) => {
	try {
		const documents = await Document.find({ user: req.user.id }).sort({
			uploadedAt: -1,
		});
		res.status(200).json(documents);
	} catch (err) {
		console.error("Error fetching user documents:", err.message);
		res.status(500).send("Server error");
	}
};
