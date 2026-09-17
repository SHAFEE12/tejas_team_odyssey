/**
 * CareerScoreSnapshot.js
 *
 * Mongoose model for tracking historical Career Readiness Score progression.
 *
 * Strict student ownership: user: req.user._id
 * Snapshots are created at most once per 24 hours (or on score changes).
 * Never fabricate historical data: if no prior snapshots exist, history is empty.
 */

const mongoose = require('mongoose');

const careerScoreSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

careerScoreSnapshotSchema.index({ user: 1, recordedAt: -1 });

module.exports = mongoose.model('CareerScoreSnapshot', careerScoreSnapshotSchema);
