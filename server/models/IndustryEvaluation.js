/**
 * IndustryEvaluation.js
 *
 * Mongoose model for recruiter evaluation of candidates.
 * Feeds structured feedback back into student skill gap and learning recommendation loops.
 */

const mongoose = require('mongoose');

const industryEvaluationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      default: null,
      index: true,
    },

    technicalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    communicationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    problemSolvingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    teamworkScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    recommendation: {
      type: String,
      enum: ['HIRE', 'SHORTLIST', 'CONSIDER', 'REJECT', 'FUTURE_POOL'],
      default: 'CONSIDER',
      index: true,
    },

    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

industryEvaluationSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('IndustryEvaluation', industryEvaluationSchema);
