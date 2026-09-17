/**
 * institution.controller.js
 *
 * REST Controller for Institution Administration & Placement Intelligence APIs.
 * Enforces institution boundary checks on all endpoints.
 */

const mongoose = require('mongoose');
const institutionService = require('../services/institution.service');
const academicianService = require('../services/academician.service');

/**
 * GET /api/institution/dashboard
 */
const getDashboardOverview = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const overview = await institutionService.getDashboardOverview(institution._id);

    return res.status(200).json({
      success: true,
      data: {
        institution: {
          id: institution._id,
          name: institution.name,
          code: institution.code,
          domain: institution.domain,
          departments: institution.departments,
        },
        metrics: overview,
      },
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load institution dashboard' });
  }
};

/**
 * GET /api/institution/students
 */
const getStudentCohort = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const students = await institutionService.getStudentCohort(institution._id, {
      search: req.query.search,
      department: req.query.department,
      batch: req.query.batch,
      careerGoal: req.query.careerGoal,
      readiness: req.query.readiness,
      placementStatus: req.query.placementStatus,
    });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('getStudentCohort error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch student cohort' });
  }
};

/**
 * GET /api/institution/students/:studentId
 */
const getStudentDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const data = await academicianService.getStudent360Intelligence(studentId, req.user._id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getStudentDetail error:', error.message);
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch student details',
    });
  }
};

/**
 * GET /api/institution/academicians
 */
const getAcademicians = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const workload = await institutionService.getFacultyWorkload(institution._id);

    return res.status(200).json({
      success: true,
      data: workload,
    });
  } catch (error) {
    console.error('getAcademicians error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch faculty workload' });
  }
};

/**
 * POST /api/institution/academicians/:id/assign-student
 */
const assignStudentToAcademician = async (req, res) => {
  try {
    const academicianId = req.params.id;
    const { studentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(academicianId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid academician or student ID' });
    }

    const institution = await institutionService.resolveAdminInstitution(req.user);
    const result = await institutionService.assignOrReassignStudent(institution._id, academicianId, studentId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('assignStudentToAcademician error:', error.message);
    const isForbidden = error.message.includes('Forbidden');
    return res.status(isForbidden ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to assign student to academician',
    });
  }
};

/**
 * DELETE /api/institution/academicians/:id/students/:studentId
 */
const unassignStudentFromAcademician = async (req, res) => {
  try {
    const { id: academicianId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(academicianId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid academician or student ID' });
    }

    const institution = await institutionService.resolveAdminInstitution(req.user);
    const result = await institutionService.unassignStudent(institution._id, academicianId, studentId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('unassignStudentFromAcademician error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to unassign student' });
  }
};

/**
 * GET /api/institution/departments
 */
const getDepartments = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const analytics = await institutionService.getDepartmentAnalytics(institution._id);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('getDepartments error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch department analytics' });
  }
};

/**
 * GET /api/institution/skill-gaps
 */
const getSkillGaps = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const data = await institutionService.getSkillGapIntelligence(institution._id, {
      department: req.query.department,
      batch: req.query.batch,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getSkillGaps error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch skill gap intelligence' });
  }
};

/**
 * GET /api/institution/industry-demand
 * Student supply vs industry demand comparison
 */
const getIndustryDemand = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const demand = await institutionService.getIndustryDemandIntelligence(institution._id);

    return res.status(200).json({
      success: true,
      data: demand,
    });
  } catch (error) {
    console.error('getIndustryDemand error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch industry demand intelligence' });
  }
};

/**
 * GET /api/institution/skill-intelligence
 */
const getSkillIntelligence = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const [gapIntel, demandIntel] = await Promise.all([
      institutionService.getSkillGapIntelligence(institution._id),
      institutionService.getIndustryDemandIntelligence(institution._id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        skillGaps: gapIntel,
        demandVersusSupply: demandIntel,
      },
    });
  } catch (error) {
    console.error('getSkillIntelligence error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch skill intelligence' });
  }
};

/**
 * GET /api/institution/placements
 */
const getPlacements = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const placements = await institutionService.getPlacementIntelligence(institution._id);

    return res.status(200).json({
      success: true,
      data: placements,
    });
  } catch (error) {
    console.error('getPlacements error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch placement intelligence' });
  }
};

/**
 * GET /api/institution/hiring-drives
 */
const getHiringDrives = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const drives = await institutionService.getHiringDrives(institution._id);

    return res.status(200).json({
      success: true,
      data: drives,
    });
  } catch (error) {
    console.error('getHiringDrives error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch hiring drives' });
  }
};

/**
 * POST /api/institution/hiring-drives
 */
const createHiringDrive = async (req, res) => {
  try {
    const institution = await institutionService.resolveAdminInstitution(req.user);
    const drive = await institutionService.createHiringDrive(institution._id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Hiring drive created successfully',
      data: drive,
    });
  } catch (error) {
    console.error('createHiringDrive error:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create hiring drive' });
  }
};

/**
 * GET /api/institution/hiring-drives/:id/eligible-students
 */
const getHiringDriveEligibleStudents = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hiring drive ID' });
    }

    const institution = await institutionService.resolveAdminInstitution(req.user);
    const evaluation = await institutionService.calculateHiringDriveEligibility(id, institution._id);

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error('getHiringDriveEligibleStudents error:', error.message);
    return res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to calculate hiring drive eligibility',
    });
  }
};

module.exports = {
  getDashboardOverview,
  getStudentCohort,
  getStudentDetail,
  getAcademicians,
  assignStudentToAcademician,
  unassignStudentFromAcademician,
  getDepartments,
  getSkillGaps,
  getIndustryDemand,
  getSkillIntelligence,
  getPlacements,
  getHiringDrives,
  createHiringDrive,
  getHiringDriveEligibleStudents,
};
