/**
 * matching.routes.js
 *
 * Route definitions for Central Matching & Career Intelligence Engine APIs.
 * Connects Students, Opportunities, Industry Partners, Institutions, and Academicians
 * through a unified, role-gated matching architecture.
 */

'use strict';

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
  getStudentMatches,
  getStudentOpportunityDetail,
  getOpportunityCandidates,
  getIndustryTalentMatches,
  getInstitutionSkillPriorities,
  getInstitutionMarketDemand,
  getInstitutionSkills,
  getInstitutionDepartments,
  getAcademicianMenteeMatches,
} = require('../controllers/matching.controller');

const router = express.Router();

// All matching routes require authentication
router.use(requireAuth);

// ── Student Matching Routes ──────────────────────────────────────────
router.get(
  '/student/opportunities',
  requireRole('student', 'super_admin'),
  getStudentMatches
);

router.get(
  '/student/opportunities/:opportunityId',
  requireRole('student', 'super_admin'),
  getStudentOpportunityDetail
);

// ── Industry Matching Routes ─────────────────────────────────────────
router.get(
  '/opportunities/:opportunityId/candidates',
  requireRole('industry', 'super_admin'),
  getOpportunityCandidates
);

router.get(
  '/industry/talent',
  requireRole('industry', 'super_admin'),
  getIndustryTalentMatches
);

// ── Institution Market & Skill Priority Routes ───────────────────────
router.get(
  '/institution/skill-priorities',
  requireRole('institution_admin', 'institution', 'super_admin'),
  getInstitutionSkillPriorities
);

router.get(
  '/institution/demand',
  requireRole('institution_admin', 'institution', 'super_admin'),
  getInstitutionMarketDemand
);

router.get(
  '/institution/skills',
  requireRole('institution_admin', 'institution', 'super_admin'),
  getInstitutionSkills
);

router.get(
  '/institution/departments',
  requireRole('institution_admin', 'institution', 'super_admin'),
  getInstitutionDepartments
);

// ── Academician Mentee Matching Routes ───────────────────────────────
router.get(
  '/academician/students/:studentId/opportunities',
  requireRole('academician', 'super_admin'),
  getAcademicianMenteeMatches
);

// ── SIH 26044 Canonical Matching Endpoints ─────────────────────────
const sihMatchingService = require('../services/matching/sihMatching.service');

router.get('/internship/:id', requireRole('industry', 'academia', 'admin'), async (req, res, next) => {
  try {
    const candidates = await sihMatchingService.getInternshipCandidateMatches(req.params.id);
    res.json({ success: true, count: candidates.length, data: candidates });
  } catch (err) {
    next(err);
  }
});

router.get('/internships', async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const matches = await sihMatchingService.getStudentInternshipMatches(studentId);
    const limit = Number(req.query.limit) || matches.length;
    res.json({ success: true, count: matches.slice(0, limit).length, data: matches.slice(0, limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/student/:id', async (req, res, next) => {
  try {
    const targetId = !req.params.id || req.params.id === 'undefined' || req.params.id === 'me'
      ? req.user._id
      : req.params.id;

    // Student can only query themselves unless faculty/admin
    if (req.user.role === 'student' && String(req.user._id) !== String(targetId)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to own profile' });
    }
    const matches = await sihMatchingService.getStudentInternshipMatches(targetId);
    res.json({ success: true, count: matches.length, data: matches });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
