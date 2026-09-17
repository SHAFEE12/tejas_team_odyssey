/**
 * academia.controller.js
 */

const academiaService = require('../services/academia.service');
const industryDemandService = require('../services/industryDemand.service');

async function getOverview(req, res, next) {
  try {
    const data = await academiaService.getAcademiaOverview(req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getStudents(req, res, next) {
  try {
    const data = await academiaService.getInstitutionStudents(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getStudentDetail(req, res, next) {
  try {
    const data = await academiaService.getStudentDetail(req.user, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function verifySkill(req, res, next) {
  try {
    const data = await academiaService.verifyStudentSkill(req.user, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSkillIntelligence(req, res, next) {
  try {
    const data = await industryDemandService.getIndustryDemandAnalysis();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getStudents,
  getStudentDetail,
  verifySkill,
  getSkillIntelligence,
};
