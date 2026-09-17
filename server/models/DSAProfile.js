const mongoose = require('mongoose');

/**
 * DSAProfile — stores a student's DSA progress and LeetCode integration.
 *
 * DATA SOURCES:
 *  1. LeetCode Public Profile Sync (when connected and synced via LeetCode GraphQL)
 *  2. Manual Personal Tracking (streaks, target total, focus topics)
 */

const leetcodeDataSchema = new mongoose.Schema(
  {
    totalSolved:       { type: Number, default: 0, min: 0 },
    easySolved:        { type: Number, default: 0, min: 0 },
    mediumSolved:      { type: Number, default: 0, min: 0 },
    hardSolved:        { type: Number, default: 0, min: 0 },
    ranking:           { type: Number, default: null },
    reputation:        { type: Number, default: null },
    acceptanceRate:    { type: Number, default: null },
    contestRating:     { type: Number, default: null },
    contestRanking:    { type: Number, default: null },
    totalParticipants: { type: Number, default: null },
    topPercentage:     { type: Number, default: null },
    avatarUrl:         { type: String, default: null },
    realName:          { type: String, default: null },
  },
  { _id: false }
);

const dsaProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ─── LeetCode Connection & Sync State ───
    leetcodeUsername: {
      type: String,
      trim: true,
      default: '',
    },

    leetcodeProfileUrl: {
      type: String,
      trim: true,
      default: '',
    },

    leetcodeConnected: {
      type: Boolean,
      default: false,
    },

    leetcodeSyncStatus: {
      type: String,
      enum: ['never_synced', 'synced', 'error'],
      default: 'never_synced',
    },

    leetcodeLastSyncedAt: {
      type: Date,
      default: null,
    },

    leetcodeSyncError: {
      type: String,
      default: null,
    },

    leetcodeSource: {
      type: String,
      enum: ['manual', 'public_profile'],
      default: 'manual',
    },

    // Real LeetCode GraphQL synced payload
    leetcodeData: {
      type: leetcodeDataSchema,
      default: null,
    },

    // ─── Manual Problem Counts (Used if manual or before sync) ───
    easySolved: {
      type: Number,
      min: 0,
      default: 0,
    },

    mediumSolved: {
      type: Number,
      min: 0,
      default: 0,
    },

    hardSolved: {
      type: Number,
      min: 0,
      default: 0,
    },

    // ─── Personal Practice Tracking ───
    targetTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    currentStreak: {
      type: Number,
      min: 0,
      default: 0,
    },

    longestStreak: {
      type: Number,
      min: 0,
      default: 0,
    },

    focusTopics: {
      type: [String],
      default: [],
    },

    lastUpdated: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: total problems solved (manual fallback or computed)
dsaProfileSchema.virtual('totalSolved').get(function () {
  if (this.leetcodeConnected && this.leetcodeData && typeof this.leetcodeData.totalSolved === 'number') {
    return this.leetcodeData.totalSolved;
  }
  return this.easySolved + this.mediumSolved + this.hardSolved;
});

dsaProfileSchema.set('toJSON', { virtuals: true });
dsaProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DSAProfile', dsaProfileSchema);
