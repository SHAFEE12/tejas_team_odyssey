/**
 * StudentAcademicProfile.js
 *
 * Mongoose model for Student Academic & Institutional Affiliation Records.
 * Implements strict multi-tenant institution isolation for SIH 26044.
 */

const mongoose = require('mongoose');

const studentAcademicProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
      index: true,
    },

    departmentId: {
      type: String,
      trim: true,
      default: 'Computer Science',
      index: true,
    },

    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },

    degree: {
      type: String,
      trim: true,
      default: 'Bachelor of Technology (B.Tech)',
    },

    branch: {
      type: String,
      trim: true,
      default: 'Computer Science & Engineering',
    },

    admissionYear: {
      type: Number,
      default: 2022,
    },

    graduationYear: {
      type: Number,
      required: true,
      default: 2026,
      index: true,
    },

    semester: {
      type: Number,
      min: 1,
      max: 12,
      default: 6,
    },

    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 7.5,
      index: true,
    },

    academicStatus: {
      type: String,
      enum: ['ACTIVE', 'GRADUATED', 'SUSPENDED', 'ON_LEAVE'],
      default: 'ACTIVE',
      index: true,
    },

    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentAcademicProfileSchema.index({ institutionId: 1, verificationStatus: 1 });
studentAcademicProfileSchema.index({ institutionId: 1, departmentId: 1 });

module.exports = mongoose.model('StudentAcademicProfile', studentAcademicProfileSchema);
