/**
 * SkillTaxonomy.js
 *
 * Canonical Master Skill Taxonomy for SIH 26044.
 * Prevents modules from representing the same skill as disconnected free-text strings.
 */

const mongoose = require('mongoose');

const skillTaxonomySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Programming',
        'Web Development',
        'Backend',
        'Frontend',
        'Database',
        'Cloud',
        'DevOps',
        'Data Science',
        'AI/ML',
        'Cybersecurity',
        'Communication',
        'Leadership',
        'Teamwork',
        'Problem Solving',
        'Aptitude',
        'Core CS',
        'Domain Specific',
        'Ayush & Healthcare Tech',
        'Other',
      ],
      default: 'Other',
      index: true,
    },

    subCategory: {
      type: String,
      trim: true,
      default: '',
    },

    aliases: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    parentSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      default: null,
    },

    levelScale: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 5 },
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

skillTaxonomySchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('SkillTaxonomy', skillTaxonomySchema);
