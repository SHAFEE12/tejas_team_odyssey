/**
 * Evaluation.js
 *
 * Mongoose model for academician evaluations of students.
 * Captures scored rubrics, granular skill assessments, feedback, and recommendations.
 */

const mongoose = require('mongoose');

const skillEvaluationSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      trim: true,
      default: '',
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    academician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },

    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
      index: true,
    },

    scores: {
      overallScore: {
        type: Number,
        default: 0,
      },
      maxScore: {
        type: Number,
        default: 100,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },

    skillEvaluations: {
      type: [skillEvaluationSchema],
      default: [],
    },

    strengths: {
      type: [String],
      default: [],
    },

    weaknesses: {
      type: [String],
      default: [],
    },

    feedback: {
      type: String,
      trim: true,
      default: '',
    },

    recommendation: {
      type: String,
      trim: true,
      default: '',
    },

    evaluatorNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ student: 1, academician: 1, createdAt: -1 });
evaluationSchema.index({ institution: 1, createdAt: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
