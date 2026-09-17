/**
 * ecosystem.routes.js
 *
 * Routes for multi-role ecosystem profile, institutions directory, and canonical skills.
 */

const express = require('express');
const {
  getEcosystemProfile,
  listInstitutions,
  listSkills,
} = require('../controllers/ecosystem.controller');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Publicly readable directory of institutions and canonical skills (used during registration or profile setup)
router.get('/institutions', listInstitutions);
router.get('/skills', listSkills);

// Authenticated ecosystem profile endpoint
router.get('/profile', requireAuth, getEcosystemProfile);

module.exports = router;
