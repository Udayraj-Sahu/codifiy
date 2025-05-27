// server.js
require("dotenv").config();
console.log("<<<<< LOADING server.js - VERSION ABC >>>>>");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");

// Import routes
const userRoutes = require("./routes/userRoutes"); // Assuming you have this
const documentRoutes = require("./routes/documentRoutes"); // Assuming you have this
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const promoCodeRoutes = require("./routes/promoCodeRoutes");
const bikeRoutes = require("./routes/bikeRoutes"); // This handles both user & admin bike ops if consolidated
const adminBookingRoutes = require("./routes/adminBookingRoutes");
// const adminBikeRoutes = require('./routes/adminBikeRoutes'); // Only if you have a separate file AND mount path for this

connectDB();
const app = express();

require("./models/booking"); // Adjust path if needed - THIS IS THE NEW LINE
console.log("Attempted to explicitly load Booking model (booking.js) in server.js");

// Core Middleware
app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Set security-related HTTP headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Simple GET route for server health check
app.get("/", (req, res) => {
	res.send("Bikya Backend API is running...");
});

// Mount API routes (ensure no duplicates)
app.use("/api/auth", authRoutes);
app.use("/api/bikes", bikeRoutes); // Assuming this handles both user and admin bike routes
// (e.g., POST /api/bikes is admin, GET /api/bikes is user)
app.use("/api/users", userRoutes); // Assuming you have this for user-specific things not under /auth/me
app.use("/api/documents", documentRoutes); // Assuming you have document routes
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promocodes", promoCodeRoutes);

// Admin specific routes (if you prefer a distinct prefix)
// If adminBikeRoutes is a separate file for routes like POST /api/admin/bikes/
// app.use('/api/admin/bikes', adminBikeRoutes); // Then uncomment and ensure it's defined
app.use("/api/admin/bookings", adminBookingRoutes); // This makes admin bookings accessible via /api/admin/bookings

// TODO: Global Error Handling Middleware (should be last)
// Example:
// const { notFound, errorHandler } = require('./middleware/errorMiddleware');
// app.use(notFound); // For 404 errors
// app.use(errorHandler); // For other errors

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
