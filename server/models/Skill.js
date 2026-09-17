/**
 * Skill.js
 *
 * Master Canonical Skill Taxonomy for CareerOdyssey ecosystem.
 * Shared across Students, Academicians, Institutions, and Industry Opportunities.
 */

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    skillId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, // e.g. "react", "data-structures-and-algorithms", "python"
    },

    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // e.g. "React", "Data Structures & Algorithms"
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Programming Languages',
        'Frontend',
        'Backend',
        'Databases',
        'Cloud & DevOps',
        'Computer Science',
        'Data Science & AI',
        'Mobile Development',
        'Security',
        'Architecture & Design',
        'Other',
      ],
      default: 'Other',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    aliases: {
      type: [String],
      default: [], // e.g. ["React.js", "ReactJS"]
    },

    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

skillSchema.index({ category: 1 });

module.exports = mongoose.model('Skill', skillSchema);
