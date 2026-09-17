/**
 * institution.service.js
 *
 * Core service layer for Institution Administration & Placement Intelligence.
 * Handles cohort intelligence, dynamic department aggregations, skill gap radar,
 * student supply vs industry demand comparison, faculty workload balancing,
 * placement funnels, and campus hiring drive eligibility evaluation.
 */

const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicianProfile = require('../models/AcademicianProfile');
const SkillProfile = require('../models/SkillProfile');
const Opportunity = require('../models/Opportunity');
const Application = require('../models/Application');
const Project = require('../models/Project');
const HiringDrive = require('../models/HiringDrive');
const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');

/**
 * Get or ensure Institution record for authenticated institution admin user.
 */
async function resolveAdminInstitution(user) {
  if (user.institution) {
    const inst = await Institution.findById(user.institution);
    if (inst) return inst;
  }

  // Look up institution where adminUser is this user
  let inst = await Institution.findOne({ adminUser: user._id });
  if (!inst) {
    // Look up by collegeName or create default institutional record
    const instName = user.collegeName || 'National Institute of Technology';
    inst = await Institution.findOne({ name: instName });
    if (!inst) {
      inst = await Institution.create({
        name: instName,
        code: `INST-${Math.floor(1000 + Math.random() * 9000)}`,
        adminUser: user._id,
        departments: ['Computer Science', 'Electronics & Communication', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Data Science'],
      });
    } else if (!inst.adminUser) {
      inst.adminUser = user._id;
      await inst.save();
    }
  }

  // Cache back onto User
  if (!user.institution || user.institution.toString() !== inst._id.toString()) {
    await User.findByIdAndUpdate(user._id, { institution: inst._id });
  }

  return inst;
}

/**
 * Executive Dashboard Overview Metrics.
 */
async function getDashboardOverview(institutionId) {
  const [studentProfiles, academicians, activeOpportunities, allInstitutionUsers] = await Promise.all([
    StudentProfile.find({ institution: institutionId }).lean(),
    AcademicianProfile.find({ institution: institutionId }).lean(),
    Opportunity.countDocuments({}),
    User.find({ institution: institutionId, role: 'student' }).select('_id').lean(),
  ]);

  // Combine student IDs from both User and StudentProfile for comprehensive coverage
  const studentIdSet = new Set([
    ...studentProfiles.map((p) => p.user.toString()),
    ...allInstitutionUsers.map((u) => u._id.toString()),
  ]);
  const studentUserIds = Array.from(studentIdSet).map((id) => new mongoose.Types.ObjectId(id));

  const totalStudents = studentUserIds.length;
  const totalAcademicians = academicians.length;
  const activeMentors = academicians.filter((a) => a.assignedStudents && a.assignedStudents.length > 0).length;

  let averageCareerReadiness = 0;
  let studentsAtRisk = 0;
  let studentsPlacementReady = 0;

  if (studentUserIds.length > 0) {
    const snapshots = await CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          readinessScore: { $first: '$readinessScore' },
          atRisk: { $first: '$atRisk' },
        },
      },
    ]);

    if (snapshots.length > 0) {
      const sum = snapshots.reduce((acc, s) => acc + (s.readinessScore || 0), 0);
      averageCareerReadiness = Math.round(sum / snapshots.length);
      studentsAtRisk = snapshots.filter((s) => s.atRisk || s.readinessScore < 40).length;
      studentsPlacementReady = snapshots.filter((s) => (s.readinessScore || 0) >= 70).length;
    }
  }

  // Placement stats from Application model
  let totalApplications = 0;
  let totalOffers = 0;
  let conversionRate = 0;

  if (studentUserIds.length > 0) {
    const apps = await Application.find({ user: { $in: studentUserIds } }).select('status').lean();
    totalApplications = apps.length;
    totalOffers = apps.filter((a) => a.status === 'OFFER').length;
    if (totalApplications > 0) {
      conversionRate = Number(((totalOffers / totalApplications) * 100).toFixed(1));
    }
  }

  return {
    totalStudents,
    totalAcademicians,
    activeMentors,
    averageCareerReadiness,
    studentsAtRisk,
    studentsPlacementReady,
    activeOpportunities,
    totalApplications,
    totalOffers,
    conversionRate,
  };
}

/**
 * Student Cohort Directory with multi-criteria filters.
 */
async function getStudentCohort(institutionId, filters = {}) {
  // Find all student profiles in this institution
  const studentProfiles = await StudentProfile.find({ institution: institutionId })
    .populate('user', 'name email avatar registrationNumber collegeName createdAt')
    .populate('assignedMentor', 'name email')
    .lean();

  const studentUserIds = studentProfiles.map((p) => p.user?._id).filter(Boolean);

  const [skillProfiles, snapshots, applications] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          readinessScore: { $first: '$readinessScore' },
        },
      },
    ]),
    Application.find({ user: { $in: studentUserIds } }).select('user status').lean(),
  ]);

  const skillMap = new Map(skillProfiles.map((s) => [s.user.toString(), s]));
  const snapshotMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore || 0]));

  // Build placement status map
  const placementMap = new Map();
  for (const app of applications) {
    const uId = app.user.toString();
    const curr = placementMap.get(uId) || 'NOT_APPLIED';
    if (app.status === 'OFFER') {
      placementMap.set(uId, 'PLACED');
    } else if (['INTERVIEW', 'FINAL_ROUND', 'OA'].includes(app.status) && curr !== 'PLACED') {
      placementMap.set(uId, 'IN_PROCESS');
    } else if (app.status === 'APPLIED' && curr === 'NOT_APPLIED') {
      placementMap.set(uId, 'APPLIED');
    }
  }

  let cohort = studentProfiles
    .filter((sp) => sp.user)
    .map((sp) => {
      const uId = sp.user._id.toString();
      const sk = skillMap.get(uId);
      const readiness = snapshotMap.get(uId) || 50;
      const placementStatus = placementMap.get(uId) || 'NOT_APPLIED';

      return {
        _id: sp.user._id,
        name: sp.user.name,
        email: sp.user.email,
        avatar: sp.user.avatar,
        registrationNumber: sp.user.registrationNumber || sp.rollNumber || 'N/A',
        department: sp.department || 'Computer Science',
        degree: sp.degree || 'B.Tech',
        batch: sp.graduationYear || 2026,
        cgpa: sp.cgpa || 0,
        targetRole: sk?.targetRole || 'Software Engineer',
        skillsCount: sk?.skills ? sk.skills.length : 0,
        readinessScore: readiness,
        placementStatus,
        assignedMentor: sp.assignedMentor ? { name: sp.assignedMentor.name, email: sp.assignedMentor.email } : null,
      };
    });

  // Apply filters
  if (filters.search) {
    const q = filters.search.toLowerCase();
    cohort = cohort.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        s.targetRole.toLowerCase().includes(q)
    );
  }
  if (filters.department) {
    cohort = cohort.filter((s) => s.department.toLowerCase() === filters.department.toLowerCase());
  }
  if (filters.batch) {
    cohort = cohort.filter((s) => s.batch === Number(filters.batch));
  }
  if (filters.careerGoal) {
    cohort = cohort.filter((s) => s.targetRole.toLowerCase().includes(filters.careerGoal.toLowerCase()));
  }
  if (filters.readiness) {
    if (filters.readiness === 'ready') cohort = cohort.filter((s) => s.readinessScore >= 70);
    else if (filters.readiness === 'progressing') cohort = cohort.filter((s) => s.readinessScore >= 40 && s.readinessScore < 70);
    else if (filters.readiness === 'at_risk') cohort = cohort.filter((s) => s.readinessScore < 40);
  }
  if (filters.placementStatus) {
    cohort = cohort.filter((s) => s.placementStatus.toLowerCase() === filters.placementStatus.toLowerCase());
  }

  return cohort;
}

/**
 * Dynamic Department Analytics across all disciplines (CSE, ECE, EE, Mech, Civil, etc.).
 */
async function getDepartmentAnalytics(institutionId) {
  const [inst, studentProfiles] = await Promise.all([
    Institution.findById(institutionId).lean(),
    StudentProfile.find({ institution: institutionId }).lean(),
  ]);

  const studentUserIds = studentProfiles.map((p) => p.user).filter(Boolean);

  const [snapshots, projects, applications] = await Promise.all([
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          readinessScore: { $first: '$readinessScore' },
        },
      },
    ]),
    Project.find({ user: { $in: studentUserIds } }).select('user').lean(),
    Application.find({ user: { $in: studentUserIds } }).select('user status').lean(),
  ]);

  const snapshotMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore || 0]));
  const projectUsers = new Set(projects.map((p) => p.user.toString()));
  const appUsers = new Set(applications.map((a) => a.user.toString()));

  // Group student profiles by department
  const deptMap = new Map();

  // Pre-seed configured departments from Institution model
  const configuredDepts = inst?.departments || [
    'Computer Science', 'Electronics & Communication', 'Electrical Engineering',
    'Mechanical Engineering', 'Civil Engineering', 'Data Science'
  ];
  for (const dept of configuredDepts) {
    deptMap.set(dept, []);
  }

  // Populate profiles
  for (const sp of studentProfiles) {
    const dept = sp.department || 'Computer Science';
    if (!deptMap.has(dept)) {
      deptMap.set(dept, []);
    }
    deptMap.get(dept).push(sp);
  }

  const results = [];
  for (const [dept, profiles] of deptMap.entries()) {
    const count = profiles.length;
    let avgReadiness = 0;
    let atRiskCount = 0;
    let placementReadyCount = 0;
    let projectCoverageCount = 0;
    let activeAppCount = 0;

    if (count > 0) {
      let scoreSum = 0;
      for (const p of profiles) {
        const uId = p.user.toString();
        const score = snapshotMap.get(uId) || 50;
        scoreSum += score;
        if (score < 40) atRiskCount++;
        if (score >= 70) placementReadyCount++;
        if (projectUsers.has(uId)) projectCoverageCount++;
        if (appUsers.has(uId)) activeAppCount++;
      }
      avgReadiness = Math.round(scoreSum / count);
    }

    results.push({
      department: dept,
      studentCount: count,
      averageReadiness: avgReadiness,
      studentsAtRisk: atRiskCount,
      placementReadyStudents: placementReadyCount,
      projectCoverageRate: count > 0 ? Math.round((projectCoverageCount / count) * 100) : 0,
      activeApplicationRate: count > 0 ? Math.round((activeAppCount / count) * 100) : 0,
    });
  }

  return results;
}

/**
 * Skill Gap Intelligence across institution cohorts.
 */
async function getSkillGapIntelligence(institutionId, filters = {}) {
  const profileQuery = { institution: institutionId };
  if (filters.department) {
    profileQuery.department = filters.department;
  }
  if (filters.batch) {
    profileQuery.graduationYear = Number(filters.batch);
  }

  const studentProfiles = await StudentProfile.find(profileQuery).lean();
  const studentUserIds = studentProfiles.map((p) => p.user).filter(Boolean);

  if (studentUserIds.length === 0) {
    return {
      topMissingSkills: [],
      topCoveredSkills: [],
      totalStudentsAnalyzed: 0,
      skillProficiencyDistribution: [],
    };
  }

  const skillProfiles = await SkillProfile.find({ user: { $in: studentUserIds } }).lean();

  // Aggregate student mastered skills
  const masteredSkillCount = new Map();
  const levelCount = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };

  for (const sp of skillProfiles) {
    for (const sk of sp.skills || []) {
      const name = sk.name.trim();
      masteredSkillCount.set(name, (masteredSkillCount.get(name) || 0) + 1);
      const lvl = (sk.level || 'intermediate').toLowerCase();
      if (levelCount[lvl] !== undefined) levelCount[lvl]++;
    }
  }

  // Cross-reference against high-demand industry skills from Opportunities
  const opportunities = await Opportunity.find({}).select('requiredSkills').lean();
  const requiredSkillCount = new Map();
  for (const op of opportunities) {
    for (const rk of op.requiredSkills || []) {
      const name = rk.trim();
      requiredSkillCount.set(name, (requiredSkillCount.get(name) || 0) + 1);
    }
  }

  const total = studentUserIds.length;
  const topMissingSkills = [];
  const topCoveredSkills = [];

  for (const [skill, reqCount] of requiredSkillCount.entries()) {
    const possessed = masteredSkillCount.get(skill) || 0;
    const missingCount = Math.max(0, total - possessed);
    const missingPct = Math.round((missingCount / total) * 100);

    if (missingPct > 20) {
      topMissingSkills.push({
        skill,
        industryDemandCount: reqCount,
        studentsMissing: missingCount,
        missingPercentage: missingPct,
        severity: missingPct >= 60 ? 'HIGH' : missingPct >= 40 ? 'MEDIUM' : 'LOW',
      });
    }
  }

  for (const [skill, count] of masteredSkillCount.entries()) {
    topCoveredSkills.push({
      skill,
      studentCount: count,
      coveragePercentage: Math.round((count / total) * 100),
    });
  }

  topMissingSkills.sort((a, b) => b.missingPercentage - a.missingPercentage);
  topCoveredSkills.sort((a, b) => b.studentCount - a.studentCount);

  return {
    totalStudentsAnalyzed: total,
    topMissingSkills: topMissingSkills.slice(0, 10),
    topCoveredSkills: topCoveredSkills.slice(0, 10),
    skillProficiencyDistribution: [
      { level: 'Beginner', count: levelCount.beginner },
      { level: 'Intermediate', count: levelCount.intermediate },
      { level: 'Advanced', count: levelCount.advanced },
      { level: 'Expert', count: levelCount.expert },
    ],
  };
}

/**
 * Industry Demand vs. Student Supply Intelligence.
 */
async function getIndustryDemandIntelligence(institutionId) {
  const [opportunities, studentProfiles] = await Promise.all([
    Opportunity.find({}).select('title company requiredSkills domain type openings').lean(),
    StudentProfile.find({ institution: institutionId }).select('user department').lean(),
  ]);

  if (opportunities.length === 0) {
    return {
      status: 'NO_DATA',
      message: 'No industry demand data available in the opportunity catalog.',
      comparisons: [],
      domainDemand: [],
    };
  }

  const studentUserIds = studentProfiles.map((p) => p.user).filter(Boolean);

  const [skillProfiles, snapshots] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          readinessScore: { $first: '$readinessScore' },
        },
      },
    ]),
  ]);

  const readyUserSet = new Set(
    snapshots.filter((s) => (s.readinessScore || 0) >= 60).map((s) => s._id.toString())
  );

  // Map students possessing each skill
  const skillCapableUsers = new Map();
  for (const sp of skillProfiles) {
    const uId = sp.user.toString();
    for (const sk of sp.skills || []) {
      const name = sk.name.trim();
      if (!skillCapableUsers.has(name)) skillCapableUsers.set(name, new Set());
      skillCapableUsers.get(name).add(uId);
    }
  }

  // Aggregate industry demand by skill
  const demandMap = new Map();
  const domainMap = new Map();

  for (const op of opportunities) {
    const openings = op.openings || 1;
    const domain = op.domain || 'software-engineering';
    domainMap.set(domain, (domainMap.get(domain) || 0) + openings);

    for (const rk of op.requiredSkills || []) {
      const name = rk.trim();
      demandMap.set(name, (demandMap.get(name) || 0) + openings);
    }
  }

  // Generate comparison records
  const comparisons = [];
  for (const [skill, demand] of demandMap.entries()) {
    const capableUsers = skillCapableUsers.get(skill) || new Set();
    const capableCount = capableUsers.size;

    // Ready users: capable students who also have readiness >= 60
    let readyCount = 0;
    for (const uId of capableUsers) {
      if (readyUserSet.has(uId)) readyCount++;
    }

    const gap = Math.max(0, demand - readyCount);
    const priority = gap >= 15 || demand >= 10 ? 'HIGH' : gap >= 5 ? 'MEDIUM' : 'LOW';

    comparisons.push({
      skill,
      demand,
      capableStudents: capableCount,
      readyStudents: readyCount,
      gap,
      priority,
    });
  }

  comparisons.sort((a, b) => b.demand - a.demand);

  const domainDemand = Array.from(domainMap.entries()).map(([domain, openings]) => ({
    domain,
    openings,
  }));

  return {
    status: 'ACTIVE',
    totalOpportunities: opportunities.length,
    comparisons: comparisons.slice(0, 15),
    domainDemand,
  };
}

/**
 * Faculty & Mentor Workload Management.
 */
async function getFacultyWorkload(institutionId) {
  const academicians = await AcademicianProfile.find({ institution: institutionId })
    .populate('user', 'name email avatar')
    .lean();

  if (academicians.length === 0) {
    return {
      academicians: [],
      averageWorkload: 0,
      totalAssignedStudents: 0,
    };
  }

  let totalAssigned = 0;
  const faculty = academicians.map((a) => {
    const load = a.assignedStudents ? a.assignedStudents.length : 0;
    totalAssigned += load;

    let status = 'NORMAL';
    if (load > 30) status = 'HIGH LOAD';
    else if (load < 10) status = 'UNDERUTILIZED';

    return {
      _id: a._id,
      user: a.user,
      department: a.department || 'Computer Science',
      designation: a.designation || 'Faculty Mentor',
      assignedStudentsCount: load,
      assignedStudents: a.assignedStudents || [],
      workloadStatus: status,
    };
  });

  const avg = Math.round(totalAssigned / academicians.length);

  return {
    academicians: faculty,
    averageWorkload: avg,
    totalAssignedStudents: totalAssigned,
  };
}

/**
 * Assign or reassign a student to a faculty mentor with strict institution bounds.
 */
async function assignOrReassignStudent(institutionId, academicianId, studentId) {
  // Validate academician belongs to this institution
  const academicianProfile = await AcademicianProfile.findOne({
    $or: [{ _id: academicianId }, { user: academicianId }],
    institution: institutionId,
  });
  if (!academicianProfile) {
    throw new Error('Forbidden: Academician not found within your institution');
  }

  // Validate student belongs to this institution
  const studentProfile = await StudentProfile.findOne({
    $or: [{ _id: studentId }, { user: studentId }],
    institution: institutionId,
  });
  if (!studentProfile) {
    throw new Error('Forbidden: Student not found within your institution');
  }

  const studentUserId = studentProfile.user;
  const academicianUserId = academicianProfile.user;

  // Remove student from any previous mentor's assignedStudents
  await AcademicianProfile.updateMany(
    { institution: institutionId, assignedStudents: studentUserId },
    { $pull: { assignedStudents: studentUserId } }
  );

  // Add to target academician's assignedStudents
  await AcademicianProfile.findByIdAndUpdate(academicianProfile._id, {
    $addToSet: { assignedStudents: studentUserId },
  });

  // Update student's assignedMentor
  studentProfile.assignedMentor = academicianUserId;
  await studentProfile.save();

  return {
    success: true,
    message: 'Student assigned to academician successfully',
    studentId: studentUserId,
    academicianId: academicianUserId,
  };
}

/**
 * Unassign a student from an academician.
 */
async function unassignStudent(institutionId, academicianId, studentId) {
  const academicianProfile = await AcademicianProfile.findOne({
    $or: [{ _id: academicianId }, { user: academicianId }],
    institution: institutionId,
  });
  if (!academicianProfile) {
    throw new Error('Forbidden: Academician not found within your institution');
  }

  const studentProfile = await StudentProfile.findOne({
    $or: [{ _id: studentId }, { user: studentId }],
    institution: institutionId,
  });
  if (!studentProfile) {
    throw new Error('Forbidden: Student not found within your institution');
  }

  const studentUserId = studentProfile.user;

  await AcademicianProfile.findByIdAndUpdate(academicianProfile._id, {
    $pull: { assignedStudents: studentUserId },
  });

  if (studentProfile.assignedMentor && studentProfile.assignedMentor.toString() === academicianProfile.user.toString()) {
    studentProfile.assignedMentor = null;
    await studentProfile.save();
  }

  return { success: true, message: 'Student unassigned successfully' };
}

/**
 * Placement Intelligence: Application Funnel & Outcome Conversion.
 */
async function getPlacementIntelligence(institutionId) {
  const studentProfiles = await StudentProfile.find({ institution: institutionId }).select('user department graduationYear').lean();
  const studentUserIds = studentProfiles.map((p) => p.user).filter(Boolean);

  if (studentUserIds.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      message: 'Insufficient outcome data.',
      funnel: { saved: 0, applied: 0, oa: 0, interview: 0, finalRound: 0, offers: 0, rejected: 0 },
      conversionRates: { interviewRate: 0, offerRate: 0 },
      departmentBreakdown: [],
    };
  }

  const applications = await Application.find({ user: { $in: studentUserIds } })
    .populate('opportunity', 'title company domain type')
    .lean();

  if (applications.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      message: 'Insufficient outcome data.',
      funnel: { saved: 0, applied: 0, oa: 0, interview: 0, finalRound: 0, offers: 0, rejected: 0 },
      conversionRates: { interviewRate: 0, offerRate: 0 },
      departmentBreakdown: [],
    };
  }

  const funnel = {
    saved: applications.filter((a) => a.status === 'SAVED').length,
    applied: applications.filter((a) => a.status === 'APPLIED').length,
    oa: applications.filter((a) => a.status === 'OA').length,
    interview: applications.filter((a) => a.status === 'INTERVIEW').length,
    finalRound: applications.filter((a) => a.status === 'FINAL_ROUND').length,
    offers: applications.filter((a) => a.status === 'OFFER').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  const totalApplied = funnel.applied + funnel.oa + funnel.interview + funnel.finalRound + funnel.offers + funnel.rejected;
  const totalInterviews = funnel.interview + funnel.finalRound + funnel.offers;

  const interviewRate = totalApplied > 0 ? Number(((totalInterviews / totalApplied) * 100).toFixed(1)) : 0;
  const offerRate = totalApplied > 0 ? Number(((funnel.offers / totalApplied) * 100).toFixed(1)) : 0;

  // Group by student department
  const userDeptMap = new Map(studentProfiles.map((sp) => [sp.user.toString(), sp.department || 'Computer Science']));
  const deptAppMap = new Map();

  for (const app of applications) {
    const dept = userDeptMap.get(app.user.toString()) || 'Computer Science';
    if (!deptAppMap.has(dept)) {
      deptAppMap.set(dept, { applications: 0, interviews: 0, offers: 0 });
    }
    const stat = deptAppMap.get(dept);
    stat.applications++;
    if (['INTERVIEW', 'FINAL_ROUND', 'OFFER'].includes(app.status)) stat.interviews++;
    if (app.status === 'OFFER') stat.offers++;
  }

  const departmentBreakdown = Array.from(deptAppMap.entries()).map(([dept, data]) => ({
    department: dept,
    applications: data.applications,
    interviews: data.interviews,
    offers: data.offers,
  }));

  return {
    status: 'ACTIVE',
    totalApplications: applications.length,
    funnel,
    conversionRates: { interviewRate, offerRate },
    departmentBreakdown,
  };
}

/**
 * Campus Hiring Drive Management & Eligibility Engine.
 */
async function getHiringDrives(institutionId) {
  return HiringDrive.find({ institution: institutionId })
    .populate('opportunity', 'title company location stipend')
    .sort({ createdAt: -1 })
    .lean();
}

async function createHiringDrive(institutionId, data) {
  const { title, company, opportunityId, departments, eligibleBatches, minCgpa, minReadinessScore, requiredSkills, deadline } = data;
  if (!title || !company) {
    throw new Error('Drive title and company name are required');
  }

  return HiringDrive.create({
    institution: institutionId,
    title: title.trim(),
    company: company.trim(),
    opportunity: opportunityId && mongoose.Types.ObjectId.isValid(opportunityId) ? opportunityId : null,
    departments: Array.isArray(departments) ? departments : [],
    eligibleBatches: Array.isArray(eligibleBatches) ? eligibleBatches.map(Number) : [2025, 2026],
    minCgpa: Number(minCgpa) || 0,
    minReadinessScore: Number(minReadinessScore) || 50,
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills.map((s) => String(s).trim()) : [],
    deadline: deadline ? new Date(deadline) : null,
    status: 'ACTIVE',
  });
}

/**
 * Eligibility Engine: Evaluates institution students against drive constraints.
 */
async function calculateHiringDriveEligibility(driveId, institutionId) {
  const drive = await HiringDrive.findOne({ _id: driveId, institution: institutionId }).lean();
  if (!drive) {
    throw new Error('Hiring drive not found');
  }

  const studentProfiles = await StudentProfile.find({ institution: institutionId })
    .populate('user', 'name email registrationNumber avatar')
    .lean();

  const studentUserIds = studentProfiles.map((p) => p.user?._id).filter(Boolean);

  const [skillProfiles, snapshots] = await Promise.all([
    SkillProfile.find({ user: { $in: studentUserIds } }).lean(),
    CommandCenterSnapshot.aggregate([
      { $match: { user: { $in: studentUserIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          readinessScore: { $first: '$readinessScore' },
        },
      },
    ]),
  ]);

  const skillMap = new Map(skillProfiles.map((s) => [s.user.toString(), new Set((s.skills || []).map((sk) => sk.name.toLowerCase().trim()))]));
  const snapshotMap = new Map(snapshots.map((s) => [s._id.toString(), s.readinessScore || 0]));

  const candidateResults = studentProfiles
    .filter((sp) => sp.user)
    .map((sp) => {
      const uId = sp.user._id.toString();
      const studentSkills = skillMap.get(uId) || new Set();
      const readiness = snapshotMap.get(uId) || 50;

      const reasons = [];

      // 1. Department match
      let deptPass = true;
      if (drive.departments && drive.departments.length > 0) {
        deptPass = drive.departments.some((d) => d.toLowerCase() === (sp.department || '').toLowerCase());
        if (!deptPass) reasons.push(`Department (${sp.department}) is not eligible.`);
      }

      // 2. Batch match
      let batchPass = true;
      if (drive.eligibleBatches && drive.eligibleBatches.length > 0) {
        batchPass = drive.eligibleBatches.includes(sp.graduationYear);
        if (!batchPass) reasons.push(`Batch (${sp.graduationYear}) is not eligible.`);
      }

      // 3. CGPA threshold
      let cgpaPass = true;
      if (drive.minCgpa > 0) {
        cgpaPass = (sp.cgpa || 0) >= drive.minCgpa;
        if (!cgpaPass) reasons.push(`CGPA (${sp.cgpa || 0}) below minimum requirement (${drive.minCgpa}).`);
      }

      // 4. Readiness threshold
      let readinessPass = true;
      if (drive.minReadinessScore > 0) {
        readinessPass = readiness >= drive.minReadinessScore;
        if (!readinessPass) reasons.push(`Readiness Score (${readiness}) below threshold (${drive.minReadinessScore}).`);
      }

      // 5. Skills match
      let skillsPass = true;
      if (drive.requiredSkills && drive.requiredSkills.length > 0) {
        const missingSkills = drive.requiredSkills.filter((rs) => !studentSkills.has(rs.toLowerCase().trim()));
        if (missingSkills.length > 0) {
          skillsPass = false;
          reasons.push(`Missing required skills: ${missingSkills.join(', ')}.`);
        }
      }

      const isEligible = deptPass && batchPass && cgpaPass && readinessPass && skillsPass;

      return {
        student: sp.user,
        department: sp.department,
        batch: sp.graduationYear,
        cgpa: sp.cgpa,
        readinessScore: readiness,
        isEligible,
        criteriaMatch: {
          department: deptPass,
          batch: batchPass,
          cgpa: cgpaPass,
          readiness: readinessPass,
          skills: skillsPass,
        },
        reasons,
      };
    });

  const eligibleCount = candidateResults.filter((c) => c.isEligible).length;

  return {
    drive: {
      _id: drive._id,
      title: drive.title,
      company: drive.company,
      departments: drive.departments,
      minCgpa: drive.minCgpa,
      minReadinessScore: drive.minReadinessScore,
      requiredSkills: drive.requiredSkills,
    },
    totalCandidates: candidateResults.length,
    eligibleCount,
    candidates: candidateResults,
  };
}

module.exports = {
  resolveAdminInstitution,
  getDashboardOverview,
  getStudentCohort,
  getDepartmentAnalytics,
  getSkillGapIntelligence,
  getIndustryDemandIntelligence,
  getFacultyWorkload,
  assignOrReassignStudent,
  unassignStudent,
  getPlacementIntelligence,
  getHiringDrives,
  createHiringDrive,
  calculateHiringDriveEligibility,
};
