/**
 * roadmap.controller.js
 *
 * Handles HTTP requests for Personalized Career Roadmap.
 *
 * Routes:
 * - GET /api/roadmap
 * - POST /api/roadmap/generate
 * - PUT /api/roadmap/tasks/:taskId
 * - DELETE /api/roadmap
 *
 * Security: requireAuth, requireRole('student')
 * Identifies student strictly by req.user._id.
 */

const Roadmap = require('../models/Roadmap');
const SkillProfile = require('../models/SkillProfile');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const IndustryEvaluation = require('../models/IndustryEvaluation');
const { generateRoadmapData } = require('../services/roadmap.service');

/**
 * GET /api/roadmap
 * Returns the student's existing roadmap, or automatically generates one if missing
 */
async function getRoadmap(req, res) {
  try {
    const userId = req.user._id;

    // Concurrently fetch profile records and evaluations
    const [skillProfile, resume, githubProfile, dsaProfile, existingRoadmap, evaluations] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }),
      Roadmap.findOne({ user: userId }),
      IndustryEvaluation.find({ studentId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const targetRole = skillProfile?.targetRole || '';

    // If no target role is set
    if (!targetRole) {
      return res.status(200).json({
        success: true,
        data: {
          targetRole: null,
          hasCareerGoal: false,
          progress: 0,
          totalTasks: 0,
          completedTasks: 0,
          phases: [],
          tasks: [],
          message: 'Set your career goal first to generate a personalized roadmap.',
        },
      });
    }

    // Check if new evaluation feedback exists that needs reconciliation into roadmap
    const hasUnreconciledFeedback =
      Array.isArray(evaluations) &&
      evaluations.some((e) => Array.isArray(e.weaknesses) && e.weaknesses.length > 0) &&
      (!existingRoadmap?.tasks || !existingRoadmap.tasks.some((t) => t.taskId?.includes('remediation')));

    // If roadmap already exists, target role matches, and no new feedback to inject, return it
    if (existingRoadmap && existingRoadmap.targetRole.toLowerCase() === targetRole.toLowerCase() && !hasUnreconciledFeedback) {
      return res.status(200).json({
        success: true,
        data: existingRoadmap,
      });
    }

    // Otherwise, generate fresh roadmap and persist it
    const generated = generateRoadmapData({
      skillProfile,
      resume,
      githubProfile,
      dsaProfile,
      existingRoadmap,
      evaluations,
    });

    const savedRoadmap = await Roadmap.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        targetRole: generated.targetRole,
        roleId: generated.roleId,
        roleCategory: generated.roleCategory,
        requirementsVersion: generated.requirementsVersion,
        generatedAt: generated.metadata?.generatedAt || new Date(),
        lastRegeneratedAt: new Date(),
        progress: generated.progress,
        totalTasks: generated.totalTasks,
        completedTasks: generated.completedTasks,
        inProgressTasks: generated.inProgressTasks,
        phases: generated.phases,
        tasks: generated.tasks,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      data: savedRoadmap,
    });
  } catch (err) {
    console.error('[RoadmapController] Error fetching roadmap:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve roadmap. Please try again later.',
    });
  }
}

/**
 * POST /api/roadmap/generate
 * Forces regeneration of the roadmap using fresh SkillProfile, Resume, GitHub, and DSA data,
 * while preserving completion state of existing tasks.
 */
async function generateRoadmap(req, res) {
  try {
    const userId = req.user._id;

    const [skillProfile, resume, githubProfile, dsaProfile, existingRoadmap, evaluations] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }),
      Roadmap.findOne({ user: userId }),
      IndustryEvaluation.find({ studentId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const targetRole = skillProfile?.targetRole || '';

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Please set your target career goal before generating a roadmap.',
      });
    }

    const generated = generateRoadmapData({
      skillProfile,
      resume,
      githubProfile,
      dsaProfile,
      existingRoadmap,
      evaluations,
    });

    const savedRoadmap = await Roadmap.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        targetRole: generated.targetRole,
        roleId: generated.roleId,
        roleCategory: generated.roleCategory,
        requirementsVersion: generated.requirementsVersion,
        generatedAt: existingRoadmap?.generatedAt || new Date(),
        lastRegeneratedAt: new Date(),
        progress: generated.progress,
        totalTasks: generated.totalTasks,
        completedTasks: generated.completedTasks,
        inProgressTasks: generated.inProgressTasks,
        phases: generated.phases,
        tasks: generated.tasks,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      data: savedRoadmap,
      message: 'Roadmap regenerated successfully.',
    });
  } catch (err) {
    console.error('[RoadmapController] Error generating roadmap:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap. Please try again later.',
    });
  }
}

/**
 * PUT /api/roadmap/tasks/:taskId
 * Updates the completion status of a specific task in the student's roadmap
 */
async function updateTaskStatus(req, res) {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const roadmap = await Roadmap.findOne({ user: userId });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: 'Roadmap not found for current user.',
      });
    }

    const task = roadmap.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID "${taskId}" not found in your roadmap.`,
      });
    }

    // Update status & completed timestamp
    task.status = status;
    task.completedAt = status === 'COMPLETED' ? new Date() : null;

    // Recalculate overall progress and phase counts
    roadmap.recalculateProgress();
    await roadmap.save();

    return res.status(200).json({
      success: true,
      data: roadmap,
      message: `Task "${task.title}" updated to ${status}.`,
    });
  } catch (err) {
    console.error('[RoadmapController] Error updating task status:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task status. Please try again later.',
    });
  }
}

/**
 * DELETE /api/roadmap
 * Deletes/resets the student's stored roadmap
 */
async function deleteRoadmap(req, res) {
  try {
    const userId = req.user._id;
    await Roadmap.findOneAndDelete({ user: userId });

    return res.status(200).json({
      success: true,
      message: 'Roadmap reset successfully.',
    });
  } catch (err) {
    console.error('[RoadmapController] Error deleting roadmap:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset roadmap.',
    });
  }
}

module.exports = {
  getRoadmap,
  generateRoadmap,
  updateTaskStatus,
  deleteRoadmap,
};
