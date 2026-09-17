/**
 * execution.controller.js
 *
 * Controller for Career Execution OS (/api/execution).
 * Strictly verifies ownership via req.user._id on every operation.
 * Never trusts client user IDs.
 */

const mongoose = require('mongoose');
const executionService = require('../services/execution.service');

/* ─── Daily & Analytics Handlers ─────────────────────────────────── */

async function getTodayExecution(req, res) {
  try {
    const userId = req.user._id;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await executionService.getDailyExecution(userId, date);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const userId = req.user._id;
    const analytics = await executionService.getExecutionAnalytics(userId);
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getWeeklyReview(req, res) {
  try {
    const userId = req.user._id;
    const review = await executionService.getWeeklyReview(userId);
    return res.status(200).json({ success: true, data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getHeatmap(req, res) {
  try {
    const userId = req.user._id;
    const days = req.query.days || 14;
    const heatmap = await executionService.getExecutionHeatmap(userId, days);
    return res.status(200).json({ success: true, data: heatmap });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getAdaptivePlan(req, res) {
  try {
    const userId = req.user._id;
    const plan = await executionService.getAdaptivePlan(userId);
    return res.status(200).json({ success: true, data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/* ─── Goal Handlers ──────────────────────────────────────────────── */

async function listGoals(req, res) {
  try {
    const userId = req.user._id;
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    const goals = await executionService.getGoals(userId, filters);
    return res.status(200).json({ success: true, data: goals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createGoal(req, res) {
  try {
    const userId = req.user._id;
    const goal = await executionService.createGoal(userId, req.body);
    return res.status(201).json({ success: true, data: goal });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function getGoal(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID format.' });
    }
    const goal = await executionService.getGoalById(userId, id);
    return res.status(200).json({ success: true, data: goal });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

async function updateGoal(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID format.' });
    }
    const updated = await executionService.updateGoal(userId, id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function completeGoal(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID format.' });
    }
    const goal = await executionService.completeGoal(userId, id);
    return res.status(200).json({ success: true, data: goal });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function pauseGoal(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID format.' });
    }
    const goal = await executionService.pauseGoal(userId, id);
    return res.status(200).json({ success: true, data: goal });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteGoal(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID format.' });
    }
    const result = await executionService.deleteGoal(userId, id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/* ─── Task Handlers ──────────────────────────────────────────────── */

async function createTask(req, res) {
  try {
    const userId = req.user._id;
    const task = await executionService.createTask(userId, req.body);
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const updated = await executionService.updateTask(userId, id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function startTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.startTask(userId, id, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function pauseTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.pauseTask(userId, id, req.body.minutes, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function resumeTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.resumeTask(userId, id, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function completeTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.completeTask(userId, id, req.body.minutes, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function skipTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.skipTask(userId, id, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function cancelTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const task = await executionService.cancelTask(userId, id, req.body.note);
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteTask(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID format.' });
    }
    const result = await executionService.deleteTask(userId, id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/* ─── Check-In Handlers ──────────────────────────────────────────── */

async function getCurrentWeekCheckIn(req, res) {
  try {
    const userId = req.user._id;
    const data = await executionService.getCurrentWeekCheckIn(userId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function submitWeeklyCheckIn(req, res) {
  try {
    const userId = req.user._id;
    const result = await executionService.submitWeeklyCheckIn(userId, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateWeeklyCheckIn(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid check-in ID format.' });
    }
    const updated = await executionService.updateWeeklyCheckIn(userId, id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getTodayExecution,
  getAnalytics,
  getWeeklyReview,
  getHeatmap,
  getAdaptivePlan,

  listGoals,
  createGoal,
  getGoal,
  updateGoal,
  completeGoal,
  pauseGoal,
  deleteGoal,

  createTask,
  updateTask,
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  skipTask,
  cancelTask,
  deleteTask,

  getCurrentWeekCheckIn,
  submitWeeklyCheckIn,
  updateWeeklyCheckIn,
};
