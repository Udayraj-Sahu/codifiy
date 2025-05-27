// utils/fileUploadUtils.js
const cloudinary = require("../config/cloudinaryConfig"); // Your Cloudinary config
const streamifier = require("streamifier"); // To convert buffer to stream

const uploadToCloudinary = (fileBuffer, folderName, fileName) => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: folderName, // e.g., 'bikya/bikes'
				public_id: fileName, // Optional: specify a public_id (filename)
				resource_type: "auto", // Automatically detect image, video, raw
			},
			(error, result) => {
				if (error) {
					console.error("Cloudinary Upload Error:", error);
					return reject(error);
				}
				if (!result) {
					return reject(new Error("Cloudinary returned no result."));
				}
				resolve({
					url: result.secure_url,
					public_id: result.public_id,
				});
			}
		);
		streamifier.createReadStream(fileBuffer).pipe(uploadStream);
	});
};

const deleteFromCloudinary = (publicId) => {
	return new Promise((resolve, reject) => {
		if (!publicId) {
			// If publicId is somehow null or undefined, resolve to avoid breaking Promise.all
			// Or you could reject with an error if a publicId is always expected.
			return resolve({
				result: "ok",
				message: "No public_id provided, skipped deletion.",
			});
		}
		cloudinary.uploader.destroy(publicId, (error, result) => {
			if (error) {
				console.error(
					`Cloudinary Delete Error for public_id ${publicId}:`,
					error
				);
				// Decide if you want to reject or resolve even if one image fails to delete.
				// For now, let's resolve with the error to not stop other deletions in Promise.all
				return resolve({ result: "error", error, public_id: publicId });
			}
			// result is usually { result: 'ok' } or { result: 'not found' }
			console.log(
				`Cloudinary deletion result for ${publicId}:`,
				result.result
			);
			resolve(result);
		});
	});
};
module.exports = { uploadToCloudinary, deleteFromCloudinary };
