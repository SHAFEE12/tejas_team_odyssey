/**
 * careerScore.controller.js
 *
 * Handles GET /api/career-score
 * Authenticated student only (req.user._id).
 */

const SkillProfile  = require('../models/SkillProfile');
const DSAProfile    = require('../models/DSAProfile');
const GitHubProfile = require('../models/GitHubProfile');
const { computeCareerScore } = require('../services/careerScore.service');

const getCareerScore = async (req, res) => {
  try {
    const userId = req.user._id;

    // Concurrently fetch all three profiles for the student
    const [skillProfile, dsaProfile, gitHubProfile] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
    ]);

    const scoreData = computeCareerScore({
      skillProfile,
      dsaProfile,
      gitHubProfile,
    });

    return res.status(200).json({
      success: true,
      data: scoreData,
    });
  } catch (error) {
    console.error('Error calculating career score:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate career readiness score. Please try again later.',
    });
  }
};

module.exports = {
  getCareerScore,
};
