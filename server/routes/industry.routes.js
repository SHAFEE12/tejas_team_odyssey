/**
 * industry.routes.js
 *
 * Route definitions for Industry Partner Portal APIs.
 * Guarded strictly by authentication and role-based access control (industry / super_admin).
 */

'use strict';

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
  getDashboardOverview,
  getProfile,
  updateProfile,
  getOpportunities,
  createOpportunity,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  searchTalent,
  getCandidate360,
  getOpportunityApplicants,
  shortlistCandidate,
  updateApplicationStage,
  getShortlistedCandidates,
  getInterviews,
  getOffers,
} = require('../controllers/industry.controller');

const router = express.Router();

// Guard all industry routes with authentication and role access control
router.use(requireAuth);
router.use(requireRole('industry', 'super_admin'));

// Executive Dashboard
router.get('/dashboard', getDashboardOverview);

// Company Profile Management
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Job & Internship Opportunity Management
router.get('/opportunities', getOpportunities);
router.post('/opportunities', createOpportunity);
router.get('/opportunities/:id', getOpportunityById);
router.patch('/opportunities/:id', updateOpportunity);
router.delete('/opportunities/:id', deleteOpportunity);

// Pipeline & Applicants
router.get('/opportunities/:id/applicants', getOpportunityApplicants);
router.post('/opportunities/:id/shortlist', shortlistCandidate);
router.patch('/applications/:id/stage', updateApplicationStage);

// Talent Discovery & Candidate 360
router.get('/talent', searchTalent);
router.get('/talent/:studentId', getCandidate360);

// Aggregated Recruitment Stages
router.get('/shortlisted', getShortlistedCandidates);
router.get('/interviews', getInterviews);
router.get('/offers', getOffers);

module.exports = router;
