/**
 * copilot.routes.js
 *
 * Express routes for Career Copilot (/api/copilot).
 */

const express = require('express');
const { query, getContext, getStatus } = require('../controllers/copilot.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { copilotRateLimiter } = require('../middleware/copilotRateLimiter');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.post('/query', copilotRateLimiter, query);
router.get('/context', getContext);
router.get('/status', getStatus);

module.exports = router;
