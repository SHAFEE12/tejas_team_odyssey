/**
 * project.service.js
 *
 * Deterministic Project Recommendation & Portfolio Management Service.
 *
 * Consumes:
 * 1. Target Role (from SkillProfile)
 * 2. Authoritative Skill Gap Analysis (from skillGap.service.js)
 * 3. Curated Project Blueprints (from projectBlueprints.js)
 * 4. Existing Student Projects
 *
 * Calculates:
 * - Career Relevance Score (0–100) based on target role alignment, skill gaps closed, prerequisites, and duplicate penalties
 * - Portfolio Quality Indicator (0–100) based on milestones, GitHub, deployment, and evidence
 * - Structured resume bullet points
 */

const { PROJECT_BLUEPRINTS } = require('../data/projectBlueprints');
const { analyzeSkillGap, isSkillMatch } = require('./skillGap.service');

/**
 * Validate GitHub repository URL and extract repo name
 */
function validateGithubUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, repoName: null, error: 'GitHub URL is required.' };
  }

  const trimmed = url.trim();
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/?$/;
  const match = trimmed.match(githubRegex);

  if (!match) {
    return {
      isValid: false,
      repoName: null,
      error: 'Invalid GitHub URL. Must be in the format: https://github.com/username/repository',
    };
  }

  const owner = match[2];
  let repo = match[3];
  if (repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }

  return {
    isValid: true,
    repoName: `${owner}/${repo}`,
    cleanUrl: `https://github.com/${owner}/${repo}`,
    error: null,
  };
}

/**
 * Validate Deployment URL
 */
function validateDeploymentUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, cleanUrl: null, error: 'Deployment URL is required.' };
  }

  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, cleanUrl: null, error: 'Deployment URL must use http:// or https://.' };
    }
    return { isValid: true, cleanUrl: parsed.href, error: null };
  } catch {
    return { isValid: false, cleanUrl: null, error: 'Invalid deployment URL format.' };
  }
}

/**
 * Deterministic Project Recommendation Engine
 *
 * Formula:
 * 30% Target Role Alignment
 * 30% Required Skill Gap Coverage
 * 15% Preferred Skill Gap Coverage
 * 10% Difficulty Fit
 * 10% Prerequisite Readiness
 * 5% Evidence Value
 * (Minus 40% duplicate penalty if already in My Projects)
 */
function getPersonalizedRecommendations({
  skillProfile,
  resume,
  githubProfile,
  dsaProfile,
  existingProjects = [],
}) {
  // 1. Authoritative Skill Gap Evaluation
  const gapAnalysis = analyzeSkillGap({
    skillProfile,
    resume,
    githubProfile,
    dsaProfile,
  });

  const targetRole = gapAnalysis.targetRole;
  const targetRoleId = targetRole?.id || 'software-engineer';
  const roleName = targetRole?.name || 'Software Engineer';
  const hasCareerGoal = gapAnalysis.metadata.hasCareerGoal;

  const missingSkills = gapAnalysis.skills.filter((s) => s.status === 'MISSING');
  const partialSkills = gapAnalysis.skills.filter((s) => s.status === 'PARTIAL');
  const resumeGapSkills = gapAnalysis.skills.filter((s) => s.status === 'RESUME_EVIDENCE_MISSING');
  const coveredSkills = gapAnalysis.skills.filter((s) => s.status === 'COVERED');

  const allGapSkills = [...missingSkills, ...partialSkills, ...resumeGapSkills];

  // Set of existing project blueprint IDs and titles
  const existingBlueprintIds = new Set(
    existingProjects.map((p) => p.blueprintId).filter(Boolean)
  );
  const existingTitles = new Set(
    existingProjects.map((p) => p.title.toLowerCase().trim())
  );

  // 2. Evaluate each blueprint against student's gaps & profile
  const evaluatedRecommendations = PROJECT_BLUEPRINTS.map((blueprint) => {
    let score = 0;

    // ── A. Target Role Alignment (30 pts) ──
    const matchesTargetRole =
      blueprint.targetRoles.includes(targetRoleId) ||
      blueprint.targetRoles.some((r) => targetRoleId.includes(r) || r.includes(targetRoleId));

    if (matchesTargetRole) {
      score += 30;
    } else if (blueprint.targetRoles.includes('software-engineer')) {
      score += 15; // General software engineering fallback
    } else {
      score += 10;
    }

    // ── B. Required Skill Gap Coverage (30 pts) ──
    const skillsAddressed = [];
    const skillsAlreadyKnown = [];
    const skillsToLearn = [];

    blueprint.requiredSkills.forEach((bSkill) => {
      const isGap = allGapSkills.some((g) => isSkillMatch(g.skill, bSkill));
      const isKnown = coveredSkills.some((c) => isSkillMatch(c.skill, bSkill));

      if (isGap) {
        skillsAddressed.push(bSkill);
        skillsToLearn.push(bSkill);
      } else if (isKnown) {
        skillsAlreadyKnown.push(bSkill);
      } else {
        skillsToLearn.push(bSkill);
      }
    });

    if (blueprint.optionalSkills) {
      blueprint.optionalSkills.forEach((oSkill) => {
        const isGap = allGapSkills.some((g) => isSkillMatch(g.skill, oSkill));
        if (isGap && !skillsAddressed.includes(oSkill)) {
          skillsAddressed.push(oSkill);
        }
      });
    }

    // Ratio of required skills that address actual gaps
    const gapRatio =
      blueprint.requiredSkills.length > 0
        ? skillsAddressed.length / blueprint.requiredSkills.length
        : 0;
    score += Math.min(30, Math.round(gapRatio * 30));

    // ── C. Preferred Skill Coverage (15 pts) ──
    if (skillsAddressed.length > 0) {
      score += Math.min(15, skillsAddressed.length * 5);
    } else {
      score += 5; // Maintenance project
    }

    // ── D. Difficulty Fit (10 pts) ──
    const coveredRatio =
      gapAnalysis.summary.totalEvaluatedCount > 0
        ? gapAnalysis.summary.coveredCount / gapAnalysis.summary.totalEvaluatedCount
        : 0;

    if (coveredRatio > 0.6) {
      // Advanced student
      if (blueprint.difficulty === 'ADVANCED') score += 10;
      else if (blueprint.difficulty === 'INTERMEDIATE') score += 8;
      else score += 4;
    } else if (coveredRatio > 0.25) {
      // Intermediate student
      if (blueprint.difficulty === 'INTERMEDIATE') score += 10;
      else if (blueprint.difficulty === 'BEGINNER') score += 8;
      else score += 6;
    } else {
      // Beginner student
      if (blueprint.difficulty === 'BEGINNER') score += 10;
      else if (blueprint.difficulty === 'INTERMEDIATE') score += 7;
      else score += 4;
    }

    // ── E. Prerequisite Readiness (10 pts) ──
    let prereqsMet = true;
    if (blueprint.prerequisites?.length > 0) {
      const missingPrereqs = blueprint.prerequisites.filter((p) =>
        missingSkills.some((m) => isSkillMatch(m.skill, p))
      );
      if (missingPrereqs.length > 0) {
        prereqsMet = false;
        score += 3; // Penalize slightly if prerequisites are missing
      } else {
        score += 10;
      }
    } else {
      score += 10;
    }

    // ── F. Evidence Value (5 pts) ──
    score += 5;

    // ── G. Duplicate Project Penalty ──
    const isAlreadyAdded =
      existingBlueprintIds.has(blueprint.blueprintId) ||
      existingTitles.has(blueprint.title.toLowerCase().trim());

    if (isAlreadyAdded) {
      score -= 40;
    }

    // Clamp score safely between [0, 100]
    const relevanceScore = Math.max(0, Math.min(100, Math.round(score)));

    // Generate deterministic "Why Recommended" explanation
    let whyRecommended = '';
    if (skillsAddressed.length > 0) {
      whyRecommended = `Directly closes ${skillsAddressed.length} active skill gap${
        skillsAddressed.length > 1 ? 's' : ''
      } (${skillsAddressed.slice(0, 3).join(', ')}) for ${roleName}.`;
    } else if (matchesTargetRole) {
      whyRecommended = `Strengthens core technical portfolio and architecture evidence for ${roleName}.`;
    } else {
      whyRecommended = `Expands versatile full-stack software development experience.`;
    }

    return {
      ...blueprint,
      relevanceScore,
      skillsAddressed,
      skillsAlreadyKnown,
      skillsToLearn,
      whyRecommended,
      isAlreadyAdded,
      prereqsMet,
    };
  });

  // Sort recommendations: Not added first, then relevanceScore desc, then title asc
  evaluatedRecommendations.sort((a, b) => {
    if (a.isAlreadyAdded !== b.isAlreadyAdded) {
      return a.isAlreadyAdded ? 1 : -1;
    }
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return a.title.localeCompare(b.title);
  });

  return {
    targetRole: roleName,
    roleId: targetRoleId,
    hasCareerGoal,
    recommendations: evaluatedRecommendations,
    totalRecommendations: evaluatedRecommendations.length,
    gapSummary: gapAnalysis.summary,
  };
}

/**
 * Calculate Summary Metrics for Student's Projects Portfolio
 */
function calculatePortfolioSummary(projects = []) {
  const total = projects.length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const planned = projects.filter((p) => p.status === 'PLANNED').length;
  const archived = projects.filter((p) => p.status === 'ARCHIVED').length;

  const githubLinked = projects.filter((p) => p.github && p.github.url).length;
  const deployed = projects.filter((p) => p.deployment && p.deployment.url).length;
  const resumeReady = projects.filter((p) => p.resumeData && p.resumeData.bulletPoints?.length > 0).length;

  const totalQuality = projects.reduce((acc, p) => acc + (p.qualityScore || 0), 0);
  const averageQualityScore = total > 0 ? Math.round(totalQuality / total) : 0;

  return {
    totalProjects: total,
    completed,
    inProgress,
    planned,
    archived,
    githubLinked,
    deployed,
    resumeReady,
    averageQualityScore,
  };
}

module.exports = {
  getPersonalizedRecommendations,
  calculatePortfolioSummary,
  validateGithubUrl,
  validateDeploymentUrl,
};
