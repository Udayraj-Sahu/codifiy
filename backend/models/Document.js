// D:\Bikya\backend\models\Document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    documentType: {
      type: String,
      required: [true, 'Please specify the document type'],
      trim: true,
      // Example enum, adjust as needed:
      enum: ['drivers_license', 'id_card', 'passport', 'other'],
    },
    documentSide: {
      type: String,
      trim: true,
      enum: ['front', 'back', null], // null for single-sided documents
      default: null,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    public_id: { // From Cloudinary/S3
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: { // Owner who reviewed
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewTimestamp: {
      type: Date,
      required: false,
    },
    reviewComments: {
      type: String,
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;