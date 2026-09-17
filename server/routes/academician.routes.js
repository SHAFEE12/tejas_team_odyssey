/**
 * academician.routes.js
 *
 * Route definitions for Academician Portal APIs.
 * Enforces authentication and role verification (academician / super_admin).
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const {
  getDashboardOverview,
  getAssignedStudents,
  searchInstitutionStudents,
  getStudentDetail,
  assignStudent,
  unassignStudent,
  getAssessments,
  createAssessment,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  createEvaluation,
  getEvaluations,
  getStudentEvaluations,
  getMentoringActions,
  createMentoringAction,
  updateMentoringAction,
  getRecommendationsForStudent,
  completeRecommendation,
} = require('../controllers/academician.controller');

const router = express.Router();

// Guard all academician routes with authentication and role access control
router.use(requireAuth);
router.use(requireRole('academician', 'super_admin'));

// Dashboard Overview
router.get('/dashboard', getDashboardOverview);

// Student Assignment & Directory
router.get('/students', getAssignedStudents);
router.get('/students/search', searchInstitutionStudents);
router.get('/students/:studentId', getStudentDetail);
router.post('/students/:studentId/assign', assignStudent);
router.delete('/students/:studentId/assign', unassignStudent);

// Assessments (Authoring, Listing, Details, Updates, Deletion)
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.get('/assessments/:id', getAssessmentById);
router.patch('/assessments/:id', updateAssessment);
router.delete('/assessments/:id', deleteAssessment);

// Evaluations (Rubric scoring & skill evaluations)
router.post('/evaluations', createEvaluation);
router.get('/evaluations', getEvaluations);
router.get('/students/:studentId/evaluations', getStudentEvaluations);

// Mentoring Notes & Actions
router.get('/mentoring', getMentoringActions);
router.post('/mentoring', createMentoringAction);
router.patch('/mentoring/:id', updateMentoringAction);

// Deterministic Mentor Recommendations
router.get('/recommendations/:studentId', getRecommendationsForStudent);
router.post('/recommendations/:id/complete', completeRecommendation);

module.exports = router;
