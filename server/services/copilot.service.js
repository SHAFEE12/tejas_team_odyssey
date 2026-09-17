/**
 * copilot.service.js
 *
 * Core engine for Career Copilot:
 * 1. Deterministic Intent Classification
 * 2. Deterministic Career Reasoning & Evidence Gathering
 * 3. Action Allowlist & Confirmation Safeguards
 * 4. Pluggable AI Response Formatter with Offline Fallback
 * 5. Prompt-Injection Immunity
 */

const { buildCopilotContext } = require('./copilotContext.service');
const {
  generateRankedCandidateActions,
  identifyBiggestWeakness,
  calculateCareerLeverage,
} = require('./careerIntelligence.service');

/* ─── Allowed Actions Registry ──────────────────────────────────── */

const ALLOWED_NAVIGATION_ACTIONS = [
  'OPEN_PROFILE',
  'OPEN_CAREER_GOAL',
  'OPEN_SKILLS',
  'OPEN_SKILL_GAP',
  'OPEN_DSA',
  'OPEN_GITHUB',
  'OPEN_RESUME',
  'OPEN_PROJECTS',
  'OPEN_ROADMAP',
  'OPEN_OPPORTUNITIES',
  'OPEN_APPLICATIONS',
  'OPEN_ANALYTICS',
  'OPEN_REMINDERS',
  'OPEN_DAILY_PLAN',
  'OPEN_CAREER_INTELLIGENCE',
  'OPEN_EXECUTION',
  'OPEN_COMMAND_CENTER',
  'OPEN_ADAPTIVE_PLAN',
  'OPEN_CAREER_TRAJECTORY',
];

const ALLOWED_MUTATION_ACTIONS = [
  'ADD_SKILL',
  'CREATE_REMINDER',
  'UPDATE_APPLICATION',
  'UPDATE_ROADMAP_TASK',
];

const ALL_ALLOWED_ACTIONS = [
  ...ALLOWED_NAVIGATION_ACTIONS,
  ...ALLOWED_MUTATION_ACTIONS,
];

/* ─── Intent Classifier ─────────────────────────────────────────── */

const INTENTS = {
  TODAY_PLAN: 'TODAY_PLAN',
  CAREER_HEALTH: 'CAREER_HEALTH',
  SKILL_PRIORITY: 'SKILL_PRIORITY',
  APPLICATION_ATTENTION: 'APPLICATION_ATTENTION',
  INTERVIEW_PREPARATION: 'INTERVIEW_PREPARATION',
  RESUME_IMPROVEMENT: 'RESUME_IMPROVEMENT',
  PROJECT_RECOMMENDATION: 'PROJECT_RECOMMENDATION',
  SKILL_GAP: 'SKILL_GAP',
  JOB_READINESS: 'JOB_READINESS',
  ROADMAP: 'ROADMAP',
  DSA: 'DSA',
  GITHUB: 'GITHUB',
  HIGHEST_IMPACT: 'HIGHEST_IMPACT',
  WEEKLY_STRATEGY: 'WEEKLY_STRATEGY',
  CHANGES_TRENDS: 'CHANGES_TRENDS',
  LEVERAGE_SKILLS: 'LEVERAGE_SKILLS',
  EXECUTION_STATUS: 'EXECUTION_STATUS',
  EXECUTION_PROBLEMS: 'EXECUTION_PROBLEMS',
  GOAL_RISKS: 'GOAL_RISKS',
  CONSISTENCY: 'CONSISTENCY',
  NEXT_WEEK_PLAN: 'NEXT_WEEK_PLAN',
  COMMAND_CENTER_OVERVIEW: 'COMMAND_CENTER_OVERVIEW',
  CAREER_RISK: 'CAREER_RISK',
  DO_RIGHT_NOW: 'DO_RIGHT_NOW',
  ADAPTIVE_PLAN: 'ADAPTIVE_PLAN',
  WHY_PLAN_CHANGED: 'WHY_PLAN_CHANGED',
  EXECUTION_FRICTION: 'EXECUTION_FRICTION',
  WEEKLY_ADAPTATION: 'WEEKLY_ADAPTATION',
  INTERVIEW_MODE: 'INTERVIEW_MODE',
  RECOVERY_PLAN: 'RECOVERY_PLAN',
  CAREER_TRAJECTORY: 'CAREER_TRAJECTORY',
  CAREER_BOTTLENECK: 'CAREER_BOTTLENECK',
  OUTCOME_REVIEW: 'OUTCOME_REVIEW',
  MILESTONE_STATUS: 'MILESTONE_STATUS',
  FORECAST: 'FORECAST',
  APPLICATION_CONVERSION: 'APPLICATION_CONVERSION',
  WHY_STAGNATING: 'WHY_STAGNATING',
  GENERAL_CAREER: 'GENERAL_CAREER',
};

/**
 * Deterministically classifies user input into a supported Career Copilot intent.
 * Pure function, testable and predictable.
 */
function classifyIntent(message = '') {
  const text = String(message).toLowerCase().trim();

  if (!text) return INTENTS.GENERAL_CAREER;

  // Career Outcome & Trajectory queries
  if (
    text.includes('why am i stagnating') ||
    text.includes('am i stagnating') ||
    text.includes('why stagnating') ||
    text.includes('stagnating') ||
    text.includes('stagnation')
  ) {
    return INTENTS.WHY_STAGNATING;
  }

  if (
    text.includes('what is blocking me') ||
    text.includes("what's blocking me") ||
    text.includes('blocking my career') ||
    text.includes('career bottleneck') ||
    text.includes('biggest bottleneck') ||
    text.includes('bottleneck')
  ) {
    return INTENTS.CAREER_BOTTLENECK;
  }

  if (
    text.includes('application conversion') ||
    text.includes('interview conversion') ||
    text.includes('funnel conversion') ||
    text.includes('application funnel') ||
    text.includes('conversion rate')
  ) {
    return INTENTS.APPLICATION_CONVERSION;
  }

  if (
    text.includes('how long until i close this gap') ||
    text.includes('when will i reach') ||
    text.includes('milestone forecast') ||
    text.includes('career forecast') ||
    text.includes('forecast')
  ) {
    return INTENTS.FORECAST;
  }

  if (
    text.includes('next milestone') ||
    text.includes('milestone status') ||
    text.includes('career milestones') ||
    text.includes('milestones')
  ) {
    return INTENTS.MILESTONE_STATUS;
  }

  if (
    text.includes('outcome review') ||
    text.includes('weekly outcome review') ||
    text.includes('outcome summary') ||
    text.includes('monthly outcome review')
  ) {
    return INTENTS.OUTCOME_REVIEW;
  }

  if (
    text.includes('am i actually progressing') ||
    text.includes('am i progressing') ||
    text.includes('is my trajectory improving') ||
    text.includes('career trajectory') ||
    text.includes('trajectory')
  ) {
    return INTENTS.CAREER_TRAJECTORY;
  }

  // Adaptive Career OS queries
  if (
    text.includes('why did my plan change') ||
    text.includes('what changed in my plan') ||
    text.includes('why my plan changed') ||
    text.includes('why changed')
  ) {
    return INTENTS.WHY_PLAN_CHANGED;
  }

  if (
    text.includes('what is slowing me down') ||
    text.includes('execution friction') ||
    text.includes('slowing me down') ||
    text.includes('where am i stuck') ||
    text.includes('task friction')
  ) {
    return INTENTS.EXECUTION_FRICTION;
  }

  if (
    text.includes('recovery plan') ||
    text.includes('execution recovery') ||
    text.includes('how do i recover') ||
    text.includes('recover momentum')
  ) {
    return INTENTS.RECOVERY_PLAN;
  }

  if (
    text.includes('interview mode') ||
    text.includes('why is interview mode active') ||
    text.includes('interview preparation mode')
  ) {
    return INTENTS.INTERVIEW_MODE;
  }

  if (
    text.includes('weekly adaptation') ||
    text.includes('how did my plan adapt this week') ||
    text.includes('plan adapt this week')
  ) {
    return INTENTS.WEEKLY_ADAPTATION;
  }

  if (
    text.includes('adaptive plan') ||
    text.includes('adaptive mode') ||
    text.includes('why did my plan adapt') ||
    text.includes('how does my plan adapt') ||
    text.includes('adaptive os')
  ) {
    return INTENTS.ADAPTIVE_PLAN;
  }

  // Command Center queries
  if (
    text.includes('do right now') ||
    text.includes('what should i do right now') ||
    text.includes('what matters most')
  ) {
    return INTENTS.DO_RIGHT_NOW;
  }

  if (
    text.includes('biggest career risk') ||
    text.includes('biggest risk') ||
    text.includes('career risk') ||
    text.includes('putting my career at risk') ||
    text.includes('momentum declining')
  ) {
    return INTENTS.CAREER_RISK;
  }

  if (
    text.includes('how am i doing overall') ||
    text.includes('where do i stand') ||
    text.includes('where am i') ||
    text.includes('overall standing')
  ) {
    return INTENTS.COMMAND_CENTER_OVERVIEW;
  }

  // Execution-aware queries
  if (
    text.includes('complete today') ||
    text.includes('accomplish today') ||
    text.includes('what did i complete') ||
    text.includes('what did i accomplish') ||
    text.includes('how productive') ||
    text.includes('follow my career strategy') ||
    text.includes('follow my strategy')
  ) {
    return INTENTS.EXECUTION_STATUS;
  }

  if (
    text.includes('falling behind') ||
    text.includes('skip repeatedly') ||
    text.includes('skipped repeatedly') ||
    text.includes('what did i skip') ||
    text.includes('losing momentum')
  ) {
    return INTENTS.EXECUTION_PROBLEMS;
  }

  if (
    text.includes('goals at risk') ||
    text.includes('goals are at risk') ||
    text.includes('which goals are at risk') ||
    text.includes('goal risk')
  ) {
    return INTENTS.GOAL_RISKS;
  }

  if (
    text.includes('how consistent') ||
    text.includes('consistency') ||
    text.includes('am i consistent') ||
    text.includes('execution streak')
  ) {
    return INTENTS.CONSISTENCY;
  }

  if (
    text.includes('change next week') ||
    text.includes('what should i change next week') ||
    text.includes('next week recommendation')
  ) {
    return INTENTS.NEXT_WEEK_PLAN;
  }

  // TODAY_PLAN
  if (
    text.includes('today') ||
    text.includes('daily plan') ||
    text.includes('schedule') ||
    text.includes('do now') ||
    text.includes('what should i do') ||
    text.includes('focus today')
  ) {
    return INTENTS.TODAY_PLAN;
  }

  // CAREER_HEALTH
  if (
    text.includes('career health') ||
    text.includes('health low') ||
    text.includes('why is my score') ||
    text.includes('readiness score') ||
    text.includes('career readiness') ||
    text.includes('improve score')
  ) {
    return INTENTS.CAREER_HEALTH;
  }

  // INTERVIEW_PREPARATION
  if (
    text.includes('interview') ||
    text.includes('prepare me for') ||
    text.includes('mock interview') ||
    text.includes('interview prep')
  ) {
    return INTENTS.INTERVIEW_PREPARATION;
  }

  // APPLICATION_ATTENTION
  if (
    text.includes('application') ||
    text.includes('deadline') ||
    text.includes('need attention') ||
    text.includes('stalled') ||
    text.includes('pipeline') ||
    text.includes('applied')
  ) {
    return INTENTS.APPLICATION_ATTENTION;
  }

  // RESUME_IMPROVEMENT
  if (
    text.includes('resume') ||
    text.includes('cv') ||
    text.includes('ats') ||
    text.includes('resume score')
  ) {
    return INTENTS.RESUME_IMPROVEMENT;
  }

  // SKILL_PRIORITY
  if (
    text.includes('which skill') ||
    text.includes('learn first') ||
    text.includes('next skill') ||
    text.includes('top skill') ||
    text.includes('skill priority')
  ) {
    return INTENTS.SKILL_PRIORITY;
  }

  // SKILL_GAP
  if (
    text.includes('skill gap') ||
    text.includes('career gap') ||
    text.includes('missing skill') ||
    text.includes('biggest gap') ||
    text.includes('gaps')
  ) {
    return INTENTS.SKILL_GAP;
  }

  // PROJECT_RECOMMENDATION
  if (
    text.includes('project') ||
    text.includes('portfolio') ||
    text.includes('build next') ||
    text.includes('what should i build')
  ) {
    return INTENTS.PROJECT_RECOMMENDATION;
  }

  // JOB_READINESS
  if (
    text.includes('ready to apply') ||
    text.includes('am i ready') ||
    text.includes('job readiness') ||
    text.includes('fit for this job') ||
    text.includes('ready for job')
  ) {
    return INTENTS.JOB_READINESS;
  }

  // ROADMAP
  if (
    text.includes('roadmap') ||
    text.includes('learning path') ||
    text.includes('phase') ||
    text.includes('milestone')
  ) {
    return INTENTS.ROADMAP;
  }

  // DSA
  if (
    text.includes('dsa') ||
    text.includes('leetcode') ||
    text.includes('streak') ||
    text.includes('algorithm') ||
    text.includes('coding practice')
  ) {
    return INTENTS.DSA;
  }

  // GITHUB
  if (
    text.includes('github') ||
    text.includes('repo') ||
    text.includes('repository') ||
    text.includes('git')
  ) {
    return INTENTS.GITHUB;
  }

  // HIGHEST_IMPACT
  if (
    text.includes('highest impact') ||
    text.includes('highest-impact') ||
    text.includes('impact action') ||
    text.includes('why is this my priority')
  ) {
    return INTENTS.HIGHEST_IMPACT;
  }

  // WEEKLY_STRATEGY
  if (
    text.includes('weekly strategy') ||
    text.includes('plan this week') ||
    text.includes('this week') ||
    text.includes('weekly plan')
  ) {
    return INTENTS.WEEKLY_STRATEGY;
  }

  // CHANGES_TRENDS
  if (
    text.includes('what changed') ||
    text.includes('changes') ||
    text.includes('improving') ||
    text.includes('progress since')
  ) {
    return INTENTS.CHANGES_TRENDS;
  }

  // LEVERAGE_SKILLS
  if (
    text.includes('leverage') ||
    text.includes('highest leverage')
  ) {
    return INTENTS.LEVERAGE_SKILLS;
  }

  return INTENTS.GENERAL_CAREER;
}

/* ─── Deterministic Analysis Engine ─────────────────────────────── */

/**
 * Produces deterministic, evidence-backed answer, recommendations, and suggested actions.
 */
function analyzeCareerContext(intent, context) {
  const {
    profile,
    careerGoal,
    skills,
    dsa,
    github,
    resume,
    skillGap,
    roadmap,
    projects,
    applications,
    analytics,
    reminders,
    dailyPlan,
    execution,
  } = context;

  const targetRole = careerGoal.targetRole || 'Software Engineer';
  const evidence = [];
  const recommendations = [];
  const suggestedActions = [];
  let answer = '';

  switch (intent) {
    case INTENTS.TODAY_PLAN: {
      const topTask = dailyPlan?.topTasks?.[0];
      const overdueCount = reminders?.overdueCount || 0;
      const dueTodayCount = reminders?.dueTodayCount || 0;

      evidence.push(
        { label: 'Today Progress', value: `${dailyPlan?.completedTasks || 0} / ${dailyPlan?.totalTasks || 0} tasks`, status: 'INFO' },
        { label: 'Estimated Time', value: `${dailyPlan?.totalEstimatedMinutes || 0} min`, status: 'INFO' },
        { label: 'Overdue Reminders', value: String(overdueCount), status: overdueCount > 0 ? 'WARN' : 'GOOD' }
      );

      if (overdueCount > 0) {
        answer = `You have ${overdueCount} overdue reminder(s) requiring immediate attention. Clear those first before proceeding with today's execution plan.`;
        recommendations.push({
          title: 'Resolve Overdue Career Reminders',
          reason: `You have ${overdueCount} reminder(s) that missed their target due dates.`,
          priority: 'URGENT',
          module: 'Reminders',
          actionType: 'OPEN_REMINDERS',
        });
        suggestedActions.push({
          id: 'act-reminders',
          label: 'Open Reminders',
          type: 'NAVIGATION',
          actionType: 'OPEN_REMINDERS',
          payload: { route: '/student/reminders' },
          requiresConfirmation: false,
        });
      } else if (topTask) {
        answer = `Your top focus today is: "${topTask.title}". Estimated effort: ${topTask.estimatedMinutes} minutes (${topTask.category}).`;
        recommendations.push({
          title: topTask.title,
          reason: `High priority item from your Daily Career Plan (Score: ${topTask.priorityScore}).`,
          priority: 'HIGH',
          module: 'Daily Planner',
          actionType: 'OPEN_DAILY_PLAN',
        });
        suggestedActions.push({
          id: 'act-daily-plan',
          label: "Open Today's Plan",
          type: 'NAVIGATION',
          actionType: 'OPEN_DAILY_PLAN',
          payload: { route: '/student/reminders' },
          requiresConfirmation: false,
        });
      } else {
        answer = `Your daily plan is currently clear. To generate targeted tasks, update your Career Roadmap or track new opportunities.`;
        suggestedActions.push({
          id: 'act-roadmap',
          label: 'View Roadmap',
          type: 'NAVIGATION',
          actionType: 'OPEN_ROADMAP',
          payload: { route: '/student/roadmap' },
          requiresConfirmation: false,
        });
      }

      if (applications?.upcomingDeadlines?.length > 0) {
        const nextDeadline = applications.upcomingDeadlines[0];
        recommendations.push({
          title: `Application Deadline: ${nextDeadline.company}`,
          reason: `Deadline on ${new Date(nextDeadline.deadline).toLocaleDateString()} for ${nextDeadline.role}.`,
          priority: 'URGENT',
          module: 'Applications',
          actionType: 'OPEN_APPLICATIONS',
        });
      }
      break;
    }

    case INTENTS.CAREER_HEALTH: {
      const healthScore = analytics?.careerHealthScore;
      const weaknesses = analytics?.majorWeaknesses || [];

      evidence.push(
        { label: 'Career Health', value: healthScore !== null ? `${healthScore}/100` : 'Not enough data yet', status: healthScore >= 70 ? 'GOOD' : healthScore >= 50 ? 'WARN' : 'ALERT' },
        { label: 'Readiness Score', value: analytics?.careerReadinessScore !== null ? `${analytics.careerReadinessScore}/100` : 'Not calculated', status: 'INFO' },
        { label: 'Skill Coverage', value: skillGap?.coveragePercentage !== null ? `${skillGap.coveragePercentage}%` : 'Not set', status: 'INFO' }
      );

      if (healthScore === null) {
        answer = `Your Career Health score is not available yet because key profile modules (Skills, Resume, or Roadmap) are not completed. Complete them to unlock continuous health tracking.`;
      } else {
        const weaknessList = weaknesses.map((w) => `${w.component} (${w.score}/100)`).join(', ');
        answer = `Your Career Health is currently ${healthScore}/100 (${analytics?.careerHealthRating || 'FAIR'}). ${weaknesses.length > 0 ? `The primary areas holding down your score are: ${weaknessList}.` : 'Your metrics are balanced across tracking domains.'}`;
      }

      if (!resume?.available || resume.status !== 'completed') {
        recommendations.push({
          title: 'Upload and Analyze Your Resume',
          reason: 'Missing resume analysis directly lowers your profile verification and health metrics.',
          priority: 'HIGH',
          module: 'Resume',
          actionType: 'OPEN_RESUME',
        });
        suggestedActions.push({
          id: 'act-resume',
          label: 'Upload Resume',
          type: 'NAVIGATION',
          actionType: 'OPEN_RESUME',
          payload: { route: '/student/resume' },
          requiresConfirmation: false,
        });
      }

      if (skillGap?.missingSkills?.length > 0) {
        const topMissing = skillGap.missingSkills[0];
        recommendations.push({
          title: `Bridge Core Skill Gap: ${topMissing}`,
          reason: `${topMissing} is a required baseline skill for ${targetRole}.`,
          priority: 'HIGH',
          module: 'Skill Gap',
          actionType: 'OPEN_SKILL_GAP',
        });
        suggestedActions.push({
          id: 'act-skill-gap',
          label: 'Open Skill Gap',
          type: 'NAVIGATION',
          actionType: 'OPEN_SKILL_GAP',
          payload: { route: '/student/skill-gap' },
          requiresConfirmation: false,
        });
      }

      suggestedActions.push({
        id: 'act-analytics',
        label: 'View Analytics',
        type: 'NAVIGATION',
        actionType: 'OPEN_ANALYTICS',
        payload: { route: '/student/analytics' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.SKILL_PRIORITY: {
      const priorityGaps = skillGap?.priorityGaps || [];
      const missingSkills = skillGap?.missingSkills || [];
      const resumeMissing = skillGap?.resumeEvidenceMissing || [];

      evidence.push(
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Skill Coverage', value: skillGap?.coveragePercentage !== null ? `${skillGap.coveragePercentage}%` : 'Not set', status: 'INFO' },
        { label: 'Missing Skills', value: String(missingSkills.length), status: missingSkills.length > 0 ? 'WARN' : 'GOOD' }
      );

      if (!careerGoal.isSet) {
        answer = `You haven't set a target career role yet. Set your target role in Career Goal to receive role-specific skill prioritization.`;
        suggestedActions.push({
          id: 'act-goal',
          label: 'Set Career Goal',
          type: 'NAVIGATION',
          actionType: 'OPEN_CAREER_GOAL',
          payload: { route: '/student/career-goal' },
          requiresConfirmation: false,
        });
      } else if (priorityGaps.length > 0) {
        const topGap = priorityGaps[0];
        const gapName = topGap.name || topGap;
        answer = `Based on your target role (${targetRole}), your highest priority skill to learn first is ${gapName}. It is a core baseline requirement currently missing from your verified profile.`;
        
        recommendations.push({
          title: `Learn ${gapName}`,
          reason: `Required core skill for ${targetRole} with high job market weight.`,
          priority: 'HIGH',
          module: 'Skill Gap',
          actionType: 'OPEN_SKILL_GAP',
        });

        // Offer safe mutation action with confirmation prompt
        suggestedActions.push({
          id: `act-add-skill-${gapName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          label: `Add ${gapName} to My Skills`,
          type: 'MUTATION',
          actionType: 'ADD_SKILL',
          payload: { skillName: gapName, level: 'beginner' },
          requiresConfirmation: true,
          confirmationPrompt: `Would you like me to add ${gapName} (Beginner) to your My Skills profile?`,
        });

        suggestedActions.push({
          id: 'act-skill-gap',
          label: 'Inspect Skill Gap',
          type: 'NAVIGATION',
          actionType: 'OPEN_SKILL_GAP',
          payload: { route: '/student/skill-gap' },
          requiresConfirmation: false,
        });
      } else if (resumeMissing.length > 0) {
        const topResumeGap = resumeMissing[0];
        answer = `You have learned ${topResumeGap}, but it lacks proof on your analyzed resume. Adding project bullet points for ${topResumeGap} will validate this skill to recruiters.`;
        recommendations.push({
          title: `Add ${topResumeGap} to Resume`,
          reason: 'Skill is claimed in profile but unverified on resume.',
          priority: 'MEDIUM',
          module: 'Resume',
          actionType: 'OPEN_RESUME',
        });
        suggestedActions.push({
          id: 'act-resume',
          label: 'Update Resume',
          type: 'NAVIGATION',
          actionType: 'OPEN_RESUME',
          payload: { route: '/student/resume' },
          requiresConfirmation: false,
        });
      } else {
        answer = `Excellent work! Your skill profile covers the primary core requirements for ${targetRole}. Focus on advancing to intermediate/expert levels and building verified projects.`;
      }
      break;
    }

    case INTENTS.APPLICATION_ATTENTION: {
      const needingAttention = applications?.needingAttention || [];
      const activeCount = applications?.active || 0;

      evidence.push(
        { label: 'Active Applications', value: String(activeCount), status: 'INFO' },
        { label: 'Response Rate', value: `${applications?.responseRate || 0}%`, status: 'INFO' },
        { label: 'Needing Action', value: String(needingAttention.length), status: needingAttention.length > 0 ? 'WARN' : 'GOOD' }
      );

      if (applications?.total === 0) {
        answer = `You haven't tracked any applications yet. Track opportunities from the Opportunities board to receive automated deadline alerts and follow-up guidance.`;
        suggestedActions.push({
          id: 'act-opps',
          label: 'Browse Opportunities',
          type: 'NAVIGATION',
          actionType: 'OPEN_OPPORTUNITIES',
          payload: { route: '/student/opportunities' },
          requiresConfirmation: false,
        });
      } else if (needingAttention.length > 0) {
        const first = needingAttention[0];
        const dateStr = first.deadline
          ? `Deadline: ${new Date(first.deadline).toLocaleDateString()}`
          : `Interview: ${new Date(first.interviewDate).toLocaleDateString()}`;
        answer = `You have ${needingAttention.length} application(s) requiring immediate attention. Top priority: ${first.company} (${first.role}) — ${dateStr}.`;

        for (const item of needingAttention.slice(0, 3)) {
          recommendations.push({
            title: `${item.company}: ${item.role}`,
            reason: item.deadline ? `Application deadline approaching: ${new Date(item.deadline).toLocaleDateString()}` : `Upcoming interview: ${new Date(item.interviewDate).toLocaleDateString()}`,
            priority: 'URGENT',
            module: 'Applications',
            actionType: 'OPEN_APPLICATIONS',
          });
        }

        suggestedActions.push({
          id: 'act-applications',
          label: 'Open Applications Board',
          type: 'NAVIGATION',
          actionType: 'OPEN_APPLICATIONS',
          payload: { route: '/student/applications' },
          requiresConfirmation: false,
        });
      } else {
        answer = `None of your active applications have urgent impending deadlines or interviews within the next 3 days. Continue monitoring and submitting applications.`;
        suggestedActions.push({
          id: 'act-applications',
          label: 'View Applications',
          type: 'NAVIGATION',
          actionType: 'OPEN_APPLICATIONS',
          payload: { route: '/student/applications' },
          requiresConfirmation: false,
        });
      }
      break;
    }

    case INTENTS.INTERVIEW_PREPARATION: {
      const upcomingInterviews = applications?.upcomingInterviews || [];

      evidence.push(
        { label: 'Upcoming Interviews', value: String(upcomingInterviews.length), status: upcomingInterviews.length > 0 ? 'GOOD' : 'INFO' },
        { label: 'DSA Solved', value: `${dsa?.totalSolved || 0} problems`, status: 'INFO' },
        { label: 'Target Role', value: targetRole, status: 'INFO' }
      );

      if (upcomingInterviews.length > 0) {
        const interview = upcomingInterviews[0];
        const dateStr = new Date(interview.interviewDate).toLocaleDateString();
        answer = `You have an interview scheduled with ${interview.company} for ${interview.role} on ${dateStr}. Recommended preparation: review core ${targetRole} architecture patterns, prepare STAR format stories from your projects, and practice DSA medium problems.`;

        recommendations.push({
          title: `Prepare for ${interview.company} Interview`,
          reason: `Scheduled on ${dateStr}. Review company tech stack and project evidence.`,
          priority: 'URGENT',
          module: 'Applications',
          actionType: 'OPEN_APPLICATIONS',
        });

        // Offer safe reminder creation with confirmation
        suggestedActions.push({
          id: `act-remind-interview-${interview.id}`,
          label: `Set Interview Prep Reminder`,
          type: 'MUTATION',
          actionType: 'CREATE_REMINDER',
          payload: {
            title: `Prepare for ${interview.company} ${interview.role} interview`,
            description: `Review system design, behavioral STAR stories, and core tech stack.`,
            priority: 'HIGH',
            type: 'INTERVIEW',
            dueAt: interview.interviewDate,
          },
          requiresConfirmation: true,
          confirmationPrompt: `Would you like me to schedule a high-priority preparation reminder for your ${interview.company} interview?`,
        });
      } else {
        answer = `You do not have any upcoming interviews scheduled in your tracked applications. If you recently received an interview invitation, update your application status to INTERVIEW to track it.`;
      }

      suggestedActions.push({
        id: 'act-apps',
        label: 'View Applications',
        type: 'NAVIGATION',
        actionType: 'OPEN_APPLICATIONS',
        payload: { route: '/student/applications' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.RESUME_IMPROVEMENT: {
      evidence.push(
        { label: 'Resume Status', value: resume?.status || 'NOT_UPLOADED', status: resume?.status === 'completed' ? 'GOOD' : 'WARN' },
        { label: 'ATS Score', value: resume?.atsScore !== null ? `${resume.atsScore}/100` : 'Unanalyzed', status: 'INFO' },
        { label: 'Role Alignment', value: resume?.roleAlignmentScore !== null ? `${resume.roleAlignmentScore}/100` : 'Unanalyzed', status: 'INFO' }
      );

      if (!resume?.available || resume.status !== 'completed') {
        answer = `Your resume has not been analyzed yet. Upload your PDF resume to the Resume Analyzer to receive ATS scoring, keyword extraction, and evidence gap detection.`;
        recommendations.push({
          title: 'Upload Resume for ATS Analysis',
          reason: 'Unlocks role alignment scoring and verified skill matching.',
          priority: 'HIGH',
          module: 'Resume',
          actionType: 'OPEN_RESUME',
        });
        suggestedActions.push({
          id: 'act-resume',
          label: 'Open Resume Analyzer',
          type: 'NAVIGATION',
          actionType: 'OPEN_RESUME',
          payload: { route: '/student/resume' },
          requiresConfirmation: false,
        });
      } else {
        const ats = resume.atsScore || 0;
        const missing = resume.missingSkills || [];
        answer = `Your resume ATS score is ${ats}/100. ${missing.length > 0 ? `To boost your match for ${targetRole}, incorporate evidence for: ${missing.slice(0, 3).join(', ')}.` : 'Your resume keywords match your target role well.'}`;

        if (missing.length > 0) {
          recommendations.push({
            title: `Add ${missing[0]} to Resume Work Experience`,
            reason: `Missing key role qualification for ${targetRole}.`,
            priority: 'MEDIUM',
            module: 'Resume',
            actionType: 'OPEN_RESUME',
          });
        }
        suggestedActions.push({
          id: 'act-resume',
          label: 'View Detailed Resume Analysis',
          type: 'NAVIGATION',
          actionType: 'OPEN_RESUME',
          payload: { route: '/student/resume' },
          requiresConfirmation: false,
        });
      }
      break;
    }

    case INTENTS.PROJECT_RECOMMENDATION: {
      evidence.push(
        { label: 'Portfolio Projects', value: `${projects?.totalProjects || 0} projects`, status: 'INFO' },
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Verified Code', value: `${projects?.withGithubUrl || 0} with GitHub`, status: 'INFO' }
      );

      if (projects?.totalProjects === 0) {
        answer = `You don't have any projects in your portfolio yet. For a ${targetRole}, building a production-grade application with live deployment and GitHub source code is critical.`;
        recommendations.push({
          title: `Start a Featured ${targetRole} Project`,
          reason: 'Portfolio evidence is required for strong job application match scores.',
          priority: 'HIGH',
          module: 'Projects',
          actionType: 'OPEN_PROJECTS',
        });
      } else {
        const unverified = projects.list?.find((p) => !p.hasGithub || !p.hasLiveUrl);
        if (unverified) {
          answer = `Your project "${unverified.title}" is missing ${!unverified.hasGithub ? 'a GitHub repository URL' : 'a live deployment link'}. Adding this proof will increase your project verification score.`;
          recommendations.push({
            title: `Add Proof to ${unverified.title}`,
            reason: 'Recruiters prioritize projects with verifiable source code and working deployments.',
            priority: 'MEDIUM',
            module: 'Projects',
            actionType: 'OPEN_PROJECTS',
          });
        } else {
          answer = `Your current projects have good code verification. To strengthen your portfolio for ${targetRole}, explore the curated project blueprints tailored to your missing skill gaps.`;
        }
      }

      suggestedActions.push({
        id: 'act-projects',
        label: 'Open Projects Hub',
        type: 'NAVIGATION',
        actionType: 'OPEN_PROJECTS',
        payload: { route: '/student/projects' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.SKILL_GAP: {
      const coverage = skillGap?.coveragePercentage;
      const missing = skillGap?.missingSkills || [];
      const partial = skillGap?.partialSkills || [];

      evidence.push(
        { label: 'Role Alignment', value: targetRole, status: 'INFO' },
        { label: 'Coverage', value: coverage !== null ? `${coverage}%` : 'Not set', status: coverage >= 70 ? 'GOOD' : 'WARN' },
        { label: 'Uncovered Skills', value: String(missing.length + partial.length), status: 'INFO' }
      );

      if (coverage === null) {
        answer = `Skill gap analysis requires a target role and added skills. Set your Career Goal first to calculate your role alignment.`;
        suggestedActions.push({
          id: 'act-goal',
          label: 'Set Target Role',
          type: 'NAVIGATION',
          actionType: 'OPEN_CAREER_GOAL',
          payload: { route: '/student/career-goal' },
          requiresConfirmation: false,
        });
      } else {
        answer = `Your skill coverage for ${targetRole} is ${coverage}%. You have ${missing.length} missing skill(s) and ${partial.length} partial skill(s). Top gaps: ${missing.slice(0, 3).join(', ') || 'None'}.`;
        if (missing.length > 0) {
          recommendations.push({
            title: `Address ${missing[0]} Gap`,
            reason: `Core missing requirement for ${targetRole}.`,
            priority: 'HIGH',
            module: 'Skill Gap',
            actionType: 'OPEN_SKILL_GAP',
          });
        }
        suggestedActions.push({
          id: 'act-skill-gap',
          label: 'Analyze Skill Gap',
          type: 'NAVIGATION',
          actionType: 'OPEN_SKILL_GAP',
          payload: { route: '/student/skill-gap' },
          requiresConfirmation: false,
        });
      }
      break;
    }

    case INTENTS.JOB_READINESS: {
      const readiness = analytics?.careerReadinessScore;
      const coverage = skillGap?.coveragePercentage;

      evidence.push(
        { label: 'Career Readiness', value: readiness !== null ? `${readiness}/100` : 'Not calculated', status: readiness >= 70 ? 'GOOD' : 'WARN' },
        { label: 'Skill Coverage', value: coverage !== null ? `${coverage}%` : 'Not set', status: 'INFO' },
        { label: 'Applications', value: `${applications?.active || 0} active`, status: 'INFO' }
      );

      if (readiness === null || readiness < 50) {
        answer = `Your Career Readiness is currently ${readiness !== null ? `${readiness}/100` : 'not calculated'}. It is recommended to strengthen your resume and complete missing skill gap tasks before applying to competitive openings.`;
        recommendations.push({
          title: 'Improve Application Readiness First',
          reason: 'Raising readiness above 65 significantly improves employer response rates.',
          priority: 'HIGH',
          module: 'Career Score',
          actionType: 'OPEN_ANALYTICS',
        });
      } else {
        answer = `Your Career Readiness is solid at ${readiness}/100. You are prepared to target entry and mid-level ${targetRole} positions. Check the Opportunities module for matched openings.`;
        recommendations.push({
          title: 'Apply to High-Match Opportunities',
          reason: 'Your verified skills match standard role baselines.',
          priority: 'MEDIUM',
          module: 'Opportunities',
          actionType: 'OPEN_OPPORTUNITIES',
        });
      }

      suggestedActions.push({
        id: 'act-opps',
        label: 'Explore Opportunities',
        type: 'NAVIGATION',
        actionType: 'OPEN_OPPORTUNITIES',
        payload: { route: '/student/opportunities' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.ROADMAP: {
      evidence.push(
        { label: 'Roadmap Progress', value: `${roadmap?.progress || 0}%`, status: 'INFO' },
        { label: 'Tasks Completed', value: `${roadmap?.completedCount || 0} / ${roadmap?.totalTasks || 0}`, status: 'INFO' },
        { label: 'Current Phase', value: `Phase ${roadmap?.currentPhase || 1}`, status: 'INFO' }
      );

      if (!roadmap?.available || roadmap.totalTasks === 0) {
        answer = `You haven't generated a Career Roadmap yet. Generate your personalized step-by-step roadmap to guide your skill progression.`;
        recommendations.push({
          title: 'Generate Personalized Career Roadmap',
          reason: 'Provides a structured milestone curriculum for your target role.',
          priority: 'HIGH',
          module: 'Roadmap',
          actionType: 'OPEN_ROADMAP',
        });
      } else {
        const activeTask = roadmap.activeTasks?.[0];
        answer = `You are on Phase ${roadmap.currentPhase} with ${roadmap.progress}% total progress. ${activeTask ? `Currently in progress: "${activeTask.title}".` : 'Ready to start your next phase tasks.'}`;
        if (activeTask) {
          recommendations.push({
            title: `Complete: ${activeTask.title}`,
            reason: `Active task in Phase ${activeTask.phase} (Priority: ${activeTask.priority}).`,
            priority: 'HIGH',
            module: 'Roadmap',
            actionType: 'OPEN_ROADMAP',
          });
        }
      }

      suggestedActions.push({
        id: 'act-roadmap',
        label: 'Open Roadmap',
        type: 'NAVIGATION',
        actionType: 'OPEN_ROADMAP',
        payload: { route: '/student/roadmap' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.DSA: {
      evidence.push(
        { label: 'Total Solved', value: `${dsa?.totalSolved || 0} problems`, status: 'INFO' },
        { label: 'Current Streak', value: `${dsa?.currentStreak || 0} days`, status: 'INFO' },
        { label: 'LeetCode Sync', value: dsa?.isConnected ? 'Connected' : 'Not connected', status: dsa?.isConnected ? 'GOOD' : 'WARN' }
      );

      if (!dsa?.isConnected) {
        answer = `Your LeetCode profile is not connected. Connect your LeetCode username in the DSA Tracker to sync solved counts, streaks, and verified problem evidence.`;
        recommendations.push({
          title: 'Connect LeetCode Profile',
          reason: 'Syncs live public solve statistics and strengthens technical evidence.',
          priority: 'MEDIUM',
          module: 'DSA',
          actionType: 'OPEN_DSA',
        });
      } else {
        answer = `You have solved ${dsa.totalSolved} problems (Easy: ${dsa.easySolved}, Medium: ${dsa.mediumSolved}, Hard: ${dsa.hardSolved}) with a ${dsa.currentStreak}-day streak. Target: ${dsa.targetTotal} total.`;
        if (dsa.totalSolved < 50) {
          recommendations.push({
            title: 'Solve 3 DSA Problems Today',
            reason: 'Building a consistent problem-solving streak improves technical interview confidence.',
            priority: 'MEDIUM',
            module: 'DSA',
            actionType: 'OPEN_DSA',
          });
        }
      }

      suggestedActions.push({
        id: 'act-dsa',
        label: 'Open DSA Tracker',
        type: 'NAVIGATION',
        actionType: 'OPEN_DSA',
        payload: { route: '/student/dsa' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.GITHUB: {
      evidence.push(
        { label: 'GitHub Connection', value: github?.isConnected ? 'Connected' : 'Not connected', status: github?.isConnected ? 'GOOD' : 'WARN' },
        { label: 'Public Repos', value: String(github?.publicRepos || 0), status: 'INFO' },
        { label: 'Top Languages', value: (github?.topLanguages || []).slice(0, 3).join(', ') || 'None', status: 'INFO' }
      );

      if (!github?.isConnected) {
        answer = `Your GitHub profile is not connected. Connect your GitHub account to sync public repositories, languages, and open-source commit evidence.`;
        recommendations.push({
          title: 'Connect GitHub Profile',
          reason: 'Validates code authorship and language proficiency for employers.',
          priority: 'MEDIUM',
          module: 'GitHub',
          actionType: 'OPEN_GITHUB',
        });
      } else {
        answer = `Your GitHub profile (@${github.username}) is connected with ${github.publicRepos} public repositories and ${github.totalStars} stars. Top languages: ${(github.topLanguages || []).join(', ') || 'None recorded'}.`;
      }

      suggestedActions.push({
        id: 'act-github',
        label: 'Open GitHub Profile',
        type: 'NAVIGATION',
        actionType: 'OPEN_GITHUB',
        payload: { route: '/student/github' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.HIGHEST_IMPACT: {
      const candidateActions = generateRankedCandidateActions(context);
      const topAction = candidateActions[0];

      evidence.push(
        { label: 'Top Priority Score', value: topAction ? `${topAction.priorityScore}/100` : '—', status: 'GOOD' },
        { label: 'Expected Impact', value: topAction?.impact >= 85 ? 'High' : 'Moderate', status: 'INFO' },
        { label: 'Target Module', value: topAction?.module || 'General', status: 'INFO' }
      );

      if (topAction) {
        answer = `Your highest-impact career action right now is: "${topAction.title}". ${topAction.reason} Completing this provides immediate leverage for your career readiness.`;
        recommendations.push({
          title: topAction.title,
          reason: topAction.reason,
          priority: topAction.priority,
          module: topAction.module,
          actionType: topAction.actionType,
        });

        suggestedActions.push({
          id: 'act-highest-impact',
          label: `Start: ${topAction.title}`,
          type: 'NAVIGATION',
          actionType: topAction.actionType,
          payload: { route: '/student/career-intelligence' },
          requiresConfirmation: false,
        });
      } else {
        answer = `All core metrics are in strong alignment. Explore verified opportunities to start active applications.`;
      }

      suggestedActions.push({
        id: 'act-intel-full',
        label: 'Open Career Intelligence',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_INTELLIGENCE',
        payload: { route: '/student/career-intelligence' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.WEEKLY_STRATEGY: {
      const candidateActions = generateRankedCandidateActions(context);
      const topObjectives = candidateActions.slice(0, 3);

      evidence.push(
        { label: 'Weekly Target', value: '5–15 hours', status: 'INFO' },
        { label: 'Strategic Objectives', value: `${topObjectives.length} planned`, status: 'INFO' },
        { label: 'Career Momentum', value: analytics?.careerHealthScore !== null ? `${analytics.careerHealthScore}/100` : 'Building', status: 'GOOD' }
      );

      answer = `Here is your strategy for this week: focus on 1) ${topObjectives[0]?.title || 'closing skill gaps'}, 2) ${topObjectives[1]?.title || 'roadmap progression'}, and 3) ${topObjectives[2]?.title || 'portfolio evidence'}. Dedicate 5–15 focused hours distributed across skills and project commits.`;

      for (const obj of topObjectives) {
        recommendations.push({
          title: obj.title,
          reason: obj.reason,
          priority: obj.priority,
          module: obj.module,
          actionType: obj.actionType,
        });
      }

      suggestedActions.push({
        id: 'act-weekly-strategy',
        label: 'View Full Weekly Strategy',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_INTELLIGENCE',
        payload: { route: '/student/career-intelligence' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.CHANGES_TRENDS: {
      evidence.push(
        { label: 'Career Health', value: analytics?.careerHealthScore !== null ? `${analytics.careerHealthScore}/100` : '—', status: 'INFO' },
        { label: 'Career Readiness', value: analytics?.careerReadinessScore !== null ? `${analytics.careerReadinessScore}/100` : '—', status: 'INFO' },
        { label: 'History Records', value: 'Snapshot verified', status: 'INFO' }
      );

      answer = `To review measured score changes and authentic trend charts since your last snapshot, open Career Intelligence. If fewer than 2 snapshots exist, the system requires additional activity before plotting trends.`;

      suggestedActions.push({
        id: 'act-intel-trends',
        label: 'View Trends & Changes',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_INTELLIGENCE',
        payload: { route: '/student/career-intelligence' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.LEVERAGE_SKILLS: {
      const missingSkills = context.skillGap?.missingSkills || [];
      const topSkill = missingSkills[0] || 'your core framework';
      const leverage = calculateCareerLeverage(topSkill, context);

      evidence.push(
        { label: 'High-Leverage Skill', value: topSkill, status: 'GOOD' },
        { label: 'Leverage Score', value: `${leverage.leverageScore}/100`, status: 'INFO' },
        { label: 'Impacted Modules', value: leverage.affectedModules.join(', '), status: 'INFO' }
      );

      answer = `For your target role (${targetRole}), ${topSkill} has the highest career leverage. ${leverage.reason}`;

      recommendations.push({
        title: `Learn ${topSkill}`,
        reason: leverage.reason,
        priority: 'HIGH',
        module: 'Skill Gap',
        actionType: 'OPEN_SKILL_GAP',
      });

      suggestedActions.push({
        id: 'act-skill-gap-lev',
        label: 'Inspect Skill Gap',
        type: 'NAVIGATION',
        actionType: 'OPEN_SKILL_GAP',
        payload: { route: '/student/skill-gap' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.EXECUTION_STATUS: {
      const daily = execution?.daily;
      const execScore = execution?.executionScore;
      const compRate = execution?.completionRate;

      evidence.push(
        { label: 'Execution Score', value: execScore !== 'INSUFFICIENT_DATA' && execScore !== null ? `${execScore}/100` : 'No data yet', status: typeof execScore === 'number' && execScore >= 60 ? 'GOOD' : 'INFO' },
        { label: 'Completed Today', value: `${daily?.completedTasks || 0} / ${daily?.plannedTasks || 0} tasks`, status: 'INFO' },
        { label: 'Completion Rate', value: compRate !== 'INSUFFICIENT_DATA' ? `${compRate}%` : 'N/A', status: 'INFO' }
      );

      if (daily?.completedTasks > 0) {
        answer = `Today, you completed ${daily.completedTasks} out of ${daily.plannedTasks} planned career tasks. Your current completion rate is ${compRate !== 'INSUFFICIENT_DATA' ? compRate + '%' : 'calculating'}. Keep your momentum going!`;
      } else if (daily?.plannedTasks > 0) {
        answer = `You have ${daily.plannedTasks} planned tasks scheduled for today and haven't marked any as completed yet. Pick your highest-impact task and take action.`;
      } else {
        answer = `You do not have any tasks scheduled for today in your Career Execution OS. Set your daily tasks to track measurable progress.`;
      }

      recommendations.push({
        title: 'Review Career Execution',
        reason: 'Consistently logging and executing planned tasks builds career momentum.',
        priority: 'HIGH',
        module: 'Career Execution',
        actionType: 'OPEN_EXECUTION',
      });

      suggestedActions.push({
        id: 'act-execution-status',
        label: 'Open Execution OS',
        type: 'NAVIGATION',
        actionType: 'OPEN_EXECUTION',
        payload: { route: '/student/execution' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.EXECUTION_PROBLEMS: {
      const skippedPatterns = execution?.skippedPatterns || [];
      const weakest = execution?.weakestCategory;

      evidence.push(
        { label: 'Skipped Patterns', value: String(skippedPatterns.length), status: skippedPatterns.length > 0 ? 'WARN' : 'GOOD' },
        { label: 'Weakest Area', value: weakest !== 'INSUFFICIENT_DATA' ? weakest : 'None identified', status: 'INFO' },
        { label: 'Completion Rate', value: execution?.completionRate !== 'INSUFFICIENT_DATA' ? `${execution.completionRate}%` : 'N/A', status: 'INFO' }
      );

      if (skippedPatterns.length > 0) {
        const topSkip = skippedPatterns[0];
        answer = `You have repeatedly skipped ${topSkip.category} tasks (${topSkip.skipped} skipped). Recommendation: ${topSkip.recommendation}`;
        recommendations.push({
          title: `Adapt ${topSkip.category} Scope`,
          reason: topSkip.recommendation,
          priority: 'HIGH',
          module: 'Career Execution',
          actionType: 'OPEN_EXECUTION',
        });
      } else {
        answer = `No recurring execution bottlenecks or repeated skip patterns have been detected. If you feel behind, break larger tasks into 20–30 minute daily actions.`;
      }

      suggestedActions.push({
        id: 'act-execution-problems',
        label: 'View Execution OS',
        type: 'NAVIGATION',
        actionType: 'OPEN_EXECUTION',
        payload: { route: '/student/execution' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.GOAL_RISKS: {
      const atRisk = execution?.atRiskGoals || [];

      evidence.push(
        { label: 'At-Risk Goals', value: String(atRisk.length), status: atRisk.length > 0 ? 'WARN' : 'GOOD' },
        { label: 'Execution Score', value: execution?.executionScore !== 'INSUFFICIENT_DATA' ? `${execution.executionScore}/100` : 'N/A', status: 'INFO' }
      );

      if (atRisk.length > 0) {
        const first = atRisk[0];
        answer = `You have ${atRisk.length} goal(s) currently marked at risk or overdue. Goal "${first.title}" needs attention: ${first.recommendation}`;
        for (const g of atRisk.slice(0, 3)) {
          recommendations.push({
            title: g.title,
            reason: g.recommendation,
            priority: 'HIGH',
            module: 'Career Execution',
            actionType: 'OPEN_EXECUTION',
          });
        }
      } else {
        answer = `All of your active career execution goals are currently on track! Continue logging your progress to maintain trajectory.`;
      }

      suggestedActions.push({
        id: 'act-execution-goals',
        label: 'Inspect Active Goals',
        type: 'NAVIGATION',
        actionType: 'OPEN_EXECUTION',
        payload: { route: '/student/execution' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.CONSISTENCY: {
      const consistency = execution?.consistencyScore;
      const streak = execution?.streaks?.dailyStreak || 0;

      evidence.push(
        { label: 'Consistency Score', value: consistency !== 'INSUFFICIENT_DATA' ? `${consistency}/100` : 'Needs activity', status: typeof consistency === 'number' && consistency >= 70 ? 'GOOD' : 'INFO' },
        { label: 'Daily Streak', value: `${streak} days`, status: streak >= 3 ? 'GOOD' : 'INFO' }
      );

      if (typeof consistency === 'number') {
        answer = `Your execution consistency score is ${consistency}/100 with an active streak of ${streak} day(s). Consistency measures regular active days and minimal skips, rather than burst overworking.`;
      } else {
        answer = `You are in the process of building your execution consistency history. Complete planned career tasks over several days to establish your consistency score.`;
      }

      suggestedActions.push({
        id: 'act-execution-consistency',
        label: 'View Execution Trends',
        type: 'NAVIGATION',
        actionType: 'OPEN_EXECUTION',
        payload: { route: '/student/execution' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.NEXT_WEEK_PLAN: {
      const skipped = execution?.skippedPatterns || [];
      const atRisk = execution?.atRiskGoals || [];

      evidence.push(
        { label: 'Execution Score', value: execution?.executionScore !== 'INSUFFICIENT_DATA' ? `${execution.executionScore}/100` : 'N/A', status: 'INFO' },
        { label: 'At-Risk Goals', value: String(atRisk.length), status: atRisk.length > 0 ? 'WARN' : 'GOOD' }
      );

      if (skipped.length > 0) {
        answer = `For next week, adapt your strategy: ${skipped[0].recommendation} Avoid scheduling marathon sessions and maintain a steady daily cadence.`;
      } else if (atRisk.length > 0) {
        answer = `For next week, prioritize your at-risk goal "${atRisk[0].title}". Break its remaining requirements into smaller milestones of 30 minutes each.`;
      } else {
        answer = `For next week, maintain your current execution routine. Allocate 5–15 focused hours across skill development, project milestones, and application submissions.`;
      }

      suggestedActions.push({
        id: 'act-execution-checkin',
        label: 'Weekly Check-In',
        type: 'NAVIGATION',
        actionType: 'OPEN_EXECUTION',
        payload: { route: '/student/execution' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.DO_RIGHT_NOW: {
      const candidateActions = generateRankedCandidateActions(context);
      const topAction = candidateActions[0];

      evidence.push(
        { label: 'Highest Priority', value: topAction ? topAction.title : 'None pending', status: 'GOOD' },
        { label: 'Impact Score', value: topAction ? `${topAction.impact}/100` : 'N/A', status: 'INFO' },
        { label: 'Estimated Time', value: topAction ? `${topAction.estimatedMinutes}m` : 'N/A', status: 'INFO' }
      );

      if (topAction) {
        answer = `Your single most important action right now is: "${topAction.title}". ${topAction.reason} Estimated effort: ${topAction.estimatedMinutes} minutes.`;
        recommendations.push({
          title: topAction.title,
          reason: topAction.reason,
          priority: topAction.priority,
          module: topAction.module,
          actionType: topAction.actionType,
        });
      } else {
        answer = `Your schedule is clear right now. Review your Career Roadmap or inspect open Opportunities to define your next career milestone.`;
      }

      suggestedActions.push({
        id: 'act-command-center-now',
        label: 'Open Command Center',
        type: 'NAVIGATION',
        actionType: 'OPEN_COMMAND_CENTER',
        payload: { route: '/student/command-center' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.CAREER_RISK: {
      const weakness = identifyBiggestWeakness(context);
      const atRiskGoals = execution?.atRiskGoals || [];

      evidence.push(
        { label: 'Primary Risk', value: weakness?.title || 'None critical', status: weakness ? 'WARN' : 'GOOD' },
        { label: 'At-Risk Goals', value: String(atRiskGoals.length), status: atRiskGoals.length > 0 ? 'WARN' : 'GOOD' },
        { label: 'Readiness Score', value: analytics?.careerReadinessScore !== null ? `${analytics.careerReadinessScore}/100` : 'N/A', status: 'INFO' }
      );

      if (weakness) {
        answer = `Your biggest career vulnerability right now is: ${weakness.title}. Reason: ${weakness.reason} Recommended mitigation: ${weakness.fixAction?.label || 'Take immediate action'}.`;
        recommendations.push({
          title: weakness.title,
          reason: weakness.reason,
          priority: 'HIGH',
          module: weakness.area || 'Command Center',
          actionType: 'OPEN_COMMAND_CENTER',
        });
      } else {
        answer = `No critical blockers or severe career risks were detected. Maintain your regular execution cadence.`;
      }

      suggestedActions.push({
        id: 'act-command-center-risks',
        label: 'View Career Risks',
        type: 'NAVIGATION',
        actionType: 'OPEN_COMMAND_CENTER',
        payload: { route: '/student/command-center' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.COMMAND_CENTER_OVERVIEW: {
      const readiness = analytics?.careerReadinessScore;
      const execScore = execution?.executionScore;
      const health = analytics?.careerHealthScore;

      evidence.push(
        { label: 'Career Readiness', value: readiness !== null ? `${readiness}/100` : 'Not set', status: 'INFO' },
        { label: 'Execution Score', value: execScore !== 'INSUFFICIENT_DATA' && execScore !== null ? `${execScore}/100` : 'Building', status: 'INFO' },
        { label: 'Target Role', value: targetRole, status: 'INFO' }
      );

      answer = `Here is your executive overview for ${targetRole}: Career Readiness is ${readiness !== null ? readiness + '/100' : 'calculating'}, Career Health is ${health !== null ? health + '/100' : 'building'}, and Execution consistency is ${execScore !== 'INSUFFICIENT_DATA' && execScore !== null ? execScore + '/100' : 'in progress'}. Open the Career Command Center for your unified executive dashboard.`;

      suggestedActions.push({
        id: 'act-command-center-overview',
        label: 'Open Command Center',
        type: 'NAVIGATION',
        actionType: 'OPEN_COMMAND_CENTER',
        payload: { route: '/student/command-center' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.ADAPTIVE_PLAN: {
      evidence.push(
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Adaptive Engine', value: 'Active', status: 'GOOD' },
        { label: 'Operating Mode', value: 'Dynamic Workload & Priority Calibration', status: 'INFO' }
      );

      answer = `Your Adaptive Career OS dynamically calibrates weekly hours, task sizing, and priority focus based on your actual execution consistency and career milestones. Open your Adaptive Plan to review current adaptations.`;

      recommendations.push({
        title: 'Review Adaptive Career Plan',
        reason: 'See real-time workload adjustments and priority re-ranking.',
        priority: 'HIGH',
        module: 'Adaptive Plan',
        actionType: 'OPEN_ADAPTIVE_PLAN',
      });

      suggestedActions.push({
        id: 'act-adaptive-plan',
        label: 'Open Adaptive Plan',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.WHY_PLAN_CHANGED: {
      evidence.push(
        { label: 'Adaptation Trigger', value: 'Behavioral Signals & Deadlines', status: 'INFO' },
        { label: 'Task Sizing', value: 'Calibrated to Completion Velocity', status: 'INFO' }
      );

      answer = `Your plan adapts automatically when deadlines approach, interviews are scheduled, completion rates shift, or friction is detected in specific task categories. This prevents cognitive overload and maintains steady momentum toward ${targetRole}.`;

      suggestedActions.push({
        id: 'act-adaptive-why',
        label: 'Inspect Plan Adaptations',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.EXECUTION_FRICTION: {
      evidence.push(
        { label: 'Friction Analysis', value: 'Category Skip & Overdue Tracking', status: 'INFO' },
        { label: 'Mitigation', value: 'Task Downsizing & Restructuring', status: 'GOOD' }
      );

      answer = `When tasks in categories like DSA or Projects encounter repeated skips or exceed planned durations, the engine detects execution friction and recommends sizing tasks down to 20-30 minute focused chunks to lower activation resistance.`;

      suggestedActions.push({
        id: 'act-adaptive-friction',
        label: 'View Friction Analysis',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.WEEKLY_ADAPTATION: {
      evidence.push(
        { label: 'Weekly Target', value: '5-15 hours/week bounded range', status: 'INFO' },
        { label: 'Adjustment Pace', value: 'Max ±1.5h/week gradual ramp', status: 'INFO' }
      );

      answer = `This week's plan has been adapted to balance high-leverage milestones with your historical completion velocity. Weekly commitments adjust gradually to protect consistency while preventing burnout.`;

      suggestedActions.push({
        id: 'act-adaptive-weekly',
        label: 'View Weekly Adaptation',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.INTERVIEW_MODE: {
      evidence.push(
        { label: 'Interview Mode', value: 'Active or Standby', status: 'INFO' },
        { label: 'Priority Shift', value: 'Interview prep & DSA +60%', status: 'GOOD' }
      );

      answer = `Interview Mode activates when an application enters an interview round within 7 days. It prioritizes mock technical rounds, system design, and STAR behavioral narratives while deprioritizing general applications.`;

      suggestedActions.push({
        id: 'act-adaptive-interview',
        label: 'Review Interview Plan',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.RECOVERY_PLAN: {
      evidence.push(
        { label: 'Recovery Cadence', value: '6h/week target (~1.2h/day)', status: 'INFO' },
        { label: 'Focus', value: '25-minute quick wins & backlog pruning', status: 'GOOD' }
      );

      answer = `Execution Recovery Mode reduces cognitive overhead by downsizing tasks to bite-sized 25-minute wins and rescheduling overdue backlogs. Focus on achieving 3 consecutive days of small completions to rebuild your execution streak.`;

      suggestedActions.push({
        id: 'act-adaptive-recovery',
        label: 'Activate Recovery Plan',
        type: 'NAVIGATION',
        actionType: 'OPEN_ADAPTIVE_PLAN',
        payload: { route: '/student/adaptive-plan' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.CAREER_TRAJECTORY: {
      evidence.push(
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Trajectory Tracking', value: 'Multi-Dimensional', status: 'GOOD' }
      );

      answer = `Your career trajectory is evaluated across skills, portfolio proof, resume readiness, execution consistency, and application conversions. Open Career Trajectory to inspect dimensional trends and progression velocity.`;

      recommendations.push({
        title: 'Review Career Trajectory',
        reason: 'Measure whether preparation is converting into authentic career progress.',
        priority: 'HIGH',
        module: 'Career Trajectory',
        actionType: 'OPEN_CAREER_TRAJECTORY',
      });

      suggestedActions.push({
        id: 'act-trajectory',
        label: 'Open Career Trajectory',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.CAREER_BOTTLENECK: {
      evidence.push(
        { label: 'Bottleneck Analysis', value: 'Cross-Module Diagnostics', status: 'INFO' },
        { label: 'Focus', value: 'Single Highest Impact Blocker', status: 'WARN' }
      );

      answer = `Your primary career bottleneck is evaluated against your target role requirements, evidence linkage, and application funnel. Open Career Trajectory to see the exact blocker and recommended mitigation action.`;

      suggestedActions.push({
        id: 'act-bottleneck',
        label: 'Inspect Career Bottleneck',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.OUTCOME_REVIEW: {
      evidence.push(
        { label: 'Review Period', value: '7-Day & 30-Day Outcomes', status: 'INFO' },
        { label: 'Metrics', value: 'Verified Wins & Regressions', status: 'GOOD' }
      );

      answer = `Your weekly outcome review tracks confirmed milestones, evidence gains, application submissions, and regressions without vanity metrics. Check your Career Trajectory dashboard for your comprehensive review.`;

      suggestedActions.push({
        id: 'act-outcome-review',
        label: 'View Outcome Review',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.MILESTONE_STATUS: {
      evidence.push(
        { label: 'Milestone Engine', value: 'Deterministic Stage Unlocks', status: 'INFO' }
      );

      answer = `Your next milestones break down your path to job readiness into concrete, verifiable unlocks. Track your milestone status and progress directly in the Career Trajectory engine.`;

      suggestedActions.push({
        id: 'act-milestones',
        label: 'View Career Milestones',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.FORECAST: {
      evidence.push(
        { label: 'Forecast Methodology', value: 'Rolling Historical Movement', status: 'INFO' },
        { label: 'Min Snapshots', value: '3 historical records required', status: 'INFO' }
      );

      answer = `Career milestone forecasts require at least 3 historical snapshots and project conservative estimates based strictly on verified movement. Career outcomes cannot be guaranteed, but steady execution shortens your timeline.`;

      suggestedActions.push({
        id: 'act-forecast',
        label: 'Inspect Forecast',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.APPLICATION_CONVERSION: {
      evidence.push(
        { label: 'Funnel Stages', value: 'Applied → OA → Interview → Final → Offer', status: 'INFO' },
        { label: 'Conversion Rates', value: 'Safe Zero Handling', status: 'GOOD' }
      );

      answer = `Your career conversion funnel tracks transitions from Applied → OA → Interview → Final Round → Offer with honest conversion rates. Inspect your funnel in the Career Trajectory dashboard.`;

      suggestedActions.push({
        id: 'act-conversion',
        label: 'View Conversion Funnel',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    case INTENTS.WHY_STAGNATING: {
      evidence.push(
        { label: 'Stagnation Diagnosis', value: 'Activity vs Progression Check', status: 'WARN' }
      );

      answer = `Stagnation occurs when activity is high but fails to convert into demonstrable evidence, applications, or interviews. The outcome engine identifies whether unverified projects or application hesitation is stalling your progression.`;

      suggestedActions.push({
        id: 'act-stagnation',
        label: 'Diagnose Stagnation',
        type: 'NAVIGATION',
        actionType: 'OPEN_CAREER_TRAJECTORY',
        payload: { route: '/student/career-trajectory' },
        requiresConfirmation: false,
      });
      break;
    }

    default: {
      evidence.push(
        { label: 'Target Role', value: targetRole, status: 'INFO' },
        { label: 'Profile Completion', value: `${profile?.profileCompletion || 0}%`, status: 'INFO' },
        { label: 'Career Health', value: analytics?.careerHealthScore !== null ? `${analytics.careerHealthScore}/100` : 'Unavailable', status: 'INFO' }
      );

      answer = `Here is your career execution overview for ${targetRole}. Focus on completing your daily tasks, bridging core skill gaps, and maintaining application momentum.`;

      recommendations.push({
        title: "Review Today's Career Plan",
        reason: 'Daily execution directly drives long-term career readiness.',
        priority: 'HIGH',
        module: 'Daily Planner',
        actionType: 'OPEN_DAILY_PLAN',
      });

      suggestedActions.push({
        id: 'act-dashboard',
        label: 'Open Daily Planner',
        type: 'NAVIGATION',
        actionType: 'OPEN_DAILY_PLAN',
        payload: { route: '/student/reminders' },
        requiresConfirmation: false,
      });
      break;
    }
  }

  return {
    intent,
    answer,
    evidence,
    recommendations,
    suggestedActions,
  };
}

/* ─── Pluggable AI Response Layer with Fallback ──────────────────── */

const { llmService } = require('./llm/llm.service');

/**
 * Optional AI Formatter: If LLM is configured and enabled, enhances natural language delivery.
 * If not enabled, timeout occurs, or an error occurs, falls back cleanly to the deterministic analysis.
 */
async function formatWithAI(deterministicResult, cleanMessage, context) {
  return llmService.enhanceWithLLM({
    cleanMessage,
    deterministicResult,
    context,
  });
}

/* ─── Main Service Query Pipeline ────────────────────────────────── */

/**
 * Sanitizes user query against prompt-injection attacks and input limits.
 */
function sanitizeUserQuery(message) {
  if (typeof message !== 'string') return '';
  // Limit length to 1000 characters
  let clean = message.slice(0, 1000).trim();

  // Repeatedly strip potential instruction override prefixes (Prompt-Injection Defense)
  const injectionPattern = /^(system prompt:?|ignore previous instructions:?|disregard instructions:?|developer mode:?)/gi;
  while (injectionPattern.test(clean)) {
    clean = clean.replace(injectionPattern, '').trim();
  }

  return clean;
}

/**
 * Executes full Career Copilot query flow for authenticated student.
 */
async function processCopilotQuery(userId, rawMessage) {
  const cleanMessage = sanitizeUserQuery(rawMessage);

  if (!cleanMessage) {
    throw new Error('Message must not be empty.');
  }

  // 1. Gather comprehensive student context
  const context = await buildCopilotContext(userId);

  // 2. Deterministic Intent Classification
  const intent = classifyIntent(cleanMessage);

  // 3. Deterministic Career Reasoning
  const deterministicResult = analyzeCareerContext(intent, context);

  // 4. Optional AI Formatting layer with instant fallback
  const finalResponse = await formatWithAI(deterministicResult, cleanMessage, context);

  // 5. Sanitize and validate actions against strict allowlist
  finalResponse.suggestedActions = (finalResponse.suggestedActions || [])
    .filter((action) => action && typeof action.actionType === 'string' && ALL_ALLOWED_ACTIONS.includes(action.actionType))
    .map((action) => {
      const isMutation = ALLOWED_MUTATION_ACTIONS.includes(action.actionType);
      return {
        ...action,
        requiresConfirmation: isMutation ? true : Boolean(action.requiresConfirmation),
      };
    });

  return finalResponse;
}

module.exports = {
  INTENTS,
  ALLOWED_NAVIGATION_ACTIONS,
  ALLOWED_MUTATION_ACTIONS,
  ALL_ALLOWED_ACTIONS,
  classifyIntent,
  analyzeCareerContext,
  sanitizeUserQuery,
  processCopilotQuery,
  formatWithAI,
};
