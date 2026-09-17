/**
 * HiringDrive.js
 *
 * Mongoose model for campus recruitment & hiring drive management.
 * Links institutions, participating opportunities, eligibility constraints,
 * and tracks applicant status without duplicating Opportunity records.
 */

const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'],
      default: 'APPLIED',
    },
  },
  { _id: false }
);

const hiringDriveSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional link to curated catalog opportunity
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      default: null,
    },

    departments: {
      type: [String],
      default: [], // e.g. ['Computer Science', 'Electronics & Communication', 'Mechanical Engineering']
    },

    eligibleBatches: {
      type: [Number],
      default: [2025, 2026],
    },

    minCgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    minReadinessScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    deadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },

    applicants: {
      type: [applicantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

hiringDriveSchema.index({ institution: 1, status: 1 });

module.exports = mongoose.model('HiringDrive', hiringDriveSchema);
