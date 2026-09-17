/**
 * Industry.js
 *
 * Mongoose model for Industry Partners, Companies, and Hiring Organizations.
 * Job/internship postings and hiring managers reference this entity via industry ID.
 */

const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    industryType: {
      type: String,
      trim: true,
      default: 'Technology',
    },

    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '51-200',
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    companyCode: {
      type: String,
      trim: true,
      default: '',
    },

    domain: {
      type: String,
      trim: true,
      default: 'Technology',
    },

    headquarters: {
      type: String,
      trim: true,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verified: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

industrySchema.index({ companyName: 1, isActive: 1 });

module.exports = mongoose.model('Industry', industrySchema);
