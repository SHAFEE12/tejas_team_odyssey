/**
 * CommandCenterSnapshot.js
 *
 * Mongoose model for tracking lightweight, authentic career command center snapshots.
 *
 * Strict Student Ownership:
 * - Scoped strictly to user: req.user._id
 * - Records historical trends at most once every 24 hours (or upon explicit user refresh).
 * - Never stores raw resume text, private application notes, tokens, or credentials.
 */

const mongoose = require('mongoose');

const commandCenterSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    careerReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    executionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    skillCoverage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    portfolioQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    resumeReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    applicationActivity: {
      type: Number,
      min: 0,
      default: 0,
    },
    dsaProgress: {
      type: Number,
      min: 0,
      default: 0,
    },
    careerMomentum: {
      type: Number,
      default: 0,
    },
    biggestGap: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    biggestRisk: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    nextBestAction: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  {
    timestamps: false,
  }
);

commandCenterSnapshotSchema.index({ user: 1, capturedAt: -1 });

const CommandCenterSnapshot = mongoose.model('CommandCenterSnapshot', commandCenterSnapshotSchema);

module.exports = CommandCenterSnapshot;
