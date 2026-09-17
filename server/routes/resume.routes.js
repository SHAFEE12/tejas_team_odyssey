const express = require('express');
const {
  uploadResume,
  getStudentResume,
  reanalyzeResume,
  deleteResume,
  downloadResume,
  getAnalyzerStatus,
} = require('../controllers/resume.controller');
const { upload } = require('../services/resumeStorage.service');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Enforce authentication + student role on all resume endpoints
router.use(requireAuth);
router.use(requireRole('student'));

// GET /api/resume/analyzer-status — health and engine status of Google Gemini AI resume analyzer
router.get('/analyzer-status', getAnalyzerStatus);

// POST /api/resume/upload — upload and analyze document (PDF/DOCX)
router.post('/upload', upload.single('resume'), uploadResume);

// GET /api/resume/download or /api/resume/:id/download — secure download (MUST be before /:id)
router.get('/download', downloadResume);
router.get('/:id/download', downloadResume);

// POST /api/resume/analyze or /api/resume/:id/analyze — re-analyze stored document
router.post('/analyze', reanalyzeResume);
router.post('/:id/analyze', reanalyzeResume);

// DELETE /api/resume or /api/resume/:id — delete resume and analysis
router.delete('/', deleteResume);
router.delete('/:id', deleteResume);

// GET /api/resume or /api/resume/:id — get current student's resume & analysis
router.get('/', getStudentResume);
router.get('/:id', getStudentResume);

module.exports = router;
