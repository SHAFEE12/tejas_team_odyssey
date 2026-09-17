/**
 * careerIntelligence.service.js
 *
 * Career Intelligence Engine for Career Odyssey.
 * Higher-level orchestration layer that consumes existing module data to answer:
 * "What matters most right now?"
 *
 * CORE CAPABILITIES:
 * 1. Multi-factor Career Priority Scoring (Impact, Urgency, Readiness, Dependency, Effort)
 * 2. Career Leverage Analysis (Multi-module downstream benefit)
 * 3. Biggest Career Gap / Weakness Identification
 * 4. Next Best Action (Primary + 4 Secondary)
 * 5. Authentic Historical Trend & Change Detection (No fabricated charts)
 * 6. "Stop Doing" Engine (Constructive "Temporarily deprioritize..." guidance)
 * 7. Application Strategy & Readiness Decision
 */

const CareerIntelligenceSnapshot = require('../models/CareerIntelligenceSnapshot');
const { buildCopilotContext } = require('./copilotContext.service');

/* ─── Helpers ───────────────────────────────────────────────────── */

function clamp(val, min = 0, max = 100) {
  if (typeof val !== 'number' || isNaN(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val)));
}

/**
 * Computes deterministic multi-factor priority score (0–100)
 */
function calculatePriorityScore({
  impact = 50,
  urgency = 20,
  readiness = 50,
  dependency = 30,
  effortEfficiency = 50,
}) {
  const score =
    impact * 0.35 +
    urgency * 0.25 +
    readiness * 0.15 +
    dependency * 0.15 +
    effortEfficiency * 0.10;
  return clamp(score);
}

/**
 * Evaluates urgency based on actual stored dates (No fabricated deadlines)
 */
function calculateUrgencyFromDate(date) {
  if (!date) return 20; // Default baseline urgency when no deadline exists
  const now = Date.now();
  const diffHours = (new Date(date).getTime() - now) / (1000 * 60 * 60);

  if (diffHours < 0) return 100; // Overdue
  if (diffHours <= 24) return 100; // URGENT (within 24h)
  if (diffHours <= 72) return 80;  // HIGH (within 72h)
  if (diffHours <= 168) return 50; // MEDIUM (within 7 days)
  return 20; // LOW (> 7 days)
}

/**
 * Calculates Career Leverage: How many platform modules benefit from one action
 */
function calculateCareerLeverage(skillOrActionName, context) {
  const name = String(skillOrActionName || '').toLowerCase();
  const affectedModules = [];
  let score = 30;

  // 1. Skill Gap Benefit
  const isMissingSkill = context.skillGap?.missingSkills?.some((s) =>
    s.toLowerCase().includes(name)
  );
  if (isMissingSkill) {
    affectedModules.push('Skill Gap');
    score += 20;
  }

  // 2. Resume ATS Benefit
  const isMissingResume = context.resume?.missingSkills?.some((s) =>
    s.toLowerCase().includes(name)
  );
  if (isMissingResume) {
    affectedModules.push('Resume');
    score += 15;
  }

  // 3. Project Alignment
  const matchesProject = context.projects?.list?.some((p) =>
    (p.techStack || []).some((t) => t.toLowerCase().includes(name))
  );
  if (matchesProject) {
    affectedModules.push('Projects');
    score += 15;
  }

  // 4. Roadmap Prerequisite
  const isRoadmapTask = context.roadmap?.activeTasks?.some((t) =>
    (t.relatedSkill || '').toLowerCase().includes(name) ||
    (t.title || '').toLowerCase().includes(name)
  );
  if (isRoadmapTask) {
    affectedModules.push('Roadmap');
    score += 10;
  }

  // 5. Opportunities Match
  const matchesOpportunity = context.opportunities?.topRelevant?.some((o) =>
    (o.requiredSkills || []).some((s) => s.toLowerCase().includes(name))
  );
  if (matchesOpportunity) {
    affectedModules.push('Opportunities');
    score += 10;
  }

  return {
    leverageScore: clamp(score),
    affectedModules: affectedModules.length > 0 ? affectedModules : ['Skill Development'],
    reason: `Strengthening ${skillOrActionName} positively impacts ${affectedModules.length > 0 ? affectedModules.join(', ') : 'overall technical depth'}.`,
  };
}

/**
 * Gathers and scores candidate actions to determine highest-impact priorities
 */
function generateRankedCandidateActions(context) {
  const actions = [];
  const targetRole = context.careerGoal?.targetRole || 'Software Engineer';

  // 1. Overdue Reminders
  if (context.reminders?.overdueCount > 0) {
    actions.push({
      title: 'Resolve Overdue Career Reminders',
      reason: `You have ${context.reminders.overdueCount} reminder(s) that passed their due date.`,
      impact: 85,
      urgency: 100,
      readiness: 95,
      dependency: 40,
      effortEfficiency: 90,
      estimatedMinutes: 20,
      module: 'Reminders',
      actionType: 'OPEN_REMINDERS',
      relatedEntityType: 'Reminder',
      leverage: { leverageScore: 70, affectedModules: ['Reminders', 'Daily Planner'] },
    });
  }

  // 2. Upcoming Application Deadlines
  if (context.applications?.upcomingDeadlines?.length > 0) {
    const nextApp = context.applications.upcomingDeadlines[0];
    const urg = calculateUrgencyFromDate(nextApp.deadline);
    actions.push({
      title: `Complete Application: ${nextApp.company}`,
      reason: `Impending application deadline on ${new Date(nextApp.deadline).toLocaleDateString()} for ${nextApp.role}.`,
      impact: 90,
      urgency: urg,
      readiness: 85,
      dependency: 30,
      effortEfficiency: 80,
      estimatedMinutes: 45,
      module: 'Applications',
      actionType: 'OPEN_APPLICATIONS',
      relatedEntityType: 'Application',
      relatedEntityId: nextApp.id,
      leverage: { leverageScore: 75, affectedModules: ['Applications', 'Career Health'] },
    });
  }

  // 3. Upcoming Interviews
  if (context.applications?.upcomingInterviews?.length > 0) {
    const nextInterview = context.applications.upcomingInterviews[0];
    const urg = calculateUrgencyFromDate(nextInterview.interviewDate);
    actions.push({
      title: `Prepare for ${nextInterview.company} Interview`,
      reason: `Scheduled interview on ${new Date(nextInterview.interviewDate).toLocaleDateString()}. Focus on STAR behavioral stories and architecture.`,
      impact: 95,
      urgency: urg,
      readiness: 80,
      dependency: 60,
      effortEfficiency: 85,
      estimatedMinutes: 60,
      module: 'Applications',
      actionType: 'OPEN_APPLICATIONS',
      relatedEntityType: 'Application',
      relatedEntityId: nextInterview.id,
      leverage: { leverageScore: 90, affectedModules: ['Applications', 'Interview Readiness'] },
    });
  }

  // 4. Missing Resume Analysis
  if (!context.resume?.available || context.resume.status !== 'completed') {
    actions.push({
      title: 'Upload and Analyze Your Resume',
      reason: 'Missing resume analysis prevents verified ATS role alignment scoring.',
      impact: 85,
      urgency: 70,
      readiness: 90,
      dependency: 80,
      effortEfficiency: 85,
      estimatedMinutes: 25,
      module: 'Resume',
      actionType: 'OPEN_RESUME',
      relatedEntityType: 'Resume',
      leverage: { leverageScore: 85, affectedModules: ['Resume', 'Career Health', 'Skill Gap'] },
    });
  }

  // 5. Core Skill Gap
  const priorityGaps = context.skillGap?.priorityGaps || [];
  if (priorityGaps.length > 0) {
    const topGap = priorityGaps[0];
    const gapName = topGap.name || topGap;
    const lev = calculateCareerLeverage(gapName, context);
    actions.push({
      title: `Bridge Core Skill Gap: ${gapName}`,
      reason: `${gapName} is a high-priority baseline requirement for ${targetRole}.`,
      impact: 90,
      urgency: 50,
      readiness: 75,
      dependency: 85,
      effortEfficiency: 70,
      estimatedMinutes: 45,
      module: 'Skill Gap',
      actionType: 'OPEN_SKILL_GAP',
      relatedEntityType: 'Skill',
      leverage: lev,
    });
  }

  // 6. Active Roadmap Milestone
  if (context.roadmap?.activeTasks?.length > 0) {
    const topTask = context.roadmap.activeTasks[0];
    actions.push({
      title: `Complete Roadmap: ${topTask.title}`,
      reason: `Active Phase ${topTask.phase} milestone advancing your core learning path.`,
      impact: 80,
      urgency: 45,
      readiness: 85,
      dependency: 75,
      effortEfficiency: 75,
      estimatedMinutes: 50,
      module: 'Roadmap',
      actionType: 'OPEN_ROADMAP',
      relatedEntityType: 'RoadmapTask',
      relatedEntityId: topTask.id,
      leverage: { leverageScore: 80, affectedModules: ['Roadmap', 'Skill Depth'] },
    });
  }

  // 7. Unverified Project Proof
  const unverifiedProject = context.projects?.list?.find((p) => !p.hasGithub || !p.hasLiveUrl);
  if (unverifiedProject) {
    actions.push({
      title: `Add Verifiable Links to ${unverifiedProject.title}`,
      reason: `Project is missing ${!unverifiedProject.hasGithub ? 'GitHub repository' : 'live deployment'} proof for recruiters.`,
      impact: 75,
      urgency: 40,
      readiness: 90,
      dependency: 50,
      effortEfficiency: 85,
      estimatedMinutes: 30,
      module: 'Projects',
      actionType: 'OPEN_PROJECTS',
      relatedEntityType: 'Project',
      relatedEntityId: unverifiedProject.id,
      leverage: { leverageScore: 75, affectedModules: ['Projects', 'GitHub Evidence'] },
    });
  }

  // 8. LeetCode / DSA Practice
  if (!context.dsa?.isConnected) {
    actions.push({
      title: 'Connect LeetCode Profile',
      reason: 'Sync public problem solves and streak metrics to demonstrate technical depth.',
      impact: 70,
      urgency: 35,
      readiness: 95,
      dependency: 40,
      effortEfficiency: 90,
      estimatedMinutes: 15,
      module: 'DSA',
      actionType: 'OPEN_DSA',
      relatedEntityType: 'DSAProfile',
      leverage: { leverageScore: 65, affectedModules: ['DSA', 'Technical Evidence'] },
    });
  } else if ((context.dsa?.totalSolved || 0) < 50) {
    actions.push({
      title: 'Solve 3 DSA Problems Today',
      reason: 'Build consistent problem-solving momentum towards your 150-problem benchmark.',
      impact: 65,
      urgency: 30,
      readiness: 85,
      dependency: 45,
      effortEfficiency: 70,
      estimatedMinutes: 45,
      module: 'DSA',
      actionType: 'OPEN_DSA',
      relatedEntityType: 'DSAProfile',
      leverage: { leverageScore: 60, affectedModules: ['DSA', 'Interview Readiness'] },
    });
  }

  // Adaptive planning adjustment based on execution OS feedback
  const skippedPatterns = context.execution?.skippedPatterns || [];

  // Compute final priorityScore for each candidate action
  for (const act of actions) {
    const matchingSkip = skippedPatterns.find((p) => {
      if (p.category === 'DSA' && (act.module === 'DSA' || act.actionType === 'OPEN_DSA')) return true;
      if (p.category === 'SKILL' && (act.module === 'Skill Gap' || act.actionType === 'OPEN_SKILL_GAP')) return true;
      if (p.category === 'PROJECT' && (act.module === 'Projects' || act.actionType === 'OPEN_PROJECTS')) return true;
      if (p.category === 'RESUME' && (act.module === 'Resume' || act.actionType === 'OPEN_RESUME')) return true;
      return false;
    });

    if (matchingSkip) {
      act.estimatedMinutes = Math.min(act.estimatedMinutes || 45, 30);
      act.reason += ` (Execution note: ${matchingSkip.category} tasks faced friction. Scope downsized to ${act.estimatedMinutes}m milestone).`;
    }

    act.priorityScore = calculatePriorityScore({
      impact: act.impact,
      urgency: act.urgency,
      readiness: act.readiness,
      dependency: act.dependency,
      effortEfficiency: act.effortEfficiency,
    });
    act.priority =
      act.priorityScore >= 80 ? 'URGENT' : act.priorityScore >= 65 ? 'HIGH' : act.priorityScore >= 45 ? 'MEDIUM' : 'LOW';
  }

  // Sort descending by priorityScore
  actions.sort((a, b) => b.priorityScore - a.priorityScore);

  return actions;
}

/**
 * Identifies the student's single biggest career gap
 */
function identifyBiggestWeakness(context) {
  const targetRole = context.careerGoal?.targetRole || 'target role';

  // Check 1: No Resume Uploaded
  if (!context.resume?.available || context.resume.status !== 'completed') {
    return {
      area: 'Resume Analysis',
      title: 'Missing Resume ATS Analysis',
      reason: 'Your resume has not been uploaded or analyzed, preventing verified skill extraction and ATS alignment.',
      impact: 'HIGH',
      fixAction: { label: 'Upload Resume', route: '/student/resume' },
    };
  }

  // Check 2: Core Required Skill Missing
  const priorityGaps = context.skillGap?.priorityGaps || [];
  if (priorityGaps.length > 0) {
    const topGap = priorityGaps[0].name || priorityGaps[0];
    return {
      area: 'Skill Gap',
      title: `Missing Core Skill: ${topGap}`,
      reason: `${topGap} is a foundational requirement for ${targetRole} and currently missing from your verified profile.`,
      impact: 'HIGH',
      fixAction: { label: 'Inspect Skill Gap', route: '/student/skill-gap' },
    };
  }

  // Check 3: Missing Project Verification
  if (context.projects?.totalProjects === 0) {
    return {
      area: 'Portfolio Projects',
      title: 'Zero Portfolio Projects',
      reason: `Employers require working code examples. You currently have 0 projects registered for ${targetRole}.`,
      impact: 'HIGH',
      fixAction: { label: 'Start a Project', route: '/student/projects' },
    };
  }

  // Check 4: Unconnected GitHub
  if (!context.github?.isConnected) {
    return {
      area: 'GitHub Evidence',
      title: 'Unconnected GitHub Profile',
      reason: 'Public commit activity and code repository proof are missing from your career profile.',
      impact: 'MEDIUM',
      fixAction: { label: 'Connect GitHub', route: '/student/github' },
    };
  }

  // Check 5: Low DSA Count
  if (!context.dsa?.isConnected || (context.dsa?.totalSolved || 0) < 30) {
    return {
      area: 'DSA & Algorithms',
      title: 'Limited DSA Problem Depth',
      reason: 'Technical screening rounds require continuous problem-solving practice and proven algorithmic depth.',
      impact: 'MEDIUM',
      fixAction: { label: 'Open DSA Tracker', route: '/student/dsa' },
    };
  }

  return {
    area: 'Career Polish',
    title: 'Maintain Project & Application Momentum',
    reason: 'Your core foundational modules are strong. Focus on application volume and mock interview preparation.',
    impact: 'LOW',
    fixAction: { label: 'Explore Opportunities', route: '/student/opportunities' },
  };
}

/**
 * "Stop Doing" Engine: Empathetic, actionable guidance on what to temporarily deprioritize
 */
function generateStopDoingRecommendations(context) {
  const recommendations = [];

  // Anti-Pattern 1: High project count but many unverified / incomplete
  if (context.projects?.totalProjects >= 3 && context.projects?.withLiveUrl === 0) {
    recommendations.push({
      title: 'Temporarily deprioritize starting new project blueprints',
      reason: 'You have multiple projects started, but none have live deployments. Recruiters prioritize 1 working, deployed app over 4 local drafts.',
      actionablePivot: 'Deploy your most advanced project to Vercel/Render before starting another.',
    });
  }

  // Anti-Pattern 2: Mass applications without a verified resume
  if (
    context.applications?.total >= 5 &&
    (!context.resume?.available || (context.resume?.atsScore || 0) < 60)
  ) {
    recommendations.push({
      title: 'Temporarily pause sending high-volume applications',
      reason: 'Applying with an unoptimized resume lowers your response rate and burns candidate goodwill at target companies.',
      actionablePivot: 'Revise and re-analyze your resume until ATS score exceeds 75% before submitting new applications.',
    });
  }

  // Anti-Pattern 3: DSA hyper-focus while core role skill gap remains wide
  if (
    (context.dsa?.totalSolved || 0) >= 100 &&
    (context.skillGap?.missingSkills || []).length >= 3
  ) {
    recommendations.push({
      title: 'Temporarily balance DSA practice with role-specific skills',
      reason: 'High LeetCode solve counts will not compensate for missing mandatory framework skills during portfolio screens.',
      actionablePivot: 'Allocate 60% of technical study this week to closing your core framework gaps.',
    });
  }

  // Default balanced feedback
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Temporarily deprioritize cosmetic profile tweaks',
      reason: 'Your profile fundamentals are in good order. Your highest return on investment comes from concrete roadmap tasks and verified project commits.',
      actionablePivot: 'Focus strictly on your top 2 weekly strategy objectives.',
    });
  }

  return recommendations;
}

/**
 * Evaluates application pipeline & opportunity readiness
 */
function evaluateApplicationStrategy(context) {
  const readinessScore = context.analytics?.careerReadinessScore;
  const missingCount = context.skillGap?.missingSkills?.length || 0;
  const hasResume = Boolean(context.resume?.available && context.resume.status === 'completed');

  let readinessDecision = 'INSUFFICIENT_DATA';
  let reason = '';

  if (readinessScore === null) {
    readinessDecision = 'INSUFFICIENT_DATA';
    reason = 'Complete your career goal, skills, and resume to evaluate job application readiness.';
  } else if (readinessScore >= 70 && hasResume && missingCount <= 1) {
    readinessDecision = 'READY';
    reason = 'Your profile, skills, and verified resume match current junior/mid market standards. You are ready to apply actively.';
  } else if (readinessScore >= 50 && hasResume) {
    readinessDecision = 'NEARLY_READY';
    reason = 'You have strong fundamentals, but addressing 1 or 2 core skill gaps will noticeably improve interview callback rates.';
  } else {
    readinessDecision = 'NOT_READY';
    reason = 'Strengthen your core skill gaps and portfolio evidence before applying to avoid low response rates.';
  }

  // Classify sample opportunities if available
  const sampleOpportunities = (context.opportunities?.topRelevant || []).map((opp) => {
    let classification = 'PREPARE_THEN_APPLY';
    if (readinessDecision === 'READY') classification = 'APPLY_NOW';
    else if (readinessDecision === 'NOT_READY') classification = 'LOW_PRIORITY';

    return {
      id: opp.id,
      title: opp.title,
      company: opp.company,
      type: opp.type,
      classification,
      requiredSkills: opp.requiredSkills,
    };
  });

  return {
    readinessDecision,
    reason,
    activeApplications: context.applications?.active || 0,
    upcomingDeadlines: context.applications?.upcomingDeadlines || [],
    opportunities: sampleOpportunities,
  };
}

/**
 * Manages authentic snapshot history and trend detection without fake charts
 */
async function getOrRecordIntelligenceSnapshot(userId, currentMetrics, forceRefresh = false) {
  try {
    const snapshots = await CareerIntelligenceSnapshot.find({ user: userId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();

    if (snapshots.length === 0) {
      const first = await CareerIntelligenceSnapshot.create({
        user: userId,
        recordedAt: now,
        careerHealth: currentMetrics.careerHealth,
        careerReadiness: currentMetrics.careerReadiness,
        skillCoverage: currentMetrics.skillCoverage,
        roadmapProgress: currentMetrics.roadmapProgress,
        resumeScore: currentMetrics.resumeScore,
        projectQuality: currentMetrics.projectQuality,
        dsaTotal: currentMetrics.dsaTotal,
        applicationCount: currentMetrics.applicationCount,
        dailyPlanCompletion: currentMetrics.dailyPlanCompletion,
      });

      return {
        hasHistory: false,
        trendStatus: 'INSUFFICIENT_DATA',
        changes: null,
        snapshots: [first.toObject ? first.toObject() : first],
      };
    }

    const latest = snapshots[0];
    const hoursSince = (now.getTime() - new Date(latest.recordedAt).getTime()) / (1000 * 60 * 60);

    // Save snapshot if forceRefresh is true or 24h have passed
    if (forceRefresh || hoursSince >= 24) {
      const created = await CareerIntelligenceSnapshot.create({
        user: userId,
        recordedAt: now,
        careerHealth: currentMetrics.careerHealth,
        careerReadiness: currentMetrics.careerReadiness,
        skillCoverage: currentMetrics.skillCoverage,
        roadmapProgress: currentMetrics.roadmapProgress,
        resumeScore: currentMetrics.resumeScore,
        projectQuality: currentMetrics.projectQuality,
        dsaTotal: currentMetrics.dsaTotal,
        applicationCount: currentMetrics.applicationCount,
        dailyPlanCompletion: currentMetrics.dailyPlanCompletion,
      });
      snapshots.unshift(created.toObject ? created.toObject() : created);
    }

    if (snapshots.length < 2) {
      return {
        hasHistory: false,
        trendStatus: 'INSUFFICIENT_DATA',
        changes: null,
        snapshots,
      };
    }

    const curr = snapshots[0];
    const prev = snapshots[1];

    const healthDiff = (curr.careerHealth ?? 0) - (prev.careerHealth ?? 0);
    const readinessDiff = (curr.careerReadiness ?? 0) - (prev.careerReadiness ?? 0);
    const coverageDiff = (curr.skillCoverage ?? 0) - (prev.skillCoverage ?? 0);
    const roadmapDiff = (curr.roadmapProgress ?? 0) - (prev.roadmapProgress ?? 0);
    const dsaDiff = (curr.dsaTotal ?? 0) - (prev.dsaTotal ?? 0);
    const appDiff = (curr.applicationCount ?? 0) - (prev.applicationCount ?? 0);

    const changes = {
      careerHealth: { from: prev.careerHealth, to: curr.careerHealth, diff: healthDiff },
      careerReadiness: { from: prev.careerReadiness, to: curr.careerReadiness, diff: readinessDiff },
      skillCoverage: { from: prev.skillCoverage, to: curr.skillCoverage, diff: coverageDiff },
      roadmapProgress: { from: prev.roadmapProgress, to: curr.roadmapProgress, diff: roadmapDiff },
      dsaTotal: { from: prev.dsaTotal, to: curr.dsaTotal, diff: dsaDiff },
      applicationCount: { from: prev.applicationCount, to: curr.applicationCount, diff: appDiff },
    };

    let trendStatus = 'STABLE';
    if (healthDiff > 2 || readinessDiff > 2 || coverageDiff > 2) {
      trendStatus = 'IMPROVING';
    } else if (healthDiff < -2 || readinessDiff < -2) {
      trendStatus = 'DECLINING';
    }

    return {
      hasHistory: true,
      trendStatus,
      changes,
      snapshots,
    };
  } catch (err) {
    console.error('[CareerIntelligenceService] Snapshot error:', err.message);
    return {
      hasHistory: false,
      trendStatus: 'INSUFFICIENT_DATA',
      changes: null,
      snapshots: [],
    };
  }
}

/**
 * Main Career Intelligence Evaluation Pipeline
 */
async function generateCareerIntelligence(userId, options = {}) {
  // 1. Gather comprehensive student context (reuse existing Copilot context builder)
  const context = await buildCopilotContext(userId);

  // 2. Rank candidate actions via deterministic priority scoring
  const candidateActions = generateRankedCandidateActions(context);

  const nextBestAction = candidateActions[0] || {
    title: 'Define your target career role',
    reason: 'Setting a clear target career role enables targeted skill and roadmap recommendations.',
    priority: 'HIGH',
    priorityScore: 85,
    impact: 90,
    estimatedMinutes: 15,
    module: 'Career Goal',
    actionType: 'OPEN_CAREER_GOAL',
  };

  const secondaryActions = candidateActions.slice(1, 5);

  // 3. Identify biggest career weakness
  const biggestWeakness = identifyBiggestWeakness(context);

  // 4. "Stop Doing" Engine
  const stopDoing = generateStopDoingRecommendations(context);

  // 5. Application Strategy & Readiness
  const applicationStrategy = evaluateApplicationStrategy(context);

  // 6. High Career Leverage Actions
  const leverageActions = candidateActions
    .filter((a) => a.leverage && a.leverage.leverageScore >= 65)
    .slice(0, 3)
    .map((a) => ({
      title: a.title,
      leverageScore: a.leverage.leverageScore,
      affectedModules: a.leverage.affectedModules,
      reason: a.leverage.reason,
      priority: a.priority,
      actionType: a.actionType,
    }));

  // 7. Snapshots & Authentic Trend Detection
  const currentMetrics = {
    careerHealth: context.analytics?.careerHealthScore ?? null,
    careerReadiness: context.analytics?.careerReadinessScore ?? null,
    skillCoverage: context.skillGap?.coveragePercentage ?? null,
    roadmapProgress: context.roadmap?.progress ?? null,
    resumeScore: context.resume?.overallScore ?? null,
    projectQuality: context.projects?.totalProjects > 0 ? 75 : null,
    dsaTotal: context.dsa?.totalSolved ?? 0,
    applicationCount: context.applications?.total ?? 0,
    dailyPlanCompletion: context.dailyPlan?.progressPercentage ?? 0,
  };

  const trendData = await getOrRecordIntelligenceSnapshot(
    userId,
    currentMetrics,
    options.forceRefresh || false
  );

  // 8. Overall Career Status & Momentum
  const health = currentMetrics.careerHealth || 0;
  const readiness = currentMetrics.careerReadiness || 0;
  const momentumScore = clamp(Math.round(health * 0.5 + readiness * 0.5));
  let overallStatus = 'GETTING_STARTED';

  if (momentumScore >= 75) overallStatus = 'ACCELERATING';
  else if (momentumScore >= 60) overallStatus = 'BUILDING_MOMENTUM';
  else if (momentumScore >= 45) overallStatus = 'STABLE';
  else if (momentumScore > 0) overallStatus = 'NEEDS_ATTENTION';

  return {
    overallStatus,
    momentumScore,
    currentMetrics,
    biggestWeakness,
    nextBestAction,
    secondaryActions,
    stopDoing,
    applicationStrategy,
    leverageActions,
    execution: context.execution || null,
    trends: {
      status: trendData.trendStatus,
      hasHistory: trendData.hasHistory,
      changes: trendData.changes,
      historyCount: trendData.snapshots.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  clamp,
  calculatePriorityScore,
  calculateUrgencyFromDate,
  calculateCareerLeverage,
  generateRankedCandidateActions,
  identifyBiggestWeakness,
  generateStopDoingRecommendations,
  evaluateApplicationStrategy,
  getOrRecordIntelligenceSnapshot,
  generateCareerIntelligence,
};
