/**
 * MentoringAction.js
 *
 * Mongoose model for academician mentoring notes, targeted interventions,
 * and deterministic roadmap/skill/project recommendations.
 */

const mongoose = require('mongoose');

const mentoringActionSchema = new mongoose.Schema(
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

    note: {
      type: String,
      trim: true,
      default: '',
    },

    recommendation: {
      type: String,
      required: true,
      trim: true,
    },

    why: {
      type: String,
      trim: true,
      default: '',
    },

    evidence: {
      type: String,
      trim: true,
      default: '',
    },

    suggestedAction: {
      type: String,
      trim: true,
      default: '',
    },

    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
      index: true,
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'DISMISSED'],
      default: 'ACTIVE',
      index: true,
    },

    linkedSkill: {
      type: String,
      trim: true,
      default: '',
    },

    linkedRoadmapMilestone: {
      type: String,
      trim: true,
      default: '',
    },

    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },

    linkedAssessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

mentoringActionSchema.index({ student: 1, status: 1 });
mentoringActionSchema.index({ academician: 1, status: 1 });

module.exports = mongoose.model('MentoringAction', mentoringActionSchema);
