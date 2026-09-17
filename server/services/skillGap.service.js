/**
 * skillGap.service.js
 *
 * Deterministic, evidence-based Skill Gap Analysis Service.
 *
 * Answers:
 * "What skills do I need for my target career, what skills do I already have,
 *  what does my resume demonstrate, and what are my highest-priority gaps?"
 *
 * Sources:
 * 1. My Skills (SkillProfile model)
 * 2. Resume Analyzer (Resume model structured analysis & projects)
 * 3. GitHub Profile (GitHubProfile model languages & repositories)
 * 4. DSA Tracker / LeetCode (DSAProfile model problems & focus topics)
 *
 * Output:
 * Structured gap classification (COVERED, PARTIAL, MISSING, RESUME_EVIDENCE_MISSING),
 * deterministic priority (HIGH, MEDIUM, LOW), and weighted gap score (0-100).
 */

const { findRoleRequirements } = require('../data/careerRoles');

/* ── Canonical Skill Dictionary & Aliases ───────────────────── */
const CANONICAL_SKILLS_MAP = {
  // Programming Languages
  javascript: { canonical: 'JavaScript', aliases: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2020'] },
  typescript: { canonical: 'TypeScript', aliases: ['typescript', 'ts'] },
  python:     { canonical: 'Python', aliases: ['python', 'python3', 'py'] },
  java:       { canonical: 'Java', aliases: ['java', 'core java', 'java 8', 'java 11', 'java 17', 'java 21'] },
  'c++':      { canonical: 'C++', aliases: ['c++', 'cpp'] },
  c:          { canonical: 'C', aliases: ['c lang', 'c language'] },
  'c#':       { canonical: 'C#', aliases: ['c#', 'csharp', 'c-sharp'] },
  go:         { canonical: 'Go', aliases: ['golang', 'go lang', 'go'] },
  rust:       { canonical: 'Rust', aliases: ['rust'] },
  ruby:       { canonical: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'] },
  php:        { canonical: 'PHP', aliases: ['php', 'php7', 'php8'] },
  swift:      { canonical: 'Swift', aliases: ['swift'] },
  kotlin:     { canonical: 'Kotlin', aliases: ['kotlin'] },
  sql:        { canonical: 'SQL', aliases: ['sql', 't-sql', 'pl/sql', 'plsql', 'mysql', 'postgresql', 'postgres', 'sqlite'] },

  // Frontend
  react:      { canonical: 'React', aliases: ['react', 'react.js', 'reactjs', 'react native'] },
  'next.js':  { canonical: 'Next.js', aliases: ['next.js', 'nextjs', 'next'] },
  'vue.js':   { canonical: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs', 'vue3'] },
  angular:    { canonical: 'Angular', aliases: ['angular', 'angularjs', 'angular 2+'] },
  html5:      { canonical: 'HTML5', aliases: ['html', 'html5'] },
  css3:       { canonical: 'CSS3', aliases: ['css', 'css3'] },
  tailwindcss:{ canonical: 'TailwindCSS', aliases: ['tailwindcss', 'tailwind', 'tailwind css'] },
  redux:      { canonical: 'Redux', aliases: ['redux', 'redux toolkit', 'rtk'] },

  // Backend
  'node.js':    { canonical: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
  'express.js': { canonical: 'Express.js', aliases: ['express', 'express.js', 'expressjs'] },
  nestjs:       { canonical: 'NestJS', aliases: ['nestjs', 'nest.js'] },
  django:       { canonical: 'Django', aliases: ['django', 'django rest framework', 'drf'] },
  flask:        { canonical: 'Flask', aliases: ['flask'] },
  fastapi:      { canonical: 'FastAPI', aliases: ['fastapi', 'fast api'] },
  'spring boot':{ canonical: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring framework', 'spring'] },
  'rest apis':  { canonical: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful api', 'restful apis', 'restful web services', 'rest', 'api development'] },

  // Databases
  mongodb:     { canonical: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongoose'] },
  postgresql:  { canonical: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'] },
  mysql:       { canonical: 'MySQL', aliases: ['mysql'] },
  redis:       { canonical: 'Redis', aliases: ['redis'] },

  // Cloud & DevOps
  git:         { canonical: 'Git', aliases: ['git', 'github', 'gitlab', 'version control', 'git/github'] },
  docker:      { canonical: 'Docker', aliases: ['docker', 'containerization', 'dockerfile'] },
  kubernetes:  { canonical: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  aws:         { canonical: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  'ci/cd':     { canonical: 'CI/CD', aliases: ['ci/cd', 'cicd', 'github actions', 'jenkins', 'gitlab ci'] },
  linux:       { canonical: 'Linux', aliases: ['linux', 'ubuntu', 'bash', 'shell scripting', 'unix'] },
  nginx:       { canonical: 'Nginx', aliases: ['nginx'] },

  // AI/ML & Data
  'machine learning': { canonical: 'Machine Learning', aliases: ['machine learning', 'ml', 'statistical modeling'] },
  'deep learning':    { canonical: 'Deep Learning', aliases: ['deep learning', 'dl', 'neural networks', 'cnn', 'rnn', 'transformers'] },
  pytorch:            { canonical: 'PyTorch', aliases: ['pytorch', 'torch'] },
  tensorflow:         { canonical: 'TensorFlow', aliases: ['tensorflow', 'tf', 'keras'] },
  pandas:             { canonical: 'Pandas', aliases: ['pandas'] },
  numpy:              { canonical: 'NumPy', aliases: ['numpy'] },
  'scikit-learn':     { canonical: 'Scikit-learn', aliases: ['scikit-learn', 'sklearn'] },
  'data structures & algorithms': { canonical: 'Data Structures & Algorithms', aliases: ['data structures & algorithms', 'data structures and algorithms', 'data structures', 'dsa', 'algorithms', 'leetcode', 'problem solving'] },

  // Analytics & Business Intelligence
  excel:       { canonical: 'Excel', aliases: ['excel', 'ms excel', 'microsoft excel', 'advanced excel', 'spreadsheets'] },
  tableau:     { canonical: 'Tableau', aliases: ['tableau', 'tableau desktop'] },
  'power bi':  { canonical: 'Power BI', aliases: ['power bi', 'powerbi', 'power-bi', 'dax'] },
};

/**
 * Normalize raw string into clean comparable token
 */
function cleanSkillToken(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[._\-/\\]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Check if two skill names match via canonical name or aliases
 */
function isSkillMatch(skillA, skillB) {
  if (!skillA || !skillB) return false;

  const cleanA = cleanSkillToken(skillA);
  const cleanB = cleanSkillToken(skillB);

  if (cleanA === cleanB) return true;

  // Check aliases in dictionary
  for (const entry of Object.values(CANONICAL_SKILLS_MAP)) {
    const aMatches = entry.aliases.some((alias) => cleanSkillToken(alias) === cleanA);
    const bMatches = entry.aliases.some((alias) => cleanSkillToken(alias) === cleanB);

    if (aMatches && bMatches) return true;
  }

  // Word-boundary check for multi-word phrases (e.g. "Data Structures" in "Data Structures & Algorithms")
  // Only apply when phrase has multiple words to prevent "java" in "javascript"
  const aWords = cleanA.split(' ');
  const bWords = cleanB.split(' ');
  if (aWords.length > 1 && bWords.length > 1) {
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  }

  return false;
}

/**
 * Extract evidence for a target skill from all four data sources
 */
function extractEvidence(targetSkillName, { skillProfile, resume, githubProfile, dsaProfile }) {
  // 1. My Skills Profile Evidence
  let profileMatch = null;
  if (skillProfile && Array.isArray(skillProfile.skills)) {
    profileMatch = skillProfile.skills.find((s) => isSkillMatch(s.name, targetSkillName));
  }

  const profileEvidence = {
    hasProfile: !!profileMatch,
    level: profileMatch?.level || null,
    yearsOfExperience: profileMatch?.yearsOfExperience || 0,
    rawName: profileMatch?.name || null,
  };

  // 2. Resume Analyzer Evidence
  let resumeDetected = false;
  let resumeMentions = 0;
  let resumeSnippet = null;
  const projectNames = [];

  const resumeAnalysis = resume?.analysis;
  if (resumeAnalysis) {
    // Check detected skills
    if (Array.isArray(resumeAnalysis.detectedSkills)) {
      const match = resumeAnalysis.detectedSkills.find((s) => isSkillMatch(s.name, targetSkillName));
      if (match) {
        resumeDetected = true;
        resumeMentions += match.mentions || 1;
        if (match.evidence) {
          resumeSnippet = match.evidence;
        }
      }
    }

    // Check project technologies and descriptions
    if (Array.isArray(resumeAnalysis.projects)) {
      for (const proj of resumeAnalysis.projects) {
        let projMatched = false;
        if (Array.isArray(proj.technologies)) {
          if (proj.technologies.some((t) => isSkillMatch(t, targetSkillName))) {
            projMatched = true;
          }
        }
        if (Array.isArray(proj.bullets) && !projMatched) {
          if (proj.bullets.some((b) => isSkillMatch(b, targetSkillName))) {
            projMatched = true;
          }
        }
        if (projMatched && proj.name) {
          projectNames.push(proj.name);
          resumeDetected = true;
          resumeMentions += 1;
        }
      }
    }

    // Check raw extracted text fallback
    if (!resumeDetected && resume.extractedText) {
      if (isSkillMatch(resume.extractedText, targetSkillName)) {
        resumeDetected = true;
        resumeMentions = 1;
      }
    }
  }

  const resumeEvidence = {
    hasEvidence: resumeDetected,
    detected: resumeDetected,
    mentions: resumeMentions,
    projectNames,
    snippet: resumeSnippet,
  };

  // 3. GitHub Profile Evidence
  let githubEvidenceMatch = false;
  const githubRepoNames = [];

  if (githubProfile && (githubProfile.connected || githubProfile.languages?.length > 0)) {
    // Check languages list
    if (Array.isArray(githubProfile.languages)) {
      if (githubProfile.languages.some((l) => isSkillMatch(l, targetSkillName))) {
        githubEvidenceMatch = true;
      }
    }

    // Check repositories
    if (Array.isArray(githubProfile.repositories)) {
      for (const repo of githubProfile.repositories) {
        let repoMatched = false;
        if (repo.language && isSkillMatch(repo.language, targetSkillName)) {
          repoMatched = true;
        }
        if (repo.name && isSkillMatch(repo.name, targetSkillName)) {
          repoMatched = true;
        }
        if (repo.description && isSkillMatch(repo.description, targetSkillName)) {
          repoMatched = true;
        }
        if (repoMatched && repo.name) {
          githubRepoNames.push(repo.name);
          githubEvidenceMatch = true;
        }
      }
    }
  }

  const githubEvidence = {
    hasEvidence: githubEvidenceMatch,
    repoCount: githubRepoNames.length,
    repoNames: githubRepoNames,
  };

  // 4. DSA Profile Evidence (LeetCode & Topics)
  let dsaEvidenceMatch = false;
  let totalSolved = 0;

  if (dsaProfile) {
    totalSolved = typeof dsaProfile.totalSolved === 'number' ? dsaProfile.totalSolved : 0;
    const isDsaSkill = isSkillMatch(targetSkillName, 'Data Structures & Algorithms') ||
                       isSkillMatch(targetSkillName, 'Algorithms') ||
                       isSkillMatch(targetSkillName, 'Problem Solving');

    if (isDsaSkill) {
      dsaEvidenceMatch = totalSolved > 0 || (Array.isArray(dsaProfile.focusTopics) && dsaProfile.focusTopics.length > 0);
    } else if (Array.isArray(dsaProfile.focusTopics)) {
      if (dsaProfile.focusTopics.some((t) => isSkillMatch(t, targetSkillName))) {
        dsaEvidenceMatch = true;
      }
    }
  }

  const dsaEvidence = {
    hasEvidence: dsaEvidenceMatch,
    totalSolved,
    leetcodeConnected: !!(dsaProfile?.leetcodeConnected),
  };

  return {
    profileEvidence,
    resumeEvidence,
    githubEvidence,
    dsaEvidence,
  };
}

/**
 * Deterministic Gap Classification
 *
 * Statuses:
 * - COVERED: Verified in My Skills (intermediate/adv/expert) OR strong verified evidence across multiple sources.
 * - RESUME_EVIDENCE_MISSING: In My Skills, but Resume is uploaded and does not demonstrate it.
 * - PARTIAL: Beginner proficiency OR weak supporting evidence.
 * - MISSING: No meaningful evidence found anywhere.
 */
function classifyGap({
  skillReq,
  profileEvidence,
  resumeEvidence,
  githubEvidence,
  dsaEvidence,
  resumeExists,
}) {
  const hasProfile = profileEvidence.hasProfile;
  const level = profileEvidence.level;
  const hasResume = resumeEvidence.hasEvidence;
  const hasGithub = githubEvidence.hasEvidence;
  const hasDsa = dsaEvidence.hasEvidence;

  // Case 1: Student lists skill in My Skills
  if (hasProfile) {
    const isExperienced = level === 'advanced' || level === 'expert';
    const isIntermediate = level === 'intermediate';
    const isBeginner = level === 'beginner';

    // If resume is present, verify whether the resume demonstrates it
    if (resumeExists) {
      if (!hasResume && !hasGithub) {
        // High/Intermediate profile skill without resume/project proof
        return 'RESUME_EVIDENCE_MISSING';
      }
    }

    if (isExperienced || isIntermediate) {
      return 'COVERED';
    }

    if (isBeginner) {
      // If beginner but has verified resume project or GitHub repo, treat as covered or partial
      if (hasResume || hasGithub) {
        return 'COVERED';
      }
      return 'PARTIAL';
    }

    return 'COVERED';
  }

  // Case 2: Not in My Skills, but strong evidence found in Resume / GitHub / DSA
  if (hasResume && hasGithub) {
    return 'COVERED';
  }

  if (hasResume || hasGithub || hasDsa) {
    return 'PARTIAL';
  }

  // Case 3: No evidence anywhere
  return 'MISSING';
}

/**
 * Deterministic Priority Engine
 *
 * HIGH: Required skill + MISSING or PARTIAL (beginner)
 * MEDIUM: Required skill + RESUME_EVIDENCE_MISSING, or Preferred skill + MISSING
 * LOW: Preferred skill + PARTIAL, or COVERED skills
 */
function determinePriority({ importance, status }) {
  const isRequired = importance === 'required';

  if (isRequired) {
    if (status === 'MISSING') return 'HIGH';
    if (status === 'PARTIAL') return 'HIGH';
    if (status === 'RESUME_EVIDENCE_MISSING') return 'MEDIUM';
    return 'LOW'; // COVERED
  }

  // Preferred skill
  if (status === 'MISSING') return 'MEDIUM';
  if (status === 'PARTIAL') return 'LOW';
  if (status === 'RESUME_EVIDENCE_MISSING') return 'LOW';
  return 'LOW'; // COVERED
}

/**
 * Generate actionable, deterministic recommendation for each skill gap
 */
function generateRecommendation({ skillReq, status, profileEvidence, resumeExists }) {
  const name = skillReq.name;

  if (status === 'RESUME_EVIDENCE_MISSING') {
    return `You listed ${name} in My Skills, but your resume lacks demonstrable project or work experience. Add a concrete project bullet highlighting how you utilized ${name}.`;
  }

  if (status === 'MISSING') {
    if (skillReq.importance === 'required') {
      return skillReq.recommendation || `Learn foundational ${name} concepts and demonstrate competence through a version-controlled project.`;
    }
    return `Explore ${name} fundamentals to broaden your qualifications for ${skillReq.category} requirements.`;
  }

  if (status === 'PARTIAL') {
    if (profileEvidence.level === 'beginner') {
      return `Advance your ${name} proficiency beyond beginner fundamentals by building modular, production-ready features.`;
    }
    return `Deepen practical experience with ${name} and ensure your code repositories showcase core patterns.`;
  }

  // COVERED
  return `Proficiency established in ${name}. Maintain up-to-date practical experience through ongoing projects and code samples.`;
}

/**
 * Main Analysis Entry Point
 *
 * @param {Object} params
 * @param {Object} params.skillProfile - Student's SkillProfile document
 * @param {Object} params.resume - Student's Resume document (with analysis)
 * @param {Object} params.githubProfile - Student's GitHubProfile document
 * @param {Object} params.dsaProfile - Student's DSAProfile document
 * @returns {Object} Structured analysis result
 */
function analyzeSkillGap({ skillProfile, resume, githubProfile, dsaProfile }) {
  const targetRole = skillProfile?.targetRole || '';
  const targetIndustry = skillProfile?.targetIndustry || '';

  // 1. Find curated baseline role requirements
  const roleReqs = findRoleRequirements(targetRole);

  const isRoleConfigured = !!roleReqs;
  const roleName = roleReqs ? roleReqs.displayName : (targetRole || 'Unconfigured Role');
  const roleId = roleReqs ? roleReqs.roleId : 'unconfigured';
  const roleCategory = roleReqs ? roleReqs.category : 'General';

  const requiredList = roleReqs?.requiredSkills || [];
  const preferredList = roleReqs?.preferredSkills || [];
  const allRequirements = [...requiredList, ...preferredList];

  const resumeExists = !!(resume && (resume.status === 'completed' || resume.analysis || resume.extractedText));

  // 2. Evaluate each requirement deterministically
  const evaluatedSkills = allRequirements.map((skillReq) => {
    const { profileEvidence, resumeEvidence, githubEvidence, dsaEvidence } = extractEvidence(
      skillReq.name,
      { skillProfile, resume, githubProfile, dsaProfile }
    );

    const status = classifyGap({
      skillReq,
      profileEvidence,
      resumeEvidence,
      githubEvidence,
      dsaEvidence,
      resumeExists,
    });

    const priority = determinePriority({
      importance: skillReq.importance,
      status,
    });

    const recommendation = generateRecommendation({
      skillReq,
      status,
      profileEvidence,
      resumeExists,
    });

    return {
      skill: skillReq.name,
      category: skillReq.category,
      importance: skillReq.importance,
      status,
      priority,
      minProficiency: skillReq.minProficiency || 'intermediate',
      studentProficiency: profileEvidence.level,
      reason: skillReq.reason || 'Core competency for target role.',
      recommendation,
      evidence: {
        profile: profileEvidence,
        resume: resumeEvidence,
        github: githubEvidence,
        dsa: dsaEvidence,
      },
    };
  });

  // 3. Compute Summary Counts & Overall Score
  let coveredCount = 0;
  let partialCount = 0;
  let missingCount = 0;
  let resumeEvidenceMissingCount = 0;
  let requiredCount = 0;
  let preferredCount = 0;

  let requiredScoreSum = 0;
  let requiredMax = 0;
  let preferredScoreSum = 0;
  let preferredMax = 0;

  for (const s of evaluatedSkills) {
    if (s.importance === 'required') {
      requiredCount += 1;
      requiredMax += 1;
      if (s.status === 'COVERED') {
        coveredCount += 1;
        requiredScoreSum += 1.0;
      } else if (s.status === 'RESUME_EVIDENCE_MISSING') {
        resumeEvidenceMissingCount += 1;
        requiredScoreSum += 0.8; // User has skill, but proof is missing
      } else if (s.status === 'PARTIAL') {
        partialCount += 1;
        requiredScoreSum += 0.5;
      } else {
        missingCount += 1;
      }
    } else {
      preferredCount += 1;
      preferredMax += 1;
      if (s.status === 'COVERED') {
        coveredCount += 1;
        preferredScoreSum += 1.0;
      } else if (s.status === 'RESUME_EVIDENCE_MISSING') {
        resumeEvidenceMissingCount += 1;
        preferredScoreSum += 0.8;
      } else if (s.status === 'PARTIAL') {
        partialCount += 1;
        preferredScoreSum += 0.5;
      } else {
        missingCount += 1;
      }
    }
  }

  // Weighted score calculation: Required = 70%, Preferred = 30%
  let calculatedScore = 0;
  if (requiredMax > 0 && preferredMax > 0) {
    const reqRatio = requiredScoreSum / requiredMax;
    const prefRatio = preferredScoreSum / preferredMax;
    calculatedScore = Math.round((reqRatio * 0.7 + prefRatio * 0.3) * 100);
  } else if (requiredMax > 0) {
    calculatedScore = Math.round((requiredScoreSum / requiredMax) * 100);
  } else if (preferredMax > 0) {
    calculatedScore = Math.round((preferredScoreSum / preferredMax) * 100);
  } else {
    calculatedScore = 0;
  }

  // Ensure score is safely bounded [0, 100]
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  // 4. Sort Top Priority Gaps (High first, then Medium, then Low)
  const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
  const topPriorityGaps = evaluatedSkills
    .filter((s) => s.status !== 'COVERED')
    .sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      if (a.importance === 'required' && b.importance !== 'required') return -1;
      if (b.importance === 'required' && a.importance !== 'required') return 1;
      return a.skill.localeCompare(b.skill);
    });

  // 5. Data sources summary
  const dataSources = {
    skillProfile: {
      connected: !!(skillProfile && Array.isArray(skillProfile.skills) && skillProfile.skills.length > 0),
      count: skillProfile?.skills?.length || 0,
      targetRole: skillProfile?.targetRole || null,
    },
    resume: {
      connected: resumeExists,
      status: resume?.status || null,
      detectedSkillsCount: resume?.analysis?.detectedSkills?.length || 0,
      projectsCount: resume?.analysis?.projects?.length || 0,
    },
    github: {
      connected: !!(githubProfile?.connected),
      username: githubProfile?.username || null,
      repoCount: githubProfile?.repositories?.length || 0,
      languages: githubProfile?.languages || [],
    },
    dsa: {
      connected: !!(dsaProfile?.leetcodeConnected || (dsaProfile?.totalSolved > 0)),
      totalSolved: dsaProfile?.totalSolved || 0,
      leetcodeConnected: !!(dsaProfile?.leetcodeConnected),
      source: dsaProfile?.leetcodeSource || 'manual',
    },
  };

  return {
    targetRole: {
      id: roleId,
      name: roleName,
      category: roleCategory,
      industry: targetIndustry || null,
      source: 'curated-baseline',
      version: '1.0',
    },
    summary: {
      overallScore: calculatedScore,
      coveredCount,
      partialCount,
      missingCount,
      resumeEvidenceMissingCount,
      requiredSkillCount: requiredCount,
      preferredSkillCount: preferredCount,
      totalEvaluatedCount: evaluatedSkills.length,
    },
    skills: evaluatedSkills,
    topPriorityGaps,
    dataSources,
    metadata: {
      calculatedAt: new Date().toISOString(),
      requirementsVersion: '1.0',
      isRoleConfigured,
      hasCareerGoal: !!(targetRole && targetRole.trim().length > 0),
    },
  };
}

module.exports = {
  analyzeSkillGap,
  isSkillMatch,
  cleanSkillToken,
  classifyGap,
  determinePriority,
};
