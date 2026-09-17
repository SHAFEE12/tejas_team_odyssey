/**
 * roadmap.routes.js
 *
 * Express routes for student career roadmap.
 *
 * Endpoints:
 * - GET    /api/roadmap
 * - POST   /api/roadmap/generate
 * - PUT    /api/roadmap/tasks/:taskId
 * - DELETE /api/roadmap
 */

const express = require('express');
const {
  getRoadmap,
  generateRoadmap,
  updateTaskStatus,
  deleteRoadmap,
} = require('../controllers/roadmap.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Protected: requires authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// Routes
router.get('/', getRoadmap);
router.post('/generate', generateRoadmap);
router.put('/tasks/:taskId', updateTaskStatus);
router.delete('/', deleteRoadmap);

module.exports = router;
