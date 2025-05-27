// middleware/uploadMiddleware.js (Example)
const multer = require('multer');

// Configure storage - memory storage is good for processing and then uploading to cloud
const storage = multer.memoryStorage(); // Stores files in RAM as Buffer objects

// Optional: File filter to accept only specific image types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) { // Check for image mime types
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size (e.g., 5MB)
  },
});

// To handle multiple image uploads for a bike, you might use upload.array('images', MAX_COUNT)
// For example, for up to 5 images for a field named 'images' in the form-data:
// const uploadBikeImages = upload.array('bikeImages', 5); // 'bikeImages' is the field name in form-data

module.exports = upload; // Export the configured multer instance