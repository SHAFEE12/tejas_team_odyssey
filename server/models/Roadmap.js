/**
 * Roadmap.js
 *
 * Mongoose model storing the authenticated student's personalized career roadmap.
 *
 * Each roadmap is strictly owned by one student (user: req.user._id).
 * Stores generated phases, actionable tasks, completion statuses, and progress.
 */

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    taskId: {
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
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['LEARN', 'PRACTICE', 'PROJECT', 'DSA', 'RESUME', 'GITHUB', 'INTERVIEW'],
      default: 'LEARN',
    },
    relatedSkill: {
      type: String,
      trim: true,
      default: null,
    },
    phaseId: {
      type: String,
      required: true,
      trim: true,
    },
    phaseNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    phaseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    estimatedEffort: {
      type: String,
      trim: true,
      default: '3-5 days',
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    completionCriteria: {
      type: [String],
      default: [],
    },
    evidenceExpected: {
      type: String,
      trim: true,
      default: '',
    },
    whyItMatters: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const phaseSummarySchema = new mongoose.Schema(
  {
    phaseId: {
      type: String,
      required: true,
      trim: true,
    },
    phaseNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
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
    taskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTaskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One active roadmap per student
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    roleId: {
      type: String,
      required: true,
      trim: true,
    },
    roleCategory: {
      type: String,
      trim: true,
      default: 'General',
    },
    requirementsVersion: {
      type: String,
      default: '1.0',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    lastRegeneratedAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    totalTasks: {
      type: Number,
      min: 0,
      default: 0,
    },
    completedTasks: {
      type: Number,
      min: 0,
      default: 0,
    },
    inProgressTasks: {
      type: Number,
      min: 0,
      default: 0,
    },
    phases: {
      type: [phaseSummarySchema],
      default: [],
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Recompute progress and phase summary counts
 */
roadmapSchema.methods.recalculateProgress = function () {
  const total = this.tasks.length;
  const completed = this.tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = this.tasks.filter((t) => t.status === 'IN_PROGRESS').length;

  this.totalTasks = total;
  this.completedTasks = completed;
  this.inProgressTasks = inProgress;
  this.progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update phase summary stats
  if (Array.isArray(this.phases)) {
    this.phases.forEach((phase) => {
      const phaseTasks = this.tasks.filter((t) => t.phaseId === phase.phaseId);
      phase.taskCount = phaseTasks.length;
      phase.completedTaskCount = phaseTasks.filter((t) => t.status === 'COMPLETED').length;
    });
  }
};

module.exports = mongoose.model('Roadmap', roadmapSchema);
