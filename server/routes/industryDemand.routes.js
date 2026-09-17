/**
 * industryDemand.routes.js
 */

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const industryDemandService = require('../services/industryDemand.service');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const data = await industryDemandService.getIndustryDemandAnalysis();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
