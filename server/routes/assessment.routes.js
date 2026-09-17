/**
 * assessment.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/assessment.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', controller.getAssessments);
router.get('/attempts/my', requireRole('student', 'admin'), controller.getMyAttempts);
router.get('/:id', controller.getAssessmentById);
router.post('/', requireRole('academia', 'admin'), controller.createAssessment);
router.post('/:id/attempt', requireRole('student', 'admin'), controller.submitAssessmentAttempt);

module.exports = router;
