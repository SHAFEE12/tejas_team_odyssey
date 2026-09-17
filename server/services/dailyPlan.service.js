/**
 * dailyPlan.service.js
 *
 * Daily Career Planner service.
 * Converts student analytics and reminders into an actionable, bite-sized daily plan.
 *
 * Rules:
 * - Deterministic priority scoring.
 * - Capped at 5 major tasks per day (60–180 min total).
 * - Real student data only — no fake deadlines or arbitrary filler.
 * - Reuses existing analytics.service.js nextBestActions.
 */

const Reminder = require('../models/Reminder');
const Application = require('../models/Application');
const Roadmap = require('../models/Roadmap');
const Project = require('../models/Project');
const Resume = require('../models/Resume');
const DSAProfile = require('../models/DSAProfile');
const SkillProfile = require('../models/SkillProfile');
const GitHubProfile = require('../models/GitHubProfile');

const { generateNextBestActions } = require('./analytics.service');
const { calculateRecurringOpportunityGaps } = require('./analytics.service');

/**
 * Calculates deterministic task priority score (0–100)
 */
function scoreTaskPriority({ urgency = 'MEDIUM', category = 'GENERAL', hasDeadline = false, hoursUntilDue = null }) {
  let score = 50;

  // Urgency weight
  if (urgency === 'URGENT') score += 35;
  else if (urgency === 'HIGH') score += 20;
  else if (urgency === 'LOW') score -= 15;

  // Deadline proximity
  if (hoursUntilDue !== null) {
    if (hoursUntilDue <= 24) score += 25;
    else if (hoursUntilDue <= 72) score += 15;
  }

  // Category weight
  switch (category) {
    case 'INTERVIEW':
      score += 25;
      break;
    case 'APPLICATION':
    case 'DEADLINE':
      score += 20;
      break;
    case 'ROADMAP':
      score += 15;
      break;
    case 'RESUME':
      score += 10;
      break;
    case 'PROJECT':
      score += 10;
      break;
    case 'DSA':
      score += 5;
      break;
    default:
      break;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculates consecutive daily completion streak from genuine completed records
 */
async function calculateAuthenticStreak(userId) {
  try {
    const completedReminders = await Reminder.find({
      user: userId,
      status: 'COMPLETED',
      completedAt: { $ne: null },
    })
      .select('completedAt')
      .sort({ completedAt: -1 })
      .lean();

    if (completedReminders.length === 0) {
      return { days: 0, message: 'Start your career streak today.' };
    }

    // Collect unique completion dates (YYYY-MM-DD)
    const uniqueDays = new Set(
      completedReminders.map((r) => new Date(r.completedAt).toISOString().split('T')[0])
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];

      if (uniqueDays.has(dayStr)) {
        streak += 1;
      } else if (i === 0) {
        // Not completed today yet is acceptable if completed yesterday
        continue;
      } else {
        break;
      }
    }

    return {
      days: streak,
      message: streak > 0 ? `${streak} day career streak!` : 'Start your career streak today.',
    };
  } catch (err) {
    console.error('[DailyPlanService] calculateAuthenticStreak error:', err);
    return { days: 0, message: 'Start your career streak today.' };
  }
}

/**
 * Generates today's prioritized career execution plan
 *
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
async function generateDailyPlan(userId) {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Fetch student domain records concurrently
  const [
    reminders,
    applications,
    roadmap,
    projects,
    resume,
    dsaProfile,
    gitHubProfile,
    skillProfile,
    streakInfo,
  ] = await Promise.all([
    Reminder.find({ user: userId }).sort({ dueAt: 1, priority: -1 }).lean(),
    Application.find({ user: userId }).populate('opportunity').lean(),
    Roadmap.findOne({ user: userId }).lean(),
    Project.find({ user: userId }).lean(),
    Resume.findOne({ user: userId }).lean(),
    DSAProfile.findOne({ user: userId }).lean(),
    GitHubProfile.findOne({ user: userId }).lean(),
    SkillProfile.findOne({ user: userId }).lean(),
    calculateAuthenticStreak(userId),
  ]);

  const targetRole = skillProfile?.targetRole || 'Software Engineer';
  const rawTasks = [];

  // 1. High-priority & Urgent PENDING Reminders
  const activeReminders = reminders.filter((r) => r.status === 'PENDING');
  for (const rem of activeReminders) {
    let hoursUntilDue = null;
    if (rem.dueAt) {
      hoursUntilDue = (new Date(rem.dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
    }

    const priorityScore = scoreTaskPriority({
      urgency: rem.priority,
      category: rem.type,
      hasDeadline: Boolean(rem.dueAt),
      hoursUntilDue,
    });

    rawTasks.push({
      id: `rem-${rem._id}`,
      reminderId: String(rem._id),
      title: rem.title,
      description: rem.description,
      category: rem.type,
      priority: rem.priority,
      priorityScore,
      estimatedMinutes: rem.estimatedMinutes || 30,
      completed: false,
      source: 'REMINDER',
      link: rem.relatedEntityType === 'Application'
        ? '/student/applications'
        : rem.relatedEntityType === 'RoadmapTask'
        ? '/student/roadmap'
        : '/student/reminders',
    });
  }

  // 2. In-Progress Roadmap Task (if not already covered by a reminder)
  if (roadmap && roadmap.tasks) {
    const inProgressTask = roadmap.tasks.find((t) => t.status === 'IN_PROGRESS');
    if (inProgressTask) {
      const alreadyHasReminder = rawTasks.some(
        (t) => t.reminderId && reminders.some((r) => r._id.toString() === t.reminderId && r.relatedEntityId === inProgressTask.taskId)
      );

      if (!alreadyHasReminder) {
        rawTasks.push({
          id: `roadmap-${inProgressTask.taskId}`,
          reminderId: null,
          title: `Advance Roadmap: ${inProgressTask.title}`,
          description: `Phase ${inProgressTask.phaseNumber}: ${inProgressTask.phaseTitle}. Continue learning and building evidence.`,
          category: 'ROADMAP',
          priority: inProgressTask.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          priorityScore: inProgressTask.priority === 'HIGH' ? 85 : 70,
          estimatedMinutes: 45,
          completed: false,
          source: 'ROADMAP',
          link: '/student/roadmap',
        });
      }
    }
  }

  // 3. Next Best Actions integration (from analytics engine)
  const recurringGaps = calculateRecurringOpportunityGaps(applications, skillProfile?.skills || []);
  const recommendations = generateNextBestActions({
    resume,
    recurringGaps: recurringGaps.recurringGaps,
    roadmap,
    projects,
    dsaProfile,
    gitHubProfile,
    applications,
  });

  for (const rec of recommendations) {
    // Avoid duplicate tasks
    const duplicate = rawTasks.some((t) => t.title.toLowerCase().includes(rec.category.toLowerCase()));
    if (!duplicate) {
      const priorityScore = scoreTaskPriority({
        urgency: rec.priority,
        category: rec.category,
      });

      rawTasks.push({
        id: `rec-${rec.id}`,
        reminderId: null,
        title: rec.action,
        description: rec.description,
        category: rec.category,
        priority: rec.priority,
        priorityScore,
        estimatedMinutes: 30,
        completed: false,
        source: 'RECOMMENDATION',
        link: rec.link,
      });
    }
  }

  // 4. Also include reminders completed TODAY so student sees current day's progress
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const completedTodayReminders = reminders.filter(
    (r) => r.status === 'COMPLETED' && r.completedAt && new Date(r.completedAt) >= todayStart
  );

  const completedTodayTasks = completedTodayReminders.map((rem) => ({
    id: `rem-${rem._id}`,
    reminderId: String(rem._id),
    title: rem.title,
    description: rem.description,
    category: rem.type,
    priority: rem.priority,
    priorityScore: 100,
    estimatedMinutes: rem.estimatedMinutes || 30,
    completed: true,
    source: 'REMINDER',
    link: '/student/reminders',
  }));

  // Sort raw pending tasks by priorityScore desc
  rawTasks.sort((a, b) => b.priorityScore - a.priorityScore);

  // Target: Maximum 5 major tasks per day (completed today count towards daily plan)
  const maxDailyTasks = 5;
  const remainingSlots = Math.max(0, maxDailyTasks - completedTodayTasks.length);
  const selectedPending = rawTasks.slice(0, remainingSlots);

  const finalTasks = [...completedTodayTasks, ...selectedPending];

  const totalEstimatedMinutes = finalTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedCount = finalTasks.filter((t) => t.completed).length;
  const totalCount = finalTasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalPendingAvailable = rawTasks.length;
  const additionalTasksCount = Math.max(0, totalPendingAvailable - selectedPending.length);

  return {
    date: todayDateStr,
    careerFocus: targetRole,
    tasks: finalTasks,
    totalEstimatedMinutes,
    completedCount,
    totalCount,
    progressPercentage,
    streak: streakInfo,
    hasAdditionalTasks: additionalTasksCount > 0,
    additionalTasksCount,
  };
}

module.exports = {
  scoreTaskPriority,
  calculateAuthenticStreak,
  generateDailyPlan,
};
