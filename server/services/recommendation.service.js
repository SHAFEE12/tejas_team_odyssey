/**
 * recommendation.service.js
 *
 * Deterministic Mentor Recommendation Engine.
 * Evaluates holistic student evidence across skills, projects, DSA,
 * GitHub, applications, assessments, and execution to generate high-signal,
 * actionable mentoring recommendations.
 *
 * Every recommendation includes:
 * - title
 * - what
 * - why
 * - evidence
 * - priority (HIGH, MEDIUM, LOW)
 * - suggestedAction
 * - category
 * - linkedSkill
 */

const SkillProfile = require('../models/SkillProfile');
const Project = require('../models/Project');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const Application = require('../models/Application');
const Evaluation = require('../models/Evaluation');
const ExecutionTask = require('../models/ExecutionTask');
const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');
const { computeFitScore } = require('./opportunity.service');

/**
 * Pure evaluation function generating deterministic recommendations from student telemetry.
 */
function generateDeterministicRecommendations(telemetry = {}) {
  const {
    targetRole = '',
    skills = [],
    skillGaps = [],
    projects = [],
    githubProfile = null,
    dsaProfile = null,
    applications = [],
    readinessScore = 0,
    evaluations = [],
    executionTasks = [],
  } = telemetry;

  const recommendations = [];

  // 1. Major Skill Gap Check
  if (skillGaps && skillGaps.length > 0) {
    const highPriorityGaps = skillGaps.filter(
      (g) => g.priority === 'HIGH' || g.severity === 'HIGH' || g.status === 'MISSING'
    );
    const targetGap = highPriorityGaps[0] || skillGaps[0];
    const skillName = targetGap.name || targetGap.skill || 'Core Technical Skill';

    recommendations.push({
      id: `rec-skill-${skillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      type: 'SKILL_GAP',
      category: 'Skills & Knowledge',
      title: `Improve ${skillName} Proficiency`,
      what: `Address high-priority curriculum gap in ${skillName}.`,
      why: targetRole
        ? `Student's target role (${targetRole}) requires verified proficiency in ${skillName}, but current evidence indicates a gap.`
        : `Target role demands ${skillName} competency, but evidence is insufficient or missing.`,
      evidence: `Identified in skill gap analyzer with severity: ${targetGap.priority || 'HIGH'}. Current demonstrated proficiency is below industry threshold.`,
      priority: 'HIGH',
      suggestedAction: `Complete the ${skillName} roadmap milestone and build a hands-on project incorporating this technology.`,
      linkedSkill: skillName,
    });
  }

  // 2. Project Portfolio Evidence Check
  const verifiedProjects = projects.filter((p) => p.title || (p.skills && p.skills.length > 0) || p.liveUrl || p.repoUrl);
  if (verifiedProjects.length < 2) {
    recommendations.push({
      id: 'rec-project-evidence',
      type: 'PROJECT_EVIDENCE',
      category: 'Practical Engineering',
      title: 'Strengthen Project Portfolio Evidence',
      what: 'Add production-grade, verifiable full-stack or systems projects to your portfolio.',
      why: 'Engineering recruiters heavily weigh demonstrable projects with deployed links and structured repositories over resume bullet points.',
      evidence: `Student currently has only ${verifiedProjects.length} documented project(s) with tangible deliverables. Minimum benchmark is 2 complete projects.`,
      priority: 'HIGH',
      suggestedAction: 'Build and deploy a full-featured application addressing your target domain, with complete README, live deployment link, and architecture documentation.',
      linkedSkill: targetRole || 'Software Engineering',
    });
  }

  // 3. GitHub & Open Source Evidence Check
  const hasGitHub = Boolean(githubProfile?.username || githubProfile?.connected);
  const repoCount = githubProfile?.publicRepos || 0;
  if (!hasGitHub || repoCount === 0) {
    recommendations.push({
      id: 'rec-github-proof',
      type: 'GITHUB_PROOF',
      category: 'Code Evidence',
      title: 'Showcase Verifiable GitHub Codebase',
      what: 'Connect GitHub and ensure active public repository commits.',
      why: 'Public source code verification validates real-world Git workflow, coding conventions, and documentation capability.',
      evidence: !hasGitHub
        ? 'GitHub profile is currently unlinked from student profile.'
        : `Student GitHub account has 0 indexed repositories with regular commit cadence.`,
      priority: 'MEDIUM',
      suggestedAction: 'Link your primary GitHub profile and push clean, well-documented repository commits showcasing your problem-solving.',
      linkedSkill: 'Git & Version Control',
    });
  }

  // 4. DSA / Problem Solving Practice Check
  const totalSolved = dsaProfile?.totalSolved || dsaProfile?.stats?.totalSolved || 0;
  if (totalSolved < 50) {
    recommendations.push({
      id: 'rec-dsa-practice',
      type: 'DSA_FOUNDATION',
      category: 'Algorithmic Problem Solving',
      title: 'Accelerate Algorithmic & DSA Practice',
      what: 'Establish a consistent routine solving fundamental data structures and algorithms problems.',
      why: 'Technical screening rounds at tier-1 and product companies require algorithmic fluency across Arrays, Strings, Trees, and Dynamic Programming.',
      evidence: `Current solved count is ${totalSolved} problems, which is below the benchmark of 50+ medium-complexity problems.`,
      priority: 'MEDIUM',
      suggestedAction: 'Solve 2 problems daily focusing on sliding window, two-pointer, and binary search patterns on LeetCode/HackerRank.',
      linkedSkill: 'Algorithms & Data Structures',
    });
  }

  // 5. Readiness vs Application Volume Check
  if (readinessScore >= 55 && applications.length < 3) {
    recommendations.push({
      id: 'rec-application-campaign',
      type: 'APPLICATION_FUNNEL',
      category: 'Career Execution',
      title: 'Launch Targeted Internship & Job Applications',
      what: 'Convert strong technical readiness into active hiring pipeline applications.',
      why: 'Candidate has developed strong foundational readiness, but hiring funnels require early application lead time to schedule interviews.',
      evidence: `Career Readiness Score is strong (${readinessScore}/100), but student has only ${applications.length} active application(s) logged.`,
      priority: 'HIGH',
      suggestedAction: 'Tailor resume for 5 curated matching opportunities and submit formal applications this week.',
      linkedSkill: 'Career Transition',
    });
  }

  // 6. Assessment / Evaluation Score Remediation Check
  if (evaluations && evaluations.length > 0) {
    const recentEval = evaluations[0];
    const scorePct = recentEval.scores?.percentage ?? (recentEval.scores?.overallScore || 0);
    if (scorePct < 60) {
      recommendations.push({
        id: `rec-eval-remediation-${recentEval._id || 'recent'}`,
        type: 'EVALUATION_REMEDIATION',
        category: 'Academic Remediation',
        title: 'Academic Assessment Remediation',
        what: 'Review evaluation feedback and address deficient evaluation rubric criteria.',
        why: 'Recent technical evaluation score fell below satisfactory proficiency threshold.',
        evidence: `Latest evaluation scored ${scorePct}% (threshold: 60%). Key weaknesses identified: ${(recentEval.weaknesses || []).join(', ') || 'Core concepts'}.`,
        priority: 'HIGH',
        suggestedAction: 'Schedule a 1-on-1 mentor sync to review the evaluation weaknesses and resubmit remediated assignment.',
        linkedSkill: (recentEval.skillEvaluations?.[0]?.skillName) || 'Technical Evaluation',
      });
    }
  }

  // 7. Execution Tasks Declining / Zero Execution Check
  const completedTasks = executionTasks.filter((t) => t.status === 'COMPLETED' || t.completed);
  if (executionTasks.length > 0 && completedTasks.length / executionTasks.length < 0.3) {
    recommendations.push({
      id: 'rec-execution-pacing',
      type: 'EXECUTION_PACING',
      category: 'Execution Strategy',
      title: 'Refactor Execution Plan into Smaller Sprints',
      what: 'Break down overarching career roadmap tasks into daily micro-deliverables.',
      why: 'Low task completion rate indicates cognitive overload or oversized milestones.',
      evidence: `Completion rate is ${(completedTasks.length / executionTasks.length * 100).toFixed(0)}% across ${executionTasks.length} assigned tasks.`,
      priority: 'MEDIUM',
      suggestedAction: 'Scope daily goals to under 45 minutes each and commit to 3 consecutive daily completions.',
      linkedSkill: 'Time Management & Execution',
    });
  }

  return recommendations;
}

/**
 * Fetch student telemetry from database and generate recommendations.
 */
async function getStudentRecommendations(studentId) {
  const [
    skillProfile,
    projects,
    githubProfile,
    dsaProfile,
    applications,
    evaluations,
    executionTasks,
    latestSnapshot,
  ] = await Promise.all([
    SkillProfile.findOne({ user: studentId }).lean(),
    Project.find({ user: studentId }).lean(),
    GitHubProfile.findOne({ user: studentId }).lean(),
    DSAProfile.findOne({ user: studentId }).lean(),
    Application.find({ user: studentId }).lean(),
    Evaluation.find({ student: studentId }).sort({ createdAt: -1 }).limit(5).lean(),
    ExecutionTask.find({ user: studentId }).sort({ createdAt: -1 }).limit(10).lean(),
    CommandCenterSnapshot.findOne({ user: studentId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Extract skills and target role
  const targetRole = skillProfile?.targetRole || '';
  const skills = skillProfile?.skills || [];

  // Derive simple skill gaps if not precomputed
  const skillGaps = [];
  if (targetRole && skills.length === 0) {
    skillGaps.push({
      name: 'Foundation Skills',
      priority: 'HIGH',
      status: 'MISSING',
    });
  }

  const readinessScore = latestSnapshot?.readinessScore || latestSnapshot?.score || 45;

  return generateDeterministicRecommendations({
    targetRole,
    skills,
    skillGaps,
    projects,
    githubProfile,
    dsaProfile,
    applications,
    readinessScore,
    evaluations,
    executionTasks,
  });
}

module.exports = {
  generateDeterministicRecommendations,
  getStudentRecommendations,
};
