/**
 * weeklyStrategy.service.js
 *
 * Personalized Weekly Strategy generator for Career Odyssey.
 * Builds an adaptive, realistic weekly career execution plan (5–15 hours/week)
 * with prioritized objectives and dynamically weighted time allocation.
 */

const { buildCopilotContext } = require('./copilotContext.service');
const { generateRankedCandidateActions } = require('./careerIntelligence.service');

/**
 * Calculates adaptive time budget percentages based on immediate student urgency
 */
function calculateAdaptiveTimeBudget(context) {
  const budget = {
    skillDevelopment: 30,
    projects: 25,
    dsa: 15,
    resumeAndInterviews: 15,
    applications: 15,
  };

  // If upcoming interview: shift weight towards Interview Preparation
  if (context.applications?.upcomingInterviews?.length > 0) {
    budget.resumeAndInterviews += 15;
    budget.dsa -= 5;
    budget.projects -= 10;
  }
  // If severe skill gap (>= 3 missing): increase Skill Development
  else if ((context.skillGap?.missingSkills || []).length >= 3) {
    budget.skillDevelopment += 15;
    budget.applications -= 10;
    budget.projects -= 5;
  }
  // If zero applications and student is ready: shift to Applications
  else if (
    context.applications?.total === 0 &&
    (context.analytics?.careerReadinessScore || 0) >= 65
  ) {
    budget.applications += 15;
    budget.skillDevelopment -= 10;
    budget.dsa -= 5;
  }

  return budget;
}

/**
 * Generates the personalized weekly strategy
 */
async function generateWeeklyStrategy(userId) {
  const context = await buildCopilotContext(userId);
  const rankedActions = generateRankedCandidateActions(context);

  // Pick top 3 to 5 major weekly objectives
  const objectives = rankedActions.slice(0, 5).map((action, idx) => ({
    order: idx + 1,
    title: action.title,
    priority: action.priority,
    why: action.reason,
    expectedImpact: action.impact >= 85 ? 'High expected impact' : 'Moderate expected impact',
    estimatedMinutes: action.estimatedMinutes || 45,
    module: action.module,
    actionType: action.actionType,
    relatedEntityType: action.relatedEntityType || null,
    relatedEntityId: action.relatedEntityId || null,
  }));

  const timeBudgetDistribution = calculateAdaptiveTimeBudget(context);

  // Calculate target weekly time (realistic 5–15 hours based on task counts)
  let totalEstimatedMinutes = objectives.reduce((sum, o) => sum + o.estimatedMinutes * 3, 0);
  // Clamp between 300 minutes (5 hours) and 900 minutes (15 hours)
  totalEstimatedMinutes = Math.min(900, Math.max(300, totalEstimatedMinutes));
  const totalEstimatedHours = Number((totalEstimatedMinutes / 60).toFixed(1));

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const weekLabel = `Week of ${startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return {
    weekLabel,
    totalEstimatedHours,
    totalEstimatedMinutes,
    timeBudgetDistribution,
    objectives,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  calculateAdaptiveTimeBudget,
  generateWeeklyStrategy,
};
