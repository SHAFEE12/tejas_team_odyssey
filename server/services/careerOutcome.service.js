/**
 * careerOutcome.service.js
 *
 * Core service for the Career Outcome & Trajectory Engine (Phase 7).
 *
 * Architectural Principles:
 * - Outcome + Trajectory measurement layer.
 * - Measures whether student activity is producing meaningful career progress.
 * - Deterministic, explainable, and privacy-safe.
 * - Reuses existing modules without recalculating underlying authoritative metrics.
 * - Non-shaming, constructive language with honest correlation ("associated with", "supports").
 * - Conservative forecasting (requires >= 3 snapshots; never promises jobs/offers).
 * - 24-hour snapshot deduplication.
 */

const mongoose = require('mongoose');
const CareerTrajectorySnapshot = require('../models/CareerTrajectorySnapshot');
const CareerMilestone = require('../models/CareerMilestone');
const Application = require('../models/Application');
const ExecutionTask = require('../models/ExecutionTask');
const { buildCopilotContext } = require('./copilotContext.service');

/* ─── Enums & Stages ──────────────────────────────────────────────── */

const CAREER_STAGES = {
  FOUNDATION: 'FOUNDATION',
  SKILL_BUILDING: 'SKILL_BUILDING',
  PORTFOLIO_BUILDING: 'PORTFOLIO_BUILDING',
  PROOF_BUILDING: 'PROOF_BUILDING',
  APPLICATION_READY: 'APPLICATION_READY',
  APPLICATION_ACTIVE: 'APPLICATION_ACTIVE',
  INTERVIEW_PREPARATION: 'INTERVIEW_PREPARATION',
  INTERVIEW_ACTIVE: 'INTERVIEW_ACTIVE',
  OFFER_STAGE: 'OFFER_STAGE',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
};

const TRAJECTORY_STATUS = {
  ACCELERATING: 'ACCELERATING',
  IMPROVING: 'IMPROVING',
  STABLE: 'STABLE',
  STAGNATING: 'STAGNATING',
  DECLINING: 'DECLINING',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
};

/* ─── 1. Career Stage Evaluator ───────────────────────────────────── */

/**
 * Deterministically classifies student into 1 of 10 authentic career stages.
 *
 * @param {Object} context - Copilot context
 * @param {Array<Object>} applications - Real student applications
 * @returns {Object} { stage, label, reason, unlockCriteria }
 */
function determineCareerStage(context = {}, applications = []) {
  const targetRole = context.careerGoal?.targetRole;
  const profileCompletion = context.profile?.profileCompletion ?? 0;
  const totalSkills = context.skills?.totalSkills ?? 0;
  const readinessScore = context.analytics?.careerReadinessScore ?? 0;
  const coverage = context.skillGap?.coveragePercentage ?? 0;
  const missingSkills = context.skillGap?.missingSkills || [];
  const projects = context.projects?.projects || context.projects?.list || [];
  const totalProjects = projects.length;
  const deployedProjects = projects.filter((p) => p.hasLiveUrl || p.liveUrl).length;
  const isGithubConnected = context.github?.isConnected || false;
  const isResumeCompleted = context.resume?.status === 'completed';
  const resumeScore = context.resume?.atsScore ?? 0;

  // 1. Guard: Check baseline foundation
  if (!targetRole || profileCompletion < 30 || totalSkills === 0) {
    return {
      stage: CAREER_STAGES.INSUFFICIENT_DATA,
      label: 'Setup Required',
      reason: 'Career goal, profile details, and baseline skills have not been fully configured.',
      unlockCriteria: 'Configure target role and self-assess baseline competencies to begin tracking trajectory.',
    };
  }

  // 2. Offer Stage
  const hasOffer = applications.some((a) => a.status === 'OFFER');
  if (hasOffer) {
    return {
      stage: CAREER_STAGES.OFFER_STAGE,
      label: 'Offer Stage',
      reason: 'Active offer received. Focus on compensation evaluation, offer alignment, and onboarding readiness.',
      unlockCriteria: 'Career goal achieved or offer evaluation in progress.',
    };
  }

  // 3. Interview Active
  const activeInterviews = applications.filter(
    (a) => a.status === 'INTERVIEW' || a.status === 'FINAL ROUND'
  );
  if (activeInterviews.length >= 2) {
    return {
      stage: CAREER_STAGES.INTERVIEW_ACTIVE,
      label: 'Active Interview Pipeline',
      reason: `Multiple active interview loops in progress (${activeInterviews.length} opportunities).`,
      unlockCriteria: 'Advance through technical and behavioral rounds to secure job offer.',
    };
  }

  // 4. Interview Preparation
  const upcomingInterviews = context.applications?.upcomingInterviews || [];
  const hasInterviewRound = activeInterviews.length > 0 || upcomingInterviews.length > 0;
  if (hasInterviewRound) {
    const company = activeInterviews[0]?.company || upcomingInterviews[0]?.company || 'Target Company';
    return {
      stage: CAREER_STAGES.INTERVIEW_PREPARATION,
      label: 'Interview Preparation',
      reason: `Interview scheduled or actively in progress with ${company}.`,
      unlockCriteria: 'Complete system design and STAR behavioral narratives to advance to final rounds.',
    };
  }

  // 5. Application Active
  const submittedApps = applications.filter(
    (a) =>
      a.status === 'APPLIED' ||
      a.status === 'OA' ||
      a.status === 'INTERVIEW' ||
      a.status === 'FINAL ROUND' ||
      a.status === 'OFFER' ||
      a.status === 'REJECTED'
  );
  if (submittedApps.length >= 2) {
    return {
      stage: CAREER_STAGES.APPLICATION_ACTIVE,
      label: 'Active Job Applications',
      reason: `${submittedApps.length} applications actively submitted to market opportunities.`,
      unlockCriteria: 'Achieve application responses and secure screening/technical interview rounds.',
    };
  }

  // 6. Application Ready
  if (
    (readinessScore >= 65 || coverage >= 60) &&
    isResumeCompleted &&
    resumeScore >= 60 &&
    totalProjects >= 1
  ) {
    return {
      stage: CAREER_STAGES.APPLICATION_READY,
      label: 'Application Ready',
      reason: 'Readiness score, resume ATS optimization, and project portfolio meet entry bar for target role.',
      unlockCriteria: 'Submit first 3–5 targeted applications to relevant job opportunities.',
    };
  }

  // 7. Skill Building (if critical skill gaps exist)
  if (missingSkills.length >= 2 || coverage < 60) {
    return {
      stage: CAREER_STAGES.SKILL_BUILDING,
      label: 'Skill Gap Closure',
      reason: `Actively developing core competencies required for ${targetRole}.`,
      unlockCriteria: 'Close top 2 critical skill gaps and reach 60% skill coverage.',
    };
  }

  // 8. Proof Building
  if ((isGithubConnected || deployedProjects >= 1) && isResumeCompleted) {
    return {
      stage: CAREER_STAGES.PROOF_BUILDING,
      label: 'Proof & Verification',
      reason: 'Public evidence established (GitHub / live deployments / ATS resume), optimizing credibility.',
      unlockCriteria: 'Reach 65+ Career Readiness Score and finalize resume alignment.',
    };
  }

  // 9. Portfolio Building
  if (totalProjects >= 1) {
    return {
      stage: CAREER_STAGES.PORTFOLIO_BUILDING,
      label: 'Portfolio Building',
      reason: 'Technical projects in progress; working toward working codebases and live deployments.',
      unlockCriteria: 'Deploy at least 1 working flagship project with a live URL and clean GitHub repo.',
    };
  }

  // 10. Foundation
  return {
    stage: CAREER_STAGES.FOUNDATION,
    label: 'Career Foundation',
    reason: 'Target role established; beginning foundational curriculum and initial skill inventory.',
    unlockCriteria: 'Acquire verified skills and build your first demonstrable code project.',
  };
}

/* ─── 2. Outcome Funnel & Conversion Rates ────────────────────────── */

/**
 * Builds the career outcome funnel with strictly safe zero handling.
 *
 * @param {Array<Object>} applications
 * @returns {Object} Funnel metrics
 */
function buildCareerFunnel(applications = []) {
  let saved = 0;
  let applied = 0;
  let oa = 0;
  let interview = 0;
  let finalRound = 0;
  let offer = 0;
  let rejected = 0;
  let withdrawn = 0;
  let responded = 0;

  applications.forEach((app) => {
    const s = String(app.status || '').toUpperCase();
    if (s === 'SAVED' || s === 'PLANNING') {
      saved += 1;
    } else if (s === 'APPLIED') {
      applied += 1;
    } else if (s === 'OA') {
      applied += 1;
      oa += 1;
      responded += 1;
    } else if (s === 'INTERVIEW') {
      applied += 1;
      oa += 1;
      interview += 1;
      responded += 1;
    } else if (s === 'FINAL ROUND') {
      applied += 1;
      oa += 1;
      interview += 1;
      finalRound += 1;
      responded += 1;
    } else if (s === 'OFFER') {
      applied += 1;
      oa += 1;
      interview += 1;
      finalRound += 1;
      offer += 1;
      responded += 1;
    } else if (s === 'REJECTED') {
      applied += 1;
      rejected += 1;
      responded += 1;
    } else if (s === 'WITHDRAWN') {
      withdrawn += 1;
    }
  });

  // Conversion calculations with safe null denominators
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : null;
  const interviewRate = applied > 0 ? Math.round((interview / applied) * 100) : null;
  const finalRoundRate = interview > 0 ? Math.round((finalRound / interview) * 100) : null;
  const offerRate = interview > 0 ? Math.round((offer / interview) * 100) : null;

  // Categorical outcome quality
  let quality = 'INSUFFICIENT_DATA';
  if (applied === 0) {
    quality = 'INSUFFICIENT_DATA';
  } else if (offer >= 1 || (interviewRate !== null && interviewRate >= 30)) {
    quality = 'STRONG';
  } else if (responseRate !== null && responseRate >= 20) {
    quality = 'HEALTHY';
  } else {
    quality = 'WEAK';
  }

  return {
    saved,
    applied,
    oa,
    interview,
    finalRound,
    offer,
    rejected,
    withdrawn,
    responseRate,
    interviewRate,
    finalRoundRate,
    offerRate,
    quality,
  };
}

/* ─── 3. Evidence Conversion Gap ──────────────────────────────────── */

/**
 * Checks whether acquired skills actually appear in project code, GitHub, or resume evidence.
 *
 * @param {Object} context
 * @returns {Object} { hasGap, evidenceConversionRatio, evidenceStrength, details }
 */
function detectEvidenceConversionGap(context = {}) {
  const skills = (context.skills?.skills || []).map((s) => (s.name || s).toLowerCase());
  const projects = context.projects?.projects || context.projects?.list || [];
  const resumeText = (context.resume?.extractedSkills || []).map((s) => s.toLowerCase());

  if (skills.length === 0) {
    return {
      hasGap: false,
      evidenceConversionRatio: null,
      evidenceStrength: 0,
      details: 'Insufficient skills documented to assess evidence conversion.',
    };
  }

  // Count skills that appear in projects or resume
  let supportedSkillsCount = 0;
  skills.forEach((skill) => {
    const inProject = projects.some((p) => {
      const tech = (p.technologies || p.techStack || []).map((t) => t.toLowerCase());
      const desc = String(p.description || '').toLowerCase();
      return tech.includes(skill) || desc.includes(skill);
    });
    const inResume = resumeText.includes(skill);
    if (inProject || inResume) {
      supportedSkillsCount += 1;
    }
  });

  const ratio = Math.round((supportedSkillsCount / skills.length) * 100);
  const hasGap = skills.length >= 4 && ratio < 35;

  let evidenceStrength = ratio;
  if (context.github?.isConnected) evidenceStrength = Math.min(100, evidenceStrength + 15);
  if (projects.some((p) => p.hasLiveUrl || p.liveUrl)) evidenceStrength = Math.min(100, evidenceStrength + 15);

  return {
    hasGap,
    evidenceConversionRatio: ratio,
    evidenceStrength,
    details: hasGap
      ? `Knowledge gap: ${supportedSkillsCount} of ${skills.length} claimed skills (${ratio}%) have verifiable project or resume proof.`
      : `Healthy evidence alignment: ${ratio}% of skills are linked to verifiable proof.`,
  };
}

/* ─── 4. Stagnation & Bottleneck Detection ────────────────────────── */

/**
 * Identifies the single primary career bottleneck blocking the next stage.
 *
 * @param {Object} context
 * @param {Object} funnel
 * @param {Object} evidenceGap
 * @param {number|null} executionScore
 * @returns {Object} { type, title, reason, evidence, recommendedAction, actionRoute }
 */
function detectCareerBottleneck(context = {}, funnel = {}, evidenceGap = {}, executionScore = null) {
  const missingSkills = context.skillGap?.missingSkills || [];
  const coverage = context.skillGap?.coveragePercentage ?? 0;
  const projects = context.projects?.projects || context.projects?.list || [];
  const deployedCount = projects.filter((p) => p.hasLiveUrl || p.liveUrl).length;
  const isResumeDone = context.resume?.status === 'completed';
  const atsScore = context.resume?.atsScore ?? 0;
  const readiness = context.analytics?.careerReadinessScore ?? 0;

  // 1. Skill Bottleneck
  if (missingSkills.length >= 3 || (coverage < 40 && context.careerGoal?.targetRole)) {
    return {
      type: 'SKILL_BOTTLENECK',
      title: 'Core Competency Gap',
      reason: `Target role requires core skills that are currently missing from your profile.`,
      evidence: `${missingSkills.length} critical skills missing; coverage is at ${coverage}%.`,
      recommendedAction: 'Study and verify top 2 missing skills in the Skill Gap Analyzer.',
      actionRoute: '/student/skill-gap',
    };
  }

  // 2. Portfolio Bottleneck
  if (projects.length === 0 && context.skills?.totalSkills >= 3) {
    return {
      type: 'PORTFOLIO_BOTTLENECK',
      title: 'Missing Flagship Project',
      reason: 'Competencies exist but no code projects demonstrate hands-on application.',
      evidence: '0 projects recorded in portfolio despite having documented technical skills.',
      recommendedAction: 'Initialize and commit your first flagship portfolio project.',
      actionRoute: '/student/projects',
    };
  }

  // 3. Evidence / Deployment Bottleneck
  if (projects.length >= 1 && deployedCount === 0 && !context.github?.isConnected) {
    return {
      type: 'EVIDENCE_BOTTLENECK',
      title: 'Unverified Project Evidence',
      reason: 'Projects exist in planning or local dev but lack live proof and code verification.',
      evidence: '0 projects deployed with live URLs and GitHub repository is not connected.',
      recommendedAction: 'Connect GitHub profile and deploy project to a public URL.',
      actionRoute: '/student/github',
    };
  }

  // 4. Resume ATS Bottleneck
  if ((!isResumeDone || atsScore < 60) && (readiness >= 50 || projects.length >= 1)) {
    return {
      type: 'RESUME_BOTTLENECK',
      title: 'Resume Readiness Barrier',
      reason: 'Resume is incomplete or ATS keyword alignment is below standard thresholds.',
      evidence: isResumeDone ? `Resume ATS score is ${atsScore}/100.` : 'Resume has not been uploaded or analyzed.',
      recommendedAction: 'Analyze and polish resume bullets in the Resume Analyzer.',
      actionRoute: '/student/resume',
    };
  }

  // 5. Application Activity Bottleneck (High preparation, zero execution to market)
  if (readiness >= 60 && funnel.applied <= 1) {
    return {
      type: 'APPLICATION_BOTTLENECK',
      title: 'Application Hesitation',
      reason: 'Preparation and profile evidence are strong, but job outreach is stalled.',
      evidence: `Readiness is ${readiness}% with only ${funnel.applied} application(s) submitted.`,
      recommendedAction: 'Identify 3 matching opportunities and submit targeted applications.',
      actionRoute: '/student/opportunities',
    };
  }

  // 6. Interview Conversion Bottleneck
  if (funnel.applied >= 8 && funnel.interview === 0) {
    return {
      type: 'INTERVIEW_BOTTLENECK',
      title: 'Screening Drop-off',
      reason: 'Applications are being submitted but are not converting to interview rounds.',
      evidence: `${funnel.applied} applications submitted with 0 interview invitations received.`,
      recommendedAction: 'Review resume bullet phrasing and application job keyword matching.',
      actionRoute: '/student/applications',
    };
  }

  // 7. Execution Bottleneck
  if (typeof executionScore === 'number' && executionScore < 40) {
    return {
      type: 'EXECUTION_BOTTLENECK',
      title: 'Inconsistent Daily Cadence',
      reason: 'Low task completion rate is slowing cumulative career momentum.',
      evidence: `Recent execution score is ${executionScore}/100 with tasks overdue.`,
      recommendedAction: 'Downsize daily goals to 25-minute quick wins in the Daily Planner.',
      actionRoute: '/student/execution',
    };
  }

  // Balanced default
  return {
    type: 'NONE',
    title: 'Balanced Progression',
    reason: 'No critical blockers identified across skills, portfolio, and application funnel.',
    evidence: 'Execution and career assets are moving in healthy proportion.',
    recommendedAction: 'Maintain current cadence and continue tracking weekly milestones.',
    actionRoute: '/student/command-center',
  };
}

/* ─── 5. Multi-Dimensional Trajectory Analysis ────────────────────── */

/**
 * Derives dimensional trends and overall trajectory from historical snapshots.
 *
 * @param {Object} currentMetrics
 * @param {Array<Object>} historicalSnapshots - Sorted newest first
 * @returns {Object} Trajectory analysis
 */
function calculateTrajectory(currentMetrics = {}, historicalSnapshots = []) {
  if (!historicalSnapshots || historicalSnapshots.length === 0) {
    return {
      trajectoryStatus: TRAJECTORY_STATUS.INSUFFICIENT_DATA,
      trajectoryDelta: 0,
      confidence: 30,
      dimensionTrends: {
        skills: { status: 'INSUFFICIENT_DATA', delta: 0 },
        portfolio: { status: 'INSUFFICIENT_DATA', delta: 0 },
        resume: { status: 'INSUFFICIENT_DATA', delta: 0 },
        dsa: { status: 'INSUFFICIENT_DATA', delta: 0 },
        github: { status: 'INSUFFICIENT_DATA', delta: 0 },
        execution: { status: 'INSUFFICIENT_DATA', delta: 0 },
        applications: { status: 'INSUFFICIENT_DATA', delta: 0 },
        interviews: { status: 'INSUFFICIENT_DATA', delta: 0 },
      },
    };
  }

  const baselineSnapshot = historicalSnapshots[0]; // most recent prior snapshot

  const getDimTrend = (currentVal, priorVal, stepThreshold = 2) => {
    if (currentVal === null || priorVal === null || currentVal === undefined || priorVal === undefined) {
      return { status: 'INSUFFICIENT_DATA', delta: 0 };
    }
    const delta = Number((currentVal - priorVal).toFixed(1));
    let status = 'STABLE';
    if (delta >= stepThreshold) status = 'IMPROVING';
    else if (delta <= -stepThreshold) status = 'DECLINING';
    return { status, delta };
  };

  const dimensionTrends = {
    skills: getDimTrend(currentMetrics.skillCoverage, baselineSnapshot.skillCoverage, 3),
    portfolio: getDimTrend(currentMetrics.portfolioQuality, baselineSnapshot.portfolioQuality, 5),
    resume: getDimTrend(currentMetrics.resumeReadiness, baselineSnapshot.resumeReadiness, 4),
    dsa: getDimTrend(currentMetrics.dsaProgress, baselineSnapshot.dsaProgress, 2),
    github: getDimTrend(currentMetrics.githubEvidence, baselineSnapshot.githubEvidence, 2),
    execution: getDimTrend(currentMetrics.executionScore, baselineSnapshot.executionScore, 5),
    applications: getDimTrend(currentMetrics.applicationActivity, baselineSnapshot.applicationActivity, 1),
    interviews: getDimTrend(currentMetrics.interviewProgress, baselineSnapshot.interviewProgress, 1),
  };

  // Count improving vs declining dimensions
  let improvingCount = 0;
  let decliningCount = 0;
  Object.values(dimensionTrends).forEach((dim) => {
    if (dim.status === 'IMPROVING') improvingCount += 1;
    if (dim.status === 'DECLINING') decliningCount += 1;
  });

  const currentReadiness = currentMetrics.careerReadiness ?? 0;
  const priorReadiness = baselineSnapshot.careerReadiness ?? currentReadiness;
  const trajectoryDelta = Number((currentReadiness - priorReadiness).toFixed(1));

  let trajectoryStatus = TRAJECTORY_STATUS.STABLE;

  if (historicalSnapshots.length < 1) {
    trajectoryStatus = TRAJECTORY_STATUS.INSUFFICIENT_DATA;
  } else if (improvingCount >= 3 || trajectoryDelta >= 8) {
    trajectoryStatus = TRAJECTORY_STATUS.ACCELERATING;
  } else if (improvingCount > decliningCount || trajectoryDelta >= 2) {
    trajectoryStatus = TRAJECTORY_STATUS.IMPROVING;
  } else if (decliningCount > improvingCount || trajectoryDelta <= -4) {
    trajectoryStatus = TRAJECTORY_STATUS.DECLINING;
  } else if (
    currentMetrics.executionScore !== null &&
    currentMetrics.executionScore >= 50 &&
    improvingCount === 0 &&
    Math.abs(trajectoryDelta) <= 1
  ) {
    trajectoryStatus = TRAJECTORY_STATUS.STAGNATING;
  } else {
    trajectoryStatus = TRAJECTORY_STATUS.STABLE;
  }

  // Confidence calculation based on snapshot history volume
  let confidence = 50;
  if (historicalSnapshots.length >= 4) confidence = 85;
  else if (historicalSnapshots.length >= 2) confidence = 70;
  else confidence = 45;

  return {
    trajectoryStatus,
    trajectoryDelta,
    confidence,
    dimensionTrends,
  };
}

/* ─── 6. Conservative Milestone Forecasting ───────────────────────── */

/**
 * Estimates weeks to reach next target milestone without promising guaranteed dates.
 * Requires at least 3 historical snapshots.
 *
 * @param {number} currentCoverage
 * @param {Array<Object>} historicalSnapshots
 * @param {number} targetCoverage
 * @returns {Object} Forecast projection
 */
function computeMilestoneForecast(currentCoverage, historicalSnapshots = [], targetCoverage = 75) {
  if (!historicalSnapshots || historicalSnapshots.length < 3) {
    return {
      targetMetric: 'Skill Coverage 75%',
      estimatedWeeks: null,
      confidence: 'INSUFFICIENT_DATA',
      message: 'At least 3 historical trajectory snapshots are required for a reliable projection.',
      isGuaranteed: false,
    };
  }

  const oldest = historicalSnapshots[historicalSnapshots.length - 1];
  const oldVal = oldest.skillCoverage ?? currentCoverage;
  const totalChange = currentCoverage - oldVal;

  if (currentCoverage >= targetCoverage) {
    return {
      targetMetric: `Skill Coverage ${targetCoverage}%`,
      estimatedWeeks: 0,
      confidence: 'HIGH',
      message: 'Target milestone already achieved.',
      isGuaranteed: false,
    };
  }

  // Average weekly change
  const snapshotCount = historicalSnapshots.length;
  const avgWeeklyDelta = Number((totalChange / snapshotCount).toFixed(2));

  if (avgWeeklyDelta <= 0.2) {
    return {
      targetMetric: `Skill Coverage ${targetCoverage}%`,
      estimatedWeeks: null,
      confidence: 'LOW',
      message: 'Velocity is currently flat; steady practice required to establish projection.',
      isGuaranteed: false,
    };
  }

  const gap = targetCoverage - currentCoverage;
  const estimatedWeeks = Math.max(1, Math.round(gap / avgWeeklyDelta));

  let confidence = 'MEDIUM';
  if (snapshotCount >= 5 && avgWeeklyDelta >= 2) confidence = 'HIGH';
  else if (avgWeeklyDelta < 1) confidence = 'LOW';

  return {
    targetMetric: `Skill Coverage ${targetCoverage}%`,
    estimatedWeeks,
    confidence,
    message: `Based on recent movement (+${avgWeeklyDelta}%/wk), approximately ${estimatedWeeks} week${estimatedWeeks === 1 ? '' : 's'} may be required to reach this milestone.`,
    isGuaranteed: false,
  };
}

/* ─── 7. Automated Milestone Synchronization ──────────────────────── */

/**
 * Suggests and updates deterministic milestones matching current stage and bottleneck.
 * Uses stableKeys to prevent duplicate document spam.
 *
 * @param {string|ObjectId} userId
 * @param {Object} context
 * @param {Object} bottleneck
 * @param {string} stage
 * @returns {Promise<Array<Object>>}
 */
async function syncMilestones(userId, context = {}, bottleneck = {}, stage = CAREER_STAGES.FOUNDATION) {
  const coverage = context.skillGap?.coveragePercentage ?? 0;
  const projects = context.projects?.projects || context.projects?.list || [];
  const deployedCount = projects.filter((p) => p.hasLiveUrl || p.liveUrl).length;
  const isResumeDone = context.resume?.status === 'completed';
  const atsScore = context.resume?.atsScore ?? 0;
  const readiness = context.analytics?.careerReadinessScore ?? 0;

  const candidateMilestones = [
    {
      stableKey: 'ms_skill_coverage_75',
      title: 'Reach 75% Required Skill Coverage',
      description: 'Acquire and verify primary core competencies for target role.',
      category: 'SKILL',
      priority: 'HIGH',
      progress: Math.min(100, Math.round((coverage / 75) * 100)),
      status: coverage >= 75 ? 'COMPLETED' : coverage >= 50 ? 'IN_PROGRESS' : 'NOT_STARTED',
    },
    {
      stableKey: 'ms_deploy_flagship_project',
      title: 'Deploy Flagship Portfolio Project',
      description: 'Ship working code to production with public live demo URL.',
      category: 'PROJECT',
      priority: 'HIGH',
      progress: deployedCount >= 1 ? 100 : projects.length >= 1 ? 50 : 0,
      status: deployedCount >= 1 ? 'COMPLETED' : projects.length >= 1 ? 'IN_PROGRESS' : 'NOT_STARTED',
    },
    {
      stableKey: 'ms_resume_ats_75',
      title: 'Achieve Resume ATS Readiness ≥ 75',
      description: 'Tailor resume bullets and optimize keyword density for target role.',
      category: 'PROOF',
      priority: 'MEDIUM',
      progress: Math.min(100, Math.round((atsScore / 75) * 100)),
      status: atsScore >= 75 ? 'COMPLETED' : isResumeDone ? 'IN_PROGRESS' : 'NOT_STARTED',
    },
    {
      stableKey: 'ms_submit_first_5_apps',
      title: 'Submit First 5 Targeted Applications',
      description: 'Convert portfolio preparation into active market opportunities.',
      category: 'APPLICATION',
      priority: 'HIGH',
      progress: Math.min(100, Math.round(((context.applications?.total ?? 0) / 5) * 100)),
      status: (context.applications?.total ?? 0) >= 5 ? 'COMPLETED' : (context.applications?.total ?? 0) > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    },
    {
      stableKey: 'ms_career_readiness_70',
      title: 'Attain 70 Career Readiness Score',
      description: 'Holistic alignment across skills, portfolio proof, and market execution.',
      category: 'CAREER',
      priority: 'HIGH',
      progress: Math.min(100, Math.round((readiness / 70) * 100)),
      status: readiness >= 70 ? 'COMPLETED' : readiness >= 40 ? 'IN_PROGRESS' : 'NOT_STARTED',
    },
  ];

  // Upsert candidate milestones without duplicate document creation
  for (const m of candidateMilestones) {
    const existing = await CareerMilestone.findOne({ user: userId, stableKey: m.stableKey });
    if (existing) {
      existing.progress = m.progress;
      if (m.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        existing.status = 'COMPLETED';
        existing.completedAt = new Date();
      } else if (existing.status !== 'COMPLETED') {
        existing.status = m.status;
      }
      await existing.save();
    } else {
      await CareerMilestone.create({
        user: userId,
        ...m,
        completedAt: m.status === 'COMPLETED' ? new Date() : null,
      });
    }
  }

  // Return user's active milestones
  const allMilestones = await CareerMilestone.find({ user: userId })
    .sort({ status: -1, priority: -1, createdAt: 1 })
    .lean();

  return allMilestones;
}

/* ─── 8. Comprehensive Outcome Aggregation ────────────────────────── */

/**
 * Builds the complete Career Outcome & Trajectory payload for authenticated student.
 *
 * @param {string|ObjectId} userId
 * @param {Object} options - { forceRefresh: boolean }
 * @returns {Promise<Object>} Outcome & Trajectory payload
 */
async function getCareerOutcomeData(userId, options = {}) {
  const { forceRefresh = false } = options;
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch real context and applications
  const [context, applications, pastSnapshots] = await Promise.all([
    buildCopilotContext(userId).catch(() => ({})),
    Application.find({ user: userId }).lean().catch(() => []),
    CareerTrajectorySnapshot.find({ user: userId })
      .sort({ generatedAt: -1 })
      .limit(10)
      .lean()
      .catch(() => []),
  ]);

  // 1. Stage determination
  const stageInfo = determineCareerStage(context, applications);

  // 2. Funnel metrics
  const funnel = buildCareerFunnel(applications);

  // 3. Evidence gap
  const evidenceGap = detectEvidenceConversionGap(context);

  // 4. Bottleneck
  const executionScore =
    typeof context.analytics?.executionScore === 'number'
      ? context.analytics.executionScore
      : null;
  const bottleneck = detectCareerBottleneck(context, funnel, evidenceGap, executionScore);

  // 5. Current metrics object for snapshotting
  const currentMetrics = {
    careerReadiness: context.analytics?.careerReadinessScore ?? null,
    skillCoverage: context.skillGap?.coveragePercentage ?? null,
    executionScore,
    portfolioQuality: (context.projects?.projects || []).length > 0 ? 75 : null,
    resumeReadiness: context.resume?.status === 'completed' ? context.resume.atsScore : null,
    dsaProgress: context.dsa?.totalSolved ?? 0,
    githubEvidence: context.github?.publicRepos ?? 0,
    applicationActivity: funnel.applied,
    interviewProgress: funnel.interview,
    offerProgress: funnel.offer,
    evidenceStrength: evidenceGap.evidenceStrength,
  };

  // 6. Trajectory calculation
  const trajectory = calculateTrajectory(currentMetrics, pastSnapshots);

  // 7. Milestone sync & forecast
  const milestones = await syncMilestones(userId, context, bottleneck, stageInfo.stage);
  const forecast = computeMilestoneForecast(
    currentMetrics.skillCoverage ?? 50,
    pastSnapshots,
    75
  );

  // 8. Extract next active milestone
  const nextMilestone =
    milestones.find((m) => m.status === 'IN_PROGRESS' || m.status === 'NOT_STARTED') || null;

  // 9. Outcome signals (Key verified achievements & blockers)
  const keyWins = [];
  const keyBlockers = [];

  if (currentMetrics.careerReadiness && currentMetrics.careerReadiness >= 65) {
    keyWins.push(`Attained strong Career Readiness Score (${currentMetrics.careerReadiness}/100).`);
  }
  if (funnel.interview > 0) {
    keyWins.push(`Advanced ${funnel.interview} opportunity into interview rounds.`);
  }
  if (evidenceGap.evidenceConversionRatio && evidenceGap.evidenceConversionRatio >= 60) {
    keyWins.push(`${evidenceGap.evidenceConversionRatio}% of skills backed by verifiable project evidence.`);
  }

  if (bottleneck.type !== 'NONE') {
    keyBlockers.push(bottleneck.evidence);
  }
  if (evidenceGap.hasGap) {
    keyBlockers.push(evidenceGap.details);
  }

  // 10. Snapshot persistence (Deduplicated within 24 hours)
  const shouldRecord =
    forceRefresh ||
    pastSnapshots.length === 0 ||
    new Date(pastSnapshots[0].generatedAt).getTime() < twentyFourHoursAgo.getTime();

  let activeSnapshot = pastSnapshots[0] || null;

  if (shouldRecord) {
    const newSnapshot = await CareerTrajectorySnapshot.create({
      user: userId,
      snapshotDate: now,
      ...currentMetrics,
      careerStage: stageInfo.stage,
      trajectoryStatus: trajectory.trajectoryStatus,
      trajectoryDelta: trajectory.trajectoryDelta,
      confidence: trajectory.confidence,
      dimensionTrends: trajectory.dimensionTrends,
      funnel,
      bottleneck,
      keyWins,
      keyBlockers,
      generatedAt: now,
    });
    activeSnapshot = newSnapshot.toObject();
  }

  return {
    careerStage: stageInfo.stage,
    careerStageLabel: stageInfo.label,
    careerStageReason: stageInfo.reason,
    unlockCriteria: stageInfo.unlockCriteria,
    trajectoryStatus: trajectory.trajectoryStatus,
    trajectoryDelta: trajectory.trajectoryDelta,
    confidence: trajectory.confidence,
    dimensionTrends: trajectory.dimensionTrends,
    funnel,
    evidenceGap,
    bottleneck,
    milestones,
    nextMilestone,
    forecast,
    keyWins,
    keyBlockers,
    pastSnapshots: pastSnapshots.slice(0, 5),
    outcomeSignal: {
      hasImprovement: trajectory.trajectoryDelta > 0,
      delta: trajectory.trajectoryDelta,
      headline:
        trajectory.trajectoryStatus === 'ACCELERATING'
          ? 'Velocity is accelerating across multiple career domains'
          : trajectory.trajectoryStatus === 'IMPROVING'
          ? 'Trajectory is improving with positive evidence gains'
          : trajectory.trajectoryStatus === 'STAGNATING'
          ? 'Execution active but evidence conversion is stalled'
          : 'Cadence is steady; focus on unblocking primary bottleneck',
    },
    generatedAt: activeSnapshot?.generatedAt || now,
  };
}

/* ─── 9. Weekly & Monthly Reviews ─────────────────────────────────── */

/**
 * Returns a 7-day outcome review.
 */
async function getWeeklyOutcomeReview(userId) {
  const data = await getCareerOutcomeData(userId);
  return {
    period: 'WEEKLY',
    careerStage: data.careerStageLabel,
    trajectory: data.trajectoryStatus,
    trajectoryDelta: data.trajectoryDelta,
    wins: data.keyWins.slice(0, 3),
    regressions: data.keyBlockers.slice(0, 2),
    bottleneck: data.bottleneck,
    nextMilestone: data.nextMilestone,
    evidenceProgress: data.evidenceGap.details,
    applicationProgress: `${data.funnel.applied} applications (${data.funnel.responseRate !== null ? data.funnel.responseRate + '%' : 'N/A'} response)`,
    recommendedChange: data.bottleneck.recommendedAction,
  };
}

/**
 * Returns a 30-day outcome review.
 */
async function getMonthlyOutcomeReview(userId) {
  const data = await getCareerOutcomeData(userId);
  return {
    period: 'MONTHLY',
    careerStage: data.careerStageLabel,
    trajectory: data.trajectoryStatus,
    trajectoryDelta: data.trajectoryDelta,
    majorWins: data.keyWins,
    majorBlockers: data.keyBlockers,
    stageProgress: data.unlockCriteria,
    milestonesSummary: {
      total: data.milestones.length,
      completed: data.milestones.filter((m) => m.status === 'COMPLETED').length,
    },
    funnel: data.funnel,
    forecast: data.forecast,
  };
}

module.exports = {
  CAREER_STAGES,
  TRAJECTORY_STATUS,
  determineCareerStage,
  buildCareerFunnel,
  detectEvidenceConversionGap,
  detectCareerBottleneck,
  calculateTrajectory,
  computeMilestoneForecast,
  syncMilestones,
  getCareerOutcomeData,
  getWeeklyOutcomeReview,
  getMonthlyOutcomeReview,
};
