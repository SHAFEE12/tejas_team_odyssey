/**
 * roadmap.service.js
 *
 * Deterministic Personalized Career Roadmap Engine for Career Odyssey.
 *
 * Consumes:
 * 1. Target Role & Role Requirements (from careerRoles.js)
 * 2. Authoritative Skill Gap Analysis (from skillGap.service.js)
 * 3. My Skills Profile (SkillProfile model)
 * 4. Resume Analyzer (Resume model)
 * 5. GitHub Public Activity (GitHubProfile model)
 * 6. DSA / LeetCode Stats (DSAProfile model)
 *
 * Features:
 * - 6 adaptable, structured phases
 * - Role-specific, gap-driven learning tasks, projects, and evidence milestones
 * - Preserves existing task completion statuses upon roadmap regeneration
 * - 100% deterministic (no AI dependency required)
 */

const { analyzeSkillGap } = require('./skillGap.service');
const { findRoleRequirements } = require('../data/careerRoles');

/**
 * Helper to generate slugified task ID
 */
function makeTaskId(prefix, skillOrName) {
  const clean = (skillOrName || 'task')
    .toLowerCase()
    .trim()
    .replace(/[._\-/\\]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
  return `${prefix}-${clean}`;
}

/**
 * Skill-specific completion criteria dictionary
 */
const SKILL_COMPLETION_CRITERIA = {
  javascript: [
    'Understand ES6+ syntax, Promises, async/await, and the Event Loop',
    'Build modular applications using closures and prototypes',
    'Demonstrate clean asynchronous API fetching and error handling',
  ],
  typescript: [
    'Define strict interfaces, types, union types, and generics',
    'Configure tsconfig.json and migrate or build a typed module',
    'Ensure 0 any types across core business logic',
  ],
  react: [
    'Master functional components, custom hooks, and context API',
    'Implement responsive component layouts and state management',
    'Demonstrate optimized rendering and API integration',
  ],
  'node.js': [
    'Build modular server scripts with Express router architecture',
    'Implement middleware, error handlers, and file stream processing',
    'Handle environment variables and asynchronous database connections',
  ],
  'express.js': [
    'Structure RESTful routes with HTTP verbs and status codes',
    'Implement authentication middleware with JWT verification',
    'Add centralized error handling and request validation schemas',
  ],
  sql: [
    'Write complex multi-table JOINs, subqueries, and aggregations',
    'Design normalized schemas (3NF) with primary and foreign keys',
    'Optimize query execution using indexes and explain plans',
  ],
  mongodb: [
    'Design document schemas and define Mongoose models with validation',
    'Write multi-stage aggregation pipelines ($match, $group, $lookup)',
    'Implement index strategies for fast collection querying',
  ],
  docker: [
    'Understand container architecture, images, layers, and registries',
    'Write optimized multi-stage Dockerfiles for frontend/backend services',
    'Orchestrate multi-container setups using docker-compose.yml',
  ],
  git: [
    'Master git branching, commit conventions, and rebasing',
    'Create pull requests with descriptive summaries on GitHub',
    'Resolve merge conflicts cleanly without overwriting teammate code',
  ],
  linux: [
    'Navigate command line, manage file permissions (chmod/chown)',
    'Inspect server processes (ps, top, systemctl) and inspect system logs',
    'Write reusable bash shell scripts for automated tasks',
  ],
  aws: [
    'Configure IAM users, groups, and least-privilege policies',
    'Provision compute instances (EC2) and object storage (S3)',
    'Configure VPC security groups, subnets, and routing rules',
  ],
  'ci/cd': [
    'Write GitHub Actions workflows triggered on push and pull requests',
    'Automate test execution, linting, and build verification',
    'Set up automated deployment steps with secret environment variables',
  ],
  'machine learning': [
    'Implement supervised and unsupervised statistical algorithms',
    'Perform data preprocessing, feature engineering, and cross-validation',
    'Evaluate models using ROC-AUC, precision, recall, and F1 score',
  ],
  'deep learning': [
    'Understand neural network forward/backward propagation and loss functions',
    'Train convolutional (CNN) or sequence/transformer models with PyTorch',
    'Prevent overfitting using dropout, regularization, and early stopping',
  ],
  pytorch: [
    'Construct custom nn.Module architectures and forward loops',
    'Build efficient Dataset and DataLoader pipelines with batching',
    'Implement training and validation loops with loss backpropagation',
  ],
  pandas: [
    'Perform data cleaning, filtering, and missing-value imputation',
    'Group and aggregate large tabular datasets with groupby and pivot',
    'Merge, join, and reshape DataFrames efficiently',
  ],
  numpy: [
    'Utilize multidimensional ndarrays and vectorized operations',
    'Apply broadcasting, boolean masking, and linear algebra computations',
  ],
  'rest apis': [
    'Design stateless RESTful resource endpoints with standard status codes',
    'Implement pagination, sorting, and query parameter filtering',
    'Secure endpoints with JWT auth, rate limiting, and input sanitization',
  ],
  tailwindcss: [
    'Build responsive, accessible layouts using flexbox and grid utilities',
    'Implement dark mode and customized theme colors in tailwind.config',
    'Create reusable, clean component designs without arbitrary CSS overrides',
  ],
};

/**
 * Role-specific project blueprint generator
 */
function generateRoleProjects(targetRole, missingSkills, coveredSkills) {
  const roleLower = (targetRole || '').toLowerCase();

  if (roleLower.includes('front')) {
    return [
      {
        taskId: 'project-frontend-interactive-platform',
        title: 'Interactive Frontend Application with State & Routing',
        description:
          'Design and build a polished, production-grade interactive client web app featuring custom hooks, client-side routing, responsive UI, and persistent mock/live API data.',
        type: 'PROJECT',
        relatedSkill: 'React',
        phaseId: 'phase-3-projects',
        phaseNumber: 3,
        phaseTitle: 'Practical Projects',
        priority: 'HIGH',
        estimatedEffort: '1-2 weeks',
        prerequisites: ['HTML5', 'CSS3', 'JavaScript', 'React'],
        completionCriteria: [
          'Responsive component design supporting mobile and desktop layouts',
          'Modular state management with Context or Redux Toolkit',
          'Client-side routing with protected route authentication guards',
          'Async API fetching with graceful loading skeletons and error states',
          'Published on GitHub with clean README and live deployment link',
        ],
        evidenceExpected: 'Public GitHub repository link with live demo URL in README',
        whyItMatters: 'Demonstrates end-to-end frontend development and architectural capability to recruiters.',
      },
      {
        taskId: 'project-frontend-design-system',
        title: 'Accessible Component Library & Design System',
        description:
          'Create a reusable UI component kit (buttons, modals, dropdowns, forms) with strict TypeScript types, accessible ARIA attributes, and theme customization.',
        type: 'PROJECT',
        relatedSkill: 'TailwindCSS',
        phaseId: 'phase-3-projects',
        phaseNumber: 3,
        phaseTitle: 'Practical Projects',
        priority: 'MEDIUM',
        estimatedEffort: '1 week',
        prerequisites: ['React', 'TailwindCSS', 'TypeScript'],
        completionCriteria: [
          '5+ reusable, accessible UI primitives with keyboard navigation',
          'Consistent styling tokens using Tailwind utility classes',
          'TypeScript interface definitions for all component props',
          'Documented usage examples in repository README',
        ],
        evidenceExpected: 'GitHub repository with component documentation',
        whyItMatters: 'Highlights component architecture and attention to UX accessibility.',
      },
    ];
  }

  if (roleLower.includes('back')) {
    return [
      {
        taskId: 'project-backend-scalable-api',
        title: 'Scalable REST API with Authentication & Database',
        description:
          'Build a robust backend API featuring JWT authentication, role-based access control, database indexing, caching with Redis, and automated integration tests.',
        type: 'PROJECT',
        relatedSkill: 'Node.js',
        phaseId: 'phase-3-projects',
        phaseNumber: 3,
        phaseTitle: 'Practical Projects',
        priority: 'HIGH',
        estimatedEffort: '1-2 weeks',
        prerequisites: ['Node.js', 'Express.js', 'SQL', 'MongoDB'],
        completionCriteria: [
          'RESTful endpoints with CRUD operations and pagination',
          'Secure JWT authentication and password hashing (bcrypt)',
          'Normalized relational database schema or optimized NoSQL aggregation',
          'Request validation schemas and centralized error handling middleware',
          'Containerized with Dockerfile and docker-compose',
        ],
        evidenceExpected: 'GitHub repository with Postman collection / API documentation',
        whyItMatters: 'Provides concrete proof of server architecture and database design skills.',
      },
    ];
  }

  if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('analyst')) {
    return [
      {
        taskId: 'project-data-pipeline-analytics',
        title: 'End-to-End Data Analysis & Predictive Pipeline',
        description:
          'Collect, clean, and analyze a real-world dataset to extract statistical insights, train a predictive baseline model, and present findings in an interactive dashboard.',
        type: 'PROJECT',
        relatedSkill: 'Python',
        phaseId: 'phase-3-projects',
        phaseNumber: 3,
        phaseTitle: 'Practical Projects',
        priority: 'HIGH',
        estimatedEffort: '1-2 weeks',
        prerequisites: ['Python', 'SQL', 'Pandas', 'NumPy'],
        completionCriteria: [
          'Data wrangling and exploratory data analysis documented in Jupyter notebooks',
          'Feature engineering and statistical modeling with Scikit-learn',
          'Interactive visualization dashboard or summary presentation',
          'GitHub repository with clear data dictionary and executive summary',
        ],
        evidenceExpected: 'GitHub repository with analysis notebook and visualizations',
        whyItMatters: 'Shows ability to turn raw data into actionable decision-making insights.',
      },
    ];
  }

  if (roleLower.includes('devops') || roleLower.includes('cloud')) {
    return [
      {
        taskId: 'project-devops-infrastructure-pipeline',
        title: 'Automated Multi-Service CI/CD & Cloud Infrastructure',
        description:
          'Deploy a multi-container web application with automated testing, Docker containerization, GitHub Actions CI/CD workflows, and Nginx reverse proxy configuration.',
        type: 'PROJECT',
        relatedSkill: 'Docker',
        phaseId: 'phase-3-projects',
        phaseNumber: 3,
        phaseTitle: 'Practical Projects',
        priority: 'HIGH',
        estimatedEffort: '1-2 weeks',
        prerequisites: ['Linux', 'Docker', 'Git', 'CI/CD'],
        completionCriteria: [
          'Multi-stage Docker builds optimizing image size',
          'docker-compose orchestration for app, database, and cache',
          'Automated GitHub Actions pipeline running tests on PRs',
          'Nginx configuration with reverse proxy and SSL routing',
        ],
        evidenceExpected: 'GitHub repository with workflow files and architectural diagram',
        whyItMatters: 'Demonstrates modern cloud engineering and DevOps automation practices.',
      },
    ];
  }

  // Default: Full Stack / General Software Engineer Project
  return [
    {
      taskId: 'project-fullstack-production-app',
      title: 'Full Stack Production Web Application',
      description:
        'Develop an end-to-end full stack application connecting an interactive client interface to a secure backend API with persistent database storage and authentication.',
      type: 'PROJECT',
      relatedSkill: 'JavaScript',
      phaseId: 'phase-3-projects',
      phaseNumber: 3,
      phaseTitle: 'Practical Projects',
      priority: 'HIGH',
      estimatedEffort: '2 weeks',
      prerequisites: ['JavaScript', 'React', 'Node.js', 'SQL'],
      completionCriteria: [
        'Complete CRUD functionality between React frontend and Node backend',
        'Secure user authentication with session/token management',
        'Structured database persistence with relational or document models',
        'Comprehensive README with installation steps and architectural overview',
      ],
      evidenceExpected: 'Public GitHub repository link with live demo URL',
      whyItMatters: 'Demonstrates full lifecycle software engineering competence.',
    },
  ];
}

/**
 * Main Roadmap Generation Engine
 *
 * @param {Object} params
 * @param {Object} params.skillProfile - Student's SkillProfile document
 * @param {Object} params.resume - Student's Resume document
 * @param {Object} params.githubProfile - Student's GitHubProfile document
 * @param {Object} params.dsaProfile - Student's DSAProfile document
 * @param {Object} params.existingRoadmap - Previously stored Roadmap document (to preserve completed tasks)
 * @returns {Object} Structured roadmap object
 */
function generateRoadmapData({
  skillProfile,
  resume,
  githubProfile,
  dsaProfile,
  existingRoadmap = null,
}) {
  // 1. Authoritative Skill Gap Evaluation
  const gapAnalysis = analyzeSkillGap({
    skillProfile,
    resume,
    githubProfile,
    dsaProfile,
  });

  const targetRole = gapAnalysis.targetRole;
  const hasCareerGoal = gapAnalysis.metadata.hasCareerGoal;
  const isRoleConfigured = gapAnalysis.metadata.isRoleConfigured;

  // If no career goal is set
  if (!hasCareerGoal) {
    return {
      targetRole: targetRole.name || 'Unset',
      roleId: targetRole.id || 'unset',
      roleCategory: 'General',
      requirementsVersion: '1.0',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      phases: [],
      tasks: [],
      metadata: {
        hasCareerGoal: false,
        isRoleConfigured: false,
        generatedAt: new Date().toISOString(),
      },
      gapSummary: gapAnalysis.summary,
      dataSources: gapAnalysis.dataSources,
    };
  }

  // Create a map of existing task completion states for seamless regeneration
  const existingStatusMap = new Map();
  if (existingRoadmap && Array.isArray(existingRoadmap.tasks)) {
    existingRoadmap.tasks.forEach((t) => {
      existingStatusMap.set(t.taskId, {
        status: t.status,
        completedAt: t.completedAt,
      });
    });
  }

  const generatedTasks = [];

  // Group skills by gap classification
  const missingSkills = gapAnalysis.skills.filter((s) => s.status === 'MISSING');
  const partialSkills = gapAnalysis.skills.filter((s) => s.status === 'PARTIAL');
  const resumeGapSkills = gapAnalysis.skills.filter((s) => s.status === 'RESUME_EVIDENCE_MISSING');
  const coveredSkills = gapAnalysis.skills.filter((s) => s.status === 'COVERED');

  /* ─────────────────────────────────────────────────────────────
     PHASE 1: FOUNDATION & PREREQUISITES
  ───────────────────────────────────────────────────────────── */
  const foundationalRequirements = ['Git', 'JavaScript', 'Python', 'Linux', 'SQL'];
  const missingFoundations = gapAnalysis.skills.filter(
    (s) =>
      foundationalRequirements.some((f) => s.skill.toLowerCase().includes(f.toLowerCase())) &&
      (s.status === 'MISSING' || s.status === 'PARTIAL')
  );

  if (missingFoundations.length > 0) {
    missingFoundations.forEach((fSkill) => {
      const taskId = makeTaskId('learn-foundation', fSkill.skill);
      const cleanKey = fSkill.skill.toLowerCase();
      generatedTasks.push({
        taskId,
        title: `Master ${fSkill.skill} Fundamentals & Version Control`,
        description: `Build a rock-solid foundation in ${fSkill.skill}. This core competency is a prerequisite for advanced role implementations.`,
        type: 'LEARN',
        relatedSkill: fSkill.skill,
        phaseId: 'phase-1-foundation',
        phaseNumber: 1,
        phaseTitle: 'Foundation & Prerequisites',
        priority: 'HIGH',
        estimatedEffort: '3-5 days',
        prerequisites: [],
        completionCriteria:
          SKILL_COMPLETION_CRITERIA[cleanKey] || [
            `Understand core principles and syntax of ${fSkill.skill}`,
            `Write modular, documented code following community conventions`,
            `Push code examples to a version-controlled repository`,
          ],
        evidenceExpected: 'Clean sample scripts or exercises pushed to GitHub',
        whyItMatters: fSkill.reason || 'Foundational prerequisite for engineering workflows.',
      });
    });
  } else {
    // If all foundation skills are already covered, create a lightweight milestone task
    generatedTasks.push({
      taskId: 'foundation-baseline-verified',
      title: 'Foundational Competencies Verified',
      description:
        'Core development foundations (Git, command line, core programming paradigms) are verified across your active profile.',
      type: 'PRACTICE',
      relatedSkill: null,
      phaseId: 'phase-1-foundation',
      phaseNumber: 1,
      phaseTitle: 'Foundation & Prerequisites',
      priority: 'LOW',
      estimatedEffort: '1 day',
      prerequisites: [],
      completionCriteria: [
        'Maintain clean branch management and commit etiquette on GitHub',
        'Keep environment tooling and package versions up-to-date',
      ],
      evidenceExpected: 'Consistent GitHub commit history',
      whyItMatters: 'Foundational hygiene ensures smooth team collaboration.',
    });
  }

  /* ─────────────────────────────────────────────────────────────
     PHASE 2: PRIORITY SKILL GAPS
  ───────────────────────────────────────────────────────────── */
  // Exclude foundation skills already handled in phase 1
  const remainingGaps = [...missingSkills, ...partialSkills].filter(
    (s) => !generatedTasks.some((t) => t.relatedSkill === s.skill)
  );

  // Sort by priority: HIGH first, then MEDIUM, then LOW
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  remainingGaps.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.importance === 'required' && b.importance !== 'required') return -1;
    if (b.importance === 'required' && a.importance !== 'required') return 1;
    return a.skill.localeCompare(b.skill);
  });

  if (remainingGaps.length > 0) {
    remainingGaps.forEach((gapSkill) => {
      const taskId = makeTaskId('learn-gap', gapSkill.skill);
      const cleanKey = gapSkill.skill.toLowerCase();

      const isPartial = gapSkill.status === 'PARTIAL';
      const title = isPartial
        ? `Advance ${gapSkill.skill} Proficiency to Production Standard`
        : `Learn ${gapSkill.skill} Architecture & Core Patterns`;

      generatedTasks.push({
        taskId,
        title,
        description: gapSkill.recommendation || `Develop practical proficiency in ${gapSkill.skill} tailored for ${targetRole.name}.`,
        type: isPartial ? 'PRACTICE' : 'LEARN',
        relatedSkill: gapSkill.skill,
        phaseId: 'phase-2-skill-gaps',
        phaseNumber: 2,
        phaseTitle: 'Priority Skill Gaps',
        priority: gapSkill.priority,
        estimatedEffort: gapSkill.importance === 'required' ? '1-2 weeks' : '3-5 days',
        prerequisites: gapSkill.minProficiency === 'intermediate' ? ['Core Programming'] : [],
        completionCriteria:
          SKILL_COMPLETION_CRITERIA[cleanKey] || [
            `Study core architecture and documentation for ${gapSkill.skill}`,
            `Build a focused mini-module or proof of concept`,
            `Write unit tests or integration checks verifying functionality`,
            `Document implementation details in code repository`,
          ],
        evidenceExpected: 'Code repository or integration project showcasing clean patterns',
        whyItMatters: gapSkill.reason || 'Critical competency required for target role.',
      });
    });
  } else {
    // If no remaining gaps
    generatedTasks.push({
      taskId: 'skill-gaps-fully-covered',
      title: 'Target Role Competencies Fully Covered',
      description:
        'All primary baseline competencies are accounted for in your profile. Focus your efforts on practical project synthesis and interview readiness.',
      type: 'PRACTICE',
      relatedSkill: null,
      phaseId: 'phase-2-skill-gaps',
      phaseNumber: 2,
      phaseTitle: 'Priority Skill Gaps',
      priority: 'LOW',
      estimatedEffort: 'Ongoing',
      prerequisites: [],
      completionCriteria: [
        'Review modern framework release notes and advanced design patterns',
        'Refactor existing codebases to adhere to clean code principles',
      ],
      evidenceExpected: 'High code quality across all public repositories',
      whyItMatters: 'Continuous mastery separates standard candidates from top engineers.',
    });
  }

  /* ─────────────────────────────────────────────────────────────
     PHASE 3: PRACTICAL PROJECTS
  ───────────────────────────────────────────────────────────── */
  const projectBlueprints = generateRoleProjects(targetRole.name, missingSkills, coveredSkills);
  projectBlueprints.forEach((p) => {
    generatedTasks.push(p);
  });

  /* ─────────────────────────────────────────────────────────────
     PHASE 4: DSA & PROBLEM SOLVING
  ───────────────────────────────────────────────────────────── */
  const dsaTotal = typeof dsaProfile?.totalSolved === 'number' ? dsaProfile.totalSolved : 0;
  const leetcodeConnected = !!(dsaProfile?.leetcodeConnected);

  if (!leetcodeConnected && dsaTotal === 0) {
    generatedTasks.push({
      taskId: 'dsa-establish-routine',
      title: 'Connect LeetCode & Establish Daily DSA Problem Solving',
      description:
        'Synchronize your LeetCode profile or begin manual problem tracking. Technical hiring assessments evaluate problem solving, data structures, and time complexity trade-offs.',
      type: 'DSA',
      relatedSkill: 'Data Structures & Algorithms',
      phaseId: 'phase-4-dsa',
      phaseNumber: 4,
      phaseTitle: 'DSA & Problem Solving',
      priority: 'HIGH',
      estimatedEffort: '1-2 weeks',
      prerequisites: ['Programming Language'],
      completionCriteria: [
        'Connect your LeetCode public profile via DSA Tracker',
        'Solve 25+ foundational problems (Arrays, Strings, Hash Maps, Two Pointers)',
        'Understand Big-O time and space complexity analysis for each solution',
      ],
      evidenceExpected: 'Synced LeetCode profile showing regular problem activity',
      whyItMatters: 'Essential for passing automated screening assessments and technical interviews.',
    });
  } else if (dsaTotal < 75) {
    generatedTasks.push({
      taskId: 'dsa-intermediate-progression',
      title: 'Progress to Medium-Difficulty DSA Problems (Trees, Graphs, DP)',
      description:
        `You have ${dsaTotal} problems solved. Deepen your algorithmic intuition by advancing from Easy to Medium problems in core data structures.`,
      type: 'DSA',
      relatedSkill: 'Data Structures & Algorithms',
      phaseId: 'phase-4-dsa',
      phaseNumber: 4,
      phaseTitle: 'DSA & Problem Solving',
      priority: 'MEDIUM',
      estimatedEffort: '2-3 weeks',
      prerequisites: ['Basic DSA'],
      completionCriteria: [
        'Solve 30+ Medium problems across Binary Trees, BFS/DFS Graphs, and Dynamic Programming',
        'Practice recognizing pattern archetypes (Sliding Window, Binary Search, Backtracking)',
        'Maintain a consistent weekly problem-solving streak',
      ],
      evidenceExpected: 'LeetCode profile with balanced Easy/Medium distribution',
      whyItMatters: 'Most technical screening rounds focus heavily on medium-difficulty algorithmic problems.',
    });
  } else {
    generatedTasks.push({
      taskId: 'dsa-advanced-interview-prep',
      title: 'Timed Mock DSA Assessments & Complex Problem Solving',
      description:
        `With ${dsaTotal} problems completed, focus on solving problems under strict 20-30 minute time constraints and explaining your thought process out loud.`,
      type: 'DSA',
      relatedSkill: 'Data Structures & Algorithms',
      phaseId: 'phase-4-dsa',
      phaseNumber: 4,
      phaseTitle: 'DSA & Problem Solving',
      priority: 'LOW',
      estimatedEffort: 'Ongoing',
      prerequisites: ['Data Structures & Algorithms'],
      completionCriteria: [
        'Complete 3+ timed virtual contests or mock assessments',
        'Practice verbalizing edge cases and algorithmic trade-offs before writing code',
        'Review hard problems in Disjoint Sets, Trie, and Segment Trees if applicable',
      ],
      evidenceExpected: 'Demonstrated speed and accuracy under interview conditions',
      whyItMatters: 'Simulates real high-pressure live coding interviews.',
    });
  }

  /* ─────────────────────────────────────────────────────────────
     PHASE 5: RESUME & GITHUB TECHNICAL EVIDENCE
  ───────────────────────────────────────────────────────────── */
  const resumeExists = !!(resume && (resume.status === 'completed' || resume.analysis || resume.extractedText));
  const githubConnected = !!(githubProfile?.connected);

  if (!resumeExists) {
    generatedTasks.push({
      taskId: 'resume-upload-and-analyze',
      title: 'Upload & Benchmark Resume in Resume Analyzer',
      description:
        'Upload your current resume to the Resume Analyzer to detect skills, evaluate ATS keyword coverage, and benchmark against target job descriptions.',
      type: 'RESUME',
      relatedSkill: null,
      phaseId: 'phase-5-evidence',
      phaseNumber: 5,
      phaseTitle: 'Resume & Technical Evidence',
      priority: 'HIGH',
      estimatedEffort: '1-2 days',
      prerequisites: [],
      completionCriteria: [
        'Upload a clean, standard 1-page PDF/DOCX resume',
        'Run the Resume Analyzer to review detected skills and ATS alignment',
        'Fix any identified formatting or keyword gaps',
      ],
      evidenceExpected: 'Analyzed resume on Career Odyssey Resume Analyzer',
      whyItMatters: 'Your resume is the first barrier to obtaining interview invitations.',
    });
  }

  // Address RESUME_EVIDENCE_MISSING skills
  if (resumeGapSkills.length > 0) {
    resumeGapSkills.slice(0, 3).forEach((rSkill) => {
      const taskId = makeTaskId('resume-evidence', rSkill.skill);
      generatedTasks.push({
        taskId,
        title: `Add Measurable ${rSkill.skill} Evidence to Resume`,
        description: `You have ${rSkill.skill} in My Skills, but your resume lacks demonstrable project bullets. Add a project or experience entry highlighting your use of ${rSkill.skill}.`,
        type: 'RESUME',
        relatedSkill: rSkill.skill,
        phaseId: 'phase-5-evidence',
        phaseNumber: 5,
        phaseTitle: 'Resume & Technical Evidence',
        priority: 'MEDIUM',
        estimatedEffort: '1-2 days',
        prerequisites: [],
        completionCriteria: [
          `Formulate a bullet point using the Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]"`,
          `Highlight ${rSkill.skill} prominently in your technical skills and project sections`,
          `Re-upload and verify updated score in Resume Analyzer`,
        ],
        evidenceExpected: 'Updated resume bullet demonstrating practical impact',
        whyItMatters: 'Recruiters reject applications when claimed skills have zero project evidence.',
      });
    });
  }

  if (!githubConnected) {
    generatedTasks.push({
      taskId: 'github-connect-and-sync',
      title: 'Connect Public GitHub Profile to Portfolio',
      description:
        'Connect your GitHub handle to synchronize public repositories, showcase project activity, and provide verified code evidence for recruiters.',
      type: 'GITHUB',
      relatedSkill: 'Git',
      phaseId: 'phase-5-evidence',
      phaseNumber: 5,
      phaseTitle: 'Resume & Technical Evidence',
      priority: 'LOW',
      estimatedEffort: '1 day',
      prerequisites: [],
      completionCriteria: [
        'Connect public GitHub username on the GitHub module',
        'Ensure top repositories have informative descriptions and topic tags',
      ],
      evidenceExpected: 'Synced GitHub profile displaying active public repos',
      whyItMatters: 'Public code samples provide verifiable proof of implementation skills.',
    });
  } else {
    generatedTasks.push({
      taskId: 'github-optimize-pinned-repos',
      title: 'Polish GitHub Repositories (READMEs & Architecture Docs)',
      description:
        'Ensure your top repositories have comprehensive READMEs including architecture diagrams, live demo URLs, setup instructions, and technology badges.',
      type: 'GITHUB',
      relatedSkill: 'Git',
      phaseId: 'phase-5-evidence',
      phaseNumber: 5,
      phaseTitle: 'Resume & Technical Evidence',
      priority: 'LOW',
      estimatedEffort: '2-3 days',
      prerequisites: ['Git'],
      completionCriteria: [
        'Add visual screenshots/GIFs and clear installation guides to repository READMEs',
        'Include tech stack badges and live deployment links',
        'Clean up repository branches and commit histories',
      ],
      evidenceExpected: 'Professional, documented GitHub project repositories',
      whyItMatters: 'Hiring managers inspect repository presentation during resume review.',
    });
  }

  /* ─────────────────────────────────────────────────────────────
     PHASE 6: INTERVIEW & JOB READINESS
  ───────────────────────────────────────────────────────────── */
  generatedTasks.push({
    taskId: 'interview-technical-architecture-prep',
    title: 'Technical Concept Deep-Dive & System Walkthroughs',
    description:
      `Prepare to explain your projects in depth, discussing design decisions, trade-offs, state management, database schemas, and performance optimizations for ${targetRole.name}.`,
    type: 'INTERVIEW',
    relatedSkill: null,
    phaseId: 'phase-6-readiness',
    phaseNumber: 6,
    phaseTitle: 'Interview & Job Readiness',
    priority: 'MEDIUM',
    estimatedEffort: '1 week',
    prerequisites: ['Practical Projects'],
    completionCriteria: [
      'Prepare a 3-minute architectural walkthrough for your top 2 projects',
      'Be able to explain why you chose specific libraries/databases over alternatives',
      'Anticipate and practice answering scalability and security questions',
    ],
    evidenceExpected: 'Confidence in live technical project defense',
    whyItMatters: 'Technical interviews evaluate engineering rationale and trade-off analysis.',
  });

  generatedTasks.push({
    taskId: 'interview-behavioral-star-stories',
    title: 'Behavioral Preparation (STAR Framework Stories)',
    description:
      'Structure 4–5 core engineering stories using the Situation, Task, Action, Result framework covering technical challenges, debugging, conflict resolution, and leadership.',
    type: 'INTERVIEW',
    relatedSkill: null,
    phaseId: 'phase-6-readiness',
    phaseNumber: 6,
    phaseTitle: 'Interview & Job Readiness',
    priority: 'LOW',
    estimatedEffort: '2-3 days',
    prerequisites: [],
    completionCriteria: [
      'Draft 4 STAR stories: (1) Overcoming a difficult technical bug, (2) Collaborating under tight deadlines, (3) Resolving technical disagreements, (4) Learning a new technology rapidly',
      'Practice speaking concisely without meandering (under 2 minutes per story)',
    ],
    evidenceExpected: 'Structured STAR stories prepared for behavioral rounds',
    whyItMatters: 'Behavioral rounds determine culture fit and team collaboration capability.',
  });

  // 3b. Augment with Recruiter Interview Evaluation Weaknesses & Feedback (SIH 26044 Feedback Loop)
  if (Array.isArray(evaluations) && evaluations.length > 0) {
    evaluations.forEach((ev, evIdx) => {
      if (Array.isArray(ev.weaknesses)) {
        ev.weaknesses.forEach((w, wIdx) => {
          if (!w || typeof w !== 'string') return;
          generatedTasks.unshift({
            taskId: makeTaskId('task-remediation', `${w.substring(0, 30)}-${evIdx}-${wIdx}`),
            title: `Remediate Recruiter Feedback: ${w}`,
            description: `High-priority actionable improvement directly generated from Industry Interview Evaluation. Recruiter note: "${ev.feedback || 'Improve observed competency gap'}".`,
            type: 'LEARN',
            relatedSkill: w,
            phaseId: 'phase-2-skill-gaps',
            phaseNumber: 2,
            phaseTitle: 'Priority Skill Gaps',
            priority: 'HIGH',
            estimatedEffort: '3-5 days',
            prerequisites: [],
            completionCriteria: [
              `Review industry standards and production patterns for ${w}`,
              `Implement a dedicated project module or assessment demonstrating mastery of ${w}`,
              `Document resolution in technical portfolio to prove interview readiness`,
            ],
            evidenceExpected: `Verified competency demonstration resolving "${w}"`,
            whyItMatters: `Highlighted as an observed interview gap by industry partner recruiter evaluation (${ev.recommendation || 'Evaluation'}).`,
          });
        });
      }
    });
  }

  // 4. Reconcile existing task statuses (preserves student's completed tasks)
  const finalTasks = generatedTasks.map((task) => {
    const existing = existingStatusMap.get(task.taskId);
    if (existing) {
      return {
        ...task,
        status: existing.status || 'NOT_STARTED',
        completedAt: existing.completedAt || null,
      };
    }
    return {
      ...task,
      status: 'NOT_STARTED',
      completedAt: null,
    };
  });

  // 5. Phase definitions and summaries
  const phaseMetadata = [
    {
      phaseId: 'phase-1-foundation',
      phaseNumber: 1,
      title: 'Foundation & Prerequisites',
      description: 'Core programming syntax, version control, and development environment setup.',
    },
    {
      phaseId: 'phase-2-skill-gaps',
      phaseNumber: 2,
      title: 'Priority Skill Gaps',
      description: 'Role-critical technologies and specialized competencies identified by Skill Gap analysis.',
    },
    {
      phaseId: 'phase-3-projects',
      phaseNumber: 3,
      title: 'Practical Projects',
      description: 'End-to-end applications demonstrating real-world software architecture.',
    },
    {
      phaseId: 'phase-4-dsa',
      phaseNumber: 4,
      title: 'DSA & Problem Solving',
      description: 'Data structures, algorithms, and LeetCode problem-solving practice.',
    },
    {
      phaseId: 'phase-5-evidence',
      phaseNumber: 5,
      title: 'Resume & Technical Evidence',
      description: 'ATS resume optimization, GitHub repository polish, and measurable achievements.',
    },
    {
      phaseId: 'phase-6-readiness',
      phaseNumber: 6,
      title: 'Interview & Job Readiness',
      description: 'Technical architecture defenses and behavioral STAR framework story preparation.',
    },
  ];

  const phases = phaseMetadata.map((p) => {
    const phaseTasks = finalTasks.filter((t) => t.phaseId === p.phaseId);
    const completed = phaseTasks.filter((t) => t.status === 'COMPLETED').length;
    return {
      ...p,
      taskCount: phaseTasks.length,
      completedTaskCount: completed,
    };
  });

  const totalTasks = finalTasks.length;
  const completedTasks = finalTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = finalTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    targetRole: targetRole.name,
    roleId: targetRole.id,
    roleCategory: targetRole.category,
    requirementsVersion: '1.0',
    progress,
    totalTasks,
    completedTasks,
    inProgressTasks,
    phases,
    tasks: finalTasks,
    metadata: {
      hasCareerGoal: true,
      isRoleConfigured,
      generatedAt: new Date().toISOString(),
    },
    gapSummary: gapAnalysis.summary,
    dataSources: gapAnalysis.dataSources,
  };
}

module.exports = {
  generateRoadmapData,
  makeTaskId,
};
