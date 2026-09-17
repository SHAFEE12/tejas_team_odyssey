/**
 * opportunity.service.js
 *
 * Deterministic Job Fit Score Engine — Career Odyssey Opportunities Module.
 *
 * ════════════════════════════════════════════════════════════════════
 *  SCORING FORMULA (total = 100 pts)
 * ════════════════════════════════════════════════════════════════════
 *   requiredSkillScore     × 30%   Required skills student has
 *   preferredSkillScore    × 20%   Preferred skills student has
 *   careerGoalScore        × 15%   Target role ↔ opportunity domain match
 *   resumeScore            × 10%   Resume text evidence for required skills
 *   projectEvidenceScore   × 10%   Projects covering required skills
 *   githubEvidenceScore    ×  5%   GitHub repos/languages evidence
 *   dsaScore               ×  5%   DSA solved-problems proxy
 *   experienceFitScore     ×  5%   Difficulty vs student level + DSA grade
 *
 * ════════════════════════════════════════════════════════════════════
 *  APPLICATION READINESS  (0–100, separate from fit score)
 * ════════════════════════════════════════════════════════════════════
 *   resumeScore        × 30%
 *   requiredSkillScore × 25%
 *   projectEvidence    × 20%
 *   githubEvidence     × 10%
 *   careerGoalScore    × 15%
 *
 *   Labels:
 *     90–100 → READY_TO_APPLY
 *     60–89  → PREPARE_AND_APPLY
 *     0–59   → PREPARE_FIRST
 *
 * ════════════════════════════════════════════════════════════════════
 *  EVIDENCE MATRIX — per required/preferred skill
 * ════════════════════════════════════════════════════════════════════
 *   Statuses: COVERED | PARTIAL | MISSING | EVIDENCE_MISSING
 *
 *   COVERED           — in My Skills AND in resume/project/GitHub
 *   PARTIAL           — in My Skills but NOT verified in resume/project/GitHub
 *   EVIDENCE_MISSING  — in My Skills (self-reported) but zero external evidence
 *   MISSING           — not in My Skills and no evidence anywhere
 *
 * ════════════════════════════════════════════════════════════════════
 *  DATA INTEGRITY RULES
 * ════════════════════════════════════════════════════════════════════
 *   - Missing data is flagged (status = "UNAVAILABLE"), never faked as 0
 *   - No AI, no randomness, no external calls
 *   - All scores are clamped 0–100
 *   - No fake jobs, companies, salaries, deadlines, or hiring probabilities
 *   - DEMO disclaimer is the caller's responsibility to surface
 */

'use strict';

const { isSkillMatch } = require('./skillGap.service');

/* ══════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════ */

// Domain → normalised target-role keywords
const DOMAIN_ROLE_MAP = {
  'software-engineering': [
    'software engineer', 'swe', 'software developer', 'full stack developer',
    'backend developer', 'frontend developer', 'web developer',
  ],
  'data-science': [
    'data scientist', 'data analyst', 'ml engineer', 'data engineer',
    'business analyst',
  ],
  'machine-learning': [
    'ml engineer', 'machine learning engineer', 'ai engineer', 'data scientist',
    'research engineer', 'nlp engineer', 'computer vision engineer',
  ],
  'devops': [
    'devops engineer', 'sre', 'site reliability engineer', 'platform engineer',
    'infrastructure engineer', 'cloud engineer',
  ],
  'product-management': [
    'product manager', 'product owner', 'technical product manager',
  ],
  'design': [
    'ui designer', 'ux designer', 'ui/ux designer', 'product designer',
  ],
  'cybersecurity': [
    'security engineer', 'cybersecurity analyst', 'penetration tester',
    'security researcher',
  ],
  'blockchain': [
    'blockchain developer', 'smart contract developer', 'web3 developer',
    'solidity developer',
  ],
  'mobile': [
    'mobile developer', 'ios developer', 'android developer',
    'react native developer', 'flutter developer',
  ],
  'backend': [
    'backend developer', 'backend engineer', 'server-side developer',
    'api developer',
  ],
  'frontend': [
    'frontend developer', 'frontend engineer', 'ui developer',
  ],
  'fullstack': [
    'full stack developer', 'full stack engineer', 'software engineer',
    'software developer',
  ],
  'cloud': [
    'cloud engineer', 'cloud architect', 'devops engineer',
    'infrastructure engineer', 'sre',
  ],
  'embedded': [
    'embedded engineer', 'firmware engineer', 'iot developer',
    'systems engineer',
  ],
  'research': [
    'research engineer', 'research scientist', 'ml researcher',
    'ai researcher', 'nlp researcher',
  ],
};

// Difficulty → minimum DSA count for "strong" match
const DIFFICULTY_DSA_THRESHOLDS = {
  internship: 30,
  entry:  50,
  junior: 100,
  mid:    200,
  senior: 300,
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════ */

function norm(str) { return (str || '').toLowerCase().trim(); }

function clamp(v) { return Math.min(100, Math.max(0, Math.round(v))); }

/**
 * Check whether the student's My Skills list contains a given skill name.
 * Uses the isSkillMatch canonical alias check from skillGap.service.
 */
function studentHasSkill(skillName, studentSkills) {
  if (!studentSkills || studentSkills.length === 0) return false;
  return studentSkills.some((s) => isSkillMatch(skillName, s.name || s));
}

/**
 * Check whether a skill appears in resume extracted text.
 * Searches raw extractedText for the skill keyword (case-insensitive).
 */
function skillInResume(skillName, resumeText) {
  if (!resumeText) return false;
  return resumeText.toLowerCase().includes(norm(skillName));
}

/**
 * Check whether a skill appears in any project's skills array.
 */
function skillInProjects(skillName, projects) {
  if (!projects || projects.length === 0) return false;
  return projects.some((p) =>
    (p.skills || []).some((s) => isSkillMatch(skillName, s))
  );
}

/**
 * Check whether a skill appears in GitHub languages.
 */
function skillInGitHub(skillName, githubLanguages) {
  if (!githubLanguages || githubLanguages.length === 0) return false;
  return githubLanguages.some((lang) => isSkillMatch(skillName, lang));
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT SCORERS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Required skill score (0–100).
 * Fraction of required skills found in student's My Skills list.
 */
function scoreRequiredSkills(requiredSkills, studentSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!studentSkills || studentSkills.length === 0) return 0;
  const matched = requiredSkills.filter((sk) => studentHasSkill(sk, studentSkills)).length;
  return clamp((matched / requiredSkills.length) * 100);
}

/**
 * Preferred skill score (0–100).
 * Fraction of preferred skills found in student's My Skills list.
 */
function scorePreferredSkills(preferredSkills, studentSkills) {
  if (!preferredSkills || preferredSkills.length === 0) return 100;
  if (!studentSkills || studentSkills.length === 0) return 0;
  const matched = preferredSkills.filter((sk) => studentHasSkill(sk, studentSkills)).length;
  return clamp((matched / preferredSkills.length) * 100);
}

/**
 * Career Goal alignment score (0–100).
 * Compares student's targetRole against opportunity domain and tags.
 * Returns {score, targetRole, targetIndustry, roleAlignmentReason}
 */
function scoreCareerGoal(opportunityDomain, opportunityTags, targetRole, targetIndustry) {
  if (!targetRole || !targetRole.trim()) {
    return {
      score: 0,
      targetRole: null,
      targetIndustry: null,
      roleAlignmentReason: 'No target career goal is set. Set one in Career Goal to improve this score.',
    };
  }

  const normTarget = norm(targetRole);
  const domainRoles = DOMAIN_ROLE_MAP[opportunityDomain] || [];

  // Exact / close match in domain role list
  const exactMatch = domainRoles.some(
    (role) => normTarget.includes(norm(role)) || norm(role).includes(normTarget)
  );

  if (exactMatch) {
    return {
      score: 100,
      targetRole,
      targetIndustry: targetIndustry || null,
      roleAlignmentReason: `Your target role "${targetRole}" aligns with the ${opportunityDomain} opportunity domain.`,
    };
  }

  // Partial word match
  const targetWords = normTarget.split(/\s+/).filter((w) => w.length > 3);
  let maxWordMatch = 0;
  for (const role of domainRoles) {
    const roleWords = norm(role).split(/\s+/);
    const common = targetWords.filter((w) => roleWords.includes(w));
    if (common.length > maxWordMatch) maxWordMatch = common.length;
  }

  // Check tags for domain hints
  const tags = (opportunityTags || []).map(norm);
  const targetWordInTags = targetWords.some((w) => tags.some((t) => t.includes(w)));

  let score = 0;
  let reason = '';

  if (maxWordMatch >= 2 || targetWordInTags) {
    score = 60;
    reason = `Partial alignment — "${targetRole}" shares keywords with this ${opportunityDomain} opportunity.`;
  } else if (maxWordMatch === 1) {
    score = 30;
    reason = `Weak alignment — "${targetRole}" has minimal overlap with ${opportunityDomain} roles.`;
  } else {
    score = 0;
    reason = `Low alignment — "${targetRole}" does not match the ${opportunityDomain} domain.`;
  }

  return { score, targetRole, targetIndustry: targetIndustry || null, roleAlignmentReason: reason };
}

/**
 * Resume evidence score (0–100).
 * Counts how many required skills appear in the resume extracted text.
 * Returns {score, status, matchedSkills, missingSkills, evidenceGaps}
 */
function scoreResume(requiredSkills, preferredSkills, resumeData) {
  if (!resumeData || !resumeData.extractedText || resumeData.status !== 'completed') {
    return {
      score: 0,
      status: 'UNAVAILABLE',
      matchedSkills: [],
      missingSkills: requiredSkills || [],
      evidenceGaps: requiredSkills || [],
    };
  }

  const text = resumeData.extractedText;
  const allSkills = [...(requiredSkills || []), ...(preferredSkills || [])];

  if (allSkills.length === 0) return { score: 100, status: 'AVAILABLE', matchedSkills: [], missingSkills: [], evidenceGaps: [] };

  const matchedSkills = allSkills.filter((sk) => skillInResume(sk, text));
  const missingSkills = (requiredSkills || []).filter((sk) => !skillInResume(sk, text));
  const evidenceGaps = missingSkills;

  // Score = fraction of required skills found in resume
  const reqCount = (requiredSkills || []).length;
  const reqMatched = (requiredSkills || []).filter((sk) => skillInResume(sk, text)).length;
  const score = reqCount > 0 ? clamp((reqMatched / reqCount) * 100) : 100;

  return { score, status: 'AVAILABLE', matchedSkills, missingSkills, evidenceGaps };
}

/**
 * Project evidence score (0–100).
 * Counts how many required skills appear in the student's project skills arrays.
 * Returns {score, supportingProjects[]}
 */
function scoreProjectEvidence(requiredSkills, preferredSkills, projects) {
  if (!projects || projects.length === 0) {
    return { score: 0, supportingProjects: [] };
  }

  const reqSkills = requiredSkills || [];
  const prefSkills = preferredSkills || [];
  const allTarget = [...reqSkills, ...prefSkills];

  // Score based on required skills
  const reqMatched = reqSkills.filter((sk) => skillInProjects(sk, projects)).length;
  const score = reqSkills.length > 0 ? clamp((reqMatched / reqSkills.length) * 100) : 100;

  // Compute supporting projects with per-project coverage
  const supportingProjects = projects
    .map((p) => {
      const projectSkills = p.skills || [];
      const matchedSkills = allTarget.filter((sk) =>
        projectSkills.some((ps) => isSkillMatch(sk, ps))
      );
      const missingSkills = reqSkills.filter((sk) =>
        !projectSkills.some((ps) => isSkillMatch(sk, ps))
      );
      const coverageScore = allTarget.length > 0
        ? clamp((matchedSkills.length / allTarget.length) * 100)
        : 0;

      return {
        projectId:     String(p._id),
        title:         p.title,
        matchedSkills,
        missingSkills,
        coverageScore,
      };
    })
    .filter((p) => p.matchedSkills.length > 0)
    .sort((a, b) => b.coverageScore - a.coverageScore);

  return { score, supportingProjects };
}

/**
 * GitHub evidence score (0–100).
 * Based on language overlap + repo count.
 * Returns {score, status, evidence}
 */
function scoreGitHubEvidence(requiredSkills, github) {
  if (!github || !github.connected || !github.username) {
    return {
      score: 0,
      status: 'UNAVAILABLE',
      evidence: null,
    };
  }

  const languages = github.languages || [];
  const repos = github.publicRepos || 0;
  const stars = github.totalStars || 0;

  // Language overlap with required skills
  const reqSkills = requiredSkills || [];
  const langMatches = reqSkills.filter((sk) => skillInGitHub(sk, languages)).length;
  const langScore = reqSkills.length > 0 ? (langMatches / reqSkills.length) * 60 : 30;

  // Repo activity (up to 40 pts)
  const repoScore = Math.min(repos * 3, 30);
  const starScore = Math.min(stars * 1.5, 10);

  const score = clamp(langScore + repoScore + starScore);

  return {
    score,
    status: 'AVAILABLE',
    evidence: {
      languages,
      publicRepos: repos,
      totalStars: stars,
      followers: github.followers || 0,
      username: github.username,
    },
  };
}

/**
 * DSA evidence score (0–100).
 * Based on LeetCode / manual totals and difficulty vs opportunity level.
 * Returns {score, status, details}
 */
function scoreDSA(dsa, opportunityDifficulty) {
  if (!dsa) {
    return { score: 0, status: 'UNAVAILABLE', details: null };
  }

  const totalSolved = dsa.totalSolved ||
    (dsa.easySolved || 0) + (dsa.mediumSolved || 0) + (dsa.hardSolved || 0);
  const medium = dsa.mediumSolved || 0;
  const hard   = dsa.hardSolved   || 0;

  // Base points from total solved
  let base = Math.min(Math.round(totalSolved / 4), 70);

  // Quality bonus: medium (0.3 pts each) + hard (0.5 pts each), capped at 30
  const qualityBonus = Math.min(medium * 0.3 + hard * 0.5, 30);

  const score = clamp(base + qualityBonus);

  // Classify strength
  let dsaStatus;
  if (totalSolved >= 300) dsaStatus = 'STRONG';
  else if (totalSolved >= 150) dsaStatus = 'MODERATE';
  else if (totalSolved >= 1) dsaStatus = 'LIMITED';
  else dsaStatus = 'UNAVAILABLE';

  return {
    score,
    status: dsaStatus,
    details: {
      totalSolved,
      easySolved:   dsa.easySolved   || 0,
      mediumSolved: dsa.mediumSolved || 0,
      hardSolved:   dsa.hardSolved   || 0,
      currentStreak: dsa.currentStreak || 0,
    },
  };
}

/**
 * Experience / difficulty fit score (0–100).
 * Compares opportunity difficulty level vs student's declared experience level.
 */
function scoreExperienceFit(opportunityDifficulty, studentSkillProfile) {
  const expLevel = norm(studentSkillProfile?.experienceLevel || '');
  const diff     = norm(opportunityDifficulty || 'entry');

  const levelMap = { internship: 1, entry: 1, junior: 2, mid: 3, senior: 4, lead: 5, executive: 6 };
  const studentLevel = levelMap[expLevel] || 1;
  const oppLevel     = levelMap[diff]    || 1;

  const gap = Math.abs(studentLevel - oppLevel);

  if (gap === 0) return 100;
  if (gap === 1) return 70;
  if (gap === 2) return 40;
  return 10;
}

/* ══════════════════════════════════════════════════════════════════
   EVIDENCE MATRIX
   ══════════════════════════════════════════════════════════════════ */

/**
 * Build an evidence matrix for each required and preferred skill.
 *
 * Returns an array of:
 * {
 *   skill, category ('required'|'preferred'),
 *   skillProfileLevel, skillProfileYears,
 *   resumeEvidence, projectEvidence, githubEvidence,
 *   status: 'COVERED'|'PARTIAL'|'EVIDENCE_MISSING'|'MISSING'
 * }
 *
 * COVERED          — self-reported AND at least 1 external evidence source
 * EVIDENCE_MISSING — self-reported but NO external evidence
 * PARTIAL          — not self-reported but appears in 1 external source
 * MISSING          — not found anywhere
 */
function buildEvidenceMatrix(requiredSkills, preferredSkills, studentData) {
  const { skillProfile, resume, projects, github } = studentData;
  const studentSkills = skillProfile?.skills || [];
  const resumeText    = resume?.extractedText  || '';
  const githubLangs   = github?.languages       || [];

  const allSkills = [
    ...(requiredSkills || []).map((s) => ({ skill: s, category: 'required' })),
    ...(preferredSkills || []).map((s) => ({ skill: s, category: 'preferred' })),
  ];

  return allSkills.map(({ skill, category }) => {
    const profileEntry  = studentSkills.find((s) => isSkillMatch(skill, s.name));
    const inSkillList   = Boolean(profileEntry);
    const resumeEv      = skillInResume(skill, resumeText);
    const projectEv     = skillInProjects(skill, projects);
    const githubEv      = skillInGitHub(skill, githubLangs);
    const externalCount = [resumeEv, projectEv, githubEv].filter(Boolean).length;

    let status;
    if (inSkillList && externalCount >= 1) {
      status = 'COVERED';
    } else if (inSkillList && externalCount === 0) {
      status = 'EVIDENCE_MISSING';
    } else if (!inSkillList && externalCount >= 1) {
      status = 'PARTIAL';
    } else {
      status = 'MISSING';
    }

    return {
      skill,
      category,
      skillProfileLevel: profileEntry?.level  || null,
      skillProfileYears: profileEntry?.yearsOfExperience ?? null,
      resumeEvidence:  resumeEv,
      projectEvidence: projectEv,
      githubEvidence:  githubEv,
      status,
    };
  });
}

/* ══════════════════════════════════════════════════════════════════
   ROADMAP CONNECTION
   ══════════════════════════════════════════════════════════════════ */

/**
 * Find roadmap tasks that correspond to missing opportunity skills.
 * Returns roadmapActions[] — read-only, does NOT modify roadmap completion.
 *
 * Each item:
 *   { taskId, title, status, relatedSkill, phaseTitle }
 */
function buildRoadmapActions(missingSkills, roadmap) {
  if (!roadmap || !roadmap.tasks || missingSkills.length === 0) return [];

  const actions = [];
  for (const skill of missingSkills) {
    const matchingTasks = roadmap.tasks.filter(
      (t) => t.relatedSkill && isSkillMatch(skill, t.relatedSkill)
    );
    for (const task of matchingTasks) {
      if (!actions.find((a) => a.taskId === task.taskId)) {
        actions.push({
          taskId:      task.taskId,
          title:       task.title,
          status:      task.status,
          relatedSkill: task.relatedSkill,
          phaseTitle:  task.phaseTitle,
        });
      }
    }
  }

  return actions;
}

/* ══════════════════════════════════════════════════════════════════
   APPLICATION READINESS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Compute Application Readiness (0–100).
 * This is DIFFERENT from Job Fit Score.
 * It measures how ready the student is to SUBMIT an application RIGHT NOW.
 *
 * Formula:
 *   resumeScore    × 0.30
 *   reqSkillScore  × 0.25
 *   projectEvScore × 0.20
 *   careerGoalSc   × 0.15
 *   githubEvScore  × 0.10
 *
 * Returns {applicationReadiness, label, criticalMissing[]}
 */
function computeApplicationReadiness(components, resumeStatus, githubStatus) {
  const {
    resumeScore, requiredSkillScore, projectEvidenceScore,
    careerGoalScore, githubEvidenceScore,
  } = components;

  // If resume is truly unavailable, cap at PREPARE_FIRST territory
  const adjustedResumeScore = resumeStatus === 'UNAVAILABLE' ? 0 : resumeScore;
  const adjustedGitHubScore = githubStatus === 'UNAVAILABLE' ? 0 : githubEvidenceScore;

  const readiness = clamp(
    adjustedResumeScore    * 0.30 +
    requiredSkillScore     * 0.25 +
    projectEvidenceScore   * 0.20 +
    careerGoalScore        * 0.15 +
    adjustedGitHubScore    * 0.10
  );

  let label;
  if (readiness >= 90)      label = 'READY_TO_APPLY';
  else if (readiness >= 60) label = 'PREPARE_AND_APPLY';
  else                      label = 'PREPARE_FIRST';

  // Critical missing items
  const criticalMissing = [];
  if (resumeStatus === 'UNAVAILABLE')     criticalMissing.push('Upload a resume');
  if (requiredSkillScore < 50)            criticalMissing.push('Fill required skill gaps');
  if (projectEvidenceScore < 30)          criticalMissing.push('Add projects that demonstrate required skills');
  if (careerGoalScore === 0)              criticalMissing.push('Set a Career Goal');

  return { applicationReadiness: readiness, label, criticalMissing };
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCORING FUNCTION
   ══════════════════════════════════════════════════════════════════ */

/**
 * Compute the full Job Fit analysis for one opportunity against a student.
 *
 * @param {Object} opportunity  — Opportunity document (plain object)
 * @param {Object} studentData  — {
 *   skillProfile,    // SkillProfile document
 *   github,          // GitHubProfile document (null = unavailable)
 *   dsa,             // DSAProfile document (null = unavailable)
 *   resume,          // Resume document (null = unavailable)
 *   projects,        // Array of Project documents
 *   roadmap,         // Roadmap document (null = unavailable)
 * }
 *
 * @returns {Object} Full analysis result
 */
function computeFitScore(opportunity, studentData) {
  const {
    skillProfile,
    github    = null,
    dsa       = null,
    resume    = null,
    projects  = [],
    roadmap   = null,
  } = studentData;

  const studentSkills  = skillProfile?.skills || [];
  const targetRole     = skillProfile?.targetRole    || '';
  const targetIndustry = skillProfile?.targetIndustry || '';

  const requiredSkills  = opportunity.requiredSkills  || [];
  const preferredSkills = opportunity.preferredSkills || [];

  /* ── 1. Required skill score ── */
  const requiredSkillScore = scoreRequiredSkills(requiredSkills, studentSkills);

  /* ── 2. Preferred skill score ── */
  const preferredSkillScore = scorePreferredSkills(preferredSkills, studentSkills);

  /* ── 3. Career goal score ── */
  const careerGoalResult = scoreCareerGoal(
    opportunity.domain,
    opportunity.tags,
    targetRole,
    targetIndustry
  );
  const careerGoalScore = careerGoalResult.score;

  /* ── 4. Resume score ── */
  const resumeResult = scoreResume(requiredSkills, preferredSkills, resume);
  const resumeScore  = resumeResult.score;

  /* ── 5. Project evidence score ── */
  const projectResult       = scoreProjectEvidence(requiredSkills, preferredSkills, projects);
  const projectEvidenceScore = projectResult.score;

  /* ── 6. GitHub evidence score ── */
  const githubResult        = scoreGitHubEvidence(requiredSkills, github);
  const githubEvidenceScore = githubResult.score;

  /* ── 7. DSA score ── */
  const oppTier = opportunity.difficulty || opportunity.experienceLevel || 'entry';
  const dsaResult = scoreDSA(dsa, oppTier);
  const dsaScore  = dsaResult.score;

  /* ── 8. Experience fit score ── */
  const experienceFitScore = scoreExperienceFit(oppTier, skillProfile);

  /* ── Weighted final fit score ── */
  const fitScore = clamp(
    requiredSkillScore    * 0.30 +
    preferredSkillScore   * 0.20 +
    careerGoalScore       * 0.15 +
    resumeScore           * 0.10 +
    projectEvidenceScore  * 0.10 +
    githubEvidenceScore   * 0.05 +
    dsaScore              * 0.05 +
    experienceFitScore    * 0.05
  );

  /* ── Application readiness ── */
  const readinessResult = computeApplicationReadiness(
    { resumeScore, requiredSkillScore, projectEvidenceScore, careerGoalScore, githubEvidenceScore },
    resumeResult.status,
    githubResult.status
  );

  /* ── Evidence matrix ── */
  const evidenceMatrix = buildEvidenceMatrix(
    requiredSkills,
    preferredSkills,
    { skillProfile, resume, projects, github }
  );

  /* ── Roadmap actions for missing skills ── */
  const missingSkills = evidenceMatrix
    .filter((e) => e.status === 'MISSING' && e.category === 'required')
    .map((e) => e.skill);
  const roadmapActions = buildRoadmapActions(missingSkills, roadmap);

  return {
    fitScore,
    overallFitScore: fitScore,
    requiredSkillScore,
    preferredSkillScore,
    careerGoalScore,
    resumeScore,
    projectScore: projectEvidenceScore,
    projectEvidenceScore,
    githubScore: githubEvidenceScore,
    githubEvidenceScore,
    dsaScore,
    experienceScore: experienceFitScore,
    experienceFitScore,
    breakdown: {
      overallFitScore: fitScore,
      fitScore,
      requiredSkillScore,
      preferredSkillScore,
      careerGoalScore,
      resumeScore,
      projectScore: projectEvidenceScore,
      projectEvidenceScore,
      githubScore: githubEvidenceScore,
      githubEvidenceScore,
      dsaScore,
      experienceScore: experienceFitScore,
      experienceFitScore,
    },
    applicationReadiness: readinessResult.applicationReadiness,
    applicationReadinessLabel: readinessResult.label,
    criticalMissing: readinessResult.criticalMissing,
    evidenceMatrix,
    supportingProjects: projectResult.supportingProjects,
    resumeMatchScore:    resumeResult.score,
    resumeStatus:        resumeResult.status,
    resumeMatchedSkills: resumeResult.matchedSkills,
    resumeMissingSkills: resumeResult.missingSkills,
    resumeEvidenceGaps:  resumeResult.evidenceGaps,
    githubEvidenceScore,
    githubStatus:        githubResult.status,
    githubEvidence:      githubResult.evidence,
    dsaScore,
    dsaStatus:           dsaResult.status,
    dsaDetails:          dsaResult.details,
    careerGoalScore,
    targetRole:          careerGoalResult.targetRole,
    targetIndustry:      careerGoalResult.targetIndustry,
    roleAlignmentReason: careerGoalResult.roleAlignmentReason,
    roadmapActions,
  };
}

/* ══════════════════════════════════════════════════════════════════
   BATCH SCORING
   ══════════════════════════════════════════════════════════════════ */

/**
 * Score a list of opportunities and sort by fitScore descending.
 * For the list view, we omit heavy per-skill breakdowns to keep response lean.
 */
function scoreAndRankOpportunities(opportunities, studentData) {
  return opportunities
    .map((opp) => {
      const raw = computeFitScore(opp, studentData);
      return {
        ...((opp.toObject ? opp.toObject() : opp)),
        fitScore:                raw.fitScore,
        fitBreakdown:            raw.breakdown,
        applicationReadiness:    raw.applicationReadiness,
        applicationReadinessLabel: raw.applicationReadinessLabel,
      };
    })
    .sort((a, b) => (b.fitScore - a.fitScore) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
}

/* ══════════════════════════════════════════════════════════════════
   DISPLAY HELPERS
   ══════════════════════════════════════════════════════════════════ */

function getFitLabel(score) {
  if (score >= 80) return 'Excellent Fit';
  if (score >= 60) return 'Good Fit';
  if (score >= 40) return 'Moderate Fit';
  if (score >= 20) return 'Low Fit';
  return 'Poor Fit';
}

function getFitColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'amber';
  return 'red';
}

function getReadinessLabel(score) {
  if (score >= 90) return 'Ready to Apply';
  if (score >= 60) return 'Prepare & Apply';
  return 'Prepare First';
}

function getReadinessColor(score) {
  if (score >= 90) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}

/* ══════════════════════════════════════════════════════════════════
   EXPORTS
   ══════════════════════════════════════════════════════════════════ */

module.exports = {
  computeFitScore,
  scoreAndRankOpportunities,
  getFitLabel,
  getFitColor,
  getReadinessLabel,
  getReadinessColor,
  // Exposed for unit tests
  scoreRequiredSkills,
  scorePreferredSkills,
  scoreCareerGoal,
  scoreResume,
  scoreProjectEvidence,
  scoreGitHubEvidence,
  scoreDSA,
  scoreExperienceFit,
  computeApplicationReadiness,
  buildEvidenceMatrix,
  buildRoadmapActions,
};
