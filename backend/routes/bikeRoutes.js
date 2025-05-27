// routes/bikeRoutes.js
const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const multer = require("multer"); // Make sure multer is required

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

// Import controller functions (we'll create these next)
const {
	addBike,
	getAllBikes,
	getBikeById,
	updateBike,
	deleteBike,
	getNearbyBikes,
	getBikeDetailsForUser,
	// getBikesByAdmin (optional, if an admin wants to see only bikes they added)
} = require("../controllers/bikeController");

const storage = multer.memoryStorage(); // Or your chosen storage configuration
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ // 'upload' is defined here
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit per image
});


router.post(
	"/",
	[protect, isAdmin, upload.array("bikeImages", 5) /*...validations...*/],
	addBike
);
router.put(
	"/:id",
	[
		protect,
		isAdmin,
		param("id").isMongoId(),
		upload.array("newBikeImages", 5) /*...validations...*/,
	],
	updateBike
);
router.delete("/:id", [protect, isAdmin, param("id").isMongoId()], deleteBike);


// @route   POST /api/bikes
// @desc    Add a new bike (Admin only)
// @access  Private/Admin
router.post(
	"/",
	[
		protect,
		isAdmin,
		upload.array("bikeImages", 5),
		(req, res, next) => {
			console.log("--- DEBUG: After Multer ---");
			console.log("req.body:", req.body);
			console.log("req.files:", req.files);
			console.log("---------------------------");
			next(); // Continue to next middleware (validators)
		},
		body("model", "Model is required").not().isEmpty().trim(),
		body("category", "Category is required").not().isEmpty().trim(),
		body(
			"pricePerHour",
			"Price per hour must be a positive number"
		).isFloat({ gt: 0 }),
		body("pricePerDay", "Price per day must be a positive number").isFloat({
			gt: 0,
		}),
		// --- MODIFIED LOCATION VALIDATION ---
		body(
			"longitude",
			"Longitude is required and must be a number"
		).isFloat(),
		body("latitude", "Latitude is required and must be a number").isFloat(),
		body("address", "Address is optional").optional().isString().trim(), // Assuming address is a top-level field now
		// --- END MODIFIED LOCATION VALIDATION ---
	],
	addBike
);

router.get( // This will be accessible at /api/bikes/nearby
  '/nearby',
  [
    query('longitude', 'Longitude must be a valid floating-point number').isFloat().toFloat(),
    query('latitude', 'Latitude must be a valid floating-point number').isFloat().toFloat(),
    query('maxDistance', 'Max distance in meters must be a positive integer')
      .isInt({ min: 1 }) // Min distance 1 meter
      .toInt(),
  ],
  getNearbyBikes
);
// @route   GET /api/bikes
// @desc    Get all bikes (Public or for logged-in users)
// @access  Public (or Protected) - Let's make it public for now for users to see bikes
router.get("/", getAllBikes);

// @route   GET /api/bikes/:id
// @desc    Get a single bike by ID (Public or for logged-in users)
// @access  Public (or Protected)
router.get("/:id", [param("id", "Invalid Bike ID").isMongoId()], getBikeById);

// @route   PUT /api/bikes/:id
// @desc    Update a bike (Admin only)
// @access  Private/Admin
router.put(
	"/:id",
	[
		protect,
		isAdmin,
		param("id", "Invalid Bike ID").isMongoId(),
		upload.array("newBikeImages", 5), // <<< ADD MULTER HERE for new images (max 5)
		// Note: 'newBikeImages' is the field name for new files in form-data.
		// Text fields for update will come from req.body as usual with multipart/form-data
		body("model").optional().not().isEmpty().trim(),
		body("category").optional().not().isEmpty().trim(),
		body("pricePerHour").optional().isFloat({ gt: 0 }),
		body("pricePerDay").optional().isFloat({ gt: 0 }),
		body("longitude").optional().isFloat(),
		body("latitude").optional().isFloat(),
		body("address").optional().isString().trim(),
		body("availability").optional().isBoolean(),
		body("description").optional().isString().trim(),
	],
	updateBike
);

// @route   GET /api/bikes/nearby
// @desc    Get bikes near a specific location
// @access  Public (or Protected, depending on your needs)
router.get(
	"/nearby/bikes", // Changed path slightly to avoid conflict if you have /bikes/:id later
	// So it becomes /api/bikes/nearby/bikes. Or just /api/bikes/nearby
	// Let's use /api/bikes/nearby for simplicity.
	[
		query(
			"longitude",
			"Longitude must be a valid floating-point number"
		).isFloat(),
		query(
			"latitude",
			"Latitude must be a valid floating-point number"
		).isFloat(),
		query(
			"maxDistance",
			"Max distance in meters must be a positive integer"
		)
			.isInt({ gt: 0 })
			.toInt(), // Convert to integer
	],
	getNearbyBikes
);

// @route   DELETE /api/bikes/:id
// @desc    Delete a bike (Admin only)
// @access  Private/Admin
router.delete(
	"/:id",
	[protect, isAdmin, param("id", "Invalid Bike ID").isMongoId()],
	deleteBike
);

router.get("/", getAllBikes);
router.get("/:id", [param("id", "Invalid Bike ID").isMongoId()], getBikeById);
router.put(
	"/:id",
	[protect, isAdmin, param("id", "Invalid Bike ID").isMongoId()],
	updateBike
); // Will need multer for image updates too
router.delete(
	"/:id",
	[protect, isAdmin, param("id", "Invalid Bike ID").isMongoId()],
	deleteBike
);
module.exports = router;
