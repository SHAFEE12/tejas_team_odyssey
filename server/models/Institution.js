/**
 * Institution.js
 *
 * Mongoose model for educational institutions (Colleges, Universities, Academies).
 * Affiliated students and academicians reference this shared entity via institution ID.
 */

const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    domain: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },

    address: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },

    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    departments: {
      type: [String],
      default: ['Computer Science', 'Information Technology', 'Electronics', 'Data Science'],
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

institutionSchema.index({ code: 1, isActive: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
