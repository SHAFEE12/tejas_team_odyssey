/**
 * evaluation.controller.js
 *
 * Industry Evaluation controller for reviewing applicant interviews
 * and feeding feedback into student skill gap and learning recommendation loops.
 */

const IndustryEvaluation = require('../models/IndustryEvaluation');
const Application = require('../models/Application');
const StudentSkill = require('../models/StudentSkill');

async function createEvaluation(req, res, next) {
  try {
    const {
      applicationId,
      studentId,
      technicalScore = 70,
      communicationScore = 70,
      problemSolvingScore = 70,
      teamworkScore = 70,
      strengths = [],
      weaknesses = [],
      recommendation = 'CONSIDER',
      feedback = '',
    } = req.body;

    const overallScore = Math.round(
      (technicalScore + communicationScore + problemSolvingScore + teamworkScore) / 4
    );

    const evaluation = new IndustryEvaluation({
      applicationId,
      studentId,
      evaluatorId: req.user._id,
      companyId: req.user.industry || null,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      teamworkScore,
      overallScore,
      strengths,
      weaknesses,
      recommendation,
      feedback,
    });

    await evaluation.save();

    // Feedback loop: if communicationScore or problemSolvingScore < 60, log as StudentSkill evidence / gap
    if (studentId) {
      if (communicationScore < 60) {
        let commSkill = await StudentSkill.findOne({ userId: studentId, skillId: 'communication' });
        if (commSkill) {
          commSkill.evidence.push({
            source: 'INTERNSHIP',
            evidenceId: String(evaluation._id),
            title: `Industry Interview Feedback: Communication (${communicationScore}%)`,
            verified: false,
            score: communicationScore,
            recordedAt: new Date(),
          });
          commSkill.recalculateLevel();
          await commSkill.save();
        }
      }
    }

    res.status(201).json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
}

async function getStudentEvaluations(req, res, next) {
  try {
    const filter = { studentId: req.params.studentId };
    const evaluations = await IndustryEvaluation.find(filter)
      .populate('evaluatorId', 'name email companyName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: evaluations.length, data: evaluations });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvaluation,
  getStudentEvaluations,
};
