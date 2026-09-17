/**
 * placement.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/placement.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/cycles', requireRole('academia', 'admin'), controller.getCycles);
router.post('/cycles', requireRole('academia', 'admin'), controller.createCycle);
router.get('/records', requireRole('academia', 'admin', 'industry'), controller.getRecords);
router.post('/records', requireRole('academia', 'admin', 'industry'), controller.createRecord);
router.patch('/records/:id/status', requireRole('academia', 'admin', 'industry'), controller.updateRecordStatus);

module.exports = router;
