/**
 * matching.controller.js
 *
 * Controller for Central Matching & Career Intelligence Engine APIs.
 * Enforces strict ObjectId validation, multi-tenant RBAC, ownership verification,
 * and recruiter-safe privacy projections.
 */

'use strict';

const mongoose = require('mongoose');
const matchingService = require('../services/matching.service');
const industryService = require('../services/industry.service');
const Opportunity = require('../models/Opportunity');
const AcademicianProfile = require('../models/AcademicianProfile');
const StudentProfile = require('../models/StudentProfile');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

/**
 * GET /api/matching/student/opportunities
 * Returns ranked opportunities for authenticated student.
 */
exports.getStudentMatches = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const results = await matchingService.getStudentOpportunityMatches(studentId, req.query);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/student/opportunities/:opportunityId
 * Returns 1-to-1 match breakdown for authenticated student.
 */
exports.getStudentOpportunityDetail = async (req, res, next) => {
  try {
    const { opportunityId } = req.params;
    if (!isValidObjectId(opportunityId)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }

    const studentId = req.user._id;
    const matchDetail = await matchingService.matchStudentToOpportunity(studentId, opportunityId);
    return res.status(200).json({ success: true, data: matchDetail });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/matching/opportunities/:opportunityId/candidates
 * Ranked discoverable candidates for an owned opportunity (Industry).
 */
exports.getOpportunityCandidates = async (req, res, next) => {
  try {
    const { opportunityId } = req.params;
    if (!isValidObjectId(opportunityId)) {
      return res.status(400).json({ success: false, message: 'Invalid opportunity ID format' });
    }

    // Ownership verification for industry partner (super_admin bypasses)
    if (req.user.role !== 'super_admin') {
      const industry = await industryService.resolveUserIndustry(req.user);
      const opp = await Opportunity.findById(opportunityId).lean();
      if (!opp) {
        return res.status(404).json({ success: false, message: 'Opportunity not found' });
      }
      if (!opp.industry || opp.industry.toString() !== industry._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not own this opportunity',
        });
      }
    }

    const candidates = await matchingService.matchOpportunityToStudents(opportunityId, req.query);
    return res.status(200).json({ success: true, data: candidates });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/industry/talent
 * Sourcing talent matches across company opportunities.
 */
exports.getIndustryTalentMatches = async (req, res, next) => {
  try {
    const industry = await industryService.resolveUserIndustry(req.user);
    const results = await matchingService.getIndustryTalentMatches(industry._id, req.query);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    if (err.message && err.message.includes('Forbidden')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    return next(err);
  }
};

/**
 * GET /api/matching/institution/skill-priorities
 * High-demand vs supply gap radar for institution admin.
 */
exports.getInstitutionSkillPriorities = async (req, res, next) => {
  try {
    const institutionId = req.user.institution;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution association required' });
    }

    const priorities = await matchingService.getInstitutionSkillPriority(institutionId);
    return res.status(200).json({ success: true, data: priorities });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/institution/demand
 * Domain-level market demand for institution.
 */
exports.getInstitutionMarketDemand = async (req, res, next) => {
  try {
    const institutionId = req.user.institution;
    const demand = await matchingService.getInstitutionMarketDemand(institutionId);
    return res.status(200).json({ success: true, data: demand });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/institution/skills
 * Detailed skill demand lookup.
 */
exports.getInstitutionSkills = async (req, res, next) => {
  try {
    const { skill } = req.query;
    if (!skill) {
      return res.status(400).json({ success: false, message: 'Skill parameter is required' });
    }
    const result = await matchingService.getSkillDemandMatches(skill, req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/institution/departments
 * Department cohort matching breakdown.
 */
exports.getInstitutionDepartments = async (req, res, next) => {
  try {
    const institutionId = req.user.institution;
    const depts = await matchingService.getInstitutionDepartmentMatching(institutionId);
    return res.status(200).json({ success: true, data: depts });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/matching/academician/students/:studentId/opportunities
 * Matching opportunities for authorized mentee.
 */
exports.getAcademicianMenteeMatches = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!isValidObjectId(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const results = await matchingService.getAcademicianMenteeMatches(req.user._id, studentId, req.query);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    if (err.message && err.message.includes('Forbidden')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    return next(err);
  }
};
