/**
 * InternshipMatch.js
 *
 * Mongoose model for explainable Internship & Student Matching for SIH 26044.
 * Stores deterministic 9-factor scores, hard eligibility gating, and full audit breakdown.
 */

const mongoose = require('mongoose');

const skillBreakdownSchema = new mongoose.Schema(
  {
    skillId: { type: String, required: true },
    skillName: { type: String, required: true },
    requiredLevel: { type: Number, default: 1 },
    studentLevel: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    matched: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
  },
  { _id: false }
);

const skillGapItemSchema = new mongoose.Schema(
  {
    skillId: { type: String, required: true },
    skillName: { type: String, required: true },
    requiredLevel: { type: Number, default: 1 },
    studentLevel: { type: Number, default: 0 },
    gap: { type: Number, default: 1 },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  },
  { _id: false }
);

const internshipMatchSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      index: true,
    },

    band: {
      type: String,
      enum: [
        'EXCELLENT_MATCH', // 85-100
        'STRONG_MATCH',    // 70-84
        'POTENTIAL_MATCH', // 55-69
        'DEVELOPING_MATCH',// 40-54
        'LOW_MATCH',       // 0-39
      ],
      required: true,
      index: true,
    },

    eligibilityStatus: {
      type: String,
      enum: ['ELIGIBLE', 'NOT_ELIGIBLE'],
      default: 'ELIGIBLE',
      index: true,
    },

    ineligibilityReasons: {
      type: [String],
      default: [],
    },

    // 9 Component Scores
    skillScore:          { type: Number, default: 0, min: 0, max: 100 }, // Required Skills (35%)
    preferredSkillScore: { type: Number, default: 0, min: 0, max: 100 }, // Preferred Skills (15%)
    interestScore:       { type: Number, default: 0, min: 0, max: 100 }, // Career Goal (10%)
    evidenceScore:       { type: Number, default: 0, min: 0, max: 100 }, // Verified Evidence (10%)
    projectScore:        { type: Number, default: 0, min: 0, max: 100 }, // Projects Evidence (10%)
    assessmentScore:     { type: Number, default: 0, min: 0, max: 100 }, // Assessment Score (5%)
    academicScore:       { type: Number, default: 0, min: 0, max: 100 }, // Academic Fit / CGPA (5%)
    availabilityScore:   { type: Number, default: 0, min: 0, max: 100 }, // Availability/Location (5%)
    profileScore:        { type: Number, default: 0, min: 0, max: 100 }, // Profile Completeness (5%)

    skillBreakdown: {
      type: [skillBreakdownSchema],
      default: [],
    },

    skillGaps: {
      type: [skillGapItemSchema],
      default: [],
    },

    reasons: {
      type: [String],
      default: [],
    },

    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

internshipMatchSchema.index({ internshipId: 1, score: -1 });
internshipMatchSchema.index({ studentId: 1, score: -1 });
internshipMatchSchema.index({ internshipId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('InternshipMatch', internshipMatchSchema);
