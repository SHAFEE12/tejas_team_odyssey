/**
 * resumeAnalyzer.service.js
 *
 * Deterministic, evidence-based resume analysis engine.
 *
 * Extracts structured candidate info, sections, education, experience,
 * projects, skills, and ATS quality metrics directly from document text.
 * Compares against student's SkillProfile (targetRole, targetIndustry, profile skills).
 */

/* ── Canonical Skill Dictionary & Categories ─────────────────── */
const CANONICAL_SKILLS = [
  // Programming Languages
  { name: 'JavaScript', category: 'Programming Languages', aliases: ['javascript', 'js', 'ecmascript', 'es6', 'es2015'] },
  { name: 'TypeScript', category: 'Programming Languages', aliases: ['typescript', 'ts'] },
  { name: 'Python', category: 'Programming Languages', aliases: ['python', 'python3', 'py'] },
  { name: 'Java', category: 'Programming Languages', aliases: ['java', 'core java', 'java 8', 'java 11', 'java 17'] },
  { name: 'C++', category: 'Programming Languages', aliases: ['c++', 'cpp'] },
  { name: 'C', category: 'Programming Languages', aliases: ['c lang', 'c language'] },
  { name: 'C#', category: 'Programming Languages', aliases: ['c#', 'csharp', 'c-sharp'] },
  { name: 'Go', category: 'Programming Languages', aliases: ['golang', 'go lang', 'go'] },
  { name: 'Rust', category: 'Programming Languages', aliases: ['rust'] },
  { name: 'Ruby', category: 'Programming Languages', aliases: ['ruby', 'ruby on rails', 'rails'] },
  { name: 'PHP', category: 'Programming Languages', aliases: ['php', 'php7', 'php8'] },
  { name: 'Swift', category: 'Programming Languages', aliases: ['swift'] },
  { name: 'Kotlin', category: 'Programming Languages', aliases: ['kotlin'] },
  { name: 'SQL', category: 'Programming Languages', aliases: ['sql', 't-sql', 'pl/sql', 'plsql'] },

  // Frontend
  { name: 'React', category: 'Frontend', aliases: ['react', 'react.js', 'reactjs', 'react native'] },
  { name: 'Next.js', category: 'Frontend', aliases: ['next.js', 'nextjs', 'next'] },
  { name: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vue.js', 'vuejs', 'vue3'] },
  { name: 'Angular', category: 'Frontend', aliases: ['angular', 'angularjs', 'angular 2+'] },
  { name: 'HTML5', category: 'Frontend', aliases: ['html', 'html5'] },
  { name: 'CSS3', category: 'Frontend', aliases: ['css', 'css3'] },
  { name: 'TailwindCSS', category: 'Frontend', aliases: ['tailwindcss', 'tailwind', 'tailwind css'] },
  { name: 'Redux', category: 'Frontend', aliases: ['redux', 'redux toolkit', 'rtk'] },
  { name: 'Svelte', category: 'Frontend', aliases: ['svelte', 'sveltekit'] },
  { name: 'Bootstrap', category: 'Frontend', aliases: ['bootstrap', 'bootstrap 5'] },
  { name: 'Sass/SCSS', category: 'Frontend', aliases: ['sass', 'scss'] },

  // Backend
  { name: 'Node.js', category: 'Backend', aliases: ['node.js', 'nodejs', 'node'] },
  { name: 'Express.js', category: 'Backend', aliases: ['express', 'express.js', 'expressjs'] },
  { name: 'NestJS', category: 'Backend', aliases: ['nestjs', 'nest.js'] },
  { name: 'Django', category: 'Backend', aliases: ['django', 'django rest framework', 'drf'] },
  { name: 'Flask', category: 'Backend', aliases: ['flask'] },
  { name: 'FastAPI', category: 'Backend', aliases: ['fastapi', 'fast api'] },
  { name: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'springboot', 'spring framework', 'spring'] },
  { name: 'ASP.NET', category: 'Backend', aliases: ['asp.net', '.net core', '.net', 'dotnet'] },
  { name: 'GraphQL', category: 'Backend', aliases: ['graphql', 'apollo graphql'] },
  { name: 'REST APIs', category: 'Backend', aliases: ['rest api', 'rest apis', 'restful api', 'restful apis', 'restful web services', 'rest'] },

  // Databases
  { name: 'MongoDB', category: 'Databases', aliases: ['mongodb', 'mongo', 'mongoose'] },
  { name: 'PostgreSQL', category: 'Databases', aliases: ['postgresql', 'postgres', 'psql'] },
  { name: 'MySQL', category: 'Databases', aliases: ['mysql'] },
  { name: 'Redis', category: 'Databases', aliases: ['redis'] },
  { name: 'SQLite', category: 'Databases', aliases: ['sqlite', 'sqlite3'] },
  { name: 'Firebase', category: 'Databases', aliases: ['firebase', 'firestore', 'realtime database'] },
  { name: 'Oracle Database', category: 'Databases', aliases: ['oracle database', 'oracle db', 'oracle sql'] },
  { name: 'DynamoDB', category: 'Databases', aliases: ['dynamodb', 'aws dynamodb'] },

  // Cloud & DevOps
  { name: 'Git', category: 'Cloud & DevOps', aliases: ['git', 'github', 'gitlab', 'version control'] },
  { name: 'Docker', category: 'Cloud & DevOps', aliases: ['docker', 'containerization'] },
  { name: 'Kubernetes', category: 'Cloud & DevOps', aliases: ['kubernetes', 'k8s'] },
  { name: 'AWS', category: 'Cloud & DevOps', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', category: 'Cloud & DevOps', aliases: ['azure', 'microsoft azure'] },
  { name: 'Google Cloud (GCP)', category: 'Cloud & DevOps', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { name: 'CI/CD', category: 'Cloud & DevOps', aliases: ['ci/cd', 'cicd', 'github actions', 'jenkins', 'gitlab ci'] },
  { name: 'Linux', category: 'Cloud & DevOps', aliases: ['linux', 'ubuntu', 'bash', 'shell scripting'] },
  { name: 'Nginx', category: 'Cloud & DevOps', aliases: ['nginx'] },

  // AI/ML & Data
  { name: 'Machine Learning', category: 'AI/ML & Data', aliases: ['machine learning', 'ml'] },
  { name: 'Deep Learning', category: 'AI/ML & Data', aliases: ['deep learning', 'dl', 'neural networks', 'cnn', 'rnn', 'lstm'] },
  { name: 'TensorFlow', category: 'AI/ML & Data', aliases: ['tensorflow', 'tf'] },
  { name: 'PyTorch', category: 'AI/ML & Data', aliases: ['pytorch', 'torch'] },
  { name: 'Pandas', category: 'AI/ML & Data', aliases: ['pandas'] },
  { name: 'NumPy', category: 'AI/ML & Data', aliases: ['numpy'] },
  { name: 'Scikit-learn', category: 'AI/ML & Data', aliases: ['scikit-learn', 'sklearn'] },
  { name: 'NLP', category: 'AI/ML & Data', aliases: ['nlp', 'natural language processing', 'spacy', 'nltk'] },
  { name: 'Data Structures & Algorithms', category: 'Computer Science', aliases: ['data structures', 'dsa', 'algorithms', 'leetcode', 'problem solving'] },

  // Tools & Methodologies
  { name: 'Postman', category: 'Tools', aliases: ['postman'] },
  { name: 'Jira', category: 'Tools', aliases: ['jira'] },
  { name: 'Agile/Scrum', category: 'Methodologies', aliases: ['agile', 'scrum', 'kanban'] },
  { name: 'Figma', category: 'Design', aliases: ['figma', 'ui/ux design', 'wireframing'] },
  { name: 'Webpack/Vite', category: 'Tools', aliases: ['webpack', 'vite'] },
];

/* ── Section Header Matchers ─────────────────────────────────── */
const SECTION_KEYWORDS = {
  education: ['education', 'academic background', 'academics', 'educational qualification', 'qualifications'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience', 'internships', 'work history'],
  projects: ['projects', 'key projects', 'academic projects', 'personal projects', 'technical projects', 'portfolio projects'],
  skills: ['technical skills', 'skills', 'skills & competencies', 'core competencies', 'technologies', 'tech stack', 'programming skills'],
  certifications: ['certifications', 'certificates', 'courses', 'licenses & certifications', 'trainings'],
  summary: ['professional summary', 'summary', 'about me', 'profile', 'career objective', 'objective'],
  achievements: ['achievements', 'honors & awards', 'awards', 'accomplishments', 'publications', 'extracurricular', 'leadership'],
};

/**
 * 1. Extract Candidate Contact Information
 */
function extractCandidateInfo(text) {
  const info = {
    name: null,
    email: null,
    phone: null,
    location: null,
    links: {
      github: null,
      linkedin: null,
      portfolio: null,
      other: [],
    },
  };

  if (!text) return info;

  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    info.email = emailMatch[0].trim();
  }

  // Phone extraction (Indian + international formats)
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}|[6-9]\d{9})/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    const validPhone = phoneMatches.find((p) => p.replace(/\D/g, '').length >= 10);
    if (validPhone) info.phone = validPhone.trim();
  }

  // Links extraction
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)/i;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    info.links.github = githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`;
  }

  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    info.links.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`;
  }

  const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:vercel\.app|netlify\.app|github\.io|me|dev|io|tech|com))\b/gi;
  let pMatch;
  while ((pMatch = portfolioRegex.exec(text)) !== null) {
    const url = pMatch[0];
    if (!url.includes('github.com') && !url.includes('linkedin.com') && !url.includes('google.com')) {
      info.links.portfolio = url.startsWith('http') ? url : `https://${url}`;
      break;
    }
  }

  // Name extraction: heuristic from first 5 non-empty lines
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip if line has email, phone, url, or is a section header
    if (
      emailRegex.test(line) ||
      phoneRegex.test(line) ||
      line.includes('http') ||
      line.includes('www.') ||
      line.toLowerCase().includes('resume') ||
      line.toLowerCase().includes('curriculum')
    ) {
      continue;
    }

    // A valid name typically has 2 to 4 words, alphabetic, length between 3 and 35
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && /^[A-Za-z.\s'-]+$/.test(line) && line.length >= 3 && line.length <= 35) {
      info.name = line;
      break;
    }
  }

  return info;
}

/**
 * 2. Detect Resume Sections
 */
function detectSections(text) {
  const detected = [];
  const lines = text.split('\n').map((l) => l.trim().toLowerCase()).filter(Boolean);

  Object.entries(SECTION_KEYWORDS).forEach(([section, keywords]) => {
    const found = lines.some((line) =>
      keywords.some((kw) => {
        // Line is exactly the keyword or begins/ends cleanly with keyword
        return (
          line === kw ||
          line === `${kw}:` ||
          line === `• ${kw}` ||
          (line.startsWith(kw) && line.length <= kw.length + 5)
        );
      })
    );
    if (found) {
      detected.push(section.charAt(0).toUpperCase() + section.slice(1));
    }
  });

  return detected;
}

/**
 * 3. Extract & Normalize Skills
 */
function extractSkills(text, sections) {
  const detected = [];
  const normalized = [];
  const lowerText = text.toLowerCase();

  CANONICAL_SKILLS.forEach((skill) => {
    let matched = false;
    let aliasUsed = '';

    for (const alias of skill.aliases) {
      // Use regex with word boundaries to avoid false positives (e.g., 'c' in 'cat', 'go' in 'good')
      let pattern;
      if (alias === 'c' || alias === 'go' || alias === 'r') {
        pattern = new RegExp(`(?:\\b|\\s)${alias}(?:\\s|\\,|\\/|\\;|\\)|\\n|$)`, 'i');
      } else if (alias.includes('+') || alias.includes('#') || alias.includes('.')) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`(?:\\b|\\s)${escaped}(?:\\b|\\s|\\,|\\/|\\;|\\)|\\n|$)`, 'i');
      } else {
        pattern = new RegExp(`\\b${alias}\\b`, 'i');
      }

      if (pattern.test(lowerText)) {
        matched = true;
        aliasUsed = alias;
        break;
      }
    }

    if (matched) {
      // Check if skill appears inside a dedicated skills section for higher confidence
      const inSkillsSection = sections.includes('Skills') || lowerText.includes('technical skills');
      const confidence = inSkillsSection ? 0.95 : 0.85;

      detected.push({
        name: skill.name,
        category: skill.category,
        evidence: `Matched keyword "${aliasUsed}"`,
        confidence,
      });

      if (!normalized.includes(skill.name)) {
        normalized.push(skill.name);
      }
    }
  });

  return { detected, normalized };
}

/**
 * 4. Extract Education Details
 */
function extractEducation(text) {
  const education = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const degreePatterns = [
    { name: 'B.Tech / B.E.', regex: /\b(b\.?tech|b\.?e\.?|bachelor of technology|bachelor of engineering)\b/i },
    { name: 'B.S. / B.Sc', regex: /\b(b\.?s\.?c?|bachelor of science|bca|bba)\b/i },
    { name: 'M.Tech / M.E. / M.S.', regex: /\b(m\.?tech|m\.?e\.?|m\.?s\.?|master of technology|mca)\b/i },
    { name: 'Diploma / High School', regex: /\b(diploma|higher secondary|senior secondary|12th|class xii|high school)\b/i },
  ];

  const cgpaRegex = /\b(?:cgpa|gpa|percentage|score)?\s*[:=]?\s*([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(?:\/\s*(?:10|4|100)|%|\b)/i;
  const yearRegex = /\b(20[1-3][0-9])\s*(?:-|–|to)\s*(20[1-3][0-9]|present|current)?\b/i;

  let currentEdu = null;

  lines.forEach((line) => {
    for (const deg of degreePatterns) {
      if (deg.regex.test(line)) {
        if (currentEdu) education.push(currentEdu);

        const yearMatch = line.match(yearRegex) || text.match(yearRegex);
        const cgpaMatch = line.match(cgpaRegex);

        currentEdu = {
          degree: deg.name,
          institution: line.length < 80 ? line : line.substring(0, 80),
          graduationYear: yearMatch ? yearMatch[2] || yearMatch[1] : null,
          cgpa: cgpaMatch ? cgpaMatch[1] : null,
        };
        break;
      }
    }
  });

  if (currentEdu) {
    education.push(currentEdu);
  }

  // Fallback: If no explicit degree found but GPA/Year exists in text
  if (education.length === 0) {
    const fallbackYear = text.match(/\b(202[0-9])\b/);
    const fallbackCgpa = text.match(cgpaRegex);
    if (fallbackYear || fallbackCgpa) {
      education.push({
        degree: 'Undergraduate Degree',
        institution: 'University / Institution',
        graduationYear: fallbackYear ? fallbackYear[1] : null,
        cgpa: fallbackCgpa ? fallbackCgpa[1] : null,
      });
    }
  }

  return education;
}

/**
 * 5. Extract Projects & Detect Quantified Achievements
 */
function extractProjectsAndBullets(text, normalizedSkills) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const projects = [];
  const allBullets = [];
  let quantifiedBulletsCount = 0;

  // Regex for quantifiable metrics (percentages, numbers, multipliers, scale, users, speed)
  const metricRegex = /\b(?:\d+[%kKmMbB\+]|\d+\s*(?:users|clients|requests|qps|ms|seconds|minutes|hours|days|stars|forks|downloads)|[1-9]\d{0,2}%|\$\d+|\d+x)\b/;

  let inProjectSection = false;
  let inExperienceSection = false;
  let currentProject = null;

  lines.forEach((line) => {
    const lower = line.toLowerCase();

    // Section transitions
    if (SECTION_KEYWORDS.projects.some((k) => lower === k || lower.startsWith(`${k}:`))) {
      inProjectSection = true;
      inExperienceSection = false;
      return;
    }
    if (SECTION_KEYWORDS.experience.some((k) => lower === k || lower.startsWith(`${k}:`))) {
      inExperienceSection = true;
      inProjectSection = false;
      return;
    }
    if (
      SECTION_KEYWORDS.education.some((k) => lower.startsWith(k)) ||
      SECTION_KEYWORDS.skills.some((k) => lower.startsWith(k)) ||
      SECTION_KEYWORDS.certifications.some((k) => lower.startsWith(k))
    ) {
      inProjectSection = false;
      inExperienceSection = false;
    }

    // Bullet point detection
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('·');
    if (isBullet) {
      const cleanBullet = line.replace(/^[•\-\*·\s]+/, '').trim();
      if (cleanBullet.length > 15) {
        const hasMetric = metricRegex.test(cleanBullet);
        if (hasMetric) quantifiedBulletsCount++;
        allBullets.push({ text: cleanBullet, hasMetric });

        if (currentProject) {
          currentProject.bullets.push(cleanBullet);
          if (hasMetric) currentProject.achievements.push(cleanBullet);
        }
      }
    } else if (inProjectSection && line.length > 3 && line.length < 70 && !line.includes('@')) {
      // Likely a project title
      if (currentProject && currentProject.bullets.length > 0) {
        projects.push(currentProject);
      }

      // Check for technologies in this project title / line
      const techsUsed = normalizedSkills.filter((s) => line.toLowerCase().includes(s.toLowerCase()));

      currentProject = {
        name: line,
        technologies: techsUsed,
        githubUrl: line.includes('github.com') ? line : null,
        liveUrl: line.includes('http') ? line : null,
        bullets: [],
        achievements: [],
      };
    }
  });

  if (currentProject && (currentProject.bullets.length > 0 || currentProject.technologies.length > 0)) {
    projects.push(currentProject);
  }

  // Fallback: If no distinct project headers were caught, create aggregated project list from tech mentions
  if (projects.length === 0 && normalizedSkills.length > 0) {
    projects.push({
      name: 'Technical Projects & Implementations',
      technologies: normalizedSkills.slice(0, 5),
      githubUrl: null,
      liveUrl: null,
      bullets: allBullets.slice(0, 3).map((b) => b.text),
      achievements: allBullets.filter((b) => b.hasMetric).slice(0, 2).map((b) => b.text),
    });
  }

  return {
    projects,
    totalBullets: allBullets.length,
    quantifiedAchievements: quantifiedBulletsCount,
    allBullets,
  };
}

/**
 * 6. Target Role & Industry Matching
 */
function analyzeRoleMatch(normalizedSkills, skillProfile) {
  const targetRole = skillProfile?.targetRole || null;
  const targetIndustry = skillProfile?.targetIndustry || null;

  if (!targetRole) {
    return {
      targetRole: null,
      targetIndustry: targetIndustry || null,
      matchedSkills: [],
      missingSkills: [],
      score: 40, // Base default when no role is configured
    };
  }

  const roleLower = targetRole.toLowerCase();

  // Role expectations dictionary
  const ROLE_REQUIREMENTS = {
    'frontend developer': ['JavaScript', 'TypeScript', 'React', 'HTML5', 'CSS3', 'TailwindCSS', 'Next.js', 'Redux', 'Git'],
    'backend developer': ['Node.js', 'Express.js', 'Python', 'Java', 'SQL', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Docker', 'Git'],
    'full stack developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express.js', 'SQL', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
    'software engineer': ['Data Structures & Algorithms', 'JavaScript', 'Python', 'Java', 'C++', 'SQL', 'Git', 'REST APIs', 'Linux'],
    'data scientist': ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn'],
    'devops engineer': ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git', 'Python', 'Nginx'],
  };

  // Find matching requirement set or use general software engineering baseline
  let expected = ['JavaScript', 'Python', 'Java', 'SQL', 'Git', 'REST APIs', 'Data Structures & Algorithms'];
  for (const [key, reqs] of Object.entries(ROLE_REQUIREMENTS)) {
    if (roleLower.includes(key) || key.includes(roleLower)) {
      expected = reqs;
      break;
    }
  }

  const matchedSkills = expected.filter((req) =>
    normalizedSkills.some((s) => s.toLowerCase() === req.toLowerCase())
  );
  const missingSkills = expected.filter((req) => !matchedSkills.includes(req));

  const matchRatio = expected.length > 0 ? matchedSkills.length / expected.length : 0.5;
  const score = Math.min(100, Math.max(20, Math.round(matchRatio * 100)));

  return {
    targetRole,
    targetIndustry,
    matchedSkills,
    missingSkills,
    score,
  };
}

/**
 * 7. Compare Resume Skills vs Student's SkillProfile Skills
 */
function compareSkillsWithProfile(resumeSkills, skillProfile) {
  const profileSkills = Array.isArray(skillProfile?.skills)
    ? skillProfile.skills.map((s) => s.name)
    : [];

  const common = [];
  const missingFromResume = [];
  const resumeOnly = [];

  // Find common and missing from resume
  profileSkills.forEach((pSkill) => {
    const isFound = resumeSkills.some((rSkill) => rSkill.toLowerCase() === pSkill.toLowerCase());
    if (isFound) {
      common.push(pSkill);
    } else {
      missingFromResume.push(pSkill);
    }
  });

  // Find resume only skills
  resumeSkills.forEach((rSkill) => {
    const isInProfile = profileSkills.some((pSkill) => pSkill.toLowerCase() === rSkill.toLowerCase());
    if (!isInProfile && !resumeOnly.includes(rSkill)) {
      resumeOnly.push(rSkill);
    }
  });

  return {
    profileSkills,
    resumeSkills,
    common,
    missingFromResume,
    resumeOnly,
  };
}

/**
 * 8. ATS Compatibility Analysis & Scoring
 */
function analyzeATSCompatibility(text, candidateInfo, sections, wordCount) {
  const warnings = [];
  const passedChecks = [];
  let score = 0;

  // Check 1: Text extractability & length (Max: 20)
  let textExtractability = 0;
  if (wordCount >= 200 && wordCount <= 1000) {
    textExtractability = 20;
    passedChecks.push('Optimal document word count (200–1000 words).');
  } else if (wordCount > 1000) {
    textExtractability = 14;
    warnings.push('Resume word count is high (>1000 words). Consider condensing to 1–2 pages.');
  } else if (wordCount >= 100) {
    textExtractability = 12;
    warnings.push('Resume word count is slightly brief (<200 words).');
  } else {
    textExtractability = 5;
    warnings.push('Low extracted word count. Ensure text is not embedded inside images/canvases.');
  }

  // Check 2: Standard section structure (Max: 20)
  let sectionStructure = 0;
  const coreSections = ['Education', 'Skills', 'Experience', 'Projects'];
  const matchedCore = coreSections.filter((s) => sections.includes(s));
  sectionStructure = Math.round((matchedCore.length / coreSections.length) * 20);

  if (matchedCore.length >= 3) {
    passedChecks.push(`Standard section headings detected (${matchedCore.join(', ')}).`);
  } else {
    warnings.push(`Missing standard section headings: ${coreSections.filter((s) => !sections.includes(s)).join(', ')}.`);
  }

  // Check 3: Keyword & Technical Coverage (Max: 20)
  let keywordCoverage = 15;
  if (sections.includes('Skills')) {
    keywordCoverage = 20;
    passedChecks.push('Dedicated Technical Skills section detected for parser indexing.');
  } else {
    keywordCoverage = 10;
    warnings.push('No dedicated Skills section header found. ATS parsers prefer a distinct Technical Skills heading.');
  }

  // Check 4: Contact & Professional Links (Max: 20)
  let contactLinks = 0;
  if (candidateInfo.email) contactLinks += 7;
  if (candidateInfo.phone) contactLinks += 5;
  if (candidateInfo.links.github || candidateInfo.links.linkedin) contactLinks += 8;

  if (candidateInfo.email && candidateInfo.phone) {
    passedChecks.push('Essential contact details (Email, Phone) clearly extractable.');
  } else {
    if (!candidateInfo.email) warnings.push('No email address detected.');
    if (!candidateInfo.phone) warnings.push('No phone number detected.');
  }

  if (candidateInfo.links.github || candidateInfo.links.linkedin) {
    passedChecks.push('Professional portfolio/profile links (GitHub/LinkedIn) detected.');
  } else {
    warnings.push('No GitHub or LinkedIn URLs detected.');
  }

  // Check 5: Formatting simplicity (Max: 20)
  let formattingSimplicity = 18;
  const suspiciousChars = (text.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/g) || []).length;
  if (suspiciousChars > 5) {
    formattingSimplicity -= 8;
    warnings.push('Unusual binary characters or complex font encodings detected.');
  } else {
    passedChecks.push('Clean character encoding without corrupted text artifacts.');
  }

  score = Math.min(100, Math.max(0, textExtractability + sectionStructure + keywordCoverage + contactLinks + formattingSimplicity));

  return {
    score,
    breakdown: {
      textExtractability,
      sectionStructure,
      keywordCoverage,
      contactLinks,
      formattingSimplicity,
    },
    warnings,
    passedChecks,
  };
}

/**
 * 9. Content Quality & Evidence Strength Scoring
 */
function calculateQualityAndEvidence(text, sections, projects, education, totalBullets, quantifiedAchievements) {
  // Content Quality (Max: 100)
  let contentQuality = 30; // base for valid text

  if (sections.includes('Education')) contentQuality += 15;
  if (sections.includes('Skills')) contentQuality += 20;
  if (sections.includes('Projects') || projects.length > 0) contentQuality += 20;
  if (sections.includes('Experience')) contentQuality += 15;

  contentQuality = Math.min(100, Math.max(20, contentQuality));

  // Evidence Strength (Max: 100)
  let evidenceStrength = 20;

  // Bullet point metric ratio
  if (totalBullets > 0) {
    const quantRatio = quantifiedAchievements / totalBullets;
    evidenceStrength += Math.round(quantRatio * 40);
  }

  // Project technical depth
  const projectsWithTech = projects.filter((p) => p.technologies && p.technologies.length > 0).length;
  if (projectsWithTech >= 2) evidenceStrength += 20;
  else if (projectsWithTech >= 1) evidenceStrength += 10;

  // Education verification details
  if (education.some((e) => e.cgpa || e.graduationYear)) evidenceStrength += 20;

  evidenceStrength = Math.min(100, Math.max(15, evidenceStrength));

  return {
    contentQuality,
    evidenceStrength,
  };
}

/**
 * 10. Generate Actionable Recommendations & Issues
 */
function generateRecommendationsAndIssues({
  candidateInfo,
  sections,
  normalizedSkills,
  roleMatch,
  skillComparison,
  totalBullets,
  quantifiedAchievements,
  atsAnalysis,
}) {
  const recommendations = [];
  const issues = [];

  // Critical / High Issues
  if (!atsAnalysis.breakdown.sectionStructure >= 15) {
    issues.push({
      severity: 'high',
      title: 'Missing Core Section Headers',
      message: 'Standard headers like "Technical Skills", "Projects", and "Education" improve ATS parsing.',
    });
  }

  if (!candidateInfo.email || !candidateInfo.phone) {
    issues.push({
      severity: 'critical',
      title: 'Incomplete Contact Information',
      message: 'Ensure email and phone number are clearly listed at the top of your resume.',
    });
    recommendations.push({
      category: 'Contact',
      text: 'Add complete contact details (Email, Phone, City) to the top header.',
      impact: 'High',
    });
  }

  // GitHub / Portfolio links
  if (!candidateInfo.links.github) {
    issues.push({
      severity: 'medium',
      title: 'No GitHub Profile Link',
      message: 'A public GitHub profile demonstrates practical coding ability to recruiters.',
    });
    recommendations.push({
      category: 'Links',
      text: 'Include a direct link to your GitHub profile containing original repositories.',
      impact: 'Medium',
    });
  }

  // Quantified bullets
  if (totalBullets > 0 && quantifiedAchievements < 2) {
    issues.push({
      severity: 'medium',
      title: 'Few Quantifiable Achievements',
      message: `Only ${quantifiedAchievements} of ${totalBullets} bullet points contain measurable metrics or scale.`,
    });
    recommendations.push({
      category: 'Impact & Evidence',
      text: 'Quantify your project and experience bullet points with numbers, percentages, user scale, or performance gains.',
      impact: 'High',
    });
  }

  // Target role alignment recommendations
  if (roleMatch.targetRole) {
    if (roleMatch.missingSkills.length > 0) {
      recommendations.push({
        category: 'Role Alignment',
        text: `Target role "${roleMatch.targetRole}" commonly expects: ${roleMatch.missingSkills.slice(0, 3).join(', ')}. Highlight relevant coursework or projects covering these.`,
        impact: 'High',
      });
    }
  } else {
    recommendations.push({
      category: 'Career Goal',
      text: 'Set your Target Role on Career Odyssey to enable custom role-matching benchmark analysis.',
      impact: 'Medium',
    });
  }

  // Skills comparison recommendations
  if (skillComparison.missingFromResume.length > 0) {
    recommendations.push({
      category: 'Skills Alignment',
      text: `You have ${skillComparison.missingFromResume.slice(0, 3).join(', ')} listed in your Career Odyssey profile, but they weren't detected on your resume.`,
      impact: 'Medium',
    });
  }

  return { recommendations, issues };
}

/**
 * Main analysis orchestration function
 */
function analyzeResumeDocument(extractedData, skillProfile = null) {
  const text = extractedData.text || '';
  const wordCount = extractedData.wordCount || 0;
  const pageCount = extractedData.pageCount || 1;

  // Handle scanned / empty documents
  if (extractedData.isScanned || wordCount < 20) {
    return {
      status: 'needs_ocr',
      message: 'This document contains little or no extractable text. It may be an image-based scanned PDF.',
      resumeScore: 0,
      scores: { ats: 0, contentQuality: 0, roleAlignment: 0, evidenceStrength: 0 },
      candidate: { name: null, email: null, phone: null, location: null },
      links: { github: null, linkedin: null, portfolio: null, other: [] },
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: { detected: [], normalized: [] },
      sections: [],
      roleMatch: { targetRole: null, targetIndustry: null, matchedSkills: [], missingSkills: [], score: 0 },
      quality: { quantifiedAchievements: 0, totalBullets: 0, issues: [{ severity: 'critical', title: 'Image-Based PDF', message: 'No extractable text found.' }] },
      recommendations: [{ category: 'Document', text: 'Upload a text-based PDF or DOCX exported directly from Word, Google Docs, or LaTeX.', impact: 'Critical' }],
      ats: { score: 0, warnings: ['Document is image-based without extractable text layer.'], passedChecks: [] },
      metadata: {
        parser: extractedData.extractionMethod,
        analyzedAt: new Date().toISOString(),
        wordCount,
        pageCount,
        extractionMethod: extractedData.extractionMethod,
      },
    };
  }

  // 1. Extract Candidate Contact & Links
  const candidateInfo = extractCandidateInfo(text);

  // 2. Detect Section Headers
  const sections = detectSections(text);

  // 3. Extract & Normalize Skills
  const { detected: detectedSkills, normalized: normalizedSkills } = extractSkills(text, sections);

  // 4. Extract Education
  const education = extractEducation(text);

  // 5. Extract Projects & Achievements
  const { projects, totalBullets, quantifiedAchievements } = extractProjectsAndBullets(text, normalizedSkills);

  // 6. Role Alignment
  const roleMatch = analyzeRoleMatch(normalizedSkills, skillProfile);

  // 7. Skills Comparison with SkillProfile
  const skillComparison = compareSkillsWithProfile(normalizedSkills, skillProfile);

  // 8. ATS Compatibility Analysis
  const atsAnalysis = analyzeATSCompatibility(text, candidateInfo, sections, wordCount);

  // 9. Content Quality & Evidence Strength
  const { contentQuality, evidenceStrength } = calculateQualityAndEvidence(
    text,
    sections,
    projects,
    education,
    totalBullets,
    quantifiedAchievements
  );

  // 10. Overall Resume Score (Deterministic, Bounded 0–100)
  // ATS (25%) + Content Quality (30%) + Role Alignment (25%) + Evidence Strength (20%)
  const rawScore = 0.25 * atsAnalysis.score + 0.3 * contentQuality + 0.25 * roleMatch.score + 0.2 * evidenceStrength;
  const resumeScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let statusLabel = 'Needs Major Improvement';
  if (resumeScore >= 90) statusLabel = 'Excellent';
  else if (resumeScore >= 75) statusLabel = 'Strong';
  else if (resumeScore >= 60) statusLabel = 'Good Foundation';
  else if (resumeScore >= 40) statusLabel = 'Needs Improvement';

  // 11. Recommendations & Issues
  const { recommendations, issues } = generateRecommendationsAndIssues({
    candidateInfo,
    sections,
    normalizedSkills,
    roleMatch,
    skillComparison,
    totalBullets,
    quantifiedAchievements,
    atsAnalysis,
  });

  return {
    status: 'completed',
    resumeScore,
    statusLabel,
    scores: {
      ats: atsAnalysis.score,
      contentQuality,
      roleAlignment: roleMatch.score,
      evidenceStrength,
    },
    candidate: {
      name: candidateInfo.name,
      email: candidateInfo.email,
      phone: candidateInfo.phone,
      location: candidateInfo.location,
    },
    links: candidateInfo.links,
    education,
    projects,
    skills: {
      detected: detectedSkills,
      normalized: normalizedSkills,
    },
    skillComparison,
    sections,
    roleMatch,
    quality: {
      quantifiedAchievements,
      totalBullets,
      issues,
    },
    recommendations,
    ats: atsAnalysis,
    metadata: {
      parser: extractedData.extractionMethod,
      analyzedAt: new Date().toISOString(),
      wordCount,
      pageCount,
      extractionMethod: extractedData.extractionMethod,
    },
  };
}

module.exports = {
  analyzeResumeDocument,
  extractCandidateInfo,
  extractSkills,
  extractEducation,
  detectSections,
};
