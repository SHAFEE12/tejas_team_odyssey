const mongoose = require('mongoose');

/**
 * Resume — stores an authenticated student's uploaded resume and analysis.
 *
 * Each resume is strictly owned by one student (user: req.user._id).
 * Files are stored safely on the filesystem with randomized names.
 */

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One active resume per student
    },

    // File metadata
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },

    storedFileName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    storageKey: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['uploaded', 'extracting', 'analyzing', 'completed', 'failed', 'needs_ocr'],
      default: 'uploaded',
    },

    // Raw extracted text content
    extractedText: {
      type: String,
      default: '',
    },

    // Comprehensive structured analysis
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
