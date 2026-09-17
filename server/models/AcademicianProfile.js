/**
 * AcademicianProfile.js
 *
 * Mongoose model for faculty members, mentors, and academic evaluators.
 * Directly references User and Institution.
 */

const mongoose = require('mongoose');

const academicianProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: 'Computer Science',
    },

    designation: {
      type: String,
      trim: true,
      default: 'Professor',
    },

    specializations: {
      type: [String],
      default: [],
    },

    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    bio: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

academicianProfileSchema.index({ user: 1, institution: 1 });

module.exports = mongoose.model('AcademicianProfile', academicianProfileSchema);
