const express = require('express');
const { getSkillGap } = require('../controllers/skillGap.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Protected: requires authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// GET /api/skill-gap
router.get('/', getSkillGap);

module.exports = router;
