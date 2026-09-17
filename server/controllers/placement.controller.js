/**
 * placement.controller.js
 */

const placementService = require('../services/placement.service');

async function getCycles(req, res, next) {
  try {
    const institutionId = req.user.institution || null;
    const data = await placementService.getPlacementCycles(institutionId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createCycle(req, res, next) {
  try {
    const institutionId = req.user.institution || null;
    const data = await placementService.createPlacementCycle(institutionId, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getRecords(req, res, next) {
  try {
    const institutionId = req.user.institution || null;
    const data = await placementService.getPlacementRecords(institutionId, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createRecord(req, res, next) {
  try {
    const data = await placementService.createPlacementRecord({
      ...req.body,
      institutionId: req.user.institution || req.body.institutionId,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateRecordStatus(req, res, next) {
  try {
    const { status, extra } = req.body;
    const data = await placementService.updatePlacementStatus(req.params.id, status, extra);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCycles,
  createCycle,
  getRecords,
  createRecord,
  updateRecordStatus,
};
