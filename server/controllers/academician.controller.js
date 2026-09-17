/**
 * academician.controller.js
 *
 * REST Controller for Academician Portal APIs.
 * Handles dashboard metrics, student directory, student assignment,
 * cross-discipline assessments, rubric evaluations, mentoring notes,
 * and deterministic recommendations.
 */

const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Evaluation = require('../models/Evaluation');
const MentoringAction = require('../models/MentoringAction');
const AcademicianProfile = require('../models/AcademicianProfile');
const Institution = require('../models/Institution');
const academicianService = require('../services/academician.service');
const recommendationService = require('../services/recommendation.service');

/**
 * Helper to resolve the authenticated academician's institution ID.
 */
async function resolveAcademicianInstitution(user) {
  if (user.institution) {
    return user.institution;
  }
  const profile = await AcademicianProfile.findOne({ user: user._id }).lean();
  if (profile?.institution) {
    return profile.institution;
  }
  // Fallback: check if there is an active institution or create/link to default institution
  let inst = await Institution.findOne();
  if (!inst) {
    inst = await Institution.create({
      name: user.collegeName || 'National Engineering Academy',
      code: 'NEA-01',
      departments: ['Computer Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil'],
    });
  }
  // Cache onto profile
  await AcademicianProfile.findOneAndUpdate(
    { user: user._id },
    { $set: { institution: inst._id } },
    { upsert: true }
  );
  return inst._id;
}

/**
 * GET /api/academician/dashboard
 */
const getDashboardOverview = async (req, res) => {
  try {
    const institutionId = await resolveAcademicianInstitution(req.user);
    const metrics = await academicianService.getAcademicianDashboardMetrics(req.user._id, institutionId);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard overview' });
  }
};

/**
 * GET /api/academician/students
 */
const getAssignedStudents = async (req, res) => {
  try {
    const students = await academicianService.getAssignedStudents(req.user._id, {
      department: req.query.department,
      search: req.query.search,
    });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('getAssignedStudents error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch assigned students' });
  }
};

/**
 * GET /api/academician/students/search
 * Search students within the academician's institution to assign
 */
const searchInstitutionStudents = async (req, res) => {
  try {
    const institutionId = await resolveAcademicianInstitution(req.user);
    const students = await academicianService.searchInstitutionStudents(institutionId, req.user._id, {
      search: req.query.search,
      department: req.query.department,
    });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error('searchInstitutionStudents error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to search institution students' });
  }
};

/**
 * GET /api/academician/students/:studentId
 * 360-degree Career Intelligence view
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
      message: error.message || 'Failed to fetch student career intelligence',
    });
  }
};

/**
 * POST /api/academician/students/:studentId/assign
 */
const assignStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const institutionId = await resolveAcademicianInstitution(req.user);
    const result = await academicianService.assignStudent(req.user._id, studentId, institutionId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('assignStudent error:', error.message);
    const isForbidden = error.message.includes('Forbidden') || error.message.includes('another');
    return res.status(isForbidden ? 403 : 400).json({
      success: false,
      message: error.message || 'Failed to assign student',
    });
  }
};

/**
 * DELETE /api/academician/students/:studentId/assign
 */
const unassignStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const result = await academicianService.unassignStudent(req.user._id, studentId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('unassignStudent error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to unassign student' });
  }
};

/**
 * GET /api/academician/assessments
 */
const getAssessments = async (req, res) => {
  try {
    const institutionId = await resolveAcademicianInstitution(req.user);
    const query = {
      institution: institutionId,
      status: { $ne: 'archived' },
    };

    if (req.query.category) query.category = req.query.category;
    if (req.query.department) query.department = req.query.department;
    if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      query.student = req.query.studentId;
    }

    const assessments = await Assessment.find(query)
      .populate('academician', 'name email')
      .populate('student', 'name email registrationNumber')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    console.error('getAssessments error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch assessments' });
  }
};

/**
 * POST /api/academician/assessments
 */
const createAssessment = async (req, res) => {
  try {
    const { title, description, category, department, skills, maxScore, dueDate, studentId } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required' });
    }

    const institutionId = await resolveAcademicianInstitution(req.user);

    const assessment = await Assessment.create({
      institution: institutionId,
      academician: req.user._id,
      student: studentId && mongoose.Types.ObjectId.isValid(studentId) ? studentId : null,
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category || 'Technical',
      department: department ? department.trim() : 'General',
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()) : [],
      maxScore: maxScore ? Number(maxScore) : 100,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'published',
    });

    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('createAssessment error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create assessment' });
  }
};

/**
 * GET /api/academician/assessments/:id
 */
const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID format' });
    }

    const assessment = await Assessment.findById(id)
      .populate('academician', 'name email')
      .populate('student', 'name email registrationNumber')
      .lean();

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    return res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    console.error('getAssessmentById error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch assessment' });
  }
};

/**
 * PATCH /api/academician/assessments/:id
 */
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID format' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Only author or super_admin can update
    if (assessment.academician.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify another academician’s assessment' });
    }

    const { title, description, category, department, skills, maxScore, dueDate, status } = req.body;

    if (title) assessment.title = title.trim();
    if (description !== undefined) assessment.description = description.trim();
    if (category) assessment.category = category;
    if (department) assessment.department = department.trim();
    if (Array.isArray(skills)) assessment.skills = skills.map((s) => String(s).trim());
    if (maxScore !== undefined) assessment.maxScore = Number(maxScore);
    if (dueDate !== undefined) assessment.dueDate = dueDate ? new Date(dueDate) : null;
    if (status) assessment.status = status;

    await assessment.save();

    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment,
    });
  } catch (error) {
    console.error('updateAssessment error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update assessment' });
  }
};

/**
 * DELETE /api/academician/assessments/:id
 */
const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment ID format' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    if (assessment.academician.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot delete another academician’s assessment' });
    }

    assessment.status = 'archived';
    await assessment.save();

    return res.status(200).json({ success: true, message: 'Assessment archived successfully' });
  } catch (error) {
    console.error('deleteAssessment error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete assessment' });
  }
};

/**
 * POST /api/academician/evaluations
 * Create a scored student evaluation
 */
const createEvaluation = async (req, res) => {
  try {
    const {
      studentId,
      assessmentId,
      overallScore,
      maxScore = 100,
      skillEvaluations = [],
      strengths = [],
      weaknesses = [],
      feedback,
      recommendation,
      evaluatorNotes,
    } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required' });
    }

    const institutionId = await resolveAcademicianInstitution(req.user);

    const safeOverallScore = Number(overallScore) || 0;
    const safeMaxScore = Number(maxScore) || 100;
    const percentage = safeMaxScore > 0 ? Math.round((safeOverallScore / safeMaxScore) * 100) : 0;

    const evaluation = await Evaluation.create({
      student: studentId,
      academician: req.user._id,
      institution: institutionId,
      assessment: assessmentId && mongoose.Types.ObjectId.isValid(assessmentId) ? assessmentId : null,
      scores: {
        overallScore: safeOverallScore,
        maxScore: safeMaxScore,
        percentage,
      },
      skillEvaluations: Array.isArray(skillEvaluations) ? skillEvaluations : [],
      strengths: Array.isArray(strengths) ? strengths : [],
      weaknesses: Array.isArray(weaknesses) ? weaknesses : [],
      feedback: feedback ? feedback.trim() : '',
      recommendation: recommendation ? recommendation.trim() : '',
      evaluatorNotes: evaluatorNotes ? evaluatorNotes.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Evaluation recorded successfully',
      data: evaluation,
    });
  } catch (error) {
    console.error('createEvaluation error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create evaluation' });
  }
};

/**
 * GET /api/academician/evaluations
 */
const getEvaluations = async (req, res) => {
  try {
    const query = { academician: req.user._id };
    if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      query.student = req.query.studentId;
    }

    const evaluations = await Evaluation.find(query)
      .populate('student', 'name email registrationNumber avatar')
      .populate('assessment', 'title category department')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error('getEvaluations error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch evaluations' });
  }
};

/**
 * GET /api/academician/students/:studentId/evaluations
 */
const getStudentEvaluations = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID format' });
    }

    const evaluations = await Evaluation.find({ student: studentId })
      .populate('academician', 'name email')
      .populate('assessment', 'title category')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error('getStudentEvaluations error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch student evaluations' });
  }
};

/**
 * GET /api/academician/mentoring
 */
const getMentoringActions = async (req, res) => {
  try {
    const query = { academician: req.user._id };
    if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      query.student = req.query.studentId;
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const actions = await MentoringAction.find(query)
      .populate('student', 'name email registrationNumber avatar')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: actions,
    });
  } catch (error) {
    console.error('getMentoringActions error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch mentoring actions' });
  }
};

/**
 * POST /api/academician/mentoring
 */
const createMentoringAction = async (req, res) => {
  try {
    const {
      studentId,
      note,
      recommendation,
      why,
      evidence,
      suggestedAction,
      priority = 'MEDIUM',
      followUpDate,
      linkedSkill,
      linkedRoadmapMilestone,
      linkedProject,
      linkedAssessment,
    } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Valid student ID is required' });
    }
    if (!recommendation || !String(recommendation).trim()) {
      return res.status(400).json({ success: false, message: 'Mentoring recommendation is required' });
    }

    const institutionId = await resolveAcademicianInstitution(req.user);

    const action = await MentoringAction.create({
      student: studentId,
      academician: req.user._id,
      institution: institutionId,
      note: note ? note.trim() : '',
      recommendation: recommendation.trim(),
      why: why ? why.trim() : '',
      evidence: evidence ? evidence.trim() : '',
      suggestedAction: suggestedAction ? suggestedAction.trim() : '',
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM',
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: 'ACTIVE',
      linkedSkill: linkedSkill || '',
      linkedRoadmapMilestone: linkedRoadmapMilestone || '',
      linkedProject: linkedProject && mongoose.Types.ObjectId.isValid(linkedProject) ? linkedProject : null,
      linkedAssessment: linkedAssessment && mongoose.Types.ObjectId.isValid(linkedAssessment) ? linkedAssessment : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Mentoring recommendation created successfully',
      data: action,
    });
  } catch (error) {
    console.error('createMentoringAction error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create mentoring recommendation' });
  }
};

/**
 * PATCH /api/academician/mentoring/:id
 */
const updateMentoringAction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid mentoring action ID' });
    }

    const action = await MentoringAction.findById(id);
    if (!action) {
      return res.status(404).json({ success: false, message: 'Mentoring action not found' });
    }

    if (action.academician.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit another mentor’s action' });
    }

    const { status, note, priority, followUpDate } = req.body;
    if (status) {
      action.status = status;
      if (status === 'COMPLETED') action.completedAt = new Date();
    }
    if (note !== undefined) action.note = note.trim();
    if (priority) action.priority = priority;
    if (followUpDate !== undefined) action.followUpDate = followUpDate ? new Date(followUpDate) : null;

    await action.save();

    return res.status(200).json({
      success: true,
      message: 'Mentoring action updated',
      data: action,
    });
  } catch (error) {
    console.error('updateMentoringAction error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update mentoring action' });
  }
};

/**
 * GET /api/academician/recommendations/:studentId
 * Run deterministic mentor recommendation engine for student
 */
const getRecommendationsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const recommendations = await recommendationService.getStudentRecommendations(studentId);

    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('getRecommendationsForStudent error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

/**
 * POST /api/academician/recommendations/:id/complete
 */
const completeRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid recommendation ID' });
    }

    const action = await MentoringAction.findById(id);
    if (!action) {
      return res.status(404).json({ success: false, message: 'Mentoring recommendation not found' });
    }

    action.status = 'COMPLETED';
    action.completedAt = new Date();
    await action.save();

    return res.status(200).json({
      success: true,
      message: 'Recommendation marked as completed',
      data: action,
    });
  } catch (error) {
    console.error('completeRecommendation error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to complete recommendation' });
  }
};

module.exports = {
  getDashboardOverview,
  getAssignedStudents,
  searchInstitutionStudents,
  getStudentDetail,
  assignStudent,
  unassignStudent,
  getAssessments,
  createAssessment,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
  createEvaluation,
  getEvaluations,
  getStudentEvaluations,
  getMentoringActions,
  createMentoringAction,
  updateMentoringAction,
  getRecommendationsForStudent,
  completeRecommendation,
};
