const express = require('express');
const {
  getDSAProfile,
  upsertDSAProfile,
  connectLeetCode,
  syncLeetCode,
  disconnectLeetCode,
} = require('../controllers/dsa.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// All DSA routes require authentication + student role
router.use(requireAuth);
router.use(requireRole('student'));

// GET  /api/dsa — fetch student's DSA profile
router.get('/', getDSAProfile);

// PUT  /api/dsa — create or update manual DSA profile
router.put('/', upsertDSAProfile);

// POST /api/dsa/connect — connect LeetCode profile
router.post('/connect', connectLeetCode);

// POST /api/dsa/sync — sync latest LeetCode stats
router.post('/sync', syncLeetCode);

// POST & DELETE /api/dsa/disconnect — disconnect LeetCode profile
router.post('/disconnect', disconnectLeetCode);
router.delete('/disconnect', disconnectLeetCode);

module.exports = router;
