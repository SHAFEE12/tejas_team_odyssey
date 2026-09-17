/**
 * ExecutionGoal.js
 *
 * Mongoose model for Student Execution Goals in the Career Execution OS.
 * Every goal must belong to a User and retain career-aware metadata.
 */

const mongoose = require('mongoose');

const ALLOWED_ENTITY_TYPES = [
  'Skill',
  'RoadmapTask',
  'Project',
  'Application',
  'Resume',
  'DSAProfile',
  'GitHubProfile',
  'General',
  null,
];

const executionGoalSchema = new mongoose.Schema(
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
      maxlength: 2000,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'SKILL',
        'DSA',
        'PROJECT',
        'RESUME',
        'GITHUB',
        'APPLICATION',
        'INTERVIEW',
        'ROADMAP',
        'CAREER',
        'CUSTOM',
      ],
      default: 'CAREER',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    targetDate: {
      type: Date,
    },
    weeklyTargetMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    source: {
      type: String,
      enum: ['CAREER_INTELLIGENCE', 'ROADMAP', 'USER', 'SYSTEM'],
      default: 'USER',
    },
    relatedModule: {
      type: String,
      trim: true,
      default: '',
    },
    relatedEntityType: {
      type: String,
      validate: {
        validator: function (v) {
          return v === null || v === undefined || ALLOWED_ENTITY_TYPES.includes(v);
        },
        message: (props) => `${props.value} is not an authorized related entity type.`,
      },
      default: null,
    },
    relatedEntityId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant query isolation
executionGoalSchema.index({ user: 1, status: 1 });
executionGoalSchema.index({ user: 1, category: 1 });

const ExecutionGoal = mongoose.model('ExecutionGoal', executionGoalSchema);
ExecutionGoal.ALLOWED_ENTITY_TYPES = ALLOWED_ENTITY_TYPES;

module.exports = ExecutionGoal;
