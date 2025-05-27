// config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2; // Use .v2 for the latest API
const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Optional: ensures https URLs
});

module.exports = cloudinary;