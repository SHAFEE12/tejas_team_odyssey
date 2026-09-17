/**
 * Opportunity.js
 *
 * Mongoose model for the curated Opportunity catalog.
 *
 * DEMO DATA DISCLAIMER:
 * All opportunities seeded into this catalog are clearly marked as demo records.
 * They are NOT currently open real job listings.
 * Company names, salaries, and descriptions are illustrative only.
 *
 * This model is read-only from the student's perspective. Students may not
 * create, update, or delete opportunities — they only view and apply.
 */

const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    catalogVersion: { type: String, default: '1.0' },

    // Classification
    type: {
      type: String,
      enum: ['internship', 'full-time', 'part-time', 'contract', 'remote'],
      required: true,
    },
    domain: {
      type: String,
      enum: [
        'software-engineering', 'data-science', 'machine-learning',
        'devops', 'product-management', 'design', 'cybersecurity',
        'blockchain', 'mobile', 'backend', 'frontend', 'fullstack',
        'cloud', 'embedded', 'research',
        'electronics', 'electrical', 'mechanical', 'civil', 'robotics', 'iot', 'hardware', 'general'
      ],
      required: true,
    },

    // Ownership & Multi-tenant linkage
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Industry',
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    // Core fields
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    location:    { type: String, required: true, trim: true },
    remote:      { type: Boolean, default: false },
    workMode:    {
      type: String,
      enum: ['remote', 'hybrid', 'on-site'],
      default: 'remote',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'internship', 'any'],
      default: 'entry',
    },

    // Compensation (string so we can represent ranges)
    stipend:     { type: String, default: 'Not disclosed' },

    // Skill requirements
    requiredSkills:  { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },

    // Description
    description:     { type: String, required: true, trim: true },
    responsibilities:{ type: [String], default: [] },
    qualifications:  { type: [String], default: [] },

    // Timeline
    duration: { type: String, default: null },
    openings: { type: Number, default: 1, min: 1 },
    deadline: { type: Date, default: null },

    // Metadata & lifecycle
    tags:    { type: [String], default: [] },
    status:  {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
      index: true,
    },
    active:  { type: Boolean, default: true },
    isDemo:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

opportunitySchema.index({ type: 1, domain: 1, active: 1 });
opportunitySchema.index({ requiredSkills: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
