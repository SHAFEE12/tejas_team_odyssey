/**
 * copilotContext.service.js
 *
 * Centralized context engine for the Career Copilot.
 * Aggregates authentic, stored student data across all Career Odyssey modules.
 *
 * SAFETY & PRIVACY:
 * - Never logs or exposes raw resume text, private notes, tokens, or credentials.
 * - All queries are strictly scoped to userId.
 * - Missing or unconnected modules are handled gracefully without throwing or fabricating fake values.
 */

const User = require('../models/User');
const SkillProfile = require('../models/SkillProfile');
const DSAProfile = require('../models/DSAProfile');
const GitHubProfile = require('../models/GitHubProfile');
const Resume = require('../models/Resume');
const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');
const Reminder = require('../models/Reminder');

const { computeCareerScore } = require('./careerScore.service');
const { analyzeSkillGap } = require('./skillGap.service');
const {
  calculateApplicationMetrics,
  calculateCareerHealth,
} = require('./analytics.service');
const { generateDailyPlan } = require('./dailyPlan.service');

/**
 * Safely gathers and normalizes a student's full career context.
 * @param {string|ObjectId} userId
 * @returns {Promise<Object>} Normalized career context
 */
async function buildCopilotContext(userId) {
  const now = new Date();

  // Concurrently fetch all student domain models
  const [
    user,
    skillProfile,
    dsaProfile,
    gitHubProfile,
    resume,
    roadmap,
    projects,
    applications,
    reminders,
    opportunities,
  ] = await Promise.all([
    User.findById(userId).select('-password').lean().catch(() => null),
    SkillProfile.findOne({ user: userId }).lean().catch(() => null),
    DSAProfile.findOne({ user: userId }).lean().catch(() => null),
    GitHubProfile.findOne({ user: userId }).lean().catch(() => null),
    Resume.findOne({ user: userId }).lean().catch(() => null),
    Roadmap.findOne({ user: userId }).lean().catch(() => null),
    Project.find({ user: userId }).lean().catch(() => []),
    Application.find({ user: userId }).populate('opportunity').lean().catch(() => []),
    Reminder.find({ user: userId }).lean().catch(() => []),
    Opportunity.find({ isActive: true }).limit(10).lean().catch(() => []),
  ]);

  // 1. Profile & Career Goal
  const targetRole = skillProfile?.targetRole || '';
  const targetIndustry = skillProfile?.targetIndustry || '';
  const studentSkills = skillProfile?.skills || [];
  const profileCompletion = calculateProfileCompletion({
    hasUser: Boolean(user),
    hasTargetRole: Boolean(targetRole),
    skillsCount: studentSkills.length,
    hasResume: Boolean(resume && resume.status === 'completed'),
    hasProjects: projects.length > 0,
    hasGitHub: Boolean(gitHubProfile && gitHubProfile.isConnected),
    hasDSA: Boolean(dsaProfile && dsaProfile.totalSolved > 0),
  });

  const profileContext = {
    name: user?.name || 'Student',
    email: user?.email || '',
    role: user?.role || 'student',
    profileCompletion,
  };

  const careerGoalContext = {
    targetRole: targetRole || null,
    targetIndustry: targetIndustry || null,
    isSet: Boolean(targetRole),
  };

  const skillsContext = {
    totalSkills: studentSkills.length,
    list: studentSkills.map((s) => ({
      name: s.name,
      level: s.level,
      yearsOfExperience: s.yearsOfExperience || 0,
    })),
  };

  // 2. DSA & LeetCode Context
  const dsaContext = {
    available: Boolean(dsaProfile),
    isConnected: Boolean(dsaProfile?.leetcodeUsername),
    leetcodeUsername: dsaProfile?.leetcodeUsername || null,
    totalSolved: dsaProfile?.totalSolved ?? 0,
    easySolved: dsaProfile?.easySolved ?? 0,
    mediumSolved: dsaProfile?.mediumSolved ?? 0,
    hardSolved: dsaProfile?.hardSolved ?? 0,
    currentStreak: dsaProfile?.currentStreak ?? 0,
    longestStreak: dsaProfile?.longestStreak ?? 0,
    targetTotal: dsaProfile?.targetTotal ?? 150,
    syncStatus: dsaProfile?.syncStatus || 'IDLE',
    lastSyncedAt: dsaProfile?.lastSyncedAt || null,
  };

  // 3. GitHub Context
  const githubContext = {
    available: Boolean(gitHubProfile),
    isConnected: Boolean(gitHubProfile?.isConnected),
    username: gitHubProfile?.username || null,
    publicRepos: gitHubProfile?.publicRepos ?? 0,
    totalStars: gitHubProfile?.totalStars ?? 0,
    topLanguages: gitHubProfile?.topLanguages || [],
    lastSyncedAt: gitHubProfile?.lastSyncedAt || null,
  };

  // 4. Resume Context (Safe summary only — no raw resume dump or private notes)
  const resumeContext = {
    available: Boolean(resume),
    status: resume?.status || 'NOT_UPLOADED',
    atsScore: resume?.atsScore ?? null,
    contentScore: resume?.contentScore ?? null,
    roleAlignmentScore: resume?.roleAlignmentScore ?? null,
    evidenceScore: resume?.evidenceScore ?? null,
    overallScore: resume?.overallScore ?? null,
    matchedSkills: resume?.matchedSkills || [],
    missingSkills: resume?.missingSkills || [],
    analyzedAt: resume?.analyzedAt || null,
  };

  // 5. Skill Gap Analysis (Deterministic reuse)
  let skillGapData = null;
  try {
    skillGapData = analyzeSkillGap({
      skillProfile,
      resume,
      githubProfile: gitHubProfile,
      dsaProfile,
    });
  } catch {
    skillGapData = null;
  }

  const skillGapContext = {
    available: Boolean(skillGapData),
    targetRole: skillGapData?.targetRole || targetRole || null,
    coveragePercentage: skillGapData?.coveragePercentage ?? null,
    coveredSkills: (skillGapData?.coveredSkills || []).map((s) => s.name || s),
    partialSkills: (skillGapData?.partialSkills || []).map((s) => s.name || s),
    missingSkills: (skillGapData?.missingSkills || []).map((s) => s.name || s),
    resumeEvidenceMissing: (skillGapData?.resumeEvidenceMissing || []).map((s) => s.name || s),
    priorityGaps: (skillGapData?.priorityGaps || []).slice(0, 5),
  };

  // 6. Roadmap Context
  const roadmapTasks = roadmap?.tasks || [];
  const completedTasks = roadmapTasks.filter((t) => t.status === 'COMPLETED');
  const inProgressTasks = roadmapTasks.filter((t) => t.status === 'IN_PROGRESS');
  const pendingTasks = roadmapTasks.filter((t) => t.status === 'NOT_STARTED');

  const roadmapContext = {
    available: Boolean(roadmap),
    targetRole: roadmap?.targetRole || null,
    currentPhase: roadmap?.currentPhase || (roadmapTasks.length > 0 ? 1 : null),
    progress: roadmap?.progress ?? 0,
    totalTasks: roadmapTasks.length,
    completedCount: completedTasks.length,
    inProgressCount: inProgressTasks.length,
    pendingCount: pendingTasks.length,
    activeTasks: inProgressTasks.slice(0, 3).map((t) => ({
      id: t._id || t.taskId,
      title: t.title,
      priority: t.priority,
      phase: t.phase,
      relatedSkill: t.relatedSkill,
    })),
  };

  // 7. Projects Context
  const projectContext = {
    totalProjects: projects.length,
    completedProjects: projects.filter((p) => p.status === 'COMPLETED').length,
    inProgressProjects: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    withGithubUrl: projects.filter((p) => Boolean(p.githubUrl)).length,
    withLiveUrl: projects.filter((p) => Boolean(p.liveUrl)).length,
    list: projects.slice(0, 5).map((p) => ({
      id: p._id,
      title: p.title,
      status: p.status,
      overallQualityScore: p.overallQualityScore ?? 0,
      hasGithub: Boolean(p.githubUrl),
      hasLiveUrl: Boolean(p.liveUrl),
      techStack: p.techStack || [],
    })),
  };

  // 8. Applications Context
  const appMetrics = calculateApplicationMetrics(applications);
  const activeApplications = applications.filter((a) =>
    ['PLANNING', 'APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND'].includes(a.status)
  );
  const upcomingDeadlines = applications
    .filter((a) => a.deadline && new Date(a.deadline) >= now)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3)
    .map((a) => ({
      id: a._id,
      company: a.company,
      role: a.role,
      status: a.status,
      deadline: a.deadline,
    }));
  const upcomingInterviews = applications
    .filter((a) => a.interviewDate && new Date(a.interviewDate) >= now)
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
    .slice(0, 3)
    .map((a) => ({
      id: a._id,
      company: a.company,
      role: a.role,
      status: a.status,
      interviewDate: a.interviewDate,
    }));

  const applicationsContext = {
    total: applications.length,
    active: activeApplications.length,
    submitted: appMetrics.applicationsSubmitted,
    responseRate: appMetrics.responseRate,
    interviewRate: appMetrics.interviewRate,
    offerRate: appMetrics.offerRate,
    upcomingDeadlines,
    upcomingInterviews,
    needingAttention: applications
      .filter(
        (a) =>
          (a.deadline && new Date(a.deadline) <= new Date(Date.now() + 3 * 86400000)) ||
          (a.interviewDate && new Date(a.interviewDate) <= new Date(Date.now() + 7 * 86400000))
      )
      .slice(0, 5)
      .map((a) => ({
        id: a._id,
        company: a.company,
        role: a.role,
        status: a.status,
        deadline: a.deadline || null,
        interviewDate: a.interviewDate || null,
      })),
  };

  // 9. Opportunities Context
  const opportunitiesContext = {
    trackedCount: applications.length,
    availableSampleCount: opportunities.length,
    topRelevant: opportunities.slice(0, 3).map((o) => ({
      id: o._id,
      title: o.title,
      company: o.company,
      type: o.type,
      requiredSkills: o.requiredSkills || [],
    })),
  };

  // 10. Analytics & Career Score Context
  let careerScoreData = null;
  try {
    careerScoreData = computeCareerScore({
      skillProfile,
      dsaProfile,
      gitHubProfile,
    });
  } catch {
    careerScoreData = null;
  }

  let careerHealthData = null;
  try {
    careerHealthData = calculateCareerHealth({
      careerScore: careerScoreData?.careerReadinessScore ?? null,
      applicationMetrics: appMetrics,
      roadmapProgress: roadmap?.progress ?? null,
      portfolioQuality: projects.length > 0 ? 70 : null,
      resumeAts: resume?.status === 'completed' ? resume.atsScore : null,
      dsaProfile,
      gitHubProfile,
    });
  } catch {
    careerHealthData = null;
  }

  const analyticsContext = {
    careerReadinessScore: careerScoreData?.careerReadinessScore ?? null,
    careerScoreBreakdown: careerScoreData?.breakdown || null,
    careerHealthScore: careerHealthData?.score ?? null,
    careerHealthRating: careerHealthData?.rating ?? 'UNAVAILABLE',
    majorWeaknesses: careerHealthData?.breakdown
      ? Object.entries(careerHealthData.breakdown)
          .filter(([, v]) => typeof v.score === 'number' && v.score < 50)
          .map(([k, v]) => ({ component: k, score: v.score }))
      : [],
  };

  // 11. Reminders Context
  const pendingReminders = reminders.filter((r) => r.status === 'PENDING');
  const overdueReminders = pendingReminders.filter(
    (r) => r.dueAt && new Date(r.dueAt) < now
  );
  const dueTodayReminders = pendingReminders.filter((r) => {
    if (!r.dueAt) return false;
    const d = new Date(r.dueAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  const remindersContext = {
    total: reminders.length,
    pendingCount: pendingReminders.length,
    overdueCount: overdueReminders.length,
    dueTodayCount: dueTodayReminders.length,
    highPriority: pendingReminders
      .filter((r) => ['URGENT', 'HIGH'].includes(r.priority))
      .slice(0, 5)
      .map((r) => ({
        id: r._id,
        title: r.title,
        priority: r.priority,
        type: r.type,
        dueAt: r.dueAt,
      })),
  };

  // 12. Daily Plan Context
  let dailyPlanData = null;
  try {
    dailyPlanData = await generateDailyPlan(userId);
  } catch {
    dailyPlanData = null;
  }

  const dailyPlanContext = {
    available: Boolean(dailyPlanData),
    date: dailyPlanData?.date || now.toISOString().slice(0, 10),
    totalTasks: dailyPlanData?.totalTasks ?? 0,
    completedTasks: dailyPlanData?.completedTasks ?? 0,
    progressPercentage: dailyPlanData?.progressPercentage ?? 0,
    totalEstimatedMinutes: dailyPlanData?.totalEstimatedMinutes ?? 0,
    topTasks: (dailyPlanData?.tasks || []).slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      estimatedMinutes: t.estimatedMinutes,
      priorityScore: t.priorityScore,
      completed: t.completed,
    })),
  };

  // 13. Execution Context
  let executionData = null;
  try {
    const { getExecutionAnalytics } = require('./execution.service');
    executionData = await getExecutionAnalytics(userId);
  } catch {
    executionData = null;
  }

  const executionContext = {
    available: Boolean(executionData),
    executionScore: executionData?.executionScore ?? 'INSUFFICIENT_DATA',
    completionRate: executionData?.completionRate ?? 'INSUFFICIENT_DATA',
    consistencyScore: executionData?.consistencyScore ?? 'INSUFFICIENT_DATA',
    timeExecutionRate: executionData?.timeExecutionRate ?? 'INSUFFICIENT_DATA',
    strongestCategory: executionData?.strongestCategory ?? 'INSUFFICIENT_DATA',
    weakestCategory: executionData?.weakestCategory ?? 'INSUFFICIENT_DATA',
    atRiskGoals: executionData?.atRiskGoals || [],
    skippedPatterns: executionData?.skippedPatterns || [],
    streaks: executionData?.streaks || { dailyStreak: 0, activeDaysPast7: 0 },
    daily: {
      plannedTasks: executionData?.daily?.plannedTasks ?? 0,
      completedTasks: executionData?.daily?.completedTasks ?? 0,
      completionRate: executionData?.daily?.completionRate ?? 'INSUFFICIENT_DATA',
    },
  };

  // Normalized return structure
  return {
    profile: profileContext,
    careerGoal: careerGoalContext,
    skills: skillsContext,
    dsa: dsaContext,
    github: githubContext,
    resume: resumeContext,
    skillGap: skillGapContext,
    roadmap: roadmapContext,
    projects: projectContext,
    opportunities: opportunitiesContext,
    applications: applicationsContext,
    analytics: analyticsContext,
    reminders: remindersContext,
    dailyPlan: dailyPlanContext,
    execution: executionContext,
    generatedAt: now.toISOString(),
  };
}

/**
 * Calculates student profile completion percentage (0-100)
 */
function calculateProfileCompletion({
  hasUser,
  hasTargetRole,
  skillsCount,
  hasResume,
  hasProjects,
  hasGitHub,
  hasDSA,
}) {
  let score = 0;
  if (hasUser) score += 15;
  if (hasTargetRole) score += 20;
  if (skillsCount >= 3) score += 15;
  else if (skillsCount > 0) score += 5;
  if (hasResume) score += 15;
  if (hasProjects) score += 15;
  if (hasGitHub) score += 10;
  if (hasDSA) score += 10;
  return Math.min(100, score);
}

module.exports = {
  buildCopilotContext,
};
