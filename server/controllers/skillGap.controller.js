/**
 * skillGap.controller.js
 *
 * Handles HTTP requests for Skill Gap Analysis.
 *
 * Route: GET /api/skill-gap
 * Security: requireAuth, requireRole('student')
 * Identifies student strictly by req.user._id.
 */

const SkillProfile = require('../models/SkillProfile');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const IndustryEvaluation = require('../models/IndustryEvaluation');
const { analyzeSkillGap } = require('../services/skillGap.service');

/**
 * GET /api/skill-gap
 * Computes deterministic skill gap analysis for the authenticated student
 */
async function getSkillGap(req, res) {
  try {
    const userId = req.user._id;

    // Fetch all student profile records concurrently
    const [skillProfile, resume, githubProfile, dsaProfile, evaluations] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }),
      IndustryEvaluation.find({ studentId: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const analysis = analyzeSkillGap({
      skillProfile,
      resume,
      githubProfile,
      dsaProfile,
    });

    // Augment with Industry Recruiter Evaluation feedback loop
    if (evaluations && evaluations.length > 0) {
      analysis.industryEvaluations = evaluations.map((e) => ({
        id: e._id,
        scores: {
          technical: e.technicalScore,
          communication: e.communicationScore,
          problemSolving: e.problemSolvingScore,
          teamwork: e.teamworkScore,
          overall: e.overallScore,
        },
        strengths: e.strengths || [],
        weaknesses: e.weaknesses || [],
        feedback: e.feedback,
        recommendation: e.recommendation,
        evaluatedAt: e.createdAt,
      }));

      const feedbackNotes = [];
      evaluations.forEach((e) => {
        if (Array.isArray(e.weaknesses)) {
          e.weaknesses.forEach((w) =>
            feedbackNotes.push({
              type: 'RECRUITER_FEEDBACK_WEAKNESS',
              text: w,
              source: 'Industry Interview Evaluation',
            })
          );
        }
      });
      analysis.interviewFeedback = feedbackNotes;
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    console.error('[SkillGapController] Error generating skill gap:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate skill gap analysis. Please try again later.',
    });
  }
}

module.exports = {
  getSkillGap,
};
