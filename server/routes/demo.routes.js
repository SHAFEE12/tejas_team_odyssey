/**
 * demo.routes.js
 *
 * Dedicated SIH 26044 Demo Mode & Reset routes.
 *
 * Routes:
 * GET  /api/demo/status
 * GET  /api/demo/accounts
 * POST /api/demo/login
 * POST /api/demo/reset
 */

'use strict';

const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demo.controller');

router.get('/status', demoController.getDemoStatus);
router.get('/accounts', demoController.getDemoAccounts);
router.post('/login', demoController.loginDemo);
router.post('/reset', demoController.resetDemo);

module.exports = router;
