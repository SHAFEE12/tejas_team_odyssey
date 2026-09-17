/**
 * industry.service.js
 *
 * Core service layer for Industry Partner Portal.
 * Handles company profile, ownership-isolated opportunity management,
 * canonical skill validation, server-side talent search, candidate 360 dossiers,
 * and applicant recruitment pipeline transitions.
 */

'use strict';

const mongoose = require('mongoose');
const Industry = require('../models/Industry');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const StudentProfile = require('../models/StudentProfile');
const SkillProfile = require('../models/SkillProfile');
const Skill = require('../models/Skill');
const Project = require('../models/Project');
const GitHubProfile = require('../models/GitHubProfile');
const Resume = require('../models/Resume');
const DSAProfile = require('../models/DSAProfile');
const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');
const CareerScoreSnapshot = require('../models/CareerScoreSnapshot');

const { evaluateCandidateMatch, normalizeSkill } = require('./candidateMatching.service');

/**
 * Validate that skills exist in canonical Skill taxonomy.
 * If canonical skill matches case-insensitively or by alias, normalizes to canonical name.
 * Rejects arbitrary or non-existent skills if taxonomy check fails.
 */
async function validateAndNormalizeCanonicalSkills(skillNames = []) {
  if (!Array.isArray(skillNames) || skillNames.length === 0) return [];

  const cleaned = skillNames.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  if (cleaned.length === 0) return [];

  const canonicalSkills = await Skill.find({}).lean();
  const normalizedMap = new Map(); // normalized -> canonical name

  for (const sk of canonicalSkills) {
    normalizedMap.set(normalizeSkill(sk.name), sk.name);
    normalizedMap.set(normalizeSkill(sk.skillId), sk.name);
    for (const alias of sk.aliases || []) {
      normalizedMap.set(normalizeSkill(alias), sk.name);
    }
  }

  const validCanonicalSkills = [];
  const unrecognized = [];

  for (const skill of cleaned) {
    const norm = normalizeSkill(skill);
    if (normalizedMap.has(norm)) {
      validCanonicalSkills.push(normalizedMap.get(norm));
    } else {
      unrecognized.push(skill);
    }
  }

  // If DB has canonical skills and some skills are unrecognized, throw informative validation error
  if (canonicalSkills.length > 0 && unrecognized.length > 0) {
    // Provide suggestions where possible
    throw new Error(
      `Unrecognized skill(s): "${unrecognized.join(', ')}". Skills must reference the canonical Career Odyssey skill taxonomy.`
    );
  }

  // Deduplicate
  return Array.from(new Set(validCanonicalSkills.length > 0 ? validCanonicalSkills : cleaned));
}

/**
 * Resolve or initialize Industry record for authenticated industry user.
 */
async function resolveUserIndustry(user) {
  if (user.industry) {
    const ind = await Industry.findById(user.industry);
    if (ind) return ind;
  }

  let ind = await Industry.findOne({ adminUser: user._id });
  if (!ind) {
    const compName = user.collegeName || `${user.name} Technologies`;
    ind = await Industry.findOne({ companyName: compName });
    if (!ind) {
      ind = await Industry.create({
        companyName: compName,
        companyCode: `IND-${Math.floor(1000 + Math.random() * 9000)}`,
        website: 'https://example.com',
        domain: 'Technology',
        industryType: 'Technology',
        companySize: '51-200',
        location: 'Bengaluru, India',
        description: 'Pioneering technology partner within Career Odyssey engineering ecosystem.',
        adminUser: user._id,
        verified: true,
        isActive: true,
      });
    } else if (!ind.adminUser) {
      ind.adminUser = user._id;
      await ind.save();
    }
  }

  if (!user.industry || user.industry.toString() !== ind._id.toString()) {
    await User.findByIdAndUpdate(user._id, { industry: ind._id });
  }

  return ind;
}

/**
 * Get Industry Partner Profile
 */
async function getIndustryProfile(industryId) {
  const profile = await Industry.findById(industryId).lean();
  if (!profile) {
    throw new Error('Industry partner profile not found');
  }
  return profile;
}

/**
 * Update Industry Partner Profile
 */
async function updateIndustryProfile(industryId, updateData = {}) {
  const allowed = [
    'companyName',
    'website',
    'industryType',
    'companySize',
    'location',
    'headquarters',
    'description',
    'domain',
    'companyCode',
  ];

  const patch = {};
  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      if (typeof updateData[key] === 'string') {
        patch[key] = updateData[key].trim().slice(0, 1000);
      } else {
        patch[key] = updateData[key];
      }
    }
  }

  const updated = await Industry.findByIdAndUpdate(industryId, patch, {
    new: true,
    runValidators: true,
  }).lean();

  return updated;
}

/**
 * Industry Partner Executive Dashboard Overview KPIs
 */
async function getDashboardOverview(industryId) {
  const [industry, opportunities] = await Promise.all([
    Industry.findById(industryId).lean(),
    Opportunity.find({ industry: industryId }).lean(),
  ]);

  const activeOpportunities = opportunities.filter((o) => o.status === 'active' || (o.status !== 'closed' && o.active));
  const opportunityIds = opportunities.map((o) => o._id);

  const [totalCandidatesCount, applications] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    opportunityIds.length > 0
      ? Application.find({ opportunity: { $in: opportunityIds } }).lean()
      : Promise.resolve([]),
  ]);

  if (opportunities.length === 0 && applications.length === 0) {
    return {
      company: industry ? { name: industry.companyName, domain: industry.domain } : null,
      status: 'INSUFFICIENT_DATA',
      message: 'Insufficient hiring data. Post your first opportunity to begin talent acquisition.',
      metrics: {
        activeOpportunities: 0,
        totalOpportunities: 0,
        totalCandidates: totalCandidatesCount,
        shortlisted: 0,
        interviews: 0,
        offers: 0,
        hiringConversion: 0,
      },
      recentApplications: [],
      activeOpportunitiesList: [],
    };
  }

  const shortlistedCount = applications.filter((a) => ['PLANNING', 'APPLIED', 'OA'].includes(a.status)).length;
  const interviewsCount = applications.filter((a) => ['INTERVIEW', 'FINAL_ROUND'].includes(a.status)).length;
  const offersCount = applications.filter((a) => a.status === 'OFFER').length;
  const totalConsidered = applications.length;

  const hiringConversion = totalConsidered > 0
    ? Number(((offersCount / totalConsidered) * 100).toFixed(1))
    : 0;

  return {
    company: industry ? { name: industry.companyName, domain: industry.domain } : null,
    metrics: {
      activeOpportunities: activeOpportunities.length,
      totalOpportunities: opportunities.length,
      totalCandidates: totalCandidatesCount,
      shortlisted: shortlistedCount,
      interviews: interviewsCount,
      offers: offersCount,
      hiringConversion,
    },
    activeOpportunitiesList: activeOpportunities.slice(0, 5).map((o) => ({
      _id: o._id,
      title: o.title,
      type: o.type,
      domain: o.domain,
      location: o.location,
      openings: o.openings,
      deadline: o.deadline,
    })),
  };
}

/**
 * Create a new Job/Internship Opportunity with Canonical Skill Enforcement
 */
async function createOpportunity(industryId, userId, payload = {}) {
  const {
    title,
    type,
    domain,
    location,
    workMode = 'remote',
    experienceLevel = 'entry',
    stipend = 'Not disclosed',
    requiredSkills = [],
    preferredSkills = [],
    description,
    responsibilities = [],
    qualifications = [],
    duration,
    openings = 1,
    deadline,
    tags = [],
    status = 'active',
  } = payload;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Opportunity title is required');
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Opportunity description is required');
  }
  if (!type || typeof type !== 'string') {
    throw new Error('Opportunity type (e.g. internship, full-time) is required');
  }
  if (!domain || typeof domain !== 'string') {
    throw new Error('Opportunity domain is required');
  }

  const industry = await Industry.findById(industryId).lean();
  if (!industry) {
    throw new Error('Forbidden: Industry entity not found');
  }

  // Validate canonical skills
  const validatedReq = await validateAndNormalizeCanonicalSkills(requiredSkills);
  const validatedPref = await validateAndNormalizeCanonicalSkills(preferredSkills);

  const numOpenings = Number(openings);
  if (isNaN(numOpenings) || numOpenings < 1 || numOpenings > 500) {
    throw new Error('Openings must be a positive number between 1 and 500');
  }

  const opp = await Opportunity.create({
    industry: industryId,
    createdBy: userId,
    company: industry.companyName,
    title: title.trim().slice(0, 200),
    type: type.toLowerCase(),
    domain: domain.toLowerCase(),
    location: (location || industry.location || 'Remote').trim().slice(0, 150),
    remote: workMode === 'remote',
    workMode,
    experienceLevel,
    stipend: (stipend || 'Competitive').trim().slice(0, 100),
    requiredSkills: validatedReq,
    preferredSkills: validatedPref,
    description: description.trim().slice(0, 5000),
    responsibilities: Array.isArray(responsibilities)
      ? responsibilities.map((r) => String(r).trim().slice(0, 300)).filter(Boolean)
      : [],
    qualifications: Array.isArray(qualifications)
      ? qualifications.map((q) => String(q).trim().slice(0, 300)).filter(Boolean)
      : [],
    duration: duration ? String(duration).trim().slice(0, 50) : null,
    openings: numOpenings,
    deadline: deadline ? new Date(deadline) : null,
    tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().slice(0, 50)).filter(Boolean) : [],
    status: (status || 'active').toLowerCase(),
    active: (status || 'active').toLowerCase() === 'active',
    isDemo: false,
  });

  return opp;
}

/**
 * List opportunities owned by this Industry partner
 */
async function getIndustryOpportunities(industryId, query = {}) {
  const filter = { industry: industryId };
  if (query.status) {
    filter.status = query.status;
  }
  if (query.domain) {
    filter.domain = query.domain;
  }

  const opportunities = await Opportunity.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  // Attach applicant counts for each opportunity
  const oppIds = opportunities.map((o) => o._id);
  const appCounts = await Application.aggregate([
    { $match: { opportunity: { $in: oppIds } } },
    { $group: { _id: '$opportunity', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(appCounts.map((a) => [a._id.toString(), a.count]));

  return opportunities.map((opp) => ({
    ...opp,
    applicantsCount: countMap.get(opp._id.toString()) || 0,
  }));
}

/**
 * Get single owned opportunity by ID
 */
async function getOpportunityById(industryId, opportunityId) {
  const opp = await Opportunity.findOne({ _id: opportunityId, industry: industryId }).lean();
  if (!opp) {
    throw new Error('Opportunity not found or does not belong to your company');
  }
  return opp;
}

/**
 * Update an owned Opportunity with Canonical Skill Enforcement
 */
async function updateOpportunity(industryId, opportunityId, updateData = {}) {
  const opp = await Opportunity.findOne({ _id: opportunityId, industry: industryId });
  if (!opp) {
    throw new Error('Forbidden: Opportunity not found or does not belong to your company');
  }

  const allowedFields = [
    'title',
    'type',
    'domain',
    'location',
    'workMode',
    'experienceLevel',
    'stipend',
    'requiredSkills',
    'preferredSkills',
    'description',
    'responsibilities',
    'qualifications',
    'duration',
    'openings',
    'deadline',
    'tags',
    'status',
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'requiredSkills') {
        opp.requiredSkills = await validateAndNormalizeCanonicalSkills(updateData.requiredSkills);
      } else if (field === 'preferredSkills') {
        opp.preferredSkills = await validateAndNormalizeCanonicalSkills(updateData.preferredSkills);
      } else if (field === 'status') {
        const normStatus = String(updateData.status).toLowerCase();
        opp.status = normStatus;
        opp.active = normStatus === 'active';
      } else if (field === 'openings') {
        opp.openings = Math.max(1, Number(updateData.openings) || 1);
      } else {
        opp[field] = updateData[field];
      }
    }
  }

  await opp.save();
  return opp;
}

/**
 * Close or deactivate an owned Opportunity
 */
async function deleteOpportunity(industryId, opportunityId) {
  const opp = await Opportunity.findOne({ _id: opportunityId, industry: industryId });
  if (!opp) {
    throw new Error('Forbidden: Opportunity not found or does not belong to your company');
  }

  opp.status = 'closed';
  opp.active = false;
  await opp.save();

  return { success: true, message: 'Opportunity closed successfully' };
}

/**
 * Server-Side Talent Search with Multi-Criteria Filtering & Deterministic Match Scores
 */
async function searchTalent(industryId, filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 10));
  const skip = (page - 1) * limit;

  // 1. Build Student Profile Query
  const studentProfileFilter = {};
  if (filters.department) {
    studentProfileFilter.department = { $regex: filters.department.trim(), $options: 'i' };
  }
  if (filters.graduationYear) {
    studentProfileFilter.graduationYear = Number(filters.graduationYear);
  }

  // 2. Fetch candidate students
  const studentProfiles = await StudentProfile.find(studentProfileFilter)
    .populate('user', 'name email avatar isActive')
    .populate('institution', 'name code')
    .lean();

  const validProfiles = studentProfiles.filter((p) => p.user && p.user.isActive !== false);
  const studentUserIds = validProfiles.map((p) => p.user._id);

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

  // 3. Load career intelligence components
  const [skillProfiles, projects, githubProfiles, resumes, dsaProfiles, snapshots] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    Project.find({ user: { $in: studentUserIds } }).select('user title techStack skills verified githubUrl liveUrl').lean(),
    GitHubProfile.find({ user: { $in: studentUserIds } }).select('user username connected publicRepos totalStars languages').lean(),
    Resume.find({ user: { $in: studentUserIds } }).select('user parsedSkills summary experienceYears skills').lean(),
    DSAProfile.find({ user: { $in: studentUserIds } }).select('user totalSolved easySolved mediumSolved hardSolved').lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$user', readinessScore: { $first: '$readinessScore' } } },
    ]),
  ]);

  const skillMap = new Map(skillProfiles.map((s) => [s.user.toString(), s]));
  const projectMap = new Map();
  for (const p of projects) {
    const uid = p.user.toString();
    if (!projectMap.has(uid)) projectMap.set(uid, []);
    projectMap.get(uid).push(p);
  }
  const githubMap = new Map(githubProfiles.map((g) => [g.user.toString(), g]));
  const resumeMap = new Map(resumes.map((r) => [r.user.toString(), r]));
  const dsaMap = new Map(dsaProfiles.map((d) => [d.user.toString(), d]));
  const snapshotMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore]));

  // If matching against a specific owned opportunity
  let opportunityReqs = null;
  if (filters.opportunityId && mongoose.Types.ObjectId.isValid(filters.opportunityId)) {
    const opp = await Opportunity.findOne({ _id: filters.opportunityId, industry: industryId }).lean();
    if (opp) {
      opportunityReqs = {
        requiredSkills: opp.requiredSkills,
        preferredSkills: opp.preferredSkills,
        title: opp.title,
        domain: opp.domain,
      };
    }
  }

  // 4. Assemble Recruiter-Safe Candidate Cards
  const candidates = [];

  for (const profile of validProfiles) {
    const uid = profile.user._id.toString();
    const skProfile = skillMap.get(uid) || { skills: [], targetRole: '' };
    const userProjects = projectMap.get(uid) || [];
    const gh = githubMap.get(uid) || null;
    const res = resumeMap.get(uid) || null;
    const dsa = dsaMap.get(uid) || null;
    const readinessScore = snapshotMap.get(uid) ?? 50;

    // Filter: minimum readiness
    if (filters.minReadiness && readinessScore < Number(filters.minReadiness)) {
      continue;
    }

    // Filter: target role
    if (filters.targetRole && skProfile.targetRole) {
      const tr = skProfile.targetRole.toLowerCase();
      if (!tr.includes(filters.targetRole.trim().toLowerCase())) {
        continue;
      }
    }

    // Filter: skills required in search
    if (filters.skills) {
      const querySkills = Array.isArray(filters.skills)
        ? filters.skills
        : filters.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

      const candidateSkills = (skProfile.skills || []).map((s) => s.name.toLowerCase());
      const hasAll = querySkills.every((qs) => candidateSkills.some((cs) => cs.includes(qs)));
      if (!hasAll) continue;
    }

    // Filter: has projects
    if (filters.hasProjects === 'true' && userProjects.length === 0) {
      continue;
    }

    // Filter: has GitHub
    if (filters.hasGithub === 'true' && (!gh || (!gh.connected && !gh.username))) {
      continue;
    }

    // Filter: has Resume
    if (filters.hasResume === 'true' && !res) {
      continue;
    }

    // Compute deterministic match score if opportunity is bound
    let matchEvaluation = null;
    if (opportunityReqs) {
      matchEvaluation = evaluateCandidateMatch(
        {
          skills: skProfile.skills,
          targetRole: skProfile.targetRole,
          projects: userProjects,
          resume: res,
          githubProfile: gh,
          careerReadinessScore: readinessScore,
          dsaProfile: dsa,
        },
        opportunityReqs
      );
    }

    candidates.push({
      studentId: profile.user._id,
      name: profile.user.name,
      department: profile.department,
      institutionName: profile.institution ? profile.institution.name : 'University Engineering Partner',
      graduationYear: profile.graduationYear,
      cgpa: profile.cgpa,
      targetRole: skProfile.targetRole || 'Software Engineering',
      careerReadinessScore: readinessScore,
      skills: (skProfile.skills || []).slice(0, 10).map((s) => ({ name: s.name, level: s.level })),
      evidenceSummary: {
        projectCount: userProjects.length,
        githubConnected: !!(gh && (gh.connected || gh.username)),
        resumeAvailable: !!res,
        dsaSolved: dsa ? dsa.totalSolved : 0,
      },
      matchEvaluation: matchEvaluation
        ? {
            matchScore: matchEvaluation.matchScore,
            matchBand: matchEvaluation.matchBand,
            matchedSkills: matchEvaluation.matchedSkills,
            missingSkills: matchEvaluation.missingSkills,
            reasons: matchEvaluation.reasons.slice(0, 2),
          }
        : null,
    });
  }

  // Sort by matchScore descending if available, else by readinessScore
  if (opportunityReqs) {
    candidates.sort((a, b) => (b.matchEvaluation?.matchScore || 0) - (a.matchEvaluation?.matchScore || 0));
  } else {
    candidates.sort((a, b) => b.careerReadinessScore - a.careerReadinessScore);
  }

  const paginatedCandidates = candidates.slice(skip, skip + limit);

  return {
    candidates: paginatedCandidates,
    total: candidates.length,
    page,
    limit,
    totalPages: Math.ceil(candidates.length / limit),
  };
}

/**
 * Recruiter-Safe Candidate 360° View
 * Strict privacy: NO raw resume file paths, NO unauthenticated file downloads,
 * NO passwords, JWTs, private student settings, or academician private notes.
 */
async function getCandidate360(studentUserId, opportunityId = null, industryId = null) {
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

  if (!studentUser) {
    throw new Error('Candidate student record not found');
  }

  // Opportunity match calculation if provided
  let matchEvaluation = null;
  if (opportunityId && mongoose.Types.ObjectId.isValid(opportunityId)) {
    const oppQuery = industryId
      ? { _id: opportunityId, industry: industryId }
      : { _id: opportunityId };
    const opp = await Opportunity.findOne(oppQuery).lean();
    if (opp) {
      matchEvaluation = evaluateCandidateMatch(
        {
          skills: skillProfile ? skillProfile.skills : [],
          targetRole: skillProfile ? skillProfile.targetRole : '',
          projects: projects || [],
          resume,
          githubProfile: ghProfile,
          careerReadinessScore: snapshot ? snapshot.readinessScore : 50,
          dsaProfile: dsa,
        },
        {
          requiredSkills: opp.requiredSkills,
          preferredSkills: opp.preferredSkills,
          title: opp.title,
          domain: opp.domain,
        }
      );
    }
  }

  return {
    candidate: {
      _id: studentUser._id,
      name: studentUser.name,
      avatar: studentUser.avatar,
      department: studentProfile?.department || 'Computer Science',
      institution: studentProfile?.institution ? studentProfile.institution.name : 'Engineering Partner Institution',
      graduationYear: studentProfile?.graduationYear || 2026,
      cgpa: studentProfile?.cgpa || 0,
      targetRole: skillProfile?.targetRole || 'Software Engineering',
      targetIndustry: skillProfile?.targetIndustry || 'Technology',
    },
    careerReadiness: {
      score: snapshot ? snapshot.readinessScore : 50,
      label: snapshot?.readinessBand || 'PROGRESSING',
    },
    skills: (skillProfile?.skills || []).map((s) => ({
      name: s.name,
      level: s.level,
      yearsOfExperience: s.yearsOfExperience,
      evidenceStatus: 'SELF-REPORTED',
    })),
    projects: (projects || []).map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      techStack: p.techStack || p.skills || [],
      githubUrl: p.githubUrl || null,
      liveUrl: p.liveUrl || null,
      verified: !!p.verified,
      evidenceStatus: p.verified ? 'VERIFIED' : p.githubUrl ? 'CONNECTED' : 'SELF-REPORTED',
    })),
    github: ghProfile && (ghProfile.connected || ghProfile.username)
      ? {
          username: ghProfile.username,
          publicRepos: ghProfile.publicRepos || 0,
          totalStars: ghProfile.totalStars || 0,
          languages: ghProfile.languages || [],
          evidenceStatus: 'CONNECTED',
        }
      : { evidenceStatus: 'EVIDENCE_MISSING' },
    resumeParsed: resume
      ? {
          summary: resume.summary || 'Resume analyzed and parsed.',
          extractedSkills: resume.parsedSkills || resume.skills || [],
          experienceYears: resume.experienceYears || 0,
          evidenceStatus: 'VERIFIED',
        }
      : { evidenceStatus: 'EVIDENCE_MISSING' },
    dsa: dsa
      ? {
          totalSolved: dsa.totalSolved || 0,
          easy: dsa.easySolved || 0,
          medium: dsa.mediumSolved || 0,
          hard: dsa.hardSolved || 0,
          evidenceStatus: 'CONNECTED',
        }
      : { evidenceStatus: 'EVIDENCE_MISSING' },
    matchEvaluation,
  };
}

/**
 * Get applicants for an owned Opportunity
 */
async function getOpportunityApplicants(industryId, opportunityId) {
  const opp = await Opportunity.findOne({ _id: opportunityId, industry: industryId }).lean();
  if (!opp) {
    throw new Error('Forbidden: Opportunity not found or does not belong to your company');
  }

  const applications = await Application.find({ opportunity: opportunityId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  const userIds = applications.map((a) => a.user?._id).filter(Boolean);
  const studentProfiles = await StudentProfile.find({ user: { $in: userIds } })
    .select('user department graduationYear cgpa')
    .lean();

  const profMap = new Map(studentProfiles.map((p) => [p.user.toString(), p]));

  // Categorize pipeline
  const pipeline = {
    APPLIED: [],
    OA: [],
    INTERVIEW: [],
    FINAL_ROUND: [],
    OFFER: [],
    REJECTED: [],
  };

  for (const app of applications) {
    if (!app.user) continue;
    const prof = profMap.get(app.user._id.toString()) || {};
    const item = {
      applicationId: app._id,
      studentId: app.user._id,
      name: app.user.name,
      department: prof.department || 'Engineering',
      graduationYear: prof.graduationYear || 2026,
      cgpa: prof.cgpa || 0,
      status: app.status,
      appliedAt: app.appliedAt || app.createdAt,
      recruiterNotes: app.recruiterNotes || '',
      fitScore: app.fitScore || 0,
    };

    if (pipeline[app.status]) {
      pipeline[app.status].push(item);
    } else if (app.status === 'SAVED' || app.status === 'PLANNING') {
      pipeline.APPLIED.push(item);
    }
  }

  return {
    opportunity: {
      _id: opp._id,
      title: opp.title,
      type: opp.type,
      domain: opp.domain,
      openings: opp.openings,
      status: opp.status,
    },
    totalApplicants: applications.length,
    pipeline,
  };
}

/**
 * Shortlist a candidate for an owned Opportunity
 */
async function shortlistCandidate(industryId, opportunityId, studentUserId, notes = '') {
  const opp = await Opportunity.findOne({ _id: opportunityId, industry: industryId });
  if (!opp) {
    throw new Error('Forbidden: Opportunity not found or does not belong to your company');
  }

  let app = await Application.findOne({ user: studentUserId, opportunity: opportunityId });
  if (!app) {
    app = await Application.create({
      user: studentUserId,
      opportunity: opportunityId,
      status: 'OA', // Fast-track directly to OA / shortlisted stage
      appliedAt: new Date(),
      recruiterNotes: notes ? String(notes).trim().slice(0, 2000) : 'Shortlisted by recruiter from talent search.',
    });
  } else {
    // If student was saved or applied, advance them
    if (['SAVED', 'PLANNING', 'APPLIED'].includes(app.status)) {
      app.status = 'OA';
    }
    if (notes) {
      app.recruiterNotes = String(notes).trim().slice(0, 2000);
    }
    await app.save();
  }

  return app;
}

/**
 * Update candidate application stage (OA, INTERVIEW, FINAL_ROUND, OFFER, REJECTED)
 */
async function updateApplicationStage(industryId, applicationId, newStage, recruiterNotes = '') {
  const allowedStages = ['APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED'];
  if (!allowedStages.includes(newStage)) {
    throw new Error(`Invalid recruitment stage: "${newStage}". Allowed: ${allowedStages.join(', ')}`);
  }

  const app = await Application.findById(applicationId).populate('opportunity');
  if (!app || !app.opportunity) {
    throw new Error('Application not found');
  }

  // Ownership verification
  if (!app.opportunity.industry || app.opportunity.industry.toString() !== industryId.toString()) {
    throw new Error('Forbidden: You do not own the opportunity associated with this application');
  }

  app.status = newStage;
  if (recruiterNotes) {
    app.recruiterNotes = String(recruiterNotes).trim().slice(0, 2000);
  }

  if (newStage === 'INTERVIEW' && !app.interviewDate) {
    app.interviewDate = new Date();
  } else if (newStage === 'OFFER' && !app.offerDate) {
    app.offerDate = new Date();
    app.offeredAt = new Date();
  } else if (newStage === 'REJECTED' && !app.rejectedAt) {
    app.rejectedAt = new Date();
  }

  await app.save();
  return app;
}

/**
 * Get aggregated candidate list for a specific stage category (shortlisted, interviews, offers)
 */
async function getAggregatedStageCandidates(industryId, stages = []) {
  const opportunities = await Opportunity.find({ industry: industryId }).select('_id title domain type').lean();
  const oppIds = opportunities.map((o) => o._id);

  if (oppIds.length === 0) return [];

  const applications = await Application.find({
    opportunity: { $in: oppIds },
    status: { $in: stages },
  })
    .populate('user', 'name email avatar')
    .populate('opportunity', 'title domain type openings')
    .sort({ updatedAt: -1 })
    .lean();

  const userIds = applications.map((a) => a.user?._id).filter(Boolean);
  const profiles = await StudentProfile.find({ user: { $in: userIds } })
    .select('user department graduationYear cgpa')
    .lean();
  const profMap = new Map(profiles.map((p) => [p.user.toString(), p]));

  return applications
    .filter((a) => a.user)
    .map((a) => {
      const prof = profMap.get(a.user._id.toString()) || {};
      return {
        applicationId: a._id,
        studentId: a.user._id,
        name: a.user.name,
        department: prof.department || 'Engineering',
        graduationYear: prof.graduationYear || 2026,
        cgpa: prof.cgpa || 0,
        opportunityTitle: a.opportunity?.title || 'Engineering Role',
        opportunityId: a.opportunity?._id,
        status: a.status,
        updatedAt: a.updatedAt,
        recruiterNotes: a.recruiterNotes || '',
      };
    });
}

module.exports = {
  validateAndNormalizeCanonicalSkills,
  resolveUserIndustry,
  getIndustryProfile,
  updateIndustryProfile,
  getDashboardOverview,
  createOpportunity,
  getIndustryOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  searchTalent,
  getCandidate360,
  getOpportunityApplicants,
  shortlistCandidate,
  updateApplicationStage,
  getAggregatedStageCandidates,
};
