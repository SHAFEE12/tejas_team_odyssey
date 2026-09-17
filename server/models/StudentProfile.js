/**
 * StudentProfile.js
 *
 * Mongoose model linking a student to an educational institution, academic mentor,
 * and academic credentials (department, degree, graduation year, CGPA).
 *
 * IMPORTANT DESIGN NOTE:
 * This model compliments existing student models (`SkillProfile`, `DSAProfile`, `Resume`, etc.)
 * by providing institutional affiliation without duplicating any existing skill or career data.
 */

const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
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

    assignedMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: 'Computer Science & Engineering',
    },

    degree: {
      type: String,
      trim: true,
      default: 'Bachelor of Technology',
    },

    graduationYear: {
      type: Number,
      min: 2020,
      max: 2035,
      default: 2026,
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

studentProfileSchema.index({ user: 1, institution: 1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
