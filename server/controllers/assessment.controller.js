/**
 * assessment.controller.js
 */

const assessmentService = require('../services/assessment.service');

async function getAssessments(req, res, next) {
  try {
    const data = await assessmentService.getAssessments(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAssessmentById(req, res, next) {
  try {
    const data = await assessmentService.getAssessmentById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createAssessment(req, res, next) {
  try {
    const data = await assessmentService.createAssessment(req.body, req.user);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function submitAssessmentAttempt(req, res, next) {
  try {
    const { answers } = req.body;
    const data = await assessmentService.submitAssessmentAttempt(req.params.id, req.user._id, answers);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getMyAttempts(req, res, next) {
  try {
    const data = await assessmentService.getStudentAttempts(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  submitAssessmentAttempt,
  getMyAttempts,
};
