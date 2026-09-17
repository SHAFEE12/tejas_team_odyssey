/**
 * analytics.routes.js
 *
 * Express routes for Career Analytics module (/api/analytics).
 */

const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('student'));

router.get('/', getAnalytics);

module.exports = router;
