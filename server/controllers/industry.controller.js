/**
 * industry.controller.js
 *
 * Controller for Industry Partner Console APIs.
 * Enforces ObjectId validation, robust input error handling, and structured JSON responses.
 */

'use strict';

const mongoose = require('mongoose');
const industryService = require('../services/industry.service');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

/**
 * GET /api/industry/dashboard
 */
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const data = await industryService.getDashboardOverview(industry._id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/industry/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const profile = await industryService.getIndustryProfile(industry._id);
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/industry/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const updated = await industryService.updateIndustryProfile(industry._id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/industry/opportunities
 */
exports.getOpportunities = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const opportunities = await industryService.getIndustryOpportunities(industry._id, req.query);
    return res.status(200).json({ success: true, data: opportunities });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/industry/opportunities
 */
exports.createOpportunity = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const opportunity = await industryService.createOpportunity(industry._id, req.user._id, req.body);
    return res.status(201).json({ success: true, data: opportunity });
  } catch (err) {
    if (err.message && (err.message.includes('required') || err.message.includes('Unrecognized skill') || err.message.includes('Openings'))) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/industry/opportunities/:id
 */
exports.getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }
    const industry = await industryService.resolveUserIndustry(req.user);
    const opportunity = await industryService.getOpportunityById(industry._id, id);
    return res.status(200).json({ success: true, data: opportunity });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not belong'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * PATCH /api/industry/opportunities/:id
 */
exports.updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }
    const industry = await industryService.resolveUserIndustry(req.user);
    const updated = await industryService.updateOpportunity(industry._id, id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not belong'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message && err.message.includes('Unrecognized skill')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * DELETE /api/industry/opportunities/:id
 */
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }
    const industry = await industryService.resolveUserIndustry(req.user);
    const result = await industryService.deleteOpportunity(industry._id, id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not belong'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/industry/talent
 */
exports.searchTalent = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const results = await industryService.searchTalent(industry._id, req.query);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/industry/talent/:studentId
 */
exports.getCandidate360 = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }
    const industry = await industryService.resolveUserIndustry(req.user);
    const dossier = await industryService.getCandidate360(studentId, req.query.opportunityId, industry._id);
    return res.status(200).json({ success: true, data: dossier });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/industry/opportunities/:id/applicants
 */
exports.getOpportunityApplicants = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }
    const industry = await industryService.resolveUserIndustry(req.user);
    const pipeline = await industryService.getOpportunityApplicants(industry._id, id);
    return res.status(200).json({ success: true, data: pipeline });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not belong'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * POST /api/industry/opportunities/:id/shortlist
 */
exports.shortlistCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }
    if (!studentId || !isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid studentId is required to shortlist' });
    }

    const industry = await industryService.resolveUserIndustry(req.user);
    const application = await industryService.shortlistCandidate(industry._id, id, studentId, notes);
    return res.status(200).json({ success: true, data: application });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not belong'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * PATCH /api/industry/applications/:id/stage
 */
exports.updateApplicationStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID format' });
    }
    if (!stage) {
      return res.status(400).json({ success: false, message: 'Stage is required' });
    }

    const industry = await industryService.resolveUserIndustry(req.user);
    const updated = await industryService.updateApplicationStage(industry._id, id, stage, notes);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err.message && (err.message.includes('Forbidden') || err.message.includes('not own'))) {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message && err.message.includes('Invalid recruitment stage')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/industry/shortlisted
 */
exports.getShortlistedCandidates = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const candidates = await industryService.getAggregatedStageCandidates(industry._id, ['SAVED', 'PLANNING', 'APPLIED', 'OA']);
    return res.status(200).json({ success: true, data: candidates });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/industry/interviews
 */
exports.getInterviews = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const candidates = await industryService.getAggregatedStageCandidates(industry._id, ['INTERVIEW', 'FINAL_ROUND']);
    return res.status(200).json({ success: true, data: candidates });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/industry/offers
 */
exports.getOffers = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const candidates = await industryService.getAggregatedStageCandidates(industry._id, ['OFFER']);
    return res.status(200).json({ success: true, data: candidates });
  } catch (err) {
    return next(err);
  }
};
