/**
 * analytics.service.js
 *
 * Comprehensive Analytics & Career Operating System engine.
 *
 * Deterministic calculations combining:
 * - Applications (funnel, response rate, interview rate, offer rate)
 * - Career Readiness Score & authentic history snapshots
 * - Skill Gap Analysis & recurring gaps from tracked opportunities
 * - Roadmap progress (backend-authoritative)
 * - Project portfolio quality & verification metrics
 * - DSA / LeetCode sync & problem-solving metrics
 * - GitHub activity & repository metrics
 * - Resume analysis status & ATS alignment
 * - Career Health Score (0–100, normalized available-data model)
 * - Next Best Actions (actionable, deterministic, user-specific)
 * - Weekly activity tracking (timestamp-verified)
 *
 * NO AI, NO fake historical data, NO fabricated activity.
 */

const CareerScoreSnapshot = require('../models/CareerScoreSnapshot');

/* ─── Metric Definitions & Helpers ─────────────────────────────── */

function clamp(val, min = 0, max = 100) {
  if (typeof val !== 'number' || isNaN(val)) return min;
  return Math.min(max, Math.max(min, Math.round(val)));
}

/**
 * Checks if an application was submitted (moved past SAVED/PLANNING)
 */
function isSubmittedApplication(app) {
  const submittedStatuses = ['APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER'];
  if (submittedStatuses.includes(app.status)) return true;
  if (['REJECTED', 'WITHDRAWN'].includes(app.status) && app.appliedAt) return true;
  return false;
}

/**
 * Computes transparent, deterministic application metrics
 */
function calculateApplicationMetrics(applications = []) {
  const totalTracked = applications.length;

  const counts = {
    SAVED: 0,
    PLANNING: 0,
    APPLIED: 0,
    OA: 0,
    INTERVIEW: 0,
    FINAL_ROUND: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };

  for (const app of applications) {
    if (counts[app.status] !== undefined) {
      counts[app.status] += 1;
    }
  }

  // Active applications: currently in flight (not terminal REJECTED, WITHDRAWN, or OFFER, and not just SAVED)
  const activeStatuses = ['PLANNING', 'APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND'];
  const activeApplications = applications.filter((a) => activeStatuses.includes(a.status)).length;

  // Submitted applications: reached APPLIED stage or beyond
  const submittedApps = applications.filter(isSubmittedApplication);
  const submittedCount = submittedApps.length;

  // Response: reached OA, Interview, Final Round, Offer, or explicit Rejected after applying
  const responseCount = submittedApps.filter((a) =>
    ['OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED'].includes(a.status)
  ).length;

  // Interview: reached Interview, Final Round, or Offer
  const interviewCount = submittedApps.filter((a) =>
    ['INTERVIEW', 'FINAL_ROUND', 'OFFER'].includes(a.status)
  ).length;

  // Offer: reached Offer
  const offerCount = counts.OFFER;

  const responseRate = submittedCount > 0 ? clamp((responseCount / submittedCount) * 100) : 0;
  const interviewRate = submittedCount > 0 ? clamp((interviewCount / submittedCount) * 100) : 0;
  const offerRate = submittedCount > 0 ? clamp((offerCount / submittedCount) * 100) : 0;

  // Application Funnel (Strict progression counts)
  const funnel = {
    tracked: totalTracked,
    applied: submittedCount,
    oa: applications.filter((a) => ['OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER'].includes(a.status)).length,
    interview: applications.filter((a) => ['INTERVIEW', 'FINAL_ROUND', 'OFFER'].includes(a.status)).length,
    finalRound: applications.filter((a) => ['FINAL_ROUND', 'OFFER'].includes(a.status)).length,
    offer: offerCount,
  };

  return {
    totalTracked,
    saved: counts.SAVED,
    planning: counts.PLANNING,
    applied: counts.APPLIED,
    oa: counts.OA,
    interviews: counts.INTERVIEW,
    finalRounds: counts.FINAL_ROUND,
    offers: counts.OFFER,
    rejected: counts.REJECTED,
    withdrawn: counts.WITHDRAWN,
    activeApplications,
    applicationsSubmitted: submittedCount,
    responseCount,
    interviewCount,
    responseRate,
    interviewRate,
    offerRate,
    funnel,
    disclaimer: 'Based on your recorded applications. These are personal tracking metrics, NOT industry benchmarks.',
  };
}

/**
 * Analyzes recurring missing skills across the student's tracked opportunities
 */
function calculateRecurringOpportunityGaps(applications = [], studentSkills = []) {
  if (!applications || applications.length === 0) {
    return {
      recurringGaps: [],
      trackedOpportunitiesCount: 0,
      message: 'Save or track opportunities to see recurring skill requirements.',
    };
  }

  const studentSkillNames = new Set(
    (studentSkills || []).map((s) => (typeof s === 'string' ? s : s.name).toLowerCase().trim())
  );

  const gapCounts = {};
  let validOppCount = 0;

  for (const app of applications) {
    const opp = app.opportunity;
    if (!opp || !opp.requiredSkills) continue;
    validOppCount += 1;

    for (const reqSkill of opp.requiredSkills) {
      const norm = reqSkill.toLowerCase().trim();
      // If student lacks this skill in their profile
      if (!studentSkillNames.has(norm)) {
        if (!gapCounts[norm]) {
          gapCounts[norm] = { skill: reqSkill, count: 0 };
        }
        gapCounts[norm].count += 1;
      }
    }
  }

  const recurringGaps = Object.values(gapCounts)
    .map((g) => ({
      skill: g.skill,
      count: g.count,
      percentage: validOppCount > 0 ? clamp((g.count / validOppCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    recurringGaps,
    trackedOpportunitiesCount: validOppCount,
    label: 'Required by your tracked opportunities',
    message: recurringGaps.length === 0
      ? 'Great job! Your current skills cover the required skills in your tracked opportunities.'
      : undefined,
  };
}

/**
 * Evaluates Career Health Score (0–100) using a normalized available-data approach.
 *
 * Formula weights:
 * - 25% Career Readiness
 * - 20% Skill Coverage
 * - 15% Roadmap Progress
 * - 15% Portfolio Quality
 * - 10% Resume Readiness
 * - 10% Application Activity
 * -  5% DSA / Problem Solving
 */
function calculateCareerHealth({
  careerScore = 0,
  skillCoveragePercent = 0,
  roadmapProgress = null,
  portfolioQuality = null,
  resumeScore = null,
  activeApplications = 0,
  totalTracked = 0,
  dsaScore = null,
}) {
  const components = [];

  // 1. Career Readiness (Weight 25)
  components.push({
    name: 'Career Readiness',
    key: 'careerReadiness',
    weight: 25,
    score: clamp(careerScore),
    status: 'AVAILABLE',
  });

  // 2. Skill Coverage (Weight 20)
  components.push({
    name: 'Skill Coverage',
    key: 'skillCoverage',
    weight: 20,
    score: clamp(skillCoveragePercent),
    status: 'AVAILABLE',
  });

  // 3. Roadmap Progress (Weight 15)
  if (roadmapProgress !== null && typeof roadmapProgress === 'number') {
    components.push({
      name: 'Roadmap Progress',
      key: 'roadmapProgress',
      weight: 15,
      score: clamp(roadmapProgress),
      status: 'AVAILABLE',
    });
  } else {
    components.push({
      name: 'Roadmap Progress',
      key: 'roadmapProgress',
      weight: 15,
      score: 0,
      status: 'UNAVAILABLE',
    });
  }

  // 4. Portfolio Quality (Weight 15)
  if (portfolioQuality !== null && typeof portfolioQuality === 'number') {
    components.push({
      name: 'Portfolio Quality',
      key: 'portfolioQuality',
      weight: 15,
      score: clamp(portfolioQuality),
      status: 'AVAILABLE',
    });
  } else {
    components.push({
      name: 'Portfolio Quality',
      key: 'portfolioQuality',
      weight: 15,
      score: 0,
      status: 'UNAVAILABLE',
    });
  }

  // 5. Resume Readiness (Weight 10)
  if (resumeScore !== null && typeof resumeScore === 'number') {
    components.push({
      name: 'Resume Readiness',
      key: 'resumeReadiness',
      weight: 10,
      score: clamp(resumeScore),
      status: 'AVAILABLE',
    });
  } else {
    components.push({
      name: 'Resume Readiness',
      key: 'resumeReadiness',
      weight: 10,
      score: 0,
      status: 'UNAVAILABLE',
    });
  }

  // 6. Application Activity (Weight 10)
  // Scores active involvement: having tracked/active applications
  const appActivityScore = clamp(activeApplications * 25 + totalTracked * 5);
  components.push({
    name: 'Application Activity',
    key: 'applicationActivity',
    weight: 10,
    score: appActivityScore,
    status: 'AVAILABLE',
  });

  // 7. DSA / Problem Solving (Weight 5)
  if (dsaScore !== null && typeof dsaScore === 'number') {
    components.push({
      name: 'DSA & Problem Solving',
      key: 'dsa',
      weight: 5,
      score: clamp(dsaScore),
      status: 'AVAILABLE',
    });
  } else {
    components.push({
      name: 'DSA & Problem Solving',
      key: 'dsa',
      weight: 5,
      score: 0,
      status: 'UNAVAILABLE',
    });
  }

  // Normalization: sum weights of available components
  const availableComponents = components.filter((c) => c.status === 'AVAILABLE');
  const totalAvailableWeight = availableComponents.reduce((sum, c) => sum + c.weight, 0);

  let careerHealthScore = 0;
  if (totalAvailableWeight > 0) {
    const weightedSum = availableComponents.reduce(
      (sum, c) => sum + (c.score * c.weight),
      0
    );
    careerHealthScore = clamp(weightedSum / totalAvailableWeight);
  }

  // Breakdown mapping
  const breakdown = {};
  for (const c of components) {
    breakdown[c.key] = {
      score: c.score,
      weight: c.weight,
      status: c.status,
      contribution: totalAvailableWeight > 0 && c.status === 'AVAILABLE'
        ? Math.round((c.score * c.weight) / totalAvailableWeight)
        : 0,
    };
  }

  return {
    score: careerHealthScore,
    disclaimer: 'Career Health summarizes your current Career Odyssey progress. It does not predict hiring outcomes.',
    breakdown,
  };
}

/**
 * Generates deterministic Next Best Actions based on actual gaps
 */
function generateNextBestActions({
  resume = null,
  recurringGaps = [],
  roadmap = null,
  projects = [],
  dsaProfile = null,
  gitHubProfile = null,
  applications = [],
  careerScore = 0,
}) {
  const actions = [];

  // 1. Check for Upcoming Interviews / OA first (Immediate High Priority)
  const urgentApp = (applications || []).find((a) => ['OA', 'INTERVIEW', 'FINAL_ROUND'].includes(a.status));
  if (urgentApp) {
    const company = urgentApp.opportunity?.company || 'Employer';
    const role = urgentApp.opportunity?.title || 'Target Role';
    actions.push({
      id: 'prepare-interview',
      priority: 'HIGH',
      category: 'APPLICATIONS',
      action: `Prepare for ${company} (${urgentApp.status})`,
      description: `Review required skills and system design blueprints for ${role}.`,
      link: '/student/applications',
    });
  }

  // 2. Resume Gap
  if (!resume || resume.status !== 'completed') {
    actions.push({
      id: 'upload-resume',
      priority: 'HIGH',
      category: 'RESUME',
      action: 'Upload your resume for ATS & Skill verification',
      description: 'Upload your PDF or DOCX resume to verify skill evidence and unlock application readiness.',
      link: '/student/resume',
    });
  }

  // 3. Top Recurring Opportunity Gap
  if (recurringGaps && recurringGaps.length > 0) {
    const topGap = recurringGaps[0];
    actions.push({
      id: `acquire-gap-${topGap.skill.toLowerCase().replace(/\s+/g, '-')}`,
      priority: 'HIGH',
      category: 'SKILLS',
      action: `Acquire skill: ${topGap.skill}`,
      description: `Required by ${topGap.count} of your tracked opportunities. Add it to your skills or portfolio.`,
      link: '/student/skill-gap',
    });
  }

  // 4. In-Progress Roadmap Task
  if (roadmap && roadmap.tasks) {
    const activeTask = roadmap.tasks.find((t) => t.status === 'IN_PROGRESS') ||
      roadmap.tasks.find((t) => t.status === 'NOT_STARTED');
    if (activeTask) {
      actions.push({
        id: `roadmap-${activeTask.taskId}`,
        priority: 'MEDIUM',
        category: 'ROADMAP',
        action: `Advance Roadmap: ${activeTask.title}`,
        description: `Phase ${activeTask.phaseNumber}: ${activeTask.phaseTitle}. Estimated: ${activeTask.estimatedEffort || '3-5 days'}.`,
        link: '/student/roadmap',
      });
    }
  }

  // 5. Project GitHub / Live Deployment evidence
  const unverifiedProject = (projects || []).find(
    (p) => p.status === 'IN_PROGRESS' || (p.status === 'COMPLETED' && (!p.github?.url || !p.deployment?.url))
  );
  if (unverifiedProject) {
    actions.push({
      id: `link-project-${unverifiedProject._id}`,
      priority: 'MEDIUM',
      category: 'PROJECTS',
      action: `Connect repository to "${unverifiedProject.title}"`,
      description: 'Linking public code and live deployments strengthens evidence scoring.',
      link: '/student/projects',
    });
  }

  // 6. DSA LeetCode practice
  const solved = dsaProfile?.leetcodeData?.totalSolved ?? dsaProfile?.totalSolved ?? 0;
  if (!dsaProfile || !dsaProfile.leetcodeConnected || solved < 30) {
    actions.push({
      id: 'practice-dsa',
      priority: 'MEDIUM',
      category: 'DSA',
      action: 'Strengthen problem solving practice',
      description: 'Connect LeetCode profile or log 5 DSA problems to build technical interview confidence.',
      link: '/student/dsa',
    });
  }

  // 7. Track Opportunities if too few
  if (!applications || applications.length < 3) {
    actions.push({
      id: 'track-opportunities',
      priority: 'LOW',
      category: 'OPPORTUNITIES',
      action: 'Track matched job opportunities',
      description: 'Discover curated internship and entry-level positions aligned with your target role.',
      link: '/student/opportunities',
    });
  }

  // Return top 4 most critical actions
  return actions.slice(0, 5);
}

/**
 * Tracks and records genuine score snapshots without fake data
 */
async function getOrRecordScoreHistory(userId, currentScore, breakdown = {}) {
  try {
    // Look up existing snapshots sorted descending by recordedAt
    const snapshots = await CareerScoreSnapshot.find({ user: userId })
      .sort({ recordedAt: -1 })
      .limit(10)
      .lean();

    const now = new Date();

    if (snapshots.length === 0) {
      // Record first authentic snapshot
      const first = await CareerScoreSnapshot.create({
        user: userId,
        score: currentScore,
        breakdown,
        recordedAt: now,
      });

      return {
        currentScore,
        previousScore: null,
        change: null,
        trendLabel: 'Not enough historical data yet',
        history: [{ score: first.score, recordedAt: first.recordedAt }],
      };
    }

    const latest = snapshots[0];
    const hoursSince = (now.getTime() - new Date(latest.recordedAt).getTime()) / (1000 * 60 * 60);

    // Save a new snapshot if score changed or if 24 hours have passed
    if (latest.score !== currentScore || hoursSince >= 24) {
      const created = await CareerScoreSnapshot.create({
        user: userId,
        score: currentScore,
        breakdown,
        recordedAt: now,
      });
      snapshots.unshift(created.toObject ? created.toObject() : created);
    }

    if (snapshots.length < 2) {
      return {
        currentScore,
        previousScore: null,
        change: null,
        trendLabel: 'Not enough historical data yet',
        history: snapshots.map((s) => ({ score: s.score, recordedAt: s.recordedAt })),
      };
    }

    const previousScore = snapshots[1].score;
    const change = currentScore - previousScore;
    const trendLabel = change > 0 ? `+${change}` : `${change}`;

    return {
      currentScore,
      previousScore,
      change,
      trendLabel,
      history: snapshots.map((s) => ({ score: s.score, recordedAt: s.recordedAt })),
    };
  } catch (err) {
    console.error('[AnalyticsService] Error retrieving score history:', err);
    return {
      currentScore,
      previousScore: null,
      change: null,
      trendLabel: 'Historical trend unavailable',
      history: [],
    };
  }
}

/**
 * Calculates timestamp-verified activity for the past 7 days
 */
function calculateWeeklyActivity({
  applications = [],
  projects = [],
  roadmap = null,
  dsaProfile = null,
  resume = null,
}) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const applicationsThisWeek = applications.filter(
    (a) => new Date(a.createdAt) >= sevenDaysAgo || (a.appliedAt && new Date(a.appliedAt) >= sevenDaysAgo)
  ).length;

  const projectsUpdatedThisWeek = projects.filter(
    (p) => new Date(p.updatedAt) >= sevenDaysAgo
  ).length;

  let roadmapTasksCompletedThisWeek = 0;
  if (roadmap && roadmap.tasks) {
    roadmapTasksCompletedThisWeek = roadmap.tasks.filter(
      (t) => t.status === 'COMPLETED' && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo
    ).length;
  }

  const dsaSyncedThisWeek = Boolean(
    dsaProfile?.leetcodeLastSyncedAt && new Date(dsaProfile.leetcodeLastSyncedAt) >= sevenDaysAgo
  );

  const resumeUpdatedThisWeek = Boolean(
    resume?.updatedAt && new Date(resume.updatedAt) >= sevenDaysAgo
  );

  const totalActions =
    applicationsThisWeek +
    projectsUpdatedThisWeek +
    roadmapTasksCompletedThisWeek +
    (dsaSyncedThisWeek ? 1 : 0) +
    (resumeUpdatedThisWeek ? 1 : 0);

  return {
    hasActivity: totalActions > 0,
    totalActions,
    applicationsThisWeek,
    projectsUpdatedThisWeek,
    roadmapTasksCompletedThisWeek,
    dsaSyncedThisWeek,
    resumeUpdatedThisWeek,
    message: totalActions > 0
      ? `${totalActions} meaningful career activities recorded this week.`
      : 'No activity recorded yet.',
  };
}

module.exports = {
  calculateApplicationMetrics,
  calculateRecurringOpportunityGaps,
  calculateCareerHealth,
  generateNextBestActions,
  getOrRecordScoreHistory,
  calculateWeeklyActivity,
};
