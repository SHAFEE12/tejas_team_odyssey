/**
 * opportunity.routes.js
 *
 * Express routes for Opportunities & Application Tracking.
 *
 * Endpoints:
 * - GET    /api/opportunities                      → list all ranked opportunities
 * - GET    /api/opportunities/applications         → student's applications
 * - GET    /api/opportunities/:id                  → single opportunity detail
 * - POST   /api/opportunities/:id/save             → save / mark as applied
 * - PUT    /api/opportunities/applications/:appId  → update application status
 * - DELETE /api/opportunities/applications/:appId  → remove application
 *
 * NOTE: Static routes (/applications) MUST be declared before wildcard (/:id).
 */

const express = require('express');
const {
  getOpportunities,
  getOpportunityById,
  getApplications,
  saveOpportunity,
  updateApplication,
  deleteApplication,
} = require('../controllers/opportunity.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Protected: requires authentication and student role
router.use(requireAuth);
router.use(requireRole('student'));

// Static routes first (must come before /:id wildcard)
router.get('/applications', getApplications);

// Wildcard routes
router.get('/', getOpportunities);
router.get('/:id', getOpportunityById);
router.post('/:id/save', saveOpportunity);

router.put('/applications/:appId', updateApplication);
router.delete('/applications/:appId', deleteApplication);

module.exports = router;
