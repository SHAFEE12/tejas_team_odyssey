/**
 * academician.service.js
 *
 * Core service layer for Academician Mentoring, Assessment & Evaluation.
 * Handles dashboard metrics, student directory search within institution bounds,
 * student assignment/unassignment synchronization, and 360-degree Career Intelligence.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const AcademicianProfile = require('../models/AcademicianProfile');
const StudentProfile = require('../models/StudentProfile');
const SkillProfile = require('../models/SkillProfile');
const Project = require('../models/Project');
const DSAProfile = require('../models/DSAProfile');
const GitHubProfile = require('../models/GitHubProfile');
const Resume = require('../models/Resume');
const Roadmap = require('../models/Roadmap');
const Application = require('../models/Application');
const Assessment = require('../models/Assessment');
const Evaluation = require('../models/Evaluation');
const MentoringAction = require('../models/MentoringAction');
const Institution = require('../models/Institution');
const CommandCenterSnapshot = require('../models/CommandCenterSnapshot');

/**
 * Ensure AcademicianProfile exists for the given user, creating a default if missing.
 */
async function getOrCreateAcademicianProfile(user) {
  let profile = await AcademicianProfile.findOne({ user: user._id }).populate('institution');
  if (!profile) {
    let instId = user.institution || null;
    profile = await AcademicianProfile.create({
      user: user._id,
      institution: instId,
      department: 'Computer Science',
      designation: 'Faculty Mentor',
      assignedStudents: [],
    });
  }
  return profile;
}

/**
 * Fetch academician dashboard metrics.
 */
async function getAcademicianDashboardData(academicianUserId, institutionId) {
  const academicianProfile = await AcademicianProfile.findOne({ user: academicianUserId }).lean();
  const assignedStudentIds = academicianProfile?.assignedStudents || [];

  const [
    students,
    assessmentsCount,
    evaluationsCount,
    mentoringActionsCount,
  ] = await Promise.all([
    StudentProfile.find({ user: { $in: assignedStudentIds } }).lean(),
    Assessment.countDocuments({ institution: institutionId }),
    Evaluation.countDocuments({ evaluator: academicianUserId }),
    MentoringAction.countDocuments({ academician: academicianUserId }),
  ]);

  // Compute readiness stats across assigned cohort
  const scores = await CommandCenterSnapshot.find({ user: { $in: assignedStudentIds } })
    .sort({ createdAt: -1 })
    .lean();

  const userLatestScoreMap = new Map();
  for (const s of scores) {
    const uStr = s.user.toString();
    if (!userLatestScoreMap.has(uStr)) {
      userLatestScoreMap.set(uStr, s.careerReadinessScore || 0);
    }
  }

  let totalReadiness = 0;
  let placementReadyCount = 0;
  let needsAttentionCount = 0;

  for (const sId of assignedStudentIds) {
    const score = userLatestScoreMap.get(sId.toString()) || 0;
    totalReadiness += score;
    if (score >= 60) placementReadyCount++;
    if (score < 40) needsAttentionCount++;
  }

  const avgReadiness = assignedStudentIds.length > 0 ? Math.round(totalReadiness / assignedStudentIds.length) : 0;

  return {
    metrics: {
      assignedStudentsCount: assignedStudentIds.length,
      averageReadiness: avgReadiness,
      placementReadyCount,
      needsAttentionCount,
      assessmentsCount,
      evaluationsCount,
      mentoringActionsCount,
    },
    studentsCount: assignedStudentIds.length,
  };
}

/**
 * Get assigned students with comprehensive telemetry and readiness.
 */
async function getAssignedStudents(academicianUserId) {
  const academicianProfile = await AcademicianProfile.findOne({ user: academicianUserId }).lean();
  if (!academicianProfile || !academicianProfile.assignedStudents?.length) {
    return [];
  }

  const assignedUserIds = academicianProfile.assignedStudents;

  const [
    users,
    studentProfiles,
    skillProfiles,
    snapshots,
  ] = await Promise.all([
    User.find({ _id: { $in: assignedUserIds } }).select('name email avatar registrationNumber collegeName').lean(),
    StudentProfile.find({ user: { $in: assignedUserIds } }).populate('institution', 'name code').lean(),
    SkillProfile.find({ user: { $in: assignedUserIds } }).lean(),
    CommandCenterSnapshot.find({ user: { $in: assignedUserIds } }).sort({ createdAt: -1 }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const spMap = new Map(studentProfiles.map((sp) => [sp.user?.toString() || sp.user, sp]));
  const skillMap = new Map(skillProfiles.map((sk) => [sk.user?.toString() || sk.user, sk]));

  const latestScoreMap = new Map();
  for (const s of snapshots) {
    const uStr = s.user.toString();
    if (!latestScoreMap.has(uStr)) {
      latestScoreMap.set(uStr, s.careerReadinessScore || 0);
    }
  }

  return assignedUserIds.map((uId) => {
    const idStr = uId.toString();
    const u = userMap.get(idStr) || {};
    const sp = spMap.get(idStr) || {};
    const sk = skillMap.get(idStr) || {};
    const readiness = latestScoreMap.get(idStr) || 0;

    return {
      _id: uId,
      name: u.name || 'Student Candidate',
      email: u.email || '',
      avatar: u.avatar || '',
      registrationNumber: u.registrationNumber || sp.rollNumber || '',
      collegeName: u.collegeName || sp.institution?.name || '',
      department: sp.department || 'Computer Science',
      degree: sp.degree || 'B.Tech',
      graduationYear: sp.graduationYear || 2026,
      cgpa: sp.cgpa || 0,
      targetRole: sk.targetRole || 'Not configured',
      careerReadinessScore: readiness,
      assignedMentor: sp.assignedMentor,
    };
  });
}

/**
 * Search students within the academician's institution for assignment.
 * Strictly enforces institution boundaries.
 */
async function searchInstitutionStudents(institutionId, academicianUserId, query = {}) {
  if (!institutionId) {
    return [];
  }

  // Find all student profiles belonging to this institution
  const studentProfiles = await StudentProfile.find({ institution: institutionId })
    .populate('user', 'name email avatar registrationNumber collegeName')
    .lean();

  const academicianProfile = await AcademicianProfile.findOne({ user: academicianUserId }).lean();
  const assignedSet = new Set((academicianProfile?.assignedStudents || []).map((id) => id.toString()));

  const studentUserIds = studentProfiles.map((sp) => sp.user?._id).filter(Boolean);
  const skillProfiles = await SkillProfile.find({ user: { $in: studentUserIds } }).lean();
  const skillMap = new Map(skillProfiles.map((s) => [s.user.toString(), s]));

  let results = studentProfiles
    .filter((sp) => sp.user) // Ensure valid user record
    .map((sp) => {
      const uId = sp.user._id.toString();
      const skills = skillMap.get(uId);
      const isAssignedToMe = assignedSet.has(uId);

      return {
        _id: sp.user._id,
        name: sp.user.name,
        email: sp.user.email,
        avatar: sp.user.avatar,
        registrationNumber: sp.user.registrationNumber || sp.rollNumber || '',
        department: sp.department || 'Computer Science',
        degree: sp.degree || 'B.Tech',
        graduationYear: sp.graduationYear || 2026,
        cgpa: sp.cgpa || 0,
        targetRole: skills?.targetRole || 'Not configured',
        isAssignedToMe,
        currentMentor: sp.assignedMentor,
      };
    });

  if (query.search) {
    const q = query.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
    );
  }

  if (query.department) {
    results = results.filter((r) => r.department.toLowerCase() === query.department.toLowerCase());
  }

  return results;
}

/**
 * Assign an authorized student to the academician.
 * Enforces institution boundary and synchronizes AcademicianProfile & StudentProfile.
 */
async function assignStudent(academicianUserId, studentUserId, institutionId) {
  // Verify student exists and has role 'student'
  const studentUser = await User.findById(studentUserId);
  if (!studentUser || studentUser.role !== 'student') {
    throw new Error('Target user is not a valid student');
  }

  // Verify student belongs to this institution
  const studentProfile = await StudentProfile.findOne({ user: studentUserId });
  if (institutionId) {
    if (studentProfile && studentProfile.institution && studentProfile.institution.toString() !== institutionId.toString()) {
      throw new Error('Forbidden: Student belongs to another educational institution');
    }
  }

  // If student was previously assigned to a different mentor, pull from previous mentor's assignedStudents
  if (studentProfile?.assignedMentor && studentProfile.assignedMentor.toString() !== academicianUserId.toString()) {
    await AcademicianProfile.findOneAndUpdate(
      { user: studentProfile.assignedMentor },
      { $pull: { assignedStudents: studentUserId } }
    );
  }

  // Update academician's assignedStudents
  const academicianProfile = await AcademicianProfile.findOneAndUpdate(
    { user: academicianUserId },
    { $addToSet: { assignedStudents: studentUserId } },
    { upsert: true, new: true }
  );

  // Update student's assignedMentor and ensure institution link
  await StudentProfile.findOneAndUpdate(
    { user: studentUserId },
    {
      $set: {
        assignedMentor: academicianUserId,
        ...(institutionId && { institution: institutionId }),
      },
    },
    { upsert: true, new: true }
  );

  // Fetch academician User and Institution for sanitized canonical response
  const academicianUser = await User.findById(academicianUserId).select('name email collegeName').lean();
  const inst = institutionId ? await Institution.findById(institutionId).select('name').lean() : null;

  return {
    success: true,
    message: 'Student successfully assigned to academician',
    student: {
      id: studentUser._id,
      name: studentUser.name,
      email: studentUser.email,
      assignedMentor: {
        id: academicianUser?._id || academicianUserId,
        name: academicianUser?.name || 'Academic Mentor',
        email: academicianUser?.email || '',
        department: academicianProfile?.department || 'Computer Science & Engineering',
        designation: academicianProfile?.designation || 'Faculty Mentor',
        institution: inst?.name || studentUser.collegeName || academicianUser?.collegeName || 'Educational Institution',
        status: 'Assigned',
      },
    },
  };
}

/**
 * Unassign a student from the academician.
 */
async function unassignStudent(academicianUserId, studentUserId) {
  await AcademicianProfile.findOneAndUpdate(
    { user: academicianUserId },
    { $pull: { assignedStudents: studentUserId } }
  );

  await StudentProfile.findOneAndUpdate(
    { user: studentUserId, assignedMentor: academicianUserId },
    { $set: { assignedMentor: null } }
  );

  return {
    success: true,
    message: 'Student unassigned successfully',
    student: {
      id: studentUserId,
      assignedMentor: null,
    },
  };
}

/**
 * Fetch 360-degree Career Intelligence view for a student.
 */
async function getStudent360Intelligence(studentUserId, academicianUserId) {
  const studentUser = await User.findById(studentUserId).select('-password').lean();
  if (!studentUser) {
    throw new Error('Student not found');
  }

  const [
    studentProfile,
    skillProfile,
    dsaProfile,
    projects,
    githubProfile,
    resumes,
    roadmap,
    applications,
    evaluations,
    mentoringActions,
    latestSnapshot,
  ] = await Promise.all([
    StudentProfile.findOne({ user: studentUserId }).populate('institution', 'name code').populate('assignedMentor', 'name email').lean(),
    SkillProfile.findOne({ user: studentUserId }).lean(),
    DSAProfile.findOne({ user: studentUserId }).lean(),
    Project.find({ user: studentUserId }).sort({ createdAt: -1 }).lean(),
    GitHubProfile.findOne({ user: studentUserId }).lean(),
    Resume.find({ user: studentUserId }).sort({ createdAt: -1 }).limit(1).lean(),
    Roadmap.findOne({ user: studentUserId }).lean(),
    Application.find({ user: studentUserId }).populate('opportunity', 'title company location type').select('-recruiterNotes').sort({ createdAt: -1 }).lean(),
    Evaluation.find({ student: studentUserId }).sort({ createdAt: -1 }).populate('academician', 'name email').lean(),
    MentoringAction.find({ student: studentUserId }).sort({ createdAt: -1 }).populate('academician', 'name email').lean(),
    CommandCenterSnapshot.findOne({ user: studentUserId }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    student: studentUser,
    studentProfile: studentProfile || {
      department: 'Computer Science',
      degree: 'B.Tech',
      graduationYear: 2026,
      cgpa: 0,
      rollNumber: '',
    },
    skillProfile: skillProfile || { skills: [], targetRole: 'Not configured', targetIndustry: '' },
    dsaProfile: dsaProfile || { totalSolved: 0, easy: 0, medium: 0, hard: 0, platforms: [] },
    projects: projects || [],
    githubProfile: githubProfile || null,
    resume: resumes?.[0] || null,
    roadmap: roadmap || null,
    applications: applications || [],
    evaluations: evaluations || [],
    mentoringActions: mentoringActions || [],
    readinessScore: latestSnapshot?.readinessScore || 45,
  };
}

module.exports = {
  getOrCreateAcademicianProfile,
  getAcademicianDashboardData,
  getAcademicianDashboardMetrics: getAcademicianDashboardData,
  getAssignedStudents,
  searchInstitutionStudents,
  assignStudent,
  unassignStudent,
  getStudent360Intelligence,
};
