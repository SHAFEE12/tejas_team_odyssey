const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    level: {
      type: String,
      enum: [
        'beginner',
        'intermediate',
        'advanced',
        'expert'
      ],
      default: 'beginner'
    },

    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    _id: false
  }
);

const skillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    skills: {
      type: [skillSchema],
      default: []
    },

    targetRole: {
      type: String,
      trim: true,
      default: ''
    },

    targetIndustry: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'SkillProfile',
  skillProfileSchema
);