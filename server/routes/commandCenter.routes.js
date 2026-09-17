/**
 * commandCenter.routes.js
 *
 * Express routes for Career Command Center (/api/command-center).
 * Protected by requireAuth and requireRole('student').
 */

const express = require('express');
const {
  getCommandCenter,
  getTrends,
  getActions,
  refreshCommandCenter,
} = require('../controllers/commandCenter.controller');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/', getCommandCenter);
router.get('/trends', getTrends);
router.get('/actions', getActions);
router.post('/refresh', refreshCommandCenter);

module.exports = router;
