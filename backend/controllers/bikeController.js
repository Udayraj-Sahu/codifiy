// controllers/bikeController.js
const Bike = require("../models/Bike");
const { validationResult } = require("express-validator");
// const cloudinary = require('../config/cloudinary'); // We'll set this up later for image uploads
// const fs = require('fs'); // File system module, if processing files locally first
const {
	uploadToCloudinary,
	deleteFromCloudinary,
} = require("../utils/fileUploadUtils");
// Add a new bike (Admin only)
exports.addBike = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	// Destructure bike details from request body
	// For image uploads with multer, req.files would contain image data.
	// For now, let's assume 'images' in req.body could be an array of URLs (placeholder)
	const {
		model,
		category,
		pricePerHour,
		pricePerDay,
		longitude,
		latitude,
		address,
		availability,
		description,
	} = req.body;

	try {
		const uploadedImagesData = []; // Initialize an array to store image objects
		if (req.files && req.files.length > 0) {
			for (const file of req.files) {
				const uniqueFilename = `${Date.now()}_${
					file.originalname.split(".")[0]
				}`;
				const result = await uploadToCloudinary(
					file.buffer,
					"bikya/bikes",
					uniqueFilename
				);
				// Push an object with url and public_id
				uploadedImagesData.push({
					url: result.url,
					public_id: result.public_id,
				});
			}
		}

		const locationObject = {
			type: "Point",
			coordinates: [parseFloat(longitude), parseFloat(latitude)], // Ensure they are numbers
		};
		if (address) {
			locationObject.address = address;
		}
		const newBike = new Bike({
			model,
			category,
			pricePerHour,
			pricePerDay,
			location: locationObject,
			images: uploadedImagesData, // Use URLs from Cloudinary
			availability,
			description,
			addedBy: req.user._id,
		});

		const bike = await newBike.save();
		res.status(201).json(bike);
	} catch (err) {
		console.error("Error adding bike:", err.message);
		if (err.name === "ValidationError") {
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		// Handle multer errors specifically if needed (e.g., file too large)
		if (err.code === "LIMIT_FILE_SIZE") {
			return res.status(400).json({
				errors: [{ msg: "File too large. Max 5MB allowed." }],
			});
		}
		if (err.message === "Not an image! Please upload only images.") {
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		res.status(500).send("Server error");
	}
};

// Get all bikes
exports.getAllBikes = async (req, res) => {
	try {
		// TODO: Add filtering (by category, availability, location) and pagination
		const bikes = await Bike.find().populate("addedBy", "fullName email"); // Populate admin details
		res.status(200).json(bikes);
	} catch (err) {
		console.error("Error fetching bikes:", err.message);
		res.status(500).send("Server error");
	}
};

// Get a single bike by ID
exports.getBikeById = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	try {
		const bike = await Bike.findById(req.params.id).populate(
			"addedBy",
			"fullName email"
		);
		if (!bike) {
			return res.status(404).json({ msg: "Bike not found" });
		}
		res.status(200).json(bike);
	} catch (err) {
		console.error("Error fetching bike by ID:", err.message);
		if (err.kind === "ObjectId") {
			// Handle invalid ObjectId format for ID
			return res
				.status(404)
				.json({ msg: "Bike not found (invalid ID format)" });
		}
		res.status(500).send("Server error");
	}
};

// Update a bike (Admin only)
exports.updateBike = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		let bike = await Bike.findById(req.params.id);
		if (!bike) {
			return res.status(404).json({ msg: "Bike not found" });
		}

		const {
			model,
			category,
			pricePerHour,
			pricePerDay,
			longitude,
			latitude,
			address,
			availability,
			description,
			imagesToDeletePublicIds,
		} = req.body;

		let currentImages = [...bike.images]; // Copy current images
		let publicIdsActuallyDeleted = [];

		// Step 1: Process images to delete
		if (imagesToDeletePublicIds) {
			let idsToDelete;
			try {
				idsToDelete = JSON.parse(imagesToDeletePublicIds); // Parse the JSON string array
				if (!Array.isArray(idsToDelete))
					throw new Error("Not an array");
			} catch (parseError) {
				return res.status(400).json({
					errors: [
						{
							msg: "imagesToDeletePublicIds must be a valid JSON array string",
						},
					],
				});
			}

			if (idsToDelete.length > 0) {
				const deletionPromises = [];
				// Filter out images to be deleted from currentImages and collect public_ids for Cloudinary deletion
				const remainingImages = currentImages.filter((img) => {
					if (idsToDelete.includes(img.public_id)) {
						deletionPromises.push(
							deleteFromCloudinary(img.public_id)
						);
						publicIdsActuallyDeleted.push(img.public_id); // For logging or confirmation
						return false; // Remove from currentImages
					}
					return true; // Keep in currentImages
				});
				currentImages = remainingImages; // Update currentImages to only those not deleted

				if (deletionPromises.length > 0) {
					await Promise.all(deletionPromises);
					console.log(
						`Deleted ${publicIdsActuallyDeleted.length} images from Cloudinary:`,
						publicIdsActuallyDeleted
					);
				}
			}
		}

		// Step 2: Process newly uploaded images (if any)
		if (req.files && req.files.length > 0) {
			const uploadPromises = req.files.map((file) => {
				const uniqueFilename = `${Date.now()}_${
					file.originalname.split(".")[0]
				}`;
				return uploadToCloudinary(
					file.buffer,
					"bikya/bikes",
					uniqueFilename
				);
			});
			const newUploadedImages = await Promise.all(uploadPromises);
			// Add new images to the (potentially filtered) currentImages array
			newUploadedImages.forEach((imgData) => {
				currentImages.push({
					url: imgData.url,
					public_id: imgData.public_id,
				});
			});
			console.log(`Added ${newUploadedImages.length} new images.`);
		}

		// Update bike document fields
		if (model) bike.model = model;
		if (category) bike.category = category;
		if (pricePerHour) bike.pricePerHour = pricePerHour;
		if (pricePerDay) bike.pricePerDay = pricePerDay;
		if (availability !== undefined) bike.availability = availability;
		if (description) bike.description = description;

		if (longitude && latitude) {
			bike.location = {
				type: "Point",
				coordinates: [parseFloat(longitude), parseFloat(latitude)],
				address: address || bike.location.address, // Keep old address if new one not provided with new coords
			};
		} else if (address && bike.location) {
			// Only update address if coordinates are not changing
			bike.location.address = address;
		}

		bike.images = currentImages; // Assign the final list of images

		const updatedBike = await bike.save();
		res.status(200).json(updatedBike);
	} catch (err) {
		console.error("Error updating bike:", err.message);
		// ... (your existing error handling: ValidationError, ObjectId, Multer errors) ...
		if (err.name === "ValidationError") {
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		if (err.kind === "ObjectId") {
			return res
				.status(404)
				.json({ msg: "Bike not found (invalid ID format)" });
		}
		if (
			err.code === "LIMIT_FILE_SIZE" ||
			err.message === "Not an image! Please upload only images."
		) {
			return res.status(400).json({ errors: [{ msg: err.message }] });
		}
		res.status(500).send("Server error");
	}
};

// Delete a bike (Admin only)
// Delete a bike (Admin only)
exports.deleteBike = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const bike = await Bike.findById(req.params.id);

		if (!bike) {
			return res.status(404).json({ msg: "Bike not found" });
		}

		// --- DELETE IMAGES FROM CLOUDINARY ---
		if (bike.images && bike.images.length > 0) {
			const deletionPromises = bike.images.map((image) => {
				if (image.public_id) {
					// Ensure public_id exists
					return deleteFromCloudinary(image.public_id);
				}
				return Promise.resolve(); // Skip if no public_id
			});

			// Wait for all image deletion attempts to complete
			const deletionResults = await Promise.all(deletionPromises);
			deletionResults.forEach((result) => {
				// You can log results or check for errors here if needed
				// For example, if result.result !== 'ok' and result.result !== 'not found'
				if (result && result.result === "error") {
					console.warn(
						`Failed to delete image ${result.public_id} from Cloudinary:`,
						result.error
					);
				}
			});
		}
		// --- END DELETE IMAGES ---

		await bike.deleteOne(); // Or Bike.findByIdAndRemove(req.params.id)

		res.status(200).json({
			msg: "Bike removed successfully (including associated images from cloud)",
		});
	} catch (err) {
		console.error("Error deleting bike:", err.message);
		if (err.kind === "ObjectId") {
			return res
				.status(404)
				.json({ msg: "Bike not found (invalid ID format)" });
		}
		res.status(500).send("Server error");
	}
};

exports.getNearbyBikes = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	const { longitude, latitude, maxDistance } = req.query;

	// Convert to numbers just in case (toFloat/toInt in validator should handle this, but belt-and-suspenders)
	const lng = parseFloat(longitude);
	const lat = parseFloat(latitude);
	const distance = parseInt(maxDistance);

	if (isNaN(lng) || isNaN(lat) || isNaN(distance)) {
		return res.status(400).json({
			errors: [
				{
					msg: "Invalid longitude, latitude, or maxDistance format after parsing.",
				},
			],
		});
	}

	try {
		const bikes = await Bike.find({
			location: {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [lng, lat], // GeoJSON order: longitude, latitude
					},
					$maxDistance: distance, // Distance in meters
				},
			},
			availability: true, // Optionally, only find available bikes
		}).populate("addedBy", "fullName email"); // Or any other fields you want to show

		res.status(200).json(bikes);
	} catch (err) {
		console.error("Error fetching nearby bikes:", err.message);
		res.status(500).send("Server error");
	}
};
exports.getAllBikes = async (req, res) => {
	try {
		// --- Filtering ---
		const filter = {};
		if (req.query.category) {
			// Case-insensitive filter for category
			filter.category = { $regex: req.query.category, $options: "i" };
		}
		if (req.query.availability) {
			// Ensure availability is treated as a boolean
			filter.availability = req.query.availability === "true";
		}
		// You could add more filters here, e.g., price range, model name search

		// --- Sorting ---
		const sortOptions = {};
		if (req.query.sortBy) {
			const parts = req.query.sortBy.split(":"); // e.g., "pricePerHour:asc" or "createdAt:desc"
			sortOptions[parts[0]] = parts[1] === "desc" ? -1 : 1;
		} else {
			sortOptions.createdAt = -1; // Default sort by newest created
		}

		// --- Pagination ---
		const page = parseInt(req.query.page, 10) || 1; // Default to page 1
		const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
		const skip = (page - 1) * limit;

		// Execute query with filters, sorting, and pagination
		const bikes = await Bike.find(filter)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit)
			.populate("addedBy", "fullName email"); // Populate admin details

		// Get total number of documents matching the filter for pagination metadata
		const totalBikes = await Bike.countDocuments(filter);
		const totalPages = Math.ceil(totalBikes / limit);

		res.status(200).json({
			data: bikes,
			pagination: {
				currentPage: page,
				totalPages,
				totalBikes,
				limit,
			},
		});
	} catch (err) {
		console.error("Error fetching bikes:", err.message);
		res.status(500).send("Server error");
	}
};
