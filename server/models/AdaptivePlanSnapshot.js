/**
 * AdaptivePlanSnapshot.js
 *
 * Mongoose model for persisting weekly/daily Adaptive Career Operating System snapshots.
 *
 * Strict Student Ownership:
 * - Scoped strictly to user: req.user._id
 * - Records historical adaptations deduplicated within 24h (or on explicit refresh)
 * - Safe snapshot sanitization: Never stores credentials, tokens, raw resume, or private notes.
 */

const mongoose = require('mongoose');

const adaptiveTaskRecommendationSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExecutionTask',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW', 'URGENT'],
      default: 'MEDIUM',
    },
    originalMinutes: {
      type: Number,
      min: 0,
      max: 480,
      default: 60,
    },
    adaptedMinutes: {
      type: Number,
      min: 5,
      max: 480,
      default: 45,
    },
    sizingAdjustmentReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'URGENT', 'STANDARD', 'LOW'],
      default: 'STANDARD',
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
      default: 'PLANNED',
    },
  },
  { _id: true }
);

const adaptivePlanSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    mode: {
      type: String,
      enum: [
        'DEADLINE_MODE',
        'INTERVIEW_MODE',
        'EXECUTION_RECOVERY',
        'SKILL_GAP_CLOSURE',
        'PROJECT_EXECUTION',
        'APPLICATION_CAMPAIGN',
        'NORMAL',
        'INSUFFICIENT_DATA',
      ],
      default: 'NORMAL',
      required: true,
    },
    modeReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    focusArea: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'General Career Preparation',
    },
    recommendedHours: {
      type: Number,
      min: 0,
      max: 40,
      default: 10,
    },
    objectives: {
      type: [String],
      default: [],
    },
    taskRecommendations: {
      type: [adaptiveTaskRecommendationSchema],
      default: [],
    },
    priorityAdjustments: [
      {
        category: { type: String, trim: true },
        weightChange: { type: Number, default: 0 },
        reason: { type: String, trim: true, maxlength: 300 },
      },
    ],
    frictionSummary: [
      {
        category: { type: String, trim: true },
        frictionLevel: {
          type: String,
          enum: ['LOW', 'MODERATE', 'HIGH'],
          default: 'LOW',
        },
        evidence: { type: String, trim: true, maxlength: 300 },
        recommendation: { type: String, trim: true, maxlength: 300 },
      },
    ],
    behaviorSummary: {
      completionRate: { type: Number, default: null },
      skipRate: { type: Number, default: null },
      overdueCount: { type: Number, default: 0 },
      avgCompletionTimeMinutes: { type: Number, default: null },
      mostSkippedCategory: { type: String, default: null },
      mostActiveCategory: { type: String, default: null },
      velocityTrend: {
        type: String,
        enum: ['ACCELERATING', 'STABLE', 'DECELERATING', 'CRITICAL_DROP', 'INSUFFICIENT_DATA'],
        default: 'INSUFFICIENT_DATA',
      },
    },
    riskAdjustments: {
      type: [String],
      default: [],
    },
    adaptationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    planPreference: {
      type: String,
      enum: ['ADAPTIVE', 'STANDARD'],
      default: 'ADAPTIVE',
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    sourceSnapshotIds: {
      careerScoreSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerScoreSnapshot', default: null },
      commandCenterSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommandCenterSnapshot', default: null },
      careerIntelligenceSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerIntelligenceSnapshot', default: null },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

adaptivePlanSnapshotSchema.index({ user: 1, generatedAt: -1 });

const AdaptivePlanSnapshot = mongoose.model('AdaptivePlanSnapshot', adaptivePlanSnapshotSchema);

module.exports = AdaptivePlanSnapshot;
