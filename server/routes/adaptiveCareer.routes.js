/**
 * adaptiveCareer.routes.js
 *
 * Express routes for Adaptive Career Operating System (/api/adaptive-career).
 * Protected by requireAuth and requireRole('student').
 */

const express = require('express');
const {
  getAdaptivePlan,
  getWeeklyPlan,
  getDailyPlan,
  getSnapshots,
  getFriction,
  updatePreferences,
  refreshPlan,
} = require('../controllers/adaptiveCareer.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/plan', getAdaptivePlan);
router.get('/weekly', getWeeklyPlan);
router.get('/daily', getDailyPlan);
router.get('/snapshots', getSnapshots);
router.get('/friction', getFriction);
router.put('/preferences', updatePreferences);
router.post('/refresh', refreshPlan);

module.exports = router;
