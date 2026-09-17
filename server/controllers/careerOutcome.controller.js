/**
 * careerOutcome.controller.js
 *
 * Express controller for Career Outcome & Trajectory Engine (/api/career-outcome).
 * Strictly enforces user ownership via req.user._id.
 */

const mongoose = require('mongoose');
const CareerMilestone = require('../models/CareerMilestone');
const CareerTrajectorySnapshot = require('../models/CareerTrajectorySnapshot');
const {
  getCareerOutcomeData,
  getWeeklyOutcomeReview,
  getMonthlyOutcomeReview,
} = require('../services/careerOutcome.service');

/**
 * GET /api/career-outcome
 * Returns aggregated career outcome, trajectory, stage, funnel, and bottleneck.
 */
async function getTrajectory(req, res) {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.refresh === 'true';
    const data = await getCareerOutcomeData(userId, { forceRefresh });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/career-outcome/trends
 * Returns historical snapshot trajectory trends.
 */
async function getTrends(req, res) {
  try {
    const userId = req.user._id;
    const snapshots = await CareerTrajectorySnapshot.find({ user: userId })
      .sort({ generatedAt: -1 })
      .limit(15)
      .lean();
    return res.status(200).json({ success: true, data: snapshots });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/career-outcome/funnel
 * Returns career conversion funnel.
 */
async function getFunnel(req, res) {
  try {
    const userId = req.user._id;
    const data = await getCareerOutcomeData(userId);
    return res.status(200).json({ success: true, data: data.funnel });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/career-outcome/milestones
 * Returns active career progression milestones.
 */
async function getMilestones(req, res) {
  try {
    const userId = req.user._id;
    const milestones = await CareerMilestone.find({ user: userId })
      .sort({ status: -1, priority: -1, createdAt: 1 })
      .lean();
    return res.status(200).json({ success: true, data: milestones });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/career-outcome/milestones
 * Creates a custom career milestone.
 */
async function createMilestone(req, res) {
  try {
    const userId = req.user._id;
    const { title, description, category, priority, targetDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required.' });
    }

    const milestone = await CareerMilestone.create({
      user: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'CAREER',
      priority: priority || 'MEDIUM',
      targetDate: targetDate ? new Date(targetDate) : null,
      status: 'NOT_STARTED',
      progress: 0,
    });

    return res.status(201).json({ success: true, data: milestone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /api/career-outcome/milestones/:id
 * Updates status or progress of an existing milestone.
 */
async function updateMilestone(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID format.' });
    }

    const { status, progress, targetDate } = req.body;

    const milestone = await CareerMilestone.findOne({ _id: id, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found.' });
    }

    if (status) {
      milestone.status = status;
      if (status === 'COMPLETED' && !milestone.completedAt) {
        milestone.completedAt = new Date();
        milestone.progress = 100;
      }
    }
    if (typeof progress === 'number') {
      milestone.progress = Math.max(0, Math.min(100, progress));
    }
    if (targetDate) {
      milestone.targetDate = new Date(targetDate);
    }

    await milestone.save();
    return res.status(200).json({ success: true, data: milestone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/career-outcome/weekly-review
 * Returns 7-day outcome review.
 */
async function getWeeklyReview(req, res) {
  try {
    const userId = req.user._id;
    const review = await getWeeklyOutcomeReview(userId);
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/career-outcome/monthly-review
 * Returns 30-day outcome review.
 */
async function getMonthlyReview(req, res) {
  try {
    const userId = req.user._id;
    const review = await getMonthlyOutcomeReview(userId);
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/career-outcome/refresh
 * Explicitly forces a fresh recalculation and new snapshot recording.
 */
async function refreshOutcome(req, res) {
  try {
    const userId = req.user._id;
    const data = await getCareerOutcomeData(userId, { forceRefresh: true });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getTrajectory,
  getTrends,
  getFunnel,
  getMilestones,
  createMilestone,
  updateMilestone,
  getWeeklyReview,
  getMonthlyReview,
  refreshOutcome,
};
