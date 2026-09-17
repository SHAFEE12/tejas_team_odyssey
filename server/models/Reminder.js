/**
 * Reminder.js
 *
 * Mongoose model for Student Reminders and Actionable Career Items.
 *
 * Strict Student Ownership:
 * Each reminder is strictly owned by one authenticated student (user: req.user._id).
 * No student can access, query, modify, or delete another student's reminders.
 */

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'APPLICATION',
        'INTERVIEW',
        'DEADLINE',
        'ROADMAP',
        'DSA',
        'PROJECT',
        'RESUME',
        'GITHUB',
        'CUSTOM',
      ],
      default: 'CUSTOM',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    relatedEntityType: {
      type: String,
      enum: ['Application', 'RoadmapTask', 'Project', 'Resume', 'DSA', 'GitHub', 'Other'],
      default: null,
    },
    relatedEntityId: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ['SYSTEM', 'USER'],
      default: 'USER',
    },
    duplicateKey: {
      type: String,
      default: null,
      index: true,
    },
    estimatedMinutes: {
      type: Number,
      min: 5,
      max: 300,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ user: 1, status: 1, dueAt: 1 });
reminderSchema.index({ user: 1, duplicateKey: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
