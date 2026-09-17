/**
 * project.routes.js
 *
 * Express routes for student project portfolio & recommendations.
 *
 * Endpoints:
 * - GET    /api/projects
 * - GET    /api/projects/recommendations
 * - GET    /api/projects/:projectId
 * - POST   /api/projects
 * - PUT    /api/projects/:projectId
 * - PUT    /api/projects/:projectId/milestones/:milestoneId
 * - DELETE /api/projects/:projectId
 * - POST   /api/projects/:projectId/github
 * - DELETE /api/projects/:projectId/github
 * - POST   /api/projects/:projectId/deployment
 */

const express = require('express');
const {
  getProjects,
  getRecommendations,
  getProjectById,
  createProject,
  updateProject,
  updateMilestoneStatus,
  deleteProject,
  connectGithubRepo,
  disconnectGithubRepo,
  updateDeployment,
} = require('../controllers/project.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Protected: requires authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// Routes
router.get('/recommendations', getRecommendations);
router.get('/', getProjects);
router.post('/', createProject);

router.get('/:projectId', getProjectById);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

router.put('/:projectId/milestones/:milestoneId', updateMilestoneStatus);
router.post('/:projectId/github', connectGithubRepo);
router.delete('/:projectId/github', disconnectGithubRepo);
router.post('/:projectId/deployment', updateDeployment);

module.exports = router;
