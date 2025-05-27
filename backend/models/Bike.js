const mongoose = require("mongoose");

const bikeSchema = new mongoose.Schema(
	{
		model: {
			type: String,
			required: [true, "Please provide the bike model name"],
			trim: true,
		},
		category: {
			type: String,
			required: [
				true,
				"Please specify the bike category (e.g., Mountain, Road, Electric)",
			],
			trim: true,
		},
		pricePerHour: {
			type: Number,
			required: [true, "Please provide the price per hour"],
			min: [0, "Price per hour cannot be negative"],
		},
		pricePerDay: {
			type: Number,
			required: [true, "Please provide the price per day"],
			min: [0, "Price per day cannot be negative"],
		},
		images: [
			// This is now an array of objects
			{
				url: {
					type: String,
					required: true,
				},
				public_id: {
					// To store Cloudinary's public ID for easy deletion/management
					type: String,
					required: true,
				},
			},
		],
		default: [],
		location: {
			type: {
				type: String,
				enum: ["Point"], // GeoJSON type must be 'Point'
				required: true,
				default: "Point",
			},
			coordinates: {
				type: [Number], // Array of numbers for longitude and latitude [lng, lat]
				required: [
					true,
					"Please provide coordinates [longitude, latitude]",
				],
				// Validate coordinates if needed, e.g., longitude between -180 and 180, latitude between -90 and 90
			},
			address: {
				// Optional: human-readable address
				type: String,
				trim: true,
			},
		},
		availability: {
			type: Boolean,
			default: true, // Bike is available by default
		},
		addedBy: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "User", // Reference to the User model (specifically an Admin)
		},
		// You could add other fields like description, features, etc.
		// description: { type: String, trim: true },
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields automatically
	}
);

// Optional: Custom validator for array limit (e.g., for images)
function arrayLimit(val) {
	return val.length <= 10; // Example limit of 10 images
}

// Create a 2dsphere index on the location.coordinates field for geospatial queries
// This allows you to efficiently find bikes near a certain point.
bikeSchema.index({ location: "2dsphere" });

const Bike = mongoose.model("Bike", bikeSchema);

module.exports = Bike;
