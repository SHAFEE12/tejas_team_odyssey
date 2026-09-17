/**
 * reminder.service.js
 *
 * Business logic for Reminder management and deterministic System Reminder generation.
 *
 * Rules:
 * - Deterministic duplicate prevention via unique duplicateKey.
 * - Idempotent: repeated calls do NOT create duplicate reminders.
 * - Respects completed/dismissed status: dismissing a system reminder keeps it dismissed.
 * - Real data only: NO fake deadlines, NO invented interviews, NO fabricated activity.
 */

const Reminder = require('../models/Reminder');

const VALID_TYPES = [
  'APPLICATION',
  'INTERVIEW',
  'DEADLINE',
  'ROADMAP',
  'DSA',
  'PROJECT',
  'RESUME',
  'GITHUB',
  'CUSTOM',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const VALID_STATUSES = ['PENDING', 'COMPLETED', 'DISMISSED'];

/**
 * Calculates priority based on proximity to due date
 */
function calculateReminderPriority(dueAt, basePriority = 'MEDIUM') {
  if (!dueAt) return basePriority;
  const dueTime = new Date(dueAt).getTime();
  const diffHours = (dueTime - Date.now()) / (1000 * 60 * 60);

  if (diffHours <= 24) return 'URGENT';
  if (diffHours <= 72) return 'HIGH';
  return basePriority;
}

/**
 * Checks if a reminder is currently overdue
 */
function isReminderOverdue(reminder) {
  if (!reminder.dueAt || reminder.status !== 'PENDING') return false;
  return new Date(reminder.dueAt).getTime() < Date.now();
}

/**
 * Determines bucket key for date-based duplicate prevention (YYYY-MM-DD)
 */
function getDateBucket(date) {
  if (!date) return 'undated';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return 'undated';
  }
}

/**
 * Synthesizes deterministic system reminders from authentic stored student data.
 *
 * @param {Object} context
 * @param {ObjectId} context.userId
 * @param {Array} context.applications
 * @param {Object} context.roadmap
 * @param {Array} context.projects
 * @param {Object} context.resume
 * @param {Object} context.dsaProfile
 * @param {Object} context.gitHubProfile
 * @param {Object} context.skillProfile
 * @returns {Promise<Array>} Newly inserted reminders
 */
async function syncSystemReminders({
  userId,
  applications = [],
  roadmap = null,
  projects = [],
  resume = null,
  dsaProfile = null,
  gitHubProfile = null,
  skillProfile = null,
}) {
  if (!userId) return [];

  const candidates = [];

  // 1. APPLICATION DEADLINES (Only when real deadline exists on an active application)
  for (const app of applications) {
    if (app.deadline && ['SAVED', 'PLANNING', 'APPLIED', 'OA'].includes(app.status)) {
      const dueTime = new Date(app.deadline).getTime();
      const diffDays = (dueTime - Date.now()) / (1000 * 60 * 60 * 24);

      // Only remind if within next 14 days or overdue within 3 days
      if (diffDays >= -3 && diffDays <= 14) {
        const dueBucket = getDateBucket(app.deadline);
        const duplicateKey = `SYSTEM_Application_${app._id}_DEADLINE_${dueBucket}`;
        const priority = calculateReminderPriority(app.deadline, 'HIGH');
        const company = app.opportunity?.company || 'Employer';
        const role = app.opportunity?.title || 'Position';

        candidates.push({
          user: userId,
          title: `Application Deadline: ${company}`,
          description: `Submit your application for ${role} before the recorded deadline.`,
          type: 'DEADLINE',
          priority,
          status: 'PENDING',
          dueAt: app.deadline,
          relatedEntityType: 'Application',
          relatedEntityId: String(app._id),
          source: 'SYSTEM',
          duplicateKey,
          estimatedMinutes: 30,
        });
      }
    }
  }

  // 2. INTERVIEW REMINDERS (Only when real interviewDate exists)
  for (const app of applications) {
    if (app.interviewDate && ['OA', 'INTERVIEW', 'FINAL_ROUND'].includes(app.status)) {
      const interviewTime = new Date(app.interviewDate).getTime();
      const diffDays = (interviewTime - Date.now()) / (1000 * 60 * 60 * 24);

      if (diffDays >= -1 && diffDays <= 14) {
        const dateBucket = getDateBucket(app.interviewDate);
        const duplicateKey = `SYSTEM_Application_${app._id}_INTERVIEW_${dateBucket}`;
        const priority = calculateReminderPriority(app.interviewDate, 'HIGH');
        const company = app.opportunity?.company || 'Employer';
        const role = app.opportunity?.title || 'Target Role';

        candidates.push({
          user: userId,
          title: `Interview Preparation: ${company}`,
          description: `Prepare technical and behavioral talking points for your ${role} interview.`,
          type: 'INTERVIEW',
          priority,
          status: 'PENDING',
          dueAt: app.interviewDate,
          relatedEntityType: 'Application',
          relatedEntityId: String(app._id),
          source: 'SYSTEM',
          duplicateKey,
          estimatedMinutes: 60,
        });
      }
    }
  }

  // 3. ROADMAP TASKS (In-progress or critical next tasks)
  if (roadmap && roadmap.tasks && roadmap.tasks.length > 0) {
    const activeTask = roadmap.tasks.find((t) => t.status === 'IN_PROGRESS') ||
      roadmap.tasks.find((t) => t.status === 'NOT_STARTED');

    if (activeTask) {
      const duplicateKey = `SYSTEM_RoadmapTask_${activeTask.taskId}`;
      const priority = activeTask.priority === 'HIGH' ? 'HIGH' : 'MEDIUM';

      candidates.push({
        user: userId,
        title: `Roadmap: ${activeTask.title}`,
        description: `Advance Phase ${activeTask.phaseNumber} (${activeTask.phaseTitle}). Priority: ${activeTask.priority}.`,
        type: 'ROADMAP',
        priority,
        status: 'PENDING',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        relatedEntityType: 'RoadmapTask',
        relatedEntityId: activeTask.taskId,
        source: 'SYSTEM',
        duplicateKey,
        estimatedMinutes: 45,
      });
    }
  }

  // 4. PROJECT EVIDENCE GAPS
  if (projects && projects.length > 0) {
    // Check for project missing GitHub repository link
    const unlinkedProj = projects.find(
      (p) => (p.status === 'IN_PROGRESS' || p.status === 'COMPLETED') && !p.github?.url
    );
    if (unlinkedProj) {
      const duplicateKey = `SYSTEM_Project_${unlinkedProj._id}_GITHUB`;
      candidates.push({
        user: userId,
        title: `Connect Repository: ${unlinkedProj.title}`,
        description: 'Link your GitHub repository to verify public code evidence for recruiters.',
        type: 'GITHUB',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        relatedEntityType: 'Project',
        relatedEntityId: String(unlinkedProj._id),
        source: 'SYSTEM',
        duplicateKey,
        estimatedMinutes: 20,
      });
    }

    // Check for completed project missing live deployment
    const undeployedProj = projects.find(
      (p) => p.status === 'COMPLETED' && !p.deployment?.url
    );
    if (undeployedProj) {
      const duplicateKey = `SYSTEM_Project_${undeployedProj._id}_DEPLOY`;
      candidates.push({
        user: userId,
        title: `Deploy Demo: ${undeployedProj.title}`,
        description: 'Publish a live deployment link so recruiters and evaluators can demo your project.',
        type: 'PROJECT',
        priority: 'LOW',
        status: 'PENDING',
        dueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        relatedEntityType: 'Project',
        relatedEntityId: String(undeployedProj._id),
        source: 'SYSTEM',
        duplicateKey,
        estimatedMinutes: 45,
      });
    }
  }

  // 5. RESUME REMINDERS
  if (!resume || resume.status !== 'completed') {
    const duplicateKey = 'SYSTEM_Resume_UPLOAD';
    candidates.push({
      user: userId,
      title: 'Upload Your Resume',
      description: 'Upload your resume for ATS scoring and skill evidence extraction.',
      type: 'RESUME',
      priority: 'HIGH',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      relatedEntityType: 'Resume',
      relatedEntityId: null,
      source: 'SYSTEM',
      duplicateKey,
      estimatedMinutes: 25,
    });
  } else if (resume.analysis && (resume.analysis.atsScore < 70 || resume.analysis.overallScore < 70)) {
    const dateBucket = getDateBucket(resume.analyzedAt || Date.now());
    const duplicateKey = `SYSTEM_Resume_IMPROVE_${dateBucket}`;
    candidates.push({
      user: userId,
      title: 'Improve Resume ATS Score',
      description: 'Review ATS recommendations to address missing skills and improve keyword match.',
      type: 'RESUME',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      relatedEntityType: 'Resume',
      relatedEntityId: String(resume._id),
      source: 'SYSTEM',
      duplicateKey,
      estimatedMinutes: 40,
    });
  }

  // 6. DSA & LEETCODE PRACTICE
  if (dsaProfile && dsaProfile.leetcodeConnected) {
    if (dsaProfile.currentStreak > 0) {
      const todayBucket = getDateBucket(Date.now());
      const duplicateKey = `SYSTEM_DSA_PRACTICE_${todayBucket}`;
      candidates.push({
        user: userId,
        title: 'Maintain LeetCode Streak',
        description: `Current streak: ${dsaProfile.currentStreak} days. Solve 1 problem today to keep your streak alive.`,
        type: 'DSA',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        relatedEntityType: 'DSA',
        relatedEntityId: String(dsaProfile._id),
        source: 'SYSTEM',
        duplicateKey,
        estimatedMinutes: 40,
      });
    }
  }

  // Deduplication & safe persistence
  if (candidates.length === 0) return [];

  const candidateKeys = candidates.map((c) => c.duplicateKey);
  const existingReminders = await Reminder.find({
    user: userId,
    duplicateKey: { $in: candidateKeys },
  })
    .select('duplicateKey status')
    .lean();

  const existingKeySet = new Set(existingReminders.map((r) => r.duplicateKey));

  const toInsert = candidates.filter((c) => !existingKeySet.has(c.duplicateKey));
  if (toInsert.length === 0) return [];

  const created = await Reminder.insertMany(toInsert, { ordered: false });
  return created;
}

module.exports = {
  calculateReminderPriority,
  isReminderOverdue,
  getDateBucket,
  syncSystemReminders,
  VALID_TYPES,
  VALID_PRIORITIES,
  VALID_STATUSES,
};
