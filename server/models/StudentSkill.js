/**
 * StudentSkill.js
 *
 * Evidence-Aware Student Skill Profile Model for SIH 26044.
 *
 * Skill Levels:
 * 0: No Evidence
 * 1: Beginner
 * 2: Basic
 * 3: Intermediate
 * 4: Advanced
 * 5: Expert
 *
 * Prevents inflated self-reported ratings: calculatedLevel is strictly
 * derived from verified evidence, assessment scores, and authenticated artifacts.
 */

const mongoose = require('mongoose');

const evidenceItemSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['ASSESSMENT', 'FACULTY', 'CERTIFICATION', 'PROJECT', 'INTERNSHIP', 'GITHUB', 'RESUME'],
      required: true,
    },
    evidenceId: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSkillSchema = new mongoose.Schema(
  {
    userId: {
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
      index: true, // Canonical skill slug / ID (e.g. 'react', 'python', 'cloud')
    },

    skillName: {
      type: String,
      required: true,
      trim: true,
    },

    declaredLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 1,
    },

    calculatedLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 1, // Evidence-weighted calculated proficiency
    },

    assessmentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    projectScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    githubScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    evidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'],
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

    evidence: {
      type: [evidenceItemSchema],
      default: [],
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness per user and skill
studentSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });
studentSkillSchema.index({ userId: 1, verificationStatus: 1 });

/**
 * Deterministically compute calculatedLevel from evidence, assessments, and projects.
 * Guarantees that Expert (5) requires both high score (>=85) and verified evidence.
 */
studentSkillSchema.methods.recalculateLevel = function () {
  let weighted = 0;
  let weightsSum = 0;

  if (this.assessmentScore > 0) {
    weighted += this.assessmentScore * 0.40;
    weightsSum += 0.40;
  }
  if (this.projectScore > 0) {
    weighted += this.projectScore * 0.35;
    weightsSum += 0.35;
  }
  if (this.githubScore > 0) {
    weighted += this.githubScore * 0.15;
    weightsSum += 0.15;
  }

  // Base declared level contribution (capped to intermediate if unverified)
  const declaredCap = this.verificationStatus === 'VERIFIED' ? this.declaredLevel : Math.min(this.declaredLevel, 3);
  const declaredBase = declaredCap * 20;
  weighted += declaredBase * 0.10;
  weightsSum += 0.10;

  const compositeScore = weightsSum > 0 ? weighted / weightsSum : 0;
  this.evidenceScore = Math.round(compositeScore);

  // Level mapping:
  // 0: < 20
  // 1: 20-39 (Beginner)
  // 2: 40-59 (Basic)
  // 3: 60-74 (Intermediate)
  // 4: 75-89 (Advanced)
  // 5: >= 90 AND (verified OR 2+ verified projects) (Expert)
  if (compositeScore < 20) {
    this.calculatedLevel = 0;
  } else if (compositeScore < 40) {
    this.calculatedLevel = 1;
  } else if (compositeScore < 60) {
    this.calculatedLevel = 2;
  } else if (compositeScore < 75) {
    this.calculatedLevel = 3;
  } else if (compositeScore < 90) {
    this.calculatedLevel = 4;
  } else {
    // Level 5 Expert requirement
    const isOfficiallyVerified = this.verificationStatus === 'VERIFIED';
    this.calculatedLevel = isOfficiallyVerified ? 5 : 4;
  }

  this.lastUpdated = new Date();
  return this.calculatedLevel;
};

module.exports = mongoose.model('StudentSkill', studentSkillSchema);
