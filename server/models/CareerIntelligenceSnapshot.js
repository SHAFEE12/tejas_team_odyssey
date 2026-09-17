/**
 * CareerIntelligenceSnapshot.js
 *
 * Mongoose model for tracking authentic career intelligence snapshots.
 *
 * Strict Student Ownership:
 * - Scoped strictly to user: req.user._id
 * - Records historical data at most once every 24 hours (or upon explicit refresh with changes).
 * - Never stores sensitive resume text, private notes, or credentials.
 */

const mongoose = require('mongoose');

const careerIntelligenceSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    careerHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    careerReadiness: {
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
    roadmapProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    resumeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    projectQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    dsaTotal: {
      type: Number,
      default: 0,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    dailyPlanCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

careerIntelligenceSnapshotSchema.index({ user: 1, recordedAt: -1 });

module.exports = mongoose.model(
  'CareerIntelligenceSnapshot',
  careerIntelligenceSnapshotSchema
);
