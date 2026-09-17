/**
 * adaptiveCareer.controller.js
 *
 * Express controller for Adaptive Career Operating System (/api/adaptive-career).
 * Strictly enforces user ownership via req.user._id.
 */

const AdaptivePlanSnapshot = require('../models/AdaptivePlanSnapshot');
const ExecutionTask = require('../models/ExecutionTask');
const {
  generateAdaptiveWeeklyPlan,
  generateAdaptiveDailyPlan,
  getOrRecordAdaptiveSnapshot,
  updateAdaptivePreference,
  analyzeBehaviorSignals,
  detectExecutionFriction,
} = require('../services/adaptiveCareer.service');

/**
 * GET /api/adaptive-career/plan
 * Returns active adaptive plan (uses 24h cached snapshot or generates fresh).
 */
async function getAdaptivePlan(req, res) {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.refresh === 'true';
    const snapshot = await getOrRecordAdaptiveSnapshot(userId, { forceRefresh });
    return res.status(200).json({ success: true, data: snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/adaptive-career/weekly
 * Returns live adaptive weekly plan.
 */
async function getWeeklyPlan(req, res) {
  try {
    const userId = req.user._id;
    const plan = await generateAdaptiveWeeklyPlan(userId);
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/adaptive-career/daily
 * Returns live adaptive daily plan.
 */
async function getDailyPlan(req, res) {
  try {
    const userId = req.user._id;
    const plan = await generateAdaptiveDailyPlan(userId);
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/adaptive-career/snapshots
 * Returns historical adaptive plan snapshots (max 20, newest first).
 */
async function getSnapshots(req, res) {
  try {
    const userId = req.user._id;
    const snapshots = await AdaptivePlanSnapshot.find({ user: userId })
      .sort({ generatedAt: -1 })
      .limit(20)
      .lean();
    return res.status(200).json({ success: true, data: snapshots });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/adaptive-career/friction
 * Returns execution friction analysis.
 */
async function getFriction(req, res) {
  try {
    const userId = req.user._id;
    const tasks = await ExecutionTask.find({ user: userId })
      .sort({ scheduledDate: -1 })
      .limit(50)
      .lean();
    const signals = analyzeBehaviorSignals(tasks);
    const friction = detectExecutionFriction(signals, tasks);
    return res.status(200).json({
      success: true,
      data: {
        frictionSummary: friction,
        behaviorSignals: signals,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PUT /api/adaptive-career/preferences
 * Updates student preferences (planPreference: 'ADAPTIVE' | 'STANDARD', isPaused: boolean).
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user._id;
    const { planPreference, isPaused } = req.body;
    const updated = await updateAdaptivePreference(userId, { planPreference, isPaused });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/adaptive-career/refresh
 * Forces generation of a new adaptive plan snapshot.
 */
async function refreshPlan(req, res) {
  try {
    const userId = req.user._id;
    const snapshot = await getOrRecordAdaptiveSnapshot(userId, { forceRefresh: true });
    return res.status(200).json({ success: true, data: snapshot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getAdaptivePlan,
  getWeeklyPlan,
  getDailyPlan,
  getSnapshots,
  getFriction,
  updatePreferences,
  refreshPlan,
};
