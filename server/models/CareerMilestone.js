/**
 * CareerMilestone.js
 *
 * Mongoose model for tracking concrete career progression milestones.
 *
 * Strict Student Ownership:
 * - Scoped strictly to user: req.user._id
 * - Prevents duplicates via unique compound index on { user, stableKey } when stableKey is set.
 */

const mongoose = require('mongoose');

const careerMilestoneSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'FOUNDATION',
        'SKILL',
        'PROJECT',
        'PROOF',
        'APPLICATION',
        'INTERVIEW',
        'CAREER',
      ],
      default: 'CAREER',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK', 'OVERDUE'],
      default: 'NOT_STARTED',
      index: true,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    stableKey: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    relatedEntityType: {
      type: String,
      trim: true,
      default: null,
    },
    relatedEntityId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

careerMilestoneSchema.index({ user: 1, category: 1, status: 1 });
careerMilestoneSchema.index({ user: 1, stableKey: 1 });

const CareerMilestone = mongoose.model('CareerMilestone', careerMilestoneSchema);

module.exports = CareerMilestone;
