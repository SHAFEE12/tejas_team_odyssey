/**
 * Assessment.js
 *
 * Mongoose model for academician-authored student and cohort assessments & questionnaires.
 * Supports cross-discipline technical evaluations, aptitude tests, soft skills,
 * and integrates directly with the canonical skill taxonomy.
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length >= 2,
        'Questions must provide at least 2 options',
      ],
    },
    correctAnswer: {
      type: Number, // 0-indexed option index
      required: true,
    },
    skillId: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
      index: true,
    },

    academician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Optional: if assigned to a specific student; null indicates open to institution cohort
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    type: {
      type: String,
      enum: ['TECHNICAL', 'APTITUDE', 'SOFT_SKILL', 'DOMAIN', 'CAREER_INTEREST'],
      default: 'TECHNICAL',
      index: true,
    },

    category: {
      type: String,
      enum: [
        'Technical',
        'DSA',
        'Project',
        'Communication',
        'Career Readiness',
        'Domain Specific',
        'Aptitude',
        'Ayush & Healthcare',
      ],
      default: 'Technical',
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },

    skills: {
      type: [String],
      default: [], // References canonical skills (e.g. ['react', 'node', 'dsa'])
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    duration: {
      type: Number, // in minutes
      default: 30,
    },

    passingScore: {
      type: Number, // in percentage, e.g. 60
      default: 60,
    },

    maxScore: {
      type: Number,
      default: 100,
      min: 1,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'in_progress', 'completed', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ institution: 1, status: 1 });
assessmentSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
