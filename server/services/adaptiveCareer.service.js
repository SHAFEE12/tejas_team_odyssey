/**
 * adaptiveCareer.service.js
 *
 * Adaptive Career Operating System (Phase 6).
 *
 * Core Principles:
 * - Deterministic, rule-based adaptive feedback engine.
 * - Learns from authentic student execution behavior without hallucination.
 * - Non-duplication: orchestrates existing copilotContext, execution, and careerScore services.
 * - Safe snapshot persistence with 24-hour deduplication.
 * - Respectful, supportive, and non-shaming behavioral feedback.
 */

const mongoose = require('mongoose');
const AdaptivePlanSnapshot = require('../models/AdaptivePlanSnapshot');
const ExecutionTask = require('../models/ExecutionTask');
const ExecutionGoal = require('../models/ExecutionGoal');
const Application = require('../models/Application');
const { buildCopilotContext } = require('./copilotContext.service');

/* ─── Mode Definitions & Enums ────────────────────────────────────── */

const ADAPTIVE_MODES = {
  DEADLINE_MODE: 'DEADLINE_MODE',
  INTERVIEW_MODE: 'INTERVIEW_MODE',
  EXECUTION_RECOVERY: 'EXECUTION_RECOVERY',
  SKILL_GAP_CLOSURE: 'SKILL_GAP_CLOSURE',
  PROJECT_EXECUTION: 'PROJECT_EXECUTION',
  APPLICATION_CAMPAIGN: 'APPLICATION_CAMPAIGN',
  NORMAL: 'NORMAL',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
};

/* ─── Helper: Get Week Range ─────────────────────────────────────── */

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diffToMonday));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

/* ─── 1. Behavior Signals Analysis ────────────────────────────────── */

/**
 * Analyzes execution tasks to derive behavioral signals:
 * completion rate, skip rate, overdue count, velocity trend, and category friction.
 *
 * @param {Array<Object>} tasks - List of ExecutionTask records
 * @returns {Object} Behavior signals summary
 */
function analyzeBehaviorSignals(tasks = []) {
  if (!tasks || tasks.length === 0) {
    return {
      totalTasks: 0,
      completedCount: 0,
      skippedCount: 0,
      pendingCount: 0,
      overdueCount: 0,
      completionRate: null,
      skipRate: null,
      avgCompletionTimeMinutes: null,
      mostSkippedCategory: null,
      mostActiveCategory: null,
      categoryPerformance: {},
      velocityTrend: 'INSUFFICIENT_DATA',
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let completedCount = 0;
  let skippedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let totalActualMinutes = 0;
  let tasksWithActualMinutes = 0;

  const categoryMap = {};

  tasks.forEach((task) => {
    const cat = task.category || 'CAREER';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        total: 0,
        completed: 0,
        skipped: 0,
        pending: 0,
        totalActualMinutes: 0,
        totalEstimatedMinutes: 0,
      };
    }
    categoryMap[cat].total += 1;
    categoryMap[cat].totalEstimatedMinutes += task.estimatedMinutes || 30;

    const isPending = task.status === 'PLANNED' || task.status === 'IN_PROGRESS';

    if (task.status === 'COMPLETED') {
      completedCount += 1;
      categoryMap[cat].completed += 1;
      if (task.actualMinutes && task.actualMinutes > 0) {
        totalActualMinutes += task.actualMinutes;
        tasksWithActualMinutes += 1;
        categoryMap[cat].totalActualMinutes += task.actualMinutes;
      }
    } else if (task.status === 'SKIPPED') {
      skippedCount += 1;
      categoryMap[cat].skipped += 1;
    } else if (isPending) {
      pendingCount += 1;
      categoryMap[cat].pending += 1;

      if (task.scheduledDate && new Date(task.scheduledDate) < todayStart) {
        overdueCount += 1;
      }
    }
  });

  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : null;
  const skipRate = total > 0 ? Math.round((skippedCount / total) * 100) : null;
  const avgCompletionTimeMinutes =
    tasksWithActualMinutes > 0 ? Math.round(totalActualMinutes / tasksWithActualMinutes) : null;

  // Identify most skipped and most active categories
  let maxSkipped = 0;
  let mostSkippedCategory = null;
  let maxCompleted = 0;
  let mostActiveCategory = null;

  const categoryPerformance = {};
  Object.keys(categoryMap).forEach((cat) => {
    const c = categoryMap[cat];
    if (c.skipped > maxSkipped) {
      maxSkipped = c.skipped;
      mostSkippedCategory = cat;
    }
    if (c.completed > maxCompleted) {
      maxCompleted = c.completed;
      mostActiveCategory = cat;
    }

    categoryPerformance[cat] = {
      total: c.total,
      completed: c.completed,
      skipped: c.skipped,
      pending: c.pending,
      completionRate: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
      skipRate: c.total > 0 ? Math.round((c.skipped / c.total) * 100) : 0,
      avgActualMinutes: c.completed > 0 ? Math.round(c.totalActualMinutes / c.completed) : null,
      avgEstimatedMinutes: Math.round(c.totalEstimatedMinutes / c.total),
    };
  });

  // Calculate Velocity Trend (compare tasks in last 7d vs prior 7d)
  let velocityTrend = 'STABLE';
  if (total < 3) {
    velocityTrend = 'INSUFFICIENT_DATA';
  } else {
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(
      (t) => new Date(t.createdAt || t.scheduledDate || now) >= sevenDaysAgo
    );
    const priorTasks = tasks.filter((t) => {
      const d = new Date(t.createdAt || t.scheduledDate || now);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const recentCompRate =
      recentTasks.length > 0
        ? recentTasks.filter((t) => t.status === 'COMPLETED').length / recentTasks.length
        : null;
    const priorCompRate =
      priorTasks.length > 0
        ? priorTasks.filter((t) => t.status === 'COMPLETED').length / priorTasks.length
        : null;

    if (completionRate !== null && completionRate < 35) {
      velocityTrend = 'CRITICAL_DROP';
    } else if (recentCompRate !== null && priorCompRate !== null) {
      const diff = recentCompRate - priorCompRate;
      if (diff >= 0.15) {
        velocityTrend = 'ACCELERATING';
      } else if (diff <= -0.25) {
        velocityTrend = 'CRITICAL_DROP';
      } else if (diff < -0.05) {
        velocityTrend = 'DECELERATING';
      } else {
        velocityTrend = 'STABLE';
      }
    } else if (completionRate >= 75) {
      velocityTrend = 'ACCELERATING';
    } else if (completionRate < 50) {
      velocityTrend = 'DECELERATING';
    }
  }

  return {
    totalTasks: total,
    completedCount,
    skippedCount,
    pendingCount,
    overdueCount,
    completionRate,
    skipRate,
    avgCompletionTimeMinutes,
    mostSkippedCategory,
    mostActiveCategory,
    categoryPerformance,
    velocityTrend,
  };
}

/* ─── 2. Execution Friction Detection ─────────────────────────────── */

/**
 * Detects patterns causing student stall or abandonment without negative shaming.
 *
 * @param {Object} behaviorSignals
 * @param {Array<Object>} tasks
 * @returns {Array<Object>} frictionSummary
 */
function detectExecutionFriction(behaviorSignals, tasks = []) {
  const frictionSummary = [];

  if (!behaviorSignals || behaviorSignals.totalTasks === 0) {
    return frictionSummary;
  }

  // 1. Check per-category skip resistance
  const catPerf = behaviorSignals.categoryPerformance || {};
  Object.keys(catPerf).forEach((cat) => {
    const stats = catPerf[cat];
    if (stats.skipped >= 2 || (stats.total >= 3 && stats.skipRate >= 40)) {
      const level = stats.skipped >= 3 || stats.skipRate >= 60 ? 'HIGH' : 'MODERATE';
      frictionSummary.push({
        category: cat,
        frictionLevel: level,
        evidence: `${cat} tasks are completed less consistently (${stats.skipped} of ${stats.total} skipped, ${stats.skipRate}% skip rate).`,
        recommendation: `Reduce ${cat} task duration to 20-30 minute focused chunks to minimize activation resistance.`,
      });
    }

    // 2. Check time underestimation friction
    if (
      stats.completed >= 2 &&
      stats.avgActualMinutes &&
      stats.avgEstimatedMinutes &&
      stats.avgActualMinutes > stats.avgEstimatedMinutes * 1.5
    ) {
      frictionSummary.push({
        category: cat,
        frictionLevel: 'MODERATE',
        evidence: `${cat} tasks take significantly longer than planned (avg ${stats.avgActualMinutes}m actual vs ${stats.avgEstimatedMinutes}m estimated).`,
        recommendation: `Calibrate future ${cat} task estimates upward to prevent daily schedule rollover.`,
      });
    }
  });

  // 3. Overdue accumulation check
  if (behaviorSignals.overdueCount >= 3) {
    frictionSummary.push({
      category: 'GENERAL',
      frictionLevel: behaviorSignals.overdueCount >= 5 ? 'HIGH' : 'MODERATE',
      evidence: `${behaviorSignals.overdueCount} scheduled tasks are overdue, causing cognitive backlog fatigue.`,
      recommendation: `Reschedule or archive non-essential overdue items to reset execution momentum.`,
    });
  }

  // 4. Low overall completion warning
  if (
    behaviorSignals.totalTasks >= 4 &&
    behaviorSignals.completionRate !== null &&
    behaviorSignals.completionRate < 40
  ) {
    frictionSummary.push({
      category: 'WORKLOAD',
      frictionLevel: 'HIGH',
      evidence: `Overall completion rate is ${behaviorSignals.completionRate}%, suggesting current task load may exceed weekly capacity.`,
      recommendation: `Temporarily downscale weekly commitment to focus on 1-2 core wins per day.`,
    });
  }

  return frictionSummary;
}

/* ─── 3. Deterministic Adaptive Mode Selection ────────────────────── */

/**
 * Evaluates student state to determine the active adaptive operating mode.
 * Evaluated strictly in order of priority:
 * 1. DEADLINE_MODE (within 48 hours)
 * 2. INTERVIEW_MODE (within 7 days)
 * 3. EXECUTION_RECOVERY (completion < 50%, high skips, overdue)
 * 4. SKILL_GAP_CLOSURE (missing core skills)
 * 5. PROJECT_EXECUTION (active projects with milestones)
 * 6. APPLICATION_CAMPAIGN (readiness >= 65% & few applications)
 * 7. NORMAL (balanced execution)
 * 8. INSUFFICIENT_DATA (missing profile / target goal)
 *
 * @param {Object} context - Copilot context
 * @param {Object} behaviorSignals
 * @param {Array<Object>} activeApplications
 * @returns {Object} Mode decision { mode, modeReason, focusArea }
 */
function determineAdaptiveMode(context = {}, behaviorSignals = {}, activeApplications = []) {
  const now = new Date();

  // Guard: Check for minimum foundation
  const targetRole = context.careerGoal?.targetRole;
  const skillsCount = context.skills?.totalSkills ?? 0;
  const profileCompletion = context.profile?.profileCompletion ?? 0;

  if (!targetRole || skillsCount === 0 || profileCompletion < 30) {
    return {
      mode: ADAPTIVE_MODES.INSUFFICIENT_DATA,
      modeReason: 'Target career role and foundational skills are not yet fully configured.',
      focusArea: 'Foundation & Profile Setup',
    };
  }

  // Priority 1: DEADLINE_MODE (<= 48h deadline)
  // Check applications with upcoming deadlines
  const appsWithUpcomingDeadline = (activeApplications || []).filter((app) => {
    if (!app.deadline) return false;
    const deadlineDate = new Date(app.deadline);
    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 48;
  });

  if (appsWithUpcomingDeadline.length > 0) {
    const nearestApp = appsWithUpcomingDeadline[0];
    const company = nearestApp.company || nearestApp.opportunity?.company || 'Target Company';
    return {
      mode: ADAPTIVE_MODES.DEADLINE_MODE,
      modeReason: `Critical application deadline for ${company} is within 48 hours.`,
      focusArea: `Application Finalization: ${company}`,
    };
  }

  // Priority 2: INTERVIEW_MODE (<= 7d upcoming interview)
  const appsWithInterview = (activeApplications || []).filter((app) => {
    if (!app.interviewDate) return false;
    const interviewTime = new Date(app.interviewDate).getTime();
    const diffDays = (interviewTime - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 7 && app.status !== 'REJECTED' && app.status !== 'OFFER';
  });

  if (appsWithInterview.length > 0) {
    const interviewApp = appsWithInterview[0];
    const company = interviewApp.company || interviewApp.opportunity?.company || 'Company';
    return {
      mode: ADAPTIVE_MODES.INTERVIEW_MODE,
      modeReason: `Interview scheduled with ${company} within the next 7 days.`,
      focusArea: `Interview Preparation: ${company}`,
    };
  }

  // Priority 3: EXECUTION_RECOVERY
  if (
    behaviorSignals.totalTasks >= 3 &&
    behaviorSignals.completionRate !== null &&
    (behaviorSignals.completionRate < 50 ||
      behaviorSignals.overdueCount >= 3 ||
      behaviorSignals.velocityTrend === 'CRITICAL_DROP')
  ) {
    const reasonParts = [];
    if (behaviorSignals.completionRate < 50) {
      reasonParts.push(`completion rate is ${behaviorSignals.completionRate}%`);
    }
    if (behaviorSignals.overdueCount >= 3) {
      reasonParts.push(`${behaviorSignals.overdueCount} tasks are overdue`);
    }
    if (behaviorSignals.velocityTrend === 'CRITICAL_DROP') {
      reasonParts.push(`execution velocity dropped sharply`);
    }

    return {
      mode: ADAPTIVE_MODES.EXECUTION_RECOVERY,
      modeReason: `Execution recovery activated: ${reasonParts.join(', ')}. Calibrating workload to restore consistent momentum.`,
      focusArea: 'Execution Cadence Recovery',
    };
  }

  // Priority 4: SKILL_GAP_CLOSURE
  const missingSkills = context.skillGap?.missingSkills || [];
  const coveragePercentage = context.skillGap?.coveragePercentage;
  if (missingSkills.length >= 2 || (coveragePercentage !== undefined && coveragePercentage < 60)) {
    const topGap = missingSkills.slice(0, 2).map((s) => (typeof s === 'string' ? s : s.name)).join(', ');
    return {
      mode: ADAPTIVE_MODES.SKILL_GAP_CLOSURE,
      modeReason: `Critical skill gaps identified for ${targetRole}: ${topGap || 'Core competencies missing'}.`,
      focusArea: `Skill Gap Closure: ${topGap || 'Core Skills'}`,
    };
  }

  // Priority 5: PROJECT_EXECUTION
  const inProgressProjects = (context.projects?.projects || []).filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNED'
  );
  if (inProgressProjects.length > 0) {
    const activeProject = inProgressProjects[0];
    return {
      mode: ADAPTIVE_MODES.PROJECT_EXECUTION,
      modeReason: `Active project "${activeProject.title}" has pending implementation milestones.`,
      focusArea: `Project Implementation: ${activeProject.title}`,
    };
  }

  // Priority 6: APPLICATION_CAMPAIGN
  const readinessScore = context.careerReadiness?.score ?? 0;
  const activeAppCount = (activeApplications || []).filter(
    (a) => a.status === 'APPLIED' || a.status === 'INTERVIEW'
  ).length;

  if (readinessScore >= 65 && activeAppCount <= 1) {
    return {
      mode: ADAPTIVE_MODES.APPLICATION_CAMPAIGN,
      modeReason: `Career readiness is strong (${readinessScore}%) with few active applications (${activeAppCount}). Opportunity to scale outreach.`,
      focusArea: 'Application Pipeline & Outreach',
    };
  }

  // Priority 7: NORMAL
  return {
    mode: ADAPTIVE_MODES.NORMAL,
    modeReason: 'Balanced execution rhythm across skill development, portfolio building, and career prep.',
    focusArea: 'Balanced Career Acceleration',
  };
}

/* ─── 4. Task Sizing Adaptation ──────────────────────────────────── */

/**
 * Adapts task duration based on cognitive friction and category history.
 * Bound strictly between 5 and 180 minutes.
 *
 * @param {Object} task
 * @param {Object} frictionSummary
 * @returns {Object} { adaptedMinutes, sizingAdjustmentReason }
 */
function computeTaskSizeAdaptation(task, frictionSummary = []) {
  const original = Math.min(480, Math.max(5, task.estimatedMinutes || 45));
  const cat = task.category || 'CAREER';

  const catFriction = frictionSummary.find((f) => f.category === cat);

  let adaptedMinutes = original;
  let sizingAdjustmentReason = 'Standard task duration maintained.';

  if (catFriction && catFriction.frictionLevel === 'HIGH') {
    adaptedMinutes = Math.max(15, Math.min(45, Math.round(original * 0.6)));
    sizingAdjustmentReason = `Task duration reduced by 40% (to ${adaptedMinutes}m) to eliminate activation friction in ${cat}.`;
  } else if (catFriction && catFriction.frictionLevel === 'MODERATE') {
    adaptedMinutes = Math.max(20, Math.min(60, Math.round(original * 0.75)));
    sizingAdjustmentReason = `Task duration trimmed by 25% (to ${adaptedMinutes}m) for smoother start in ${cat}.`;
  } else if (task.actualMinutes && task.actualMinutes > original * 1.5) {
    adaptedMinutes = Math.min(180, Math.round(task.actualMinutes));
    sizingAdjustmentReason = `Task duration adjusted to match your historical completion pace (${adaptedMinutes}m).`;
  } else if (original > 120) {
    adaptedMinutes = 90;
    sizingAdjustmentReason = 'Split multi-hour block into focused 90-minute milestone for better cognitive retention.';
  }

  return {
    adaptedMinutes,
    sizingAdjustmentReason,
  };
}

/* ─── 5. Workload Adaptation ──────────────────────────────────────── */

/**
 * Calibrates weekly hours recommendation based on execution completion rate.
 * Range: 5 to 15 hours per week (default baseline: 10h).
 * Gradual ramping: max 1.5h increase per week to prevent burnout.
 *
 * @param {Object} behaviorSignals
 * @param {string} mode
 * @returns {Object} { recommendedHours, dailyHoursTarget, deltaHours, reason }
 */
function computeWorkloadAdaptation(behaviorSignals = {}, mode = ADAPTIVE_MODES.NORMAL) {
  const BASELINE_HOURS = 10;
  let recommendedHours = BASELINE_HOURS;
  let deltaHours = 0;
  let reason = 'Baseline workload of 10h/week maintained.';

  const compRate = behaviorSignals.completionRate;

  if (mode === ADAPTIVE_MODES.EXECUTION_RECOVERY) {
    recommendedHours = 6;
    deltaHours = -4;
    reason = 'Workload reduced to 6h/week (~1.2h/day) to clear overdue friction and re-establish a reliable execution streak.';
  } else if (mode === ADAPTIVE_MODES.DEADLINE_MODE) {
    recommendedHours = 14;
    deltaHours = 4;
    reason = 'Workload temporarily increased to 14h/week focused exclusively on immediate deadline completion.';
  } else if (mode === ADAPTIVE_MODES.INTERVIEW_MODE) {
    recommendedHours = 12;
    deltaHours = 2;
    reason = 'Workload calibrated to 12h/week to accommodate dedicated mock interviews and technical review.';
  } else if (compRate === null) {
    recommendedHours = BASELINE_HOURS;
    deltaHours = 0;
    reason = 'Initial 10h/week baseline applied while execution history is establishing.';
  } else if (compRate >= 85) {
    recommendedHours = 12; // Gradual 2h step, capped at 15
    deltaHours = 2;
    reason = `Consistent execution performance (${compRate}% completion) unlocks a +2h capacity scale to 12h/week.`;
  } else if (compRate >= 65) {
    recommendedHours = BASELINE_HOURS;
    deltaHours = 0;
    reason = `Execution is steady (${compRate}% completion). Maintaining balanced 10h/week target.`;
  } else if (compRate < 50) {
    recommendedHours = 7;
    deltaHours = -3;
    reason = `Completion rate (${compRate}%) suggests schedule pressure; workload reduced to 7h/week for manageable momentum.`;
  }

  // Safety caps: never below 5, never above 15
  recommendedHours = Math.max(5, Math.min(15, recommendedHours));
  const dailyHoursTarget = Number((recommendedHours / 5).toFixed(1));

  return {
    recommendedHours,
    dailyHoursTarget,
    deltaHours,
    reason,
  };
}

/* ─── 6. Dynamic Priority Re-Ranking ──────────────────────────────── */

/**
 * Computes category priority weights and adjustments according to the active mode and friction.
 *
 * @param {string} mode
 * @param {Array<Object>} frictionSummary
 * @returns {Array<Object>} priorityAdjustments [{ category, weightChange, reason }]
 */
function reRankPriorities(mode, frictionSummary = []) {
  const adjustments = [];

  switch (mode) {
    case ADAPTIVE_MODES.INTERVIEW_MODE:
      adjustments.push(
        { category: 'INTERVIEW', weightChange: 50, reason: 'Top priority: scheduled upcoming interview round.' },
        { category: 'DSA', weightChange: 25, reason: 'Technical algorithm and problem solving practice for interview.' },
        { category: 'RESUME', weightChange: 15, reason: 'Review talk tracks and resume bullet point walkthroughs.' },
        { category: 'APPLICATION', weightChange: -30, reason: 'Pause new applications to focus 100% on interview conversion.' }
      );
      break;

    case ADAPTIVE_MODES.DEADLINE_MODE:
      adjustments.push(
        { category: 'APPLICATION', weightChange: 60, reason: 'Urgent: Complete and submit application materials before cutoff.' },
        { category: 'RESUME', weightChange: 30, reason: 'Tailor resume bullets to exact job description keywords.' },
        { category: 'DSA', weightChange: -30, reason: 'Temporarily deprioritized until deadline passes.' },
        { category: 'ROADMAP', weightChange: -20, reason: 'Paused broad curriculum in favor of deadline delivery.' }
      );
      break;

    case ADAPTIVE_MODES.EXECUTION_RECOVERY:
      adjustments.push(
        { category: 'CAREER', weightChange: 20, reason: 'Short, high-confidence planning sessions to reset trajectory.' },
        { category: 'ROADMAP', weightChange: 15, reason: 'Execute single bite-sized milestone to rebuild consistency.' }
      );
      frictionSummary.forEach((f) => {
        if (f.frictionLevel === 'HIGH') {
          adjustments.push({
            category: f.category,
            weightChange: -25,
            reason: `High skip resistance detected in ${f.category}; reduced cognitive weight.`,
          });
        }
      });
      break;

    case ADAPTIVE_MODES.SKILL_GAP_CLOSURE:
      adjustments.push(
        { category: 'SKILL', weightChange: 45, reason: 'Acquire missing core competencies required for target role.' },
        { category: 'ROADMAP', weightChange: 30, reason: 'Follow structured curriculum modules targeting verified gaps.' },
        { category: 'PROJECT', weightChange: 20, reason: 'Reinforce learned skills through hands-on implementation.' },
        { category: 'APPLICATION', weightChange: -25, reason: 'Shift focus to qualifying skills before scaling applications.' }
      );
      break;

    case ADAPTIVE_MODES.PROJECT_EXECUTION:
      adjustments.push(
        { category: 'PROJECT', weightChange: 50, reason: 'Complete pending milestones on active portfolio project.' },
        { category: 'GITHUB', weightChange: 30, reason: 'Ship clean commits and maintain consistent code contribution history.' },
        { category: 'SKILL', weightChange: 15, reason: 'Apply technical skills directly to project features.' }
      );
      break;

    case ADAPTIVE_MODES.APPLICATION_CAMPAIGN:
      adjustments.push(
        { category: 'APPLICATION', weightChange: 45, reason: 'High readiness score unlocks proactive application outreach.' },
        { category: 'RESUME', weightChange: 25, reason: 'Refine keyword alignment and proofread application submissions.' },
        { category: 'INTERVIEW', weightChange: 20, reason: 'Begin preliminary behavioral story framing.' }
      );
      break;

    case ADAPTIVE_MODES.INSUFFICIENT_DATA:
      adjustments.push(
        { category: 'CAREER', weightChange: 50, reason: 'Define target job role and set career milestone parameters.' },
        { category: 'SKILL', weightChange: 40, reason: 'Self-assess current technical skills to populate skill profile.' }
      );
      break;

    case ADAPTIVE_MODES.NORMAL:
    default:
      adjustments.push(
        { category: 'SKILL', weightChange: 10, reason: 'Steady ongoing skill development.' },
        { category: 'PROJECT', weightChange: 10, reason: 'Progressive portfolio enhancement.' },
        { category: 'DSA', weightChange: 10, reason: 'Consistent problem solving practice.' }
      );
      break;
  }

  return adjustments;
}

/* ─── 7. Strategic Task Generation (Fallback / Synthesis) ────────── */

function buildStrategicTaskRecommendations(mode, focusArea, context, existingTasks = [], frictionSummary = []) {
  const recommendations = [];

  // 1. If existing tasks exist, adapt and prioritize them
  if (existingTasks && existingTasks.length > 0) {
    existingTasks.forEach((task) => {
      const { adaptedMinutes, sizingAdjustmentReason } = computeTaskSizeAdaptation(task, frictionSummary);
      recommendations.push({
        taskId: task._id || null,
        title: task.title,
        category: task.category || 'CAREER',
        priority: task.priority || 'MEDIUM',
        originalMinutes: task.estimatedMinutes || 45,
        adaptedMinutes,
        sizingAdjustmentReason,
        urgency:
          mode === ADAPTIVE_MODES.DEADLINE_MODE
            ? 'CRITICAL'
            : mode === ADAPTIVE_MODES.INTERVIEW_MODE
            ? 'URGENT'
            : 'STANDARD',
        scheduledDate: task.scheduledDate || new Date(),
        status: task.status || 'PLANNED',
      });
    });
  }

  // 2. If fewer than 3 tasks exist, synthesize high-leverage adaptive tasks tailored to mode
  if (recommendations.length < 3) {
    const targetRole = context.careerGoal?.targetRole || 'Software Engineer';
    const missingSkills = (context.skillGap?.missingSkills || []).map((s) =>
      typeof s === 'string' ? s : s.name
    );

    if (mode === ADAPTIVE_MODES.INTERVIEW_MODE) {
      recommendations.push({
        title: `Mock Interview & System Design Walkthrough (${targetRole})`,
        category: 'INTERVIEW',
        priority: 'URGENT',
        originalMinutes: 60,
        adaptedMinutes: 45,
        sizingAdjustmentReason: 'Focused 45-minute simulation for interview readiness.',
        urgency: 'URGENT',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
      recommendations.push({
        title: 'Review Behavioral STAR Stories & Resume Highlights',
        category: 'INTERVIEW',
        priority: 'HIGH',
        originalMinutes: 45,
        adaptedMinutes: 30,
        sizingAdjustmentReason: 'Structured 30m behavioral polish block.',
        urgency: 'URGENT',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else if (mode === ADAPTIVE_MODES.DEADLINE_MODE) {
      recommendations.push({
        title: 'Finalize Application Submission & Requirements Checklist',
        category: 'APPLICATION',
        priority: 'URGENT',
        originalMinutes: 60,
        adaptedMinutes: 45,
        sizingAdjustmentReason: 'Urgent deadline wrap-up block.',
        urgency: 'CRITICAL',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else if (mode === ADAPTIVE_MODES.EXECUTION_RECOVERY) {
      recommendations.push({
        title: 'Complete 25-Minute Quick Win Execution Session',
        category: 'CAREER',
        priority: 'HIGH',
        originalMinutes: 45,
        adaptedMinutes: 25,
        sizingAdjustmentReason: 'Short 25m Pomodoro chunk designed to build effortless activation momentum.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
      recommendations.push({
        title: 'Review and Prune Overdue Task Backlog',
        category: 'CAREER',
        priority: 'MEDIUM',
        originalMinutes: 30,
        adaptedMinutes: 20,
        sizingAdjustmentReason: 'Quick 20m backlog declutter.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else if (mode === ADAPTIVE_MODES.SKILL_GAP_CLOSURE) {
      const topSkill = missingSkills[0] || 'Target Competency';
      recommendations.push({
        title: `Foundational Tutorial & Concept Deep Dive: ${topSkill}`,
        category: 'SKILL',
        priority: 'HIGH',
        originalMinutes: 60,
        adaptedMinutes: 45,
        sizingAdjustmentReason: 'Calibrated 45m focused learning block.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
      recommendations.push({
        title: `Hands-on Code Exercise: Implement ${topSkill} mini-module`,
        category: 'SKILL',
        priority: 'MEDIUM',
        originalMinutes: 60,
        adaptedMinutes: 40,
        sizingAdjustmentReason: 'Applied practical coding chunk to solidify learning.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else if (mode === ADAPTIVE_MODES.PROJECT_EXECUTION) {
      recommendations.push({
        title: 'Implement Core Feature Milestone for Active Project',
        category: 'PROJECT',
        priority: 'HIGH',
        originalMinutes: 90,
        adaptedMinutes: 60,
        sizingAdjustmentReason: 'Sized to 60m focused feature milestone.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else if (mode === ADAPTIVE_MODES.APPLICATION_CAMPAIGN) {
      recommendations.push({
        title: 'Identify & Target 3 Relevant Job Openings',
        category: 'APPLICATION',
        priority: 'HIGH',
        originalMinutes: 60,
        adaptedMinutes: 40,
        sizingAdjustmentReason: 'Targeted search block without endless scrolling.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    } else {
      recommendations.push({
        title: 'Solve 1 Core DSA Problem & Document Solution Pattern',
        category: 'DSA',
        priority: 'MEDIUM',
        originalMinutes: 45,
        adaptedMinutes: 35,
        sizingAdjustmentReason: 'Standard 35m algorithm practice block.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
      recommendations.push({
        title: 'Advance Portfolio Project Feature & Git Commit',
        category: 'PROJECT',
        priority: 'MEDIUM',
        originalMinutes: 60,
        adaptedMinutes: 45,
        sizingAdjustmentReason: 'Structured 45m project execution block.',
        urgency: 'STANDARD',
        scheduledDate: new Date(),
        status: 'PLANNED',
      });
    }
  }

  return recommendations;
}

/* ─── 8. Generate Adaptive Weekly Plan ───────────────────────────── */

/**
 * Builds the complete deterministic adaptive weekly plan.
 *
 * @param {string|ObjectId} userId
 * @param {Object} options
 * @returns {Promise<Object>} Adaptive Weekly Plan
 */
async function generateAdaptiveWeeklyPlan(userId, options = {}) {
  const { weekStart, weekEnd } = getWeekRange(options.targetDate || new Date());

  // Concurrently fetch real user execution tasks and copilot context
  const [context, userTasks, userApplications] = await Promise.all([
    buildCopilotContext(userId).catch(() => ({})),
    ExecutionTask.find({ user: userId })
      .sort({ scheduledDate: -1, createdAt: -1 })
      .limit(50)
      .lean()
      .catch(() => []),
    Application.find({ user: userId })
      .populate('opportunity')
      .lean()
      .catch(() => []),
  ]);

  // 1. Analyze behavioral signals
  const behaviorSignals = analyzeBehaviorSignals(userTasks);

  // 2. Detect execution friction
  const frictionSummary = detectExecutionFriction(behaviorSignals, userTasks);

  // 3. Determine active adaptive mode
  const { mode, modeReason, focusArea } = determineAdaptiveMode(
    context,
    behaviorSignals,
    userApplications
  );

  // 4. Compute workload adaptation
  const workload = computeWorkloadAdaptation(behaviorSignals, mode);

  // 5. Re-rank priorities
  const priorityAdjustments = reRankPriorities(mode, frictionSummary);

  // 6. Filter active tasks for current week / pending
  const activeWeekTasks = userTasks.filter((t) => {
    const isPending = t.status === 'PLANNED' || t.status === 'IN_PROGRESS';
    if (!isPending) return false;
    if (!t.scheduledDate) return true;
    const s = new Date(t.scheduledDate);
    return s <= weekEnd;
  });

  // 7. Adapt task recommendations
  const taskRecommendations = buildStrategicTaskRecommendations(
    mode,
    focusArea,
    context,
    activeWeekTasks.slice(0, 10),
    frictionSummary
  );

  // 8. Synthesize week objectives
  const objectives = [];
  if (mode === ADAPTIVE_MODES.INTERVIEW_MODE) {
    objectives.push('Master technical and behavioral communication for upcoming interview');
    objectives.push('Conduct at least 1 mock interview session');
    objectives.push('Review company background and targeted technical questions');
  } else if (mode === ADAPTIVE_MODES.DEADLINE_MODE) {
    objectives.push('Submit polished application before deadline cutoff');
    objectives.push('Verify all portfolio links and resume bullet keyword alignment');
  } else if (mode === ADAPTIVE_MODES.EXECUTION_RECOVERY) {
    objectives.push('Complete daily 25-minute execution sessions with 100% adherence');
    objectives.push('Prune overdue task backlog to eliminate cognitive friction');
    objectives.push('Re-establish a 3-day consecutive task completion streak');
  } else if (mode === ADAPTIVE_MODES.SKILL_GAP_CLOSURE) {
    objectives.push(`Close verified skill gaps in core competencies`);
    objectives.push('Build a demonstrable code artifact using newly learned skills');
    objectives.push('Update skill profile and link verification evidence');
  } else if (mode === ADAPTIVE_MODES.PROJECT_EXECUTION) {
    objectives.push('Ship active project milestone with clean code and tests');
    objectives.push('Maintain consistent GitHub commit activity');
  } else if (mode === ADAPTIVE_MODES.APPLICATION_CAMPAIGN) {
    objectives.push('Submit tailored applications to targeted job openings');
    objectives.push('Engage in 2 networking or alumni outreach conversations');
  } else if (mode === ADAPTIVE_MODES.INSUFFICIENT_DATA) {
    objectives.push('Select target job role and desired career track');
    objectives.push('Add existing technical skills to establish baseline coverage');
  } else {
    objectives.push('Maintain balanced weekly execution rhythm (~10 hours)');
    objectives.push('Advance 1 core portfolio project milestone');
    objectives.push('Solve 3-5 algorithm problems to preserve DSA sharpness');
  }

  // 9. Risk adjustments
  const riskAdjustments = [];
  if (behaviorSignals.overdueCount > 0) {
    riskAdjustments.push(`${behaviorSignals.overdueCount} overdue tasks have been flagged for rescheduling.`);
  }
  if (behaviorSignals.skipRate !== null && behaviorSignals.skipRate >= 30) {
    riskAdjustments.push(`High skip rate (${behaviorSignals.skipRate}%) detected; task durations were downscaled.`);
  }
  if (workload.deltaHours !== 0) {
    riskAdjustments.push(`Weekly workload adjusted by ${workload.deltaHours > 0 ? '+' : ''}${workload.deltaHours}h.`);
  }

  // 10. Confidence calculation (0 - 100)
  let confidence = 70;
  if (mode === ADAPTIVE_MODES.INSUFFICIENT_DATA) {
    confidence = 30;
  } else {
    if (userTasks.length >= 10) confidence += 15;
    else if (userTasks.length >= 3) confidence += 5;
    else confidence -= 10;

    if (context.profile?.profileCompletion >= 70) confidence += 10;
    if (context.skillGap?.missingSkills) confidence += 5;
  }
  confidence = Math.max(20, Math.min(95, confidence));

  return {
    weekStart,
    weekEnd,
    mode,
    modeReason,
    focusArea,
    recommendedHours: workload.recommendedHours,
    dailyHoursTarget: workload.dailyHoursTarget,
    workloadReason: workload.reason,
    objectives,
    taskRecommendations,
    priorityAdjustments,
    frictionSummary,
    behaviorSummary: {
      completionRate: behaviorSignals.completionRate,
      skipRate: behaviorSignals.skipRate,
      overdueCount: behaviorSignals.overdueCount,
      avgCompletionTimeMinutes: behaviorSignals.avgCompletionTimeMinutes,
      mostSkippedCategory: behaviorSignals.mostSkippedCategory,
      mostActiveCategory: behaviorSignals.mostActiveCategory,
      velocityTrend: behaviorSignals.velocityTrend,
    },
    riskAdjustments,
    adaptationReason: workload.reason,
    confidence,
    planPreference: 'ADAPTIVE',
    isPaused: false,
    generatedAt: new Date(),
  };
}

/* ─── 9. Generate Adaptive Daily Plan ────────────────────────────── */

/**
 * Extracts a daily slice from the adaptive weekly plan.
 *
 * @param {string|ObjectId} userId
 * @param {Object} options
 * @returns {Promise<Object>} Adaptive Daily Plan
 */
async function generateAdaptiveDailyPlan(userId, options = {}) {
  const weeklyPlan = await generateAdaptiveWeeklyPlan(userId, options);

  const dailyMinutesTarget = Math.round((weeklyPlan.recommendedHours * 60) / 5);
  let accumulatedMinutes = 0;
  const todaysTasks = [];

  for (const task of weeklyPlan.taskRecommendations) {
    const minutes = task.adaptedMinutes || 30;
    if (accumulatedMinutes + minutes <= dailyMinutesTarget + 30 || todaysTasks.length === 0) {
      todaysTasks.push(task);
      accumulatedMinutes += minutes;
    }
    if (todaysTasks.length >= 4) break;
  }

  return {
    date: options.targetDate ? new Date(options.targetDate) : new Date(),
    mode: weeklyPlan.mode,
    modeReason: weeklyPlan.modeReason,
    focusArea: weeklyPlan.focusArea,
    dailyHoursTarget: weeklyPlan.dailyHoursTarget,
    targetMinutes: dailyMinutesTarget,
    allocatedMinutes: accumulatedMinutes,
    tasks: todaysTasks,
    frictionSummary: weeklyPlan.frictionSummary,
    confidence: weeklyPlan.confidence,
    planPreference: weeklyPlan.planPreference,
    isPaused: weeklyPlan.isPaused,
  };
}

/* ─── 10. Snapshot Persistence & Deduplication ───────────────────── */

/**
 * Persists an adaptive plan snapshot, deduplicating within 24 hours unless forced.
 *
 * @param {string|ObjectId} userId
 * @param {Object} options - { forceRefresh: boolean }
 * @returns {Promise<Object>} Snapshot document
 */
async function getOrRecordAdaptiveSnapshot(userId, options = {}) {
  const { forceRefresh = false } = options;
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check for recent snapshot
  if (!forceRefresh) {
    const existingSnapshot = await AdaptivePlanSnapshot.findOne({
      user: userId,
      generatedAt: { $gte: twentyFourHoursAgo },
    })
      .sort({ generatedAt: -1 })
      .lean();

    if (existingSnapshot) {
      return existingSnapshot;
    }
  }

  // Generate fresh plan
  const plan = await generateAdaptiveWeeklyPlan(userId, options);

  // Preserve user preferences if previous snapshot exists
  const lastSnapshot = await AdaptivePlanSnapshot.findOne({ user: userId })
    .sort({ generatedAt: -1 })
    .lean();

  const planPreference = lastSnapshot?.planPreference || 'ADAPTIVE';
  const isPaused = lastSnapshot?.isPaused || false;

  const snapshotData = {
    user: userId,
    weekStart: plan.weekStart,
    weekEnd: plan.weekEnd,
    mode: plan.mode,
    modeReason: plan.modeReason,
    focusArea: plan.focusArea,
    recommendedHours: plan.recommendedHours,
    objectives: plan.objectives,
    taskRecommendations: plan.taskRecommendations,
    priorityAdjustments: plan.priorityAdjustments,
    frictionSummary: plan.frictionSummary,
    behaviorSummary: plan.behaviorSummary,
    riskAdjustments: plan.riskAdjustments,
    adaptationReason: plan.adaptationReason,
    confidence: plan.confidence,
    planPreference,
    isPaused,
    generatedAt: now,
  };

  const savedSnapshot = await AdaptivePlanSnapshot.create(snapshotData);
  return savedSnapshot.toObject();
}

/* ─── 11. Preference Updates ─────────────────────────────────────── */

/**
 * Updates user preference between ADAPTIVE and STANDARD plans, or toggles pause state.
 *
 * @param {string|ObjectId} userId
 * @param {Object} preferences - { planPreference, isPaused }
 * @returns {Promise<Object>} Updated snapshot
 */
async function updateAdaptivePreference(userId, preferences = {}) {
  const { planPreference, isPaused } = preferences;

  const update = {};
  if (planPreference && ['ADAPTIVE', 'STANDARD'].includes(planPreference)) {
    update.planPreference = planPreference;
  }
  if (typeof isPaused === 'boolean') {
    update.isPaused = isPaused;
  }

  // Update latest snapshot or create one if none exists
  let snapshot = await AdaptivePlanSnapshot.findOne({ user: userId }).sort({ generatedAt: -1 });

  if (snapshot) {
    Object.assign(snapshot, update);
    await snapshot.save();
    return snapshot.toObject();
  }

  // If no snapshot exists yet, generate one with these preferences
  const newSnapshotData = await generateAdaptiveWeeklyPlan(userId);
  const created = await AdaptivePlanSnapshot.create({
    ...newSnapshotData,
    user: userId,
    ...update,
    generatedAt: new Date(),
  });

  return created.toObject();
}

module.exports = {
  ADAPTIVE_MODES,
  getWeekRange,
  analyzeBehaviorSignals,
  detectExecutionFriction,
  determineAdaptiveMode,
  computeTaskSizeAdaptation,
  computeWorkloadAdaptation,
  reRankPriorities,
  generateAdaptiveWeeklyPlan,
  generateAdaptiveDailyPlan,
  getOrRecordAdaptiveSnapshot,
  updateAdaptivePreference,
};
