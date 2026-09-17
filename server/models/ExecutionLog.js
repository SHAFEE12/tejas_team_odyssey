/**
 * ExecutionLog.js
 *
 * Mongoose model for Student Execution Logs in the Career Execution OS.
 * Records discreet student actions (START, PAUSE, RESUME, COMPLETE, SKIP) and time spent.
 */

const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExecutionTask',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['START', 'PAUSE', 'RESUME', 'COMPLETE', 'SKIP'],
      required: true,
    },
    minutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

executionLogSchema.index({ user: 1, createdAt: 1 });

const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);

module.exports = ExecutionLog;
