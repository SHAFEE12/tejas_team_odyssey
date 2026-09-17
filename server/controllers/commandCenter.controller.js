/**
 * commandCenter.controller.js
 *
 * Express controller for Career Command Center (/api/command-center).
 * Strictly enforces user ownership via req.user._id.
 */

const {
  getCommandCenterData,
  getOrRecordCommandCenterSnapshot,
  resolveExecutableNextBestAction,
} = require('../services/commandCenter.service');

const { buildCopilotContext } = require('../services/copilotContext.service');
const { generateRankedCandidateActions } = require('../services/careerIntelligence.service');

/**
 * GET /api/command-center
 * Returns unified command center data.
 */
async function getCommandCenter(req, res) {
  try {
    const userId = req.user._id;
    const forceRefresh = req.query.refresh === 'true';
    const data = await getCommandCenterData(userId, { forceRefresh });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/command-center/trends
 * Returns historical snapshot trends.
 */
async function getTrends(req, res) {
  try {
    const userId = req.user._id;
    const data = await getCommandCenterData(userId);
    return res.status(200).json({ success: true, data: data.trends });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/command-center/actions
 * Returns ranked executable actions with task-linking.
 */
async function getActions(req, res) {
  try {
    const userId = req.user._id;
    const context = await buildCopilotContext(userId);
    const ranked = generateRankedCandidateActions(context);
    const primary = await resolveExecutableNextBestAction(userId, ranked);
    return res.status(200).json({
      success: true,
      data: {
        primary,
        secondary: ranked.slice(1, 5),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/command-center/refresh
 * Forces snapshot update and re-evaluates live state.
 */
async function refreshCommandCenter(req, res) {
  try {
    const userId = req.user._id;
    const data = await getCommandCenterData(userId, { forceRefresh: true });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCommandCenter,
  getTrends,
  getActions,
  refreshCommandCenter,
};
