/**
 * execution.routes.js
 *
 * Express routes for Career Execution OS (/api/execution).
 * Protected by requireAuth and requireRole('student').
 */

const express = require('express');
const {
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
} = require('../controllers/execution.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Strict Authentication & Authorization
router.use(requireAuth);
router.use(requireRole('student'));

// Daily & Analytics
router.get('/today', getTodayExecution);
router.get('/analytics', getAnalytics);
router.get('/review', getWeeklyReview);
router.get('/heatmap', getHeatmap);
router.get('/adaptive-plan', getAdaptivePlan);

// Goals
router.get('/goals', listGoals);
router.post('/goals', createGoal);
router.get('/goals/:id', getGoal);
router.put('/goals/:id', updateGoal);
router.post('/goals/:id/complete', completeGoal);
router.post('/goals/:id/pause', pauseGoal);
router.delete('/goals/:id', deleteGoal);

// Tasks
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.post('/tasks/:id/start', startTask);
router.post('/tasks/:id/pause', pauseTask);
router.post('/tasks/:id/resume', resumeTask);
router.post('/tasks/:id/complete', completeTask);
router.post('/tasks/:id/skip', skipTask);
router.post('/tasks/:id/cancel', cancelTask);
router.delete('/tasks/:id', deleteTask);

// Weekly Check-In
router.get('/check-in/current', getCurrentWeekCheckIn);
router.post('/check-in', submitWeeklyCheckIn);
router.put('/check-in/:id', updateWeeklyCheckIn);

module.exports = router;
