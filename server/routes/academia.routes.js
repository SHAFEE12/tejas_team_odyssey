/**
 * academia.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/academia.controller');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('academia', 'admin'));

router.get('/overview', controller.getOverview);
router.get('/students', controller.getStudents);
router.get('/students/:id', controller.getStudentDetail);
router.post('/verify-skill', controller.verifySkill);
router.get('/skill-intelligence', controller.getSkillIntelligence);

module.exports = router;
