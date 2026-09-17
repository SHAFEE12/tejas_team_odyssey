/**
 * institution.routes.js
 *
 * Route definitions for Institution Admin Console & Placement Intelligence APIs.
 * Enforces authentication and role verification (institution_admin / super_admin).
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  getDashboardOverview,
  getStudentCohort,
  getStudentDetail,
  getAcademicians,
  assignStudentToAcademician,
  unassignStudentFromAcademician,
  getDepartments,
  getSkillGaps,
  getIndustryDemand,
  getSkillIntelligence,
  getPlacements,
  getHiringDrives,
  createHiringDrive,
  getHiringDriveEligibleStudents,
} = require('../controllers/institution.controller');

const router = express.Router();

// Guard all institution routes with authentication and role access control
router.use(requireAuth);
router.use(requireRole('institution_admin', 'institution', 'super_admin'));

// Executive Dashboard Overview
router.get('/dashboard', getDashboardOverview);

// Student Cohort Intelligence
router.get('/students', getStudentCohort);
router.get('/students/:studentId', getStudentDetail);

// Faculty & Workload Management
router.get('/academicians', getAcademicians);
router.post('/academicians/:id/assign-student', assignStudentToAcademician);
router.delete('/academicians/:id/students/:studentId', unassignStudentFromAcademician);

// Dynamic Department Analytics
router.get('/departments', getDepartments);

// Skill Gap Intelligence
router.get('/skill-gaps', getSkillGaps);

// Industry Demand vs. Student Supply
router.get('/industry-demand', getIndustryDemand);
router.get('/skill-intelligence', getSkillIntelligence);

// Placement Intelligence & Outcomes
router.get('/placements', getPlacements);

// Campus Hiring Drives & Eligibility Engine
router.get('/hiring-drives', getHiringDrives);
router.post('/hiring-drives', createHiringDrive);
router.get('/hiring-drives/:id/eligible-students', getHiringDriveEligibleStudents);

module.exports = router;
