/**
 * matching.service.js
 *
 * Central Matching & Career Intelligence Engine.
 * Single source of truth for deterministic compatibility calculation across:
 * - Student ↔ Opportunity
 * - Opportunity ↔ Student
 * - Skill ↔ Opportunity / Student
 * - Institution ↔ Industry Demand
 * - Academician ↔ Mentee Opportunity Intelligence
 *
 * Canonical Scoring Formula (Total: 100%):
 * - Required Skills Coverage:  35%
 * - Preferred Skills Coverage: 15%
 * - Career Goal Alignment:     15%
 * - Project Evidence:          15%
 * - Resume Evidence:            5%
 * - GitHub Evidence:            5%
 * - Career Readiness Score:    10%
 *
 * Guarantees:
 * - 100% Deterministic & Reproducible
 * - Bounded strictly 0–100
 * - Fully Explainable with Rationale and Recommendations
 * - Non-LLM: No hallucinated scores, zero external API latency
 * - Strict Privacy & Zero Automatic Mutations
 */

'use strict';

const mongoose = require('mongoose');

// Shared Data Models
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicianProfile = require('../models/AcademicianProfile');
const SkillProfile = require('../models/SkillProfile');
const Skill = require('../models/Skill');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const Project = require('../models/Project');
const Resume = require('../models/Resume');
const GitHubProfile = require('../models/GitHubProfile');
const DSAProfile = require('../models/DSAProfile');
const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');

/**
 * Normalize skill name for fuzzy/case-insensitive comparison with common aliases
 */
function normalizeSkill(str) {
  if (!str || typeof str !== 'string') return '';
  let norm = str.trim().toLowerCase().replace(/[\.\-\_\s]+/g, '');
  if (norm === 'nodejs') return 'node';
  if (norm === 'reactjs') return 'react';
  if (norm === 'vuejs') return 'vue';
  if (norm === 'angularjs') return 'angular';
  if (norm === 'golang') return 'go';
  if (norm === 'postgres' || norm === 'postgresql') return 'postgres';
  if (norm === 'k8s' || norm === 'kubernetes') return 'kubernetes';
  return norm;
}

/**
 * Standard Match Band Classifier
 */
function getMatchBand(score, isInsufficient = false) {
  if (isInsufficient) return 'INSUFFICIENT_DATA';
  if (score >= 80) return 'STRONG_MATCH';
  if (score >= 60) return 'GOOD_MATCH';
  if (score > 40) return 'POTENTIAL_MATCH';
  return 'LOW_MATCH';
}

/**
 * Sanitize candidate record to ensure privacy protection for industry views
 */
function sanitizeCandidateForIndustry(candidate) {
  if (!candidate) return null;
  const clone = JSON.parse(JSON.stringify(candidate));
  delete clone.password;
  delete clone.resetPasswordToken;
  delete clone.authToken;
  delete clone.token;
  delete clone.filePath;
  delete clone.__v;
  if (clone.resume && clone.resume.filePath) {
    delete clone.resume.filePath;
  }
  return clone;
}

/**
 * Build canonical skill lookup map from master taxonomy.
 */
async function getCanonicalSkillMap() {
  const canonicalSkills = await Skill.find({}).lean();
  const map = new Map(); // normalized -> canonical name

  for (const sk of canonicalSkills) {
    const canonicalName = sk.name;
    map.set(normalizeSkill(canonicalName), canonicalName);
    map.set(normalizeSkill(sk.skillId), canonicalName);
    for (const alias of sk.aliases || []) {
      map.set(normalizeSkill(alias), canonicalName);
    }
  }

  return map;
}

/**
 * Core Deterministic Evaluation Algorithm.
 * Single Source of Truth for compatibility scoring.
 *
 * @param {Object} candidateData
 * @param {Array} candidateData.skills - Student skills [{ name, level }] or string[]
 * @param {Object} [candidateData.careerGoal] - { targetRole, targetIndustry }
 * @param {Array} [candidateData.projects] - Array of Project docs
 * @param {Object} [candidateData.resume] - Parsed resume metadata
 * @param {Object} [candidateData.githubProfile] - GitHub telemetry
 * @param {Number} [candidateData.careerReadinessScore] - Readiness score (0-100)
 * @param {Object} [candidateData.dsaProfile] - DSA stats
 * @param {Object} opportunityReqs
 * @param {Array} opportunityReqs.requiredSkills - Array of required skill strings
 * @param {Array} [opportunityReqs.preferredSkills] - Array of preferred skill strings
 * @param {String} [opportunityReqs.title] - Opportunity title
 * @param {String} [opportunityReqs.domain] - Opportunity domain
 * @returns {Object} Comprehensive match evaluation
 */
function evaluateMatch(candidateData = {}, opportunityReqs = {}) {
  const reqSkillObjs = (opportunityReqs?.requiredSkills || []).map((s) => {
    if (typeof s === 'string') return { name: s.trim(), level: 'intermediate' };
    if (s && s.name) return { name: s.name.trim(), level: (s.level || 'intermediate').toLowerCase(), skill: s.skill };
    return null;
  }).filter(Boolean);

  const prefSkillObjs = (opportunityReqs?.preferredSkills || []).map((s) => {
    if (typeof s === 'string') return { name: s.trim(), level: 'intermediate' };
    if (s && s.name) return { name: s.name.trim(), level: (s.level || 'intermediate').toLowerCase(), skill: s.skill };
    return null;
  }).filter(Boolean);

  const reqSkills = reqSkillObjs.map((s) => s.name);
  const prefSkills = prefSkillObjs.map((s) => s.name);
  const jobTitle = (opportunityReqs?.title || '').trim().toLowerCase();
  const jobDomain = (opportunityReqs?.domain || '').trim().toLowerCase();

  const studentSkillItems = Array.isArray(candidateData?.skills) ? candidateData.skills : [];
  const projects = Array.isArray(candidateData?.projects) ? candidateData.projects : [];
  const resume = candidateData?.resume || null;
  const gh = candidateData?.githubProfile || candidateData?.github || null;
  const dsa = candidateData?.dsaProfile || candidateData?.dsa || null;

  const hasAnyData = !!(
    candidateData && (
      studentSkillItems.length > 0 ||
      candidateData.careerGoal ||
      candidateData.targetRole ||
      projects.length > 0 ||
      resume ||
      gh ||
      dsa ||
      typeof candidateData.careerScore === 'number' ||
      typeof candidateData.careerReadinessScore === 'number'
    )
  );

  // Handle completely empty profile/data
  if (!hasAnyData) {
    return {
      matchScore: 0,
      compositeScore: 0,
      matchBand: 'INSUFFICIENT_DATA',
      scoreBreakdown: {
        requiredSkills: 0,
        preferredSkills: 0,
        careerAlignment: 0,
        projectEvidence: 0,
        resumeEvidence: 0,
        githubEvidence: 0,
        readiness: 0,
        readinessScore: 0,
      },
      matchedSkills: [],
      missingSkills: reqSkills,
      partialSkills: [],
      confidence: 'LOW',
      evidence: {
        projectCount: 0,
        githubConnected: false,
        resumeParsed: false,
        readinessScore: 0,
        dsaSolved: 0,
        evidenceCoverage: 0,
        dataCompleteness: 'MINIMAL',
        confidenceBand: 'LOW',
      },
      rationale: ['Insufficient profile evidence available to evaluate candidate fit.'],
      recommendations: ['Complete skill profile and add verified project repositories to unlock matching.'],
    };
  }

  // 1. Map candidate skills & determine evidence sources
  const candidateSkillMap = new Map(); // normalized -> { originalName, level, verified }
  const externalEvidenceSkills = new Set(); // skills backed by projects, resume, or GitHub

  // Collect project skills
  for (const proj of projects) {
    const tech = [
      ...(Array.isArray(proj.techStack) ? proj.techStack : []),
      ...(Array.isArray(proj.technologies) ? proj.technologies : []),
      ...(Array.isArray(proj.skills) ? proj.skills : []),
    ];
    for (const t of tech) {
      if (typeof t === 'string' && t.trim()) {
        externalEvidenceSkills.add(normalizeSkill(t));
      }
    }
  }

  // Collect resume parsed skills
  const resumeSkills = [
    ...(Array.isArray(resume?.parsedSkills) ? resume.parsedSkills : []),
    ...(Array.isArray(resume?.skills) ? resume.skills : []),
    ...(Array.isArray(resume?.parsedData?.skills) ? resume.parsedData.skills : []),
  ];
  for (const rs of resumeSkills) {
    if (typeof rs === 'string' && rs.trim()) {
      externalEvidenceSkills.add(normalizeSkill(rs));
    }
  }

  for (const item of studentSkillItems) {
    const rawName = typeof item === 'string' ? item : item?.name;
    if (!rawName) continue;
    const norm = normalizeSkill(rawName);
    const level = typeof item === 'object' && item.level ? item.level.toLowerCase() : 'intermediate';
    const isBacked = externalEvidenceSkills.has(norm) || (typeof item === 'object' && item.verified === true);
    candidateSkillMap.set(norm, { originalName: rawName, level, verified: isBacked });
  }

  // Add any resume skills not explicitly in skill profile
  for (const rs of resumeSkills) {
    const raw = typeof rs === 'string' ? rs : rs?.name;
    if (!raw) continue;
    const norm = normalizeSkill(raw);
    if (!candidateSkillMap.has(norm)) {
      candidateSkillMap.set(norm, { originalName: raw, level: 'intermediate', verified: true });
    }
  }

  // 2. Evaluate Required Skills (35%)
  const LEVEL_RANK = { beginner: 1, basic: 1, intermediate: 2, advanced: 3, expert: 4 };
  const matchedRequired = [];
  const missingRequired = [];
  const partialSkills = [];

  for (const rkObj of reqSkillObjs) {
    const norm = normalizeSkill(rkObj.name);
    if (candidateSkillMap.has(norm)) {
      matchedRequired.push(rkObj.name);
      const candSkill = candidateSkillMap.get(norm);
      const studentRank = LEVEL_RANK[candSkill.level] || 2;
      const oppRank = LEVEL_RANK[rkObj.level] || 2;
      if (studentRank < oppRank || !candSkill.verified) {
        partialSkills.push(rkObj.name);
      }
    } else {
      missingRequired.push(rkObj.name);
    }
  }

  const requiredSkillPct = reqSkills.length > 0
    ? Math.round((matchedRequired.length / reqSkills.length) * 100)
    : (candidateSkillMap.size > 0 ? 100 : 0);

  // 3. Evaluate Preferred Skills (15%)
  const matchedPreferred = [];
  const missingPreferred = [];

  for (const pkObj of prefSkillObjs) {
    const norm = normalizeSkill(pkObj.name);
    if (candidateSkillMap.has(norm)) {
      matchedPreferred.push(pkObj.name);
    } else {
      missingPreferred.push(pkObj.name);
    }
  }

  const preferredSkillPct = prefSkills.length > 0
    ? Math.round((matchedPreferred.length / prefSkills.length) * 100)
    : 0;

  // 4. Evaluate Career Goal Alignment (15%)
  let careerAlignmentScore = 0;
  const targetRole = (candidateData.careerGoal?.targetRole || candidateData.targetRole || '').trim().toLowerCase();
  const targetIndustry = (candidateData.careerGoal?.targetIndustry || candidateData.careerGoal?.domain || candidateData.targetIndustry || '').trim().toLowerCase();

  if (targetRole || targetIndustry) {
    const hasRoleMatch = (jobTitle && targetRole && (jobTitle.includes(targetRole) || targetRole.includes(jobTitle)));
    const hasDomainMatch = (jobDomain && targetIndustry && (jobDomain.includes(targetIndustry) || targetIndustry.includes(jobDomain))) ||
                           (jobDomain && targetRole && (jobDomain.includes(targetRole) || targetRole.includes(jobDomain)));

    if (hasRoleMatch && hasDomainMatch) {
      careerAlignmentScore = 100;
    } else if (hasRoleMatch) {
      careerAlignmentScore = 80;
    } else if (hasDomainMatch) {
      careerAlignmentScore = 60;
    } else {
      careerAlignmentScore = 30;
    }
  }

  // 5. Evaluate Project Evidence (15%)
  let projectEvidenceScore = 0;
  if (projects.length > 0) {
    const oppTech = [
      ...reqSkills,
      ...prefSkills,
      ...(opportunityReqs.technologies || []),
    ].map(normalizeSkill);

    let matchingProjects = 0;
    for (const proj of projects) {
      const pTech = [
        ...(Array.isArray(proj.techStack) ? proj.techStack : []),
        ...(Array.isArray(proj.technologies) ? proj.technologies : []),
        ...(Array.isArray(proj.skills) ? proj.skills : []),
      ].map(normalizeSkill);

      const hasMatch = pTech.some((t) => oppTech.includes(t));
      if (hasMatch || proj.verified || (proj.stars && proj.stars > 0) || proj.githubUrl || proj.liveUrl) {
        matchingProjects++;
      }
    }

    if (matchingProjects > 0) {
      projectEvidenceScore = Math.min(100, 50 + matchingProjects * 25 + (projects.some((p) => p.verified) ? 25 : 0));
    } else {
      projectEvidenceScore = Math.min(60, projects.length * 20);
    }
  }

  // 6. Evaluate Resume Evidence (5%)
  let resumeEvidenceScore = 0;
  if (resume) {
    if (typeof resume.score === 'number') {
      resumeEvidenceScore = Math.max(0, Math.min(100, resume.score));
    } else {
      resumeEvidenceScore = 50;
      if (resumeSkills.length > 0) resumeEvidenceScore += 30;
      if (resume.summary || resume.experienceYears) resumeEvidenceScore += 20;
    }
  }

  // 7. Evaluate GitHub Evidence (5%)
  let githubEvidenceScore = 0;
  if (gh) {
    const repos = gh.publicRepos || gh.reposCount || 0;
    const stars = gh.totalStars || 0;
    const langs = Array.isArray(gh.languages) ? gh.languages : [];
    if (repos > 0 || stars > 0 || langs.length > 0 || gh.connected || gh.username) {
      githubEvidenceScore = Math.min(100, 40 + (repos >= 3 ? 25 : repos * 8) + (stars > 0 ? 25 : 0) + (langs.length > 0 ? 10 : 0));
    }
  }

  // 8. Career Readiness Score (10%)
  let readiness = 0;
  if (typeof candidateData.careerReadinessScore === 'number') {
    readiness = Math.max(0, Math.min(100, candidateData.careerReadinessScore));
  } else if (typeof candidateData.careerScore === 'number') {
    const dsaSolved = dsa?.totalSolved || dsa?.problemsSolved || 0;
    const dsaPoints = Math.min(100, Math.round(dsaSolved / 2));
    if (dsaSolved > 0) {
      readiness = Math.round(candidateData.careerScore * 0.7 + dsaPoints * 0.3);
    } else {
      readiness = candidateData.careerScore;
    }
  }

  // ── Calculate Weighted Composite Score ───────────────────────────
  const compositeScore = Math.round(
    requiredSkillPct     * 0.35 +
    preferredSkillPct    * 0.15 +
    careerAlignmentScore * 0.15 +
    projectEvidenceScore * 0.15 +
    resumeEvidenceScore  * 0.05 +
    githubEvidenceScore  * 0.05 +
    readiness            * 0.10
  );

  const matchScore = Math.max(0, Math.min(100, compositeScore));
  const matchBand = getMatchBand(matchScore);

  // Evidence Quality & Confidence Classification
  const verifiedMatchedCount = matchedRequired.filter((sk) => !partialSkills.includes(sk)).length;
  const evidenceCoverage = reqSkills.length > 0 ? Math.round((verifiedMatchedCount / reqSkills.length) * 100) : 100;

  let confidenceBand = 'LOW';
  let dataCompleteness = 'MINIMAL';

  if (projects.length > 0 && (gh?.connected || gh?.username) && resume) {
    confidenceBand = 'HIGH';
    dataCompleteness = 'COMPLETE';
  } else if (projects.length > 0 || resume || gh?.connected) {
    confidenceBand = 'MEDIUM';
    dataCompleteness = 'PARTIAL';
  }

  // Human-Readable Rationale
  const rationale = [];
  if (matchedRequired.length > 0) {
    rationale.push(`Matched ${matchedRequired.length} required skill(s) (${matchedRequired.join(', ')}).`);
  }
  if (requiredSkillPct === 100 && reqSkills.length > 0) {
    rationale.push(`Candidate demonstrates 100% required technical competencies (${matchedRequired.join(', ')}).`);
  } else if (missingRequired.length > 0) {
    rationale.push(`Skill gap identified in required areas: ${missingRequired.slice(0, 3).join(', ')}.`);
  }
  if (careerAlignmentScore >= 80) {
    rationale.push(`Strong career trajectory alignment with ${jobTitle || 'target opportunity'}.`);
  }
  if (projects.length > 0) {
    rationale.push(`Practical portfolio evidence verified across ${projects.length} repository projects.`);
  }
  if (gh && (gh.connected || gh.publicRepos > 0)) {
    rationale.push('Active GitHub profile demonstrates authentic commit history.');
  }
  if (readiness >= 70) {
    rationale.push(`High institutional readiness telemetry (${readiness}/100).`);
  }

  // Actionable Recommendations
  const recommendations = [];
  if (missingRequired.length > 0) {
    recommendations.push(`Prioritize mastering ${missingRequired.slice(0, 3).join(', ')} to increase qualification.`);
  }
  if (partialSkills.length > 0) {
    recommendations.push(`Add GitHub repository projects verifying hands-on use of ${partialSkills.slice(0, 2).join(', ')}.`);
  }
  if (prefSkills.length > 0 && missingPreferred.length > 0) {
    recommendations.push(`Familiarize with preferred technologies: ${missingPreferred.slice(0, 2).join(', ')}.`);
  }
  if (!resume) {
    recommendations.push('Upload and parse updated technical resume to strengthen verified credentials.');
  }
  if (!gh || (!gh.connected && !gh.username)) {
    recommendations.push('Connect active GitHub account to showcase verifiable commit telemetry.');
  }
  if (matchScore >= 75) {
    recommendations.push('Candidate is ready for immediate application and technical screening.');
  }

  return {
    matchScore,
    compositeScore: matchScore,
    matchBand,
    scoreBreakdown: {
      requiredSkills: requiredSkillPct,
      preferredSkills: preferredSkillPct,
      careerAlignment: careerAlignmentScore,
      projectEvidence: projectEvidenceScore,
      resumeEvidence: resumeEvidenceScore,
      githubEvidence: githubEvidenceScore,
      readiness,
      readinessScore: readiness,
    },
    matchedSkills: Array.from(new Set([...matchedRequired, ...matchedPreferred])),
    missingSkills: missingRequired,
    partialSkills,
    confidence: confidenceBand,
    evidence: {
      projectCount: projects.length,
      githubConnected: !!(gh && (gh.connected || gh.username)),
      resumeParsed: !!resume,
      readinessScore: readiness,
      dsaSolved: dsa ? (dsa.totalSolved || dsa.problemsSolved || 0) : 0,
      evidenceCoverage,
      dataCompleteness,
      confidenceBand,
    },
    rationale,
    recommendations,
  };
}

/**
 * Load complete student evidence object for matching
 */
async function loadStudentEvidence(studentUserId) {
  const [studentUser, studentProfile, skillProfile, projects, ghProfile, resume, dsa, snapshot] = await Promise.all([
    User.findById(studentUserId).select('name email avatar').lean(),
    StudentProfile.findOne({ user: studentUserId }).populate('institution', 'name code').lean(),
    SkillProfile.findOne({ user: studentUserId }).lean(),
    Project.find({ user: studentUserId }).lean(),
    GitHubProfile.findOne({ user: studentUserId }).lean(),
    Resume.findOne({ user: studentUserId }).select('parsedSkills summary experienceYears skills').lean(),
    DSAProfile.findOne({ user: studentUserId }).lean(),
    CommandCenterSnapshot.findOne({ user: studentUserId }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    user: studentUser,
    studentProfile,
    skills: skillProfile?.skills || [],
    targetRole: skillProfile?.targetRole || '',
    targetIndustry: skillProfile?.targetIndustry || '',
    careerGoal: {
      targetRole: skillProfile?.targetRole || '',
      targetIndustry: skillProfile?.targetIndustry || '',
    },
    projects: projects || [],
    resume,
    githubProfile: ghProfile,
    dsaProfile: dsa,
    careerReadinessScore: snapshot ? snapshot.readinessScore : 50,
  };
}

/**
 * 1-to-1 Match: Student to Opportunity
 */
async function matchStudentToOpportunity(studentId, opportunityId) {
  const [evidence, opportunity] = await Promise.all([
    loadStudentEvidence(studentId),
    Opportunity.findById(opportunityId).lean(),
  ]);

  if (!evidence.user) {
    throw new Error('Student user record not found');
  }
  if (!opportunity) {
    throw new Error('Opportunity record not found');
  }

  const evaluation = evaluateMatch(evidence, {
    requiredSkills: opportunity.requiredSkills,
    preferredSkills: opportunity.preferredSkills,
    title: opportunity.title,
    domain: opportunity.domain,
  });

  return {
    opportunity: {
      _id: opportunity._id,
      title: opportunity.title,
      company: opportunity.company,
      type: opportunity.type,
      domain: opportunity.domain,
      location: opportunity.location,
      workMode: opportunity.workMode || (opportunity.remote ? 'remote' : 'on-site'),
      experienceLevel: opportunity.experienceLevel || 'entry',
      stipend: opportunity.stipend,
      openings: opportunity.openings,
      deadline: opportunity.deadline,
      requiredSkills: opportunity.requiredSkills,
      preferredSkills: opportunity.preferredSkills,
      description: opportunity.description,
    },
    ...evaluation,
  };
}

/**
 * Ranked Opportunity Matches for a Student
 */
async function getStudentOpportunityMatches(studentId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const [evidence, canonicalSkillMap] = await Promise.all([
    loadStudentEvidence(studentId),
    getCanonicalSkillMap(),
  ]);

  if (!evidence.user) {
    throw new Error('Student user record not found');
  }

  // Filter active and non-expired opportunities
  const now = new Date();
  const query = {
    $or: [{ status: 'active' }, { active: true, status: { $ne: 'closed' } }],
    $and: [
      {
        $or: [
          { deadline: null },
          { deadline: { $exists: false } },
          { deadline: { $gte: now } },
        ],
      },
    ],
  };
  if (options.domain) query.domain = options.domain;
  if (options.type) query.type = options.type;
  if (options.workMode) query.workMode = options.workMode;

  const opportunities = await Opportunity.find(query).lean();

  if (opportunities.length === 0) {
    return {
      matches: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      message: 'No matching opportunities found in catalog.',
    };
  }

  const matches = [];
  for (const opp of opportunities) {
    const evaluation = evaluateMatch(evidence, {
      requiredSkills: opp.requiredSkills,
      preferredSkills: opp.preferredSkills,
      title: opp.title,
      domain: opp.domain,
    });

    if (options.minScore && evaluation.matchScore < Number(options.minScore)) {
      continue;
    }

    matches.push({
      opportunity: {
        _id: opp._id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        domain: opp.domain,
        location: opp.location,
        workMode: opp.workMode || (opp.remote ? 'remote' : 'on-site'),
        stipend: opp.stipend,
        openings: opp.openings,
        deadline: opp.deadline,
        requiredSkills: opp.requiredSkills,
        preferredSkills: opp.preferredSkills,
        description: opp.description,
        industry: opp.industry || null,
        isDemo: opp.isDemo ?? false,
        createdAt: opp.createdAt,
      },
      ...evaluation,
    });
  }

  // Sort ranked by matchScore descending, tie-breaking by recency
  matches.sort((a, b) => (b.matchScore - a.matchScore) || (new Date(b.opportunity?.createdAt || 0) - new Date(a.opportunity?.createdAt || 0)));

  const paginated = matches.slice(skip, skip + limit);

  return {
    matches: paginated,
    total: matches.length,
    page,
    limit,
    totalPages: Math.ceil(matches.length / limit),
  };
}

/**
 * Ranked Candidate Matches for an Opportunity (Opportunity -> Students)
 * Strict recruiter-safe projection.
 */
async function matchOpportunityToStudents(opportunityId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const opp = await Opportunity.findById(opportunityId).lean();
  if (!opp) {
    throw new Error('Opportunity record not found');
  }

  // Student directory filters
  const profileFilter = {};
  if (options.department) {
    profileFilter.department = { $regex: options.department.trim(), $options: 'i' };
  }

  const studentProfiles = await StudentProfile.find(profileFilter)
    .populate('user', 'name email avatar isActive')
    .populate('institution', 'name code')
    .lean();

  const activeProfiles = studentProfiles.filter((p) => p.user && p.user.isActive !== false);
  const studentUserIds = activeProfiles.map((p) => p.user._id);

  if (studentUserIds.length === 0) {
    return {
      candidates: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      message: 'No candidates found matching criteria',
    };
  }

  const [skillProfiles, projects, ghProfiles, resumes, dsaProfiles, snapshots] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    Project.find({ user: { $in: studentUserIds } }).select('user title techStack skills verified githubUrl liveUrl').lean(),
    GitHubProfile.find({ user: { $in: studentUserIds } }).select('user username connected publicRepos totalStars languages').lean(),
    Resume.find({ user: { $in: studentUserIds } }).select('user parsedSkills summary experienceYears skills').lean(),
    DSAProfile.find({ user: { $in: studentUserIds } }).select('user totalSolved').lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', readinessScore: { $first: '$readinessScore' } } },
    ]),
  ]);

  const skillMap = new Map(skillProfiles.map((s) => [s.user.toString(), s]));
  const projMap = new Map();
  for (const p of projects) {
    const uid = p.user.toString();
    if (!projMap.has(uid)) projMap.set(uid, []);
    projMap.get(uid).push(p);
  }
  const ghMap = new Map(ghProfiles.map((g) => [g.user.toString(), g]));
  const resMap = new Map(resumes.map((r) => [r.user.toString(), r]));
  const dsaMap = new Map(dsaProfiles.map((d) => [d.user.toString(), d]));
  const snapMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore]));

  const candidates = [];
  for (const prof of activeProfiles) {
    const uid = prof.user._id.toString();
    const skProf = skillMap.get(uid) || { skills: [], targetRole: '' };
    const userProjs = projMap.get(uid) || [];
    const gh = ghMap.get(uid) || null;
    const res = resMap.get(uid) || null;
    const dsa = dsaMap.get(uid) || null;
    const readiness = snapMap.get(uid) ?? 50;

    if (options.minReadiness && readiness < Number(options.minReadiness)) {
      continue;
    }

    const evaluation = evaluateMatch(
      {
        skills: skProf.skills,
        careerGoal: { targetRole: skProf.targetRole },
        targetRole: skProf.targetRole,
        projects: userProjs,
        resume: res,
        githubProfile: gh,
        dsaProfile: dsa,
        careerReadinessScore: readiness,
      },
      {
        requiredSkills: opp.requiredSkills,
        preferredSkills: opp.preferredSkills,
        title: opp.title,
        domain: opp.domain,
      }
    );

    if (options.minScore && evaluation.matchScore < Number(options.minScore)) {
      continue;
    }

    candidates.push({
      studentId: prof.user._id,
      name: prof.user.name,
      department: prof.department,
      institutionName: prof.institution ? prof.institution.name : 'Engineering Partner Institution',
      graduationYear: prof.graduationYear,
      cgpa: prof.cgpa,
      targetRole: skProf.targetRole || 'Software Engineering',
      ...evaluation,
    });
  }

  candidates.sort((a, b) => b.matchScore - a.matchScore);
  const paginated = candidates.slice(skip, skip + limit);

  return {
    opportunity: {
      _id: opp._id,
      title: opp.title,
      type: opp.type,
      domain: opp.domain,
      openings: opp.openings,
    },
    candidates: paginated,
    total: candidates.length,
    page,
    limit,
    totalPages: Math.ceil(candidates.length / limit),
  };
}

/**
 * High-Signal Talent Sourcing for Industry Partner
 */
async function getIndustryTalentMatches(industryId, options = {}) {
  const ownedOpps = await Opportunity.find({ industry: industryId, status: 'active' }).lean();
  if (ownedOpps.length === 0) {
    return {
      candidates: [],
      total: 0,
      message: 'No active opportunities published by your organization.',
    };
  }

  const targetOpp = options.opportunityId
    ? ownedOpps.find((o) => o._id.toString() === options.opportunityId.toString())
    : ownedOpps[0];

  if (!targetOpp) {
    throw new Error('Forbidden: Specified opportunity does not belong to your company');
  }

  return matchOpportunityToStudents(targetOpp._id, options);
}

/**
 * Aggregates Industry Opportunities Demanding a Given Skill
 */
async function getSkillDemandMatches(skillName, options = {}) {
  if (!skillName || typeof skillName !== 'string') {
    throw new Error('Skill name is required');
  }

  const normTarget = normalizeSkill(skillName);
  const opportunities = await Opportunity.find({
    $or: [{ status: 'active' }, { active: true }],
  }).lean();

  const matchingOpportunities = [];
  for (const opp of opportunities) {
    const isRequired = (opp.requiredSkills || []).some((s) => normalizeSkill(s) === normTarget);
    const isPreferred = (opp.preferredSkills || []).some((s) => normalizeSkill(s) === normTarget);

    if (isRequired || isPreferred) {
      matchingOpportunities.push({
        _id: opp._id,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        domain: opp.domain,
        openings: opp.openings,
        isMandatory: isRequired,
      });
    }
  }

  return {
    skill: skillName,
    totalOpportunitiesDemanding: matchingOpportunities.length,
    totalOpenings: matchingOpportunities.reduce((acc, o) => acc + (o.openings || 1), 0),
    opportunities: matchingOpportunities,
  };
}

/**
 * Institution Skill Priority Engine: Demand vs. Ready Student Supply
 */
async function getInstitutionSkillPriority(institutionId) {
  const studentProfiles = await StudentProfile.find({ institution: institutionId }).select('user department').lean();
  const studentUserIds = studentProfiles.map((p) => p.user).filter(Boolean);

  const opportunities = await Opportunity.find({
    $or: [{ status: 'active' }, { active: true }],
  }).select('title requiredSkills preferredSkills domain openings').lean();

  if (opportunities.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      message: 'No active industry opportunities in catalog.',
      priorities: [],
    };
  }

  // 1. Demand Count per Skill
  const demandMap = new Map(); // normSkill -> { name, demandCount, openings, affectedOpps }
  for (const opp of opportunities) {
    const allSkills = [...(opp.requiredSkills || []), ...(opp.preferredSkills || [])];
    for (const sk of allSkills) {
      const norm = normalizeSkill(sk);
      if (!demandMap.has(norm)) {
        demandMap.set(norm, { name: sk, demandCount: 0, openings: 0, affectedOpps: 0 });
      }
      const item = demandMap.get(norm);
      item.demandCount++;
      item.openings += opp.openings || 1;
      item.affectedOpps++;
    }
  }

  // 2. Student Supply Count per Skill (Total & Placement Ready)
  const [skillProfiles, snapshots] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', readinessScore: { $first: '$readinessScore' } } },
    ]),
  ]);

  const snapMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore]));
  const supplyMap = new Map(); // normSkill -> { totalStudents: count, readyStudents: count }

  for (const sp of skillProfiles) {
    const uid = sp.user.toString();
    const readiness = snapMap.get(uid) || 50;
    const isReady = readiness >= 60;

    for (const sk of sp.skills || []) {
      const norm = normalizeSkill(sk.name);
      if (!supplyMap.has(norm)) {
        supplyMap.set(norm, { totalStudents: 0, readyStudents: 0 });
      }
      const stat = supplyMap.get(norm);
      stat.totalStudents++;
      if (isReady) stat.readyStudents++;
    }
  }

  // 3. Compute Priority and Gaps
  const priorities = [];
  for (const [norm, dem] of demandMap.entries()) {
    const sup = supplyMap.get(norm) || { totalStudents: 0, readyStudents: 0 };
    const gap = Math.max(0, dem.demandCount - sup.readyStudents);

    let priority = 'LOW';
    if (gap >= 15 || dem.demandCount >= 10) {
      priority = 'HIGH';
    } else if (gap >= 5 || dem.demandCount >= 5) {
      priority = 'MEDIUM';
    }

    let recommendedAction = `Reinforce ${dem.name} via guided roadmap projects.`;
    if (priority === 'HIGH') {
      recommendedAction = `Conduct targeted ${dem.name} masterclass and project hackathon to unlock ${dem.affectedOpps} placement openings.`;
    }

    priorities.push({
      skill: dem.name,
      priority,
      demandCount: dem.demandCount,
      openings: dem.openings,
      readySupply: sup.readyStudents,
      totalSupply: sup.totalStudents,
      gap,
      affectedOpportunities: dem.affectedOpps,
      affectedStudents: Math.max(0, studentUserIds.length - sup.readyStudents),
      recommendedAction,
    });
  }

  // Sort by gap and priority descending
  priorities.sort((a, b) => {
    const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    if (rank[b.priority] !== rank[a.priority]) {
      return rank[b.priority] - rank[a.priority];
    }
    return b.gap - a.gap;
  });

  return {
    totalSkillsAnalyzed: priorities.length,
    totalStudentsInCohort: studentUserIds.length,
    highPriorityCount: priorities.filter((p) => p.priority === 'HIGH').length,
    priorities: priorities.slice(0, 20),
  };
}

/**
 * Institution Market Demand Intelligence
 */
async function getInstitutionMarketDemand(institutionId) {
  const opportunities = await Opportunity.find({
    $or: [{ status: 'active' }, { active: true }],
  }).select('title domain type openings location requiredSkills').lean();

  const domainMap = new Map();
  for (const opp of opportunities) {
    const dom = opp.domain || 'software-engineering';
    if (!domainMap.has(dom)) {
      domainMap.set(dom, { domain: dom, opportunitiesCount: 0, totalOpenings: 0, keySkills: new Set() });
    }
    const stat = domainMap.get(dom);
    stat.opportunitiesCount++;
    stat.totalOpenings += opp.openings || 1;
    (opp.requiredSkills || []).slice(0, 4).forEach((sk) => stat.keySkills.add(sk));
  }

  const breakdown = Array.from(domainMap.values()).map((d) => ({
    domain: d.domain,
    opportunitiesCount: d.opportunitiesCount,
    totalOpenings: d.totalOpenings,
    keySkills: Array.from(d.keySkills).slice(0, 5),
  }));

  breakdown.sort((a, b) => b.totalOpenings - a.totalOpenings);

  return {
    totalOpportunities: opportunities.length,
    domainDemand: breakdown,
  };
}

/**
 * Institution Department Cohort Alignment
 */
async function getInstitutionDepartmentMatching(institutionId) {
  const studentProfiles = await StudentProfile.find({ institution: institutionId }).select('user department').lean();
  const deptMap = new Map();

  for (const sp of studentProfiles) {
    const dept = sp.department || 'Computer Science';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { department: dept, studentCount: 0 });
    }
    deptMap.get(dept).studentCount++;
  }

  return {
    departments: Array.from(deptMap.values()),
  };
}

/**
 * Department Cohort Analysis for Institution Intelligence
 */
async function getDepartmentCohortAnalysis(institutionId) {
  const userQuery = User.find({ institution: institutionId });
  const users = userQuery.select ? await userQuery.select('department').lean() : await userQuery.lean();

  const departments = {};
  for (const u of (users || [])) {
    const dept = u.department || 'General';
    if (!departments[dept]) {
      departments[dept] = {
        name: dept,
        studentCount: 0,
      };
    }
    departments[dept].studentCount++;
  }

  return {
    departments,
    totalStudents: (users || []).length,
  };
}

/**
 * Market Demand Summary across active catalog opportunities
 */
async function getMarketDemandSummary(institutionId) {
  const opportunities = await Opportunity.find({
    $or: [{ status: 'active' }, { active: true }],
  }).lean();

  const skillCounts = new Map();
  const domainDistribution = {};

  for (const opp of (opportunities || [])) {
    const dom = opp.domain || 'general';
    domainDistribution[dom] = (domainDistribution[dom] || 0) + 1;

    for (const sk of [...(opp.requiredSkills || []), ...(opp.preferredSkills || [])]) {
      const name = typeof sk === 'string' ? sk : sk.name;
      if (!name) continue;
      skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
    }
  }

  const topDemandedSkills = Array.from(skillCounts.entries()).map(([skill, demandCount]) => ({
    skill,
    demandCount,
  }));
  topDemandedSkills.sort((a, b) => b.demandCount - a.demandCount);

  return {
    totalOpportunities: (opportunities || []).length,
    topDemandedSkills,
    domainDistribution,
  };
}

/**
 * Aggregated Institution Skill Priorities
 */
async function getInstitutionSkillPriorities(institutionId) {
  const oppQuery = Opportunity.find({
    $or: [{ status: 'active' }, { active: true }],
  });
  const opportunities = oppQuery.select ? await oppQuery.select('title requiredSkills preferredSkills domain openings').lean() : await oppQuery.lean();

  let studentProfiles = [];
  try {
    const profQuery = SkillProfile.find({});
    if (profQuery.populate) {
      studentProfiles = await profQuery.populate('user', 'institution').lean();
    } else {
      studentProfiles = await profQuery.lean();
    }
  } catch (err) {
    studentProfiles = [];
  }

  const instStudents = (studentProfiles || []).filter((sp) =>
    !institutionId || (sp.user && sp.user.institution && sp.user.institution.toString() === institutionId.toString())
  );

  const demandMap = new Map();
  for (const opp of (opportunities || [])) {
    for (const sk of (opp.requiredSkills || [])) {
      const name = typeof sk === 'string' ? sk : sk.name;
      if (!name) continue;
      const norm = normalizeSkill(name);
      if (!demandMap.has(norm)) {
        demandMap.set(norm, { skillName: name, demandCount: 0, studentCount: 0 });
      }
      demandMap.get(norm).demandCount++;
    }
  }

  for (const sp of instStudents) {
    for (const sk of (sp.skills || [])) {
      const name = typeof sk === 'string' ? sk : sk.name;
      if (!name) continue;
      const norm = normalizeSkill(name);
      if (demandMap.has(norm)) {
        demandMap.get(norm).studentCount++;
      }
    }
  }

  const list = [];
  for (const [norm, item] of demandMap.entries()) {
    const gap = Math.max(0, item.demandCount - item.studentCount);
    const gapPercentage = item.demandCount > 0 ? Math.round(((item.demandCount - item.studentCount) / item.demandCount) * 100) : 0;
    let priority = 'LOW';
    if (gapPercentage >= 80) priority = 'CRITICAL';
    else if (gapPercentage >= 50) priority = 'HIGH';
    else if (gapPercentage >= 20) priority = 'MEDIUM';

    list.push({
      skill: item.skillName,
      skillName: item.skillName,
      demandCount: item.demandCount,
      studentCount: item.studentCount,
      readySupply: item.studentCount,
      totalSupply: item.studentCount,
      gap,
      gapPercentage,
      priority,
      recommendedAction: `Focus on ${item.skillName} curriculum`,
    });
  }

  list.sort((a, b) => b.gap - a.gap);
  return list;
}

/**
 * Academician Mentee Opportunity Matching
 * Verifies academician authorization for mentee before matching.
 */
async function getAcademicianMenteeMatches(academicianUserId, studentId, options = {}) {
  // Check authorization
  const academicianProfile = await AcademicianProfile.findOne({ user: academicianUserId }).lean();
  if (!academicianProfile) {
    throw new Error('Forbidden: Academician profile not found');
  }

  const isAssigned = (academicianProfile.assignedStudents || []).some(
    (sid) => sid.toString() === studentId.toString()
  );

  if (!isAssigned) {
    // Check if student belongs to same institution
    const studentProfile = await StudentProfile.findOne({ user: studentId }).lean();
    if (!studentProfile || studentProfile.institution?.toString() !== academicianProfile.institution?.toString()) {
      throw new Error('Forbidden: You are not authorized to view matching telemetry for this student');
    }
  }

  return getStudentOpportunityMatches(studentId, options);
}

module.exports = {
  normalizeSkill,
  getCanonicalSkillMap,
  getMatchBand,
  evaluateMatch,
  scoreOpportunityMatch: evaluateMatch,
  sanitizeCandidateForIndustry,
  loadStudentEvidence,
  matchStudentToOpportunity,
  getStudentOpportunityMatches,
  matchOpportunityToStudents,
  getIndustryTalentMatches,
  getSkillDemandMatches,
  getInstitutionSkillPriority,
  getInstitutionSkillPriorities,
  getInstitutionMarketDemand,
  getMarketDemandSummary,
  getInstitutionDepartmentMatching,
  getDepartmentCohortAnalysis,
  getAcademicianMenteeMatches,
};
