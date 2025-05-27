const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: [true, "Please provide your full name"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Please provide your email"],
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"Please provide a valid email address",
			],
		},
		password: {
			type: String,
			required: [true, "Please provide a password"],
			minlength: [6, "Password must be at least 6 characters long"],
			select: false, // Password field will not be returned in queries by default
		},
		role: {
			type: String,
			enum: ["User", "Admin", "Owner"], // As per your initial prompt
			default: "User",
		},
		documents: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Document",
			},
		],
		expoPushToken: {
			type: String,
			default: null, // Or just String if you don't want a default
		},
		// You can add other fields from your initial prompt later like:
		// documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
		// bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
		// location: { type: Object },
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields automatically
	}
);

// Middleware: Hash password before saving user
userSchema.pre("save", async function (next) {
	// Only run this function if password was actually modified (or is new)
	if (!this.isModified("password")) {
		return next();
	}

	// Generate a salt
	const salt = await bcrypt.genSalt(10);
	// Hash the password with the salt
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

// Method: Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
