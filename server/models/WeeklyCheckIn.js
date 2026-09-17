/**
 * WeeklyCheckIn.js
 *
 * Mongoose model for Student Weekly Check-Ins in the Career Execution OS.
 * Enforces one check-in per user per week and captures quantitative execution
 * metrics alongside qualitative self-reflection.
 */

const mongoose = require('mongoose');

const weeklyCheckInSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    completionRate: {
      type: Number,
      default: 0,
    },
    plannedMinutes: {
      type: Number,
      default: 0,
    },
    completedMinutes: {
      type: Number,
      default: 0,
    },
    goalsCompleted: {
      type: Number,
      default: 0,
    },
    goalsAtRisk: {
      type: Number,
      default: 0,
    },
    selfRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reflection: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple check-ins for the same user & week
weeklyCheckInSchema.index({ user: 1, weekStart: 1 }, { unique: true });

const WeeklyCheckIn = mongoose.model('WeeklyCheckIn', weeklyCheckInSchema);

module.exports = WeeklyCheckIn;
