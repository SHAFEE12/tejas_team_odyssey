/**
 * careerIntelligence.controller.js
 *
 * Controller for Career Intelligence endpoints.
 * Strictly user-scoped to req.user._id.
 */

const {
  generateCareerIntelligence,
  getOrRecordIntelligenceSnapshot,
} = require('../services/careerIntelligence.service');
const { generateWeeklyStrategy } = require('../services/weeklyStrategy.service');
const CareerIntelligenceSnapshot = require('../models/CareerIntelligenceSnapshot');

/**
 * GET /api/career-intelligence
 * Full strategic intelligence profile
 */
async function getIntelligence(req, res) {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.refresh === 'true';

    const [intelligence, weeklyStrategy] = await Promise.all([
      generateCareerIntelligence(userId, { forceRefresh }),
      generateWeeklyStrategy(userId),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...intelligence,
        weeklyStrategy,
      },
    });
  } catch (error) {
    console.error('[CareerIntelligenceController] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while calculating career intelligence.',
    });
  }
}

/**
 * GET /api/career-intelligence/weekly
 * Returns personalized weekly strategy and adaptive time allocation
 */
async function getWeekly(req, res) {
  try {
    const userId = req.user._id;
    const weeklyStrategy = await generateWeeklyStrategy(userId);

    return res.status(200).json({
      success: true,
      data: weeklyStrategy,
    });
  } catch (error) {
    console.error('[CareerIntelligenceController] Weekly error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while generating weekly strategy.',
    });
  }
}

/**
 * GET /api/career-intelligence/trends
 * Returns authentic snapshot history
 */
async function getTrends(req, res) {
  try {
    const userId = req.user._id;
    const snapshots = await CareerIntelligenceSnapshot.find({ user: userId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        snapshots,
        hasHistory: snapshots.length >= 2,
        status: snapshots.length >= 2 ? 'AVAILABLE' : 'INSUFFICIENT_DATA',
      },
    });
  } catch (error) {
    console.error('[CareerIntelligenceController] Trends error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving trends.',
    });
  }
}

/**
 * POST /api/career-intelligence/refresh
 * Forces immediate snapshot creation and recalculated intelligence
 */
async function refreshIntelligence(req, res) {
  try {
    const userId = req.user._id;
    const [intelligence, weeklyStrategy] = await Promise.all([
      generateCareerIntelligence(userId, { forceRefresh: true }),
      generateWeeklyStrategy(userId),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Career Intelligence recalculated successfully.',
      data: {
        ...intelligence,
        weeklyStrategy,
      },
    });
  } catch (error) {
    console.error('[CareerIntelligenceController] Refresh error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while refreshing career intelligence.',
    });
  }
}

module.exports = {
  getIntelligence,
  getWeekly,
  getTrends,
  refreshIntelligence,
};
