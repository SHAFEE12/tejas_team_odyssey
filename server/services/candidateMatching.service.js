/**
 * candidateMatching.service.js
 *
 * Deterministic, Explainable Candidate Matching Service.
 *
 * Evaluates candidate alignment against job/internship opportunity requirements
 * using Career Odyssey's shared multi-dimensional student evidence.
 *
 * Scoring Weights:
 * - Required Skill Coverage: 35%
 * - Preferred Skill Coverage: 15%
 * - Career Goal Alignment:   15%
 * - Project Evidence:        15%
 * - Resume Evidence:          5%
 * - GitHub Evidence:          5%
 * - Career Readiness Score:  10%
 * Total:                    100%
 *
 * Architectural Guarantee:
 * - 100% Deterministic — identical inputs always yield identical scores.
 * - Non-LLM — no random outputs, no hallucinated scores, no external AI latency.
 * - Fully Explainable — breaks down every component with matched skills, missing skills,
 *   evidence indicators, human-readable rationale, and role recommendations.
 * - Reusable foundation for Phase 5 Central Matching Engine.
 */

'use strict';

const matchingService = require('./matching.service');

/**
 * Backward-compatible wrapper around Central Matching Engine evaluateMatch.
 */
function evaluateCandidateMatch(candidateData = {}, opportunityReqs = {}) {
  const result = matchingService.evaluateMatch(candidateData, opportunityReqs);

  // Return standard structure preserving Phase 4 signature and properties
  return {
    matchScore: result.matchScore,
    matchBand: result.matchBand,
    breakdown: {
      requiredSkills: {
        score: result.scoreBreakdown.requiredSkills,
        weight: 35,
        matched: result.matchedSkills.filter((s) => (opportunityReqs.requiredSkills || []).some((r) => matchingService.normalizeSkill(r) === matchingService.normalizeSkill(s))),
        missing: result.missingSkills,
      },
      preferredSkills: {
        score: result.scoreBreakdown.preferredSkills,
        weight: 15,
        matched: result.matchedSkills.filter((s) => (opportunityReqs.preferredSkills || []).some((p) => matchingService.normalizeSkill(p) === matchingService.normalizeSkill(s))),
        missing: (opportunityReqs.preferredSkills || []).filter((p) => !result.matchedSkills.some((s) => matchingService.normalizeSkill(s) === matchingService.normalizeSkill(p))),
      },
      careerAlignment: {
        score: result.scoreBreakdown.careerAlignment,
        weight: 15,
        targetRole: candidateData.careerGoal?.targetRole || candidateData.targetRole || 'Not specified',
      },
      projectEvidence: {
        score: result.scoreBreakdown.projectEvidence,
        weight: 15,
        totalProjects: (candidateData.projects || []).length,
      },
      resumeEvidence: {
        score: result.scoreBreakdown.resumeEvidence,
        weight: 5,
        hasResume: !!candidateData.resume,
      },
      githubEvidence: {
        score: result.scoreBreakdown.githubEvidence,
        weight: 5,
        hasGitHub: !!(candidateData.githubProfile && (candidateData.githubProfile.connected || candidateData.githubProfile.publicRepos > 0)),
      },
      careerReadiness: {
        score: result.scoreBreakdown.readiness,
        weight: 10,
      },
    },
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    partialSkills: result.partialSkills,
    evidence: result.evidence,
    reasons: result.rationale,
    recommendations: result.recommendations,
  };
}

module.exports = {
  evaluateCandidateMatch,
  normalizeSkill: matchingService.normalizeSkill,
  ...matchingService,
};

