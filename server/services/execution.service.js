/**
 * execution.service.js
 *
 * Core execution engine for Career Odyssey Career Execution OS.
 * Provides deterministic metrics, state transitions, goal risk analysis,
 * skipped-task pattern detection, adaptive planning, and check-in workflows.
 */

const ExecutionGoal = require('../models/ExecutionGoal');
const ExecutionTask = require('../models/ExecutionTask');
const ExecutionLog = require('../models/ExecutionLog');
const WeeklyCheckIn = require('../models/WeeklyCheckIn');

/* ─── State Machine Transitions ──────────────────────────────────── */

const ALLOWED_TRANSITIONS = {
  PLANNED: ['IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED'],
  IN_PROGRESS: ['PAUSED', 'COMPLETED', 'SKIPPED'],
  PAUSED: ['IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
  SKIPPED: ['PLANNED'], // Explicit reopen only
};

function isValidTransition(fromStatus, toStatus) {
  if (!ALLOWED_TRANSITIONS[fromStatus]) return false;
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

/* ─── Date Utility Helpers ────────────────────────────────────────── */

function getDayBounds(targetDate = new Date()) {
  const d = new Date(targetDate);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function getWeekBounds(targetDate = new Date()) {
  const d = new Date(targetDate);
  const day = d.getDay();
  // Monday as start of week: day 0 is Sun (diff 6), 1 is Mon (diff 0), etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday, 0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
  return { start, end };
}

function getMonthBounds(targetDate = new Date()) {
  const d = new Date(targetDate);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/* ─── Metrics Computation Helpers ────────────────────────────────── */

function calculateCompletionRate(completedTasks, skippedTasks) {
  const eligible = completedTasks + skippedTasks;
  if (eligible === 0) return 'INSUFFICIENT_DATA';
  return Math.round((completedTasks / eligible) * 100);
}

function calculateTimeExecutionRate(completedMinutes, plannedMinutes) {
  if (!plannedMinutes || plannedMinutes <= 0) return 'INSUFFICIENT_DATA';
  return Math.round((completedMinutes / plannedMinutes) * 100);
}

function classifyExecutionStatus(score) {
  if (score === 'INSUFFICIENT_DATA' || typeof score !== 'number' || isNaN(score)) {
    return 'INSUFFICIENT_DATA';
  }
  if (score >= 80) return 'HIGH_PERFORMANCE';
  if (score >= 60) return 'EXECUTING';
  if (score >= 40) return 'INCONSISTENT';
  return 'OFF_TRACK';
}

function computeExecutionScore({
  completionRate,
  timeExecutionRate,
  consistencyScore,
  goalCompletionRate,
}) {
  const weights = {
    taskCompletion: 0.35,
    timeExecution: 0.25,
    consistency: 0.25,
    goalProgress: 0.15,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  if (typeof completionRate === 'number' && !isNaN(completionRate)) {
    weightedSum += completionRate * weights.taskCompletion;
    totalWeight += weights.taskCompletion;
  }
  if (typeof timeExecutionRate === 'number' && !isNaN(timeExecutionRate)) {
    // Cap at 100% time credit so excessive minutes don't game score
    const cappedTime = Math.min(100, timeExecutionRate);
    weightedSum += cappedTime * weights.timeExecution;
    totalWeight += weights.timeExecution;
  }
  if (typeof consistencyScore === 'number' && !isNaN(consistencyScore)) {
    weightedSum += consistencyScore * weights.consistency;
    totalWeight += weights.consistency;
  }
  if (typeof goalCompletionRate === 'number' && !isNaN(goalCompletionRate)) {
    weightedSum += goalCompletionRate * weights.goalProgress;
    totalWeight += weights.goalProgress;
  }

  if (totalWeight === 0) return 'INSUFFICIENT_DATA';
  return Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
}

/* ─── Task Selection Priority (Deterministic) ────────────────────── */

function getTaskPriorityScore(task) {
  let score = 0;

  // 1. Urgent deadline / interview
  if (task.priority === 'URGENT' || task.category === 'INTERVIEW') {
    score += 1000;
  }

  // 2. Overdue high priority
  const now = new Date();
  const isOverdue = task.dueDate && new Date(task.dueDate) < now;
  if (isOverdue && task.priority === 'HIGH') {
    score += 800;
  } else if (isOverdue) {
    score += 500;
  }

  // 3. Career Intelligence next best action
  if (task.source === 'CAREER_INTELLIGENCE') {
    score += 400;
  }

  // 4. High-impact roadmap task
  if (task.category === 'ROADMAP' || task.source === 'ROADMAP') {
    score += 300;
  }

  // 5. High-leverage skill
  if (task.category === 'SKILL') {
    score += 250;
  }

  // 6. Project work
  if (task.category === 'PROJECT') {
    score += 200;
  }

  // 7. DSA
  if (task.category === 'DSA') {
    score += 150;
  }

  // Priority bonus
  if (task.priority === 'HIGH') score += 50;
  else if (task.priority === 'MEDIUM') score += 20;

  return score;
}

function selectNextTask(tasks) {
  const eligible = tasks.filter(
    (t) => t.status === 'PLANNED' || t.status === 'IN_PROGRESS' || t.status === 'PAUSED'
  );
  if (!eligible.length) return null;

  return [...eligible].sort((a, b) => {
    const scoreA = getTaskPriorityScore(a);
    const scoreB = getTaskPriorityScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie breaker: sooner scheduled/due date
    const dateA = new Date(a.dueDate || a.scheduledDate).getTime();
    const dateB = new Date(b.dueDate || b.scheduledDate).getTime();
    return dateA - dateB;
  })[0];
}

/* ─── Goal Management & Ownership ────────────────────────────────── */

async function createGoal(userId, goalData) {
  const {
    title,
    description,
    category,
    priority,
    targetDate,
    weeklyTargetMinutes,
    source,
    relatedModule,
    relatedEntityType,
    relatedEntityId,
  } = goalData;

  if (!title || !title.trim()) {
    throw new Error('Goal title is required.');
  }

  const goal = new ExecutionGoal({
    user: userId,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'CAREER',
    priority: priority || 'MEDIUM',
    targetDate: targetDate ? new Date(targetDate) : null,
    weeklyTargetMinutes: Math.max(0, Number(weeklyTargetMinutes) || 0),
    source: source || 'USER',
    relatedModule: relatedModule || '',
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });

  return await goal.save();
}

async function getGoals(userId, filters = {}) {
  const query = { user: userId };
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  return await ExecutionGoal.find(query).sort({ createdAt: -1 });
}

async function getGoalById(userId, goalId) {
  const goal = await ExecutionGoal.findOne({ _id: goalId, user: userId });
  if (!goal) {
    throw new Error('Goal not found or unauthorized access.');
  }
  return goal;
}

async function updateGoal(userId, goalId, updateData) {
  const goal = await getGoalById(userId, goalId);

  const allowedUpdates = [
    'title',
    'description',
    'category',
    'status',
    'priority',
    'targetDate',
    'weeklyTargetMinutes',
    'source',
    'relatedModule',
    'relatedEntityType',
    'relatedEntityId',
  ];

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      goal[field] = updateData[field];
    }
  }

  return await goal.save();
}

async function completeGoal(userId, goalId) {
  const goal = await getGoalById(userId, goalId);
  goal.status = 'COMPLETED';
  return await goal.save();
}

async function pauseGoal(userId, goalId) {
  const goal = await getGoalById(userId, goalId);
  goal.status = 'PAUSED';
  return await goal.save();
}

async function deleteGoal(userId, goalId) {
  const goal = await getGoalById(userId, goalId);
  await ExecutionGoal.deleteOne({ _id: goal._id });
  return { success: true, message: 'Goal deleted successfully.' };
}

/* ─── Task Management & Ownership ────────────────────────────────── */

async function createTask(userId, taskData) {
  const {
    goalId,
    title,
    description,
    priority,
    scheduledDate,
    dueDate,
    estimatedMinutes,
    category,
    source,
    relatedModule,
    relatedEntityType,
    relatedEntityId,
  } = taskData;

  if (!title || !title.trim()) {
    throw new Error('Task title is required.');
  }

  const est = Number(estimatedMinutes);
  if (isNaN(est) || est < 5 || est > 480) {
    throw new Error('Estimated minutes must be between 5 and 480.');
  }

  if (goalId) {
    const goalExists = await ExecutionGoal.findOne({ _id: goalId, user: userId });
    if (!goalExists) {
      throw new Error('Referenced goal does not belong to this user.');
    }
  }

  const task = new ExecutionTask({
    user: userId,
    goalId: goalId || null,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: 'PLANNED',
    priority: priority || 'MEDIUM',
    scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    dueDate: dueDate ? new Date(dueDate) : null,
    estimatedMinutes: est,
    actualMinutes: 0,
    category: category || 'CAREER',
    source: source || 'USER',
    relatedModule: relatedModule || '',
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
  });

  return await task.save();
}

async function getTaskById(userId, taskId) {
  const task = await ExecutionTask.findOne({ _id: taskId, user: userId });
  if (!task) {
    throw new Error('Task not found or unauthorized access.');
  }
  return task;
}

async function updateTask(userId, taskId, updateData) {
  const task = await getTaskById(userId, taskId);

  if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
    throw new Error(`Cannot modify a ${task.status.toLowerCase()} task.`);
  }

  const allowed = [
    'title',
    'description',
    'priority',
    'scheduledDate',
    'dueDate',
    'estimatedMinutes',
    'category',
    'relatedModule',
    'relatedEntityType',
    'relatedEntityId',
  ];

  if (updateData.estimatedMinutes !== undefined) {
    const est = Number(updateData.estimatedMinutes);
    if (isNaN(est) || est < 5 || est > 480) {
      throw new Error('Estimated minutes must be between 5 and 480.');
    }
    task.estimatedMinutes = est;
  }

  for (const field of allowed) {
    if (field !== 'estimatedMinutes' && updateData[field] !== undefined) {
      task[field] = updateData[field];
    }
  }

  return await task.save();
}

/* ─── Task Actions & Lifecycle ───────────────────────────────────── */

async function startTask(userId, taskId, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'IN_PROGRESS')) {
    throw new Error(`Invalid status transition from ${task.status} to IN_PROGRESS.`);
  }

  task.status = 'IN_PROGRESS';
  await task.save();

  await ExecutionLog.create({
    user: userId,
    taskId: task._id,
    action: 'START',
    minutes: 0,
    note: note.slice(0, 500),
  });

  return task;
}

async function pauseTask(userId, taskId, minutes = 0, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'PAUSED')) {
    throw new Error(`Invalid status transition from ${task.status} to PAUSED.`);
  }

  const min = Math.max(0, Number(minutes) || 0);
  task.status = 'PAUSED';
  task.actualMinutes += min;
  await task.save();

  await ExecutionLog.create({
    user: userId,
    taskId: task._id,
    action: 'PAUSE',
    minutes: min,
    note: note.slice(0, 500),
  });

  return task;
}

async function resumeTask(userId, taskId, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'IN_PROGRESS')) {
    throw new Error(`Invalid status transition from ${task.status} to IN_PROGRESS.`);
  }

  task.status = 'IN_PROGRESS';
  await task.save();

  await ExecutionLog.create({
    user: userId,
    taskId: task._id,
    action: 'RESUME',
    minutes: 0,
    note: note.slice(0, 500),
  });

  return task;
}

async function completeTask(userId, taskId, minutes = null, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'COMPLETED')) {
    throw new Error(`Invalid status transition from ${task.status} to COMPLETED.`);
  }

  let finalMinutes = task.actualMinutes;
  if (minutes !== null && minutes !== undefined) {
    const addMin = Math.max(0, Number(minutes) || 0);
    finalMinutes += addMin;
  }

  // Anti-gaming: ensure completed task reflects meaningful investment
  // If actualMinutes remains 0 and no minutes supplied, default to estimatedMinutes
  if (finalMinutes <= 0) {
    finalMinutes = task.estimatedMinutes;
  }

  task.status = 'COMPLETED';
  task.actualMinutes = finalMinutes;
  task.completedAt = new Date();
  await task.save();

  await ExecutionLog.create({
    user: userId,
    taskId: task._id,
    action: 'COMPLETE',
    minutes: minutes !== null ? Math.max(0, Number(minutes)) : task.estimatedMinutes,
    note: note.slice(0, 500),
  });

  return task;
}

async function skipTask(userId, taskId, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'SKIPPED')) {
    throw new Error(`Invalid status transition from ${task.status} to SKIPPED.`);
  }

  task.status = 'SKIPPED';
  await task.save();

  await ExecutionLog.create({
    user: userId,
    taskId: task._id,
    action: 'SKIP',
    minutes: 0,
    note: note.slice(0, 500),
  });

  return task;
}

async function cancelTask(userId, taskId, note = '') {
  const task = await getTaskById(userId, taskId);

  if (!isValidTransition(task.status, 'CANCELLED')) {
    throw new Error(`Invalid status transition from ${task.status} to CANCELLED.`);
  }

  task.status = 'CANCELLED';
  await task.save();

  return task;
}

async function deleteTask(userId, taskId) {
  const task = await getTaskById(userId, taskId);
  await ExecutionLog.deleteMany({ taskId: task._id });
  await ExecutionTask.deleteOne({ _id: task._id });
  return { success: true, message: 'Task deleted successfully.' };
}

/* ─── Daily Execution ────────────────────────────────────────────── */

async function getDailyExecution(userId, date = new Date()) {
  const { start, end } = getDayBounds(date);

  const tasks = await ExecutionTask.find({
    user: userId,
    scheduledDate: { $gte: start, $lte: end },
  });

  // Non-cancelled tasks planned for today
  const plannedTasksList = tasks.filter((t) => t.status !== 'CANCELLED');
  const plannedTasks = plannedTasksList.length;
  const completedTasks = plannedTasksList.filter((t) => t.status === 'COMPLETED').length;
  const skippedTasks = plannedTasksList.filter((t) => t.status === 'SKIPPED').length;
  const remainingTasks = plannedTasksList.filter(
    (t) => t.status === 'PLANNED' || t.status === 'IN_PROGRESS' || t.status === 'PAUSED'
  ).length;

  // Overdue tasks: scheduled before today and not completed/cancelled
  const overdueTasksCount = await ExecutionTask.countDocuments({
    user: userId,
    scheduledDate: { $lt: start },
    status: { $in: ['PLANNED', 'IN_PROGRESS', 'PAUSED'] },
  });

  const plannedMinutes = plannedTasksList.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const completedMinutes = plannedTasksList
    .filter((t) => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes || 0), 0);

  const completionRate = calculateCompletionRate(completedTasks, skippedTasks);
  const timeExecutionRate = calculateTimeExecutionRate(completedMinutes, plannedMinutes);

  const executionScore = computeExecutionScore({
    completionRate,
    timeExecutionRate,
  });

  const nextTask = selectNextTask(plannedTasksList);

  return {
    date: start.toISOString().split('T')[0],
    plannedTasks,
    completedTasks,
    remainingTasks,
    overdueTasks: overdueTasksCount,
    skippedTasks,
    plannedMinutes,
    completedMinutes,
    completionRate,
    timeExecutionRate,
    executionScore,
    status: classifyExecutionStatus(executionScore),
    nextTask,
    tasks: plannedTasksList,
  };
}

/* ─── Streaks & Consistency ──────────────────────────────────────── */

async function calculateStreaks(userId) {
  // Check the last 60 days for active completion days
  const now = new Date();
  const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);

  const completedTasks = await ExecutionTask.find({
    user: userId,
    status: 'COMPLETED',
    completedAt: { $gte: past },
  }).select('completedAt actualMinutes');

  const daysWithCompletions = new Set();
  completedTasks.forEach((t) => {
    if (t.completedAt) {
      const dayStr = new Date(t.completedAt).toISOString().split('T')[0];
      daysWithCompletions.add(dayStr);
    }
  });

  // Calculate current streak backwards from today or yesterday
  let dailyStreak = 0;
  let cursor = new Date();
  const todayStr = cursor.toISOString().split('T')[0];

  // If student hasn't completed something today yet, check if yesterday was active
  if (!daysWithCompletions.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const str = cursor.toISOString().split('T')[0];
    if (daysWithCompletions.has(str)) {
      dailyStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate weekly consistency score (past 7 rolling days)
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const recentTasks = await ExecutionTask.find({
    user: userId,
    scheduledDate: { $gte: weekStart, $lte: now },
    status: { $ne: 'CANCELLED' },
  });

  if (!recentTasks.length) {
    return {
      dailyStreak,
      activeDaysPast7: 0,
      consistencyScore: 'INSUFFICIENT_DATA',
    };
  }

  const activeDaysIn7 = new Set();
  recentTasks.forEach((t) => {
    if (t.status === 'COMPLETED' && t.completedAt) {
      activeDaysIn7.add(new Date(t.completedAt).toISOString().split('T')[0]);
    }
  });

  const activeCount = activeDaysIn7.size;
  const recentSkips = recentTasks.filter((t) => t.status === 'SKIPPED').length;
  const skipPenalty = Math.min(30, recentSkips * 10);

  // Active days credit (up to 70 pts) + streak credit (up to 30 pts) - skip penalty
  const activeCredit = Math.round((activeCount / 7) * 70);
  const streakCredit = Math.min(30, dailyStreak * 6);
  const consistencyScore = Math.max(0, Math.min(100, activeCredit + streakCredit - skipPenalty));

  return {
    dailyStreak,
    activeDaysPast7: activeCount,
    consistencyScore,
  };
}

/* ─── Goal Risk Engine ───────────────────────────────────────────── */

async function evaluateGoalRisk(goal) {
  if (goal.status === 'COMPLETED') {
    return {
      status: 'COMPLETED',
      progressPercent: 100,
      recommendation: 'Goal achieved! Review results and set your next career milestone.',
    };
  }

  // Get associated tasks
  const tasks = await ExecutionTask.find({ goalId: goal._id });
  const totalTasks = tasks.filter((t) => t.status !== 'CANCELLED').length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const now = new Date();
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;

  if (targetDate && targetDate < now) {
    return {
      status: 'OVERDUE',
      progressPercent,
      recommendation:
        'Target deadline has elapsed. Re-evaluate remaining requirements and set an achievable target date.',
    };
  }

  if (targetDate) {
    const daysRemaining = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    // If deadline is tight (< 7 days) and completion is under 50%, mark AT_RISK
    if (daysRemaining <= 7 && progressPercent < 50) {
      return {
        status: 'AT_RISK',
        progressPercent,
        daysRemaining,
        recommendation:
          'Goal is at risk due to upcoming target date. Break remaining work into smaller daily milestones.',
      };
    }
  }

  return {
    status: 'ON_TRACK',
    progressPercent,
    recommendation: 'Maintain steady execution pace to stay on track.',
  };
}

async function getGoalsRiskAssessment(userId) {
  const goals = await ExecutionGoal.find({ user: userId, status: { $ne: 'ARCHIVED' } });
  const assessments = await Promise.all(
    goals.map(async (g) => {
      const assessment = await evaluateGoalRisk(g);
      return {
        goalId: g._id,
        title: g.title,
        category: g.category,
        priority: g.priority,
        targetDate: g.targetDate,
        ...assessment,
      };
    })
  );

  return assessments;
}

/* ─── Skipped-Task Analysis ──────────────────────────────────────── */

async function detectSkippedPatterns(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await ExecutionTask.find({
    user: userId,
    scheduledDate: { $gte: thirtyDaysAgo },
    status: { $in: ['COMPLETED', 'SKIPPED'] },
  });

  const categoryStats = {};

  tasks.forEach((t) => {
    if (!categoryStats[t.category]) {
      categoryStats[t.category] = { planned: 0, completed: 0, skipped: 0 };
    }
    categoryStats[t.category].planned++;
    if (t.status === 'COMPLETED') categoryStats[t.category].completed++;
    if (t.status === 'SKIPPED') categoryStats[t.category].skipped++;
  });

  const patterns = [];

  for (const [category, stats] of Object.entries(categoryStats)) {
    if (stats.skipped >= 3) {
      const skipRate = Math.round((stats.skipped / stats.planned) * 100);
      let recommendation = `Your ${category} tasks are repeatedly being skipped (${stats.skipped} skipped).`;

      if (category === 'DSA') {
        recommendation = `Your DSA tasks are repeatedly being skipped. Reduce daily DSA scope from 90 minutes to 45 minutes and focus on single patterns.`;
      } else if (category === 'PROJECT') {
        recommendation = `Project tasks are facing execution friction. Split large project milestones into smaller 30-minute deliverables.`;
      } else if (category === 'RESUME') {
        recommendation = `Resume tasks have been deferred. Dedicate 20 minutes to polish bullet points for a single recent project.`;
      } else {
        recommendation = `Reduce daily ${category.toLowerCase()} scope by 50% to build sustainable execution momentum.`;
      }

      patterns.push({
        category,
        planned: stats.planned,
        completed: stats.completed,
        skipped: stats.skipped,
        skipRate,
        recommendation,
      });
    }
  }

  return patterns;
}

/* ─── Adaptive Planning & Difficulty ─────────────────────────────── */

async function getAdaptivePlan(userId) {
  const skippedPatterns = await detectSkippedPatterns(userId);
  const streaks = await calculateStreaks(userId);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await ExecutionTask.find({
    user: userId,
    scheduledDate: { $gte: thirtyDaysAgo },
    status: { $in: ['COMPLETED', 'SKIPPED'] },
  });

  if (tasks.length < 3) {
    return {
      difficulty: 'INSUFFICIENT_DATA',
      adaptiveAdjustments: [],
      rationale: 'Need at least 3 completed or skipped tasks before evaluating adaptive difficulty.',
    };
  }

  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const skipped = tasks.filter((t) => t.status === 'SKIPPED').length;
  const overallRate = Math.round((completed / (completed + skipped)) * 100);

  let difficulty = 'APPROPRIATE';
  const adjustments = [];

  if (overallRate < 45 || skippedPatterns.length >= 2) {
    difficulty = 'TOO_HARD';
    adjustments.push({
      action: 'REDUCE_SCOPE',
      detail: 'Lower daily planned effort by 25–40% to prevent burnout.',
    });
    adjustments.push({
      action: 'SPLIT_TASKS',
      detail: 'Break large milestones into self-contained 20–30 minute actions.',
    });
  } else if (overallRate >= 90 && streaks.dailyStreak >= 7) {
    difficulty = 'TOO_EASY';
    adjustments.push({
      action: 'EXPAND_CHALLENGE',
      detail: 'Gradually increase problem difficulty or add an additional project milestone.',
    });
  }

  return {
    difficulty,
    completionRate: overallRate,
    skippedPatterns,
    adaptiveAdjustments: adjustments,
  };
}

/* ─── Execution Analytics (Daily, Weekly, Monthly) ───────────────── */

async function getExecutionAnalytics(userId) {
  const now = new Date();
  const dayBounds = getDayBounds(now);
  const weekBounds = getWeekBounds(now);
  const monthBounds = getMonthBounds(now);

  const [daily, weekTasks, monthTasks, goalsAssessments, skippedPatterns, streaks] =
    await Promise.all([
      getDailyExecution(userId, now),
      ExecutionTask.find({
        user: userId,
        scheduledDate: { $gte: weekBounds.start, $lte: weekBounds.end },
      }),
      ExecutionTask.find({
        user: userId,
        scheduledDate: { $gte: monthBounds.start, $lte: monthBounds.end },
      }),
      getGoalsRiskAssessment(userId),
      detectSkippedPatterns(userId),
      calculateStreaks(userId),
    ]);

  // Weekly calculations
  const weekPlanned = weekTasks.filter((t) => t.status !== 'CANCELLED');
  const weekCompleted = weekPlanned.filter((t) => t.status === 'COMPLETED');
  const weekSkipped = weekPlanned.filter((t) => t.status === 'SKIPPED');
  const weekCancelled = weekTasks.filter((t) => t.status === 'CANCELLED');

  const weekPlannedMin = weekPlanned.reduce((a, t) => a + (t.estimatedMinutes || 0), 0);
  const weekCompletedMin = weekCompleted.reduce(
    (a, t) => a + (t.actualMinutes || t.estimatedMinutes || 0),
    0
  );

  const weeklyCompletionRate = calculateCompletionRate(weekCompleted.length, weekSkipped.length);
  const weeklyTimeRate = calculateTimeExecutionRate(weekCompletedMin, weekPlannedMin);

  // Goal completion rate
  const completedGoalsCount = goalsAssessments.filter((g) => g.status === 'COMPLETED').length;
  const activeGoalsCount = goalsAssessments.length;
  const goalCompletionRate =
    activeGoalsCount > 0
      ? Math.round((completedGoalsCount / activeGoalsCount) * 100)
      : 'INSUFFICIENT_DATA';

  const weeklyExecutionScore = computeExecutionScore({
    completionRate: weeklyCompletionRate,
    timeExecutionRate: weeklyTimeRate,
    consistencyScore: streaks.consistencyScore,
    goalCompletionRate,
  });

  // Monthly metrics (only if data exists)
  let monthly = null;
  const monthPlanned = monthTasks.filter((t) => t.status !== 'CANCELLED');
  if (monthPlanned.length > 0) {
    const monthCompleted = monthPlanned.filter((t) => t.status === 'COMPLETED');
    const monthSkipped = monthPlanned.filter((t) => t.status === 'SKIPPED');
    const monthPlannedMin = monthPlanned.reduce((a, t) => a + (t.estimatedMinutes || 0), 0);
    const monthCompletedMin = monthCompleted.reduce(
      (a, t) => a + (t.actualMinutes || t.estimatedMinutes || 0),
      0
    );

    monthly = {
      plannedTasks: monthPlanned.length,
      completedTasks: monthCompleted.length,
      skippedTasks: monthSkipped.length,
      plannedMinutes: monthPlannedMin,
      completedMinutes: monthCompletedMin,
      completionRate: calculateCompletionRate(monthCompleted.length, monthSkipped.length),
      timeExecutionRate: calculateTimeExecutionRate(monthCompletedMin, monthPlannedMin),
    };
  }

  // Strongest & weakest category
  const categoryStats = {};
  weekPlanned.forEach((t) => {
    if (!categoryStats[t.category]) categoryStats[t.category] = { completed: 0, total: 0 };
    categoryStats[t.category].total++;
    if (t.status === 'COMPLETED') categoryStats[t.category].completed++;
  });

  let strongestCategory = null;
  let weakestCategory = null;
  let maxRate = -1;
  let minRate = 101;

  for (const [cat, stat] of Object.entries(categoryStats)) {
    if (stat.total >= 1) {
      const rate = Math.round((stat.completed / stat.total) * 100);
      if (rate > maxRate) {
        maxRate = rate;
        strongestCategory = { category: cat, rate };
      }
      if (rate < minRate) {
        minRate = rate;
        weakestCategory = { category: cat, rate };
      }
    }
  }

  const atRiskGoals = goalsAssessments.filter(
    (g) => g.status === 'AT_RISK' || g.status === 'OVERDUE'
  );

  return {
    daily,
    weekly: {
      plannedTasks: weekPlanned.length,
      completedTasks: weekCompleted.length,
      skippedTasks: weekSkipped.length,
      cancelledTasks: weekCancelled.length,
      plannedMinutes: weekPlannedMin,
      completedMinutes: weekCompletedMin,
      completionRate: weeklyCompletionRate,
      timeExecutionRate: weeklyTimeRate,
      goalCompletionRate,
      consistencyScore: streaks.consistencyScore,
      executionScore: weeklyExecutionScore,
      status: classifyExecutionStatus(weeklyExecutionScore),
    },
    monthly,
    executionScore: weeklyExecutionScore,
    consistencyScore: streaks.consistencyScore,
    completionRate: weeklyCompletionRate,
    timeExecutionRate: weeklyTimeRate,
    strongestCategory: strongestCategory?.category || 'INSUFFICIENT_DATA',
    weakestCategory: weakestCategory?.category || 'INSUFFICIENT_DATA',
    skippedPatterns,
    atRiskGoals,
    streaks,
  };
}

/* ─── Weekly Review ──────────────────────────────────────────────── */

async function getWeeklyReview(userId) {
  const analytics = await getExecutionAnalytics(userId);
  const w = analytics.weekly;

  const topAchievements = [];
  if (w.completedTasks > 0) {
    topAchievements.push(`Completed ${w.completedTasks} planned career tasks.`);
  }
  if (w.completedMinutes >= 120) {
    topAchievements.push(
      `Invested ${Math.round(w.completedMinutes / 60)} hours into focused career execution.`
    );
  }
  if (analytics.streaks.dailyStreak >= 3) {
    topAchievements.push(`Built a ${analytics.streaks.dailyStreak}-day execution streak.`);
  }
  if (!topAchievements.length) {
    topAchievements.push('Ready to begin execution for the upcoming week.');
  }

  let biggestProblem = 'None observed this week.';
  let nextWeekRecommendation = 'Maintain your current execution cadence.';

  if (analytics.skippedPatterns.length > 0) {
    const worst = analytics.skippedPatterns[0];
    biggestProblem = `Low completion rate in ${worst.category} tasks (${worst.skipped} skipped).`;
    nextWeekRecommendation = worst.recommendation;
  } else if (w.completionRate !== 'INSUFFICIENT_DATA' && w.completionRate < 50) {
    biggestProblem = `Overall task completion rate fell to ${w.completionRate}%.`;
    nextWeekRecommendation =
      'Reduce planned weekly commitments by 30% to re-establish consistency.';
  } else if (analytics.atRiskGoals.length > 0) {
    const risk = analytics.atRiskGoals[0];
    biggestProblem = `Goal "${risk.title}" is ${risk.status.toLowerCase()}.`;
    nextWeekRecommendation = risk.recommendation;
  }

  return {
    planned: w.plannedTasks,
    completed: w.completedTasks,
    skipped: w.skippedTasks,
    timeInvested: w.completedMinutes,
    completionRate: w.completionRate,
    executionScore: w.executionScore,
    goalsCompleted: analytics.weekly.completedTasks,
    goalsAtRisk: analytics.atRiskGoals.length,
    topAchievements,
    biggestExecutionProblem: biggestProblem,
    nextWeekRecommendation,
  };
}

/* ─── Weekly Check-In ────────────────────────────────────────────── */

async function getCurrentWeekCheckIn(userId) {
  const { start, end } = getWeekBounds();
  const existing = await WeeklyCheckIn.findOne({
    user: userId,
    weekStart: start,
  });

  const review = await getWeeklyReview(userId);

  return {
    weekStart: start,
    weekEnd: end,
    hasSubmitted: !!existing,
    checkIn: existing,
    review,
  };
}

async function submitWeeklyCheckIn(userId, { selfRating, reflection }) {
  const rating = Number(selfRating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error('Self rating must be an integer between 1 and 5.');
  }

  const cleanReflection = String(reflection || '').trim();
  if (cleanReflection.length > 2000) {
    throw new Error('Reflection cannot exceed 2000 characters.');
  }

  const { start, end } = getWeekBounds();

  // Aggregate current week metrics
  const analytics = await getExecutionAnalytics(userId);
  const w = analytics.weekly;

  // Enforce unique check-in per week server-side
  try {
    const checkIn = new WeeklyCheckIn({
      user: userId,
      weekStart: start,
      weekEnd: end,
      completionRate: typeof w.completionRate === 'number' ? w.completionRate : 0,
      plannedMinutes: w.plannedMinutes || 0,
      completedMinutes: w.completedMinutes || 0,
      goalsCompleted: analytics.weekly.completedTasks || 0,
      goalsAtRisk: analytics.atRiskGoals.length || 0,
      selfRating: rating,
      reflection: cleanReflection,
    });

    return await checkIn.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new Error('A check-in has already been submitted for this week.');
    }
    throw err;
  }
}

async function updateWeeklyCheckIn(userId, checkInId, { selfRating, reflection }) {
  const checkIn = await WeeklyCheckIn.findOne({ _id: checkInId, user: userId });
  if (!checkIn) {
    throw new Error('Check-in not found or unauthorized access.');
  }

  if (selfRating !== undefined) {
    const rating = Number(selfRating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('Self rating must be an integer between 1 and 5.');
    }
    checkIn.selfRating = rating;
  }

  if (reflection !== undefined) {
    const cleanReflection = String(reflection).trim();
    if (cleanReflection.length > 2000) {
      throw new Error('Reflection cannot exceed 2000 characters.');
    }
    checkIn.reflection = cleanReflection;
  }

  return await checkIn.save();
}

/* ─── Activity Heatmap (7–30 Days) ───────────────────────────────── */

async function getExecutionHeatmap(userId, days = 14) {
  const numDays = Math.min(30, Math.max(7, Number(days) || 14));
  const now = new Date();
  const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (numDays - 1), 0, 0, 0, 0);

  const tasks = await ExecutionTask.find({
    user: userId,
    scheduledDate: { $gte: past, $lte: now },
  });

  const dayMap = {};
  for (let i = 0; i < numDays; i++) {
    const d = new Date(past.getFullYear(), past.getMonth(), past.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = {
      date: key,
      plannedCount: 0,
      completedCount: 0,
      skippedCount: 0,
      level: 'NO_PLANNED_ACTIVITY', // 'NO_PLANNED_ACTIVITY' | 'PLANNED_INCOMPLETE' | 'PARTIAL' | 'COMPLETED'
    };
  }

  tasks.forEach((t) => {
    if (t.status === 'CANCELLED') return;
    const key = new Date(t.scheduledDate).toISOString().split('T')[0];
    if (dayMap[key]) {
      dayMap[key].plannedCount++;
      if (t.status === 'COMPLETED') dayMap[key].completedCount++;
      if (t.status === 'SKIPPED') dayMap[key].skippedCount++;
    }
  });

  // Classify each day without fabricating data
  const result = Object.values(dayMap).map((d) => {
    if (d.plannedCount === 0) {
      d.level = 'NO_PLANNED_ACTIVITY';
    } else if (d.completedCount === d.plannedCount && d.plannedCount > 0) {
      d.level = 'COMPLETED';
    } else if (d.completedCount > 0) {
      d.level = 'PARTIAL';
    } else {
      d.level = 'PLANNED_INCOMPLETE';
    }
    return d;
  });

  return result;
}

module.exports = {
  // Constants & validators
  ALLOWED_TRANSITIONS,
  isValidTransition,
  getDayBounds,
  getWeekBounds,
  getMonthBounds,
  calculateCompletionRate,
  calculateTimeExecutionRate,
  computeExecutionScore,
  classifyExecutionStatus,
  selectNextTask,

  // Goal operations
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  completeGoal,
  pauseGoal,
  deleteGoal,

  // Task operations
  createTask,
  getTaskById,
  updateTask,
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  skipTask,
  cancelTask,
  deleteTask,

  // Analytics & Reviews
  getDailyExecution,
  calculateStreaks,
  evaluateGoalRisk,
  getGoalsRiskAssessment,
  detectSkippedPatterns,
  getAdaptivePlan,
  getExecutionAnalytics,
  getWeeklyReview,
  getExecutionHeatmap,

  // Check-In
  getCurrentWeekCheckIn,
  submitWeeklyCheckIn,
  updateWeeklyCheckIn,
};
