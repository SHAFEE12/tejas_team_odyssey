/**
 * ExecutionTask.js
 *
 * Mongoose model for Student Execution Tasks in the Career Execution OS.
 * Every task tracks planned/actual minutes, strict lifecycle state,
 * and career-aware context.
 */

const mongoose = require('mongoose');

const executionTaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExecutionGoal',
      default: null,
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
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
      default: 'PLANNED',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    estimatedMinutes: {
      type: Number,
      min: 5,
      max: 480,
      default: 30,
    },
    actualMinutes: {
      type: Number,
      min: 0,
      default: 0,
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
    source: {
      type: String,
      enum: ['CAREER_INTELLIGENCE', 'ROADMAP', 'USER', 'SYSTEM', 'DAILY_PLAN'],
      default: 'USER',
    },
    relatedModule: {
      type: String,
      trim: true,
      default: '',
    },
    relatedEntityType: {
      type: String,
      default: null,
    },
    relatedEntityId: {
      type: String,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

executionTaskSchema.index({ user: 1, scheduledDate: 1, status: 1 });
executionTaskSchema.index({ user: 1, goalId: 1 });

const ExecutionTask = mongoose.model('ExecutionTask', executionTaskSchema);

module.exports = ExecutionTask;
