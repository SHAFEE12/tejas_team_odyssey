/**
 * evaluation.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/evaluation.controller');

const router = express.Router();

router.use(requireAuth);

router.post('/', requireRole('industry', 'academia', 'admin'), controller.createEvaluation);
router.get('/student/:studentId', controller.getStudentEvaluations);

module.exports = router;
