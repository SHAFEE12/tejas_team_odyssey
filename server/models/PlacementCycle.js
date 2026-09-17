/**
 * PlacementCycle.js
 *
 * Mongoose model for institutional campus placement and internship cycles.
 */

const mongoose = require('mongoose');

const placementCycleSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true, // e.g. "AYUSH & Tech Placement Drive 2026"
    },

    academicYear: {
      type: String,
      required: true,
      default: '2025-2026',
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 days
    },

    participatingCompanies: {
      type: [String],
      default: [],
    },

    eligibleDepartments: {
      type: [String],
      default: ['Computer Science', 'Information Technology', 'Electronics', 'Ayurveda & Tech'],
    },

    minimumCGPA: {
      type: Number,
      default: 6.5,
    },

    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

placementCycleSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('PlacementCycle', placementCycleSchema);
