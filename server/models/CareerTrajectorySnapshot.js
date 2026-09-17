/**
 * CareerTrajectorySnapshot.js
 *
 * Mongoose model for tracking authentic career outcome and trajectory snapshots.
 *
 * Strict Student Ownership:
 * - Scoped strictly to user: req.user._id
 * - Records historical outcome snapshots deduplicated within 24 hours.
 * - Safe sanitization: Never stores raw resume text, private notes, tokens, or credentials.
 */

const mongoose = require('mongoose');

const dimensionTrendSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['IMPROVING', 'STABLE', 'DECLINING', 'INSUFFICIENT_DATA'],
      default: 'INSUFFICIENT_DATA',
    },
    delta: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const careerTrajectorySnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    snapshotDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    careerReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    skillCoverage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    executionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    portfolioQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    resumeReadiness: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    dsaProgress: {
      type: Number,
      default: 0,
    },
    githubEvidence: {
      type: Number,
      default: 0,
    },
    applicationActivity: {
      type: Number,
      default: 0,
    },
    interviewProgress: {
      type: Number,
      default: 0,
    },
    offerProgress: {
      type: Number,
      default: 0,
    },
    evidenceStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    careerStage: {
      type: String,
      enum: [
        'FOUNDATION',
        'SKILL_BUILDING',
        'PORTFOLIO_BUILDING',
        'PROOF_BUILDING',
        'APPLICATION_READY',
        'APPLICATION_ACTIVE',
        'INTERVIEW_PREPARATION',
        'INTERVIEW_ACTIVE',
        'OFFER_STAGE',
        'INSUFFICIENT_DATA',
      ],
      default: 'INSUFFICIENT_DATA',
      required: true,
    },
    trajectoryStatus: {
      type: String,
      enum: [
        'ACCELERATING',
        'IMPROVING',
        'STABLE',
        'STAGNATING',
        'DECLINING',
        'INSUFFICIENT_DATA',
      ],
      default: 'INSUFFICIENT_DATA',
    },
    trajectoryDelta: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    dimensionTrends: {
      skills: { type: dimensionTrendSchema, default: () => ({}) },
      portfolio: { type: dimensionTrendSchema, default: () => ({}) },
      resume: { type: dimensionTrendSchema, default: () => ({}) },
      dsa: { type: dimensionTrendSchema, default: () => ({}) },
      github: { type: dimensionTrendSchema, default: () => ({}) },
      execution: { type: dimensionTrendSchema, default: () => ({}) },
      applications: { type: dimensionTrendSchema, default: () => ({}) },
      interviews: { type: dimensionTrendSchema, default: () => ({}) },
    },
    funnel: {
      saved: { type: Number, default: 0 },
      applied: { type: Number, default: 0 },
      oa: { type: Number, default: 0 },
      interview: { type: Number, default: 0 },
      finalRound: { type: Number, default: 0 },
      offer: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
      responseRate: { type: Number, default: null },
      interviewRate: { type: Number, default: null },
      finalRoundRate: { type: Number, default: null },
      offerRate: { type: Number, default: null },
    },
    bottleneck: {
      type: { type: String, trim: true, default: '' },
      title: { type: String, trim: true, default: '' },
      reason: { type: String, trim: true, default: '' },
      evidence: { type: String, trim: true, default: '' },
      recommendedAction: { type: String, trim: true, default: '' },
    },
    keyWins: {
      type: [String],
      default: [],
    },
    keyBlockers: {
      type: [String],
      default: [],
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

careerTrajectorySnapshotSchema.index({ user: 1, generatedAt: -1 });

const CareerTrajectorySnapshot = mongoose.model(
  'CareerTrajectorySnapshot',
  careerTrajectorySnapshotSchema
);

module.exports = CareerTrajectorySnapshot;
