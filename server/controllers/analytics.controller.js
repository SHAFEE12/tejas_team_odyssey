/**
 * analytics.controller.js
 *
 * Controller for the Career Analytics module (GET /api/analytics).
 *
 * Strict Student Ownership:
 * Every data fetch is scoped to req.user._id.
 * No data leakage across students.
 */

const SkillProfile = require('../models/SkillProfile');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Reminder = require('../models/Reminder');

const { computeCareerScore } = require('../services/careerScore.service');
const { analyzeSkillGap } = require('../services/skillGap.service');
const {
  calculateApplicationMetrics,
  calculateRecurringOpportunityGaps,
  calculateCareerHealth,
  generateNextBestActions,
  getOrRecordScoreHistory,
  calculateWeeklyActivity,
} = require('../services/analytics.service');

/**
 * GET /api/analytics
 * Returns comprehensive career operating metrics for the authenticated student.
 */
async function getAnalytics(req, res) {
  try {
    const userId = req.user._id;

    // Concurrently fetch all student domain models
    const [
      skillProfile,
      resume,
      gitHubProfile,
      dsaProfile,
      roadmap,
      projects,
      applications,
      reminders,
    ] = await Promise.all([
      SkillProfile.findOne({ user: userId }).lean(),
      Resume.findOne({ user: userId }).lean(),
      GitHubProfile.findOne({ user: userId }).lean(),
      DSAProfile.findOne({ user: userId }).lean(),
      Roadmap.findOne({ user: userId }).lean(),
      Project.find({ user: userId }).lean(),
      Application.find({ user: userId }).populate('opportunity').lean(),
      Reminder.find({ user: userId }).lean(),
    ]);

    // 1. Career Readiness Score
    const careerScoreData = computeCareerScore({
      skillProfile,
      dsaProfile,
      gitHubProfile,
    });
    const currentCareerScore = careerScoreData?.careerReadinessScore ?? 0;

    // 2. Score History (Snapshots)
    const scoreHistory = await getOrRecordScoreHistory(
      userId,
      currentCareerScore,
      careerScoreData?.breakdown || {}
    );

    // 3. Skill Gap Analysis
    const skillGapData = analyzeSkillGap({
      skillProfile,
      resume,
      githubProfile: gitHubProfile,
      dsaProfile,
    });

    // 4. Application Metrics & Funnel
    const applicationMetrics = calculateApplicationMetrics(applications);

    // 5. Recurring Gaps from Tracked Opportunities
    const recurringGapsData = calculateRecurringOpportunityGaps(
      applications,
      skillProfile?.skills || []
    );

    // 6. Roadmap Analytics
    const totalRoadmapTasks = roadmap?.totalTasks || 0;
    const completedRoadmapTasks = roadmap?.completedTasks || 0;
    const inProgressRoadmapTasks = roadmap?.inProgressTasks || 0;
    const notStartedRoadmapTasks = Math.max(
      0,
      totalRoadmapTasks - completedRoadmapTasks - inProgressRoadmapTasks
    );
    const roadmapProgress = roadmap?.progress ?? (
      totalRoadmapTasks > 0
        ? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100)
        : null
    );

    const roadmapAnalytics = {
      status: roadmap ? 'AVAILABLE' : 'UNAVAILABLE',
      totalTasks: totalRoadmapTasks,
      completedTasks: completedRoadmapTasks,
      inProgressTasks: inProgressRoadmapTasks,
      notStartedTasks: notStartedRoadmapTasks,
      completionPercentage: roadmapProgress ?? 0,
      targetRole: roadmap?.targetRole || null,
      message: roadmap ? null : 'No career roadmap generated yet.',
    };

    // 7. Project Portfolio Analytics
    const totalProjects = projects.length;
    const plannedProjects = projects.filter((p) => p.status === 'PLANNED').length;
    const inProgressProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const githubLinkedProjects = projects.filter((p) => Boolean(p.github?.url)).length;
    const deployedProjects = projects.filter((p) => Boolean(p.deployment?.url)).length;
    const resumeEvidenceReadyProjects = projects.filter(
      (p) => p.status === 'COMPLETED' && (p.github?.url || p.deployment?.url)
    ).length;

    const avgProjectQuality = totalProjects > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / totalProjects)
      : null;

    const projectAnalytics = {
      status: totalProjects > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
      totalProjects,
      planned: plannedProjects,
      inProgress: inProgressProjects,
      completed: completedProjects,
      averageQuality: avgProjectQuality ?? 0,
      githubLinked: githubLinkedProjects,
      deployed: deployedProjects,
      resumeEvidenceReady: resumeEvidenceReadyProjects,
      message: totalProjects > 0 ? null : 'No portfolio projects logged yet.',
    };

    // 8. DSA / LeetCode Analytics
    const hasDsaData = Boolean(
      dsaProfile &&
      (dsaProfile.leetcodeConnected ||
        (dsaProfile.totalSolved && dsaProfile.totalSolved > 0) ||
        (dsaProfile.leetcodeData?.totalSolved && dsaProfile.leetcodeData.totalSolved > 0))
    );

    const dsaTotalSolved = dsaProfile?.leetcodeData?.totalSolved ?? dsaProfile?.totalSolved ?? null;
    const dsaEasy = dsaProfile?.leetcodeData?.easySolved ?? dsaProfile?.easySolved ?? null;
    const dsaMedium = dsaProfile?.leetcodeData?.mediumSolved ?? dsaProfile?.mediumSolved ?? null;
    const dsaHard = dsaProfile?.leetcodeData?.hardSolved ?? dsaProfile?.hardSolved ?? null;

    const dsaAnalytics = hasDsaData
      ? {
          status: 'AVAILABLE',
          totalSolved: dsaTotalSolved,
          easy: dsaEasy,
          medium: dsaMedium,
          hard: dsaHard,
          currentStreak: dsaProfile?.currentStreak || 0,
          longestStreak: dsaProfile?.longestStreak || 0,
          leetcodeUsername: dsaProfile?.leetcodeUsername || null,
          lastSyncedAt: dsaProfile?.leetcodeLastSyncedAt || null,
        }
      : {
          status: 'UNAVAILABLE',
          message: 'DSA data unavailable',
        };

    // 9. GitHub Analytics
    const hasGitHubData = Boolean(gitHubProfile && gitHubProfile.connected);
    const githubAnalytics = hasGitHubData
      ? {
          status: 'AVAILABLE',
          publicRepos: gitHubProfile.publicRepos || 0,
          stars: gitHubProfile.totalStars || 0,
          forks: gitHubProfile.totalForks || 0,
          topLanguages: gitHubProfile.languages || [],
          username: gitHubProfile.username || '',
          lastSync: gitHubProfile.lastSyncedAt || null,
        }
      : {
          status: 'UNAVAILABLE',
          message: 'GitHub data unavailable',
        };

    // 10. Resume Analytics
    const hasResume = Boolean(resume && (resume.status === 'completed' || resume.analysis));
    const resumeScoreVal = resume?.analysis?.atsScore ?? (resume?.analysis?.overallScore || null);

    let resumeStatusLabel = 'NOT_UPLOADED';
    if (hasResume) {
      if (resumeScoreVal >= 80) resumeStatusLabel = 'STRONG';
      else if (resumeScoreVal >= 60) resumeStatusLabel = 'ANALYZED';
      else resumeStatusLabel = 'NEEDS_IMPROVEMENT';
    }

    const resumeAnalytics = hasResume
      ? {
          status: resumeStatusLabel,
          resumeScore: resumeScoreVal,
          atsScore: resume?.analysis?.atsScore ?? null,
          roleAlignment: resume?.analysis?.roleAlignmentScore ?? null,
          evidenceStrength: resume?.analysis?.evidenceStrength ?? 'MODERATE',
          fileName: resume.originalFileName,
          analyzedAt: resume.analyzedAt,
        }
      : {
          status: 'NOT_UPLOADED',
          message: 'No resume uploaded yet',
        };

    // 11. Career Health Score (0–100, normalized available-data model)
    const skillCoveragePercent = skillGapData?.overallScore ?? 0;
    const careerHealth = calculateCareerHealth({
      careerScore: currentCareerScore,
      skillCoveragePercent,
      roadmapProgress,
      portfolioQuality: avgProjectQuality,
      resumeScore: resumeScoreVal,
      activeApplications: applicationMetrics.activeApplications,
      totalTracked: applicationMetrics.totalTracked,
      dsaScore: dsaTotalSolved !== null ? Math.min(100, dsaTotalSolved * 2) : null,
    });

    // 12. Weekly Activity Tracking
    const weeklyActivity = calculateWeeklyActivity({
      applications,
      projects,
      roadmap,
      dsaProfile,
      resume,
    });

    // 13. Deterministic Next Best Actions
    const recommendations = generateNextBestActions({
      resume,
      recurringGaps: recurringGapsData.recurringGaps,
      roadmap,
      projects,
      dsaProfile,
      gitHubProfile,
      applications,
      careerScore: currentCareerScore,
    });

    // 14. Reminders & Execution Telemetry
    const pendingReminders = reminders.filter((r) => r.status === 'PENDING').length;
    const overdueReminders = reminders.filter(
      (r) => r.status === 'PENDING' && r.dueAt && new Date(r.dueAt) < new Date()
    ).length;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const completedToday = reminders.filter(
      (r) => r.status === 'COMPLETED' && r.completedAt && new Date(r.completedAt) >= todayMidnight
    ).length;
    const eligibleReminders = reminders.filter((r) => r.status !== 'DISMISSED').length;
    const completedTotal = reminders.filter((r) => r.status === 'COMPLETED').length;
    const reminderCompletionRate =
      eligibleReminders > 0 ? Math.round((completedTotal / eligibleReminders) * 100) : 0;
    const totalTodayTasks = completedToday + pendingReminders;
    const dailyPlanProgress =
      totalTodayTasks > 0 ? Math.round((completedToday / totalTodayTasks) * 100) : 0;

    const reminderAnalytics = {
      pendingReminders,
      overdueReminders,
      completedToday,
      reminderCompletionRate,
      dailyPlanProgress,
    };

    return res.status(200).json({
      success: true,
      data: {
        careerHealth,
        careerScore: {
          currentScore: scoreHistory.currentScore,
          previousScore: scoreHistory.previousScore,
          change: scoreHistory.change,
          trendLabel: scoreHistory.trendLabel,
          history: scoreHistory.history,
          breakdown: careerScoreData?.breakdown || {},
        },
        applications: applicationMetrics,
        funnel: applicationMetrics.funnel,
        skillGap: {
          totalSkills: skillGapData?.summary?.totalSkills || 0,
          coveredCount: skillGapData?.summary?.coveredCount || 0,
          partialCount: skillGapData?.summary?.partialCount || 0,
          missingCount: skillGapData?.summary?.missingCount || 0,
          evidenceMissingCount: skillGapData?.summary?.resumeEvidenceMissingCount || 0,
          coveragePercent: skillCoveragePercent,
          targetRole: skillGapData?.roleName || 'Unspecified',
          recurringGaps: recurringGapsData.recurringGaps,
          trackedOpportunitiesCount: recurringGapsData.trackedOpportunitiesCount,
          recurringGapsLabel: recurringGapsData.label,
          recurringGapsMessage: recurringGapsData.message,
        },
        roadmap: roadmapAnalytics,
        projects: projectAnalytics,
        dsa: dsaAnalytics,
        github: githubAnalytics,
        resume: resumeAnalytics,
        weeklyActivity,
        recommendations,
        reminders: reminderAnalytics,
      },
    });
  } catch (err) {
    console.error('[AnalyticsController] getAnalytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate career analytics. Please try again later.',
    });
  }
}

module.exports = {
  getAnalytics,
};
