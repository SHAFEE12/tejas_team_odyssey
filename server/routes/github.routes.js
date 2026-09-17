const express = require('express');
const {
  getGitHubProfile,
  saveGitHubUsername,
  syncGitHub,
  disconnectGitHub,
} = require('../controllers/github.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// All GitHub routes: authentication + student-role required
router.use(requireAuth);
router.use(requireRole('student'));

// GET    /api/github            — fetch cached profile
router.get('/', getGitHubProfile);

// PUT    /api/github            — save/update username
router.put('/', saveGitHubUsername);

// POST   /api/github/sync       — fetch real data from GitHub API
router.post('/sync', syncGitHub);

// DELETE /api/github/disconnect — clear stored GitHub data
router.delete('/disconnect', disconnectGitHub);

module.exports = router;
