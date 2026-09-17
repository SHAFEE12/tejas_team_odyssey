/**
 * Project.js
 *
 * Mongoose model for Student Project Portfolio & Management.
 *
 * Each project is strictly owned by one authenticated student (user: req.user._id).
 * Tracks personalized milestones, GitHub connection, deployment link,
 * completion evidence, quality scoring, and structured resume bullet points.
 */

const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    milestoneId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    order: {
      type: Number,
      default: 1,
    },
    completionCriteria: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    blueprintId: {
      type: String,
      trim: true,
      default: null,
    },

    roadmapTaskId: {
      type: String,
      trim: true,
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    type: {
      type: String,
      enum: [
        'WEB',
        'MOBILE',
        'BACKEND',
        'FULL_STACK',
        'DATA',
        'MACHINE_LEARNING',
        'AI',
        'DEVOPS',
        'CYBERSECURITY',
        'SYSTEM_DESIGN',
      ],
      default: 'FULL_STACK',
    },

    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },

    targetRole: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: String,
      trim: true,
      default: 'Software Development',
    },

    skills: {
      type: [String],
      default: [],
    },

    skillGapsAddressed: {
      type: [String],
      default: [],
    },

    prerequisites: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNED',
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    relevanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },

    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    whyRecommended: {
      type: String,
      trim: true,
      default: '',
    },

    milestones: {
      type: [milestoneSchema],
      default: [],
    },

    completionCriteria: {
      type: [String],
      default: [],
    },

    // ─── GitHub Repository Connection ───
    github: {
      url: { type: String, trim: true, default: null },
      repoName: { type: String, trim: true, default: null },
      connectedAt: { type: Date, default: null },
      isVerified: { type: Boolean, default: false },
      stars: { type: Number, default: 0, min: 0 },
      forks: { type: Number, default: 0, min: 0 },
      primaryLanguage: { type: String, trim: true, default: null },
      lastCheckedAt: { type: Date, default: null },
    },

    // ─── Live Deployment ───
    deployment: {
      url: { type: String, trim: true, default: null },
      provider: { type: String, trim: true, default: null },
      updatedAt: { type: Date, default: null },
    },

    // ─── Evidence & Documentation ───
    evidence: {
      notes: { type: String, default: '' },
      demoUrl: { type: String, default: null },
      documentationUrl: { type: String, default: null },
      hasReadme: { type: Boolean, default: false },
      hasTests: { type: Boolean, default: false },
    },

    // ─── Resume-Ready Structured Content ───
    resumeData: {
      suggestedTitle: { type: String, default: '' },
      bulletPoints: { type: [String], default: [] },
      technologies: { type: [String], default: [] },
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

/**
 * Recomputes milestone progress and Portfolio Quality Indicator (0–100)
 */
projectSchema.methods.calculateProgressAndQuality = function () {
  const total = this.milestones.length;
  const completed = this.milestones.filter((m) => m.status === 'COMPLETED').length;

  if (total > 0) {
    this.progress = Math.round((completed / total) * 100);
  } else {
    this.progress = this.status === 'COMPLETED' ? 100 : this.status === 'IN_PROGRESS' ? 50 : 0;
  }

  // Automatic status sync if all milestones are completed
  if (total > 0 && completed === total && this.status !== 'ARCHIVED') {
    this.status = 'COMPLETED';
    if (!this.completedAt) this.completedAt = new Date();
  } else if (this.status === 'COMPLETED' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.status !== 'COMPLETED') {
    this.completedAt = null;
  }

  // Deterministic Portfolio Quality Indicator calculation (0-100)
  let quality = 0;

  // 1. Milestone progress (up to 30 pts)
  quality += Math.round((this.progress / 100) * 30);

  // 2. GitHub repository connected (20 pts)
  if (this.github && this.github.url) {
    quality += 20;
  }

  // 3. Live deployment link provided (15 pts)
  if (this.deployment && this.deployment.url) {
    quality += 15;
  }

  // 4. Evidence / README / Documentation (15 pts)
  if (this.evidence?.hasReadme || this.github?.url) {
    quality += 10;
  }
  if (this.evidence?.hasTests || this.evidence?.documentationUrl) {
    quality += 5;
  }

  // 5. Resume bullets ready (10 pts)
  if (this.resumeData && this.resumeData.bulletPoints?.length > 0) {
    quality += 10;
  }

  // 6. Completion bonus (10 pts)
  if (this.status === 'COMPLETED') {
    quality += 10;
  }

  this.qualityScore = Math.min(100, quality);
};

module.exports = mongoose.model('Project', projectSchema);
