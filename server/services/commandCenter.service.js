/**
 * commandCenter.service.js
 *
 * Orchestration service for Career Command Center (/api/command-center).
 * Pure orchestration layer that aggregates and unifies existing services:
 * - copilotContext service
 * - careerScore service
 * - careerIntelligence service
 * - weeklyStrategy service
 * - execution service
 * - analytics service
 * - skillGap service
 *
 * NON-DUPLICATION RULE:
 * This service never recalculates or duplicates underlying business logic.
 * External modules remain authoritative for their own metrics.
 */

const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');
const ExecutionTask = require('../models/ExecutionTask');

const { buildCopilotContext } = require('./copilotContext.service');
const {
  generateCareerIntelligence,
  generateRankedCandidateActions,
  identifyBiggestWeakness,
} = require('./careerIntelligence.service');
const { generateWeeklyStrategy } = require('./weeklyStrategy.service');
const {
  getDailyExecution,
  getExecutionAnalytics,
  getGoalsRiskAssessment,
  getWeeklyReview,
} = require('./execution.service');
const { getOrRecordAdaptiveSnapshot } = require('./adaptiveCareer.service');
const { getCareerOutcomeData } = require('./careerOutcome.service');

/* ─── Current State Classifier (Deterministic) ───────────────────── */

function determineCurrentState({
  context,
  careerReadiness,
  executionScore,
  completionRate,
  skippedPatterns = [],
}) {
  const targetRole = context.careerGoal?.targetRole;
  const skillsCount = context.skills?.totalSkills ?? 0;
  const upcomingInterviews = context.applications?.upcomingInterviews || [];
  const missingSkills = context.skillGap?.missingSkills || [];
  const coverage = context.skillGap?.coveragePercentage;
  const totalProjects = context.projects?.totalProjects ?? 0;
  const trackedApps = context.applications?.total ?? 0;

  // 1. Foundation not set
  if (!targetRole || skillsCount === 0 || (context.profile?.profileCompletion ?? 0) < 40) {
    return {
      state: 'BUILDING_FOUNDATION',
      label: 'Building Foundation',
      description: 'Your profile and core target role are not fully configured yet.',
    };
  }

  // 2. Scheduled Interview
  if (upcomingInterviews.length > 0) {
    return {
      state: 'INTERVIEW_READY',
      label: 'Interview Ready',
      description: `Active interview scheduled with ${upcomingInterviews[0].company}. Focus on behavioral and technical prep.`,
    };
  }

  // 3. Execution friction (high strategy/readiness, but execution is stumbling)
  if (
    typeof careerReadiness === 'number' &&
    careerReadiness >= 50 &&
    ((typeof completionRate === 'number' && completionRate < 50) || skippedPatterns.length >= 2)
  ) {
    return {
      state: 'EXECUTION_FRICTION',
      label: 'Execution Friction',
      description: 'Strategic readiness is established, but planned execution has faced consistent friction. Downsize daily tasks.',
    };
  }

  // 4. Large Skill Gaps
  if (missingSkills.length >= 3 || (typeof coverage === 'number' && coverage < 50)) {
    return {
      state: 'CLOSING_SKILL_GAPS',
      label: 'Closing Skill Gaps',
      description: 'Prioritizing baseline technical competencies required for your target role.',
    };
  }

  // 5. Missing Portfolio Proof
  if (totalProjects === 0 || !context.github?.isConnected) {
    return {
      state: 'BUILDING_PORTFOLIO',
      label: 'Building Portfolio',
      description: 'Core skills are established. Focus on building and deploying verified projects to prove competence.',
    };
  }

  // 6. Preparing for Applications
  if (
    typeof careerReadiness === 'number' &&
    careerReadiness >= 65 &&
    context.resume?.status === 'completed' &&
    totalProjects > 0 &&
    trackedApps === 0
  ) {
    return {
      state: 'PREPARING_FOR_APPLICATIONS',
      label: 'Preparing for Applications',
      description: 'Profile and portfolio are solid. Transition into active application tracking.',
    };
  }

  // 7. Maintaining Momentum
  if (
    typeof careerReadiness === 'number' &&
    careerReadiness >= 65 &&
    typeof executionScore === 'number' &&
    executionScore >= 65
  ) {
    return {
      state: 'MAINTAINING_MOMENTUM',
      label: 'Maintaining Momentum',
      description: 'Strong alignment between career readiness and consistent daily execution.',
    };
  }

  return {
    state: 'BUILDING_FOUNDATION',
    label: 'Building Foundation',
    description: 'Establish foundational career assets and resume evidence.',
  };
}

/* ─── 4 Career Pillars Aggregator ────────────────────────────────── */

function calculateCareerPillars(context, executionAnalytics) {
  // 1. Skills Pillar
  const skillCoverage = context.skillGap?.coveragePercentage;
  const missingCount = context.skillGap?.missingSkills?.length ?? 0;
  let skillsScore = typeof skillCoverage === 'number' ? skillCoverage : null;
  let skillsExplanation =
    skillsScore !== null
      ? missingCount === 0
        ? 'All baseline skills are verified for your target role.'
        : `${missingCount} core skill(s) still require verified evidence.`
      : 'Target role not set. Add skills to compute coverage.';

  // 2. Portfolio Pillar
  const projects = context.projects?.list || [];
  const totalProjects = projects.length;
  const deployedCount = projects.filter((p) => p.hasLiveUrl).length;
  const hasGitHub = context.github?.isConnected;
  let portfolioScore = null;
  if (totalProjects > 0) {
    let pPts = Math.min(60, totalProjects * 25);
    if (deployedCount > 0) pPts += 20;
    if (hasGitHub) pPts += 20;
    portfolioScore = Math.min(100, pPts);
  }
  let portfolioExplanation =
    portfolioScore !== null
      ? deployedCount > 0
        ? `${totalProjects} project(s) registered with verified deployment links.`
        : `${totalProjects} project(s) recorded, but live deployment proof is missing.`
      : 'Zero portfolio projects registered. Add projects with GitHub links.';

  // 3. Proof Pillar (Resume + DSA + GitHub)
  const resumeScore = context.resume?.overallScore;
  const dsaSolved = context.dsa?.totalSolved ?? 0;
  const stars = context.github?.totalStars ?? 0;
  let proofScore = null;
  if (context.resume?.status === 'completed') {
    let pts = (resumeScore || 50) * 0.6;
    pts += Math.min(25, (dsaSolved / 100) * 25);
    pts += Math.min(15, hasGitHub ? 15 : 0);
    proofScore = Math.min(100, Math.round(pts));
  }
  let proofExplanation =
    proofScore !== null
      ? resumeScore >= 70
        ? 'Strong resume ATS score and public technical evidence.'
        : 'Resume evidence needs optimization for target role keywords.'
      : 'Resume not uploaded or analyzed. Upload resume for ATS proof.';

  // 4. Execution Pillar (Execution OS)
  const execScore = executionAnalytics?.executionScore;
  const consistency = executionAnalytics?.consistencyScore;
  let executionScore = typeof execScore === 'number' ? execScore : null;
  let executionExplanation =
    executionScore !== null
      ? executionScore >= 70
        ? `High-performance execution pace (Consistency: ${consistency ?? 'N/A'}/100).`
        : `Execution completion needs attention (Consistency: ${consistency ?? 'N/A'}/100).`
      : 'Log planned tasks in the Career Execution OS to measure execution.';

  return [
    {
      id: 'skills',
      name: 'Skills',
      score: skillsScore,
      status: skillsScore >= 75 ? 'STRONG' : skillsScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION',
      explanation: skillsExplanation,
    },
    {
      id: 'portfolio',
      name: 'Portfolio',
      score: portfolioScore,
      status: portfolioScore >= 75 ? 'STRONG' : portfolioScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION',
      explanation: portfolioExplanation,
    },
    {
      id: 'proof',
      name: 'Proof',
      score: proofScore,
      status: proofScore >= 75 ? 'STRONG' : proofScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION',
      explanation: proofExplanation,
    },
    {
      id: 'execution',
      name: 'Execution',
      score: executionScore,
      status: executionScore >= 75 ? 'STRONG' : executionScore >= 50 ? 'DEVELOPING' : 'NEEDS_ATTENTION',
      explanation: executionExplanation,
    },
  ];
}

/* ─── Career Risks Engine ─────────────────────────────────────────── */

function detectCareerRisks({ context, executionAnalytics, atRiskGoals = [] }) {
  const risks = [];

  // Risk 1: Urgent application deadline / upcoming interview in 72h
  const deadlines = context.applications?.upcomingDeadlines || [];
  if (deadlines.length > 0) {
    const next = deadlines[0];
    const diffHours = (new Date(next.deadline).getTime() - Date.now()) / 3600000;
    if (diffHours <= 72) {
      risks.push({
        id: `risk-deadline-${next.id}`,
        title: `Impending Application Deadline: ${next.company}`,
        severity: 'HIGH',
        reason: `Deadline is in ${Math.max(1, Math.round(diffHours))} hours for ${next.role}.`,
        action: { label: 'Complete Application', route: '/student/applications' },
      });
    }
  }

  // Risk 2: Missing Core Skill Gap
  const priorityGaps = context.skillGap?.priorityGaps || [];
  if (priorityGaps.length > 0) {
    const topGap = priorityGaps[0].name || priorityGaps[0];
    risks.push({
      id: 'risk-skill-gap',
      title: `Core Skill Gap: ${topGap}`,
      severity: 'HIGH',
      reason: `${topGap} is a foundational requirement for ${context.careerGoal?.targetRole || 'your target role'} and currently missing.`,
      action: { label: 'Inspect Skill Gap', route: '/student/skill-gap' },
    });
  }

  // Risk 3: Unuploaded or Low ATS Resume
  if (!context.resume?.available || context.resume.status !== 'completed') {
    risks.push({
      id: 'risk-resume-missing',
      title: 'Missing Resume ATS Analysis',
      severity: 'HIGH',
      reason: 'No completed resume on file. Verified ATS keyword extraction cannot run.',
      action: { label: 'Upload Resume', route: '/student/resume' },
    });
  } else if ((context.resume.atsScore || 0) < 60) {
    risks.push({
      id: 'risk-resume-ats-low',
      title: 'Low Resume ATS Match',
      severity: 'MEDIUM',
      reason: `ATS score is currently ${context.resume.atsScore}/100. Add quantified project bullet points.`,
      action: { label: 'Optimize Resume', route: '/student/resume' },
    });
  }

  // Risk 4: At-Risk Career Goals
  if (atRiskGoals.length > 0) {
    const g = atRiskGoals[0];
    risks.push({
      id: `risk-goal-${g.goalId}`,
      title: `Goal At Risk: ${g.title}`,
      severity: 'HIGH',
      reason: g.recommendation || 'Approaching deadline with low progress.',
      action: { label: 'View Execution OS', route: '/student/execution' },
    });
  }

  // Risk 5: Repeated Skipped Patterns (Execution Friction)
  const skipped = executionAnalytics?.skippedPatterns || [];
  if (skipped.length > 0) {
    const s = skipped[0];
    risks.push({
      id: `risk-skipped-${s.category}`,
      title: `Repeated Skips: ${s.category} Tasks`,
      severity: 'MEDIUM',
      reason: s.recommendation,
      action: { label: 'View Execution OS', route: '/student/execution' },
    });
  }

  // Risk 6: Unverified / Undeployed Projects
  const projects = context.projects?.list || [];
  const unverified = projects.find((p) => !p.hasLiveUrl);
  if (unverified) {
    risks.push({
      id: `risk-project-${unverified.id}`,
      title: `Project Not Deployed: ${unverified.title}`,
      severity: 'MEDIUM',
      reason: 'Employers expect live interactive links for portfolio projects.',
      action: { label: 'Update Project', route: '/student/projects' },
    });
  }

  return risks.slice(0, 5);
}

/* ─── Executable Next Best Action Linker ──────────────────────────── */

async function resolveExecutableNextBestAction(userId, rankedActions = []) {
  if (!rankedActions.length) return null;

  const topAction = rankedActions[0];

  // Find if an ExecutionTask already exists for today that corresponds to this action
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const existingTask = await ExecutionTask.findOne({
    user: userId,
    scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['PLANNED', 'IN_PROGRESS', 'PAUSED'] },
    $or: [
      { relatedEntityId: topAction.relatedEntityId },
      { title: new RegExp(topAction.title.slice(0, 20), 'i') },
    ],
  });

  if (existingTask) {
    return {
      id: topAction.relatedEntityId || existingTask._id,
      title: topAction.title,
      reason: topAction.reason,
      category: existingTask.category || 'CAREER',
      priority: topAction.priority || 'HIGH',
      estimatedMinutes: topAction.estimatedMinutes || existingTask.estimatedMinutes || 30,
      impact: topAction.impact || 85,
      source: 'CAREER_INTELLIGENCE',
      relatedModule: topAction.module,
      relatedEntityType: topAction.relatedEntityType,
      relatedEntityId: topAction.relatedEntityId,
      actionType: 'START_EXECUTION_TASK',
      taskId: existingTask._id,
      taskStatus: existingTask.status,
    };
  }

  // Default to module navigation if no task exists
  const moduleRoutes = {
    'Resume': '/student/resume',
    'Skill Gap': '/student/skill-gap',
    'Projects': '/student/projects',
    'Roadmap': '/student/roadmap',
    'Applications': '/student/applications',
    'DSA': '/student/dsa',
    'GitHub': '/student/github',
    'Career Goal': '/student/career-goal',
  };

  return {
    id: topAction.relatedEntityId || 'nba-1',
    title: topAction.title,
    reason: topAction.reason,
    category: topAction.module?.toUpperCase() || 'CAREER',
    priority: topAction.priority || 'HIGH',
    estimatedMinutes: topAction.estimatedMinutes || 30,
    impact: topAction.impact || 80,
    source: 'CAREER_INTELLIGENCE',
    relatedModule: topAction.module,
    relatedEntityType: topAction.relatedEntityType || null,
    relatedEntityId: topAction.relatedEntityId || null,
    actionType: 'OPEN_MODULE',
    route: moduleRoutes[topAction.module] || '/student/dashboard',
  };
}

/* ─── Authentic Snapshot & Trend Engine ──────────────────────────── */

async function getOrRecordCommandCenterSnapshot(userId, liveMetrics, forceRefresh = false) {
  const now = Date.now();
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const latest = await CommandCenterSnapshot.findOne({ user: userId }).sort({ capturedAt: -1 });

  let shouldRecord = false;
  if (!latest) {
    shouldRecord = true;
  } else if (forceRefresh) {
    shouldRecord = true;
  } else {
    const elapsed = now - new Date(latest.capturedAt).getTime();
    if (elapsed >= TWENTY_FOUR_HOURS) {
      shouldRecord = true;
    }
  }

  if (shouldRecord) {
    try {
      await CommandCenterSnapshot.create({
        user: userId,
        capturedAt: new Date(),
        careerReadinessScore: liveMetrics.careerReadiness,
        executionScore: typeof liveMetrics.executionScore === 'number' ? liveMetrics.executionScore : null,
        completionRate: typeof liveMetrics.completionRate === 'number' ? liveMetrics.completionRate : null,
        consistencyScore: typeof liveMetrics.consistencyScore === 'number' ? liveMetrics.consistencyScore : null,
        skillCoverage: liveMetrics.skillCoverage,
        portfolioQuality: liveMetrics.portfolioQuality,
        resumeReadiness: liveMetrics.resumeReadiness,
        applicationActivity: liveMetrics.applicationActivity,
        dsaProgress: liveMetrics.dsaProgress,
        careerMomentum: liveMetrics.careerMomentum || 0,
        biggestGap: liveMetrics.biggestGap || '',
        biggestRisk: liveMetrics.biggestRisk || '',
        nextBestAction: liveMetrics.nextBestAction || '',
      });
    } catch {
      // Non-blocking snapshot recording
    }
  }

  // Calculate authentic trends from stored snapshots (requires at least 2)
  const history = await CommandCenterSnapshot.find({ user: userId })
    .sort({ capturedAt: -1 })
    .limit(10)
    .lean();

  if (history.length < 2) {
    return {
      status: 'INSUFFICIENT_DATA',
      explanation: 'Build more execution and career history to unlock authentic trends.',
      snapshotsCount: history.length,
      deltas: null,
    };
  }

  const current = history[0];
  const previous = history[1];

  const deltas = {
    careerReadiness:
      current.careerReadinessScore !== null && previous.careerReadinessScore !== null
        ? current.careerReadinessScore - previous.careerReadinessScore
        : null,
    execution:
      current.executionScore !== null && previous.executionScore !== null
        ? current.executionScore - previous.executionScore
        : null,
    skillCoverage:
      current.skillCoverage !== null && previous.skillCoverage !== null
        ? current.skillCoverage - previous.skillCoverage
        : null,
    applicationActivity: current.applicationActivity - previous.applicationActivity,
  };

  const readinessDelta = deltas.careerReadiness ?? 0;
  const execDelta = deltas.execution ?? 0;
  const overallDelta = Math.round(readinessDelta * 0.6 + execDelta * 0.4);

  let momentumStatus = 'STABLE';
  let explanation = 'Your career readiness and execution cadence are steady.';

  if (overallDelta > 2) {
    momentumStatus = 'IMPROVING';
    explanation = 'Your recent execution coincides with measurable readiness gains.';
  } else if (overallDelta < -2) {
    momentumStatus = 'DECLINING';
    explanation = 'Recent execution or activity has dipped compared to your previous snapshot.';
  }

  return {
    status: momentumStatus,
    overallDelta,
    deltas,
    explanation,
    snapshotsCount: history.length,
    lastCapturedAt: current.capturedAt,
  };
}

/* ─── Verifiable Achievements Aggregator ─────────────────────────── */

function aggregateRecentAchievements({ context, executionAnalytics }) {
  const wins = [];

  // 1. Execution completed tasks
  const completedToday = executionAnalytics?.daily?.completedTasks || 0;
  if (completedToday > 0) {
    wins.push(`Completed ${completedToday} planned task(s) today.`);
  }

  const completedWeek = executionAnalytics?.weekly?.completedTasks || 0;
  if (completedWeek >= 3) {
    wins.push(`Executed ${completedWeek} career tasks this week.`);
  }

  // 2. Streaks
  const streak = executionAnalytics?.streaks?.dailyStreak || 0;
  if (streak >= 3) {
    wins.push(`Maintained a ${streak}-day active execution streak.`);
  }

  // 3. Projects deployed
  const deployed = (context.projects?.list || []).filter((p) => p.hasLiveUrl);
  if (deployed.length > 0) {
    wins.push(`Verified ${deployed.length} live project deployment(s).`);
  }

  // 4. Resume completed
  if (context.resume?.status === 'completed' && (context.resume?.atsScore || 0) >= 70) {
    wins.push(`Achieved verified ${context.resume.atsScore}/100 ATS resume score.`);
  }

  // 5. Interviews
  const interviews = context.applications?.upcomingInterviews || [];
  if (interviews.length > 0) {
    wins.push(`Secured interview invitation with ${interviews[0].company}.`);
  }

  if (wins.length === 0) {
    wins.push('Ready to record your first career milestones and completions.');
  }

  return wins.slice(0, 5);
}

/* ─── Main Command Center Aggregator ─────────────────────────────── */

async function getCommandCenterData(userId, options = {}) {
  const forceRefresh = options.forceRefresh || false;

  // 1. Gather all context concurrently via existing services
  const [
    context,
    careerIntelligence,
    weeklyStrategy,
    todayExecution,
    executionAnalytics,
    goalAssessments,
    adaptiveSnapshot,
    outcomeData,
  ] = await Promise.all([
    buildCopilotContext(userId),
    generateCareerIntelligence(userId, { forceRefresh }),
    generateWeeklyStrategy(userId),
    getDailyExecution(userId),
    getExecutionAnalytics(userId),
    getGoalsRiskAssessment(userId),
    getOrRecordAdaptiveSnapshot(userId, { forceRefresh }).catch(() => null),
    getCareerOutcomeData(userId, { forceRefresh }).catch(() => null),
  ]);

  const careerReadiness = context.analytics?.careerReadinessScore ?? null;
  const executionScore = executionAnalytics?.executionScore ?? 'INSUFFICIENT_DATA';
  const completionRate = executionAnalytics?.completionRate ?? 'INSUFFICIENT_DATA';
  const consistencyScore = executionAnalytics?.consistencyScore ?? 'INSUFFICIENT_DATA';

  // 2. Classify Current State
  const currentState = determineCurrentState({
    context,
    careerReadiness,
    executionScore: typeof executionScore === 'number' ? executionScore : null,
    completionRate: typeof completionRate === 'number' ? completionRate : null,
    skippedPatterns: executionAnalytics?.skippedPatterns || [],
  });

  // 3. 4 Career Pillars
  const pillars = calculateCareerPillars(context, executionAnalytics);

  // 4. Career Risks
  const risks = detectCareerRisks({
    context,
    executionAnalytics,
    atRiskGoals: goalAssessments.filter((g) => g.status === 'AT_RISK' || g.status === 'OVERDUE'),
  });

  // 5. Executable Next Best Action
  const rankedActions = generateRankedCandidateActions(context);
  const nextBestAction = await resolveExecutableNextBestAction(userId, rankedActions);

  // 6. Live Metrics Object for Snapshotting
  const liveSnapshotMetrics = {
    careerReadiness,
    executionScore,
    completionRate,
    consistencyScore,
    skillCoverage: context.skillGap?.coveragePercentage ?? null,
    portfolioQuality: context.projects?.totalProjects > 0 ? 75 : null,
    resumeReadiness: context.resume?.status === 'completed' ? context.resume.atsScore : null,
    applicationActivity: context.applications?.total ?? 0,
    dsaProgress: context.dsa?.totalSolved ?? 0,
    careerMomentum: careerIntelligence?.momentumScore ?? 0,
    biggestGap: careerIntelligence?.biggestWeakness?.title || '',
    biggestRisk: risks[0]?.title || '',
    nextBestAction: nextBestAction?.title || '',
  };

  // 7. Trends & Snapshot Management
  const trends = await getOrRecordCommandCenterSnapshot(userId, liveSnapshotMetrics, forceRefresh);

  // 8. Career Momentum
  const momentum = {
    value: trends.overallDelta !== undefined ? trends.overallDelta : null,
    status: trends.status,
    explanation: trends.explanation,
    momentumScore: careerIntelligence?.momentumScore ?? null,
  };

  // 9. Recent Achievements
  const achievements = aggregateRecentAchievements({ context, executionAnalytics });

  // 10. Overview Card Data
  const overview = {
    careerReadiness,
    executionScore,
    careerMomentum: momentum.value,
    completionRate,
    consistencyScore,
    targetRole: context.careerGoal?.targetRole || null,
    studentName: context.profile?.name || 'Student',
    adaptiveMode: adaptiveSnapshot?.mode || 'NORMAL',
    adaptiveHours: adaptiveSnapshot?.recommendedHours ?? 10,
    adaptiveConfidence: adaptiveSnapshot?.confidence ?? 50,
    careerStage: outcomeData?.careerStage || 'INSUFFICIENT_DATA',
    trajectoryStatus: outcomeData?.trajectoryStatus || 'INSUFFICIENT_DATA',
    trajectoryDelta: outcomeData?.trajectoryDelta ?? 0,
  };

  // 11. Application & Portfolio Pulse
  const applications = {
    total: context.applications?.total ?? 0,
    active: context.applications?.activeCount ?? 0,
    submitted: (context.applications?.total ?? 0) - (context.applications?.activeCount ?? 0),
    interviews: (context.applications?.upcomingInterviews || []).length,
    offers: (context.applications?.list || []).filter((a) => a.status === 'OFFER').length,
    responseRate: context.applications?.responseRate ?? 0,
  };

  const portfolio = {
    totalProjects: context.projects?.totalProjects ?? 0,
    completed: (context.projects?.list || []).filter((p) => p.status === 'COMPLETED').length,
    deployed: (context.projects?.list || []).filter((p) => p.hasLiveUrl).length,
    hasGithub: context.github?.isConnected ?? false,
    githubRepos: context.github?.publicRepos ?? 0,
  };

  // 12. Biggest Gap
  const biggestGap = {
    area: careerIntelligence?.biggestWeakness?.area || 'Skill Gap',
    title: careerIntelligence?.biggestWeakness?.title || 'Core Requirement Missing',
    reason: careerIntelligence?.biggestWeakness?.reason || 'Evaluate role baseline competencies.',
    fixAction: careerIntelligence?.biggestWeakness?.fixAction || {
      label: 'Inspect Skill Gap',
      route: '/student/skill-gap',
    },
  };

  return {
    overview,
    currentState,
    momentum,
    nextBestAction,
    weeklyStrategy: {
      weekLabel: weeklyStrategy.weekLabel,
      totalHours: weeklyStrategy.totalEstimatedHours,
      budget: weeklyStrategy.timeBudgetDistribution,
      objectives: weeklyStrategy.objectives,
    },
    today: {
      plannedTasks: todayExecution.plannedTasks,
      completedTasks: todayExecution.completedTasks,
      remainingTasks: todayExecution.remainingTasks,
      plannedMinutes: todayExecution.plannedMinutes,
      completedMinutes: todayExecution.completedMinutes,
      completionRate: todayExecution.completionRate,
      tasks: todayExecution.tasks || [],
    },
    risks,
    goals: goalAssessments.slice(0, 4),
    pillars,
    trends,
    achievements,
    applications,
    portfolio,
    biggestGap,
    recommendations: rankedActions.slice(1, 4),
    reminders: context.reminders || {
      total: 0,
      pendingCount: 0,
      overdueCount: 0,
      dueTodayCount: 0,
      overdueList: [],
      highPriority: [],
    },
    adaptive: {
      mode: adaptiveSnapshot?.mode || 'NORMAL',
      modeReason: adaptiveSnapshot?.modeReason || 'Balanced execution cadence.',
      focusArea: adaptiveSnapshot?.focusArea || 'Balanced Career Acceleration',
      recommendedHours: adaptiveSnapshot?.recommendedHours ?? 10,
      confidence: adaptiveSnapshot?.confidence ?? 50,
      planPreference: adaptiveSnapshot?.planPreference || 'ADAPTIVE',
      isPaused: adaptiveSnapshot?.isPaused || false,
      frictionCount: (adaptiveSnapshot?.frictionSummary || []).length,
    },
    trajectory: {
      careerStage: outcomeData?.careerStage || 'INSUFFICIENT_DATA',
      careerStageLabel: outcomeData?.careerStageLabel || 'Stage Pending',
      trajectoryStatus: outcomeData?.trajectoryStatus || 'INSUFFICIENT_DATA',
      trajectoryDelta: outcomeData?.trajectoryDelta ?? 0,
      bottleneck: outcomeData?.bottleneck || null,
      nextMilestone: outcomeData?.nextMilestone || null,
      outcomeSignal: outcomeData?.outcomeSignal || null,
    },
    projectsList: (context.projects?.list || []).slice(0, 6),
    skillsList: (context.skills?.list || []).slice(0, 12),
    proof: {
      profileCompletion: context.profile?.profileCompletion ?? 0,
      resumeAts: context.resume?.status === 'completed' ? context.resume.atsScore : null,
      resumeStatus: context.resume?.status || 'NOT_UPLOADED',
      githubConnected: context.github?.isConnected ?? false,
      githubUsername: context.github?.username || null,
      githubRepos: context.github?.publicRepos ?? 0,
      githubStars: context.github?.totalStars ?? 0,
      githubLanguages: context.github?.topLanguages || [],
      dsaConnected: context.dsa?.isConnected ?? false,
      dsaUsername: context.dsa?.leetcodeUsername || null,
      dsaSolved: context.dsa?.totalSolved ?? 0,
      dsaStreak: context.dsa?.currentStreak ?? 0,
      roadmapProgress: context.roadmap?.progress ?? 0,
      roadmapCompleted: context.roadmap?.completedCount ?? 0,
      roadmapTotal: context.roadmap?.totalTasks ?? 0,
    },
    skillCoverage: context.skillGap?.coveragePercentage ?? null,
    coveredSkills: context.skillGap?.coveredSkills || [],
    missingSkills: context.skillGap?.missingSkills || [],
    readinessBreakdown: context.analytics?.careerScoreBreakdown || null,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  determineCurrentState,
  calculateCareerPillars,
  detectCareerRisks,
  resolveExecutableNextBestAction,
  getOrRecordCommandCenterSnapshot,
  aggregateRecentAchievements,
  getCommandCenterData,
};
