/**
 * careerScore.service.js
 *
 * Deterministic, explainable Career Readiness Score calculation engine.
 * Total: 100 points maximum.
 *
 * Breakdown:
 *  1. Profile / Career Direction : 15 points
 *  2. Skills                     : 25 points
 *  3. DSA (Manual / Self-reported): 25 points
 *  4. GitHub (Real Public Data)  : 25 points
 *
 * All values are sanitized, clamped, finite, and non-negative.
 * Final score is strictly clamped between 0 and 100.
 */

function sanitizeNumber(val, min = 0, max = Infinity) {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num) || num < min) return min;
  if (num > max) return max;
  return num;
}

/**
 * 1. Calculate Profile / Career Direction Score (Max: 15)
 *  - Target role (present & valid): 7 pts
 *  - Target industry (present & valid): 4 pts
 *  - Has at least 1 usable skill: 4 pts
 */
function calculateProfileScore(skillProfile) {
  const details = [];
  let earned = 0;

  const hasRole = Boolean(skillProfile?.targetRole && typeof skillProfile.targetRole === 'string' && skillProfile.targetRole.trim().length > 0);
  if (hasRole) {
    earned += 7;
    details.push({ label: 'Target role defined', earned: 7, max: 7, status: 'complete' });
  } else {
    details.push({ label: 'Target role defined', earned: 0, max: 7, status: 'missing' });
  }

  const hasIndustry = Boolean(skillProfile?.targetIndustry && typeof skillProfile.targetIndustry === 'string' && skillProfile.targetIndustry.trim().length > 0);
  if (hasIndustry) {
    earned += 4;
    details.push({ label: 'Target industry selected', earned: 4, max: 4, status: 'complete' });
  } else {
    details.push({ label: 'Target industry selected', earned: 0, max: 4, status: 'missing' });
  }

  const validSkillsCount = Array.isArray(skillProfile?.skills)
    ? skillProfile.skills.filter(s => s?.name && typeof s.name === 'string' && s.name.trim().length > 0).length
    : 0;

  if (validSkillsCount > 0) {
    earned += 4;
    details.push({ label: 'Initial skills listed', earned: 4, max: 4, status: 'complete' });
  } else {
    details.push({ label: 'Initial skills listed', earned: 0, max: 4, status: 'missing' });
  }

  earned = Math.min(15, Math.max(0, earned));
  return { earned, max: 15, details };
}

/**
 * 2. Calculate Skills Score (Max: 25)
 *  - Breadth (up to 10 points based on skill count)
 *    0 -> 0, 1-2 -> 3, 3-4 -> 5, 5-7 -> 8, 8+ -> 10
 *  - Proficiency (up to 15 points based on skill levels)
 *    beginner: 1, intermediate: 2, advanced: 3, expert: 4 (sum capped at 15)
 */
function calculateSkillsScore(skillProfile) {
  const details = [];
  const skills = Array.isArray(skillProfile?.skills)
    ? skillProfile.skills.filter(s => s?.name && typeof s.name === 'string' && s.name.trim().length > 0)
    : [];

  const count = skills.length;
  let breadth = 0;
  if (count >= 8) breadth = 10;
  else if (count >= 5) breadth = 8;
  else if (count >= 3) breadth = 5;
  else if (count >= 1) breadth = 3;

  details.push({
    label: `Skill breadth (${count} skill${count !== 1 ? 's' : ''})`,
    earned: breadth,
    max: 10,
    status: breadth >= 8 ? 'strong' : breadth >= 5 ? 'moderate' : 'low',
  });

  const levelWeights = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };

  let proficiencySum = 0;
  skills.forEach(s => {
    const lvl = (s.level || 'beginner').toLowerCase();
    proficiencySum += levelWeights[lvl] || 1;
  });

  const proficiency = Math.min(15, proficiencySum);
  details.push({
    label: 'Proficiency depth',
    earned: proficiency,
    max: 15,
    status: proficiency >= 12 ? 'strong' : proficiency >= 6 ? 'moderate' : 'low',
  });

  const earned = Math.min(25, Math.max(0, breadth + proficiency));
  return { earned, max: 25, details };
}

/**
 * 3. Calculate DSA Score (Max: 25)
 *  - DSA Progress (up to 15 points based on totalSolved)
 *    totalSolved = easy + medium + hard
 *    100+ -> 15, 50-99 -> 10, 20-49 -> 6, 1-19 -> 3, 0 -> 0
 *  - Difficulty balance (up to 5 points)
 *    hard >= 5 or medium >= 20 -> 5, medium >= 10 -> 3, medium >= 1 or hard >= 1 -> 2, else 0
 *  - Consistency / streak (up to 5 points)
 *    current >= 7 or longest >= 14 -> 5, current >= 3 or longest >= 7 -> 3, streak >= 1 -> 1, else 0
 */
function calculateDSAScore(dsaProfile) {
  const details = [];

  // If LeetCode is connected and synced, use the verified public profile data
  const isLeetCodeSynced = Boolean(dsaProfile?.leetcodeConnected && dsaProfile?.leetcodeData);
  const dataSource = isLeetCodeSynced ? dsaProfile.leetcodeData : dsaProfile;

  const easy = sanitizeNumber(dataSource?.easySolved, 0, 10000) || 0;
  const medium = sanitizeNumber(dataSource?.mediumSolved, 0, 10000) || 0;
  const hard = sanitizeNumber(dataSource?.hardSolved, 0, 10000) || 0;
  const totalSolved = easy + medium + hard;

  let progress = 0;
  if (totalSolved >= 100) progress = 15;
  else if (totalSolved >= 50) progress = 10;
  else if (totalSolved >= 20) progress = 6;
  else if (totalSolved >= 1) progress = 3;

  details.push({
    label: `${isLeetCodeSynced ? 'LeetCode Solved' : 'Problem volume'} (${totalSolved} problems)`,
    earned: progress,
    max: 15,
    status: progress >= 10 ? 'strong' : progress >= 6 ? 'moderate' : 'low',
  });

  let diffBalance = 0;
  if (hard >= 5 || medium >= 20) diffBalance = 5;
  else if (medium >= 10) diffBalance = 3;
  else if (medium >= 1 || hard >= 1) diffBalance = 2;

  details.push({
    label: `Difficulty distribution (${medium}M / ${hard}H)`,
    earned: diffBalance,
    max: 5,
    status: diffBalance >= 4 ? 'strong' : diffBalance >= 2 ? 'moderate' : 'low',
  });

  const curStreak = sanitizeNumber(dsaProfile?.currentStreak, 0, 1000) || 0;
  const maxStreak = sanitizeNumber(dsaProfile?.longestStreak, 0, 1000) || 0;
  let streakScore = 0;
  if (curStreak >= 7 || maxStreak >= 14) streakScore = 5;
  else if (curStreak >= 3 || maxStreak >= 7) streakScore = 3;
  else if (curStreak >= 1 || maxStreak >= 1) streakScore = 1;

  details.push({
    label: `Practice consistency (${curStreak}d streak - self-reported)`,
    earned: streakScore,
    max: 5,
    status: streakScore >= 4 ? 'strong' : streakScore >= 2 ? 'moderate' : 'low',
  });

  const earned = Math.min(25, Math.max(0, progress + diffBalance + streakScore));
  return { earned, max: 25, details, isLeetCodeSynced };
}

/**
 * 4. Calculate GitHub Score (Max: 25)
 *  - Repository presence / breadth (up to 8 points):
 *    publicRepos >= 5 -> 8, 3-4 -> 6, 1-2 -> 4, 0 -> 0
 *  - Repository quality signals (up to 8 points):
 *    totalStars & totalForks
 *  - Language breadth (up to 4 points):
 *    languages >= 3 -> 4, 2 -> 3, 1 -> 2, 0 -> 0
 *  - Profile completeness (up to 5 points):
 *    username & connected (2) + bio (2) + avatar/location/blog (1)
 */
function calculateGitHubScore(gitHubProfile) {
  const details = [];
  const isConnected = Boolean(gitHubProfile?.connected && gitHubProfile?.username);

  if (!isConnected) {
    details.push({ label: 'GitHub account linked', earned: 0, max: 5, status: 'disconnected' });
    details.push({ label: 'Public repositories', earned: 0, max: 8, status: 'disconnected' });
    details.push({ label: 'Community engagement (stars/forks)', earned: 0, max: 8, status: 'disconnected' });
    details.push({ label: 'Tech stack diversity', earned: 0, max: 4, status: 'disconnected' });
    return { earned: 0, max: 25, details };
  }

  // Profile completeness (Max 5)
  let profileComp = 2; // connected base
  if (gitHubProfile?.bio && gitHubProfile.bio.trim().length > 0) profileComp += 2;
  if (gitHubProfile?.location || gitHubProfile?.blog || gitHubProfile?.avatarUrl) profileComp += 1;
  profileComp = Math.min(5, profileComp);

  details.push({
    label: 'Profile completeness',
    earned: profileComp,
    max: 5,
    status: profileComp >= 4 ? 'strong' : 'moderate',
  });

  // Repository presence (Max 8)
  const repos = sanitizeNumber(gitHubProfile?.publicRepos, 0, 5000);
  let repoScore = 0;
  if (repos >= 5) repoScore = 8;
  else if (repos >= 3) repoScore = 6;
  else if (repos >= 1) repoScore = 4;

  details.push({
    label: `Public repositories (${repos} repos)`,
    earned: repoScore,
    max: 8,
    status: repoScore >= 6 ? 'strong' : repoScore >= 4 ? 'moderate' : 'low',
  });

  // Quality signals: stars & forks (Max 8)
  const stars = sanitizeNumber(gitHubProfile?.totalStars, 0, 50000);
  const forks = sanitizeNumber(gitHubProfile?.totalForks, 0, 50000);
  let qualityScore = 0;
  if (stars >= 10) qualityScore += 4;
  else if (stars >= 3) qualityScore += 2;
  else if (stars >= 1) qualityScore += 1;

  if (forks >= 5) qualityScore += 4;
  else if (forks >= 1) qualityScore += 2;

  // Bonus for non-forked original repos in top list
  const nonForkedCount = Array.isArray(gitHubProfile?.repositories)
    ? gitHubProfile.repositories.filter(r => !r.isForked).length
    : 0;
  if (nonForkedCount >= 2 && qualityScore < 8) {
    qualityScore = Math.min(8, qualityScore + 2);
  }

  qualityScore = Math.min(8, qualityScore);
  details.push({
    label: `Project engagement (${stars}★ / ${forks}⑂)`,
    earned: qualityScore,
    max: 8,
    status: qualityScore >= 5 ? 'strong' : qualityScore >= 2 ? 'moderate' : 'low',
  });

  // Language diversity (Max 4)
  const langCount = Array.isArray(gitHubProfile?.languages) ? gitHubProfile.languages.length : 0;
  let langScore = 0;
  if (langCount >= 3) langScore = 4;
  else if (langCount >= 2) langScore = 3;
  else if (langCount >= 1) langScore = 2;

  details.push({
    label: `Tech stack diversity (${langCount} language${langCount !== 1 ? 's' : ''})`,
    earned: langScore,
    max: 4,
    status: langScore >= 3 ? 'strong' : langScore >= 2 ? 'moderate' : 'low',
  });

  const earned = Math.min(25, Math.max(0, profileComp + repoScore + qualityScore + langScore));
  return { earned, max: 25, details };
}

/**
 * Generate actionable, deterministic recommendations based on actual data
 */
function generateRecommendations({ skillProfile, dsaProfile, gitHubProfile, profileScore, skillsScore, dsaScore, gitHubScore }) {
  const recs = [];

  // Profile recommendations
  if (!skillProfile?.targetRole || !skillProfile.targetRole.trim()) {
    recs.push({
      category: 'Profile',
      text: 'Set a target role to clarify your career direction and benchmark requirements.',
      actionUrl: '/student/career-goal',
      actionLabel: 'Set Target Role',
    });
  }
  if (!skillProfile?.targetIndustry || !skillProfile.targetIndustry.trim()) {
    recs.push({
      category: 'Profile',
      text: 'Choose a target industry to align your portfolio with market standards.',
      actionUrl: '/student/career-goal',
      actionLabel: 'Choose Industry',
    });
  }

  // Skills recommendations
  const validSkills = Array.isArray(skillProfile?.skills)
    ? skillProfile.skills.filter(s => s?.name && s.name.trim())
    : [];

  if (validSkills.length < 5) {
    recs.push({
      category: 'Skills',
      text: 'Add more core technical skills to broaden your verified skillset (aim for at least 5-8 skills).',
      actionUrl: '/student/skills',
      actionLabel: 'Add Skills',
    });
  } else if (skillsScore.earned < 18) {
    recs.push({
      category: 'Skills',
      text: 'Advance your skill proficiency from Beginner to Intermediate/Advanced to strengthen your profile.',
      actionUrl: '/student/skills',
      actionLabel: 'Update Skill Levels',
    });
  }

  // DSA recommendations
  const totalDSA = sanitizeNumber(dsaProfile?.easySolved) + sanitizeNumber(dsaProfile?.mediumSolved) + sanitizeNumber(dsaProfile?.hardSolved);
  if (totalDSA < 20) {
    recs.push({
      category: 'DSA',
      text: 'Increase your DSA practice volume and log solved problems (aim for 50+ problems for interview readiness).',
      actionUrl: '/student/dsa',
      actionLabel: 'Log DSA Practice',
    });
  } else if (sanitizeNumber(dsaProfile?.mediumSolved) < 10) {
    recs.push({
      category: 'DSA',
      text: 'Focus on Medium difficulty problems to build problem-solving depth for technical assessments.',
      actionUrl: '/student/dsa',
      actionLabel: 'Track Medium Problems',
    });
  } else {
    recs.push({
      category: 'DSA',
      text: 'Your DSA stats are self-reported; keep your problem counts and streak updated regularly.',
      actionUrl: '/student/dsa',
      actionLabel: 'Update DSA',
    });
  }

  // GitHub recommendations
  if (!gitHubProfile?.connected || !gitHubProfile?.username) {
    recs.push({
      category: 'GitHub',
      text: 'Connect and sync your public GitHub profile to showcase real repositories and project code.',
      actionUrl: '/student/github',
      actionLabel: 'Connect GitHub',
    });
  } else if (sanitizeNumber(gitHubProfile?.publicRepos) < 3) {
    recs.push({
      category: 'GitHub',
      text: 'Build and publish at least 3-5 original projects with clear READMEs to your GitHub account.',
      actionUrl: '/student/github',
      actionLabel: 'View GitHub',
    });
  } else if (!gitHubProfile?.languages || gitHubProfile.languages.length < 2) {
    recs.push({
      category: 'GitHub',
      text: 'Diversify your public projects with multiple modern languages or frameworks.',
      actionUrl: '/student/github',
      actionLabel: 'Refresh GitHub Data',
    });
  }

  return recs;
}

/**
 * Main score computation function
 */
function computeCareerScore({ skillProfile, dsaProfile, gitHubProfile }) {
  const profileScore = calculateProfileScore(skillProfile);
  const skillsScore  = calculateSkillsScore(skillProfile);
  const dsaScore     = calculateDSAScore(dsaProfile);
  const gitHubScore  = calculateGitHubScore(gitHubProfile);

  const rawTotal = profileScore.earned + skillsScore.earned + dsaScore.earned + gitHubScore.earned;
  const score = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let status = 'Getting Started';
  if (score >= 80) status = 'Strong';
  else if (score >= 60) status = 'Developing';
  else if (score >= 40) status = 'Building';

  const recommendations = generateRecommendations({
    skillProfile,
    dsaProfile,
    gitHubProfile,
    profileScore,
    skillsScore,
    dsaScore,
    gitHubScore,
  });

  const dataSources = {
    profile: {
      type: 'Application Data',
      status: skillProfile?.targetRole ? 'Configured' : 'Incomplete',
      updatedAt: skillProfile?.updatedAt || null,
    },
    skills: {
      type: 'Application Data',
      status: `${skillProfile?.skills?.length || 0} skills listed`,
      updatedAt: skillProfile?.updatedAt || null,
    },
    dsa: {
      type: dsaProfile?.leetcodeConnected ? 'LeetCode Public Profile (Verified Sync)' : 'Manual / Self-Reported',
      status: dsaProfile?.leetcodeConnected
        ? `Connected (@${dsaProfile.leetcodeUsername}) · ${dsaProfile.leetcodeData?.totalSolved || 0} solved`
        : (dsaProfile?.lastUpdated ? 'Manual entry updated' : (dsaProfile ? 'Configured' : 'Not started')),
      lastUpdated: dsaProfile?.leetcodeLastSyncedAt || dsaProfile?.lastUpdated || dsaProfile?.updatedAt || null,
      isVerified: Boolean(dsaProfile?.leetcodeConnected),
    },
    github: {
      type: 'Real Public GitHub API Data',
      status: gitHubProfile?.connected ? `Connected (@${gitHubProfile.username})` : 'Not connected',
      lastSyncedAt: gitHubProfile?.lastSyncedAt || null,
    },
  };

  return {
    score,
    status,
    maxScore: 100,
    breakdown: {
      profile: profileScore,
      skills: skillsScore,
      dsa: dsaScore,
      github: gitHubScore,
    },
    recommendations,
    dataSources,
    calculatedAt: new Date().toISOString(),
    disclaimer: 'This is an indicative score based on the information currently available in your Career Odyssey profile. It is not a prediction of placement or hiring outcomes.',
  };
}

module.exports = {
  computeCareerScore,
  calculateProfileScore,
  calculateSkillsScore,
  calculateDSAScore,
  calculateGitHubScore,
};
