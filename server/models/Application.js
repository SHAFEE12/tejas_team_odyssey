/**
 * Application.js
 *
 * Mongoose model for Student Job Application Tracking.
 *
 * Each application is strictly owned by one authenticated student (user: req.user._id).
 * No student may view or modify another student's applications.
 *
 * Lifecycle: SAVED → PLANNING → APPLIED → OA → INTERVIEW → FINAL_ROUND → OFFER
 *            REJECTED | WITHDRAWN
 *
 * UI may group these into simpler Kanban columns, but the full enum is preserved here.
 */

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    // ── Strict ownership — never queryable without this ──────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── The opportunity from the catalog ─────────────────────────
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },

    // ── Opportunity Category ─────────────────────────────────────
    type: {
      type: String,
      enum: ['JOB', 'INTERNSHIP'],
      default: 'INTERNSHIP',
      index: true,
    },

    // ── Full application status lifecycle ────────────────────────
    status: {
      type: String,
      enum: [
        'SAVED',        // Bookmarked — not yet applied
        'PLANNING',     // Preparing application (resume, cover letter)
        'APPLIED',      // Student marked as applied
        'OA',           // Online Assessment stage
        'INTERVIEW',    // Interview scheduled/in progress
        'FINAL_ROUND',  // Final round interview
        'OFFER',        // Offer received
        'REJECTED',     // Rejected at any stage
        'WITHDRAWN',    // Student withdrew application
      ],
      default: 'SAVED',
    },

    // ── Fit Score (8-component, computed at save time) ───────────
    fitScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    fitBreakdown: {
      requiredSkillScore:   { type: Number, default: 0 },
      preferredSkillScore:  { type: Number, default: 0 },
      careerGoalScore:      { type: Number, default: 0 },
      resumeScore:          { type: Number, default: 0 },
      projectEvidenceScore: { type: Number, default: 0 },
      githubEvidenceScore:  { type: Number, default: 0 },
      dsaScore:             { type: Number, default: 0 },
      experienceFitScore:   { type: Number, default: 0 },
    },

    // ── Application Readiness (separate from fit score) ──────────
    applicationReadiness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    applicationReadinessLabel: {
      type: String,
      enum: ['READY_TO_APPLY', 'PREPARE_AND_APPLY', 'PREPARE_FIRST', 'UNAVAILABLE'],
      default: 'UNAVAILABLE',
    },

    // ── Student notes ────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    recruiterNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    interviewNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    preparationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // ── Deadline and interview tracking ─────────────────────────
    deadline:     { type: Date, default: null },
    interviewDate:{ type: Date, default: null },
    offerDate:    { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '' },
    nextAction:   { type: String, trim: true, default: '' },

    // ── Resume version at time of application ────────────────────
    resumeVersion: { type: String, trim: true, default: null },

    // ── Projects the student linked as evidence ──────────────────
    projectReferences: { type: [String], default: [] },  // project _id strings

    // ── Timeline tracking ────────────────────────────────────────
    appliedAt:   { type: Date, default: null },
    offeredAt:   { type: Date, default: null },
    rejectedAt:  { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// One application per student per opportunity (prevents duplicates)
applicationSchema.index({ user: 1, opportunity: 1 }, { unique: true });
applicationSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);

