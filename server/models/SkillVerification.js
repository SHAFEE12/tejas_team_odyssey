/**
 * SkillVerification.js
 *
 * Auditable Skill Verification Model for SIH 26044.
 * Tracks faculty reviews, assessment credentials, and verification lifecycle.
 */

const mongoose = require('mongoose');

const skillVerificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    skillId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    skillName: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      enum: ['ASSESSMENT', 'FACULTY', 'CERTIFICATION', 'PROJECT', 'INTERNSHIP', 'GITHUB'],
      required: true,
      default: 'FACULTY',
      index: true,
    },

    evidenceId: {
      type: String,
      trim: true,
      default: '',
    },

    evidenceTitle: {
      type: String,
      trim: true,
      default: '',
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    reviewerRole: {
      type: String,
      enum: ['academician', 'institution_admin', 'super_admin', 'faculty'],
      default: 'academician',
    },

    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },

    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    comments: {
      type: String,
      trim: true,
      default: '',
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

skillVerificationSchema.index({ studentId: 1, skillId: 1, status: 1 });
skillVerificationSchema.index({ institutionId: 1, status: 1 });

module.exports = mongoose.model('SkillVerification', skillVerificationSchema);
