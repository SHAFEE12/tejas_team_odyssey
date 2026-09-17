/**
 * PlacementRecord.js
 *
 * Mongoose model for student placement and internship hiring records.
 */

const mongoose = require('mongoose');

const placementRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    studentName: {
      type: String,
      default: '',
    },

    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },

    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementCycle',
      default: null,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      default: null,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['INTERNSHIP', 'FULL_TIME', 'PPO'],
      default: 'INTERNSHIP',
      index: true,
    },

    status: {
      type: String,
      enum: ['ELIGIBLE', 'APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'PLACED', 'REJECTED'],
      default: 'APPLIED',
      index: true,
    },

    compensation: {
      type: String,
      default: 'Competitive',
    },

    offerDate: {
      type: Date,
      default: null,
    },

    joiningDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

placementRecordSchema.index({ institutionId: 1, status: 1 });
placementRecordSchema.index({ studentId: 1, cycleId: 1 });

module.exports = mongoose.model('PlacementRecord', placementRecordSchema);
