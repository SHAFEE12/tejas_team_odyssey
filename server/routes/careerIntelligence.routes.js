/**
 * careerIntelligence.routes.js
 *
 * Express routes for Career Intelligence Engine (/api/career-intelligence).
 */

const express = require('express');
const {
  getIntelligence,
  getWeekly,
  getTrends,
  refreshIntelligence,
} = require('../controllers/careerIntelligence.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/', getIntelligence);
router.get('/weekly', getWeekly);
router.get('/trends', getTrends);
router.post('/refresh', refreshIntelligence);

module.exports = router;
