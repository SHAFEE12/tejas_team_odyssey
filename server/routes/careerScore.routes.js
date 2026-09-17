const express = require('express');
const { getCareerScore } = require('../controllers/careerScore.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Protected: requires authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// GET /api/career-score
router.get('/', getCareerScore);

module.exports = router;
