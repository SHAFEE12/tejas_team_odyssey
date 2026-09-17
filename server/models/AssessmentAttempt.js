/**
 * AssessmentAttempt.js
 *
 * Mongoose model for Student Assessment Attempts & Quiz Submissions.
 * Feeds calculated results directly into StudentSkill evidence without
 * overriding stronger verified faculty credentials.
 */

const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
    skillId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const skillScoreItemSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    skillName: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    answers: {
      type: [attemptAnswerSchema],
      default: [],
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
    },

    maxPossibleMarks: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    skillScores: {
      type: [skillScoreItemSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'TIMED_OUT'],
      default: 'COMPLETED',
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ studentId: 1, assessmentId: 1 });
assessmentAttemptSchema.index({ studentId: 1, completedAt: -1 });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
