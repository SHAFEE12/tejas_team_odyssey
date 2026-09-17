/**
 * careerOutcome.routes.js
 *
 * Express routes for Career Outcome & Trajectory Engine (/api/career-outcome).
 * Protected by requireAuth and requireRole('student').
 */

const express = require('express');
const {
  getTrajectory,
  getTrends,
  getFunnel,
  getMilestones,
  createMilestone,
  updateMilestone,
  getWeeklyReview,
  getMonthlyReview,
  refreshOutcome,
} = require('../controllers/careerOutcome.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/', getTrajectory);
router.get('/trends', getTrends);
router.get('/funnel', getFunnel);
router.get('/milestones', getMilestones);
router.post('/milestones', createMilestone);
router.patch('/milestones/:id', updateMilestone);
router.get('/weekly-review', getWeeklyReview);
router.get('/monthly-review', getMonthlyReview);
router.post('/refresh', refreshOutcome);

module.exports = router;
